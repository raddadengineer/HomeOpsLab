import { StatCard } from '../stat-card';
import { Server, Activity, Network } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <StatCard 
        title="Total Nodes" 
        value={12} 
        icon={Server}
        trend={{ value: "2 new", positive: true }}
      />
      <StatCard 
        title="Uptime" 
        value="99.8%" 
        icon={Activity}
      />
      <StatCard 
        title="Services" 
        value={24} 
        icon={Network}
        trend={{ value: "1 down", positive: false }}
      />
    </div>
  );
}
