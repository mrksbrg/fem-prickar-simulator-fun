
import React, { useState } from "react";
import { uploadAndParseHrf, getSampleTeam } from "@/utils/hrf-parser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Team } from "@/types";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadProps {
  onTeamLoaded: (team: Team, side: "home" | "away") => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onTeamLoaded, disabled }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    side: "home" | "away"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const parsedData = await uploadAndParseHrf(file);
      
      if (parsedData && parsedData.team) {
        onTeamLoaded(parsedData.team, side);
        toast({
          title: "Team loaded successfully",
          description: `${parsedData.team.name} loaded as ${side} team`,
        });
      } else {
        toast({
          title: "Error parsing file",
          description: "The HRF file format was not recognized",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload error",
        description: "There was an error uploading the file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Reset the file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const loadSampleTeam = (side: "home" | "away") => {
    const sampleTeam = getSampleTeam();
    // Create a copy with a different ID for the second team
    const team = side === "away" 
      ? { ...sampleTeam, id: "sample-team-away", name: "Sample United" }
      : sampleTeam;
      
    onTeamLoaded(team, side);
    toast({
      title: "Sample team loaded",
      description: `${team.name} loaded as ${side} team`,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Load Teams</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team */}
        <Card className="p-4 bg-swedish-blue/10">
          <h3 className="text-lg font-medium mb-3 text-swedish-blue">Home Team</h3>
          <div className="space-y-4">
            <div className="relative">
              <Button 
                className="w-full bg-swedish-blue hover:bg-swedish-blue/80" 
                disabled={loading || disabled}
              >
                <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                  Upload Home Team HRF
                  <input
                    type="file"
                    accept=".hrf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "home")}
                    disabled={loading || disabled}
                  />
                </label>
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full border-swedish-blue text-swedish-blue"
              onClick={() => loadSampleTeam("home")}
              disabled={loading || disabled}
            >
              Load Sample Team
            </Button>
          </div>
        </Card>
        
        {/* Away Team */}
        <Card className="p-4 bg-swedish-yellow/10">
          <h3 className="text-lg font-medium mb-3 text-swedish-yellow">Away Team</h3>
          <div className="space-y-4">
            <div className="relative">
              <Button 
                className="w-full bg-swedish-yellow hover:bg-swedish-yellow/80 text-black" 
                disabled={loading || disabled}
              >
                <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                  Upload Away Team HRF
                  <input
                    type="file"
                    accept=".hrf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "away")}
                    disabled={loading || disabled}
                  />
                </label>
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full border-swedish-yellow text-swedish-yellow"
              onClick={() => loadSampleTeam("away")}
              disabled={loading || disabled}
            >
              Load Sample Team
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
