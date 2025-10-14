import { NetworkCanvas } from '../network-canvas';

export default function NetworkCanvasExample() {
  return (
    <div className="h-screen w-full">
      <NetworkCanvas onNodeClick={(node) => console.log('Node clicked:', node)} />
    </div>
  );
}
