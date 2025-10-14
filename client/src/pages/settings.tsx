import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
        <p className="text-lg text-muted-foreground mt-2">Configure your HomeOps Lab instance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network Configuration</CardTitle>
          <CardDescription>Configure network scanning and discovery settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="network-range">Network Range</Label>
            <Input 
              id="network-range" 
              placeholder="192.168.1.0/24" 
              defaultValue="192.168.1.0/24"
              data-testid="input-network-range"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scan-interval">Scan Interval (minutes)</Label>
            <Input 
              id="scan-interval" 
              type="number" 
              placeholder="60" 
              defaultValue="60"
              data-testid="input-scan-interval"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Discovery</Label>
              <p className="text-sm text-muted-foreground">Automatically scan for new devices</p>
            </div>
            <Switch defaultChecked data-testid="switch-auto-discovery" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring</CardTitle>
          <CardDescription>Configure health checks and monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="check-interval">Health Check Interval (seconds)</Label>
            <Input 
              id="check-interval" 
              type="number" 
              placeholder="30" 
              defaultValue="30"
              data-testid="input-check-interval"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Alerts</Label>
              <p className="text-sm text-muted-foreground">Send email when nodes go offline</p>
            </div>
            <Switch data-testid="switch-email-alerts" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup and export your topology data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-export-json">
              Export as JSON
            </Button>
            <Button variant="outline" data-testid="button-export-yaml">
              Export as YAML
            </Button>
          </div>
          <Separator />
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-import-topology">
              Import Topology
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" data-testid="button-reset">Reset to Defaults</Button>
        <Button data-testid="button-save-settings">Save Settings</Button>
      </div>
    </div>
  );
}
