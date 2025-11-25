# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It functions as a two-sided marketplace with distinct dashboards for customers and operators, emphasizing real-time booking, job tracking, and professional service delivery. The platform aims for a seamless, efficient booking experience, supporting multi-driver business management, a three-tier operator system with proximity-based job filtering, and an emergency SOS mode.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (Nov 25, 2025)

### Unified Operator Dashboard Architecture
Complete redesign of operator dashboards with a unified, tier-aware structure:

**Core Components** (`client/src/components/operator/dashboard/`):
- **OperatorDashboardLayout.tsx**: Main orchestrator component integrating all dashboard modules, handles tier switching, online status toggle, and session management
- **MetricsSlider.tsx**: Horizontally scrollable metrics carousel with tier-specific visibility (earnings, jobs nearby, active jobs, rating, equipment status, drivers, fleet)
- **TierTabs.tsx**: Horizontal tab navigation (Jobs, Equipment, Services, History, Manpower) with tier-based tab visibility
- **DrawerNav.tsx**: Slide-out navigation drawer with operator profile, tier-specific menu items, and logout

**Panel Components**:
- **JobsPanel.tsx**: Job requests with sub-tabs (Nearby/Active/Groups), customer group unlock system, job filtering (by service type, distance)
- **EquipmentPanel.tsx**: Equipment management (Tools/Vehicles/Heavy) with tier-locked features, status tracking
- **ServicesPanel.tsx**: Service catalog, pricing presets, tool uploads with tier-based service visibility
- **HistoryPanel.tsx**: Job history with date filtering and status categories
- **ManpowerPanel.tsx**: Professional tier only - driver management, assignment, and payroll (placeholder)

**Configuration** (`shared/tierCapabilities.ts`):
- `TIER_CAPABILITIES`: Tier-specific features, radius limits, equipment limits
- `DASHBOARD_METRICS`, `DASHBOARD_TABS`, `DRAWER_MENU_ITEMS`: Configuration arrays
- `TIER_SERVICES`, `EQUIPMENT_TYPES`: Service and equipment catalogs by tier
- Helper functions: `getMetricsForTier()`, `getTabsForTier()`, `getServicesForTier()`, `canAccessFeature()`

**Key Features**:
- Single unified layout replaces three separate tier dashboards
- Configuration-driven tier capabilities for easy feature toggling
- Lock states and tooltips for unavailable features
- React Query with tier-scoped query keys for data fetching
- Comprehensive `data-testid` attributes for automated testing

### Previous Changes
- **Fixed TierSwitcher dropdown**: Now uses operator API data (`operatorData.subscribedTiers`) instead of unreliable user context for displaying tier checkmarks
- **Fixed viewTier synchronization**: All dashboards now properly update viewTier with correct useEffect dependencies
- **Standardized verification messages**: Consistent error message across all tier dashboards when unverified operators try to go online
- **Profile enhancements**: Merged Account Verification section showing all 3 tiers with expandable details

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, Radix UI primitives, shadcn/ui, and Tailwind CSS. The design is inspired by Uber, featuring a black-and-white color scheme with orange accents, minimal design, bold typography, adaptive theming with seasonal palettes and dark mode, and custom CSS animations. First-time user experience includes a LocationPermissionModal for location access and progressive disclosure of features.

### Technical Implementations
The backend is an Express.js server using PostgreSQL with Drizzle ORM. Zod is used for schema validation. API endpoints are RESTful under `/api` with centralized error handling. State management uses TanStack Query for server state and React Hook Form with Zod for form validation.

### Feature Specifications
- **Quote-Based Negotiation System**: Operators submit quotes, and customers can accept, decline, or counter them within a 12-hour expiry.
- **Comprehensive Notification System**: Real-time and persistent notifications for all customer-operator interactions.
- **Multi-Driver Business Management**: Enables businesses to manage drivers and assign services.
- **Three-Tier Operator System**: Professional, Skilled & Equipped, and Manual Operators with tier-specific onboarding and proximity-based job filtering.
- **AI Assist Feature**: Recommends services and operators with estimated pricing.
- **Enhanced Service Request Creation**: Dynamic forms for service types, emergency/scheduled toggles, and photo uploads.
- **Unified Map Implementation**: Mapbox GL JS for interactive operator selection and filters.
- **Real-Time Tracking**: Live operator location updates and real-time tracking for emergency requests.
- **Proactive Weather Alert System**: Integration with the National Weather Service API.
- **Emergency SOS Mode**: No-login emergency assistance with auto-location detection.
- **Persistent Job Tracking System**: Database-backed job persistence across sessions.
- **Customer Groups Unlock System**: Gamified access to "Nearby Customer Groups" after completing 5 jobs per tier.
- **User Verification & Duplicate Prevention**: Comprehensive signup verification preventing duplicate accounts via email and name normalization.
- **Operator Authentication & Verification**: Operators sign up with zero tiers and must complete onboarding for each tier, which then undergoes manual approval. Tier approval statuses are stored in `operatorTierProfiles`.

### System Design Choices
- **Data Model**: Includes service request schema with `serviceType`, `isEmergency`, `description`, `location`, `status`, and a JSONB `details` field. Operator profiles store `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`.
- **Location Handling**: `LocationContext` manages centralized location state, smart permission handling, auto-population logic, and persistent storage. Proximity-based operator matching uses a 50km radius.
- **Security**: Email normalization, bcrypt hashing for passwords, 30-day httpOnly cookie sessions, and tier isolation.

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

## Email Integration Status (Task 13 - Deferred as of Nov 24, 2025)

### Current Status
Email notifications are **NOT** currently implemented. User dismissed the Resend email integration setup during production preparation.

### In-App Notification Coverage (Fully Functional)
The application has a **complete in-app notification system** that handles all user communication needs:
- **Real-time notifications** for quote submissions, acceptances, and declines
- **Persistent database storage** with 7-day automatic expiry
- **Rich metadata** including operator names, prices, job details
- **Unread count** displayed in notification bell icon
- **Mark as read** functionality
- **Notification dropdown** with full message history

### Why Email Integration Was Deferred
- **User Decision**: User dismissed the Resend integration proposal during deployment setup
- **In-App Sufficient**: All critical user communications work via in-app notifications
- **Not Blocking Launch**: Email is enhancement for convenience, not required for core functionality
- **Easy Future Addition**: Integration can be added anytime via Replit Integrations

### Future Email Integration Options
When ready to add email notifications:

**Option 1: Replit Integrations (Recommended)**
- Use `connector:ccfg_resend_01K69QKYK789WN202XSE3QS17V` for Resend
- Use `connector:ccfg_sendgrid_01K69QKAPBPJ4SWD8GQHGY03D5` for SendGrid
- Automatic API key management via Replit
- No code changes needed for authentication

**Option 2: Manual Setup**
- Create account with Resend (https://resend.com) or SendGrid
- Add `RESEND_API_KEY` or `SENDGRID_API_KEY` to Replit Secrets
- Install package: `npm install resend` or `@sendgrid/mail`
- Create email templates for:
  - Operator onboarding submission confirmation
  - Tier approval/rejection notifications
  - Quote received notifications
  - Job assignment confirmations

### Email Templates to Implement
1. **Operator Onboarding**: "Your [Tier] application has been submitted"
2. **Approval Notification**: "Congratulations! Your [Tier] application has been approved"
3. **Rejection Notification**: "Your [Tier] application needs additional information"
4. **Quote Received**: "You have a new quote for your service request"
5. **Quote Accepted**: "Your quote for [Service] has been accepted"
6. **Job Assigned**: "New job assigned: [Service Type]"

### Implementation Notes
- Email sending should be async/background to not block API responses
- Use email templates with consistent branding
- Include unsubscribe links (required for compliance)
- Log email delivery status for debugging
- Retry failed emails with exponential backoff