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
  - Fields: id, name, ip, osType, status, tags (array), serviceUrl, position (JSON), uptime, lastSeen, timestamps
  - Position stored as JSONB for flexible coordinate data
  
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

**Planned Features** (based on design docs)
- Network discovery via ARP/ICMP/mDNS (not yet implemented)
- Agent-based monitoring (future feature)
- Export/import topology as JSON/YAML (routes exist but not fully implemented)
- Git sync for versioned backups (planned)