import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { functions } from "@/components/dashboard/utils/functionConfigs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NewFunctionFormValues {
  name: string;
  groupId: string;
}

interface NewFunctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewFunctionFormValues) => Promise<void>;
}

export function NewFunctionDialog({ open, onOpenChange, onSubmit }: NewFunctionDialogProps) {
  const form = useForm<NewFunctionFormValues>();

  const { data: groups } = useQuery({
    queryKey: ['schedule-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Function</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Function Name</label>
              <Select onValueChange={(value) => form.setValue("name", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select function" />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((func) => (
                    <SelectItem key={func.function} value={func.function}>
                      {func.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Function Group</label>
              <Select onValueChange={(value) => form.setValue("groupId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Create Function Schedule
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}