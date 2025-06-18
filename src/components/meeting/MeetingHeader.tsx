
import { Button } from "@/components/ui/button";
import { Copy, Users, Clock, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface MeetingHeaderProps {
  meetingId: string;
  participantCount: number;
  startTime: Date;
}

const MeetingHeader = ({ meetingId, participantCount, startTime }: MeetingHeaderProps) => {
  const { toast } = useToast();
  const [duration, setDuration] = useState("00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    toast({
      title: "Meeting ID copied",
      description: "Meeting ID has been copied to clipboard",
    });
  };

  return (
    <header className="bg-gray-800/90 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Video className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white hidden sm:block">SmartMeet</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300">
          <span className="hidden sm:inline">Meeting ID:</span>
          <span className="font-mono text-blue-300 font-semibold">{meetingId}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyMeetingId}
            className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
          <span className="font-semibold text-white">{participantCount}</span>
          <span className="hidden sm:inline">participants</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
          <span className="font-mono text-white font-semibold">{duration}</span>
        </div>
      </div>
    </header>
  );
};

export default MeetingHeader;
