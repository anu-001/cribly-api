# Cribly Backend API

A production-grade NestJS backend for the Cribly property listing and matching platform.

## 🚀 Features

- **Authentication**: Supabase JWT-based authentication
- **Real-time Chat**: WebSocket-powered messaging with Socket.io
- **Geolocation**: Location-based property search and matching
- **Media Upload**: Cloudinary integration for image management  
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Email Notifications**: Transactional emails with Resend
- **Database**: PostgreSQL with Prisma ORM via Supabase
- **Rate Limiting**: Built-in request throttling
- **Validation**: Comprehensive input validation with DTOs
- **Production Ready**: Docker containerization and CI/CD pipelines

## 🏗️ Architecture

```
src/
├── auth/              # Authentication module (Supabase JWT)
├── users/             # User management
├── listings/          # Property listings with geolocation
├── matches/           # User-listing matching system
├── chat/              # Real-time messaging (WebSocket)
├── notifications/     # Push notifications (FCM) + Email (Resend)
├── cloudinary/        # Image upload and management
├── prisma/            # Database access layer
├── common/            # Shared utilities, guards, interceptors
│   ├── guards/        # JWT auth guard
│   ├── interceptors/  # Logging, transform interceptors
│   ├── decorators/    # Custom decorators
│   └── constants/     # App constants and error messages
└── main.ts            # Application bootstrap
```

## 🛠️ Tech Stack

- **Backend**: NestJS (TypeScript)
- **Database**: Supabase (PostgreSQL) 
- **ORM**: Prisma
- **Authentication**: Supabase Auth (JWT)
- **WebSocket**: Socket.io
- **Media Storage**: Cloudinary
- **Push Notifications**: Firebase Cloud Messaging
- **Email**: Resend
- **Deployment**: Docker + Google Cloud Run

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cribly-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   - Database URL (Supabase)
   - Supabase credentials
   - Cloudinary credentials
   - Firebase credentials
   - Resend API key

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Push schema to database
   npm run prisma:push
   
   # (Optional) Seed database
   npm run prisma:seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 📊 Database Management

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema changes
npm run prisma:push

# Run migrations
npm run prisma:migrate

# View database in Prisma Studio
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/signin` - User login
- `POST /api/v1/auth/signout` - User logout
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/location` - Update user location
- `GET /api/v1/users/nearby` - Find nearby users
- `DELETE /api/v1/users/account` - Delete user account

### Listings
- `GET /api/v1/listings` - Get all listings (with filters)
- `POST /api/v1/listings` - Create new listing
- `GET /api/v1/listings/:id` - Get listing by ID
- `PUT /api/v1/listings/:id` - Update listing
- `DELETE /api/v1/listings/:id` - Delete listing
- `GET /api/v1/listings/my-listings` - Get user's listings

### Matches
- `POST /api/v1/matches` - Create match request
- `GET /api/v1/matches/sent` - Get sent matches
- `GET /api/v1/matches/received` - Get received matches
- `PUT /api/v1/matches/:id/status` - Accept/reject match

### Real-time Chat (WebSocket)
- `join` - Join user to WebSocket
- `joinChat` - Join specific chat room
- `sendMessage` - Send message to chat
- `typing` - Send typing indicator
- `markAsRead` - Mark messages as read

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t cribly-backend .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

### Environment Variables for Production
Set these in your deployment environment:
- `NODE_ENV=production`
- `DATABASE_URL` (Supabase connection string)
- All service API keys (Cloudinary, Firebase, Resend, etc.)

## 🔧 Configuration

### Rate Limiting
- Default: 100 requests per minute per IP
- Configurable via environment variables

### File Upload Limits
- Max file size: 5MB
- Supported formats: JPEG, PNG, WebP
- Max images per listing: 10

### Geolocation
- Uses simple bounding box for nearby searches
- Default search radius: 50km
- Max search radius: 200km

## 🔒 Security Features

- JWT authentication with Supabase
- Input validation with class-validator
- Rate limiting and throttling
- CORS configuration
- Environment variable protection
- SQL injection prevention (Prisma)

## 📈 Monitoring & Logging

- Request/response logging
- Error tracking
- Performance monitoring
- Health checks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ by the Cribly Team
Tinder for Cribs
