import { PrismaClient, PropertyType, Gender, SmokingPreference, PetPreference, CleanlinessLevel, SocialLevel, MatchStatus, MessageType, NotificationType, DevicePlatform } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Ontario cities with their approximate coordinates
const ontarioCities = [
    { name: 'Kingston', lat: 44.2253, lng: -76.4951, count: 15 },
    { name: 'Brockville', lat: 44.5896, lng: -75.6919, count: 10 },
    { name: 'Ottawa', lat: 45.4215, lng: -75.6972, count: 25 },
];

// Canadian postal code prefixes for Ontario
const ontarioPostalPrefixes = {
    Kingston: ['K7'],
    Brockville: ['K6V', 'K6A'],
    Ottawa: ['K1', 'K2', 'K4'],
};

// Realistic Canadian street names
const canadianStreetNames = [
    'Maple', 'King', 'Queen', 'Main', 'Church', 'University', 'College', 'Bay', 'Yonge',
    'Bloor', 'Dundas', 'Front', 'Wellington', 'Richmond', 'Adelaide', 'Victoria', 'Princess',
    'Rideau', 'Sparks', 'Somerset', 'Elgin', 'Bank', 'O\'Connor', 'Metcalfe', 'Kent',
    'Lyon', 'Percy', 'Gloucester', 'Nepean', 'Carling', 'Baseline', 'Hunt Club', 'Meadowlands'
];

const streetTypes = ['St', 'Ave', 'Rd', 'Dr', 'Cres', 'Blvd', 'Way', 'Pl', 'Crt', 'Lane'];

function generateCanadianPostalCode(city: string): string {
    const prefixes = ontarioPostalPrefixes[city] || ['K1'];
    const prefix = faker.helpers.arrayElement(prefixes);
    const letter1 = faker.helpers.arrayElement('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    const number1 = faker.number.int({ min: 0, max: 9 });
    const letter2 = faker.helpers.arrayElement('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    const number2 = faker.number.int({ min: 0, max: 9 });
    const letter3 = faker.helpers.arrayElement('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    const number3 = faker.number.int({ min: 0, max: 9 });

    return `${prefix}${letter1} ${number1}${letter2}${number2}${letter3}${number3}`;
}

function generateCanadianAddress(city: string): string {
    const streetNumber = faker.number.int({ min: 1, max: 9999 });
    const streetName = faker.helpers.arrayElement(canadianStreetNames);
    const streetType = faker.helpers.arrayElement(streetTypes);
    const unitNumber = faker.datatype.boolean(0.3) ? `, Unit ${faker.number.int({ min: 1, max: 50 })}` : '';

    return `${streetNumber} ${streetName} ${streetType}${unitNumber}`;
}

function generateVariedCoordinate(baseLat: number, baseLng: number, radiusKm: number = 15): { lat: number, lng: number } {
    // Convert radius from km to degrees (rough approximation)
    const radiusInDegrees = radiusKm / 111; // 1 degree ≈ 111 km

    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * radiusInDegrees;

    const deltaLat = radius * Math.cos(angle);
    const deltaLng = radius * Math.sin(angle);

    return {
        lat: baseLat + deltaLat,
        lng: baseLng + deltaLng,
    };
}

function generatePropertyPrice(propertyType: PropertyType, city: string): number {
    const basePrices = {
        Kingston: { min: 1200, max: 2800 },
        Brockville: { min: 900, max: 2200 },
        Ottawa: { min: 1500, max: 4500 },
    };

    const cityPrices = basePrices[city] || basePrices.Kingston;

    const typeMultipliers = {
        STUDIO: 0.6,
        ROOM: 0.4,
        APARTMENT: 1.0,
        CONDO: 1.2,
        TOWNHOUSE: 1.4,
        HOUSE: 1.6,
        DUPLEX: 1.3,
        TRIPLEX: 1.1,
        BASEMENT_SUITE: 0.7,
        LOFT: 1.3,
        COTTAGE: 1.8,
        MOBILE_HOME: 0.5,
        COMMERCIAL: 2.0,
        OTHER: 1.0,
    };

    const multiplier = typeMultipliers[propertyType] || 1.0;
    const basePrice = faker.number.int({ min: cityPrices.min, max: cityPrices.max });

    return Math.round(basePrice * multiplier);
}

async function main() {
    console.log('🌱 Starting comprehensive seed data creation...');

    // Create realistic users with Canadian data
    console.log('👥 Creating users...');
    const users = [];

    for (let i = 0; i < 60; i++) {
        const city = faker.helpers.arrayElement(ontarioCities);
        const coords = generateVariedCoordinate(city.lat, city.lng, 20);

        const user = await prisma.user.create({
            data: {
            email: faker.internet.email(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            avatar: faker.image.avatar(),
            phone: `+1${faker.string.numeric(10)}`,
            latitude: coords.lat,
            longitude: coords.lng,
            bio: faker.lorem.paragraph({ min: 1, max: 3 }),
            passwordHash: await bcrypt.hash('password123', 10),
            emailVerified: faker.datatype.boolean(0.8),
            isActive: true,
            lastLogin: faker.date.recent({ days: 30 }),
            preferences: {
                notifications: faker.datatype.boolean(0.7),
                newsletter: faker.datatype.boolean(0.5),
                theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
            },
        },
    });
      users.push(user);
  }

    // Create roommate profiles for some users
    console.log('🏠 Creating roommate profiles...');
    const roommateUsers = faker.helpers.arrayElements(users, 25);

    for (const user of roommateUsers) {
        await prisma.roommateProfile.create({
            data: {
            userId: user.id,
            age: faker.number.int({ min: 18, max: 45 }),
            gender: faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE, Gender.NON_BINARY, Gender.PREFER_NOT_TO_SAY]),
            occupation: faker.person.jobTitle(),
            bio: faker.lorem.paragraph({ min: 2, max: 4 }),
            preferredCities: faker.helpers.arrayElements(['Kingston', 'Ottawa', 'Brockville', 'Toronto', 'Montreal'], { min: 1, max: 3 }),
            budgetMin: faker.number.int({ min: 800, max: 1500 }),
            budgetMax: faker.number.int({ min: 1500, max: 3500 }),
            smokingPreference: faker.helpers.arrayElement([SmokingPreference.SMOKER, SmokingPreference.NON_SMOKER, SmokingPreference.OCCASIONAL, SmokingPreference.NO_PREFERENCE]),
            petPreference: faker.helpers.arrayElement([PetPreference.LOVES_PETS, PetPreference.NO_PETS, PetPreference.SMALL_PETS_ONLY, PetPreference.NO_PREFERENCE]),
            cleanlinessLevel: faker.helpers.arrayElement([CleanlinessLevel.VERY_CLEAN, CleanlinessLevel.MODERATELY_CLEAN, CleanlinessLevel.RELAXED, CleanlinessLevel.NO_PREFERENCE]),
            socialLevel: faker.helpers.arrayElement([SocialLevel.VERY_SOCIAL, SocialLevel.MODERATELY_SOCIAL, SocialLevel.PREFER_QUIET, SocialLevel.NO_PREFERENCE]),
            interests: faker.helpers.arrayElements([
                'Reading', 'Cooking', 'Hiking', 'Gaming', 'Music', 'Movies', 'Sports', 'Travel',
                'Photography', 'Art', 'Dancing', 'Yoga', 'Fitness', 'Technology', 'Gardening'
            ], { min: 2, max: 6 }),
            hasPets: faker.datatype.boolean(0.3),
            isSmoke: faker.datatype.boolean(0.2),
        },
    });
    }

    // Create device tokens for active users
    console.log('📱 Creating device tokens...');
    for (const user of users.slice(0, 40)) {
        const tokenCount = faker.number.int({ min: 1, max: 3 });
        for (let i = 0; i < tokenCount; i++) {
            await prisma.deviceToken.create({
                data: {
                    token: faker.string.alphanumeric(64),
                    userId: user.id,
                    platform: faker.helpers.arrayElement([DevicePlatform.IOS, DevicePlatform.ANDROID, DevicePlatform.WEB]),
                    appVersion: faker.system.semver(),
                    isActive: faker.datatype.boolean(0.9),
                    lastUsed: faker.date.recent({ days: 7 }),
                },
            });
        }
    }

    // Create 50 realistic Ontario property listings
    console.log('🏘️ Creating property listings...');
    const listings = [];

    for (const city of ontarioCities) {
        for (let i = 0; i < city.count; i++) {
            const owner = faker.helpers.arrayElement(users);
            const coords = generateVariedCoordinate(city.lat, city.lng, 12);
            const propertyType = faker.helpers.arrayElement([
                PropertyType.APARTMENT, PropertyType.CONDO, PropertyType.HOUSE, PropertyType.TOWNHOUSE,
                PropertyType.STUDIO, PropertyType.ROOM, PropertyType.BASEMENT_SUITE, PropertyType.DUPLEX
            ]);

            const bedrooms = propertyType === PropertyType.STUDIO ? 0 :
                propertyType === PropertyType.ROOM ? 1 :
                    faker.number.int({ min: 1, max: 4 });

            const listing = await prisma.listing.create({
                data: {
                    title: `${faker.helpers.arrayElement(['Charming', 'Modern', 'Spacious', 'Cozy', 'Beautiful', 'Bright', 'Lovely', 'Stunning'])} ${bedrooms || 'Studio'} ${bedrooms === 1 ? 'Bedroom' : bedrooms > 1 ? 'Bedroom' : ''} ${propertyType.toLowerCase().replace('_', ' ')} in ${city.name}`,
                    description: faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n'),
                    price: generatePropertyPrice(propertyType, city.name),
                    currency: 'CAD',
                    bedrooms,
                    bathrooms: bedrooms === 0 ? 1 : faker.number.float({ min: 1, max: bedrooms + 1, fractionDigits: 1 }),
                    furnished: faker.datatype.boolean(0.4),
                    address: generateCanadianAddress(city.name),
                    city: city.name,
                    province: 'Ontario',
                    country: 'CA',
                    postalCode: generateCanadianPostalCode(city.name),
                    latitude: coords.lat,
                    longitude: coords.lng,
                    images: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
                        faker.image.urlLoremFlickr({ category: 'house', width: 800, height: 600 })
                    ),
                    isActive: faker.datatype.boolean(0.85),
                    isAvailable: faker.datatype.boolean(0.9),
                    isFeatured: faker.datatype.boolean(0.15),
                    propertyType,
                    userId: owner.id,
                    heating: faker.helpers.arrayElement(['Gas', 'Electric', 'Oil', 'Heat Pump', 'Baseboard']),
                    cooling: faker.helpers.arrayElement(['Central Air', 'Window Units', 'None', 'Heat Pump']),
                    parkingSpots: faker.number.int({ min: 0, max: 3 }),
                    petPolicy: faker.helpers.arrayElement(['No Pets', 'Cats Only', 'Dogs Only', 'Cats & Dogs', 'Case by Case']),
                    smokingPolicy: faker.datatype.boolean(0.2),
                    sqft: propertyType === PropertyType.STUDIO ? faker.number.int({ min: 400, max: 700 }) :
                        propertyType === PropertyType.ROOM ? faker.number.int({ min: 150, max: 300 }) :
                            faker.number.int({ min: 600, max: 2500 }),
                    utilities: faker.helpers.arrayElements(['Heat', 'Hydro', 'Water', 'Internet', 'Cable'], { min: 1, max: 5 }),
                    yearBuilt: faker.number.int({ min: 1950, max: 2023 }),
        },
      });
          listings.push(listing);
      }
  }

    // Create listing images
    console.log('📷 Creating listing images...');
    for (const listing of listings.slice(0, 30)) {
        const imageCount = faker.number.int({ min: 2, max: 6 });
        for (let i = 0; i < imageCount; i++) {
            await prisma.listingImage.create({
        data: {
              url: faker.image.urlLoremFlickr({ category: 'room', width: 1024, height: 768 }),
              publicId: faker.string.alphanumeric(20),
              alt: `${listing.title} - Image ${i + 1}`,
              order: i,
              listingId: listing.id,
          },
      });
        }
    }

    // Create matches between users and listings
    console.log('🤝 Creating matches...');
    const matches = [];
    const matchCount = faker.number.int({ min: 25, max: 40 });

    for (let i = 0; i < matchCount; i++) {
        const listing = faker.helpers.arrayElement(listings);
        const requester = faker.helpers.arrayElement(users.filter(u => u.id !== listing.userId));

        // Check if match already exists
        const existingMatch = await prisma.match.findUnique({
            where: {
                requesterId_listingId: {
                    requesterId: requester.id,
                    listingId: listing.id,
                },
            },
    });

      if (!existingMatch) {
          const match = await prisma.match.create({
        data: {
              status: faker.helpers.arrayElement([MatchStatus.PENDING, MatchStatus.ACCEPTED, MatchStatus.REJECTED]),
              message: faker.lorem.sentence({ min: 5, max: 15 }),
              listingId: listing.id,
              ownerId: listing.userId,
              requesterId: requester.id,
              viewedByOwner: faker.datatype.boolean(0.7),
        },
      });
            matches.push(match);
        }
    }

    // Create conversations for accepted matches
    console.log('💬 Creating conversations...');
    const acceptedMatches = matches.filter(m => m.status === MatchStatus.ACCEPTED);

    for (const match of acceptedMatches) {
        const conversation = await prisma.conversation.create({
            data: {
                matchId: match.id,
                isActive: faker.datatype.boolean(0.8),
                lastMessageAt: faker.date.recent({ days: 7 }),
            },
        });

      // Add participants
      await prisma.conversationParticipant.createMany({
          data: [
              {
                conversationId: conversation.id,
                userId: match.ownerId,
                joinedAt: conversation.createdAt,
                lastReadAt: faker.date.recent({ days: 2 }),
            },
            {
                conversationId: conversation.id,
                userId: match.requesterId,
                joinedAt: conversation.createdAt,
                lastReadAt: faker.date.recent({ days: 1 }),
            },
        ],
    });

        // Create messages for the conversation
        const messageCount = faker.number.int({ min: 3, max: 15 });
        const participants = [match.ownerId, match.requesterId];

        for (let i = 0; i < messageCount; i++) {
            const sender = faker.helpers.arrayElement(participants);
            const messageType = faker.datatype.boolean(0.9) ? MessageType.TEXT : MessageType.IMAGE;

            await prisma.message.create({
                data: {
                    content: messageType === MessageType.TEXT
                        ? faker.lorem.sentence({ min: 3, max: 20 })
                        : 'Shared an image',
                    type: messageType,
                    mediaUrl: messageType === MessageType.IMAGE
                        ? faker.image.urlLoremFlickr({ category: 'room', width: 400, height: 300 })
                        : null,
                    isRead: faker.datatype.boolean(0.7),
                    senderId: sender,
                    conversationId: conversation.id,
                    createdAt: faker.date.recent({ days: 7 }),
                },
            });
        }
    }

    // Create notifications
    console.log('🔔 Creating notifications...');
    for (const user of users.slice(0, 35)) {
        const notificationCount = faker.number.int({ min: 2, max: 8 });

        for (let i = 0; i < notificationCount; i++) {
            const notificationType = faker.helpers.arrayElement([
                NotificationType.MATCH_REQUEST,
                NotificationType.MATCH_ACCEPTED,
                NotificationType.NEW_MESSAGE,
                NotificationType.LISTING_FEATURED,
                NotificationType.WELCOME,
                NotificationType.REMINDER,
            ]);

            await prisma.notification.create({
                data: {
                    title: `${notificationType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}`,
                    body: faker.lorem.sentence({ min: 5, max: 12 }),
                    type: notificationType,
                    data: {
                        entityId: faker.string.uuid(),
                        entityType: faker.helpers.arrayElement(['listing', 'match', 'conversation']),
                        action: faker.helpers.arrayElement(['view', 'respond', 'update']),
                    },
                    isRead: faker.datatype.boolean(0.6),
                    isSent: faker.datatype.boolean(0.9),
                    userId: user.id,
                    emailSent: faker.datatype.boolean(0.4),
                    pushSent: faker.datatype.boolean(0.8),
                    readAt: faker.datatype.boolean(0.6) ? faker.date.recent({ days: 5 }) : null,
                    sentAt: faker.date.recent({ days: 10 }),
                },
            });
        }
    }

    console.log('✅ Comprehensive seed data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏠 Roommate Profiles: ${roommateUsers.length}`);
    console.log(`   🏘️ Listings: ${listings.length}`);
    console.log(`   🤝 Matches: ${matches.length}`);
    console.log(`   💬 Conversations: ${acceptedMatches.length}`);
    console.log(`   📱 Device Tokens: Created for 40 users`);
    console.log(`   🔔 Notifications: Created for 35 users`);
    console.log('');
    console.log('🌍 Geographic Distribution:');
    for (const city of ontarioCities) {
        console.log(`   ${city.name}: ${city.count} listings`);
    }
}

main()
    .catch((e) => {
      console.error('❌ Error during seed:', e);
      process.exit(1);
  })
    .finally(async () => {
        await prisma.$disconnect();
      console.log('🔐 Database connection closed');
  });