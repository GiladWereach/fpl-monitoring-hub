import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { PredictionValidation } from "../types";

interface ValidationsListProps {
  validations: PredictionValidation[];
}

export function ValidationsList({ validations }: ValidationsListProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Validations</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {validations?.map((validation) => (
            <div
              key={validation.id}
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`h-2 w-2 rounded-full ${
                  validation.accuracy_metrics?.was_correct ? 
                  'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium">
                    {validation.price_predictions?.prediction_type} Prediction
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {validation.price_predictions?.confidence_score}/5
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="font-medium">
                    {validation.actual_timestamp ? 
                      format(new Date(validation.actual_timestamp), 'MMM d, HH:mm') :
                      'Pending'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Actual time
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {validation.predicted_timestamp ?
                      format(new Date(validation.predicted_timestamp), 'MMM d, HH:mm') :
                      'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Predicted time
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}