import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  InitiateVerificationResponseDto,
  VerificationCallbackDto,
  VerificationStatusResponseDto,
  VerificationStatsDto,
} from './dto';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /**
   * Initiate ID verification process
   * Rate limited to 3 attempts per 24 hours
   */
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 86400000 } }) // 3 requests per 24 hours
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Initiate ID verification',
    description:
      'Start the identity verification process. Rate limited to 3 attempts per 24 hours.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification initiated successfully',
    type: InitiateVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User already verified or rate limit exceeded',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts',
  })
  async initiateVerification(
    @CurrentUser('id') userId: string,
  ): Promise<InitiateVerificationResponseDto> {
    return this.verificationService.initiateVerification(userId);
  }

  /**
   * Get verification status for current user
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get verification status',
    description: 'Retrieve the current verification status and attempt history',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification status retrieved successfully',
    type: VerificationStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getVerificationStatus(
    @CurrentUser('id') userId: string,
  ): Promise<VerificationStatusResponseDto> {
    return this.verificationService.getVerificationStatus(userId);
  }

  /**
   * Webhook callback from IDV provider
   * Public endpoint with HMAC signature validation
   */
  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'x-webhook-signature',
    description: 'HMAC-SHA256 signature for webhook verification',
    required: true,
  })
  @ApiOperation({
    summary: 'Webhook callback from IDV provider',
    description:
      'Receives verification results from the external identity verification provider. ' +
      'This is a public endpoint secured by HMAC signature validation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Webhook processed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or payload',
  })
  async handleWebhookCallback(
    @Body() payload: VerificationCallbackDto,
    @Headers('x-webhook-signature') signature: string | undefined,
  ): Promise<{ success: boolean; message: string }> {
    // Validate signature is provided
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    // Process the webhook
    await this.verificationService.handleWebhookCallback(payload, signature);

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  /**
   * Get verification statistics (Admin only)
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get verification statistics',
    description: 'Retrieve system-wide verification statistics. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification statistics retrieved successfully',
    type: VerificationStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async getVerificationStats(): Promise<VerificationStatsDto> {
    return this.verificationService.getVerificationStats();
  }
}
