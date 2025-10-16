console.log('\n🚀 Available Routes in Cribly Backend API:\n');
console.log('═'.repeat(80));

// Auth Routes
console.log('AUTH ROUTES:');
console.log('POST     /api/v1/auth/signup');
console.log('POST     /api/v1/auth/signin');
console.log('POST     /api/v1/auth/signout');
console.log('POST     /api/v1/auth/refresh');
console.log('GET      /api/v1/auth/profile');
console.log('PUT      /api/v1/auth/profile');
console.log('');

// User Routes
console.log('USER ROUTES:');
console.log('GET      /api/v1/users');
console.log('GET      /api/v1/users/:id');
console.log('PUT      /api/v1/users/:id');
console.log('DELETE   /api/v1/users/:id');
console.log('GET      /api/v1/users/nearby');
console.log('PUT      /api/v1/users/:id/location');
console.log('');

// Listing Routes
console.log('LISTING ROUTES:');
console.log('GET      /api/v1/listings');
console.log('POST     /api/v1/listings');
console.log('GET      /api/v1/listings/:id');
console.log('PUT      /api/v1/listings/:id');
console.log('DELETE   /api/v1/listings/:id');
console.log('GET      /api/v1/listings/search');
console.log('POST     /api/v1/listings/:id/images');
console.log('');

// Match Routes
console.log('MATCH ROUTES:');
console.log('GET      /api/v1/matches');
console.log('POST     /api/v1/matches');
console.log('GET      /api/v1/matches/:id');
console.log('PUT      /api/v1/matches/:id/status');
console.log('');

// Chat Routes  
console.log('CHAT ROUTES:');
console.log('GET      /api/v1/chat/conversations');
console.log('GET      /api/v1/chat/conversations/:id');
console.log('GET      /api/v1/chat/conversations/:id/messages');
console.log('POST     /api/v1/chat/conversations/:id/messages');
console.log('PUT      /api/v1/chat/messages/:id/read');
console.log('');

// WebSocket Events
console.log('WEBSOCKET EVENTS:');
console.log('LISTEN   join_conversation');
console.log('LISTEN   leave_conversation');
console.log('LISTEN   send_message');
console.log('EMIT     message_received');
console.log('EMIT     typing_start');
console.log('EMIT     typing_stop');
console.log('');

// Notification Routes
console.log('NOTIFICATION ROUTES:');
console.log('GET      /api/v1/notifications');
console.log('POST     /api/v1/notifications/send');
console.log('PUT      /api/v1/notifications/:id/read');
console.log('POST     /api/v1/notifications/device-token');
console.log('DELETE   /api/v1/notifications/device-token/:token');
console.log('');

console.log('═'.repeat(80));
console.log('✅ All routes listed above');
console.log('🔒 Most routes require authentication (Bearer token)');
console.log('📱 WebSocket connection available at /socket.io');
console.log('═'.repeat(80));