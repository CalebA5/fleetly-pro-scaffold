# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It operates as a two-sided marketplace with distinct customer and operator dashboards, aiming for real-time booking, job tracking, and professional service delivery. The business vision is to provide a seamless, efficient service booking experience, inspired by Uber's clean and modern interface, emphasizing simplicity and ease of use. The platform supports a multi-driver business management system, allowing professional businesses to track and manage their drivers, and features a three-tier operator system with proximity-based job filtering.

## Recent Updates (November 2025)

### Clean Database Migration (November 7, 2025) ✅
Migrated to PostgreSQL database and removed all mock/demo data:
- **PostgreSQL Database**: Full migration from in-memory storage to persistent PostgreSQL database with Drizzle ORM
- **Users Table**: Added users table for proper authentication and user management
- **No Demo Accounts**: Removed all pre-seeded demo data (Arctic Express, demo drivers, mock operators)
- **Universal Operator System**: All operator features now work for ANY account that signs up, not just specific demo accounts
- **Backend Operator Persistence**: Operator records stored in database, survive page refreshes and server restarts
- **How businessId Works**: businessId is ONLY assigned when an operator explicitly registers as a business (via "Register as Business" flow with company name, business license, etc.). Regular operators (including professional tier) do NOT receive a businessId - they are individual operators.

### Tier Switching System ✅
Operators can now subscribe to multiple tiers and switch between them at any time:
- **Multi-Tier Subscriptions**: Operators can subscribe to any combination of manual (⛏️), equipped (🚛), and professional (🏆) tiers, enabling flexibility to work across different service types
- **Active Tier Selection**: TierSwitcher dropdown in header with visual indicators (green checkmark for subscribed tiers, badge for active tier)
- **Tier-Specific Onboarding**: Upgrading to a new tier collects required details (instant join for manual, vehicle details for equipped, business license for professional)
- **Dynamic Dashboard Routing**: Operators see different dashboards based on active tier selection
- **Backend Integration**: AuthContext creates operator records during signup, POST/PATCH /api/operators endpoints handle operator creation and updates
- **Tier Switching API**: POST /api/operators/:operatorId/switch-tier and /api/operators/:operatorId/add-tier endpoints
- **Added Missing Routes**: Routes for /manual-operator and /equipped-operator now registered in App.tsx
- **TierSwitcher Visibility**: Only displays when operator is on dashboard routes (/operator, /manual-operator, /equipped-operator, /business)

### Multi-Vehicle Management System ✅
Professional and equipped operators can now register and manage multiple vehicles:
- **Professional Tier**: Register unlimited vehicles, all can be used simultaneously, assign specific services to each vehicle
- **Equipped Tier**: Register multiple vehicles but only one can be active at a time, with easy switching via dashboard
- **Vehicle Details**: Each vehicle includes make, model, year, license plate, type, and service capabilities
- **Service Selection**: Operators choose which services each vehicle can perform (Snow Plowing, Towing, Hauling, etc.)
- **Dashboard Integration**: Tabbed interface in both EquippedOperatorDashboard and BusinessDashboard separating Jobs/Drivers and Fleet management
- **Full CRUD Operations**: Add, edit, delete vehicles with form validation and confirmation dialogs
- **Database Schema**: Vehicles table with operatorId reference, vehicle details, services JSONB array, and isActive flag
- **Backend API**: RESTful endpoints (GET/POST/PATCH/DELETE /api/operators/:operatorId/vehicles, POST set-active)

### Navigation & UX Improvements ✅
Enhanced operator experience with intelligent routing and context-aware UI:
- **Context-Aware TierSwitcher**: TierSwitcher dropdown only appears when operators are on dashboard routes (/operator, /manual-operator, /equipped-operator, /business), keeping the homepage and customer pages clean
- **Smart Dashboard Routing**: Drive & Earn button routes based on account type:
  - Business owners (with businessId) → /business dashboard (multi-driver fleet management)
  - Manual operators → /manual-operator dashboard
  - Equipped operators → /equipped-operator dashboard
  - Professional individual operators → /operator dashboard (standard operator interface)
- **Automatic Dashboard Navigation**: After adding a new tier and entering details, operators are automatically redirected to the appropriate tier-specific dashboard
- **Seamless Tier Switching**: Clicking a subscribed tier in the dropdown instantly switches and shows the corresponding dashboard
- **Visual Tier Indicators**: Green checkmarks for subscribed tiers, "Active" badge for current tier, emoji badges (🏆 🚛 ⛏️) with color coding
- **Automatic Operator Migration**: Existing operators get backend records created automatically on sign-in for seamless upgrade

### Dynamic Dashboards ✅
Removed hardcoded mock data and implemented real user data integration:
- **OperatorHome**: Now displays actual operator name, calculated earnings, and real job counts from service requests instead of hardcoded data
- **Clean Data Architecture**: Removed all mock operator data from storage.ts - completely clean database
- **Real-Time Statistics**: Dashboard metrics (active jobs, pending jobs) derived from actual serviceRequests query
- **User-Specific Data**: All operator dashboards now pull data from authenticated user context via useAuth()
- **PostgreSQL Backend**: All user and operator data persisted in database, no in-memory data loss on refresh

### Public Operator Onboarding Flow (November 8, 2025) ✅
Implemented frictionless "explore before signup" flow for Drive & Earn with proper security:
- **Public Tier Selection**: `/operator/onboarding` accessible to everyone without authentication, encouraging exploration
- **Auth-Gated Submission**: Unauthenticated users can browse tiers and fill out forms, but auth is required before submission
- **Pre-filled Signup**: When unauthenticated user submits tier form, AuthDialog opens with name pre-filled from the form
- **Automatic Registration**: After successful signup, tier registration auto-submits and user navigates to appropriate dashboard
- **Protected Dashboards**: All operator dashboards (`/operator`, `/business`, `/manual-operator`, `/equipped-operator`) require operator authentication with ProtectedRoute guards
- **Toast Auto-Dismiss**: Success toasts (non-destructive) auto-dismiss after 4 seconds for better UX
- **Secure Architecture**: Public onboarding route extracted from protected OperatorDashboard component and registered separately in App.tsx

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite, utilizing Wouter for routing. UI components leverage Radix UI primitives and shadcn/ui, styled with Tailwind CSS, adhering to an Uber-inspired black-and-white theme with orange accents. State management uses TanStack Query for server state and React Hook Form with Zod for form validation. The application features distinct customer and operator dashboards, an AI-powered service assistant, enhanced service request creation, a unified landing page, dynamic authentication supporting multiple user roles, and an interactive map with service filters. Advanced features include favorite drivers, customer rating, real-time driver tracking, and location-based customer grouping for operators. Mobile-first optimizations include a fixed bottom navigation bar for authenticated customers, 44px minimum touch targets, and a responsive header.

### Backend Architecture
The backend is an Express.js server managing API routes and static file serving. It uses **PostgreSQL database with Drizzle ORM** for all data persistence, with Zod for schema validation. API endpoints are RESTful under the `/api` prefix, with centralized error handling. Vite middleware is integrated for HMR in development, and static files are served from `dist/public` in production. The in-memory storage (MemStorage) is only used temporarily until full database migration is complete.

### Data Model
The service request schema combines normalized fields (e.g., `serviceType`, `isEmergency`, `description`, `location`) with a JSONB `details` field for service-specific payloads (e.g., snow plowing, towing, hauling, courier details). `operatorId` and `operatorName` are nullable, as requests are not initially assigned. Operator profiles include `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`.

### UI/UX Decisions
The design is inspired by Uber's clean, modern interface, focusing on simplicity. It employs a black-and-white color scheme with orange accents for CTAs, minimal design elements, and bold typography. Custom "enhanced-button" components and gradients are used for premium UI elements. Dark mode is supported.

### Feature Specifications
- **Multi-Driver Business Management System**: Allows businesses to manage multiple drivers, track performance, and add/remove drivers.
- **Three-Tier Operator System**: Implements Professional & Certified (unlimited radius, 1.5x pricing), Skilled & Equipped (15km radius), and Manual Operators (5km radius, 0.6x pricing for snow plowing). Includes tier-specific onboarding, dashboards, and proximity-based job filtering.
- **AI Assist Feature**: Recommends services and operators based on job descriptions and keywords, with estimated pricing and confidence scores.
- **Enhanced Service Request Creation**: Dynamic form adapting to service type with service-specific fields, emergency/scheduled toggles, time selection, and photo uploads.
- **Operator Dashboard**: Displays comprehensive service request details, with options to accept, decline, or view details for pending requests.
- **Help & Support System**: Provides live chat, email, phone support, and FAQs.
- **Unified Landing Page**: A single customer-focused homepage with interactive service discovery, real-time availability previews, and location inputs.
- **Dynamic Authentication System**: Unified user accounts supporting customer, operator, or both roles, with multi-step operator onboarding.
- **Unified Map Implementation**: Features Mapbox GL JS for performance, service filters, map/satellite toggle, operator sidebar, and interactive operator selection. Displays color-coded tier badges and pricing multipliers.
- **Favorite Drivers System**: Allows customers to favorite operators.
- **Customer Rating System**: Post-service rating with stars and comments.
- **Real-Time Driver Tracking**: Interactive map with live operator location updates and animated markers.
- **Location-Based Customer Grouping**: Automated opportunity detection for operators to serve nearby customers.

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