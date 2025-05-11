import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { GameState, Team } from "@/types";
import { initializeGameState } from "@/utils/game-logic";
import { FileUpload } from "@/components/FileUpload";
import { PlayerSelection } from "@/components/PlayerSelection";
import { PenaltySimulator } from "@/components/PenaltySimulator";
import { Toaster } from "@/components/ui/toaster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  
  const handleTeamLoaded = (team: Team, side: "home" | "away") => {
    setGameState(prev => ({
      ...prev,
      [side === "home" ? "homeTeam" : "awayTeam"]: team,
    }));
  };
  
  const handlePlayerSelect = (teamSide: "home" | "away", playerId: string, isGoalkeeper: boolean) => {
    setGameState(prev => {
      if (isGoalkeeper) {
        // Toggle goalkeeper selection
        const currentGoalkeeper = prev.selectedGoalkeepers[teamSide];
        return {
          ...prev,
          selectedGoalkeepers: {
            ...prev.selectedGoalkeepers,
            [teamSide]: currentGoalkeeper === playerId ? null : playerId,
          },
        };
      } else {
        // Toggle player in penalty takers list
        const currentPlayers = [...prev.selectedPlayers[teamSide]];
        const playerIndex = currentPlayers.indexOf(playerId);
        
        if (playerIndex >= 0) {
          currentPlayers.splice(playerIndex, 1);
        } else if (currentPlayers.length < 5) {
          currentPlayers.push(playerId);
        }
        
        return {
          ...prev,
          selectedPlayers: {
            ...prev.selectedPlayers,
            [teamSide]: currentPlayers,
          },
        };
      }
    });
  };
  
  const handleStartShootout = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: "in-progress",
    }));
  };
  
  const handleRestart = () => {
    // Keep the teams but reset the game state
    const newGameState = initializeGameState();
    newGameState.homeTeam = gameState.homeTeam;
    newGameState.awayTeam = gameState.awayTeam;
    
    setGameState(newGameState);
  };
  
  const renderCurrentStage = () => {
    switch (gameState.gameStatus) {
      case "setup":
        return (
          <FileUpload 
            onTeamLoaded={handleTeamLoaded} 
            disabled={!!(gameState.homeTeam && gameState.awayTeam)}
          />
        );
      
      case "player-selection":
        return (
          <PlayerSelection
            gameState={gameState}
            onSelectPlayer={handlePlayerSelect}
            onConfirmSelection={handleStartShootout}
          />
        );
      
      case "in-progress":
      case "completed":
        return (
          <PenaltySimulator
            gameState={gameState}
            onUpdateGameState={setGameState}
            onRestart={handleRestart}
          />
        );
    }
  };
  
  // Move to player selection when both teams are loaded
  React.useEffect(() => {
    if (gameState.gameStatus === "setup" && gameState.homeTeam && gameState.awayTeam) {
      setGameState(prev => ({
        ...prev,
        gameStatus: "player-selection",
      }));
    }
  }, [gameState.homeTeam, gameState.awayTeam, gameState.gameStatus]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-8">
      <div className="container max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-swedish-blue">Fem Prickar</h1>
          <p className="text-gray-600">Swedish Penalty Shootout Simulator</p>
        </header>
        
        <Card className="p-6 shadow-lg bg-white/80 backdrop-blur-sm">
          {gameState.gameStatus === "setup" && (
            <div className="mb-6 text-center">
              <p className="text-lg">
                Welcome to "Fem Prickar" - the traditional Swedish penalty shootout game!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload your Hattrick HRF files or use our sample teams to start
              </p>
            </div>
          )}
          
          {renderCurrentStage()}
          
          {(gameState.gameStatus === "player-selection" || gameState.gameStatus === "in-progress") && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={handleRestart}
              >
                Start Over
              </Button>
            </div>
          )}
        </Card>
        
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            "Fem Prickar" is a traditional Swedish penalty shootout format where 
            players must aim for specific spots in the goal.
          </p>
          <p className="mt-1">
            HRF files are player data exports from the online football management game Hattrick.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
