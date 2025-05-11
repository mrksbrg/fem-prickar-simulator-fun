import { HrfData, Player, Team } from "../types";

/**
 * Parses an HRF file from Hattrick
 * @param fileContent The content of the HRF file as a string
 * @returns Parsed HRF data or null if parsing failed
 */
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

    // Extract sections from the file
    const sections: Record<string, string[]> = {};
    let currentSection = "basics";
    let sectionContent: string[] = [];

    // First pass: separate the file into sections
    for (const line of lines) {
      const trimmedLine = line.trim().replace(/^\ufeff/, ""); // Remove BOM if present
      
      if (trimmedLine.startsWith("[") && trimmedLine.includes("]")) {
        // Start of a new section
        if (sectionContent.length > 0) {
          sections[currentSection] = sectionContent;
        }
        
        // Extract section name
        const sectionMatch = /\[(.*?)\]/.exec(trimmedLine);
        if (sectionMatch) {
          currentSection = sectionMatch[1].toLowerCase();
          sectionContent = [trimmedLine];
        }
      } else if (trimmedLine) {
        sectionContent.push(trimmedLine);
      }
    }
    
    // Add the last section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent;
    }
    
    // Process basics section for team info
    if (sections.basics) {
      for (const line of sections.basics) {
        if (line.includes("teamID=")) {
          data.team.id = line.split("=")[1]?.trim() || "";
        } else if (line.includes("teamName=")) {
          data.team.name = line.split("=")[1]?.trim() || "";
        } else if (line.startsWith("appversion=")) {
          data.version = line.split("=")[1]?.trim() || "";
        }
      }
    }
    
    // Process club section if team info is still missing
    if (sections.club && (!data.team.id || !data.team.name)) {
      for (const line of sections.club) {
        if (line.startsWith("[club]")) {
          const parts = line.split(";");
          if (parts.length >= 2) {
            data.team.id = parts[0].replace("[club]", "").trim();
            data.team.name = parts[1].trim();
          }
        }
      }
    }
    
    // Process player sections
    const playerSections = Object.keys(sections).filter(key => key.startsWith("player"));
    
    for (const section of playerSections) {
      const playerLines = sections[section];
      const playerId = section.replace("player", "");
      
      // Default player structure
      const player: Player = {
        id: playerId,
        name: "",
        skills: {
          shooting: 5,
          setPieces: 5,
          keeper: 5
        }
      };
      
      // Process player attributes
      for (const line of playerLines) {
        // Extract player name
        if (line.includes("name=")) {
          player.name = line.split("=")[1]?.trim() || "";
        }
        
        // Extract player skills according to Hattrick format
        // skal = shooting, fas = set pieces, mlv = keeper
        if (line.includes("mal=")) {
          const value = parseInt(line.split("=")[1]?.trim() || "5");
          if (!isNaN(value)) {
            player.skills.shooting = value;
          }
        }
        if (line.includes("fas=")) {
          const value = parseInt(line.split("=")[1]?.trim() || "5");
          if (!isNaN(value)) {
            player.skills.setPieces = value;
          }
        }
        if (line.includes("mlv=")) {
          const value = parseInt(line.split("=")[1]?.trim() || "5");
          if (!isNaN(value)) {
            player.skills.keeper = value;
          }
        }
      }
      
      // Validate player data
      if (player.name && player.id) {
        data.players.push(player);
        console.log(`Found player: ${player.name} with skills:`, player.skills);
      }
    }
    
    // Add players to team
    data.team.players = [...data.players];
    
    // Check if we have all required data
    if (!data.team.name || data.players.length === 0) {
      console.error("Failed to parse team data or players");
      return null;
    }
    
    console.log(`Successfully parsed HRF with ${data.players.length} players for team ${data.team.name}`);
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
