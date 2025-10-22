import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API Welcome Message' })
  @ApiResponse({ status: 200, description: 'Welcome message with API info' })
  getHello(): object {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health Check Endpoint' })
  @ApiResponse({ status: 200, description: 'Health status of the API' })
  healthCheck(): object {
    return this.appService.healthCheck();
  }
}
