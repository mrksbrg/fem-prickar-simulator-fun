import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameState, Player, Team } from "@/types";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface PlayerSelectionProps {
  gameState: GameState;
  onSelectPlayer: (teamSide: "home" | "away", playerId: string, isGoalkeeper: boolean) => void;
  onConfirmSelection: () => void;
}

export const PlayerSelection: React.FC<PlayerSelectionProps> = ({
  gameState,
  onSelectPlayer,
  onConfirmSelection,
}) => {
  const homeTeam = gameState.homeTeam;
  const awayTeam = gameState.awayTeam;
  
  if (!homeTeam || !awayTeam) {
    return <div>Please load both teams first</div>;
  }
  
  const canConfirm = 
    gameState.selectedPlayers.home.length >= 5 && 
    gameState.selectedPlayers.away.length >= 5 &&
    gameState.selectedGoalkeepers.home && 
    gameState.selectedGoalkeepers.away;
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-center">Select Players</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Team */}
        <TeamPlayerSelection
          team={homeTeam}
          teamSide="home"
          selectedPlayers={gameState.selectedPlayers.home}
          selectedGoalkeeper={gameState.selectedGoalkeepers.home}
          onSelectPlayer={onSelectPlayer}
          color="blue"
        />
        
        {/* Away Team */}
        <TeamPlayerSelection
          team={awayTeam}
          teamSide="away"
          selectedPlayers={gameState.selectedPlayers.away}
          selectedGoalkeeper={gameState.selectedGoalkeepers.away}
          onSelectPlayer={onSelectPlayer}
          color="yellow"
        />
      </div>
      
      <div className="text-center">
        <Button
          onClick={onConfirmSelection}
          disabled={!canConfirm}
          className="bg-field hover:bg-field/90 px-8"
        >
          Start Shootout
        </Button>
        
        {!canConfirm && (
          <p className="text-sm text-muted-foreground mt-2">
            You need to select at least 5 kickers and 1 goalkeeper for each team
          </p>
        )}
      </div>
    </div>
  );
};

interface TeamPlayerSelectionProps {
  team: Team;
  teamSide: "home" | "away";
  selectedPlayers: string[];
  selectedGoalkeeper: string | null;
  onSelectPlayer: (teamSide: "home" | "away", playerId: string, isGoalkeeper: boolean) => void;
  color: "blue" | "yellow";
}

const TeamPlayerSelection: React.FC<TeamPlayerSelectionProps> = ({
  team,
  teamSide,
  selectedPlayers,
  selectedGoalkeeper,
  onSelectPlayer,
  color,
}) => {
  const colorClass = color === "blue" ? "swedish-blue" : "swedish-yellow";
  
  const renderPlayerItem = (player: Player, isGoalkeeper = false) => {
    const isSelected = isGoalkeeper 
      ? selectedGoalkeeper === player.id 
      : selectedPlayers.includes(player.id);
    
    const relevantSkills = isGoalkeeper 
      ? { "Keeper": player.skills.keeper || 0 }
      : { 
          "Shooting": player.skills.shooting || 0, 
          "Set Pieces": player.skills.setPieces || 0 
        };
    
    return (
      <div
        key={`${player.id}-${isGoalkeeper ? "gk" : "kicker"}`}
        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
          isSelected 
            ? `bg-${colorClass}/20 border border-${colorClass}` 
            : `hover:bg-${colorClass}/10`
        }`}
        onClick={() => onSelectPlayer(teamSide, player.id, isGoalkeeper)}
      >
        <div className="flex items-center space-x-2">
          <Avatar className={`bg-${colorClass}/30 text-${colorClass} h-8 w-8`}>
            {player.name.charAt(0)}
          </Avatar>
          <span>{player.name}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {Object.entries(relevantSkills).map(([skill, value]) => (
            <div key={skill} className="text-sm flex items-center">
              <span className="mr-1">{skill}:</span>
              <span className={`font-semibold text-${colorClass}`}>{value}</span>
            </div>
          ))}
          
          {isSelected ? (
            <Check className={`text-${colorClass} h-5 w-5`} />
          ) : (
            <X className="text-gray-300 h-5 w-5" />
          )}
        </div>
      </div>
    );
  };

  return (
    <Card 
      className={`p-4 overflow-y-auto max-h-[500px] bg-${colorClass}/5 border-${colorClass}/30`}
    >
      <h3 className={`text-lg font-medium mb-3 text-${colorClass}`}>
        {team.name}
      </h3>
      
      {/* Goalkeepers */}
      <div className="mb-4">
        <h4 className={`text-sm font-semibold mb-2 text-${colorClass}/80 uppercase tracking-wider`}>
          Select Goalkeeper
        </h4>
        <div className="space-y-1">
          {team.players
            .filter(player => (player.skills.keeper || 0) > 3)
            .sort((a, b) => (b.skills.keeper || 0) - (a.skills.keeper || 0))
            .map(player => renderPlayerItem(player, true))
          }
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Kickers */}
      <div>
        <h4 className={`text-sm font-semibold mb-2 text-${colorClass}/80 uppercase tracking-wider flex justify-between`}>
          <span>Select Penalty Takers</span>
          <span>{selectedPlayers.length} / 5 selected</span>
        </h4>
        <div className="space-y-1">
          {team.players
            .sort((a, b) => {
              // Sort by combined shooting & set pieces skill
              const skillA = ((a.skills.shooting || 0) + (a.skills.setPieces || 0)) / 2;
              const skillB = ((b.skills.shooting || 0) + (b.skills.setPieces || 0)) / 2;
              return skillB - skillA;
            })
            .map(player => renderPlayerItem(player))
          }
        </div>
      </div>
    </Card>
  );
};
