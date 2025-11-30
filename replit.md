# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for a range of services including trucking, snow plowing, towing, hauling, and courier services. It functions as a two-sided marketplace, offering distinct interfaces for customers and operators. The platform's core capabilities include real-time booking, job tracking, support for multi-driver businesses, a three-tier operator system with proximity-based job filtering, and an emergency SOS mode. Fleetly aims to provide an efficient and seamless booking experience for on-demand services.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, Radix UI primitives, shadcn/ui, and Tailwind CSS. The design features a black-and-white color scheme with orange accents, a minimal aesthetic, and bold typography. It includes adaptive theming with seasonal palettes and dark mode. Key UI/UX patterns include a LocationPermissionModal for first-time users, progressive disclosure of features, and mobile-first designs such as a half-map/half-list sliding sheet for the "Find Operators" page. Service selection is categorized with multi-select capabilities, and operator cards are designed for clear information display on mobile.

### Technical Implementations
The backend is an Express.js server utilizing PostgreSQL with Drizzle ORM. Zod is used for schema validation. API endpoints are RESTful under `/api` and feature centralized error handling. Frontend state management leverages TanStack Query for server state and React Hook Form with Zod for form validation. The platform supports a comprehensive i18n system using React Context for 8 languages.

### Feature Specifications
- **Quote-Based Negotiation**: Allows operators to submit quotes and customers to accept, decline, or counter.
- **Comprehensive Notification System**: Real-time, in-app notifications for customer-operator interactions. Notifications are created for: new service requests, quotes received/accepted/declined, job started, job completed, and cancellations.
- **Multi-Driver Business Management**: Enables businesses to manage drivers and service assignments.
- **Three-Tier Operator System**: Differentiates between Professional, Skilled & Equipped, and Manual Operators, each with specific onboarding, capabilities, and proximity-based job filtering. Operators undergo manual approval for each tier.
- **AI Assist Feature**: Recommends services and operators with estimated pricing.
- **Enhanced Service Request Creation**: Dynamic forms supporting emergency/scheduled toggles, photo uploads, and a "Project Mode" for multi-service bundling with various pricing preferences.
- **Unified Map Implementation**: Uses Mapbox GL JS for interactive operator selection and filtering, with real-time tracking of operator locations for emergency requests.
- **In-App Messaging**: Real-time customer-operator messaging on job tracking pages.
- **Operator Badges & Profiles**: Tier badges are displayed on operator cards, which are clickable to access detailed profiles.
- **Navigation Directions**: Integration with Google Maps and Apple Maps for job navigation.
- **Smart Back Navigation**: Provides history-aware back navigation with fallback routes.
- **Proactive Weather Alert System**: Integrates with a weather API.
- **Emergency SOS Mode**: Offers no-login emergency assistance with auto-location detection, a mini-map, and service selection.
- **Persistent Job Tracking System**: Database-backed job persistence across sessions.
- **Customer Groups Unlock System**: Gamified access to customer groups.
- **User Verification & Duplicate Prevention**: Comprehensive signup verification via email and name normalization.
- **Account Management Pages**: Includes Wallet, Payments, Settings, and Legal sections.
- **Unified Operator Dashboard**: A single, tier-aware dashboard with configurable modules.
- **Self-Service Prevention**: Prevents users from interacting with their own operator cards to ensure fair metrics.
- **Multi-Select Service Filter**: Allows users to select multiple services for filtering operators.
- **Advanced Service Area Selection**: Professional and Equipped tiers feature cascading country → province → city selection, with tier-based limits on the number of cities and radius.
- **Operator Onboarding Flow**: Features progress persistence and a structured 4-step process for each tier, with services defined before equipment/vehicle details.
- **Job Lifecycle Management**: Complete flow from request → quote → acceptance → job start → progress tracking → completion.

### Job Status Flow
1. **pending**: Initial state when customer creates a request
2. **quoted**: Operator has submitted a quote
3. **accepted/operator_accepted**: Customer accepted the quote, job is ready to start
4. **assigned**: Job assigned to specific operator
5. **in_progress**: Operator has started working on the job
6. **completed**: Job finished successfully
7. **cancelled**: Request was cancelled (with optional cancellation fee)

### Cancellation/Edit Policy
- **10-minute free window**: Customers can edit requests for free within 10 minutes of creation
- **Progressive fees after operator engagement**: Cancellation fees increase based on job status
- **Fee tracking**: System tracks edit counts and cancellation fees in the service_requests table

### Operator Verification Flow
New operators (registered after initial 8 test accounts) go through a verification process before they can accept jobs:

**Registration Phase:**
1. User signs up and selects an operator tier (Professional, Equipped, or Manual)
2. User completes the 4-step onboarding form (business info, services, vehicle/equipment, service area)
3. System creates operator profile with `approvalStatus: "pending"` and `canEarn: false`
4. Operator can access their dashboard immediately (view jobs, set up profile)

**Pending Verification Phase:**
- Operator can view the dashboard but CANNOT go online or accept jobs
- Attempting to toggle online returns error: "You cannot go online until your documents have been verified"
- The `/operator/pending-verification` page shows status for each tier (pending, under_review, approved, rejected)
- Page polls every 10 seconds to check for status updates

**Admin Verification Phase:**
- Admins access pending operators via `GET /api/admin/operators/pending`
- Admin reviews operator documents, credentials, and profile information
- Admin approves via `POST /api/admin/operators/:operatorId/approve/:tier`
- Admin rejects via `POST /api/admin/operators/:operatorId/reject/:tier` (with reason)

**Post-Approval Phase:**
- Once approved, `approvalStatus: "approved"`, `canEarn: true`, and `approvedAt` timestamp set
- Operator can now go online and accept jobs for that tier
- If rejected, operator sees rejection reason and can resubmit documents

**Key Implementation Files:**
- `server/routes.ts`: Registration endpoints (POST /api/operators, POST /api/operators/:id/add-tier), toggle-online enforcement, admin approval endpoints
- `client/src/hooks/useOperatorApproval.ts`: Hook that checks tier approval status without redirecting
- `client/src/pages/operator/PendingVerification.tsx`: Shows verification status for each tier
- Dashboards use `useOperatorApproval` hook to disable "Go Online" toggle for unapproved tiers

**Legacy Operators (Test Accounts):**
The 8 original test operators (Frank, Grace, Henry, Emma, etc.) have `approvalStatus: "approved"` and can operate normally. New operators must complete verification.

### System Design Choices
- **Data Model**: Key entities include service requests (with `serviceType`, `isEmergency`, `description`, `location`, `status`, `details` JSONB, `cancelledBy`, `cancellationReason`, `cancellationFeeCents`, `editAllowedUntil`, `lastEditedAt`, `editCount`) and operator profiles (with `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, `operatingRadius`). New tables for email OTP, document requirements, and operator document submissions enhance verification.
- **Location Handling**: `LocationContext` manages centralized location state, permissions, and auto-population, supporting proximity-based operator matching within a 50km radius.
- **Security**: Implements email normalization, bcrypt hashing for passwords, 30-day httpOnly cookie sessions, and tier isolation.
- **Notification Service**: Uses userId lookups from operatorId/customerId to ensure notifications are delivered to the correct user account.

### Current Service Requests
- REQ-1764441533276-ghr3euizv: Emma Thompson → Frank Garcia (Snow Plowing, status: pending)

### Route Ordering
Important: Specific routes must be defined BEFORE parameterized routes in Express.js to prevent incorrect matching. Example: `/api/service-requests/request/:requestId` must come before `/api/service-requests/:id`.

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
- Google OAuth (pending credentials)
- Yahoo OAuth (pending credentials)

## Test Accounts
All test accounts use password: "Test1234!"
- **Admin**: admin@fleetly.test (Fleetly Admin) - has full admin access to approve/reject operators
- Customers: Alice, Bob, Charlie (Alice has customerId: CUST-alice, etc.)
- Operators: Frank (OP-frank-e5bc84ea), Grace, Henry
- The customerId format is CUST-{name} and userId format is user-{timestamp}-{random}

## Admin Access
- Admin portal accessible at `/admin` (visible in profile dropdown for admin users)
- Admin features: View pending operators, approve/reject operator tier applications
- Only users with `isAdmin: 1` in the database can access admin functions
