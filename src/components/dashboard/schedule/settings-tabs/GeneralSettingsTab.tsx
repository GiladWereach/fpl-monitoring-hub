import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Schedule } from "@/types/scheduling";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GeneralSettingsTabProps {
  schedule: Schedule;
  onSave: (updatedSchedule: Partial<Schedule>) => Promise<void>;
}

type GeneralSettingsForm = {
  description?: string;
  priority?: number;
  group_id?: string;
};

export function GeneralSettingsTab({ schedule, onSave }: GeneralSettingsTabProps) {
  const form = useForm<GeneralSettingsForm>({
    defaultValues: {
      description: schedule.description || "",
      priority: schedule.priority || 0,
      group_id: ""
    }
  });

  const { data: groups } = useQuery({
    queryKey: ["schedule-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_groups")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const onSubmit = async (data: GeneralSettingsForm) => {
    await onSave({
      description: data.description,
      priority: data.priority
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Input {...form.register("description")} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority Level</label>
          <Input
            type="number"
            min={0}
            max={100}
            {...form.register("priority", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Group</label>
          <Select
            value={form.watch("group_id")}
            onValueChange={(value) => form.setValue("group_id", value)}
          >
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
          Save Changes
        </Button>
      </form>
    </Form>
  );
}