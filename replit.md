# HomeOps Lab

## Overview

HomeOps Lab is a self-hosted network visualization and monitoring platform designed for home lab and self-hosting enthusiasts. It combines interactive infrastructure diagramming, service discovery, and basic monitoring in a modern web application. Users can visualize their network topology, document servers and services, and monitor their home lab infrastructure through an intuitive drag-and-drop interface with real-time health metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server with hot module replacement
- Wouter for lightweight client-side routing (instead of React Router)
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Dark-first design approach with light mode support
- Custom CSS variables for theming (defined in `index.css`)
- Design system inspired by technical infrastructure tools (Linear, Grafana, Proxmox)

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management
- Query client configured with custom fetch utilities in `lib/queryClient.ts`
- No global state management library - relies on React Query cache and component state
- Optimistic updates disabled by default (staleTime: Infinity)

**Interactive Visualization**
- React Flow library for the network canvas/diagramming functionality
- Drag-and-drop node positioning with relationship edges
- Custom node styles based on status (online/offline/degraded)
- Position data stored as JSON in database

**Key Design Patterns**
- Component composition with shadcn/ui primitives
- Custom hooks for reusable logic (use-mobile, use-toast)
- Form handling with React Hook Form and Zod validation
- Controlled components for form inputs
- Toast notifications for user feedback

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and API routing
- TypeScript with ES modules (type: "module")
- Custom middleware for request logging and error handling
- Vite middleware integration for development hot-reload

**API Design**
- RESTful API endpoints under `/api` prefix
- CRUD operations for nodes and edges
- JSON request/response format
- Zod schema validation on incoming requests
- Storage abstraction layer (`IStorage` interface) for database operations

**Database Layer**
- Drizzle ORM for type-safe database queries
- Neon serverless PostgreSQL as the database provider
- WebSocket connection for serverless compatibility
- Schema defined in shared folder for client/server type sharing
- Automatic UUID generation for primary keys

**Database Schema**
- **Nodes table**: Stores infrastructure nodes (servers, containers, devices)
  - Fields: id, name, ip, osType, deviceType, status, tags (array), services (JSONB array), storageTotal, storageUsed, position (JSON), uptime, lastSeen, timestamps
  - Position stored as JSONB for flexible coordinate data
  - deviceType: 'server' | 'router' | 'switch' | 'access-point' | 'nas' | 'container'
  - services: JSON array of {name, url} objects replacing deprecated serviceUrl field
  - storageTotal/storageUsed: optional numeric strings for NAS device capacity tracking
  
- **Edges table**: Stores relationships between nodes
  - Fields: id, source (FK to nodes), target (FK to nodes), animated flag, createdAt
  - Cascade delete when nodes are removed

**Type Safety**
- Shared schema types between client and server (`@shared/schema`)
- Drizzle-Zod integration for runtime validation
- InsertNode and InsertEdge types derived from schema
- TypeScript strict mode enabled

### External Dependencies

**Core Infrastructure**
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Drizzle ORM**: Database toolkit with migration support (`drizzle-kit`)
- **React Flow**: Interactive node-based diagram library

**UI Component Libraries**
- **Radix UI**: Accessible component primitives (40+ components installed)
- **Tailwind CSS**: Utility-first CSS framework with PostCSS
- **shadcn/ui**: Pre-built component system (configured in `components.json`)
- **Lucide React**: Icon library for UI elements

**Form & Validation**
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Schema validation for forms and API payloads
- **@hookform/resolvers**: Zod integration for React Hook Form

**Development Tools**
- **Replit Vite Plugins**: Runtime error overlay, cartographer, dev banner
- **TSX**: TypeScript execution for development server
- **esbuild**: Production build bundler for server code

**Fonts & Styling**
- **Inter**: Primary UI font (400, 500, 600, 700 weights)
- **JetBrains Mono**: Monospace font for technical data (IPs, URLs)
- Google Fonts CDN for font delivery

## Recent Changes (October 14, 2025)

**Device Type System & NAS Storage Tracking** (Latest)
- Added device type support for infrastructure categorization: servers, routers, switches, access points, NAS, and containers
- Implemented device-specific icons in UI (Server, Router, Network, Wifi, HardDrive, Container from Lucide React)
- Added NAS storage capacity tracking with storageTotal and storageUsed fields
- Dashboard now aggregates and displays total NAS storage across all devices with percentage usage
- Node form shows conditional storage fields only when device type is NAS
- Strict numeric validation for storage values using regex pattern /^\d+(\.\d+)?$/
- Form validation ensures used storage cannot exceed total storage
- Storage inputs use type="number" with min="0" and step="0.1" for better UX
- Defensive NaN handling in dashboard and NodeCard calculations prevents UI breakage
- Field-level error messages using Zod superRefine for clear user feedback
- Node cards display storage progress bars for NAS devices with color-coded indicators
- System Health card shows NAS storage usage with dynamic color gradients (green/yellow/red)

**Backend-Frontend Integration Complete**
- Connected all frontend pages to PostgreSQL database via API
- Dashboard now displays real-time stats from database
- Nodes page performs full CRUD operations with backend
- Network Map visualizes actual topology data from database
- Export/import functionality fully implemented and working

**Node Management UI Complete**
- Created NodeFormDialog component for adding and editing nodes
- Add Node button opens form dialog with all required fields
- Edit functionality accessible via node card menu button
- Form validation using React Hook Form with Zod schemas
- Real-time updates with optimistic UI patterns
- Toast notifications for success/error feedback
- Services displayed as badges in node cards for better visibility
- Modern, theme-aware scrollbar for dialog forms (8px thin, transparent track)

**API Security Enhancements**
- Added Zod validation to all routes including strict numeric validation for NAS storage
- Whitelisted fields for update operations to prevent unauthorized modifications
- Validated import data before persistence to prevent injection attacks
- BaseInsertNodeSchema exported separately for frontend form extensions

**UI/UX Enhancements**
- Node edit form supports scrolling with modern, subtle scrollbar styling
- Service names displayed as outline badges in node cards instead of just count
- Custom `.modern-scrollbar` CSS utility for consistent scrollbar appearance
- Scrollbar blends with dark theme using theme border colors
- Device type badges and labels clearly identify infrastructure categories

**Known Limitations**
- Import operation validates upfront but lacks transactional rollback (acceptable for MVP)
- Network discovery remains mocked in UI (planned for future release)
- Metadata validation uses flexible `z.any()` schema for maximum compatibility across device types (trade-off: accepts any JSON structure vs strict per-device validation)

**Network & VLAN Configuration** (November 28, 2025)
- Enhanced Network Configuration to support multiple network ranges
- VLAN management with ID, name, CIDR, and optional description
- Toggle switches to enable/disable individual networks and VLANs
- Add/remove functionality for both networks and VLANs
- Active count badges showing enabled networks/VLANs
- Default sample entries for Main LAN and Management VLAN
- Scan settings section with configurable interval and auto-discovery toggle
- Configuration stored in local state (UI only, not yet persisted to database)

**Storage Settings** (November 28, 2025)
- Added Storage Configuration section to Settings page
- NAS device management with add/edit/delete functionality
- Aggregated storage totals from all NAS devices displayed
- Individual NAS devices shown with progress bars and status
- "Add NAS" button pre-selects NAS device type for quick setup
- Storage summary shows total capacity, used space, and percentage

**Self-Hosted Docker Deployment** (October 14, 2025)
- Complete Docker configuration for self-hosting
- Multi-stage Dockerfile for optimized production builds
- Docker Compose setup with PostgreSQL and application services
- Environment variable configuration via `.env` file
- Comprehensive deployment documentation in `DOCKER.md`
- Database persistence with Docker volumes
- Health checks and automatic container restart policies
- Production-ready with reverse proxy and backup guidelines

**Planned Features** (future releases)
- Network discovery via ARP/ICMP/mDNS (UI stubbed)
- Agent-based monitoring for real-time metrics
- Transactional import with rollback support
- Git sync for versioned backups
- Additional device types based on user needs
- Stricter metadata validation with discriminated unions per device type