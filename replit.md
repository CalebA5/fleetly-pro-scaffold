# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It operates as a two-sided marketplace with distinct customer and operator dashboards, aiming for real-time booking, job tracking, and professional service delivery. The business vision is to provide a seamless, efficient service booking experience, inspired by Uber's clean and modern interface, emphasizing simplicity and ease of use. The platform supports a multi-driver business management system, allowing professional businesses to track and manage their drivers, and features a three-tier operator system with proximity-based job filtering.

## Recent Updates (November 2025)

### Demo Business Integration ✅
Arctic Express Services demo business is now accessible through regular sign-in:
- **Demo Credentials**: Email: `demo@arcticexpress.com`, Password: `demo`
- **Pre-Seeded Data**: 5 drivers (Sarah Mitchell, Marcus Johnson, Elena Rodriguez, David Chen, Aisha Patel) and 4 fleet vehicles
- **Business Dashboard Access**: Sign in with demo credentials to view full business management features
- **Removed Separate Demo Button**: Cleaner UX with single authentication flow for all users
- **Regular Sign-In Flow**: Demo business accessible through standard authentication, no special UI elements needed

### Tier Switching System ✅
Operators can now subscribe to multiple tiers and switch between them at any time:
- **Multi-Tier Subscriptions**: Operators can subscribe to any combination of manual (⛏️), equipped (🚛), and professional (🏆) tiers, enabling flexibility to work across different service types
- **Active Tier Selection**: TierSwitcher dropdown in header with visual indicators (green checkmark for subscribed tiers, badge for active tier)
- **Tier-Specific Onboarding**: Upgrading to a new tier collects required details (instant join for manual, vehicle details for equipped, business license for professional)
- **Dynamic Dashboard Routing**: Operators see different dashboards based on active tier selection
- **PostgreSQL Database**: Schema includes `subscribedTiers` array and `activeTier` fields, database ready for production
- **Backend API**: POST /api/operators/:operatorId/switch-tier and /api/operators/:operatorId/add-tier endpoints

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
- **Tier-Aware Drive & Earn**: Drive & Earn button intelligently routes based on active tier (manual → /manual-operator, equipped → /equipped-operator, professional → /business)
- **Automatic Dashboard Navigation**: After adding a new tier and entering details, operators are automatically redirected to the appropriate tier-specific dashboard
- **Seamless Tier Switching**: Clicking a subscribed tier in the dropdown instantly switches and shows the corresponding dashboard
- **Visual Tier Indicators**: Green checkmarks for subscribed tiers, "Active" badge for current tier, emoji badges (🏆 🚛 ⛏️) with color coding

### Dynamic Dashboards ✅
Removed hardcoded mock data and implemented real user data integration:
- **OperatorHome**: Now displays actual operator name, calculated earnings, and real job counts from service requests instead of hardcoded "Mike's Snow Service" data
- **Clean Data Architecture**: Removed all mock operator data from storage.ts, keeping only Arctic Express Services demo business
- **Real-Time Statistics**: Dashboard metrics (active jobs, pending jobs) derived from actual serviceRequests query
- **User-Specific Data**: All operator dashboards now pull data from authenticated user context via useAuth()

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite, utilizing Wouter for routing. UI components leverage Radix UI primitives and shadcn/ui, styled with Tailwind CSS, adhering to an Uber-inspired black-and-white theme with orange accents. State management uses TanStack Query for server state and React Hook Form with Zod for form validation. The application features distinct customer and operator dashboards, an AI-powered service assistant, enhanced service request creation, a unified landing page, dynamic authentication supporting multiple user roles, and an interactive map with service filters. Advanced features include favorite drivers, customer rating, real-time driver tracking, and location-based customer grouping for operators. Mobile-first optimizations include a fixed bottom navigation bar for authenticated customers, 44px minimum touch targets, and a responsive header.

### Backend Architecture
The backend is an Express.js server managing API routes and static file serving. It uses an in-memory storage for development, with Drizzle ORM configured for future PostgreSQL integration, and Zod for schema validation. API endpoints are RESTful under the `/api` prefix, with centralized error handling. Vite middleware is integrated for HMR in development, and static files are served from `dist/public` in production.

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