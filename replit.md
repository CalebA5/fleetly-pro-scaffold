# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It functions as a two-sided marketplace with distinct dashboards for customers and operators, focusing on real-time booking, job tracking, and professional service delivery. The vision is to provide a seamless, efficient booking experience, inspired by Uber's clean and modern interface. The platform supports a multi-driver business management system and a three-tier operator system with proximity-based job filtering.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite, using Wouter for routing. UI components are built with Radix UI primitives and shadcn/ui, styled with Tailwind CSS, following an Uber-inspired black-and-white theme with orange accents. State management uses TanStack Query for server state and React Hook Form with Zod for form validation. Key features include distinct customer and operator dashboards, an AI-powered service assistant, enhanced service request creation, a unified landing page, dynamic authentication for multiple user roles, and an interactive map with service filters. Mobile-first optimizations are implemented, including a fixed bottom navigation and responsive design.

### Backend Architecture
The backend is an Express.js server utilizing a PostgreSQL database with Drizzle ORM for data persistence. Zod is used for schema validation. API endpoints are RESTful under the `/api` prefix, with centralized error handling. Vite middleware is integrated for development HMR, and static files are served from `dist/public` in production.

### Data Model
The service request schema includes normalized fields like `serviceType`, `isEmergency`, `description`, and `location`, with a JSONB `details` field for service-specific payloads. `operatorId` and `operatorName` are nullable. Operator profiles store `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`.

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
- **Dynamic Authentication System**: Unified user accounts support customer, operator, or both roles, with multi-step operator onboarding including public tier selection.
- **Unified Map Implementation**: Uses Mapbox GL JS for performance, service filters, map/satellite toggle, and interactive operator selection, displaying color-coded tier badges and pricing multipliers. The map resizes dynamically with sidebar changes.
- **Favorite Drivers System**: Allows customers to favorite operators.
- **Customer Rating System**: Post-service rating with stars and comments.
- **Real-Time Driver Tracking**: Interactive map with live operator location updates and animated markers.
- **Location-Based Customer Grouping**: Automated opportunity detection for operators to serve nearby customers.
- **Multi-Vehicle Management System**: Allows professional operators to manage unlimited vehicles and equipped operators to manage multiple vehicles (one active at a time).
- **Proactive Weather Alert System**: Integrates with the National Weather Service API to display real-time severe weather alerts relevant to services, shown prominently on the homepage.
- **Comprehensive Profile Page**: Displays customer statistics and operator performance across all subscribed tiers.

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