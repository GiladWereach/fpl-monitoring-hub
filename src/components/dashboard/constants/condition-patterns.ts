import { EventCondition } from "../types/scheduling";

export const COMMON_PATTERNS: Array<{
  name: string;
  conditions: EventCondition[];
  description: string;
}> = [
  {
    name: "Match Completion",
    conditions: [
      { field: "status", operator: "eq", value: "FINISHED" }
    ],
    description: "Triggers when a match ends"
  },
  {
    name: "Gameweek Start",
    conditions: [
      { field: "is_current", operator: "eq", value: "true" }
    ],
    description: "Triggers at the start of a new gameweek"
  },
  {
    name: "Data Verification",
    conditions: [
      { field: "finished", operator: "eq", value: "true" },
      { field: "data_checked", operator: "eq", value: "true" }
    ],
    description: "Triggers when gameweek data is verified"
  }
];