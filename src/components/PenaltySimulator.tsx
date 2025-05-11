
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameState, SpotPosition } from "@/types";
import { PenaltyField } from "./PenaltyField";
import { calculateSuccessProbability, getCurrentActors, processKickResult, simulatePenaltyKick } from "@/utils/game-logic";
import { toast } from "@/components/ui/use-toast";

interface PenaltySimulatorProps {
  gameState: GameState;
  onUpdateGameState: (newState: GameState) => void;
  onRestart: () => void;
}

export const PenaltySimulator: React.FC<PenaltySimulatorProps> = ({
  gameState,
  onUpdateGameState,
  onRestart,
}) => {
  const [selectedSpot, setSelectedSpot] = useState<SpotPosition | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { shooter, goalkeeper } = getCurrentActors(gameState);
  
  const handleSpotSelect = (spot: SpotPosition) => {
    setSelectedSpot(spot);
  };
  
  const handleTakePenalty = () => {
    if (!shooter || !goalkeeper || selectedSpot === null) return;
    
    setIsAnimating(true);
    
    // Simulate the kick
    const kickResult = simulatePenaltyKick(shooter, goalkeeper, selectedSpot);
    
    // Update game state after animation completes
    setTimeout(() => {
      const newGameState = processKickResult(gameState, kickResult);
      
      // Show result notification
      toast({
        title: kickResult.success ? "GOAL!" : "SAVED!",
        description: kickResult.success 
          ? `${shooter.name} scores!` 
          : `Goalkeeper saves the shot!`,
        variant: kickResult.success ? "default" : "destructive",
      });
      
      onUpdateGameState(newGameState);
      setIsAnimating(false);
      setSelectedSpot(null);
    }, 1000); // Timing should match animation duration
  };
  
  const getSuccessProbability = () => {
    if (!shooter || !goalkeeper || selectedSpot === null) return null;
    
    return calculateSuccessProbability(shooter, goalkeeper, selectedSpot) * 100;
  };
  
  // Reset selection when turn changes
  useEffect(() => {
    setSelectedSpot(null);
  }, [gameState.currentTeam, gameState.currentRound]);
  
  // Game completed state
  if (gameState.gameStatus === "completed") {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <Card className="p-6">
          <h2 className="text-3xl font-bold mb-4">Game Results</h2>
          <div className="text-2xl font-semibold mb-6">
            {gameState.homeTeam?.name || "Home"} {gameState.homeScore} - {gameState.awayScore} {gameState.awayTeam?.name || "Away"}
          </div>
          
          <h3 className="text-xl font-bold">
            {gameState.homeScore > gameState.awayScore
              ? `${gameState.homeTeam?.name || "Home"} Wins!`
              : gameState.awayScore > gameState.homeScore
                ? `${gameState.awayTeam?.name || "Away"} Wins!`
                : "It's a Draw!"}
          </h3>
          
          <Button 
            onClick={onRestart} 
            variant="outline"
            className="mt-6"
          >
            Play Again
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Home</div>
          <div className="text-2xl font-bold">{gameState.homeScore}</div>
          <div className="text-xs">{gameState.homeTeam?.name}</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold">Round {gameState.currentRound + 1} of {gameState.maxRounds}</div>
          <div className="text-sm text-muted-foreground">
            {gameState.currentTeam === "home" ? gameState.homeTeam?.name : gameState.awayTeam?.name}'s turn
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Away</div>
          <div className="text-2xl font-bold">{gameState.awayScore}</div>
          <div className="text-xs">{gameState.awayTeam?.name}</div>
        </div>
      </div>
      
      {/* Current player info */}
      {shooter && goalkeeper && (
        <div className="flex justify-between px-4 py-2 bg-secondary rounded-md">
          <div>
            <div className="text-sm font-medium">Kicker</div>
            <div>{shooter.name}</div>
            <div className="text-xs text-muted-foreground">
              Shooting: {shooter.skills.shooting || "?"} | 
              Set Pieces: {shooter.skills.setPieces || "?"}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">Goalkeeper</div>
            <div>{goalkeeper.name}</div>
            <div className="text-xs text-muted-foreground">
              Keeper Skill: {goalkeeper.skills.keeper || "?"}
            </div>
          </div>
        </div>
      )}
      
      {/* Penalty field */}
      <PenaltyField 
        gameState={gameState}
        selectedSpot={selectedSpot}
        onSelectSpot={handleSpotSelect}
        isAnimating={isAnimating}
      />
      
      {/* Controls */}
      <div className="flex justify-center">
        <Button
          onClick={handleTakePenalty}
          disabled={selectedSpot === null || isAnimating}
          className="bg-swedish-blue hover:bg-swedish-blue/80 px-8"
        >
          {isAnimating ? "Taking Penalty..." : "Take Penalty"}
        </Button>
      </div>
      
      {selectedSpot !== null && (
        <div className="text-center text-sm">
          <div>Aiming for spot {selectedSpot + 1}</div>
          {getSuccessProbability() !== null && (
            <div className="text-muted-foreground">
              Estimated success chance: {Math.round(getSuccessProbability()!)}%
            </div>
          )}
        </div>
      )}
      
      {/* History */}
      {gameState.penaltyHistory.length > 0 && (
        <Card className="p-4 mt-8">
          <h3 className="text-lg font-semibold mb-2">Penalty History</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {gameState.penaltyHistory.map((kick, index) => {
              const shooterTeam = index % 2 === 0 ? gameState.homeTeam : gameState.awayTeam;
              const shooterPlayer = shooterTeam?.players.find(p => p.id === kick.playerId);
              
              return (
                <div 
                  key={index}
                  className={`py-1 px-2 rounded-sm ${
                    kick.success 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span className="font-semibold">{shooterPlayer?.name || "Unknown"}</span>
                  {" - "}
                  <span>
                    {kick.success ? "GOAL" : "MISS"} (Spot {kick.targetSpot + 1})
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
