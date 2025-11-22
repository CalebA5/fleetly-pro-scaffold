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
The service request schema includes normalized fields like `serviceType`, `isEmergency`, `description`, and `location`, with a JSONB `details` field for service-specific payloads. Operator profiles store `operatorTier`, `isCertified`, `businessLicense`, `homeLatitude`, `homeLongitude`, and `operatingRadius`. Emergency system tables include `emergencyRequests` for SOS requests and `dispatchQueue` for operator notification management.

### UI/UX Decisions
The design is inspired by Uber's clean, modern aesthetic, emphasizing simplicity with a black-and-white color scheme and orange accents for CTAs. It features minimal design, bold typography, custom "enhanced-button" components, gradients for premium UI elements, and supports dark mode. An intelligent adaptive theming system switches between 4 seasonal color palettes (Winter, Spring, Summer, Autumn) and time-of-day awareness for light/dark mode, with user override options and localStorage persistence.

### Feature Specifications
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