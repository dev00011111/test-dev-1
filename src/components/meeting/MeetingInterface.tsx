
import { useState, useEffect } from "react";
import MeetingControls from "./MeetingControls";
import ParticipantGrid from "./ParticipantGrid";
import MeetingHeader from "./MeetingHeader";
import ChatPanel from "./ChatPanel";
import ParticipantsList from "./ParticipantsList";
import JoinMeetingForm from "./JoinMeetingForm";
import MeetingLoadingState from "./MeetingLoadingState";
import ShareMeetingLink from "./ShareMeetingLink";
import AttendanceTracker from "./AttendanceTracker";
import { useMeeting } from "@/hooks/useMeeting";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Share2, Users, X, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useWebRTC } from "@/hooks/useWebRTC";

interface MeetingInterfaceProps {
  meetingId: string;
}

const MeetingInterface = ({ meetingId }: MeetingInterfaceProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { meeting, participants, currentParticipant, loading, error, joinMeeting, leaveMeeting } = useMeeting(meetingId);
  const { 
    isVideoOn, 
    isAudioOn, 
    isScreenSharing,
    stream, 
    error: mediaError,
    toggleVideo, 
    toggleAudio, 
    startScreenShare,
    stopScreenShare,
    stopAllTracks,
    requestPermissions
  } = useMediaStream();
  
  const { remoteStreams } = useWebRTC(meetingId, currentParticipant?.id || null, stream);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [defaultName, setDefaultName] = useState("");
  const [meetingStartTime, setMeetingStartTime] = useState(new Date());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (user && !defaultName) {
      const displayName = user.user_metadata?.name || 
                         user.user_metadata?.full_name || 
                         user.email?.split('@')[0] || "";
      setDefaultName(displayName);
    }

    if (meeting?.started_at) {
      setMeetingStartTime(new Date(meeting.started_at));
    }
  }, [user, navigate, defaultName, meeting]);

  const handleLeaveMeeting = async () => {
    stopAllTracks();
    await leaveMeeting();
    navigate("/");
  };

  const handleJoinMeeting = async (name: string, rollNumber?: string) => {
    console.log('Attempting to join meeting with:', { name, rollNumber, meetingId });
    return await joinMeeting(name, rollNumber);
  };

  const handleParticipantsOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowParticipants(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return <MeetingLoadingState />;
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Alert className="max-w-md mx-auto border-red-200 bg-white shadow-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium mb-4">
            {error}
          </AlertDescription>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={handleRetry} size="sm" variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => navigate("/")} size="sm" className="flex-1">
              Back to Home
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!currentParticipant) {
    return (
      <JoinMeetingForm 
        meetingId={meetingId}
        onJoin={handleJoinMeeting}
        defaultName={defaultName}
        stream={stream}
        isVideoOn={isVideoOn}
        isAudioOn={isAudioOn}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        mediaError={mediaError}
        onRequestPermissions={requestPermissions}
      />
    );
  }

  const getMeetingDuration = () => {
    if (!meeting?.started_at) return 0;
    return Math.floor((new Date().getTime() - new Date(meeting.started_at).getTime()) / 1000 / 60);
  };

  const isHost = currentParticipant?.is_host || meeting?.host_id === user?.id;

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Mobile-optimized header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700">
        <MeetingHeader 
          meetingId={meetingId}
          participantCount={participants.length}
          startTime={meeting?.started_at ? new Date(meeting.started_at) : new Date()}
        />
      </div>

      {/* Main content area - mobile responsive */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Video area */}
        <div className="flex-1 relative bg-gray-900 overflow-hidden">
          <ParticipantGrid 
            participants={participants.map(p => ({
              id: p.id,
              name: p.name,
              isVideoOn: p.id === currentParticipant?.id ? isVideoOn : true,
              isAudioOn: p.id === currentParticipant?.id ? isAudioOn : true,
              joinTime: new Date(p.joined_at),
              isPresent: true,
              rollNumber: p.roll_number,
            }))}
            currentUserStream={stream}
            currentUserId={currentParticipant?.id}
            remoteStreams={remoteStreams}
          />

          {/* Smart Attendance Tracker - Only visible to host */}
          {isHost && (
            <AttendanceTracker
              participants={participants.map(p => ({
                id: p.id,
                name: p.name,
                isVideoOn: p.id === currentParticipant?.id ? isVideoOn : true,
                isAudioOn: p.id === currentParticipant?.id ? isAudioOn : true,
                joinTime: new Date(p.joined_at),
                isPresent: true,
              }))}
              meetingStartTime={meetingStartTime}
              minimumAttendanceMinutes={meeting?.minimum_attendance_minutes || 30}
            />
          )}

          {/* Mobile floating action buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-40 lg:hidden">
            <Button 
              size="sm" 
              className="bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 transition-all duration-200 shadow-lg w-10 h-10 p-0 rounded-full"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button 
              size="sm" 
              className="bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 transition-all duration-200 shadow-lg h-10 px-3 rounded-full"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">{participants.length}</span>
            </Button>
          </div>
        </div>
        
        {/* Desktop participants list */}
        <div className="hidden lg:block w-80 bg-gray-800 border-l border-gray-700">
          <ParticipantsList 
            participants={participants.map(p => ({
              id: p.id,
              name: p.name,
              isVideoOn: p.id === currentParticipant?.id ? isVideoOn : true,
              isAudioOn: p.id === currentParticipant?.id ? isAudioOn : true,
              joinTime: new Date(p.joined_at),
              isPresent: true,
              rollNumber: p.roll_number,
            }))}
            meetingStartTime={meetingStartTime}
            meetingDuration={getMeetingDuration()}
            isHost={isHost}
            minimumAttendanceMinutes={meeting?.minimum_attendance_minutes || 30}
          />
        </div>

        {/* Desktop share button */}
        <Button 
          className="hidden lg:flex absolute top-4 right-96 z-40 bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 transition-all duration-200 shadow-lg"
          size="sm"
          onClick={() => setShowShareDialog(true)}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        {/* Mobile participants overlay - improved mobile design */}
        {showParticipants && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleParticipantsOverlayClick}
          >
            <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-2xl relative">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Participants ({participants.length})</h3>
                <Button 
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 p-0"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowParticipants(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-y-auto">
                <ParticipantsList 
                  participants={participants.map(p => ({
                    id: p.id,
                    name: p.name,
                    isVideoOn: p.id === currentParticipant?.id ? isVideoOn : true,
                    isAudioOn: p.id === currentParticipant?.id ? isAudioOn : true,
                    joinTime: new Date(p.joined_at),
                    isPresent: true,
                    rollNumber: p.roll_number,
                  }))}
                  meetingStartTime={meetingStartTime}
                  meetingDuration={getMeetingDuration()}
                  isHost={isHost}
                  minimumAttendanceMinutes={meeting?.minimum_attendance_minutes || 30}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Panel - responsive */}
        {isChatOpen && (
          <div className="absolute lg:relative inset-0 lg:inset-auto lg:w-80 bg-white border-l border-gray-200 z-30 lg:z-auto shadow-2xl lg:shadow-none">
            <ChatPanel 
              meetingDbId={meeting?.id || null}
              participantId={currentParticipant?.id || null}
            />
          </div>
        )}
      </div>

      {/* Meeting controls - mobile optimized */}
      <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-2 sm:px-4 py-2 sm:py-3 shadow-2xl">
        <MeetingControls
          isVideoOn={isVideoOn}
          isAudioOn={isAudioOn}
          isChatOpen={isChatOpen}
          isScreenSharing={isScreenSharing}
          isHost={isHost}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
          onEndCall={handleLeaveMeeting}
        />
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-white rounded-xl mx-4">
          <ShareMeetingLink meetingId={meetingId} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingInterface;
