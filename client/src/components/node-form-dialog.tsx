import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNodeSchema, type InsertNode, type Service } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";

const formSchema = insertNodeSchema.extend({
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node?: {
    id: string;
    name: string;
    ip: string;
    osType: string;
    status: string;
    tags: string[];
    services?: Service[];
  };
}

export function NodeFormDialog({ open, onOpenChange, node }: NodeFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!node;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: node?.name || "",
      ip: node?.ip || "",
      osType: node?.osType || "",
      status: node?.status || "unknown",
      tags: node?.tags?.join(", ") || "",
      services: node?.services || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: node?.name || "",
        ip: node?.ip || "",
        osType: node?.osType || "",
        status: node?.status || "unknown",
        tags: node?.tags?.join(", ") || "",
        services: node?.services || [],
      });
    }
  }, [open, node, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertNode) => {
      const res = await apiRequest("POST", "/api/nodes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      toast({
        title: "Success",
        description: "Node created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create node",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertNode>) => {
      const res = await apiRequest("PUT", `/api/nodes/${node!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      toast({
        title: "Success",
        description: "Node updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update node",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    const tagsArray = values.tags 
      ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const data: InsertNode = {
      name: values.name,
      ip: values.ip,
      osType: values.osType,
      status: values.status,
      tags: tagsArray,
      services: values.services || [],
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-node-form">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEdit ? "Edit Node" : "Add Node"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the node details below" : "Add a new infrastructure node to your network"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Proxmox Server" {...field} data-testid="input-node-name" />
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
                    <Input placeholder="e.g. 192.168.1.10" {...field} data-testid="input-node-ip" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="osType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OS Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Proxmox VE, Ubuntu 22.04" {...field} data-testid="input-node-ostype" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <Input placeholder="e.g. hypervisor, virtual" {...field} data-testid="input-node-tags" />
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
                  onClick={() => append({ name: "", url: "" })}
                  data-testid="button-add-service"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">No services added. Click "Add Service" to add one.</p>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md" data-testid={`service-item-${index}`}>
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`services.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Service name (e.g. Docker, Plex)" {...field} data-testid={`input-service-name-${index}`} />
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
                            <Input placeholder="Service URL (e.g. https://plex.local)" {...field} data-testid={`input-service-url-${index}`} />
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
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
