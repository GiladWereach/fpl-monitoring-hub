import { PlayerSelection } from './types';

export function calculateFormation(picks: PlayerSelection[]): string {
  const starters = picks.filter(p => p.position <= 11);
  const defenders = starters.filter(p => p.element_type === 2).length;
  const midfielders = starters.filter(p => p.element_type === 3).length;
  const forwards = starters.filter(p => p.element_type === 4).length;

  return `${defenders}-${midfielders}-${forwards}`;
}

export function getFormationPositions(formation: string) {
  const [def, mid, fwd] = formation.split('-').map(Number);
  return {
    defenders: Array.from({ length: def }, (_, i) => i + 2),
    midfielders: Array.from({ length: mid }, (_, i) => i + 2 + def),
    forwards: Array.from({ length: fwd }, (_, i) => i + 2 + def + mid)
  };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};