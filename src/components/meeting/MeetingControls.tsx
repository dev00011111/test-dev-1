
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  MessageSquare, 
  Monitor, 
  MonitorSpeaker,
  Settings,
  Users
} from "lucide-react";

interface MeetingControlsProps {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isChatOpen: boolean;
  isScreenSharing?: boolean;
  isHost?: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleChat: () => void;
  onStartScreenShare?: () => void;
  onStopScreenShare?: () => void;
  onEndCall: () => void;
}

const MeetingControls = ({ 
  isVideoOn, 
  isAudioOn, 
  isChatOpen,
  isScreenSharing = false,
  isHost = false,
  onToggleVideo, 
  onToggleAudio, 
  onToggleChat,
  onStartScreenShare,
  onStopScreenShare,
  onEndCall
}: MeetingControlsProps) => {
  const handleScreenShare = () => {
    if (isScreenSharing) {
      onStopScreenShare?.();
    } else {
      onStartScreenShare?.();
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div className="flex items-center gap-2 sm:gap-3 bg-gray-700/50 backdrop-blur-md rounded-2xl px-3 sm:px-4 py-2 border border-gray-600/50">
        {/* Primary Controls - Always visible */}
        <Button
          variant={isAudioOn ? "default" : "destructive"}
          size="lg"
          onClick={onToggleAudio}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200 ${
            isAudioOn 
              ? "bg-gray-600 hover:bg-gray-500 text-white shadow-lg" 
              : "bg-red-500 hover:bg-red-600 text-white shadow-lg"
          }`}
        >
          {isAudioOn ? <Mic className="h-5 w-5 sm:h-6 sm:w-6" /> : <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
        </Button>

        <Button
          variant={isVideoOn ? "default" : "destructive"}
          size="lg"
          onClick={onToggleVideo}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200 ${
            isVideoOn 
              ? "bg-gray-600 hover:bg-gray-500 text-white shadow-lg" 
              : "bg-red-500 hover:bg-red-600 text-white shadow-lg"
          }`}
        >
          {isVideoOn ? <Video className="h-5 w-5 sm:h-6 sm:w-6" /> : <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />}
        </Button>

        {/* Screen sharing - NOW AVAILABLE FOR ALL PARTICIPANTS */}
        <Button 
          variant={isScreenSharing ? "default" : "outline"}
          size="lg"
          onClick={handleScreenShare}
          title={isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200 ${
            isScreenSharing 
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg" 
              : "bg-gray-600 hover:bg-gray-500 text-white border-gray-500 shadow-lg"
          }`}
        >
          {isScreenSharing ? <MonitorSpeaker className="h-5 w-5 sm:h-6 sm:w-6" /> : <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />}
        </Button>

        {/* Chat toggle */}
        <Button 
          variant={isChatOpen ? "default" : "outline"}
          size="lg"
          onClick={onToggleChat}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200 ${
            isChatOpen 
              ? "bg-green-500 hover:bg-green-600 text-white shadow-lg" 
              : "bg-gray-600 hover:bg-gray-500 text-white border-gray-500 shadow-lg"
          }`}
        >
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={onEndCall}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all duration-200"
        >
          <Phone className="h-5 w-5 sm:h-6 sm:w-6 transform rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
};

export default MeetingControls;
