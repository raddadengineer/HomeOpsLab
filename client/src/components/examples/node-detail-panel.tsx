import { NodeDetailPanel } from '../node-detail-panel';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function NodeDetailPanelExample() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-screen relative">
      <div className="p-4">
        <Button onClick={() => setIsOpen(!isOpen)}>
          Toggle Panel
        </Button>
      </div>
      <NodeDetailPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        node={{
          id: '1',
          name: 'Proxmox Server',
          ip: '192.168.1.10',
          osType: 'Proxmox VE',
          status: 'online',
          tags: ['virtual', 'hypervisor', 'production'],
          serviceUrl: 'https://proxmox.local',
          uptime: '99.8%',
          lastSeen: '2 min ago'
        }}
      />
    </div>
  );
}
