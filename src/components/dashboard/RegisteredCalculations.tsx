import { CalculationType } from "@/types/calculations";

interface RegisteredCalculationsProps {
  calculationTypes: CalculationType[];
}

export function RegisteredCalculations({ calculationTypes }: RegisteredCalculationsProps) {
  return (
    <div className="glass-card p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Registered Calculations</h3>
      <div className="space-y-4">
        {calculationTypes?.map((calc) => (
          <div
            key={calc.id}
            className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
          >
            <div>
              <h4 className="font-medium">{calc.name}</h4>
              <p className="text-sm text-muted-foreground">
                {calc.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Priority: {calc.priority}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  calc.is_real_time
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {calc.is_real_time ? "Real-time" : "Batch"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}