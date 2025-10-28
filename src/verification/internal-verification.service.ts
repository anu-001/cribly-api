import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    RekognitionClient,
    CompareFacesCommand,
    DetectFacesCommand,
    DetectLabelsCommand,
    DetectTextCommand,
} from '@aws-sdk/client-rekognition';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class InternalVerificationService {
    private readonly logger = new Logger(InternalVerificationService.name);
    private readonly rekognition: RekognitionClient;
    private readonly s3: S3Client;
    private readonly region: string;

    constructor(private readonly config: ConfigService) {
        const region = this.config.get<string>('AWS_REGION');
        const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');

        if (!region || !accessKeyId || !secretAccessKey) {
            throw new Error('AWS credentials/region not configured');
        }
        this.region = region;
        this.rekognition = new RekognitionClient({
            region: this.region,
            credentials: { accessKeyId, secretAccessKey },
        });
        this.s3 = new S3Client({
            region: this.region,
            credentials: { accessKeyId, secretAccessKey },
        });
    }

    private async downloadS3ObjectBytes(url: string): Promise<Uint8Array> {
        try {
            // Expecting S3 URL form: https://<bucket>.s3.<region>.amazonaws.com/<key>
            const match = url.match(/^https?:\/\/([^\.]+)\.s3\.[^\/]+\.amazonaws\.com\/(.+)$/);
            if (!match) {
                throw new BadRequestException('Image URL must be an S3 object URL');
            }
            const bucket = match[1];
            const key = decodeURIComponent(match[2]);
            const obj = await this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            const stream = obj.Body as Readable;
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return new Uint8Array(Buffer.concat(chunks));
        } catch (e) {
            this.logger.error(`S3 download failed: ${e.message}`);
            throw new BadRequestException('Failed to download images for verification');
        }
    }

    async verify(
        idImageUrl: string,
        selfieImageUrl: string,
    ): Promise<{ verified: boolean; code?: string; message?: string; details?: any }> {
        // Download images
        const [idBytes, selfieBytes] = await Promise.all([
            this.downloadS3ObjectBytes(idImageUrl),
            this.downloadS3ObjectBytes(selfieImageUrl),
        ]);

        // Compare faces
        const compare = await this.rekognition.send(
            new CompareFacesCommand({
                SourceImage: { Bytes: idBytes },
                TargetImage: { Bytes: selfieBytes },
                SimilarityThreshold: 70, // slightly relaxed to reduce false negatives
            }),
        );

        const matched = (compare.FaceMatches && compare.FaceMatches.length > 0) || false;
        const similarity = matched ? compare.FaceMatches![0].Similarity ?? 0 : 0;

        // Face presence and liveness heuristics
        const detectSelfie = await this.rekognition.send(
            new DetectFacesCommand({ Image: { Bytes: selfieBytes }, Attributes: ['ALL'] }),
        );
        const selfieFaceCount = detectSelfie.FaceDetails?.length ?? 0;
        const selfieHasFace = selfieFaceCount > 0;
        const selfieMultipleFaces = selfieFaceCount > 1;
        const selfieQuality = selfieHasFace
            ? ((detectSelfie.FaceDetails![0].Quality?.Brightness ?? 0) * 0.3 + (detectSelfie.FaceDetails![0].Quality?.Sharpness ?? 0) * 0.7)
            : 0;
        const isLive = selfieHasFace && !selfieMultipleFaces && selfieQuality > 50;

        // Detect face on ID image too for clear errors
        const detectId = await this.rekognition.send(
            new DetectFacesCommand({ Image: { Bytes: idBytes }, Attributes: ['DEFAULT'] }),
        );
        const idHasFace = (detectId.FaceDetails?.length ?? 0) > 0;

        // Document-ness signal
        const labels = await this.rekognition.send(
            new DetectLabelsCommand({ Image: { Bytes: idBytes }, MaxLabels: 10, MinConfidence: 70 }),
        );
        const names = (labels.Labels ?? []).map((l) => l.Name ?? '');
        // Additional text-based signal
        const text = await this.rekognition.send(
            new DetectTextCommand({ Image: { Bytes: idBytes } }),
        );
        const textDetections = (text.TextDetections ?? []).filter((t) => (t.Confidence ?? 0) >= 70);
        const textSignal = textDetections.length >= 5; // at least a few lines/words of text

        const isDocument = ['Text', 'Document', 'Paper', 'Card', 'Id Cards', 'License']
            .some((n) => names.includes(n)) || textSignal;

        const verified = matched && similarity >= 70 && isLive && isDocument;

        const details = {
            faceMatch: { matched, similarity },
            liveness: { isLive, quality: selfieQuality, selfieFaceCount },
            document: { isDocument, labels: names, textDetections: textDetections.length },
            idHasFace,
        };

        if (verified) return { verified: true, details };

        // Classify specific error with code and message
        if (!idHasFace) {
            return {
                verified: false,
                code: 'FaceNotDetected_ID',
                message: 'No face detected in the ID image. Use a clear photo of the front of your ID; avoid glare and cropping.',
                details,
            };
        }
        if (!selfieHasFace) {
            return {
                verified: false,
                code: 'FaceNotDetected_Selfie',
                message: 'No face detected in the selfie. Center your face in good lighting and try again.',
                details,
            };
        }
        if (selfieMultipleFaces) {
            return {
                verified: false,
                code: 'MultipleFacesDetected_Selfie',
                message: 'Multiple faces detected in the selfie. Capture only your face.',
                details,
            };
        }
        if (!isDocument) {
            return {
                verified: false,
                code: 'NotDocument',
                message: 'Document signal not detected (insufficient text/labels). Capture the full front of the ID—flat, readable text.',
                details,
            };
        }
        if (!matched || similarity < 70) {
            return {
                verified: false,
                code: 'LowSimilarity',
                message: `Face mismatch: similarity ${similarity.toFixed(1)}% (threshold 70%). Use the same person’s ID and selfie.`,
                details,
            };
        }
        if (!isLive) {
            return {
                verified: false,
                code: 'LivenessFailed',
                message: 'Liveness check failed (low quality or multiple faces). Retake the selfie with one face in frame and good lighting.',
                details,
            };
        }

        return {
            verified: false,
            code: 'RekognitionError',
            message: 'Verification service error. Please try again shortly.',
            details,
        };
    }
}


