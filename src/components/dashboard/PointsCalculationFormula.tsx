import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Goal, Clock, Award, Ban, Star } from "lucide-react";

export function PointsCalculationFormula() {
  const { data: rules } = useQuery({
    queryKey: ["scoring-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (!rules) return null;

  const positionRules = [
    {
      position: "Goalkeeper",
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      rules: [
        { action: "Goal scored", points: rules.goals_scored_gkp },
        { action: "Clean sheet", points: rules.clean_sheets_gkp },
        { action: "Every 3 saves", points: rules.saves },
        { action: "Penalty save", points: rules.penalties_saved },
      ],
    },
    {
      position: "Defender",
      icon: <Shield className="h-5 w-5 text-green-500" />,
      rules: [
        { action: "Goal scored", points: rules.goals_scored_def },
        { action: "Clean sheet", points: rules.clean_sheets_def },
        { action: "Every 2 goals conceded", points: rules.goals_conceded_def },
      ],
    },
    {
      position: "Midfielder",
      icon: <Shield className="h-5 w-5 text-yellow-500" />,
      rules: [
        { action: "Goal scored", points: rules.goals_scored_mid },
        { action: "Clean sheet", points: rules.clean_sheets_mid },
      ],
    },
    {
      position: "Forward",
      icon: <Shield className="h-5 w-5 text-red-500" />,
      rules: [
        { action: "Goal scored", points: rules.goals_scored_fwd },
      ],
    },
  ];

  const commonRules = [
    { icon: <Clock className="h-5 w-5" />, action: "Playing up to 60 minutes", points: rules.short_play },
    { icon: <Clock className="h-5 w-5" />, action: "Playing 60 minutes or more", points: rules.long_play },
    { icon: <Goal className="h-5 w-5" />, action: "Assist", points: rules.assists },
    { icon: <Ban className="h-5 w-5 text-yellow-500" />, action: "Yellow card", points: rules.yellow_cards },
    { icon: <Ban className="h-5 w-5 text-red-500" />, action: "Red card", points: rules.red_cards },
    { icon: <Goal className="h-5 w-5 text-red-500" />, action: "Own goal", points: rules.own_goals },
    { icon: <Star className="h-5 w-5 text-yellow-500" />, action: "Bonus points", description: "Top 3 performing players", points: "1-3" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Position-Specific Points</h3>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionRules.map((position) => (
                <>
                  <TableRow key={position.position} className="bg-muted/50">
                    <TableCell className="font-medium flex items-center gap-2">
                      {position.icon} {position.position}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                  {position.rules.map((rule) => (
                    <TableRow key={`${position.position}-${rule.action}`}>
                      <TableCell />
                      <TableCell>{rule.action}</TableCell>
                      <TableCell className="text-right">{rule.points}</TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Common Points Rules</h3>
        <div className="grid gap-4">
          {commonRules.map((rule) => (
            <div key={rule.action} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {rule.icon}
                <div>
                  <p className="font-medium">{rule.action}</p>
                  {rule.description && (
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  )}
                </div>
              </div>
              <span className="font-semibold">{rule.points} pts</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Points Calculation Process</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">1. Base Points</h4>
            <p className="text-sm text-muted-foreground">
              Players receive points based on their playing time: {rules.short_play} points for playing up to 60 minutes,
              or {rules.long_play} points for playing 60 minutes or more.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">2. Action Points</h4>
            <p className="text-sm text-muted-foreground">
              Additional points are awarded for specific actions like goals, assists, and clean sheets.
              These points vary by position to reflect different roles on the field.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">3. Bonus Points</h4>
            <p className="text-sm text-muted-foreground">
              The three best-performing players in each match receive bonus points (3, 2, and 1)
              based on the Bonus Points System (BPS).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">4. Deductions</h4>
            <p className="text-sm text-muted-foreground">
              Points are deducted for yellow cards ({rules.yellow_cards}), red cards ({rules.red_cards}),
              own goals ({rules.own_goals}), and missed penalties ({rules.penalties_missed}).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}