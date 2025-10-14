import { NodeCard } from '../node-card';

export default function NodeCardExample() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <NodeCard
        id="1"
        name="Proxmox Server"
        ip="192.168.1.10"
        osType="Proxmox VE"
        status="online"
        tags={["virtual", "hypervisor"]}
        serviceUrl="https://proxmox.local"
        onClick={() => console.log('Node clicked')}
      />
      <NodeCard
        id="2"
        name="TrueNAS Storage"
        ip="192.168.1.20"
        osType="TrueNAS Core"
        status="online"
        tags={["storage", "NAS"]}
        onClick={() => console.log('Node clicked')}
      />
      <NodeCard
        id="3"
        name="Docker Host"
        ip="192.168.1.30"
        osType="Ubuntu Server"
        status="offline"
        tags={["container", "docker"]}
        onClick={() => console.log('Node clicked')}
      />
    </div>
  );
}
