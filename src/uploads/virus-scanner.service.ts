import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as NodeClam from 'clamscan';

@Injectable()
export class VirusScannerService implements OnModuleInit {
  private readonly logger = new Logger(VirusScannerService.name);
  private clamScan: any;
  private isAvailable = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const host = this.configService.get<string>('CLAMAV_HOST', 'localhost');
      const port = this.configService.get<number>('CLAMAV_PORT', 3310);

      this.logger.log(`Initializing ClamAV connection to ${host}:${port}`);

      this.clamScan = await new NodeClam().init({
        clamdscan: {
          host,
          port,
          timeout: 60000,
        },
        preference: 'clamdscan',
      });

      // Test connection
      const version = await this.clamScan.getVersion();
      this.isAvailable = true;
      this.logger.log(`ClamAV connected successfully. Version: ${version}`);
    } catch (error) {
      this.isAvailable = false;
      this.logger.warn(
        `ClamAV not available: ${error.message}. Virus scanning will be skipped.`,
      );
    }
  }

  /**
   * Scan a file buffer for viruses
   * @param buffer File buffer to scan
   * @param filename Original filename
   * @returns { isInfected: boolean, viruses?: string[] }
   */
  async scanBuffer(
    buffer: Buffer,
    filename: string,
  ): Promise<{ isInfected: boolean; viruses?: string[] }> {
    if (!this.isAvailable) {
      this.logger.warn(
        `Virus scanning skipped for ${filename} - ClamAV not available`,
      );
      return { isInfected: false };
    }

    try {
      this.logger.debug(`Scanning file: ${filename}`);

      const { isInfected, viruses } = await this.clamScan.scanBuffer(buffer);

      if (isInfected) {
        this.logger.error(
          `Virus detected in ${filename}: ${viruses.join(', ')}`,
        );
        return { isInfected: true, viruses };
      }

      this.logger.debug(`File ${filename} is clean`);
      return { isInfected: false };
    } catch (error) {
      this.logger.error(`Error scanning file ${filename}: ${error.message}`);
      // On error, fail safe by treating as infected
      return { isInfected: true, viruses: ['SCAN_ERROR'] };
    }
  }

  /**
   * Check if virus scanner is available
   */
  isVirusScannerAvailable(): boolean {
    return this.isAvailable;
  }
}
