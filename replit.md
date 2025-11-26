# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It operates as a two-sided marketplace with distinct customer and operator dashboards. The platform focuses on real-time booking, job tracking, and professional service delivery, supporting multi-driver business management, a three-tier operator system with proximity-based job filtering, and an emergency SOS mode. Its vision is to provide a seamless, efficient booking experience for on-demand services.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, Radix UI primitives, shadcn/ui, and Tailwind CSS. The design adopts a black-and-white color scheme with orange accents, minimal aesthetics, and bold typography. It features adaptive theming with seasonal palettes and dark mode. A LocationPermissionModal guides first-time users, and features are progressively disclosed.

### Technical Implementations
The backend is an Express.js server utilizing PostgreSQL with Drizzle ORM. Zod is employed for schema validation. API endpoints are RESTful under `/api` with centralized error handling. State management on the frontend uses TanStack Query for server state and React Hook Form with Zod for form validation.

### Feature Specifications
- **Quote-Based Negotiation System**: Operators submit quotes, and customers can accept, decline, or counter within a 12-hour expiry.
- **Comprehensive Notification System**: Real-time and persistent in-app notifications for all customer-operator interactions. Email integration is deferred but planned.
- **Multi-Driver Business Management**: Allows businesses to manage drivers and assign services.
- **Three-Tier Operator System**: Features Professional, Skilled & Equipped, and Manual Operators with tier-specific onboarding, capabilities, and proximity-based job filtering.
- **AI Assist Feature**: Recommends services and operators with estimated pricing.
- **Enhanced Service Request Creation**: Dynamic forms for service types, emergency/scheduled toggles, and photo uploads.
- **Unified Map Implementation**: Uses Mapbox GL JS for interactive operator selection and filters.
- **Real-Time Tracking**: Live operator location updates, particularly for emergency requests.
- **Proactive Weather Alert System**: Integrates with a weather API for alerts.
- **Emergency SOS Mode**: Provides no-login emergency assistance with auto-location detection.
- **Persistent Job Tracking System**: Database-backed job persistence across sessions.
- **Customer Groups Unlock System**: Gamified access to "Nearby Customer Groups" after completing 5 jobs per tier.
- **User Verification & Duplicate Prevention**: Comprehensive signup verification via email and name normalization.
- **Operator Authentication & Verification**: Operators sign up with zero tiers and require manual approval for each tier after onboarding, with statuses stored in `operatorTierProfiles`.
- **Account Management Pages**: Includes Wallet (balance, transactions, withdrawals), Payments (cards, bank accounts, payout preferences), Settings (appearance, notifications, privacy), and Legal (terms, privacy, liability, cookie policy).
- **Unified Operator Dashboard**: A single, tier-aware dashboard with configurable modules (Metrics Slider, Tier Tabs, Drawer Navigation) driven by `TIER_CAPABILITIES`.

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