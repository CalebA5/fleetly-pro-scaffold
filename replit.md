# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview

Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. The application provides a two-sided marketplace with separate dashboards for customers seeking services and operators offering them.

The platform is built as a full-stack TypeScript application using React for the frontend and Express for the backend, with a focus on real-time service booking, job tracking, and professional service delivery.

**Design Philosophy:** Inspired by Uber's clean, modern interface with emphasis on simplicity and ease of use. Features a black-and-white color scheme with minimal design elements and bold typography.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 2025)

### UI/UX Redesign - Uber-Inspired Interface
- Complete home page redesign with clean, modern Uber-style interface
- Clean white background with bold black typography
- Simplified header with Sign in/Sign up buttons
- Hero section with large heading and visual service cards
- Features section highlighting key benefits (Fast Response, Verified Operators, Top Rated)
- Black CTA section at bottom for conversion

### Authentication System
- Created AuthDialog component with tabbed sign-in/sign-up interface
- Integrated authentication prompts when requesting services
- Ready for backend authentication implementation

### Map Implementation
- Created OperatorMapSimple with Leaflet integration
- Sidebar showing operator cards with full details
- Map/Satellite toggle buttons
- Click-to-select operators with map centering
- Note: Map tiles experiencing loading issues in current environment (tried OpenStreetMap, CARTO, Esri providers)

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing without React Router overhead
- SWC for faster TypeScript/JSX compilation

**UI Component System**
- Radix UI primitives providing accessible, unstyled components as the foundation
- shadcn/ui design system with custom Tailwind CSS styling
- Custom "enhanced-button" component extending base buttons with Fleetly-specific variants (hero, accent, success, warning, premium)
- Consistent design tokens defined in CSS variables using HSL color space

**State Management**
- TanStack Query (React Query) for server state management, caching, and API requests
- Custom query client with built-in error handling and stale-time configuration
- React Hook Form with Zod validation via @hookform/resolvers for form state

**Styling Approach**
- Tailwind CSS with custom configuration extending the base theme
- Brand colors: Deep blue primary (#215885%), light blue secondary, orange accent (#25 95% 55%)
- Custom gradients (gradient-hero, gradient-primary, gradient-accent) for premium UI elements
- Dark mode support through CSS class-based theming

**Application Structure**
- Two primary user flows: Customer Dashboard (`/customer/*`) and Operator Dashboard (`/operator/*`)
- Customer features: Service selection, real-time job tracking with progress simulation, job history with filtering
- Component-based architecture with reusable UI components in `client/src/components/ui/`
- Path aliases configured for clean imports: `@/` for client source, `@shared/` for shared code

### Backend Architecture

**Server Framework**
- Express.js server handling both API routes and static file serving
- Custom middleware for request logging with response timing and JSON body capture
- Vite middleware integration for HMR in development mode
- Production build serves static files from `dist/public`

**Data Storage Strategy**
- In-memory storage implementation (`MemStorage` class) for development/demo purposes
- Interface-based storage abstraction (`IStorage`) enabling easy migration to persistent databases
- Drizzle ORM configured for future PostgreSQL integration
- Schema definitions in `shared/schema.ts` using Drizzle's type-safe schema builder

**API Design**
- RESTful endpoints under `/api` prefix
- Example CRUD operations: GET `/api/examples`, GET `/api/examples/:id`, POST `/api/examples`
- Zod schema validation for request bodies using drizzle-zod integration
- Centralized error handling middleware with status code normalization

**Server-Side Rendering Strategy**
- Vite's HTML transformation for development
- Custom middleware handling SPA routing (serves index.html for non-API, non-asset routes)
- HMR server attached to Express for seamless development experience

### External Dependencies

**UI & Interaction Libraries**
- Radix UI component primitives (@radix-ui/react-*) for 20+ accessible components
- embla-carousel-react for touch-friendly carousels
- cmdk for command palette functionality
- input-otp for one-time password input
- lucide-react for consistent icon system
- date-fns for date manipulation and formatting
- vaul for drawer components

**Data & Validation**
- Drizzle ORM (drizzle-orm) with PostgreSQL driver preparation
- drizzle-zod for schema-to-Zod validation generation
- Zod for runtime type validation
- TanStack Query for async state management

**Development Tools**
- TypeScript with relaxed compiler settings (noImplicitAny: false, strict: false)
- ESLint with TypeScript plugin and React-specific rules
- tsx for TypeScript execution in Node.js
- Lovable component tagger for development tracking

**Build & Deployment**
- Vite for frontend bundling with SWC plugin
- PostCSS with Tailwind CSS and Autoprefixer
- Three TypeScript configurations: app, node, and root for proper path resolution
- Environment-aware configuration (development vs production modes)

**Future Integration Points**
- Database: Drizzle schema prepared for PostgreSQL migration
- Real-time updates: WebSocket infrastructure can be added for live job tracking
- Authentication: Auth system to be implemented (no current auth in codebase)
- Payment processing: Payment integration pending for job completion
- Geolocation: Map integration for operator tracking and service area visualization