# Seed Data Documentation

This document describes the comprehensive seed data created for the Cribly application, covering all schema entities and their relationships.

## Overview

The seed data includes realistic test data for properties in Canadian cities:
- **Ottawa, ON**
- **Toronto, ON**
- **Kingston, ON**
- **Brockville, ON**

## Running the Seed

```bash
# Run the seed script
npx prisma db seed

# Or reset database and seed
npx prisma migrate reset
```

## Test Credentials

All users have the same password for testing purposes:

- **Email**: Various (see users below)
- **Password**: `Password123!`

## Data Summary

### 👥 Users (12 total)

#### Regular Users (6)
1. **John Smith** - `john.smith@example.com`
   - Software developer in Ottawa
   - Verified, has roommate profile
   - Looking for housing in Ottawa

2. **Emma Johnson** - `emma.johnson@example.com`
   - Marketing coordinator in Toronto
   - Verified, has roommate profile
   - Looking for housing in Toronto

3. **Michael Brown** - `michael.brown@example.com`
   - Graduate student at Queen's University
   - Verified, has roommate profile
   - Looking for housing in Kingston

4. **Sarah Wilson** - `sarah.wilson@example.com`
   - Healthcare professional in Toronto
   - Verified, has roommate profile, has a cat
   - Looking for pet-friendly housing

5. **David Lee** - `david.lee@example.com`
   - Teacher in Ottawa
   - Verification pending, has roommate profile
   - Looking for housing in Ottawa

6. **Olivia Martinez** - `olivia.martinez@example.com`
   - Financial analyst in Toronto
   - Verified, has roommate profile
   - Budget-conscious, looking for affordable housing

#### Property Owners (3)
7. **Robert Taylor** - `landlord.ottawa@example.com`
   - Multiple listings in Ottawa area
   - Verified

8. **Patricia Anderson** - `landlord.toronto@example.com`
   - Toronto property investor
   - Verified

9. **James Thompson** - `owner.kingston@example.com`
   - Kingston property owner
   - Verified

#### Real Estate Agents (2)
10. **Jennifer Clark** - `agent.ottawa@example.com`
    - Ottawa Elite Realty
    - 10 years experience
    - License: ON-AGT-2014-5678
    - Rating: 4.8/5.0

11. **William Garcia** - `agent.toronto@example.com`
    - Toronto Premium Properties
    - 16 years experience
    - License: ON-AGT-2008-1234
    - Rating: 4.9/5.0

#### Admin (1)
12. **Admin User** - `admin@cribly.com`
    - System administrator

### 🏠 Property Listings (10 total)

#### Ottawa (3 listings)
1. **2BR Apartment in Downtown Ottawa** - $1,850 CAD
   - 250 Elgin Street
   - Represented by Jennifer Clark
   - Active, 47 views

2. **Modern Studio Near University of Ottawa** - $1,250 CAD
   - 85 University Private
   - Furnished, utilities included
   - Active, 89 views

3. **3BR House in Westboro Village** - $2,800 CAD
   - 123 Rosemount Avenue
   - Represented by Jennifer Clark
   - Active, 34 views

#### Toronto (3 listings)
4. **Luxury 1BR Condo in King West** - $2,400 CAD
   - 15 King Street West
   - Represented by William Garcia
   - Active, 125 views

5. **2BR Apartment Near University of Toronto** - $2,200 CAD
   - 280 Bloor Street West
   - Heat included
   - Active, 78 views

6. **3BR Townhouse in North York** - $3,200 CAD
   - 45 Finch Avenue East
   - Represented by William Garcia
   - Active, 56 views

#### Kingston (2 listings)
7. **4BR House Near Queen's University** - $2,400 CAD
   - 156 Barrie Street
   - Perfect for students
   - Active, 102 views

8. **1BR Apartment in Downtown Kingston** - $1,400 CAD
   - 85 Princess Street
   - Utilities included
   - Active, 45 views

#### Brockville (2 listings)
9. **2BR Apartment with River Views** - $1,500 CAD
   - 10 Water Street
   - St. Lawrence River views
   - Active, 28 views

10. **1BR Basement Suite in Brockville** - $950 CAD
    - 234 King Street West
    - Furnished, all utilities included
    - Active, 67 views

### 👫 Roommate Profiles (6)

All profiles include:
- Personal preferences (budget, move-in date, lifestyle)
- Cleanliness level and sleep schedule
- Pet ownership and pet preferences
- Preferred locations and amenities
- Deal breakers
- Interests and hobbies

### 🤝 Connections (5)

1. **John Smith → Robert Taylor** (ACCEPTED)
   - Listing connection for Ottawa 2BR apartment
   - Has active conversation

2. **Emma Johnson → Patricia Anderson** (PENDING)
   - Listing connection for Toronto King West condo

3. **John Smith → David Lee** (ACCEPTED)
   - Roommate connection
   - Has active conversation with 4 messages

4. **Emma Johnson → Olivia Martinez** (ACCEPTED)
   - Roommate connection
   - Has active conversation

5. **Michael Brown → John Smith** (DECLINED)
   - Roommate connection
   - Declined with reason

### 💬 Conversations (3)

1. **John Smith & Robert Taylor**
   - 3 messages
   - Discussing property viewing

2. **John Smith & David Lee**
   - 4 messages (1 unread)
   - Discussing roommate arrangement

3. **Emma Johnson & Olivia Martinez**
   - 3 messages
   - Planning to meet for coffee

### ⭐ Favorites (6)

- John Smith: 2 favorites (Ottawa listings)
- Emma Johnson: 2 favorites (Toronto listings)
- Michael Brown: 1 favorite (Kingston house)
- Sarah Wilson: 1 favorite (Toronto apartment - cat-friendly)

### 🔔 Notifications (9)

Various notification types:
- Connection requests (2)
- Connection accepted (2)
- New messages (2)
- Profile views (1)
- Listing views (1)
- Verification complete (1)

### 📝 Verification Attempts (3)

1. John Smith - VERIFIED
2. Emma Johnson - VERIFIED
3. David Lee - PENDING

## Relationships Covered

- ✅ Users → Roommate Profiles
- ✅ Users → Agent Profiles
- ✅ Users → Property Listings (ownership)
- ✅ Agents → Property Listings (representation)
- ✅ Users → Favorites → Property Listings
- ✅ Users → Connections (requester & recipient)
- ✅ Connections → Property Listings
- ✅ Connections → Roommate Profiles
- ✅ Connections → Conversations
- ✅ Conversations → Messages
- ✅ Conversations → Conversation Members
- ✅ Users → Notifications
- ✅ Users → Verification Attempts

## Testing Scenarios

### Frontend Testing

1. **Property Search**
   - Search by city (Ottawa, Toronto, Kingston, Brockville)
   - Filter by price range
   - Filter by property type
   - View property details with images

2. **User Authentication**
   - Login with any user email (password: Password123!)
   - Test different user roles (USER, AGENT, ADMIN)

3. **Roommate Matching**
   - View roommate profiles
   - Send connection requests
   - Accept/decline connections

4. **Messaging**
   - View existing conversations
   - Send new messages
   - Mark messages as read

5. **Favorites**
   - Add/remove favorites
   - View favorite listings

6. **Notifications**
   - View all notifications
   - Mark as read
   - Filter by type

7. **Agent Features**
   - View agent profiles
   - See agent-represented listings
   - Check agent statistics

8. **Verification Status**
   - View verified users
   - See pending verifications

## Notes

- All coordinates (latitude/longitude) are approximate real locations
- All phone numbers use Canadian format
- All prices are in CAD
- Property images use Unsplash placeholder URLs
- Avatar images use pravatar.cc placeholder URLs
- All data is fictional and for testing purposes only

## Cleaning the Database

To remove all seed data and start fresh:

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Run the seed script again
