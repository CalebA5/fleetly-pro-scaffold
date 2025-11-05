# Fleetly - On-Demand Trucks & Snow Services Platform

## Overview

Fleetly is a professional on-demand service platform connecting customers with verified operators for trucking, snow plowing, towing, hauling, and courier services. The application provides a two-sided marketplace with separate dashboards for customers seeking services and operators offering them.

The platform is built as a full-stack TypeScript application using React for the frontend and Express for the backend, with a focus on real-time service booking, job tracking, and professional service delivery.

**Design Philosophy:** Inspired by Uber's clean, modern interface with emphasis on simplicity and ease of use. Features a black-and-white color scheme with minimal design elements and bold typography.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 2025)

### Shared Header Component - Universal Navigation (November 2025)
**Unified header across all pages** providing consistent navigation and authentication experience:

**Shared Header Component**
- Created reusable Header component (client/src/components/Header.tsx) used across all pages
- Clickable Fleetly logo always returns to homepage (/) from any page
- Navigation buttons: Browse Operators, Drive & Earn, Sign in, Sign up (when not authenticated)
- Profile dropdown menu appears when authenticated (replacing Sign in/Sign up buttons)
- Smart Drive & Earn logic: triggers auth for unauthenticated users, shows onboarding for incomplete profiles, or navigates to operator dashboard
- Consistent styling with Uber-inspired black and white theme

**Universal Deployment**
- Homepage (Index.tsx) uses shared Header
- Customer pages (OperatorMap, ServiceRequest, JobTracking, etc.) use shared Header
- Operator pages (OperatorHome, JobManagement, OperatorOnboarding) use shared Header
- All pages maintain page-specific content below the header
- Profile dropdown navigation works across customer and operator domains

**ProfileDropdown Improvements**
- "Request Services" menu item links to operator map (/customer/operator-map)
- Cross-domain navigation between customer and operator features
- Menu items: Profile, Drive & Earn, Request Services, Help & Support, Sign out

### Unified Landing Page - Uber-Inspired Redesign (November 2025)
**Complete landing experience overhaul** to match Uber's proven customer acquisition pattern:

**Single Customer-Focused Homepage**
- Unified landing page (Index.tsx) replacing separate customer/operator landing pages
- Clean, modern header with navigation: Browse Operators, Drive & Earn, Sign in, Sign up
- Interactive Uber-style pickup/dropoff location inputs in hero section
- Real-time availability preview showing "5 min away" for services after location search
- Browse operators functionality accessible without authentication
- "Drive & Earn" button for operators triggers auth dialog for registration
- Professional operators shown without requiring login (similar to Uber's browse experience)

**Interactive Service Discovery Flow**
- Two-step user journey: Enter location → See availability → Sign in to book
- Service cards (Snow Plowing, Towing, Hauling) show estimated arrival times and pricing
- Clicking service cards triggers authentication before booking (Uber pattern)
- "See available operators" button toggles availability preview dynamically
- Maintains simplicity while adding engaging interactivity

**Features & Content Organization**
- Moved all key content from CustomerHome to main landing page
- "Why choose Fleetly" features section with Fast Response, Verified Operators, Top Rated
- Black CTA section at bottom encouraging operator sign-ups
- Sticky header for easy navigation throughout scrolling experience
- All proper test IDs for UI testing across interactive elements

**Operator Domain:**
- Applied Uber-inspired theme to operator dashboard
- Clean black and white color scheme
- Modern card-based layout for stats and job requests
- Consistent typography and spacing across all pages

### Dynamic Authentication System (November 2025)
**Unified User Experience** - Users can be customers, operators, or both with a single account

**Core Components:**
- **AuthContext** - React Context managing authentication state with in-memory user database
  - Preserves user role (customer/operator/both) and operator profile completion across sessions
  - Mock authentication ready for backend integration
- **ProfileDropdown** - Authenticated user menu with Profile, Drive & Earn, Request Services, Help & Support, Sign out
- **AuthDialog** - Tabbed sign-in/sign-up with role-based signup (customer or operator)
  - Tab synchronization ensures correct form appears (signin/signup) when triggered
  - Operator signups automatically redirect to onboarding after account creation

**Smart Drive & Earn Flow:**
- **Unauthenticated users:** Click Drive & Earn → Sign up dialog (operator role) → Onboarding page
- **Authenticated without operator profile:** Click Drive & Earn → Prompt to complete profile → Onboarding page
- **Authenticated with complete profile:** Click Drive & Earn → Direct access to operator dashboard

**Header Behavior:**
- **Not signed in:** Shows Browse Operators, Drive & Earn, Sign in, Sign up buttons
- **Signed in:** Shows Browse Operators, Drive & Earn, and profile icon with dropdown menu
- Sign in/Sign up buttons dynamically hidden when authenticated

**Operator Onboarding:**
- Multi-step form for business info, vehicle details, services, and documents
- Marks operator profile as complete upon submission
- Redirects to operator dashboard after completion
- Profile completion state persists across sign-out/sign-in cycles

### Unified Map Implementation
- **Consolidated** two redundant map pages (OperatorBrowsing + OperatorMapSimple) into single unified OperatorMap page
- **Service filters** - Filter operators by service type (Snow Plowing, Towing, Hauling, etc.)
- **Map/Satellite toggle** - Switch between map and satellite view
- **Operator sidebar** - Detailed operator cards with ratings, services, vehicles, and pricing
- **Interactive map** - Click markers to select operators and center map
- **Authentication integration** - Request Service button triggers auth dialog
- Note: Map tiles experiencing loading issues in current environment (tried OpenStreetMap, CARTO, Esri providers)

### Code Cleanup & Navigation Fixes (November 2025)
- Removed redundant OperatorBrowsing.tsx and OperatorMapSimple.tsx files
- Updated routing to use unified OperatorMap component
- Both /customer/operators and /customer/operator-map routes now point to unified page
- **Fixed logo navigation** - Logo from all pages now correctly returns to homepage (/)
- **Eliminated duplicate landing pages** - /customer route now redirects to / (main landing)
- **Clarified operator access** - Operators access their dashboard at /operator after registration
- Sign in/Sign up buttons always visible until authenticated
- Request Service buttons trigger auth dialog when user not signed in

### Advanced Features (November 2025)

**Favorite Drivers System**
- Heart button on operator cards to mark/unmark favorites
- Backend API with Zod-validated POST /api/favorites and DELETE /api/favorites/:id endpoints
- "Your Favorites Online" section on customer map showing only favorited operators currently online
- Real-time state updates with TanStack Query cache invalidation
- Success/error toast notifications for all favorite actions
- Persistent favorite status across page refreshes via in-memory storage

**Customer Rating System**
- Post-service rating dialog with 1-5 star selection (interactive hover states)
- Optional comment field for detailed feedback
- Backend API endpoint POST /api/ratings with validation
- Proper form state management with React Hook Form
- Success/error toasts with loading states during submission
- All ratings stored and associated with specific operators

**Real-Time Driver Tracking**
- Interactive map with live operator location updates every 2 seconds
- Custom Leaflet markers with two states:
  - Pulsing red divIcon for operators en route (moving)
  - Default blue marker for stationary operators
- Simulated realistic movement toward random destinations
- Marker popups show operator status ("En Route" or "Arrived")
- Efficient state management using Map<string, OperatorLocation> for quick lookups
- CSS pulse animation for moving operator markers
- Automatic status transitions when operators reach destinations

**Location-Based Customer Grouping**
- Automated opportunity detection for operators serving same geographic areas
- 4-minute countdown timer with MM:SS format (zero-padded)
- Prominent notification card with orange border and warm glow effect
- Displays up to 3 nearby customer cards showing:
  - Customer name, service type, and location
  - Distance from operator
  - Customer rating and last service date
  - Estimated earnings potential
- Individual "Contact" buttons per customer
- "Contact All Customers" bulk action button
- "Snooze for Later" and manual dismiss options
- Auto-dismiss when timer reaches 0:00
- Proper interval cleanup to prevent memory leaks

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