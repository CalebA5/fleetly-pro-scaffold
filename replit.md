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
- **Comprehensive Notification System**: Real-time, in-app notifications for customer-operator interactions.
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

### System Design Choices
- **Data Model**: Key entities include service requests (with `serviceType`, `isEmergency`, `description`, `location`, `status`, `details` JSONB) and operator profiles (with `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, `operatingRadius`). New tables for email OTP, document requirements, and operator document submissions enhance verification.
- **Location Handling**: `LocationContext` manages centralized location state, permissions, and auto-population, supporting proximity-based operator matching within a 50km radius.
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
- Google OAuth (pending credentials)
- Yahoo OAuth (pending credentials)