import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@turnpike/shared/components/ui/dialog";
import { Button } from "@turnpike/shared/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@turnpike/shared/components/ui/form";
import { Input } from "@turnpike/shared/components/ui/input";
import { Textarea } from "@turnpike/shared/components/ui/textarea";
import { Switch } from "@turnpike/shared/components/ui/switch";
import { useCreateConsultant, useUpdateConsultant, Consultant } from "@turnpike/shared/api/services/consultants.api";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role_description: z.string().min(5, "Role must be at least 5 characters").max(500),
  avatar_url: z.string().url("Must be a valid URL").min(5).max(300),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultant?: Consultant;
}

export function ConsultantFormDialog({ open, onOpenChange, consultant }: Props) {
  const createMutation = useCreateConsultant();
  const updateMutation = useUpdateConsultant();

  const isEditing = !!consultant;

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      role_description: "",
      avatar_url: "https://ui-avatars.com/api/?name=New+Consultant&background=10b981&color=fff&size=256",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (consultant) {
        form.reset({
          name: consultant.name,
          role_description: consultant.role_description,
          avatar_url: consultant.avatar_url,
          is_active: consultant.is_active,
        });
      } else {
        form.reset({
          name: "",
          role_description: "",
          avatar_url: "https://ui-avatars.com/api/?name=New+Consultant&background=10b981&color=fff&size=256",
          is_active: true,
        });
      }
    }
  }, [open, consultant, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: consultant._id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Consultant" : "Add Consultant"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this consultant profile."
              : "Create a new consultant profile to be shown on the landing page."}
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
                    <Input placeholder="e.g. Sarah Connor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role & Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. I am your human interface media..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Profile</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Display this profile on the public landing page.
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Consultant"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
