import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  baseInsertNodeSchema,
  type InsertNode,
  type Service,
  type DeviceMetadata,
} from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

const formSchema = baseInsertNodeSchema
  .extend({
    tags: z.string().optional(),
    customFields: z.array(
      z.object({
        key: z.string().min(1, 'Key is required'),
        value: z.string().min(1, 'Value is required'),
      })
    ).optional(),
  })
  .superRefine((data, ctx) => {
    // Strict numeric validation regex - only accepts numbers with optional decimal
    const numericRegex = /^\d+(\.\d+)?$/;

    // If device is NAS and storage fields are provided, they must be strictly numeric and non-negative
    if (data.deviceType === 'nas') {
      if (data.storageTotal !== undefined && data.storageTotal !== '') {
        if (!numericRegex.test(data.storageTotal)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['storageTotal'],
            message: 'Total storage must be a valid number',
          });
        } else {
          const num = Number(data.storageTotal);
          if (num < 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['storageTotal'],
              message: 'Total storage must be non-negative',
            });
          }
        }
      }
      if (data.storageUsed !== undefined && data.storageUsed !== '') {
        if (!numericRegex.test(data.storageUsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['storageUsed'],
            message: 'Used storage must be a valid number',
          });
        } else {
          const num = Number(data.storageUsed);
          if (num < 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['storageUsed'],
              message: 'Used storage must be non-negative',
            });
          }
        }
      }
      // Ensure used storage doesn't exceed total storage
      if (
        data.storageTotal &&
        data.storageUsed &&
        numericRegex.test(data.storageTotal) &&
        numericRegex.test(data.storageUsed)
      ) {
        const total = Number(data.storageTotal);
        const used = Number(data.storageUsed);
        if (used > total) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['storageUsed'],
            message: 'Used storage cannot exceed total storage',
          });
        }
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

const STANDARD_METADATA_KEYS = new Set([
  'wanIp', 'gateway', 'dhcpRange', 'portCount', 'portSpeed', 'managementType',
  'vlanSupport', 'wifiStandard', 'ssid', 'channel', 'security', 'raidType',
  'protocols', 'runtime', 'image', 'ports', 'cpu', 'ram', 'platform', 'macAddress'
]);

// Helper to extract custom fields from metadata
const getCustomFields = (metadata?: Record<string, any>) => {
  if (!metadata) return [];
  return Object.entries(metadata)
    .filter(([key]) => !STANDARD_METADATA_KEYS.has(key))
    .map(([key, value]) => ({ key, value: String(value) }));
};

interface NodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node?: {
    id: string;
    name: string;
    ip: string;
    osType: string;
    deviceType?: string;
    status: string;
    tags: string[];
    services?: Service[];
    storageTotal?: string;
    storageUsed?: string;
    metadata?: DeviceMetadata;
  };
  defaultDeviceType?: 'server' | 'router' | 'switch' | 'access-point' | 'nas' | 'container';
}

export function NodeFormDialog({
  open,
  onOpenChange,
  node,
  defaultDeviceType,
}: NodeFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!node;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: node?.name || '',
      ip: node?.ip || '',
      osType: node?.osType || '',
      deviceType: (node?.deviceType as any) || defaultDeviceType || 'server',
      status: node?.status || 'unknown',
      tags: node?.tags?.join(', ') || '',
      services: node?.services || [],
      storageTotal: node?.storageTotal || '',
      storageUsed: node?.storageUsed || '',
      metadata: node?.metadata || undefined,
      customFields: getCustomFields(node?.metadata),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  const { fields: customFields, append: appendCustom, remove: removeCustom } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: node?.name || '',
        ip: node?.ip || '',
        osType: node?.osType || '',
        deviceType: (node?.deviceType as any) || defaultDeviceType || 'server',
        status: node?.status || 'unknown',
        tags: node?.tags?.join(', ') || '',
        services: node?.services || [],
        storageTotal: node?.storageTotal || '',
        storageUsed: node?.storageUsed || '',
        metadata: node?.metadata || undefined,
        customFields: getCustomFields(node?.metadata),
      });
    }
  }, [open, node, form, defaultDeviceType]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertNode) => {
      const res = await apiRequest('POST', '/api/nodes', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      toast({
        title: 'Success',
        description: 'Node created successfully',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create node',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertNode>) => {
      const res = await apiRequest('PUT', `/api/nodes/${node!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      toast({
        title: 'Success',
        description: 'Node updated successfully',
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update node',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    const tagsArray = values.tags
      ? values.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      : [];

    let finalMetadata = { ...values.metadata };

    // Mix the custom key-values back into the metadata object
    if (values.customFields && values.customFields.length > 0) {
      values.customFields.forEach(field => {
        if (field.key && field.value) {
          finalMetadata[field.key] = field.value;
        }
      });
    }

    // Clean up empty metadata
    if (Object.keys(finalMetadata).length === 0) {
      finalMetadata = undefined as any;
    }

    const data: InsertNode = {
      name: values.name,
      ip: values.ip,
      osType: values.osType,
      deviceType: values.deviceType,
      status: values.status,
      tags: tagsArray,
      services: values.services || [],
      storageTotal: values.storageTotal,
      storageUsed: values.storageUsed,
      metadata: finalMetadata,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto modern-scrollbar"
        data-testid="dialog-node-form"
      >
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEdit ? 'Edit Node' : 'Add Node'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the node details below'
              : 'Add a new infrastructure node to your network'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. pfSense-VM" {...field} data-testid="input-node-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.1" {...field} data-testid="input-node-ip" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="osType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OS Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ubuntu 22.04" {...field} data-testid="input-node-os" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metadata.macAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MAC Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 00:1A:2B:3C:4D:5E" {...field} value={field.value || ''} data-testid="input-node-mac" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="deviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-device-type">
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="switch">Switch</SelectItem>
                      <SelectItem value="access-point">Access Point</SelectItem>
                      <SelectItem value="nas">Network Attached Storage (NAS)</SelectItem>
                      <SelectItem value="gateway">Gateway / Modem</SelectItem>
                      <SelectItem value="container">Container</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Router-specific fields */}
            {form.watch('deviceType') === 'router' && (
              <>
                <FormField
                  control={form.control}
                  name="metadata.wanIp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WAN IP Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 203.0.113.1"
                          {...field}
                          data-testid="input-wan-ip"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.gateway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gateway</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 192.168.1.1"
                          {...field}
                          data-testid="input-gateway"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.dhcpRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DHCP Range</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 192.168.1.100 - 192.168.1.200"
                          {...field}
                          data-testid="input-dhcp-range"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Switch-specific fields */}
            {form.watch('deviceType') === 'switch' && (
              <>
                <FormField
                  control={form.control}
                  name="metadata.portCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port Count</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 24" {...field} data-testid="input-port-count" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.portSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port Speed</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 1 Gbps, 10 Gbps"
                          {...field}
                          data-testid="input-port-speed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.managementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Management Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-management-type">
                            <SelectValue placeholder="Select management type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="managed">Managed</SelectItem>
                          <SelectItem value="unmanaged">Unmanaged</SelectItem>
                          <SelectItem value="smart">Smart/Web Managed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.vlanSupport"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-vlan-support"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>VLAN Support</FormLabel>
                        <FormDescription>Does this switch support VLANs?</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Access Point-specific fields */}
            {form.watch('deviceType') === 'access-point' && (
              <>
                <FormField
                  control={form.control}
                  name="metadata.wifiStandard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WiFi Standard</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 802.11ax (WiFi 6)"
                          {...field}
                          data-testid="input-wifi-standard"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.ssid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SSIDs (comma separated)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. HomeNetwork-5G, Home-IoT"
                          {...field}
                          data-testid="input-ssid"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 36, 40, 44"
                          {...field}
                          data-testid="input-channel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.security"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. WPA3-Personal"
                          {...field}
                          data-testid="input-security"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Container-specific fields */}
            {form.watch('deviceType') === 'container' && (
              <>
                <FormField
                  control={form.control}
                  name="metadata.runtime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Container Runtime</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-runtime">
                            <SelectValue placeholder="Select runtime" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="docker">Docker</SelectItem>
                          <SelectItem value="podman">Podman</SelectItem>
                          <SelectItem value="containerd">containerd</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. nginx:latest"
                          {...field}
                          data-testid="input-image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.ports"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exposed Ports</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 80:8080, 443:8443"
                          {...field}
                          data-testid="input-ports"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Server-specific fields */}
            {form.watch('deviceType') === 'server' && (
              <>
                <FormField
                  control={form.control}
                  name="metadata.cpu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Intel Xeon E5-2680 v4"
                          {...field}
                          data-testid="input-cpu"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.ram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAM</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 64 GB DDR4" {...field} data-testid="input-ram" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Virtualization Platform</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Proxmox VE, ESXi, KVM"
                          {...field}
                          data-testid="input-platform"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* NAS-specific fields */}
            {form.watch('deviceType') === 'nas' && (
              <>
                <FormField
                  control={form.control}
                  name="storageTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Storage (GB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 1000"
                          {...field}
                          data-testid="input-storage-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storageUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Used Storage (GB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 450"
                          {...field}
                          data-testid="input-storage-used"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.raidType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAID Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. RAID 5, RAID 10, SHR"
                          {...field}
                          data-testid="input-raid-type"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.protocols"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supported Protocols</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. SMB, NFS, iSCSI"
                          {...field}
                          value={field.value?.join(', ') || ''}
                          onChange={e =>
                            field.onChange(
                              e.target.value
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean)
                            )
                          }
                          data-testid="input-protocols"
                        />
                      </FormControl>
                      <FormDescription>Comma-separated list of protocols</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-node-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="degraded">Degraded</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. hypervisor, virtual"
                      {...field}
                      data-testid="input-node-tags"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Services (optional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', url: '' })}
                  data-testid="button-add-service"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No services added. Click "Add Service" to add one.
                </p>
              )}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start p-3 border rounded-md"
                  data-testid={`service-item-${index}`}
                >
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`services.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Service name (e.g. Docker, Plex)"
                              {...field}
                              data-testid={`input-service-name-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`services.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Service URL (e.g. https://plex.local)"
                              {...field}
                              data-testid={`input-service-url-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    data-testid={`button-remove-service-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Custom Metadata Key/Value Array */}
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Custom Attributes</FormLabel>
                  <FormDescription>Store arbitrary metrics like physical location, OS versions, etc.</FormDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendCustom({ key: '', value: '' })}
                  data-testid="button-add-custom-field"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {customFields.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No custom attributes added.
                </p>
              )}
              {customFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start p-3 border rounded-md"
                  data-testid={`custom-field-item-${index}`}
                >
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`customFields.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Key (e.g. rackLocation)"
                              {...field}
                              data-testid={`input-custom-key-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`customFields.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Value (e.g. U14)"
                              {...field}
                              data-testid={`input-custom-val-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustom(index)}
                    data-testid={`button-remove-custom-field-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEdit
                    ? 'Update'
                    : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
