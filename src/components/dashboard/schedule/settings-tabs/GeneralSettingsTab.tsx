import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Schedule } from "@/types/scheduling";

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

  const onSubmit = async (data: GeneralSettingsForm) => {
    const updateData: Partial<Schedule> = {
      description: data.description,
      priority: data.priority
    };
    await onSave(updateData);
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

        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Form>
  );
}