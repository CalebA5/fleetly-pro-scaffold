# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It functions as a two-sided marketplace with distinct dashboards for customers and operators, focusing on real-time booking, job tracking, and professional service delivery. The vision is to provide a seamless, efficient booking experience, inspired by Uber's clean and modern interface. The platform supports a multi-driver business management system, a three-tier operator system with proximity-based job filtering, and an emergency SOS mode for urgent no-login assistance.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (November 21, 2025)
- **Mysterious Operator Tiles with Selective Tier Glow (Complete)**: Enhanced OperatorTile component with privacy-first design and intelligent tier highlighting:
  - **Selective Tier Glow**: For equipped_manual combined tiles, only the currently active tier glows with shadow and pulse animation, inactive tiers display dimmed for clarity
  - **Mysterious Design**: Phone numbers and hourly rates hidden until after service request/quote acceptance to maintain platform relevance and encourage bookings
  - **Elegant Hint Box**: Added gradient hint banner "📞 Contact & rates revealed after service request" to guide customers
  - **Mapbox Initialization Fix**: Resolved popup crash (null ref error) by adding null-check before adding popups in setTimeout callback
  - **Enhanced Active Badge**: ACTIVE badge now pulses for better visual feedback on which tier is currently in use
- **Operator Consolidation System (Complete)**: Implemented comprehensive operator card consolidation to eliminate duplicate operator records and provide unified multi-tier operator profiles:
  - **Consolidated API Endpoint**: `/api/operator-cards` aggregates duplicate operators by normalized email (trim + lowercase), returning enriched data with tier stats, reviews, and equipment
  - **OperatorTile Component**: New reusable component for dual-tier display with active tier badges, customer review showcase, and equipment gallery
  - **Tier Management Endpoints**: 
    - `PATCH /api/operators/:operatorId/active-tier` - Switch active tier with Zod validation and subscription verification
    - `GET/PATCH /api/operators/:operatorId/equipment` - Equipment inventory management with defensive normalization
  - **Database Cleanup**: Removed 19 duplicate operator records, consolidating from 33 down to 14 unique operators with proper `subscribedTiers` arrays (e.g., EV: 7 records → 1 with all 3 tiers)
  - **OperatorMap Integration**: Updated to use consolidated operator cards with proper service filtering across active tiers
  - **Favorites & Ratings**: Fixed mutations to include customerId, cache invalidation matches query keys, and null-safe rating handling
- **Hybrid Seasonal + Time-Based Theming System (Option C)**: Intelligent adaptive theming with 4 seasonal color palettes and time-of-day awareness:
  - **Auto-Seasonal Mode**: Automatically switches both seasonal palette (Winter/Spring/Summer/Autumn) AND light/dark mode based on current month and time of day
  - **Time-Based Mode**: Locks to Winter palette (professional black/white) and only toggles light/dark based on time (6 AM-6 PM = light, 6 PM-6 AM = dark)
  - **Manual Light/Dark**: User can override to always-light or always-dark using current season's palette
  - **Seasonal Palettes**: Winter (navy/ice blue), Spring (sage/sky blue), Summer (turquoise/sand), Autumn (rust/camel)
  - **Brand Consistency**: Orange accent (#F97316) preserved across all seasons
  - **Persistence**: Theme mode saved to localStorage with 1-minute checks for season/time changes
  - **Smooth Transitions**: 0.3s CSS transitions for seamless palette changes
  - **Theme Selector**: Palette icon button in header with dropdown showing current season emoji (❄️🌸☀️🍁) and mode indicator (☀️🌙)
- **Auto-Location Detection on Homepage**: When customers allow location sharing, their current location automatically populates the "Enter pickup location" field using browser geolocation and reverse geocoding (OpenStreetMap Nominatim API). Shows loading spinner during detection and silently fails if permission denied.
- **Critical Request Submission Fix**: 
  - Removed client-side requestId generation to prevent collisions
  - Backend now generates unique requestId server-side: `REQ-${timestamp}-${randomString}`
  - Request validation schema updated to accept payloads without requestId
  - Frontend only sends fields with actual values (no empty strings for optional fields)
- **Change Operator Button**: Fixed to properly clear URL params when navigating back to operators page
- **My Requests Link**: Added "My Requests" to desktop header dropdown menu with List icon
- **Requests Page Tabs**: Implemented proper tab-based filtering (All/Active/Completed) with accessible TabsContent wrapping for each tab
- **Find Operators Page**: Consolidated two header strips into one clean, unified strip with gradient background
- **Emergency Tracking Fix**: Fixed query key to use full path format for proper data loading
- **Mobile Navigation UX**: Bottom nav now appears on ALL pages with smooth auto-hide/show on scroll using optimized ref-based tracking
- **Operator List UI**: Redesigned minimize button to sleek semi-transparent bar with backdrop blur that blends seamlessly into page
- **Request Service Page Overhaul**:
  - Icon-based service type selector (6-icon grid replacing dropdown)
  - 4-level urgency selector with emoji icons (🟢 low, 🟡 medium, 🟠 high, 🔴 emergency)
  - "Schedule for Later" toggle that reveals/hides date/time picker fields
  - Operator info prefilling from Find Operators page (operatorId & operatorName URL params)
  - Backend integration: urgencyLevel, operatorId, and conditional scheduling fields now sent in payload

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite, using Wouter for routing. UI components are built with Radix UI primitives and shadcn/ui, styled with Tailwind CSS, following an Uber-inspired black-and-white theme with orange accents. State management uses TanStack Query for server state and React Hook Form with Zod for form validation. Key features include distinct customer and operator dashboards, an AI-powered service assistant, enhanced service request creation, a unified landing page, dynamic authentication for multiple user roles, and an interactive map with service filters. Mobile-first optimizations are implemented, including a fixed bottom navigation and responsive design.

### Backend Architecture
The backend is an Express.js server utilizing a PostgreSQL database with Drizzle ORM for data persistence. Zod is used for schema validation. API endpoints are RESTful under the `/api` prefix, with centralized error handling. Vite middleware is integrated for development HMR, and static files are served from `dist/public` in production.

### Data Model
The service request schema includes normalized fields like `serviceType`, `isEmergency`, `description`, and `location`, with a JSONB `details` field for service-specific payloads. `operatorId` and `operatorName` are nullable. Operator profiles store `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`.

**Emergency System Tables:**
- `emergencyRequests`: Stores emergency SOS requests with contactPhone (required), contactName, serviceType (towing/roadside/debris), location, latitude/longitude (decimal as string), status (searching/operator_assigned/completed/cancelled), assignedOperatorId
- `dispatchQueue`: Manages operator notification queue with queueId, emergencyId, operatorId, queuePosition (1=first notified), status (pending/notified/accepted/declined/expired), notifiedAt, respondedAt, expiresAt (10-min window), distanceKm

### UI/UX Decisions
The design is inspired by Uber's clean, modern aesthetic, emphasizing simplicity. It uses a black-and-white color scheme with orange accents for CTAs, minimal design, and bold typography. Custom "enhanced-button" components and gradients are used for premium UI elements, and dark mode is supported.

### Feature Specifications
- **Multi-Driver Business Management System**: Enables businesses to manage drivers, track performance, and assign services.
- **Three-Tier Operator System**: Includes Professional, Skilled & Equipped, and Manual Operators with tier-specific onboarding, dashboards, and proximity-based job filtering. Operators can switch between multiple subscribed tiers.
- **AI Assist Feature**: Recommends services and operators based on job descriptions, providing estimated pricing and confidence scores.
- **Enhanced Service Request Creation**: Dynamic forms adapt to service type, supporting emergency/scheduled toggles, time selection, and photo uploads.
- **Operator Dashboard**: Displays comprehensive service request details, with options to accept, decline, or view details.
- **Help & Support System**: Provides live chat, email, phone support, and FAQs.
- **Unified Landing Page**: Customer-focused homepage with interactive service discovery, real-time availability previews, and location inputs.
- **Dynamic Authentication System**: Unified user accounts support customer, operator, or both roles, with multi-step operator onboarding including public tier selection. All authentication endpoints (signup, signin, session) return consistent user data with `customerId` as the main `id` field.
- **Unified Map Implementation**: Uses Mapbox GL JS for performance, service filters, map/satellite toggle, and interactive operator selection, displaying color-coded tier badges and pricing multipliers. The map resizes dynamically with sidebar changes.
- **Favorite Drivers System**: Allows customers to favorite operators.
- **Customer Rating System**: Post-service rating with stars and comments.
- **Real-Time Driver Tracking**: Interactive map with live operator location updates and animated markers.
- **Location-Based Customer Grouping**: Automated opportunity detection for operators to serve nearby customers.
- **Multi-Vehicle Management System**: Allows professional operators to manage unlimited vehicles and equipped operators to manage multiple vehicles (one active at a time).
- **Proactive Weather Alert System**: Integrates with the National Weather Service API to display real-time severe weather alerts relevant to services. Features include:
  - Weather alert notification button in header with badge counter
  - Dedicated notifications page at `/notifications` with compact list format
  - Dismissible toast popup alerts on homepage that auto-dismiss after 10 seconds
  - Alert data refreshes every 4 hours to minimize API calls
  - Compact, space-efficient alert cards showing event type, severity, location, and expiry time
- **Optimized Customer Profile Page**: Modern, personalized profile page featuring:
  - Hero section with gradient banner and avatar with user initials
  - Real-time statistics dashboard showing total requests, completed services, active bookings, and favorite operators
  - Comprehensive personal information display with contact details and location
  - Edit mode with organized form sections for Contact Information and Location Details
  - Save functionality with optimistic UI updates and proper form validation
  - Member since date calculated from customer ID timestamp
  - Responsive design with mobile-first approach
- **Emergency SOS Mode (Phase 1 Complete)**: No-login emergency assistance system featuring:
  - Prominent red gradient Emergency SOS button on homepage
  - Three-tile service selection (Towing, Roadside Assistance, Debris Removal) with emergency-optimized descriptions
  - Contact form with phone (required), name, email (optional), and description
  - Auto-location detection via browser geolocation API with manual address geocoding fallback (OpenStreetMap Nominatim)
  - Proximity-based operator notification: finds 5 nearest online operators using Haversine distance formula
  - First-accept-wins dispatch queue: first operator notified with 10-minute response window
  - Auto-fallback: on decline, system advances to next operator in queue; if all decline, request cancelled
  - Real-time tracking page with 3-second polling showing queue status, operator names, distances, and status badges
  - Mobile-first responsive design with validation for phone, location, and service type
  - Backend API endpoints: POST /create, GET /:emergencyId, POST /:emergencyId/accept, POST /:emergencyId/decline

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

**Development Tools:**
- `typescript`
- `eslint`
- `tsx`
- `lovable`

**Build & Deployment:**
- `vite`
- `postcss`
- `tailwindcss`
- `autoprefixer`