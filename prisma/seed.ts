import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create sample users
    const user1 = await prisma.user.create({
        data: {
            id: 'user-1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            supabaseId: 'supabase-user-1',
            latitude: 40.7128,
            longitude: -74.0060,
            bio: 'Property enthusiast looking for great listings in NYC.',
        },
    });

    const user2 = await prisma.user.create({
        data: {
            id: 'user-2',
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            supabaseId: 'supabase-user-2',
            latitude: 40.7589,
            longitude: -73.9851,
            bio: 'Real estate investor seeking rental properties.',
        },
    });

    // Create sample listings
    const listing1 = await prisma.listing.create({
        data: {
            title: 'Modern Studio in Manhattan',
            description: 'Beautiful studio apartment with great city views. Perfect for young professionals.',
            price: 2500,
            propertyType: 'STUDIO',
            bedrooms: 0,
            bathrooms: 1,
            area: 500,
            furnished: true,
            address: '123 Broadway',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            latitude: 40.7505,
            longitude: -73.9934,
            images: [
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
            ],
            userId: user1.id,
        },
    });

    const listing2 = await prisma.listing.create({
        data: {
            title: '2BR Apartment in Brooklyn',
            description: 'Spacious 2-bedroom apartment in trendy Brooklyn neighborhood.',
            price: 3200,
            propertyType: 'APARTMENT',
            bedrooms: 2,
            bathrooms: 1,
            area: 900,
            furnished: false,
            address: '456 Atlantic Ave',
            city: 'Brooklyn',
            state: 'NY',
            country: 'USA',
            latitude: 40.6892,
            longitude: -73.9442,
            images: [
                'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
            ],
            userId: user2.id,
        },
    });

    // Create sample match
    await prisma.match.create({
        data: {
            userId: user2.id,
            listingId: listing1.id,
            ownerId: user1.id,
            message: 'Interested in this property! Would love to schedule a viewing.',
            status: 'PENDING',
        },
    });

    // Create sample chat
    const chat = await prisma.chat.create({
        data: {
            isGroup: false,
            members: {
                create: [
                    { userId: user1.id },
                    { userId: user2.id },
                ],
            },
        },
    });

    // Create sample messages
    await prisma.message.createMany({
        data: [
            {
                chatId: chat.id,
                senderId: user2.id,
                content: 'Hi! I saw your listing and I\'m very interested.',
                type: 'TEXT',
            },
            {
                chatId: chat.id,
                senderId: user1.id,
                content: 'Great! I\'d be happy to show you around. When works for you?',
                type: 'TEXT',
            },
        ],
    });

    // Create sample notifications
    await prisma.notification.createMany({
        data: [
            {
                userId: user1.id,
                title: 'New Match Request',
                body: 'Someone is interested in your Modern Studio listing!',
                type: 'MATCH_REQUEST',
                data: { listingId: listing1.id },
            },
            {
                userId: user2.id,
                title: 'Welcome to Cribly!',
                body: 'Start exploring amazing properties in your area.',
                type: 'SYSTEM_UPDATE',
                data: {},
                isRead: true,
            },
        ],
    });

    console.log('✅ Database seeded successfully!');
    console.log(`Created ${2} users, ${2} listings, ${1} match, ${1} chat, and ${2} messages`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });