export interface MatchWindowState {
  state: 'active' | 'inactive';
  start_time: Date;
  end_time: Date | null;
  active_fixtures: number;
  metadata: {
    next_kickoff: Date | null;
    previous_state: string | null;
  };
}