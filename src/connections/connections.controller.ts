import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import {
  CreateConnectionDto,
  UpdateConnectionDto,
  QueryConnectionsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('connections')
@Controller('connections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Send connection request',
    description:
      'Send a connection request to a user (roommate match) or listing owner (property inquiry). ' +
      'Either targetId or listingId must be provided. Cannot connect to yourself or your own listings. ' +
      'Connections expire after 7 days if not responded to.',
  })
  @ApiResponse({
    status: 201,
    description: 'Connection request sent successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid input or trying to connect to self/own listing',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - connection is blocked',
  })
  @ApiResponse({
    status: 404,
    description: 'Target user/listing not found or not active',
  })
  @ApiResponse({
    status: 409,
    description: 'Connection already exists',
  })
  createConnection(
    @CurrentUser('id') userId: string,
    @Body() createConnectionDto: CreateConnectionDto,
  ) {
    return this.connectionsService.createConnection(userId, createConnectionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all connections',
    description:
      'Retrieve all connections (incoming and outgoing) with optional filters. ' +
      'Supports filtering by status and direction (incoming/outgoing/all).',
  })
  @ApiResponse({
    status: 200,
    description: 'Connections retrieved successfully with pagination metadata',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getConnections(
    @CurrentUser('id') userId: string,
    @Query() query: QueryConnectionsDto,
  ) {
    return this.connectionsService.getConnections(userId, query);
  }

  @Get('incoming')
  @ApiOperation({
    summary: 'Get incoming connection requests',
    description:
      'Get all pending connection requests received by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Incoming connections retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getIncomingConnections(@CurrentUser('id') userId: string) {
    return this.connectionsService.getConnections(userId, {
      status: 'PENDING',
      direction: 'incoming',
    });
  }

  @Get('outgoing')
  @ApiOperation({
    summary: 'Get outgoing connection requests',
    description: 'Get all pending connection requests sent by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Outgoing connections retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getOutgoingConnections(@CurrentUser('id') userId: string) {
    return this.connectionsService.getConnections(userId, {
      status: 'PENDING',
      direction: 'outgoing',
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Accept or decline connection',
    description:
      'Accept or decline a connection request. Only the recipient can accept/decline. ' +
      'When accepted, a conversation is automatically created for both parties.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Connection updated successfully. If accepted, includes conversation ID.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - connection already responded to or has expired',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only recipient can accept/decline',
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  updateConnection(
    @CurrentUser('id') userId: string,
    @Param('id') connectionId: string,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ) {
    return this.connectionsService.updateConnection(
      userId,
      connectionId,
      updateConnectionDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel outgoing connection request',
    description:
      'Cancel a pending connection request sent by you. Only the requester can cancel.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - can only cancel pending connections',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only requester can cancel',
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  cancelConnection(
    @CurrentUser('id') userId: string,
    @Param('id') connectionId: string,
  ) {
    return this.connectionsService.cancelConnection(userId, connectionId);
  }

  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Block user from connecting',
    description:
      'Block a user from sending future connection requests. Only the recipient can block.',
  })
  @ApiResponse({
    status: 200,
    description: 'User blocked successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only recipient can block',
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  blockConnection(
    @CurrentUser('id') userId: string,
    @Param('id') connectionId: string,
  ) {
    return this.connectionsService.blockConnection(userId, connectionId);
  }
}
