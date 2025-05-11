import React from "react";
import { PENALTY_SPOTS } from "@/utils/game-logic";
import { GameState, SpotPosition } from "@/types";

interface PenaltyFieldProps {
  gameState: GameState;
  selectedSpot: SpotPosition | null;
  onSelectSpot: (spot: SpotPosition) => void;
  isAnimating: boolean;
}

export const PenaltyField: React.FC<PenaltyFieldProps> = ({
  gameState,
  selectedSpot,
  onSelectSpot,
  isAnimating,
}) => {
  // Extract the last penalty for animation
  const lastPenalty = gameState.penaltyHistory[gameState.penaltyHistory.length - 1];
  
  // Calculate keeper dive direction if applicable
  const getDiveDirection = () => {
    if (!lastPenalty || !isAnimating) return "";
    
    // The keeper will dive in the direction of the shot
    // We'll use the PENALTY_SPOTS x value for this
    const kickSpot = PENALTY_SPOTS.find(s => s.position === lastPenalty.targetSpot);
    
    if (!kickSpot) return "";
    
    return `${kickSpot.x * 0.7}px`;
  };
  
  return (
    <div className="relative w-full max-w-2xl mx-auto my-8">
      {/* Field background */}
      <div className="bg-field rounded-lg h-[300px] w-full shadow-inner overflow-hidden">
        {/* Goal area */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[240px] flex flex-col items-center">
          {/* Goal posts */}
          <div className="relative h-[80px] w-[240px] border-b-4 border-marking">
            {/* Left post */}
            <div className="absolute left-0 top-0 h-[80px] w-4 goal-post" />
            
            {/* Right post */}
            <div className="absolute right-0 top-0 h-[80px] w-4 goal-post" />
            
            {/* Crossbar */}
            <div className="absolute top-0 left-0 h-4 w-full goal-post" />
            
            {/* Net effect */}
            <div className="absolute top-4 left-4 right-4 bottom-0 opacity-20 pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={`v-${i}`} 
                  className="absolute h-full w-px bg-white" 
                  style={{ left: `${i * 14.28}%` }} 
                />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={`h-${i}`} 
                  className="absolute w-full h-px bg-white" 
                  style={{ top: `${i * 20}%` }} 
                />
              ))}
            </div>
            
            {/* Goalkeeper */}
            <div 
              className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-[60px] w-[40px] transition-all ${
                isAnimating ? "animate-goalkeeper-dive" : ""
              }`} 
              style={{ 
                "--dive-direction": getDiveDirection()
              } as React.CSSProperties}
            >
              <div className="h-[40px] w-[40px] bg-white rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">GK</span>
              </div>
              <div className="h-[20px] w-[30px] bg-white mx-auto rounded-t-lg" />
            </div>
          </div>
        </div>
        
        {/* Penalty spots */}
        {PENALTY_SPOTS.map((spot) => (
          <div 
            key={spot.position}
            className={`penalty-spot absolute transform ${
              selectedSpot === spot.position ? "ring-2 ring-offset-2 ring-white" : ""
            } ${isAnimating ? "pointer-events-none" : ""}`}
            style={{
              left: `calc(50% + ${spot.x}px)`,
              top: `calc(50% + ${spot.y}px)`,
            }}
            onClick={() => !isAnimating && onSelectSpot(spot.position)}
          >
            <span className="text-xs font-bold">{spot.position + 1}</span>
          </div>
        ))}
        
        {/* Ball */}
        <div 
          className={`ball absolute left-1/2 top-[70%] transform -translate-x-1/2 -translate-y-1/2 ${
            isAnimating && lastPenalty ? "animate-ball-kick" : ""
          }`}
          style={{
            "--kick-x": lastPenalty ? `${PENALTY_SPOTS[lastPenalty.targetSpot].x}px` : "0px",
            "--kick-y": lastPenalty ? `${PENALTY_SPOTS[lastPenalty.targetSpot].y - 50}px` : "0px"
          } as React.CSSProperties}
        />
      </div>
      
      {/* Spot selection indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {PENALTY_SPOTS.map((spot) => (
          <div 
            key={spot.position}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              selectedSpot === spot.position 
                ? "bg-swedish-blue text-white" 
                : "bg-gray-100 hover:bg-gray-200"
            } ${isAnimating ? "pointer-events-none" : ""}`}
            onClick={() => !isAnimating && onSelectSpot(spot.position)}
          >
            {spot.position + 1}
          </div>
        ))}
      </div>
    </div>
  );
};
