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

    // Split the file into lines
    const lines = fileContent.split("\n");
    console.log(`File contains ${lines.length} lines`);

    // Process each line
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      if (line.includes("[HT]")) {
        // HRF version - more flexible matching
        data.version = line.substring(line.indexOf("[HT]") + 4).trim();
        console.log(`Found HRF version: ${data.version}`);
      } else if (line.includes("[club]")) {
        // Team data - more flexible matching
        const clubPart = line.substring(line.indexOf("[club]"));
        const clubData = clubPart.split(";");
        if (clubData.length >= 2) {
          data.team.id = clubData[0].replace("[club]", "").trim();
          data.team.name = clubData[1].trim();
          console.log(`Found team: ${data.team.name} (ID: ${data.team.id})`);
        }
      } else if (line.includes("[player]")) {
        // Player data - more flexible matching
        const playerPart = line.substring(line.indexOf("[player]"));
        const playerData = playerPart.split(";");
        if (playerData.length >= 10) {
          const player: Player = {
            id: playerData[0].replace("[player]", "").trim(),
            name: playerData[1].trim(),
            skills: {}
          };

          // Extract skills - add fallbacks and more careful parsing
          try {
            // Only add skills if they're valid numbers
            const shootingValue = parseInt(playerData[5]);
            if (!isNaN(shootingValue)) player.skills.shooting = shootingValue;
            
            const setPiecesValue = parseInt(playerData[8]);
            if (!isNaN(setPiecesValue)) player.skills.setPieces = setPiecesValue;
            
            const keeperValue = parseInt(playerData[9]);
            if (!isNaN(keeperValue)) player.skills.keeper = keeperValue;
          } catch (e) {
            console.warn("Error parsing player skills, using defaults");
            player.skills = { shooting: 5, setPieces: 5, keeper: 5 };
          }

          data.players.push(player);
          console.log(`Found player: ${player.name}`);
        }
      }
    }

    // Add players to team
    data.team.players = [...data.players];
    
    // Verify we have basic required data
    if (!data.team.name || data.players.length === 0) {
      console.error("Parsed HRF file is missing critical data (team name or players)");
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
