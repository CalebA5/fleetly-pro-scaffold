# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It operates as a two-sided marketplace with distinct dashboards for customers and operators, focusing on real-time booking, job tracking, and professional service delivery. The platform aims to provide a seamless, efficient booking experience, supporting multi-driver business management, a three-tier operator system with proximity-based job filtering, and an emergency SOS mode for urgent no-login assistance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, Radix UI primitives, shadcn/ui, and Tailwind CSS. State management employs TanStack Query for server state and React Hook Form with Zod for form validation. Key features include distinct customer/operator dashboards, an AI-powered service assistant, enhanced service request creation, a unified landing page, and dynamic authentication for multiple user roles, with mobile-first optimizations. UI design is inspired by Uber, featuring a black-and-white color scheme with orange accents, minimal design, bold typography, adaptive theming with seasonal palettes and dark mode, and custom CSS animations for smooth transitions. First-time user experience includes a LocationPermissionModal for location access and progressive disclosure of features.

### Backend
The backend is an Express.js server utilizing a PostgreSQL database with Drizzle ORM for data persistence. Zod is used for schema validation. API endpoints are RESTful under the `/api` prefix, with centralized error handling.

### Data Model
The data model includes a service request schema with fields for `serviceType`, `isEmergency`, `description`, `location`, `status`, and a JSONB `details` field. Operator profiles store `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`. Emergency system tables include `emergencyRequests` and `dispatchQueue`. Earnings tracking involves `operatorDailyEarnings`, `operatorMonthlyEarnings`, and `operatorTierStats` for lifetime statistics and customer group unlocking.

### Feature Highlights
- **Quote-Based Negotiation System**: Operators submit quotes (tracked by string `requestId`), and customers review, accept, decline, or counter them within a 12-hour expiry window. Backend routes support both numeric and string ID lookups for flexibility, always normalizing to string requestId for quote operations. Quote buttons disable after submission to prevent duplicates. Includes idempotent accept endpoints (`/api/quotes/:quoteId/accept` and `/api/quotes/:quoteId/respond`) that prevent duplicate job creation on retry scenarios.
- **Comprehensive Notification System**: Real-time notifications for all customer-operator interactions. When operators submit quotes, customers receive notifications. When customers accept/decline quotes, both parties receive notifications with complete context (quote amount, operator name, job details). All notifications persist to database with 7-day expiry and include metadata for rich frontend display.
- **Multi-Driver Business Management System**: Enables businesses to manage drivers and assign services.
- **Three-Tier Operator System**: Professional, Skilled & Equipped, and Manual Operators with tier-specific onboarding and proximity-based job filtering.
- **AI Assist Feature**: Recommends services and operators with estimated pricing.
- **Enhanced Service Request Creation**: Dynamic forms for service types, emergency/scheduled toggles, and photo uploads.
- **Unified Map Implementation**: Mapbox GL JS for interactive operator selection, filters, and color-coded tier badges.
- **Customer Features**: "Favorite Drivers," post-service rating, and optimized profile.
- **Real-Time Tracking**: Live operator location updates and real-time tracking for emergency requests.
- **Multi-Vehicle Management System**: Allows operators to manage multiple vehicles.
- **Proactive Weather Alert System**: Integration with the National Weather Service API.
- **Emergency SOS Mode**: No-login emergency assistance with auto-location detection and proximity-based operator notification.
- **Persistent Job Tracking System**: Database-backed job persistence across sessions, with comprehensive job details and progress tracking. Prevents operators from working on multiple tiers simultaneously.
- **Database Persistence for Earnings**: Daily and monthly earnings stored using atomic upserts.
- **Customer Groups Unlock System**: Gamified access to "Nearby Customer Groups" after completing 5 jobs per tier.
- **User Verification & Duplicate Prevention System**: Comprehensive signup verification preventing duplicate accounts via email and name normalization, with real-time debounced validation.
- **Job History Feature**: Dedicated page for operators to view completed jobs with earnings, pagination, and filtering.
- **Customer Job Tracking System**: Real-time job tracking for customers with live updates, operator metadata, and contact information visibility after quote acceptance.
- **Operator-User Linkage Security**: Secure linking of operators to user accounts via authenticated sessions and email validation.
- **Accurate Location Positioning System**: Comprehensive location handling with context-driven architecture. Features include:
  - **LocationContext**: Centralized location state management with refreshLocation() returning fresh GPS position and formatted address, reverseGeocode() providing street-level addresses (zoom=16), and markPermission()/markPrompted() helpers for localStorage flags
  - **Smart Permission Handling**: Only PERMISSION_DENIED errors reset permission state; transient errors (TIMEOUT, POSITION_UNAVAILABLE) show retry UI without modal dismissal
  - **Location Icon Primary Function**: Displays/updates current location without triggering permission loops after initial grant
  - **Auto-Population Logic**: Smart priority (1) Manual entry, (2) Shared GPS location, (3) Geocoded address, (4) Prompt for location
  - **Persistent Storage**: Browser localStorage for location, formattedAddress, granted, and prompted flags
  - **50km Radius Filtering**: Proximity-based operator matching for customer requests
- **Drive & Earn Two-Section Layout** (Nov 24, 2025): Refactored operator onboarding page to implement conditional two-section layout matching published version. Features include:
  - **tierFeatureMap**: Hard-coded feature metadata (features array, rate multiplier, service radius, requirements) for each tier
  - **Derived Tier Arrays**: subscribedTiers and availableTiers with null guards for safe conditional rendering
  - **Section 1**: Subscribed tier cards showing job stats, earnings, and achievement badges for returning operators
  - **Section 2**: "Available Tiers to Add" heading with unsubscribed tier cards showing "+ Add This Tier" badges
  - **Section 3**: All three tiers displayed for first-time operators with feature lists and requirements
  - **renderAvailableTierCard()**: New function rendering tier cards with features from tierFeatureMap for unregistered tiers

## Operator Authentication & Verification System

### Overview
New operators sign up with zero tiers and must complete onboarding for each tier they wish to join. The system supports manual approval/verification of operator credentials before they can access tier-specific dashboards and start earning.

### Signup Flow
1. **Registration**: User signs up as "operator" role with validated email and password
   - Email is case-insensitive (normalized to lowercase)
   - Password requirements: minimum 8 characters, must contain letters and numbers
   - Password visibility toggle available for user convenience
   - No tiers assigned by default (`subscribedTiers: []`)
2. **Tier Selection**: User redirected to `/drive-earn` to choose from 3 available tiers
3. **Onboarding**: User completes tier-specific onboarding form at `/operator/onboarding`
4. **Verification**: Tier enters "pending" approval status awaiting admin verification
5. **Dashboard Access**: Once approved, user can access tier-specific dashboard

### Tier Verification States
Each tier in `operatorTierProfiles` supports the following `approvalStatus` values:
- `not_submitted`: Tier exists but onboarding not completed
- `pending`: Onboarding submitted, awaiting verification
- `under_review`: Admin is actively reviewing credentials
- `approved`: Verified - operator can earn in this tier
- `rejected`: Credentials rejected with `rejectionReason` provided

### Managing Operator Verification

#### Current System (Database-Based)
Tier approval status is stored in the `operatorTierProfiles` JSONB field in the `operators` table. Each tier profile contains:
```json
{
  "manual": {
    "tier": "manual",
    "subscribed": true,
    "onboardingCompleted": true,
    "onboardedAt": "2025-11-24T10:30:00Z",
    "approvalStatus": "pending",
    "approvalSubmittedAt": "2025-11-24T10:30:00Z",
    "approvedAt": null,
    "rejectionReason": null,
    "canEarn": false
  }
}
```

#### Verification Workflow
**Option 1: Direct Database Access (Recommended for MVP)**
1. Access the production database via Replit's Database pane
2. Query operators awaiting verification:
   ```sql
   SELECT operator_id, name, email, operator_tier_profiles
   FROM operators
   WHERE operator_tier_profiles IS NOT NULL;
   ```
3. Manually update approval status for specific operators:
   ```sql
   UPDATE operators
   SET operator_tier_profiles = jsonb_set(
     operator_tier_profiles,
     '{manual,approvalStatus}',
     '"approved"'
   )
   WHERE operator_id = 'op-example-123';
   ```

**Option 2: Admin Dashboard (Future Enhancement)**
Create an admin panel at `/admin/operator-verification` that:
- Lists all operators with pending verification
- Shows submitted documents and credentials
- Provides approve/reject buttons
- Sends email notifications on status changes

#### Email Notifications Setup
For seamless onboarding, integrate an email service (Resend, SendGrid, or AWS SES via Replit integrations):
1. **Submission Confirmation**: Send email when operator submits tier onboarding
2. **Approval Notification**: Notify operator when tier is approved
3. **Rejection Notice**: Explain reason if credentials are rejected
4. **Dashboard Access**: Include direct link to tier dashboard upon approval

### Security & Validation
- **Email Normalization**: All emails stored and compared in lowercase to prevent duplicate accounts (e.g., `User@Email.com` and `user@email.com` are treated as identical)
- **Password Security**: Passwords are case-sensitive, hashed with bcrypt (10 rounds), never stored in plaintext
- **Duplicate Prevention**: Email and name similarity checks prevent multiple accounts per person
- **Session Management**: 30-day sessions with httpOnly cookies
- **Tier Isolation**: Operators cannot work on multiple tiers simultaneously (active tier tracking)

### Current Limitations & Recommendations
1. **Manual Verification Required**: No automated background checks integrated (future: integrate with verification APIs)
2. **Email Notifications**: Currently no email system (recommendation: add Resend integration)
3. **Document Storage**: Onboarding documents not yet uploaded to cloud storage (future: integrate Replit Object Storage)
4. **Admin Access**: No built-in admin dashboard - use database pane or build custom `/admin` routes

### Next Steps for Production
1. Set up email notification system (use `search_integrations` to find email service)
2. Create admin verification dashboard
3. Implement document upload and storage for licenses/certifications
4. Add webhook for background check integration
5. Build operator notification system for status updates

## External Dependencies

**UI & Interaction Libraries:**
- `@radix-ui/react-*` (Radix UI primitives)
- `embla-carousel-react`
- `cmdk`
- `input-otp`
- `lucide-react`
- `date-fns`
- `vaul`
- `mapbox-gl`

**Data & Validation:**
- `drizzle-orm`
- `drizzle-zod`
- `zod`
- `@tanstack/react-query`

**APIs:**
- OpenStreetMap Nominatim API (for geocoding and reverse geocoding)
- National Weather Service API (for weather alerts)