
export interface Player {
  id: string;
  name: string;
  skills: {
    shooting?: number;
    keeper?: number;
    setPieces?: number;
  };
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export type SpotPosition = 0 | 1 | 2 | 3 | 4; // 5 spots numbered 0-4

export interface PenaltyKick {
  playerId: string;
  targetSpot: SpotPosition;
  success: boolean;
}

export interface GameState {
  homeTeam: Team | null;
  awayTeam: Team | null;
  currentTeam: 'home' | 'away';
  homeScore: number;
  awayScore: number;
  currentRound: number;
  maxRounds: number;
  penaltyHistory: PenaltyKick[];
  selectedPlayers: {
    home: string[];
    away: string[];
  };
  selectedGoalkeepers: {
    home: string | null;
    away: string | null;
  };
  gameStatus: 'setup' | 'player-selection' | 'in-progress' | 'completed';
}

export interface PenaltySpot {
  position: SpotPosition;
  x: number;
  y: number;
  label: string;
}

export interface HrfData {
  version: string;
  team: Team;
  players: Player[];
}
