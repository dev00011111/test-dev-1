
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Video, Sparkles } from "lucide-react";
import MediaControls from "./MediaControls";

interface JoinMeetingFormProps {
  meetingId: string;
  onJoin: (name: string, rollNumber?: string) => Promise<boolean>;
  defaultName: string;
  stream?: MediaStream | null;
  isVideoOn: boolean;
  isAudioOn: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  mediaError?: string | null;
  onRequestPermissions?: () => Promise<boolean>;
}

const JoinMeetingForm = ({ 
  meetingId, 
  onJoin, 
  defaultName, 
  stream, 
  isVideoOn, 
  isAudioOn, 
  onToggleVideo, 
  onToggleAudio,
  mediaError,
  onRequestPermissions
}: JoinMeetingFormProps) => {
  const [name, setName] = useState(defaultName);
  const [rollNumber, setRollNumber] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinMeeting = async () => {
    if (!name.trim()) return;
    
    setIsJoining(true);
    try {
      const success = await onJoin(name.trim(), rollNumber.trim() || undefined);
      if (!success) {
        setIsJoining(false);
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && !isJoining) {
      handleJoinMeeting();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
        {/* Form Section */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm order-2 lg:order-1 w-full">
          <CardHeader className="text-center space-y-4 pb-6 px-4 sm:px-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join Meeting
            </CardTitle>
            <div className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Meeting ID: {meetingId}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-gray-700">
                Your Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your full name"
                disabled={isJoining}
                className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="rollNumber" className="text-sm sm:text-base font-semibold text-gray-700">
                Roll Number (Optional)
              </Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your roll number"
                disabled={isJoining}
                className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <Button 
              onClick={handleJoinMeeting} 
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={!name.trim() || isJoining}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Joining Meeting...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Join Meeting
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Video Preview Section */}
        <div className="order-1 lg:order-2 space-y-4 w-full">
          <div className="text-center lg:text-left space-y-2">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center justify-center lg:justify-start gap-2">
              <Video className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Camera & Microphone Setup
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Test your camera and microphone before joining the meeting
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-xl border border-white/20">
            <MediaControls
              isVideoOn={isVideoOn}
              isAudioOn={isAudioOn}
              onToggleVideo={onToggleVideo}
              onToggleAudio={onToggleAudio}
              stream={stream}
              error={mediaError}
              onRequestPermissions={onRequestPermissions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinMeetingForm;
