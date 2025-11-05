# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview
Fleetly is a professional on-demand service platform that connects customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. It functions as a two-sided marketplace, offering separate dashboards for customers and operators. The platform aims to provide real-time service booking, job tracking, and professional service delivery. The business vision is to create a seamless and efficient service booking experience, inspired by the clean, modern interface of Uber, with an emphasis on simplicity and ease of use.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, using Vite for fast development and Wouter for lightweight routing. UI components are built using Radix UI primitives and shadcn/ui, styled with Tailwind CSS following an Uber-inspired black-and-white theme with bold typography and custom color schemes. State management relies on TanStack Query for server state and React Hook Form with Zod for form validation. The application features distinct customer and operator dashboards and uses a component-based architecture with path aliases for clean imports. Key features include an AI-powered service assistant, enhanced service request creation, a unified landing page, a dynamic authentication system supporting multiple user roles, and a unified interactive map with service filters. Advanced features like favorite drivers, customer rating, real-time driver tracking with animated markers, and location-based customer grouping for operators are also integrated.

### Backend Architecture
The backend is an Express.js server handling both API routes and static file serving. It uses an in-memory storage implementation for development, with Drizzle ORM configured for future PostgreSQL integration, leveraging Zod for schema validation. API endpoints are RESTful under the `/api` prefix, with centralized error handling. Vite middleware is integrated for HMR in development, and the server serves static files from `dist/public` in production.

### Data Model
The service request schema uses a hybrid approach combining normalized fields with JSON storage for service-specific details:
- **Normalized Fields**: serviceType, isEmergency, description, location, preferredDate, preferredTime, timeFlexibility, budgetRange, imageCount
- **JSONB Details Field**: Stores service-specific payloads (snow plowing, towing, hauling, courier details) in a structured format: `{type: 'snow'|'towing'|'hauling'|'courier', payload: {...}}`
- **Nullable Operator Fields**: operatorId and operatorName are nullable since new requests aren't assigned initially

### UI/UX Decisions
The design philosophy is inspired by Uber's clean, modern interface, emphasizing simplicity and ease of use. It features a black-and-white color scheme with minimal design elements and bold typography. Custom "enhanced-button" components and gradients are used for premium UI elements. Dark mode is supported.

### Feature Specifications
- **AI Assist Feature**: Recommends services and operators based on job descriptions and optional photo uploads, with estimated pricing.
- **Enhanced Service Request Creation**: Highly detailed, dynamic form that adapts based on service type (Snow Plowing, Towing, Hauling, Courier) with service-specific fields, emergency/scheduled toggle, time selection with flexibility options, and photo uploads.
- **Operator Dashboard with Comprehensive Request Details**: Operators can view all detailed information from service requests including emergency status, time preferences, budget ranges, and service-specific details (snow depth, vehicle info, package details, etc.) through a dedicated details dialog. The dashboard fetches real-time service request data and displays pending requests with Accept/Decline/Details actions.
- **Help & Support System**: Provides live chat, email, phone support, and organized FAQ sections.
- **Shared Header Component**: Reusable header for consistent navigation, authentication, and profile management across all pages.
- **Unified Landing Page**: A single customer-focused homepage with interactive service discovery, real-time availability previews, and Uber-style location inputs.
- **Dynamic Authentication System**: Unified user accounts supporting customer, operator, or both roles, with a multi-step operator onboarding process.
- **Unified Map Implementation**: Consolidates map functionalities, offering service filters, map/satellite toggle, operator sidebar, and interactive operator selection.
- **Favorite Drivers System**: Allows customers to favorite operators, displaying online favorited operators.
- **Customer Rating System**: Post-service rating dialog with star selection and optional comments.
- **Real-Time Driver Tracking**: Interactive map with live operator location updates, custom animated markers, and status transitions.
- **Location-Based Customer Grouping**: Automated opportunity detection for operators to serve nearby customers, with countdown timers and bulk contact options.

## External Dependencies

**UI & Interaction Libraries:**
- `@radix-ui/react-*` (Radix UI primitives)
- `embla-carousel-react`
- `cmdk`
- `input-otp`
- `lucide-react`
- `date-fns`
- `vaul`

**Data & Validation:**
- `drizzle-orm` (with PostgreSQL driver preparation)
- `drizzle-zod`
- `zod`
- `@tanstack/react-query` (for async state management)

**Development Tools:**
- `typescript`
- `eslint` (with TypeScript and React plugins)
- `tsx`
- `lovable` (component tagger)

**Build & Deployment:**
- `vite` (with SWC plugin)
- `postcss`
- `tailwindcss`
- `autoprefixer`