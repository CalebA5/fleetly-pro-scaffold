# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It operates as a two-sided marketplace with distinct customer and operator dashboards. The platform focuses on real-time booking, job tracking, and professional service delivery, supporting multi-driver business management, a three-tier operator system with proximity-based job filtering, and an emergency SOS mode. Its vision is to provide a seamless, efficient booking experience for on-demand services.

## User Preferences
Preferred communication style: Simple, everyday language.

## Current Task Status (Session Notes)

### Test Accounts (Password: Test1234!)
- **Customers**: customer.alice@fleetly.test, customer.bob@fleetly.test, customer.carol@fleetly.test, customer.david@fleetly.test
- **Operators**: operator.emma@fleetly.test, operator.frank@fleetly.test, operator.grace@fleetly.test, operator.henry@fleetly.test
- **Admin**: admin@fleetly.test (has is_admin=1)

### Admin Portal (/admin)
The admin portal is at `client/src/pages/admin/AdminPortal.tsx`. It allows admins to:
1. View pending operator tier applications
2. Approve operators for specific tiers via POST `/api/admin/operators/:operatorId/approve/:tier`
3. Reject operators with reason via POST `/api/admin/operators/:operatorId/reject/:tier`
4. See stats for pending reviews, total tiers awaiting, and action required counts

**How to Verify Operators**:
1. Login with admin@fleetly.test (Test1234!)
2. Navigate to /admin
3. You'll see a list of operators with pending tier applications
4. Each operator card shows their tier profiles with "Approve" and "Reject" buttons
5. Click Approve to activate a tier, or Reject (with reason) to deny

### Operator Onboarding Flow (Current)
Located at `client/src/pages/operator/OperatorOnboarding.tsx`:
- Step 0: Tier selection (skipped if tier param in URL)
- Step 1: Contact/Business Info
- Step 2: Vehicle details (pro/equipped) OR Equipment (manual)
- Step 3: Services (pro/equipped) - manual tier combines equipment + services in step 2
- Step 4: Review & Submit

**PENDING FIX**: Reorder so Services come BEFORE Equipment for all tiers.

### i18n System Status
- Uses React Context-based I18nProvider at `client/src/i18n/index.tsx`
- 8 supported languages: English, French, Spanish, Portuguese, German, Chinese, Japanese, Korean
- Translation files at `client/src/i18n/{lang}.ts`
- **COMPLETED**: Major pages now use i18n:
  - Settings.tsx ✅
  - AuthDialog.tsx ✅ (sign in/out labels, email/password fields, buttons, dialog title)
  - Index.tsx ✅ (welcome, tagline, buttons, section headers)
  - SignIn.tsx ✅
  - SignUp.tsx ✅
  - DriveEarn.tsx ✅ (hook added)
  - Notifications.tsx ✅ (page title, description)
  - Header.tsx ✅
  - MobileBottomNav.tsx ✅
- **REMAINING**: 
  - AuthDialog validation messages in useEffect (password strength, email/name availability) - requires code restructure
  - DriveEarn page content (hero text, tier descriptions)
  - Other secondary pages (Profile, Help, etc.)

### Priority Issues to Fix
1. ~~Test account login~~ - FIXED (populated email_normalized column)
2. i18n cleanup - add translations to all pages
3. Operator onboarding step reordering
4. Map pin stability when zooming
5. Emergency tracking improvements

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, Radix UI primitives, shadcn/ui, and Tailwind CSS. The design adopts a black-and-white color scheme with orange accents, minimal aesthetics, and bold typography. It features adaptive theming with seasonal palettes and dark mode. A LocationPermissionModal guides first-time users, and features are progressively disclosed.

**Mobile-First Design Patterns:**
- **Find Operators Page**: Mobile uses a half-map/half-list sliding sheet design with touch gesture support. The bottom sheet follows the user's finger during drag and snaps to three positions (collapsed, half, full). Desktop uses a separate list/map toggle view.
- **Service Selector**: Services are grouped by category (Micro Services, Standard Services, Professional Services) with multi-select capability.
- **Operator Cards**: Mobile cards show operator photo, name, service badges, and a bottom row with rating/jobs/distance. A small map icon allows focusing on the operator's location.

### Technical Implementations
The backend is an Express.js server utilizing PostgreSQL with Drizzle ORM. Zod is employed for schema validation. API endpoints are RESTful under `/api` with centralized error handling. State management on the frontend uses TanStack Query for server state and React Hook Form with Zod for form validation.

### Feature Specifications
- **Quote-Based Negotiation System**: Operators submit quotes, and customers can accept, decline, or counter within a 12-hour expiry.
- **Comprehensive Notification System**: Real-time and persistent in-app notifications for all customer-operator interactions. Email integration is deferred but planned.
- **Multi-Driver Business Management**: Allows businesses to manage drivers and assign services.
- **Three-Tier Operator System**: Features Professional, Skilled & Equipped, and Manual Operators with tier-specific onboarding, capabilities, and proximity-based job filtering.
- **AI Assist Feature**: Recommends services and operators with estimated pricing.
- **Enhanced Service Request Creation**: Dynamic forms for service types, emergency/scheduled toggles, and photo uploads. Supports **Project Mode** for multi-service bundling with pricing preferences (fixed/hourly/custom quote).
- **Unified Map Implementation**: Uses Mapbox GL JS for interactive operator selection and filters.
- **Real-Time Tracking**: Live operator location updates with LiveTrackingMap component showing ETA, distance, and animated operator markers. Particularly for emergency requests.
- **In-App Messaging**: Customer-operator messaging system with real-time message history on job tracking pages via JobMessaging component.
- **Operator Tier Badges**: Operator cards display tier badges ("Pro" for Professional, "Skilled" for Skilled & Equipped) inline with operator names on both mobile and desktop views, preventing badge clustering.
- **Clickable Operator Profiles**: Operator photos on cards navigate to detailed profile pages showing tier, services, equipment, ratings, and response time.
- **Navigation Directions**: Operator job details page includes "Get Directions" buttons for both Google Maps and Apple Maps with deep-link support using coordinates when available.
- **Smart Back Navigation**: BackButton component provides history-aware back navigation with fallback routes for consistent navigation experience.
- **Proactive Weather Alert System**: Integrates with a weather API for alerts.
- **Emergency SOS Mode**: Provides no-login emergency assistance with auto-location detection. Features a mini map with pulsing location marker (Uber-like UX), service selection cards with modern icons, and GPS coordinate confirmation.
- **Persistent Job Tracking System**: Database-backed job persistence across sessions.
- **Customer Groups Unlock System**: Gamified access to "Nearby Customer Groups" after completing 5 jobs per tier.
- **User Verification & Duplicate Prevention**: Comprehensive signup verification via email and name normalization.
- **Operator Authentication & Verification**: Operators sign up with zero tiers and require manual approval for each tier after onboarding, with statuses stored in `operatorTierProfiles`.
- **Account Management Pages**: Includes Wallet (balance, transactions, withdrawals), Payments (cards, bank accounts, payout preferences), Settings (appearance, notifications, privacy), and Legal (terms, privacy, liability, cookie policy).
- **Unified Operator Dashboard**: A single, tier-aware dashboard with configurable modules (Metrics Slider, Tier Tabs, Drawer Navigation) driven by `TIER_CAPABILITIES`.
- **Self-Service Prevention (Transparency)**: Users cannot request services from, favorite, or rate their own operator cards. A "Your Operator" badge is displayed with disabled/blurred action buttons to prevent metric gaming.
- **Multi-Language i18n System**: Complete internationalization with 8 supported languages (English, French, Spanish, Portuguese, German, Chinese, Japanese, Korean). Uses React Context-based I18nProvider with type-safe translation keys, localStorage persistence, and browser language detection.
- **Multi-Select Service Filter**: The Find Operators page features a popover-based multi-select filter allowing users to select 15+ services simultaneously with checkbox toggles, selection count badges, and clear-all functionality.

### System Design Choices
- **Data Model**: Key entities include service requests (with `serviceType`, `isEmergency`, `description`, `location`, `status`, `details` JSONB) and operator profiles (with `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, `operatingRadius`).
- **Location Handling**: `LocationContext` manages centralized location state, permissions, auto-population, and persistent storage. Proximity-based operator matching uses a 50km radius.
- **Security**: Implements email normalization, bcrypt hashing for passwords, 30-day httpOnly cookie sessions, and tier isolation.

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
- OpenStreetMap Nominatim API
- National Weather Service API
