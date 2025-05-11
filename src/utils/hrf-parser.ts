
import { HrfData, Player, Team } from "../types";

const parseHrfFile = (fileContent: string): HrfData | null => {
  try {
    // Basic structure to hold parsed data
    const data: HrfData = {
      version: "",
      team: { id: "", name: "", players: [] },
      players: []
    };

    // Split the file into lines
    const lines = fileContent.split("\n");

    // Process each line
    for (const line of lines) {
      if (line.startsWith("[HT]")) {
        // HRF version
        data.version = line.substring(4).trim();
      } else if (line.startsWith("[club]")) {
        // Team data
        const clubData = line.split(";");
        if (clubData.length >= 2) {
          data.team.id = clubData[0].replace("[club]", "").trim();
          data.team.name = clubData[1].trim();
        }
      } else if (line.startsWith("[player]")) {
        // Player data
        const playerData = line.split(";");
        if (playerData.length >= 10) {
          const player: Player = {
            id: playerData[0].replace("[player]", "").trim(),
            name: playerData[1].trim(),
            skills: {
              // In HRF files, positions 5+ typically contain skill values
              // This is a simplified interpretation - adjust based on actual HRF format
              shooting: parseInt(playerData[5]) || undefined,
              setPieces: parseInt(playerData[8]) || undefined,
              keeper: parseInt(playerData[9]) || undefined,
            }
          };
          data.players.push(player);
        }
      }
    }

    // Add players to team
    data.team.players = [...data.players];
    
    return data;
  } catch (error) {
    console.error("Error parsing HRF file:", error);
    return null;
  }
};

export const uploadAndParseHrf = async (file: File): Promise<HrfData | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        const fileContent = event.target.result as string;
        const parsedData = parseHrfFile(fileContent);
        resolve(parsedData);
      } else {
        resolve(null);
      }
    };
    
    reader.onerror = () => {
      console.error("Error reading file");
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
