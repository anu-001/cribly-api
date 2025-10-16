import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',

    database: {
        url: process.env.DATABASE_URL,
    },

    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
    },

    rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },

    resend: {
        apiKey: process.env.RESEND_API_KEY,
    },

    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },

    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
}));