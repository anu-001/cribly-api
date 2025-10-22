import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    console.log('🧹 Cleaning database...');
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationMember.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.connection.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.roommateProfile.deleteMany();
    await prisma.propertyListing.deleteMany();
    await prisma.verificationAttempt.deleteMany();
    await prisma.agentProfile.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Hash password for all users (password: "Password123!")
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create Users
    console.log('👥 Creating users...');
    const users = await Promise.all([
        // Regular users
        prisma.user.create({
            data: {
                email: 'john.smith@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'John',
                lastName: 'Smith',
                phoneNumber: '+1-613-555-0101',
                dateOfBirth: new Date('1995-03-15'),
                bio: 'Software developer looking for a clean and quiet place in Ottawa. Non-smoker, no pets. I enjoy hiking and photography.',
                avatarUrl: 'https://i.pravatar.cc/300?img=12',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'emma.johnson@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'Emma',
                lastName: 'Johnson',
                phoneNumber: '+1-416-555-0102',
                dateOfBirth: new Date('1997-07-22'),
                bio: 'Marketing coordinator in Toronto. I love cooking and yoga. Looking for a friendly roommate!',
                avatarUrl: 'https://i.pravatar.cc/300?img=20',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'michael.brown@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'Michael',
                lastName: 'Brown',
                phoneNumber: '+1-613-555-0103',
                dateOfBirth: new Date('1993-11-08'),
                bio: 'Graduate student at Queen\'s University. Studying engineering. Quiet, responsible, and respectful.',
                avatarUrl: 'https://i.pravatar.cc/300?img=33',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'sarah.wilson@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'Sarah',
                lastName: 'Wilson',
                phoneNumber: '+1-416-555-0104',
                dateOfBirth: new Date('1996-05-30'),
                bio: 'Healthcare professional working downtown Toronto. Clean, organized, and friendly. Cat lover!',
                avatarUrl: 'https://i.pravatar.cc/300?img=45',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'david.lee@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'David',
                lastName: 'Lee',
                phoneNumber: '+1-343-555-0105',
                dateOfBirth: new Date('1994-09-12'),
                bio: 'Teacher in Ottawa. Love reading, running, and trying new restaurants. Non-smoker.',
                avatarUrl: 'https://i.pravatar.cc/300?img=51',
                verificationStatus: 'PENDING',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'olivia.martinez@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'Olivia',
                lastName: 'Martinez',
                phoneNumber: '+1-416-555-0106',
                dateOfBirth: new Date('1998-01-25'),
                bio: 'Recent graduate starting a career in finance. Looking for affordable housing in Toronto.',
                avatarUrl: 'https://i.pravatar.cc/300?img=23',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: false,
            },
        }),
        // Property Owners
        prisma.user.create({
            data: {
                email: 'landlord.ottawa@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'Robert',
                lastName: 'Taylor',
                phoneNumber: '+1-613-555-0201',
                dateOfBirth: new Date('1975-04-10'),
                bio: 'Property owner with multiple listings in Ottawa area. Providing quality housing for students and professionals.',
                avatarUrl: 'https://i.pravatar.cc/300?img=60',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'landlord.toronto@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'Patricia',
                lastName: 'Anderson',
                phoneNumber: '+1-416-555-0202',
                dateOfBirth: new Date('1980-08-18'),
                bio: 'Toronto property investor. Offering modern apartments in prime locations.',
                avatarUrl: 'https://i.pravatar.cc/300?img=47',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'owner.kingston@example.com',
                password: hashedPassword,
                role: 'USER',
                firstName: 'James',
                lastName: 'Thompson',
                phoneNumber: '+1-613-555-0203',
                dateOfBirth: new Date('1982-12-05'),
                bio: 'Kingston property owner near Queen\'s University. Family-friendly landlord.',
                avatarUrl: 'https://i.pravatar.cc/300?img=66',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        // Agents
        prisma.user.create({
            data: {
                email: 'agent.ottawa@example.com',
                password: hashedPassword,
                role: 'AGENT',
                firstName: 'Jennifer',
                lastName: 'Clark',
                phoneNumber: '+1-613-555-0301',
                dateOfBirth: new Date('1985-06-20'),
                bio: 'Licensed real estate agent specializing in Ottawa residential rentals. 10+ years of experience.',
                avatarUrl: 'https://i.pravatar.cc/300?img=27',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'agent.toronto@example.com',
                password: hashedPassword,
                role: 'AGENT',
                firstName: 'William',
                lastName: 'Garcia',
                phoneNumber: '+1-416-555-0302',
                dateOfBirth: new Date('1978-02-14'),
                bio: 'Award-winning Toronto real estate agent. Expert in downtown luxury rentals.',
                avatarUrl: 'https://i.pravatar.cc/300?img=70',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
        // Admin
        prisma.user.create({
            data: {
                email: 'admin@cribly.com',
                password: hashedPassword,
                role: 'ADMIN',
                firstName: 'Admin',
                lastName: 'User',
                phoneNumber: '+1-888-555-0000',
                bio: 'System administrator',
                avatarUrl: 'https://i.pravatar.cc/300?img=1',
                verificationStatus: 'VERIFIED',
                emailNotifications: true,
                pushNotifications: true,
            },
        }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create Agent Profiles
    console.log('🏢 Creating agent profiles...');
    const agentProfiles = await Promise.all([
        prisma.agentProfile.create({
            data: {
                userId: users[10].id, // Jennifer Clark
                agencyName: 'Ottawa Elite Realty',
                licenseNumber: 'ON-AGT-2014-5678',
                yearsExperience: 10,
                website: 'https://ottawaeliterealty.com',
                officeAddress: '123 Bank Street, Ottawa, ON K1P 5N2',
                specializations: ['residential', 'student-housing', 'luxury'],
                serviceAreas: ['Ottawa', 'Gatineau', 'Kanata', 'Orleans'],
                commissionRate: 5.00,
                totalListings: 87,
                activeListings: 12,
                successfulDeals: 75,
                averageRating: 4.8,
                isVerifiedAgent: true,
            },
        }),
        prisma.agentProfile.create({
            data: {
                userId: users[11].id, // William Garcia
                agencyName: 'Toronto Premium Properties',
                licenseNumber: 'ON-AGT-2008-1234',
                yearsExperience: 16,
                website: 'https://torontopremiumproperties.com',
                officeAddress: '456 King Street West, Toronto, ON M5V 1L7',
                specializations: ['luxury', 'downtown', 'condos', 'commercial'],
                serviceAreas: ['Toronto', 'Mississauga', 'Vaughan', 'Markham'],
                commissionRate: 6.00,
                totalListings: 156,
                activeListings: 18,
                successfulDeals: 138,
                averageRating: 4.9,
                isVerifiedAgent: true,
            },
        }),
    ]);

    console.log(`✅ Created ${agentProfiles.length} agent profiles`);

    // Create Property Listings
    console.log('🏠 Creating property listings...');
    const listings = await Promise.all([
        // Ottawa Listings
        prisma.propertyListing.create({
            data: {
                ownerId: users[6].id, // Robert Taylor
                title: 'Spacious 2BR Apartment in Downtown Ottawa',
                description: 'Beautiful two-bedroom apartment located in the heart of downtown Ottawa. Walking distance to Parliament Hill, Rideau Centre, and public transit. Features include hardwood floors, modern kitchen, in-unit laundry, and balcony with city views. Perfect for young professionals or students. Heat and water included.',
                propertyType: 'APARTMENT',
                status: 'ACTIVE',
                isRepresentedByAgent: true,
                representingAgentId: users[10].id,
                price: 1850.00,
                currency: 'CAD',
                address: '250 Elgin Street, Unit 805',
                city: 'Ottawa',
                state: 'ON',
                zipCode: 'K2P 1L5',
                country: 'Canada',
                latitude: 45.4215,
                longitude: -75.6972,
                bedrooms: 2,
                bathrooms: 1.0,
                squareFeet: 950,
                furnished: false,
                availableFrom: new Date('2025-11-01'),
                leaseDuration: 12,
                securityDeposit: 1850.00,
                amenities: ['Gym', 'Parking', 'Elevator', 'Balcony', 'In-unit Laundry', 'Concierge'],
                utilities: ['Heat', 'Water'],
                petPolicy: 'Small pets allowed with deposit',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
                ],
                viewCount: 47,
                publishedAt: new Date('2025-10-15'),
            },
        }),
        prisma.propertyListing.create({
            data: {
                ownerId: users[6].id,
                title: 'Modern Studio Near University of Ottawa',
                description: 'Cozy studio apartment perfect for students. Located steps from UOttawa campus. Includes all utilities, WiFi, and furniture. Building has study lounge, gym, and bike storage. Close to Sandy Hill shops and restaurants.',
                propertyType: 'STUDIO',
                status: 'ACTIVE',
                isRepresentedByAgent: false,
                price: 1250.00,
                currency: 'CAD',
                address: '85 University Private',
                city: 'Ottawa',
                state: 'ON',
                zipCode: 'K1N 9A4',
                country: 'Canada',
                latitude: 45.4248,
                longitude: -75.6829,
                bedrooms: 0,
                bathrooms: 1.0,
                squareFeet: 450,
                furnished: true,
                availableFrom: new Date('2025-10-25'),
                leaseDuration: 8,
                securityDeposit: 1250.00,
                amenities: ['Gym', 'WiFi', 'Bike Storage', 'Study Lounge', 'Laundry Facilities'],
                utilities: ['Heat', 'Water', 'Electricity', 'Internet'],
                petPolicy: 'No pets allowed',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1502672023488-70e25813eb80',
                    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9',
                ],
                viewCount: 89,
                publishedAt: new Date('2025-10-10'),
            },
        }),
        prisma.propertyListing.create({
            data: {
                ownerId: users[6].id,
                title: 'Bright 3BR House in Westboro Village',
                description: 'Charming 3-bedroom house in trendy Westboro neighborhood. Updated kitchen and bathrooms, hardwood floors throughout. Large backyard with deck, perfect for entertaining. Walking distance to Westboro Village shops, restaurants, and Ottawa River pathways. Garage parking included.',
                propertyType: 'HOUSE',
                status: 'ACTIVE',
                isRepresentedByAgent: true,
                representingAgentId: users[10].id,
                price: 2800.00,
                currency: 'CAD',
                address: '123 Rosemount Avenue',
                city: 'Ottawa',
                state: 'ON',
                zipCode: 'K1Y 1P4',
                country: 'Canada',
                latitude: 45.4012,
                longitude: -75.7541,
                bedrooms: 3,
                bathrooms: 2.0,
                squareFeet: 1650,
                furnished: false,
                availableFrom: new Date('2025-12-01'),
                leaseDuration: 12,
                securityDeposit: 2800.00,
                amenities: ['Garage', 'Backyard', 'Deck', 'Dishwasher', 'Air Conditioning'],
                utilities: [],
                petPolicy: 'Pets negotiable',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
                ],
                viewCount: 34,
                publishedAt: new Date('2025-10-18'),
            },
        }),

        // Toronto Listings
        prisma.propertyListing.create({
            data: {
                ownerId: users[7].id, // Patricia Anderson
                title: 'Luxury 1BR Condo in King West',
                description: 'Stunning one-bedroom condo in the heart of King West Entertainment District. Floor-to-ceiling windows, modern appliances, granite countertops. Building amenities include 24-hour concierge, rooftop terrace, gym, pool, and party room. Steps from restaurants, bars, and TTC.',
                propertyType: 'CONDO',
                status: 'ACTIVE',
                isRepresentedByAgent: true,
                representingAgentId: users[11].id,
                price: 2400.00,
                currency: 'CAD',
                address: '15 King Street West, Unit 2104',
                city: 'Toronto',
                state: 'ON',
                zipCode: 'M5H 1A1',
                country: 'Canada',
                latitude: 43.6489,
                longitude: -79.3817,
                bedrooms: 1,
                bathrooms: 1.0,
                squareFeet: 650,
                furnished: false,
                availableFrom: new Date('2025-11-15'),
                leaseDuration: 12,
                securityDeposit: 2400.00,
                amenities: ['Gym', 'Pool', 'Concierge', 'Rooftop Terrace', 'Party Room', 'Parking', 'Storage Locker'],
                utilities: [],
                petPolicy: 'No pets allowed',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
                    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc',
                    'https://images.unsplash.com/photo-1600607687644-c7171b42498f',
                ],
                viewCount: 125,
                publishedAt: new Date('2025-10-12'),
            },
        }),
        prisma.propertyListing.create({
            data: {
                ownerId: users[7].id,
                title: '2BR Apartment Near University of Toronto',
                description: 'Well-maintained 2-bedroom apartment near U of T St. George campus. Quiet residential street, perfect for students or academics. Updated kitchen and bathroom, hardwood floors. Close to subway, shops, and cafes. Heat included.',
                propertyType: 'APARTMENT',
                status: 'ACTIVE',
                isRepresentedByAgent: false,
                price: 2200.00,
                currency: 'CAD',
                address: '280 Bloor Street West, Unit 12',
                city: 'Toronto',
                state: 'ON',
                zipCode: 'M5S 1V8',
                country: 'Canada',
                latitude: 43.6677,
                longitude: -79.4044,
                bedrooms: 2,
                bathrooms: 1.0,
                squareFeet: 850,
                furnished: false,
                availableFrom: new Date('2025-11-01'),
                leaseDuration: 12,
                securityDeposit: 2200.00,
                amenities: ['Laundry Facilities', 'Bike Storage', 'Elevator'],
                utilities: ['Heat'],
                petPolicy: 'Cats only',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
                    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4',
                ],
                viewCount: 78,
                publishedAt: new Date('2025-10-14'),
            },
        }),
        prisma.propertyListing.create({
            data: {
                ownerId: users[7].id,
                title: 'Spacious 3BR Townhouse in North York',
                description: 'Family-friendly 3-bedroom townhouse in desirable North York location. Three levels of living space, updated kitchen with stainless appliances, finished basement. Private backyard and garage. Close to schools, parks, shopping, and TTC.',
                propertyType: 'TOWNHOUSE',
                status: 'ACTIVE',
                isRepresentedByAgent: true,
                representingAgentId: users[11].id,
                price: 3200.00,
                currency: 'CAD',
                address: '45 Finch Avenue East',
                city: 'Toronto',
                state: 'ON',
                zipCode: 'M2N 7K9',
                country: 'Canada',
                latitude: 43.7802,
                longitude: -79.4163,
                bedrooms: 3,
                bathrooms: 2.5,
                squareFeet: 1800,
                furnished: false,
                availableFrom: new Date('2025-12-15'),
                leaseDuration: 12,
                securityDeposit: 3200.00,
                amenities: ['Garage', 'Backyard', 'Finished Basement', 'Dishwasher', 'Air Conditioning'],
                utilities: [],
                petPolicy: 'Pets allowed',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
                ],
                viewCount: 56,
                publishedAt: new Date('2025-10-16'),
            },
        }),

        // Kingston Listings
        prisma.propertyListing.create({
            data: {
                ownerId: users[8].id, // James Thompson
                title: 'Student-Friendly 4BR House Near Queen\'s University',
                description: 'Perfect for Queen\'s students! Spacious 4-bedroom house just minutes from campus. Large living areas, fully equipped kitchen, two bathrooms. Washer/dryer included. Plenty of parking. Available for the academic year.',
                propertyType: 'HOUSE',
                status: 'ACTIVE',
                isRepresentedByAgent: false,
                price: 2400.00,
                currency: 'CAD',
                address: '156 Barrie Street',
                city: 'Kingston',
                state: 'ON',
                zipCode: 'K7L 3J8',
                country: 'Canada',
                latitude: 44.2312,
                longitude: -76.4860,
                bedrooms: 4,
                bathrooms: 2.0,
                squareFeet: 1500,
                furnished: false,
                availableFrom: new Date('2025-09-01'),
                leaseDuration: 12,
                securityDeposit: 2400.00,
                amenities: ['Parking', 'Laundry', 'Backyard', 'Dishwasher'],
                utilities: [],
                petPolicy: 'No pets allowed',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
                    'https://images.unsplash.com/photo-1600585154526-990dced4db0d',
                ],
                viewCount: 102,
                publishedAt: new Date('2025-10-05'),
            },
        }),
        prisma.propertyListing.create({
            data: {
                ownerId: users[8].id,
                title: 'Cozy 1BR Apartment in Downtown Kingston',
                description: 'Charming one-bedroom apartment in the heart of downtown Kingston. Walking distance to waterfront, restaurants, and shops. Updated unit with modern fixtures. Perfect for professionals or retirees.',
                propertyType: 'APARTMENT',
                status: 'ACTIVE',
                isRepresentedByAgent: false,
                price: 1400.00,
                currency: 'CAD',
                address: '85 Princess Street, Unit 305',
                city: 'Kingston',
                state: 'ON',
                zipCode: 'K7L 1A5',
                country: 'Canada',
                latitude: 44.2306,
                longitude: -76.4810,
                bedrooms: 1,
                bathrooms: 1.0,
                squareFeet: 600,
                furnished: false,
                availableFrom: new Date('2025-11-01'),
                leaseDuration: 12,
                securityDeposit: 1400.00,
                amenities: ['Elevator', 'Laundry Facilities', 'Parking'],
                utilities: ['Heat', 'Water'],
                petPolicy: 'Small pets allowed',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
                    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab',
                ],
                viewCount: 45,
                publishedAt: new Date('2025-10-17'),
            },
        }),

        // Brockville Listings
        prisma.propertyListing.create({
            data: {
                ownerId: users[8].id,
                title: 'Beautiful 2BR Apartment with River Views',
                description: 'Lovely 2-bedroom apartment overlooking the St. Lawrence River in Brockville. Bright and spacious with large windows. Quiet building, great for professionals. Close to downtown, parks, and amenities.',
                propertyType: 'APARTMENT',
                status: 'ACTIVE',
                isRepresentedByAgent: false,
                price: 1500.00,
                currency: 'CAD',
                address: '10 Water Street, Unit 402',
                city: 'Brockville',
                state: 'ON',
                zipCode: 'K6V 3M4',
                country: 'Canada',
                latitude: 44.5895,
                longitude: -75.6838,
                bedrooms: 2,
                bathrooms: 1.0,
                squareFeet: 800,
                furnished: false,
                availableFrom: new Date('2025-11-15'),
                leaseDuration: 12,
                securityDeposit: 1500.00,
                amenities: ['Parking', 'Balcony', 'Laundry Facilities', 'River View'],
                utilities: ['Heat', 'Water'],
                petPolicy: 'Pets negotiable',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4',
                    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
                ],
                viewCount: 28,
                publishedAt: new Date('2025-10-19'),
            },
        }),
        prisma.propertyListing.create({
            data: {
                ownerId: users[6].id,
                title: 'Affordable 1BR Basement Suite in Brockville',
                description: 'Clean and comfortable basement apartment in quiet residential area. Separate entrance, kitchenette, and bathroom. Perfect for single person or couple. All utilities included. Non-smokers only.',
                propertyType: 'BASEMENT',
                status: 'ACTIVE',
                isRepresentedByAgent: false,
                price: 950.00,
                currency: 'CAD',
                address: '234 King Street West',
                city: 'Brockville',
                state: 'ON',
                zipCode: 'K6V 7B5',
                country: 'Canada',
                latitude: 44.5912,
                longitude: -75.6921,
                bedrooms: 1,
                bathrooms: 1.0,
                squareFeet: 500,
                furnished: true,
                availableFrom: new Date('2025-10-28'),
                leaseDuration: 12,
                securityDeposit: 950.00,
                amenities: ['Separate Entrance', 'Parking', 'Laundry Access'],
                utilities: ['Heat', 'Water', 'Electricity', 'Internet'],
                petPolicy: 'No pets allowed',
                smokingAllowed: false,
                imageUrls: [
                    'https://images.unsplash.com/photo-1554995207-c18c203602cb',
                ],
                viewCount: 67,
                publishedAt: new Date('2025-10-20'),
            },
        }),
    ]);

    console.log(`✅ Created ${listings.length} property listings`);

    // Create Roommate Profiles
    console.log('👫 Creating roommate profiles...');
    const roommateProfiles = await Promise.all([
        prisma.roommateProfile.create({
            data: {
                userId: users[0].id, // John Smith
                bio: 'Software developer, 28 years old. I work from home occasionally but mostly at the office. I\'m clean, respectful, and enjoy a quiet living space. Love weekend hikes and photography.',
                occupation: 'Software Developer',
                employer: 'Tech Solutions Inc.',
                ageRange: '25-30',
                minBudget: 800.00,
                maxBudget: 1200.00,
                preferredMoveInDate: new Date('2025-11-01'),
                leaseTerm: 12,
                smoker: false,
                hasPets: false,
                petTypes: [],
                cleanliness: 'VERY_TIDY',
                sleepSchedule: 'early_bird',
                guestsFrequency: 'rarely',
                workFromHome: true,
                socialLevel: 'introverted',
                preferredGender: ['male', 'no-preference'],
                preferredPropertyTypes: ['APARTMENT', 'CONDO'],
                preferredCities: ['Ottawa', 'Kanata'],
                preferredNeighborhoods: ['Downtown', 'Westboro', 'Hintonburg'],
                preferredAmenities: ['Gym', 'Parking', 'In-unit Laundry', 'WiFi'],
                dealBreakers: ['smoking', 'loud parties', 'uncleanliness'],
                interests: ['Photography', 'Hiking', 'Technology', 'Reading', 'Gaming'],
                languages: ['English', 'French'],
                hobbies: ['Photography', 'Hiking', 'Cooking', 'Video Games'],
                isActive: true,
                hasListing: false,
            },
        }),
        prisma.roommateProfile.create({
            data: {
                userId: users[1].id, // Emma Johnson
                bio: 'Marketing professional, 26 years old. I love cooking, yoga, and social activities. Looking for a fun, responsible roommate who enjoys a clean space but also knows how to have a good time!',
                occupation: 'Marketing Coordinator',
                employer: 'Creative Brands Agency',
                ageRange: '25-30',
                minBudget: 1000.00,
                maxBudget: 1500.00,
                preferredMoveInDate: new Date('2025-12-01'),
                leaseTerm: 12,
                smoker: false,
                hasPets: false,
                petTypes: [],
                cleanliness: 'TIDY',
                sleepSchedule: 'flexible',
                guestsFrequency: 'sometimes',
                workFromHome: false,
                socialLevel: 'extroverted',
                preferredGender: ['female', 'non-binary'],
                preferredPropertyTypes: ['APARTMENT', 'CONDO', 'TOWNHOUSE'],
                preferredCities: ['Toronto', 'Mississauga'],
                preferredNeighborhoods: ['King West', 'Queen West', 'Liberty Village'],
                preferredAmenities: ['Gym', 'Dishwasher', 'Balcony', 'Near Transit'],
                dealBreakers: ['smoking', 'heavy drug use'],
                interests: ['Yoga', 'Cooking', 'Social Events', 'Travel', 'Fitness'],
                languages: ['English'],
                hobbies: ['Yoga', 'Cooking', 'Dining Out', 'Dancing'],
                isActive: true,
                hasListing: false,
            },
        }),
        prisma.roommateProfile.create({
            data: {
                userId: users[2].id, // Michael Brown
                bio: 'Engineering grad student at Queen\'s University. Serious about studies but friendly and easy-going. Looking for a quiet, studious roommate.',
                occupation: 'Graduate Student',
                employer: 'Queen\'s University',
                ageRange: '25-30',
                minBudget: 600.00,
                maxBudget: 900.00,
                preferredMoveInDate: new Date('2025-09-01'),
                leaseTerm: 8,
                smoker: false,
                hasPets: false,
                petTypes: [],
                cleanliness: 'TIDY',
                sleepSchedule: 'night_owl',
                guestsFrequency: 'rarely',
                workFromHome: true,
                socialLevel: 'introverted',
                preferredGender: ['male', 'no-preference'],
                preferredPropertyTypes: ['HOUSE', 'APARTMENT', 'ROOM'],
                preferredCities: ['Kingston'],
                preferredNeighborhoods: ['Near Campus', 'Downtown'],
                preferredAmenities: ['WiFi', 'Study Space', 'Parking'],
                dealBreakers: ['smoking', 'loud parties', 'pets'],
                interests: ['Engineering', 'Research', 'Reading', 'Chess'],
                languages: ['English', 'Mandarin'],
                hobbies: ['Reading', 'Chess', 'Programming', 'Cycling'],
                isActive: true,
                hasListing: false,
            },
        }),
        prisma.roommateProfile.create({
            data: {
                userId: users[3].id, // Sarah Wilson
                bio: 'Healthcare professional, 27 years old. I have a cat named Whiskers. Looking for a pet-friendly place with another responsible professional.',
                occupation: 'Registered Nurse',
                employer: 'Toronto General Hospital',
                ageRange: '25-30',
                minBudget: 1100.00,
                maxBudget: 1600.00,
                preferredMoveInDate: new Date('2025-11-15'),
                leaseTerm: 12,
                smoker: false,
                hasPets: true,
                petTypes: ['cat'],
                cleanliness: 'VERY_TIDY',
                sleepSchedule: 'flexible',
                guestsFrequency: 'sometimes',
                workFromHome: false,
                socialLevel: 'ambivert',
                preferredGender: ['female', 'no-preference'],
                preferredPropertyTypes: ['APARTMENT', 'CONDO'],
                preferredCities: ['Toronto'],
                preferredNeighborhoods: ['Downtown', 'Midtown', 'East York'],
                preferredAmenities: ['In-unit Laundry', 'Dishwasher', 'Parking', 'Pet-Friendly'],
                dealBreakers: ['smoking', 'no-pets-allowed'],
                interests: ['Healthcare', 'Cats', 'Baking', 'Running'],
                languages: ['English'],
                hobbies: ['Baking', 'Running', 'Reading', 'Cat Care'],
                isActive: true,
                hasListing: false,
            },
        }),
        prisma.roommateProfile.create({
            data: {
                userId: users[4].id, // David Lee
                bio: 'Elementary school teacher in Ottawa. Love running, reading, and trying new restaurants. Looking for a clean, quiet place with good people.',
                occupation: 'Teacher',
                employer: 'Ottawa-Carleton District School Board',
                ageRange: '30-35',
                minBudget: 900.00,
                maxBudget: 1300.00,
                preferredMoveInDate: new Date('2025-11-01'),
                leaseTerm: 12,
                smoker: false,
                hasPets: false,
                petTypes: [],
                cleanliness: 'TIDY',
                sleepSchedule: 'early_bird',
                guestsFrequency: 'sometimes',
                workFromHome: false,
                socialLevel: 'ambivert',
                preferredGender: ['no-preference'],
                preferredPropertyTypes: ['APARTMENT', 'HOUSE'],
                preferredCities: ['Ottawa', 'Nepean'],
                preferredNeighborhoods: ['Glebe', 'Westboro', 'Old Ottawa South'],
                preferredAmenities: ['Parking', 'Near Transit', 'Dishwasher'],
                dealBreakers: ['smoking', 'uncleanliness'],
                interests: ['Education', 'Running', 'Reading', 'Food'],
                languages: ['English', 'French'],
                hobbies: ['Running', 'Reading', 'Dining Out', 'Cooking'],
                isActive: true,
                hasListing: false,
            },
        }),
        prisma.roommateProfile.create({
            data: {
                userId: users[5].id, // Olivia Martinez
                bio: 'Recent finance graduate starting my career in Toronto. Budget-conscious but love socializing and meeting new people. Looking for affordable housing with friendly roommates.',
                occupation: 'Financial Analyst',
                employer: 'TD Bank',
                ageRange: '20-25',
                minBudget: 800.00,
                maxBudget: 1200.00,
                preferredMoveInDate: new Date('2025-11-01'),
                leaseTerm: 12,
                smoker: false,
                hasPets: false,
                petTypes: [],
                cleanliness: 'AVERAGE',
                sleepSchedule: 'flexible',
                guestsFrequency: 'often',
                workFromHome: false,
                socialLevel: 'extroverted',
                preferredGender: ['female', 'no-preference'],
                preferredPropertyTypes: ['APARTMENT', 'ROOM', 'BASEMENT'],
                preferredCities: ['Toronto', 'Scarborough', 'Etobicoke'],
                preferredNeighborhoods: ['Near TTC', 'Downtown', 'North York'],
                preferredAmenities: ['Near Transit', 'Laundry', 'WiFi'],
                dealBreakers: ['smoking', 'no social life'],
                interests: ['Finance', 'Socializing', 'Fitness', 'Travel'],
                languages: ['English', 'Spanish'],
                hobbies: ['Gym', 'Socializing', 'Shopping', 'Movies'],
                isActive: true,
                hasListing: false,
            },
        }),
    ]);

    console.log(`✅ Created ${roommateProfiles.length} roommate profiles`);

    // Create Favorites
    console.log('⭐ Creating favorites...');
    const favorites = await Promise.all([
        prisma.favorite.create({
            data: {
                userId: users[0].id, // John Smith
                listingId: listings[0].id, // Ottawa 2BR Apartment
                notes: 'Perfect location for work, close to downtown. Need to schedule a viewing.',
            },
        }),
        prisma.favorite.create({
            data: {
                userId: users[0].id,
                listingId: listings[1].id, // Ottawa Studio
                notes: 'Good backup option if roommate search doesn\'t work out.',
            },
        }),
        prisma.favorite.create({
            data: {
                userId: users[1].id, // Emma Johnson
                listingId: listings[3].id, // Toronto King West Condo
                notes: 'Dream apartment! A bit over budget but worth it for the location.',
            },
        }),
        prisma.favorite.create({
            data: {
                userId: users[1].id,
                listingId: listings[4].id, // Toronto Near U of T
                notes: 'More affordable option. Good location near work.',
            },
        }),
        prisma.favorite.create({
            data: {
                userId: users[2].id, // Michael Brown
                listingId: listings[6].id, // Kingston 4BR House
                notes: 'Great for sharing with other grad students. Very close to campus.',
            },
        }),
        prisma.favorite.create({
            data: {
                userId: users[3].id, // Sarah Wilson
                listingId: listings[4].id, // Toronto Near U of T
                notes: 'Allows cats! Close to the hospital. Perfect!',
            },
        }),
    ]);

    console.log(`✅ Created ${favorites.length} favorites`);

    // Create Connections
    console.log('🤝 Creating connections...');
    const connections = await Promise.all([
        // Connection for listing
        prisma.connection.create({
            data: {
                requesterId: users[0].id, // John Smith
                recipientId: users[6].id, // Robert Taylor (landlord)
                listingId: listings[0].id,
                message: 'Hi! I\'m very interested in your 2BR apartment in downtown Ottawa. I\'m a software developer with stable income and excellent references. Would it be possible to schedule a viewing this week?',
                status: 'ACCEPTED',
                connectionType: 'listing',
                expiresAt: new Date('2025-11-22'),
                respondedAt: new Date('2025-10-21'),
            },
        }),
        prisma.connection.create({
            data: {
                requesterId: users[1].id, // Emma Johnson
                recipientId: users[7].id, // Patricia Anderson (landlord)
                listingId: listings[3].id,
                message: 'Hello! Your King West condo looks amazing. I work in marketing downtown and this location would be perfect for me. Can I come see it?',
                status: 'PENDING',
                connectionType: 'listing',
                expiresAt: new Date('2025-11-22'),
            },
        }),
        // Roommate connections
        prisma.connection.create({
            data: {
                requesterId: users[0].id, // John Smith
                recipientId: users[4].id, // David Lee
                roommateProfileId: roommateProfiles[4].id,
                message: 'Hey David! I see we have similar interests and are both looking in Ottawa. Would you be interested in finding a place together? I\'m clean, quiet, and responsible.',
                status: 'ACCEPTED',
                connectionType: 'roommate',
                expiresAt: new Date('2025-11-22'),
                respondedAt: new Date('2025-10-20'),
            },
        }),
        prisma.connection.create({
            data: {
                requesterId: users[1].id, // Emma Johnson
                recipientId: users[5].id, // Olivia Martinez
                roommateProfileId: roommateProfiles[5].id,
                message: 'Hi Olivia! We\'re both looking for places in Toronto and seem to have compatible lifestyles. Want to grab coffee and discuss possibly being roommates?',
                status: 'ACCEPTED',
                connectionType: 'roommate',
                expiresAt: new Date('2025-11-22'),
                respondedAt: new Date('2025-10-21'),
            },
        }),
        prisma.connection.create({
            data: {
                requesterId: users[2].id, // Michael Brown
                recipientId: users[0].id, // John Smith
                roommateProfileId: roommateProfiles[0].id,
                message: 'Hi John, fellow quiet professional here. Interested in sharing a place?',
                status: 'DECLINED',
                connectionType: 'roommate',
                expiresAt: new Date('2025-11-22'),
                respondedAt: new Date('2025-10-19'),
                declineReason: 'Found a place in Kingston, but thank you!',
            },
        }),
    ]);

    console.log(`✅ Created ${connections.length} connections`);

    // Create Conversations and Messages for accepted connections
    console.log('💬 Creating conversations and messages...');

    // Conversation 1: John Smith <-> Robert Taylor (Listing)
    const conversation1 = await prisma.conversation.create({
        data: {
            connectionId: connections[0].id,
            members: {
                create: [
                    {
                        userId: users[0].id,
                        lastReadAt: new Date(),
                    },
                    {
                        userId: users[6].id,
                        lastReadAt: new Date(),
                    },
                ],
            },
            messages: {
                create: [
                    {
                        senderId: users[6].id,
                        content: 'Hi John! Thank you for your interest. I\'d be happy to show you the apartment. Are you available this Thursday at 5 PM?',
                        isRead: true,
                        readAt: new Date('2025-10-21T14:30:00'),
                        createdAt: new Date('2025-10-21T14:00:00'),
                    },
                    {
                        senderId: users[0].id,
                        content: 'Thursday at 5 PM works perfectly for me! What\'s the best way to access the building?',
                        isRead: true,
                        readAt: new Date('2025-10-21T15:30:00'),
                        createdAt: new Date('2025-10-21T15:00:00'),
                    },
                    {
                        senderId: users[6].id,
                        content: 'Great! Just come to the main entrance on Elgin Street. I\'ll meet you in the lobby. Looking forward to meeting you!',
                        isRead: true,
                        readAt: new Date('2025-10-21T16:00:00'),
                        createdAt: new Date('2025-10-21T15:45:00'),
                    },
                ],
            },
        },
    });

    // Conversation 2: John Smith <-> David Lee (Roommate)
    const conversation2 = await prisma.conversation.create({
        data: {
            connectionId: connections[2].id,
            members: {
                create: [
                    {
                        userId: users[0].id,
                        lastReadAt: new Date(),
                    },
                    {
                        userId: users[4].id,
                        lastReadAt: new Date('2025-10-21T12:00:00'),
                    },
                ],
            },
            messages: {
                create: [
                    {
                        senderId: users[4].id,
                        content: 'Hi John! Yes, I\'d definitely be interested in finding a place together. Your profile looks great and we seem very compatible!',
                        isRead: true,
                        readAt: new Date('2025-10-20T11:00:00'),
                        createdAt: new Date('2025-10-20T10:30:00'),
                    },
                    {
                        senderId: users[0].id,
                        content: 'Awesome! I was thinking we could look at 2BR apartments in the $1800-2000 range so we\'d each pay around $900-1000. Does that work with your budget?',
                        isRead: true,
                        readAt: new Date('2025-10-20T14:00:00'),
                        createdAt: new Date('2025-10-20T13:00:00'),
                    },
                    {
                        senderId: users[4].id,
                        content: 'Perfect! That\'s right in my range. I saw a nice place in Westboro. Should we set up some viewings?',
                        isRead: true,
                        readAt: new Date('2025-10-21T09:00:00'),
                        createdAt: new Date('2025-10-20T16:00:00'),
                    },
                    {
                        senderId: users[0].id,
                        content: 'Definitely! I\'m free this weekend. Want to meet up Saturday morning to check out a few places?',
                        isRead: false,
                        createdAt: new Date('2025-10-21T10:00:00'),
                    },
                ],
            },
        },
    });

    // Conversation 3: Emma Johnson <-> Olivia Martinez (Roommate)
    const conversation3 = await prisma.conversation.create({
        data: {
            connectionId: connections[3].id,
            members: {
                create: [
                    {
                        userId: users[1].id,
                        lastReadAt: new Date(),
                    },
                    {
                        userId: users[5].id,
                        lastReadAt: new Date(),
                    },
                ],
            },
            messages: {
                create: [
                    {
                        senderId: users[5].id,
                        content: 'Hi Emma! I\'d love to meet up! I\'m new to Toronto and looking for a place with someone fun to live with. Coffee sounds great!',
                        isRead: true,
                        readAt: new Date('2025-10-21T10:00:00'),
                        createdAt: new Date('2025-10-21T09:00:00'),
                    },
                    {
                        senderId: users[1].id,
                        content: 'Yay! How about this Saturday at 2 PM? There\'s a great coffee shop in Liberty Village we could meet at.',
                        isRead: true,
                        readAt: new Date('2025-10-21T12:00:00'),
                        createdAt: new Date('2025-10-21T11:00:00'),
                    },
                    {
                        senderId: users[5].id,
                        content: 'Saturday at 2 works for me! Send me the address when you get a chance. So excited!',
                        isRead: true,
                        readAt: new Date('2025-10-21T13:00:00'),
                        createdAt: new Date('2025-10-21T12:30:00'),
                    },
                ],
            },
        },
    });

    console.log(`✅ Created 3 conversations with messages`);

    // Create Notifications
    console.log('🔔 Creating notifications...');
    const notifications = await Promise.all([
        // New connection requests
        prisma.notification.create({
            data: {
                userId: users[6].id,
                type: 'CONNECTION_REQUEST',
                channel: 'IN_APP',
                title: 'New Connection Request',
                message: 'John Smith is interested in your property at 250 Elgin Street',
                data: {
                    connectionId: connections[0].id,
                    listingId: listings[0].id,
                },
                isRead: true,
                readAt: new Date('2025-10-21T13:00:00'),
                createdAt: new Date('2025-10-21T12:00:00'),
            },
        }),
        prisma.notification.create({
            data: {
                userId: users[7].id,
                type: 'CONNECTION_REQUEST',
                channel: 'IN_APP',
                title: 'New Connection Request',
                message: 'Emma Johnson is interested in your property at 15 King Street West',
                data: {
                    connectionId: connections[1].id,
                    listingId: listings[3].id,
                },
                isRead: false,
                createdAt: new Date('2025-10-22T09:00:00'),
            },
        }),
        // Connection accepted
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'CONNECTION_ACCEPTED',
                channel: 'IN_APP',
                title: 'Connection Accepted',
                message: 'Robert Taylor accepted your connection request',
                data: {
                    connectionId: connections[0].id,
                },
                isRead: true,
                readAt: new Date('2025-10-21T14:00:00'),
                createdAt: new Date('2025-10-21T13:30:00'),
            },
        }),
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'CONNECTION_ACCEPTED',
                channel: 'EMAIL',
                title: 'Connection Accepted',
                message: 'David Lee accepted your roommate connection request',
                data: {
                    connectionId: connections[2].id,
                },
                isRead: true,
                readAt: new Date('2025-10-20T11:00:00'),
                createdAt: new Date('2025-10-20T10:30:00'),
            },
        }),
        // New messages
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'NEW_MESSAGE',
                channel: 'IN_APP',
                title: 'New Message',
                message: 'You have a new message from Robert Taylor',
                data: {
                    conversationId: conversation1.id,
                },
                isRead: true,
                readAt: new Date('2025-10-21T14:05:00'),
                createdAt: new Date('2025-10-21T14:00:00'),
            },
        }),
        prisma.notification.create({
            data: {
                userId: users[4].id,
                type: 'NEW_MESSAGE',
                channel: 'IN_APP',
                title: 'New Message',
                message: 'You have a new message from John Smith',
                data: {
                    conversationId: conversation2.id,
                },
                isRead: false,
                createdAt: new Date('2025-10-21T10:00:00'),
            },
        }),
        // Profile views
        prisma.notification.create({
            data: {
                userId: users[1].id,
                type: 'PROFILE_VIEW',
                channel: 'IN_APP',
                title: 'Profile View',
                message: 'Olivia Martinez viewed your roommate profile',
                isRead: true,
                readAt: new Date('2025-10-21T08:00:00'),
                createdAt: new Date('2025-10-21T07:30:00'),
            },
        }),
        // Listing views
        prisma.notification.create({
            data: {
                userId: users[6].id,
                type: 'LISTING_VIEW',
                channel: 'IN_APP',
                title: 'Listing View',
                message: 'Your listing at 250 Elgin Street has been viewed 5 times today',
                isRead: false,
                createdAt: new Date('2025-10-22T08:00:00'),
            },
        }),
        // Verification complete
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'VERIFICATION_COMPLETE',
                channel: 'EMAIL',
                title: 'Verification Complete',
                message: 'Your identity verification has been approved! You now have a verified badge on your profile.',
                isRead: true,
                readAt: new Date('2025-10-15T12:00:00'),
                createdAt: new Date('2025-10-15T11:30:00'),
            },
        }),
    ]);

    console.log(`✅ Created ${notifications.length} notifications`);

    // Create Verification Attempts
    console.log('📝 Creating verification attempts...');
    const verificationAttempts = await Promise.all([
        prisma.verificationAttempt.create({
            data: {
                userId: users[0].id,
                verificationToken: 'VT-' + Math.random().toString(36).substr(2, 9),
                status: 'VERIFIED',
                documentUrl: 'https://storage.example.com/verifications/john-smith-id.jpg',
                faceImageUrl: 'https://storage.example.com/verifications/john-smith-face.jpg',
                expiresAt: new Date('2025-10-25'),
                completedAt: new Date('2025-10-15T11:30:00'),
                createdAt: new Date('2025-10-15T10:00:00'),
            },
        }),
        prisma.verificationAttempt.create({
            data: {
                userId: users[1].id,
                verificationToken: 'VT-' + Math.random().toString(36).substr(2, 9),
                status: 'VERIFIED',
                documentUrl: 'https://storage.example.com/verifications/emma-johnson-id.jpg',
                faceImageUrl: 'https://storage.example.com/verifications/emma-johnson-face.jpg',
                expiresAt: new Date('2025-10-28'),
                completedAt: new Date('2025-10-18T14:20:00'),
                createdAt: new Date('2025-10-18T13:00:00'),
            },
        }),
        prisma.verificationAttempt.create({
            data: {
                userId: users[4].id,
                verificationToken: 'VT-' + Math.random().toString(36).substr(2, 9),
                status: 'PENDING',
                documentUrl: 'https://storage.example.com/verifications/david-lee-id.jpg',
                faceImageUrl: 'https://storage.example.com/verifications/david-lee-face.jpg',
                expiresAt: new Date('2025-10-30'),
                createdAt: new Date('2025-10-22T08:00:00'),
            },
        }),
    ]);

    console.log(`✅ Created ${verificationAttempts.length} verification attempts`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Agent Profiles: ${agentProfiles.length}`);
    console.log(`   🏠 Property Listings: ${listings.length}`);
    console.log(`   👫 Roommate Profiles: ${roommateProfiles.length}`);
    console.log(`   ⭐ Favorites: ${favorites.length}`);
    console.log(`   🤝 Connections: ${connections.length}`);
    console.log(`   💬 Conversations: 3`);
    console.log(`   🔔 Notifications: ${notifications.length}`);
    console.log(`   📝 Verification Attempts: ${verificationAttempts.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Email: john.smith@example.com');
    console.log('   Password: Password123!');
    console.log('\n   (All users have the same password)');
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
