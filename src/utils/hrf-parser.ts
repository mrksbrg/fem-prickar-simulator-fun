
import { HrfData, Player, Team } from "../types";

const parseHrfFile = (fileContent: string): HrfData | null => {
  try {
    console.log("Starting HRF parsing process");
    
    // Basic structure to hold parsed data
    const data: HrfData = {
      version: "",
      team: { id: "", name: "", players: [] },
      players: []
    };
    
    // Map of player skills by ID for later association
    const playerSkills: Record<string, Record<string, number>> = {};

    // Split the file into lines
    const lines = fileContent.split("\n");
    console.log(`File contains ${lines.length} lines`);

    // Log the beginning of the file for debugging
    console.log("First few lines of file:", lines.slice(0, 10).join("\n"));

    // Process each line
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Strip BOM and other potential control characters
      const cleanLine = line.replace(/^\ufeff/, "").trim();
      
      if (cleanLine.includes("[HT]")) {
        // HRF version - more flexible matching
        data.version = cleanLine.substring(cleanLine.indexOf("[HT]") + 4).trim();
        console.log(`Found HRF version: ${data.version}`);
      } 
      else if (cleanLine.includes("[club]")) {
        // Team data - more flexible matching
        const clubPart = cleanLine.substring(cleanLine.indexOf("[club]"));
        const clubData = clubPart.split(";");
        if (clubData.length >= 2) {
          data.team.id = clubData[0].replace("[club]", "").trim();
          data.team.name = clubData[1].trim();
          console.log(`Found team: ${data.team.name} (ID: ${data.team.id})`);
        }
      } 
      else if (cleanLine.includes("[player]")) {
        // Player data - more flexible matching
        const playerPart = cleanLine.substring(cleanLine.indexOf("[player]"));
        const playerData = playerPart.split(";");
        
        // Log the raw player data for debugging
        console.log(`Raw player data: ${playerData.join("|")}`);
        
        if (playerData.length >= 10) {
          const playerId = playerData[0].replace("[player]", "").trim();
          const playerName = playerData[1].trim();
          
          const player: Player = {
            id: playerId,
            name: playerName,
            skills: {}
          };

          // Try to find skills in standard positions
          // In real HRF format, player skills are typically in specific columns
          // This is a more flexible approach that tries multiple positions
          try {
            // Basic mapping of expected skill positions (these may vary by HRF format version)
            // Careful parsing to extract only valid numbers
            const potentialPositions = {
              shooting: [5, 14, 16, 17], // Try multiple positions
              setPieces: [8, 19, 20],
              keeper: [9, 12, 13]
            };
            
            // Try each potential position for each skill
            for (const [skill, positions] of Object.entries(potentialPositions)) {
              for (const pos of positions) {
                if (playerData[pos]) {
                  const value = parseInt(playerData[pos].trim());
                  if (!isNaN(value) && value > 0) {
                    player.skills[skill as keyof typeof player.skills] = value;
                    break; // Found a valid value, stop looking
                  }
                }
              }
            }
            
            // If still no skills found, try scanning the entire line for skill indicators
            if (Object.keys(player.skills).length === 0) {
              playerData.forEach((field, index) => {
                // Look for fields that might contain skill descriptions
                if (field.toLowerCase().includes("scoring") || field.toLowerCase().includes("shooting")) {
                  const nextField = playerData[index + 1];
                  if (nextField) {
                    const value = parseInt(nextField.trim());
                    if (!isNaN(value)) player.skills.shooting = value;
                  }
                }
                if (field.toLowerCase().includes("set pieces")) {
                  const nextField = playerData[index + 1];
                  if (nextField) {
                    const value = parseInt(nextField.trim());
                    if (!isNaN(value)) player.skills.setPieces = value;
                  }
                }
                if (field.toLowerCase().includes("keeper")) {
                  const nextField = playerData[index + 1];
                  if (nextField) {
                    const value = parseInt(nextField.trim());
                    if (!isNaN(value)) player.skills.keeper = value;
                  }
                }
              });
            }
            
            // If we still have no skills after all attempts, use fallback values
            if (Object.keys(player.skills).length === 0) {
              console.warn(`No skills found for player ${playerName}, using defaults`);
              player.skills = { shooting: 5, setPieces: 5, keeper: 5 };
            }
          } catch (e) {
            console.warn(`Error parsing player skills for ${playerName}, using defaults:`, e);
            player.skills = { shooting: 5, setPieces: 5, keeper: 5 };
          }

          // Store the player
          data.players.push(player);
          console.log(`Found player: ${player.name} with skills:`, player.skills);
        }
      }
      // Try to detect separate skill sections that appear in some HRF formats
      else if (cleanLine.includes("[skill]")) {
        try {
          const skillPart = cleanLine.substring(cleanLine.indexOf("[skill]"));
          const skillData = skillPart.split(";");
          if (skillData.length >= 3) {
            const playerId = skillData[0].replace("[skill]", "").trim();
            const skillType = skillData[1].toLowerCase().trim();
            const skillValue = parseInt(skillData[2].trim());
            
            if (!isNaN(skillValue)) {
              if (!playerSkills[playerId]) {
                playerSkills[playerId] = {};
              }
              
              // Map skill names to our format
              if (skillType.includes("scoring") || skillType.includes("shooting")) {
                playerSkills[playerId].shooting = skillValue;
              } else if (skillType.includes("set pieces")) {
                playerSkills[playerId].setPieces = skillValue;
              } else if (skillType.includes("keeper")) {
                playerSkills[playerId].keeper = skillValue;
              }
              
              console.log(`Found separate skill for player ${playerId}: ${skillType} = ${skillValue}`);
            }
          }
        } catch (e) {
          console.warn("Error parsing separate skill section:", e);
        }
      }
    }
    
    // Merge any separately found skills with player records
    for (const player of data.players) {
      if (playerSkills[player.id]) {
        player.skills = { ...player.skills, ...playerSkills[player.id] };
        console.log(`Updated player ${player.name} with additional skills:`, playerSkills[player.id]);
      }
    }

    // Add players to team
    data.team.players = [...data.players];
    
    // Verify we have basic required data
    if (!data.team.name || data.players.length === 0) {
      console.error("Parsed HRF file is missing critical data (team name or players)");
      
      // Try fallback method for older HRF format
      if (data.players.length === 0) {
        console.log("Attempting fallback parsing for older HRF format...");
        // Some older HRF formats use different tags
        for (const line of lines) {
          if (line.includes("teamId=")) {
            data.team.id = line.split("=")[1]?.trim() || "";
          } else if (line.includes("teamName=")) {
            data.team.name = line.split("=")[1]?.trim() || "";
          } else if (line.includes("playerName=") && line.includes("id=")) {
            try {
              // Extract player info from line
              const idMatch = /id=(\d+)/.exec(line);
              const nameMatch = /playerName=([^;]+)/.exec(line);
              
              if (idMatch && nameMatch) {
                const player: Player = {
                  id: idMatch[1],
                  name: nameMatch[1].trim(),
                  skills: { shooting: 5, setPieces: 5, keeper: 5 } // Default skills
                };
                data.players.push(player);
                data.team.players.push(player);
              }
            } catch (e) {
              console.warn("Error in fallback parsing:", e);
            }
          }
        }
        
        if (data.players.length > 0) {
          console.log(`Fallback parsing found ${data.players.length} players`);
          return data;
        }
      }
      
      return null;
    }
    
    console.log(`Successfully parsed HRF with ${data.players.length} players`);
    return data;
  } catch (error) {
    console.error("Error parsing HRF file:", error);
    return null;
  }
};

export const uploadAndParseHrf = async (file: File): Promise<HrfData | null> => {
  console.log(`Attempting to parse file: ${file.name} (${file.size} bytes)`);
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        console.log("File loaded successfully, starting parsing");
        const fileContent = event.target.result as string;
        const parsedData = parseHrfFile(fileContent);
        resolve(parsedData);
      } else {
        console.error("FileReader did not produce any result");
        resolve(null);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      resolve(null);
    };
    
    reader.readAsText(file);
  });
};

// Provide sample data for testing when no HRF file is available
export const getSampleTeam = (): Team => {
  return {
    id: "sample-team",
    name: "Sample FC",
    players: [
      {
        id: "player-1",
        name: "Johan Andersson",
        skills: { shooting: 8, setPieces: 10, keeper: 3 }
      },
      {
        id: "player-2",
        name: "Erik Svensson",
        skills: { shooting: 9, setPieces: 7, keeper: 2 }
      },
      {
        id: "player-3",
        name: "Karl Johansson",
        skills: { shooting: 7, setPieces: 8, keeper: 5 }
      },
      {
        id: "player-4",
        name: "Lars Eriksson",
        skills: { shooting: 10, setPieces: 9, keeper: 4 }
      },
      {
        id: "player-5",
        name: "Nils Lindberg",
        skills: { shooting: 6, setPieces: 6, keeper: 12 }
      },
      {
        id: "player-6",
        name: "Olof Nilsson",
        skills: { shooting: 7, setPieces: 7, keeper: 11 }
      }
    ]
  };
};
