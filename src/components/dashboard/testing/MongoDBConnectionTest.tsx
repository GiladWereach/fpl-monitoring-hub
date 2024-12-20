import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function MongoDBConnectionTest() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsRunning(true);
    try {
      console.log("Testing MongoDB connection...");
      const { data, error } = await supabase.functions.invoke('test-mongodb-connection');
      
      if (error) throw error;
      
      console.log("MongoDB connection test result:", data);
      
      toast({
        title: "Connection Test Successful",
        description: "Successfully connected to MongoDB database",
      });
    } catch (error) {
      console.error("MongoDB connection test error:", error);
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">MongoDB Connection Test</h3>
        <Button 
          onClick={testConnection} 
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Test the connection to your MongoDB database. This will verify your configuration and connectivity.
      </p>
    </Card>
  );
}