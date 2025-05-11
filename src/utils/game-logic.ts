import { GameState, PenaltyKick, Player, SpotPosition } from "../types";

// Define the penalty spots
export const PENALTY_SPOTS = [
  { position: 0, x: -80, y: -50, label: "Top Left" },
  { position: 1, x: 0, y: -60, label: "Top Center" },
  { position: 2, x: 80, y: -50, label: "Top Right" },
  { position: 3, x: -50, y: 0, label: "Bottom Left" },
  { position: 4, x: 50, y: 0, label: "Bottom Right" }
] as const;

// Initialize a new game state
export const initializeGameState = (): GameState => {
  return {
    homeTeam: null,
    awayTeam: null,
    currentTeam: 'home',
    homeScore: 0,
    awayScore: 0,
    currentRound: 0,
    maxRounds: 5,
    penaltyHistory: [],
    selectedPlayers: {
      home: [],
      away: []
    },
    selectedGoalkeepers: {
      home: null,
      away: null
    },
    gameStatus: 'setup'
  };
};

// Calculate success probability based on player skills and spot difficulty
export const calculateSuccessProbability = (
  shooter: Player,
  goalkeeper: Player,
  targetSpot: SpotPosition
): number => {
  // Base probability
  let successProbability = 0.5;
  
  // Adjust based on shooter's skills (shooting and set pieces)
  const shootingSkill = shooter.skills.shooting || 5;
  const setPiecesSkill = shooter.skills.setPieces || 5;
  
  // Weighted average of relevant skills
  const shooterSkillFactor = (shootingSkill * 0.6 + setPiecesSkill * 0.4) / 10;
  
  // Goalkeeper skill factor
  const keeperSkill = goalkeeper.skills.keeper || 5;
  const keeperSkillFactor = keeperSkill / 20; // Less impact than shooter
  
  // Spot difficulty factor (center is easier, corners are harder)
  const spotDifficultyMap: Record<SpotPosition, number> = {
    0: 1.0, // Top Left (normal)
    1: 1.1, // Top Center (easier)
    2: 1.0, // Top Right (normal)
    3: 0.9, // Bottom Left (harder)
    4: 0.9  // Bottom Right (harder)
  };
  
  // Calculate final probability
  successProbability = Math.min(
    0.95, // Maximum probability cap
    Math.max(
      0.2,  // Minimum probability floor
      successProbability + 
      (shooterSkillFactor * 0.4) - // Shooter contributes up to 40%
      (keeperSkillFactor * 0.2) +  // Keeper can reduce by up to 20%
      ((spotDifficultyMap[targetSpot] - 1) * 0.1) // Spot adjustment
    )
  );
  
  return successProbability;
};

// Simulate a penalty kick
export const simulatePenaltyKick = (
  shooter: Player,
  goalkeeper: Player,
  targetSpot: SpotPosition
): PenaltyKick => {
  const successProbability = calculateSuccessProbability(shooter, goalkeeper, targetSpot);
  const success = Math.random() <= successProbability;
  
  return {
    playerId: shooter.id,
    targetSpot,
    success
  };
};

// Update game state after a penalty kick
export const processKickResult = (
  gameState: GameState,
  kickResult: PenaltyKick
): GameState => {
  const newGameState = { ...gameState };
  
  // Add kick to history
  newGameState.penaltyHistory = [...gameState.penaltyHistory, kickResult];
  
  // Update score if successful
  if (kickResult.success) {
    if (gameState.currentTeam === 'home') {
      newGameState.homeScore += 1;
    } else {
      newGameState.awayScore += 1;
    }
  }
  
  // Toggle team
  newGameState.currentTeam = gameState.currentTeam === 'home' ? 'away' : 'home';
  
  // Update round if both teams have kicked
  if (gameState.currentTeam === 'away') {
    newGameState.currentRound += 1;
  }
  
  // Check if game is completed
  if (newGameState.currentRound > gameState.maxRounds) {
    newGameState.gameStatus = 'completed';
  }
  
  // Check for early win (impossible to catch up)
  const remaining = gameState.maxRounds - newGameState.currentRound;
  if (
    Math.abs(newGameState.homeScore - newGameState.awayScore) > remaining &&
    newGameState.currentRound > 0
  ) {
    newGameState.gameStatus = 'completed';
  }
  
  return newGameState;
};

// Get current kicker and goalkeeper
export const getCurrentActors = (gameState: GameState): { shooter: Player | null; goalkeeper: Player | null } => {
  const shooterTeam = gameState.currentTeam === 'home' ? gameState.homeTeam : gameState.awayTeam;
  const goalkeeperTeam = gameState.currentTeam === 'home' ? gameState.awayTeam : gameState.homeTeam;
  
  if (!shooterTeam || !goalkeeperTeam) {
    return { shooter: null, goalkeeper: null };
  }
  
  const shooterIndex = gameState.currentRound % (gameState.selectedPlayers[gameState.currentTeam].length || 5);
  const shooterId = gameState.selectedPlayers[gameState.currentTeam][shooterIndex];
  
  const shooter = shooterTeam.players.find(p => p.id === shooterId) || null;
  
  const goalkeeperId = gameState.currentTeam === 'home' 
    ? gameState.selectedGoalkeepers.away 
    : gameState.selectedGoalkeepers.home;
    
  const goalkeeper = goalkeeperId 
    ? goalkeeperTeam.players.find(p => p.id === goalkeeperId) || null 
    : null;
    
  return { shooter, goalkeeper };
};
