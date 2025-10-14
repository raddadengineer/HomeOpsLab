# HomeOps Lab - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid System - Technical Infrastructure Aesthetic
Drawing inspiration from modern infrastructure tools (Linear, Grafana, Proxmox, Netbox) with custom interactive visualization components. Dark-first design with technical precision and visual clarity for home lab enthusiasts.

**Key Design Principles:**
1. Technical Confidence - Professional infrastructure tool aesthetic
2. Information Density - Maximum useful data without clutter
3. Interactive Focus - Canvas-first experience with supporting UI
4. Visual Hierarchy - Clear status indicators and health metrics

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background Base: 220 20% 10% (deep slate)
- Background Elevated: 220 18% 14% (cards, panels)
- Background Interactive: 220 16% 18% (hover states)
- Primary (Teal): 180 65% 55% (active states, primary actions)
- Primary Hover: 180 70% 48%
- Accent (Orange): 25 90% 60% (alerts, critical states, CTAs)
- Success: 145 65% 50% (node online, healthy)
- Warning: 40 90% 55% (degraded)
- Error: 0 75% 55% (offline, critical)
- Text Primary: 220 10% 95%
- Text Secondary: 220 10% 70%
- Border Subtle: 220 15% 25%

**Light Mode (Optional):**
- Background: 220 15% 98%
- Surface: 0 0% 100%
- Primary/Accent colors remain vibrant for consistency

### B. Typography

**Font Families:**
- Primary: Inter (400, 500, 600, 700) - UI text, labels, data
- Monospace: JetBrains Mono (400, 500) - IPs, URLs, technical data
- Display: Inter (600, 700) - Headings, branding

**Type Scale:**
- Hero/Display: text-4xl font-bold (36px)
- Page Titles: text-2xl font-semibold (24px)
- Section Headers: text-lg font-semibold (18px)
- Body Text: text-sm font-normal (14px)
- Labels/Meta: text-xs font-medium (12px)
- Code/Technical: font-mono text-xs (12px)

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (gaps, padding): p-2, p-4
- Component spacing: p-6, p-8, gap-4
- Section spacing: py-12, py-16
- Canvas margins: m-8, m-12

**Grid System:**
- Main Layout: Sidebar (280px fixed) + Canvas (flex-1) + Details Panel (360px slide-in)
- Dashboard: 12-column grid with 3/4/6 column card layouts
- Responsive: Stack to single column on mobile (<768px)

### D. Component Library

**Navigation:**
- Top Bar (h-16): Logo, global search (Cmd+K), user menu, theme toggle
- Left Sidebar (w-70): Collapsed icons (w-16) or full navigation, sticky sections
  - Dashboard, Network Map, Nodes, Services, Discovery, Settings
  - Active state: teal left border (border-l-4) + teal text + subtle bg
- Breadcrumbs: text-xs with slash separators for deep navigation

**Interactive Canvas:**
- Full viewport height (calc(100vh - 64px))
- Dark grid pattern background (dot or square grid, subtle)
- Minimap in bottom-right corner (160x120px)
- Floating toolbar (top-center): Zoom controls, fit view, layout options
- Node visual specs:
  - Size: 120x80px rounded rectangles (rounded-lg)
  - Icon + Label + Status dot
  - Connection ports (4 sides)
  - Hover: teal border glow (shadow-lg shadow-teal-500/30)
  - Selected: thick teal border (border-2 border-teal-500)
  - Offline: red border (border-red-500)

**Cards & Panels:**
- Standard Card: rounded-xl border border-subtle bg-elevated p-6
- Stat Card: Metric + label + trend indicator + sparkline
- Node Card: Icon (48px) + Name + IP + Tags + Quick actions
- Shadow: shadow-lg for elevated cards

**Forms & Inputs:**
- Input Fields: h-10 rounded-md border border-subtle bg-base px-4
  - Focus: border-teal-500 ring-2 ring-teal-500/20
- Buttons:
  - Primary: bg-teal-600 hover:bg-teal-500 text-white h-10 px-6 rounded-md
  - Secondary: border border-subtle hover:bg-elevated
  - Danger: bg-orange-600 hover:bg-orange-500
- Select/Dropdown: Custom styled with chevron icon
- Toggle Switches: Teal when active

**Data Display:**
- Tables: Striped rows, sticky header, hover highlight
  - Header: bg-elevated border-b-2 border-teal-500
  - Rows: hover:bg-interactive
- Status Badges: rounded-full px-3 py-1 text-xs font-medium
  - Online: bg-green-500/20 text-green-400 border border-green-500/50
  - Offline: bg-red-500/20 text-red-400 border border-red-500/50
- Metrics: Large number (text-3xl font-bold) + small label below

**Modal/Overlays:**
- Slide-in Panel (Details): 360px from right, backdrop blur
- Modal Dialog: max-w-2xl centered, dark overlay (bg-black/60)
- Toast Notifications: Top-right, 4s auto-dismiss, teal/orange based on type

**Dashboard Widgets:**
- System Status Grid: 3-4 columns of stat cards
- Network Health Chart: Line chart showing uptime over time
- Recent Activity Feed: Timeline with icons and timestamps
- Quick Actions Panel: 2x2 grid of common tasks
- Service List: Table with status, URL, and last check time

### E. Animations

**Strategic Use Only:**
- Node connections: Subtle pulse on active links (animation: pulse 2s infinite)
- Status indicators: Gentle breathing effect for online nodes
- Panel transitions: slide-in/out (duration-300)
- Loading states: Skeleton screens, not spinners
- Avoid: Excessive hover effects, distracting canvas animations

---

## Layout Specifications

**Main Canvas View:**
- Full-screen interactive workspace
- Top bar with search and actions
- Collapsible left sidebar (hover to expand on collapse)
- Right panel slides in when node selected
- Bottom status bar: Connection count, last scan, health summary

**Dashboard View:**
- Hero section (h-32): Overall health score + critical alerts
- 4-column stat grid: Total nodes, Services, Uptime %, Active connections
- 2-column layout below: Charts (left 8-cols) + Activity feed (right 4-cols)
- Service table spanning full width
- Footer stats: Last discovery scan, database size, agent status

**Node Detail Panel:**
- Header: Icon + Name + Status badge
- Tabs: Overview, Services, Monitoring, Connections, Edit
- Metadata grid: IP, OS, Tags, Custom fields
- Service links: Clickable buttons with external link icon
- Health metrics: Uptime chart, response times, last seen
- Quick actions footer: Edit, Delete, Restart monitoring

---

## Images

**Dashboard Hero Background:**
- Subtle abstract network visualization (nodes and connections)
- Dark teal gradient overlay (from 220 20% 10% to teal-900/40)
- Positioned as background, not prominent foreground
- Location: Dashboard hero section only

**Node Type Icons:**
- Use FontAwesome or Heroicons for node type indicators
- Server: server icon
- Container: cube icon
- Router: wifi icon
- NAS: database icon
- VM: desktop icon

**Empty States:**
- Illustration for empty canvas: "No nodes yet - Click discover or add manually"
- Simple line art style, teal accents
- Location: Center of canvas when no nodes exist

No large hero images - this is a functional tool, not marketing site.