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

**Authentication & Security:**
- **Centralized Auth Middleware**: New operator verification and admin endpoints use `requireAuth` middleware that validates sessions and confirms user exists in database before allowing access
- **Role-Based Access Control**: `requireRole` middleware enforces admin/business role requirements for sensitive admin endpoints
- **Rate Limiting**: Email verification endpoints protected with rate limiting (5 send attempts / 15 minutes, 10 verify attempts / 15 minutes) to prevent brute-force attacks
- **Session Validation**: All new auth endpoints validate `req.session` contains valid userId and cross-reference with users table
- **Technical Debt**: Existing routes (100+ endpoints) still use legacy `req.sessionData?.userId || req.session?.userId` pattern without centralized middleware. Future work should migrate existing routes to use new auth middleware for consistent security across the application.

### Data Model
The data model includes a service request schema with fields for `serviceType`, `isEmergency`, `description`, `location`, `status`, and a JSONB `details` field. Operator profiles store `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`. Emergency system tables include `emergencyRequests` and `dispatchQueue`. Earnings tracking involves `operatorDailyEarnings`, `operatorMonthlyEarnings`, and `operatorTierStats` for lifetime statistics and customer group unlocking.

**Operator Authentication Tables:**
- `operatorApplications`: Tracks tier application submissions with fields for `applicationId`, `userId`, `tier`, `status`, `submittedAt`, `reviewedAt`, `reviewerId`, `rejectionReason`, `identityVerification` (JSONB), and `notes`
- `applicationDocuments`: Stores uploaded verification documents with `documentId`, `applicationId`, `documentType`, `documentUrl`, `fileName`, `fileSize`, and `mimeType`
- `verificationTokens`: Email/SMS verification tokens with `tokenId`, `userId`, `token`, `type`, `verified` status, `expiresAt`, and `verifiedAt` timestamps

### Feature Highlights
- **Quote-Based Negotiation System**: Operators submit quotes (tracked by string `requestId`), and customers review, accept, decline, or counter them within a 12-hour expiry window. Backend routes support both numeric and string ID lookups for flexibility, always normalizing to string requestId for quote operations. Quote buttons disable after submission to prevent duplicates. Includes idempotent accept endpoints (`/api/quotes/:quoteId/accept` and `/api/quotes/:quoteId/respond`) that prevent duplicate job creation on retry scenarios.
- **Comprehensive Notification System**: Real-time notifications for all customer-operator interactions. When operators submit quotes, customers receive notifications. When customers accept/decline quotes, both parties receive notifications with complete context (quote amount, operator name, job details). All notifications persist to database with 7-day expiry and include metadata for rich frontend display.
- **Operator Authentication & Verification System**: Comprehensive tier-based verification system for all three operator tiers (Manual, Skilled & Equipped, Professional). Features include:
  - **Email Verification**: 6-digit code verification required before accepting jobs, with 15-minute token expiry
  - **Tier Application Tracking**: Database-backed applications for each tier with status tracking (pending, under_review, approved, rejected, additional_info_required)
  - **Auto-Application Creation**: Applications automatically created when operators access tier dashboards
  - **Verification Status Display**: Real-time tier status badges showing "Verified", "Pending", "Waiting for Authentication", or "Under Review"
  - **Job Access Control**: Operators can only accept jobs after email verification and tier approval
  - **Admin Review Interface**: Backend endpoints for admin approval/rejection of tier applications
  - **Document Upload Support**: Application document tracking with URL-based storage
  - **Security**: Admin-only routes with role-based access control
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