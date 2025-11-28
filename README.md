# HomeOps Lab

A self-hosted network visualization and monitoring platform for home lab enthusiasts. Visualize your infrastructure topology, manage devices, and monitor your home lab through an intuitive drag-and-drop interface.

## Features

### Interactive Network Map
- **Drag-and-drop topology editor** using React Flow
- Visual connections between nodes showing network relationships
- Real-time status indicators (online, offline, degraded)
- Custom node positioning that persists to database

### Device Management
- Support for multiple device types:
  - Servers
  - Routers
  - Switches
  - Access Points
  - NAS devices
  - Containers
- Full CRUD operations for infrastructure nodes
- Service tracking with URLs for quick access
- Tags for organization and filtering

### Storage Monitoring
- Aggregate storage view across all NAS devices
- Individual device capacity tracking
- Visual progress bars with color-coded usage indicators
- Quick "Add NAS" action from Storage Settings

### Network Configuration
- Multiple network range support
- VLAN management with ID, name, CIDR, and descriptions
- Toggle individual networks/VLANs on/off
- Configurable scan intervals
- Auto-discovery settings

### Dashboard
- System health overview
- Device counts by type and status
- Total storage aggregation
- Quick stats at a glance

### Data Management
- Export topology as JSON
- Import existing configurations
- PostgreSQL persistence

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle
- **Visualization**: React Flow
- **State Management**: TanStack Query

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   DATABASE_URL=your_postgres_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Docker Deployment

For self-hosted deployment, see [DOCKER.md](./DOCKER.md) for complete Docker setup instructions including:
- Multi-stage Dockerfile for optimized builds
- Docker Compose configuration with PostgreSQL
- Volume persistence and backup procedures
- Reverse proxy setup guidelines

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and query client
│   │   └── pages/       # Page components
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle schema definitions
└── db/                  # Database configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nodes` | List all nodes |
| POST | `/api/nodes` | Create a new node |
| PUT | `/api/nodes/:id` | Update a node |
| DELETE | `/api/nodes/:id` | Delete a node |
| GET | `/api/edges` | List all edges |
| POST | `/api/edges` | Create a new edge |
| DELETE | `/api/edges/:id` | Delete an edge |
| GET | `/api/export` | Export all topology data |
| POST | `/api/import` | Import topology data |

## License

MIT
