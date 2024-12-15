import { EdgeFunctionManager } from '@/components/dashboard/EdgeFunctionManager';
import { LiveStatus } from '@/components/dashboard/LiveStatus';
import { Card } from '@/components/ui/card';

export default function BackendDashboard() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backend Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor backend operations
          </p>
        </div>
        <LiveStatus />
      </div>

      <Card className="p-6">
        <EdgeFunctionManager />
      </Card>
    </div>
  );
}