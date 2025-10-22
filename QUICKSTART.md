# Quick Start Guide - Core Infrastructure

## 🚀 Getting Started

The core infrastructure has been fully implemented. Follow these steps to get the application running.

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis server running
- npm or yarn package manager

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure at minimum:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cribly_db?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"

# Application
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

### 4. Seed the Database (Optional)

```bash
npx prisma db seed
```

This will create:
- 12 test users (password: `Password123!`)
- 10 property listings in Kingston, Ottawa, Toronto, Brockville
- 6 roommate profiles
- Sample connections, messages, and notifications

### 5. Start the Development Server

```bash
npm run start:dev
```

The server will start on `http://localhost:3001`

### 6. Verify Installation

#### Health Check

```bash
curl http://localhost:3001/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T...",
  "services": [
    {
      "name": "database",
      "healthy": true,
      "responseTime": 5,
      "message": "Connected"
    },
    {
      "name": "redis",
      "healthy": true,
      "responseTime": 2,
      "message": "Connected"
    }
  ],
  "uptime": 1234,
  "version": "0.0.1"
}
```

#### API Documentation

Visit: `http://localhost:3001/api/v1/docs`

## 📋 Available Scripts

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start in debug mode

# Production
npm run build              # Build the application
npm run start:prod         # Start production server

# Database
npx prisma migrate dev     # Run migrations
npx prisma migrate reset   # Reset & seed database
npx prisma studio          # Open Prisma Studio
npx prisma db seed         # Seed database

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests

# Code Quality
npm run lint               # Lint the code
npm run format             # Format code with Prettier
```

## 🔍 Testing the Core Features

### 1. Health Checks

```bash
# Overall health
curl http://localhost:3001/api/v1/health

# Readiness (for Kubernetes)
curl http://localhost:3001/api/v1/health/ready

# Liveness (for Kubernetes)
curl http://localhost:3001/api/v1/health/live
```

### 2. Request ID Tracking

```bash
# Send request with custom ID
curl -H "X-Request-ID: my-test-id" http://localhost:3001/api/v1/health

# Check response header
curl -i http://localhost:3001/api/v1/health | grep X-Request-ID
```

### 3. Rate Limiting

```bash
# Send 101 requests quickly - last one should be rate limited
for i in {1..101}; do curl http://localhost:3001/api/v1/health; done
```

### 4. Error Handling

```bash
# Test 404 error
curl http://localhost:3001/api/v1/nonexistent

# Expected response:
# {
#   "statusCode": 404,
#   "timestamp": "...",
#   "path": "/api/v1/nonexistent",
#   "method": "GET",
#   "requestId": "...",
#   "message": "Cannot GET /api/v1/nonexistent"
# }
```

## 🐳 Docker Support (Optional)

### Using Docker Compose

Create a `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: cribly
      POSTGRES_PASSWORD: cribly_password
      POSTGRES_DB: cribly_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Start services:

```bash
docker-compose up -d
```

## 📊 Monitoring

### Application Logs

All requests are logged with:
- Request ID
- Method and URL
- Response status
- Duration

Example log:
```
[HTTP] [abc-123-def] GET /api/v1/health 200 - 15ms
```

### Health Endpoints

Monitor using:
- `/api/v1/health` - Overall health
- `/api/v1/health/ready` - Readiness probe
- `/api/v1/health/live` - Liveness probe

### Metrics Available

- Database response time
- Redis response time
- Application uptime
- Request duration

## 🔐 Test Credentials

If you ran the seed command, use these credentials:

```
Email: john.smith@example.com
Password: Password123!

Other test users:
- emma.johnson@example.com
- michael.brown@example.com
- sarah.wilson@example.com
- david.lee@example.com
- olivia.martinez@example.com
- agent.ottawa@example.com
- agent.toronto@example.com
- admin@cribly.com

All users have the same password: Password123!
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check database exists
psql -h localhost -U user -l | grep cribly
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Migration Issues

```bash
# Reset database completely
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Seed the database
```

## 📚 Next Steps

Now that the core infrastructure is working:

1. ✅ Test all health endpoints
2. ✅ Verify Swagger documentation
3. ✅ Check database connections
4. ✅ Verify Redis is working
5. 📝 Proceed to implement Phase 2: Authentication
6. 📝 Implement remaining business logic modules

## 💡 Tips

- Use Swagger UI for interactive API testing
- Check logs for request IDs when debugging
- Use Prisma Studio to inspect database
- Monitor health endpoints for system status
- All responses include request IDs for tracing

## 🆘 Need Help?

- Check logs in the terminal
- Verify environment variables in `.env`
- Ensure all services (PostgreSQL, Redis) are running
- Review the specification in `docs/specification.md`
- Check implementation details in `docs/CORE_IMPLEMENTATION.md`
