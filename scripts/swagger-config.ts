import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { join } from 'path';

// Swagger imports to add to controllers
const SWAGGER_IMPORTS = `import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
    ApiBody,
} from '@nestjs/swagger';`;

// Common API decorators for controllers
const CONTROLLER_DECORATORS = {
    'listing.controller.ts': {
        tag: 'Listings',
        operations: {
            'createListing': {
                summary: 'Create Property Listing',
                description: 'Create a new property listing with details and location.',
                responses: [
                    { status: 201, description: 'Listing created successfully' },
                    { status: 400, description: 'Invalid input data' },
                ]
            },
            'getAllListings': {
                summary: 'Get All Listings',
                description: 'Retrieve paginated property listings with optional filters.',
                responses: [
                    { status: 200, description: 'Listings retrieved successfully' },
                ]
            },
            'getMyListings': {
                summary: 'Get My Listings',
                description: 'Retrieve current user\'s property listings.',
                responses: [
                    { status: 200, description: 'User listings retrieved' },
                ]
            },
            'getListingById': {
                summary: 'Get Listing by ID',
                description: 'Retrieve detailed information about a specific property listing.',
                responses: [
                    { status: 200, description: 'Listing found' },
                    { status: 404, description: 'Listing not found' },
                ]
            },
            'updateListing': {
                summary: 'Update Property Listing',
                description: 'Update an existing property listing (owner only).',
                responses: [
                    { status: 200, description: 'Listing updated successfully' },
                    { status: 403, description: 'Not authorized to update this listing' },
                    { status: 404, description: 'Listing not found' },
                ]
            },
            'deleteListing': {
                summary: 'Delete Property Listing',
                description: 'Delete a property listing (owner only).',
                responses: [
                    { status: 200, description: 'Listing deleted successfully' },
                    { status: 403, description: 'Not authorized to delete this listing' },
                    { status: 404, description: 'Listing not found' },
                ]
            }
        }
    },
    'match.controller.ts': {
        tag: 'Matches',
        operations: {
            'createMatch': {
                summary: 'Create Match Request',
                description: 'Send a match request to a property listing owner.',
                responses: [
                    { status: 201, description: 'Match request sent successfully' },
                    { status: 400, description: 'Invalid match request' },
                    { status: 409, description: 'Match request already exists' },
                ]
            },
            'getSentMatches': {
                summary: 'Get Sent Match Requests',
                description: 'Retrieve match requests sent by the current user.',
                responses: [
                    { status: 200, description: 'Sent matches retrieved' },
                ]
            },
            'getReceivedMatches': {
                summary: 'Get Received Match Requests',
                description: 'Retrieve match requests received by the current user.',
                responses: [
                    { status: 200, description: 'Received matches retrieved' },
                ]
            },
            'getMatchById': {
                summary: 'Get Match Details',
                description: 'Retrieve details of a specific match.',
                responses: [
                    { status: 200, description: 'Match found' },
                    { status: 404, description: 'Match not found' },
                ]
            },
            'updateMatchStatus': {
                summary: 'Accept/Reject Match',
                description: 'Accept or reject a match request.',
                responses: [
                    { status: 200, description: 'Match status updated' },
                    { status: 404, description: 'Match not found' },
                ]
            }
        }
    },
    'chat.controller.ts': {
        tag: 'Chat',
        operations: {
            'getConversations': {
                summary: 'Get User Conversations',
                description: 'Retrieve all conversations for the current user.',
                responses: [
                    { status: 200, description: 'Conversations retrieved successfully' },
                ]
            },
            'getConversation': {
                summary: 'Get Conversation Details',
                description: 'Retrieve details of a specific conversation.',
                responses: [
                    { status: 200, description: 'Conversation found' },
                    { status: 404, description: 'Conversation not found' },
                ]
            },
            'getMessages': {
                summary: 'Get Conversation Messages',
                description: 'Retrieve paginated messages from a conversation.',
                responses: [
                    { status: 200, description: 'Messages retrieved successfully' },
                ]
            },
            'sendMessage': {
                summary: 'Send Message',
                description: 'Send a message in a conversation.',
                responses: [
                    { status: 201, description: 'Message sent successfully' },
                    { status: 404, description: 'Conversation not found' },
                ]
            },
            'markMessageAsRead': {
                summary: 'Mark Message as Read',
                description: 'Mark a specific message as read.',
                responses: [
                    { status: 200, description: 'Message marked as read' },
                    { status: 404, description: 'Message not found' },
                ]
            }
        }
    },
    'notification.controller.ts': {
        tag: 'Notifications',
        operations: {
            'getNotifications': {
                summary: 'Get User Notifications',
                description: 'Retrieve paginated notifications for the current user.',
                responses: [
                    { status: 200, description: 'Notifications retrieved successfully' },
                ]
            },
            'sendNotification': {
                summary: 'Send Push Notification',
                description: 'Send a push notification to users (admin only).',
                responses: [
                    { status: 201, description: 'Notification sent successfully' },
                    { status: 403, description: 'Admin access required' },
                ]
            },
            'markAsRead': {
                summary: 'Mark Notification as Read',
                description: 'Mark a notification as read.',
                responses: [
                    { status: 200, description: 'Notification marked as read' },
                    { status: 404, description: 'Notification not found' },
                ]
            },
            'registerDeviceToken': {
                summary: 'Register Device Token',
                description: 'Register a device token for push notifications.',
                responses: [
                    { status: 201, description: 'Device token registered' },
                    { status: 400, description: 'Invalid device token' },
                ]
            },
            'removeDeviceToken': {
                summary: 'Remove Device Token',
                description: 'Remove a device token to stop receiving notifications.',
                responses: [
                    { status: 200, description: 'Device token removed' },
                    { status: 404, description: 'Device token not found' },
                ]
            }
        }
    }
};

console.log('🚀 Swagger configuration helper completed.');
console.log('✅ Use the decorators above to enhance your controllers with comprehensive API documentation.');