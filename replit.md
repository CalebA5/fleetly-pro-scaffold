# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It operates as a two-sided marketplace with distinct customer and operator dashboards, aiming for real-time booking, job tracking, and professional service delivery. The business vision is to provide a seamless, efficient service booking experience, inspired by Uber's clean and modern interface, emphasizing simplicity and ease of use. The platform supports a multi-driver business management system, allowing professional businesses to track and manage their drivers, and features a three-tier operator system with proximity-based job filtering.

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