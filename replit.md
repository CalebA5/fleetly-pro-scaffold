# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It functions as a two-sided marketplace with distinct dashboards for customers and operators, focusing on real-time booking, job tracking, and professional service delivery. The platform aims to provide a seamless, efficient booking experience, supporting a multi-driver business management system, a three-tier operator system with proximity-based job filtering, and an emergency SOS mode for urgent no-login assistance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite, using Wouter for routing. UI components are built with Radix UI primitives and shadcn/ui, styled with Tailwind CSS. State management uses TanStack Query for server state and React Hook Form with Zod for form validation. It features distinct customer and operator dashboards, an AI-powered service assistant, enhanced service request creation, a unified landing page, and dynamic authentication for multiple user roles. Mobile-first optimizations, including a fixed bottom navigation and responsive design, are implemented.

### Backend Architecture
The backend is an Express.js server utilizing a PostgreSQL database with Drizzle ORM for data persistence. Zod is used for schema validation. API endpoints are RESTful under the `/api` prefix, with centralized error handling.

### Data Model
The service request schema includes normalized fields like `serviceType`, `isEmergency`, `description`, `location`, and `status` (pending/completed/cancelled), with a JSONB `details` field for service-specific payloads. Operator profiles store `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`. Emergency system tables include `emergencyRequests` for SOS requests and `dispatchQueue` for operator notification management.

**Earnings Tracking Tables:**
- `operatorDailyEarnings`: Tracks daily earnings per operator per tier with unique constraint on (operatorId, tier, date)
- `operatorMonthlyEarnings`: Tracks monthly earnings per operator per tier with unique constraint on (operatorId, tier, month)
- `operatorTierStats`: Tracks total lifetime stats per operator per tier (jobsCompleted, totalEarnings, rating) with unique constraint on (operatorId, tier) - used for customer groups unlock system

### UI/UX Decisions
The design is inspired by Uber's clean, modern aesthetic, emphasizing simplicity with a black-and-white color scheme and orange accents for CTAs. It features minimal design, bold typography, custom "enhanced-button" components, gradients for premium UI elements, and supports dark mode. An intelligent adaptive theming system switches between 4 seasonal color palettes (Winter, Spring, Summer, Autumn) and time-of-day awareness for light/dark mode, with user override options and localStorage persistence.

**First-Time User Experience:**
- **LocationPermissionModal**: Beautiful onboarding modal that prompts new users for location access 1 second after landing, featuring three key benefits (Find Nearby Operators, Faster Service, Emergency Support) with icons and descriptions. Includes reverse geocoding to convert GPS coordinates to human-readable addresses with fallback handling. User choice is persisted in localStorage to prevent repeated prompts.
- **Custom CSS Animations**: fade-in, slide-in-up, and pulse-slow animations with configurable delays (100ms, 200ms, 300ms, 1000ms) for smooth transitions and better perceived performance.
- **Progressive Disclosure**: System guides new users through key features without overwhelming them.

### Feature Specifications
- **Quote-Based Negotiation System**: Competitive quote workflow where operators submit quotes (NOT instant job acceptance). Customers review quotes in the Quote Center (/customer/quotes) and can accept, decline, or counter quotes. All three operator tiers (Manual, Equipped, Professional) have integrated "Quote this Job" workflow with auto-calculated pricing based on tier-specific pricing configs. Quotes expire after 12 hours. Database-backed with operatorQuotes and operatorPricingConfigs tables. Backend endpoints: POST /api/service-requests/:id/quotes, GET /api/quotes/customer/:customerId, POST /api/quotes/:id/respond.
- **Multi-Driver Business Management System**: Enables businesses to manage drivers, track performance, and assign services.
- **Three-Tier Operator System**: Includes Professional, Skilled & Equipped, and Manual Operators with tier-specific onboarding, dashboards, and proximity-based job filtering. Operators can switch between multiple subscribed tiers.
- **AI Assist Feature**: Recommends services and operators based on job descriptions, providing estimated pricing and confidence scores.
- **Enhanced Service Request Creation**: Dynamic forms adapt to service type, supporting emergency/scheduled toggles, time selection, and photo uploads.
- **Operator Dashboard**: Displays comprehensive service request details, with options to accept, decline, or view details.
- **Unified Landing Page**: Customer-focused homepage with interactive service discovery, real-time availability previews, and location inputs.
- **Dynamic Authentication System**: Unified user accounts support customer, operator, or both roles, with multi-step operator onboarding including public tier selection.
- **Unified Map Implementation**: Uses Mapbox GL JS for performance, service filters, map/satellite toggle, and interactive operator selection, displaying color-coded tier badges and pricing multipliers.
- **Customer Features**: Includes a "Favorite Drivers" system, a post-service rating system, and an optimized customer profile page.
- **Real-Time Tracking**: Interactive map with live operator location updates and real-time tracking for emergency requests.
- **Multi-Vehicle Management System**: Allows professional operators to manage unlimited vehicles and equipped operators to manage multiple vehicles.
- **Proactive Weather Alert System**: Integrates with the National Weather Service API for real-time severe weather alerts.
- **Emergency SOS Mode**: A no-login emergency assistance system with a prominent homepage button, three-tile service selection, contact form, auto-location detection, and proximity-based operator notification.
- **Persistent Job Tracking System**: Database-backed job persistence that survives page refreshes, logout/login, and browser restarts. Operators can accept jobs offline (stored in database), but must be online on the correct tier to view details and work. Includes comprehensive Job Details page with Start/Cancel/Complete functionality and progress tracking (0-100%). Prevents operators from working on multiple tiers simultaneously through cross-tier active job checking. Completed jobs are marked as "completed" in the database and immediately removed from operator feeds.
- **Database Persistence for Earnings**: Daily and monthly earnings are now stored in the database using atomic upserts with unique constraints, ensuring job counts and earnings persist across logout/refresh/page reload. All earnings data is read from the database, not in-memory storage.
- **Customer Groups Unlock System**: Gamification feature where operators must complete 5 jobs on a specific tier to unlock access to the "Nearby Customer Groups" feature. Real-time progress tracking via `/api/operators/:operatorId/tier/:tier/unlock-status` endpoint. Implemented across all three operator dashboards (Manual, Equipped, Professional) with visual progress indicators.
- **User Verification & Duplicate Prevention System**: Comprehensive signup verification that prevents duplicate accounts using database-backed normalization. Email normalization handles Gmail alias tricks (+spam), dot removal, and case insensitivity. Name duplication detection flags exact matches (case-insensitive). Real-time validation with debounced API calls (800ms) provides visual feedback during signup. Uses indexed O(1) SQL lookups on `email_normalized` and `name_lower` columns instead of table scans. Includes `/api/auth/verify-email` and `/api/auth/verify-name` endpoints. All users dynamically protected, not hardcoded.
- **Job History Feature**: Dedicated job history page (`/operator/job-history`) accessible via clickable "Completed Today" cards in all three operator dashboards (Manual, Equipped, Professional). Backend endpoint (`/api/operators/:operatorId/job-history`) with validated pagination (limit 1-100), tier/date filtering, and proper type conversion for earnings. Composite database index `(operator_id, status, completed_at DESC)` ensures optimal query performance. Frontend displays completed jobs with earnings, pagination controls, tier filter, and comprehensive error/loading/empty states. Completed jobs are excluded from active requests feed via database status filtering.
- **Customer Job Tracking System**: Real-time job tracking for customers with live updates every 5 seconds. Backend endpoint (`/api/customer-jobs/:customerId`) returns ALL customer jobs across assigned, in_progress, completed, and cancelled statuses with enriched operator metadata (name, phone, email, photo, rating, vehicle, licensePlate). Jobs remain visible throughout their lifecycle - progressing from assigned → in_progress → completed never breaks tracking visibility. Operator contact information (phone number) is only visible to customers after quote acceptance. RequestStatus page provides "Track Job Progress" button for all active jobs, navigating to JobTracking page with real-time polling. Supports status filtering and proper pagination.
- **Operator-User Linkage Security**: POST `/api/operators` enforces authenticated session requirement (401 if no session) and REJECTS operator creation if form email doesn't match session email (403 with debug info). Operator records ALWAYS use `req.session.user.email` for operator email (not form-submitted email), preventing orphaned operator profiles and unauthorized operator creation. Links operators to users via `req.session.user.userId` for secure account association.
- **Accurate Location Positioning System**: Comprehensive location handling on the homepage with smart auto-population and manual control. Features include:
  - **Location Icon Button**: Intelligent permission-aware behavior with PRIMARY function to display/update current location. Uses cached location if permission already granted (no re-prompt), requests fresh GPS if first-time or permission granted but no cache, shows modal ONLY if user previously denied/skipped permission. All permission states persisted in localStorage (`fleetly_location_granted`, `fleetly_location_prompted`). LocationContext initializes from localStorage on mount to preserve location across sessions, with proper number validation to handle all coordinates including 0° (equator/prime meridian). Error handling distinguishes between PERMISSION_DENIED (which triggers modal) vs other errors like TIMEOUT or POSITION_UNAVAILABLE (which preserve permission state and show toast notifications).
  - **X Clear Button**: Single clean clear button (no duplicates) with proper callback handling. Fixed double X issue by removing duplicate wrapper button and adding CSS to hide browser native clear buttons. `onClear` callback properly clears coordinates and `userHasCleared` flag.
  - **Smart Auto-Population**: Auto-fills pickup field with most recent GPS location ONLY when user hasn't manually cleared it. On page load, automatically restores last used location from localStorage (whether from location sharing or manual entry).
  - **Persistent Location Storage**: Stores both formatted address and coordinates in localStorage, automatically restoring them on page reload for seamless UX
  - **Smart Dropdown Behavior**: Address suggestions only appear after user clicks/focuses the input field, not automatically while typing. Dropdown resets on select or clear to prevent unwanted reopening.
  - **Permission Memory**: LocationPermissionModal automatically requests GPS on "Allow" click and sets both permission flags. After granting permission once (via modal OR icon), users never see prompts again - system remembers their choice across sessions.
  - **50km Radius Filtering**: "See Available Operators" button filters operators within 50km using Haversine distance calculation, with radius parameter included in both direct navigation and geocode fallback flows
  - **Smart Map Centering**: Both "See Available Operators" and "Browse All Operators" buttons implement 4-level fallback priority for automatic map centering: (1) pickup field with coordinates (manually entered location), (2) geocode pickup address if no coordinates, (3) shared GPS location from LocationContext, (4) prompt for location access if no data available. This ensures users are always taken to the most relevant location when viewing operators.
  - **Real-Time Location Hook**: Created `useRealtimeLocation.ts` with `watchPosition` API for continuous location tracking while app is in use
  - **State Management**: Single useEffect controls auto-fill behavior, respecting user intent while maintaining seamless location updates from LocationPermissionModal and GPS refreshes

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