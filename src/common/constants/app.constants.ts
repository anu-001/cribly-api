export const APP_CONSTANTS = {
  // API Configuration
  API_PREFIX: 'api/v1',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_LISTING: 10,

  // Geolocation
  DEFAULT_SEARCH_RADIUS_KM: 50,
  MAX_SEARCH_RADIUS_KM: 200,

  // Rate Limiting
  RATE_LIMIT_TTL: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX: 100, // 100 requests per minute

  // Chat
  MAX_MESSAGE_LENGTH: 1000,
  MESSAGE_BATCH_SIZE: 50,

  // Notifications
  NOTIFICATION_BATCH_SIZE: 100,

  // Cache TTL (in seconds)
  CACHE_TTL: {
    USER_PROFILE: 300, // 5 minutes
    LISTINGS: 60, // 1 minute
    MATCHES: 180, // 3 minutes
  },
} as const;

export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  ACCESS_DENIED: 'Access denied',

  // User
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',

  // Listing
  LISTING_NOT_FOUND: 'Listing not found',
  LISTING_NOT_AVAILABLE: 'Listing is not available',
  CANNOT_MATCH_OWN_LISTING: 'Cannot match with your own listing',

  // Match
  MATCH_NOT_FOUND: 'Match not found',
  MATCH_ALREADY_EXISTS: 'Match already exists',

  // Chat
  CHAT_NOT_FOUND: 'Chat not found',
  NOT_CHAT_MEMBER: 'You are not a member of this chat',
  MESSAGE_NOT_FOUND: 'Message not found',

  // File Upload
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',

  // Validation
  INVALID_COORDINATES: 'Invalid coordinates provided',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PAGE_SIZE: 'Page size must be between 1 and 100',

  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  NOT_FOUND: 'Resource not found',
} as const;

export const SUCCESS_MESSAGES = {
  // User
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',

  // Listing
  LISTING_CREATED: 'Listing created successfully',
  LISTING_UPDATED: 'Listing updated successfully',
  LISTING_DELETED: 'Listing deleted successfully',

  // Match
  MATCH_CREATED: 'Match created successfully',
  MATCH_ACCEPTED: 'Match accepted successfully',
  MATCH_REJECTED: 'Match rejected successfully',

  // Chat
  MESSAGE_SENT: 'Message sent successfully',
  CHAT_CREATED: 'Chat created successfully',

  // Notifications
  NOTIFICATION_SENT: 'Notification sent successfully',

  // General
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
} as const;
