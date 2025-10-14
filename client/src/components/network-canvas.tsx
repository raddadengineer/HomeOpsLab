import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface NetworkCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodeClick?: (node: Node) => void;
}

const defaultNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: { label: 'Proxmox Server' },
    style: { 
      background: 'hsl(var(--card))', 
      border: '2px solid hsl(var(--primary))',
      borderRadius: '8px',
      padding: '12px',
      color: 'hsl(var(--card-foreground))',
    },
  },
  {
    id: '2',
    position: { x: 100, y: 250 },
    data: { label: 'TrueNAS' },
    style: { 
      background: 'hsl(var(--card))', 
      border: '2px solid hsl(var(--card-border))',
      borderRadius: '8px',
      padding: '12px',
      color: 'hsl(var(--card-foreground))',
    },
  },
  {
    id: '3',
    position: { x: 400, y: 250 },
    data: { label: 'Docker Host' },
    style: { 
      background: 'hsl(var(--card))', 
      border: '2px solid hsl(var(--card-border))',
      borderRadius: '8px',
      padding: '12px',
      color: 'hsl(var(--card-foreground))',
    },
  },
];

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'hsl(var(--primary))' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: 'hsl(var(--primary))' } },
];

export function NetworkCanvas({ 
  initialNodes = defaultNodes, 
  initialEdges = defaultEdges,
  onNodeClick 
}: NetworkCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-full bg-background" data-testid="canvas-network">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick?.(node)}
        fitView
      >
        <Background color="hsl(var(--border))" gap={16} />
        <Controls className="bg-card border border-border" />
        <MiniMap 
          className="bg-card border border-border" 
          nodeColor="hsl(var(--primary))"
        />
      </ReactFlow>
    </div>
  );
}
