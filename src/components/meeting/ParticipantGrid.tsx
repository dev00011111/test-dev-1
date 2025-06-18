
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, User } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  joinTime: Date;
  isPresent: boolean;
  rollNumber?: string;
}

interface ParticipantGridProps {
  participants: Participant[];
  currentUserStream?: MediaStream | null;
  currentUserId?: string;
  remoteStreams?: { [participantId: string]: MediaStream };
}

const ParticipantGrid = ({ participants, currentUserStream, currentUserId, remoteStreams = {} }: ParticipantGridProps) => {
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const currentUserVideoRef = useRef<HTMLVideoElement>(null);

  // Set up current user video stream
  useEffect(() => {
    console.log('ParticipantGrid: Setting up current user video:', !!currentUserStream);
    if (currentUserVideoRef.current) {
      if (currentUserStream) {
        currentUserVideoRef.current.srcObject = currentUserStream;
        currentUserVideoRef.current.muted = true; // Always mute self-view
        currentUserVideoRef.current.playsInline = true;
        currentUserVideoRef.current.play().catch(error => {
          console.error('Error playing current user video:', error);
        });
      } else {
        currentUserVideoRef.current.srcObject = null;
      }
    }
  }, [currentUserStream]);

  // Set up remote video streams
  useEffect(() => {
    console.log('ParticipantGrid: Setting up remote streams:', Object.keys(remoteStreams));
    Object.entries(remoteStreams).forEach(([participantId, stream]) => {
      const videoElement = videoRefs.current[participantId];
      if (videoElement && stream) {
        console.log('Setting remote stream for participant:', participantId, 'tracks:', stream.getTracks().length);
        videoElement.srcObject = stream;
        videoElement.muted = false; // Don't mute remote streams
        videoElement.playsInline = true;
        videoElement.play().catch(error => {
          console.error('Error playing remote video for:', participantId, error);
        });
      }
    });

    // Clean up removed streams
    Object.keys(videoRefs.current).forEach(participantId => {
      if (!remoteStreams[participantId] && videoRefs.current[participantId]) {
        const videoElement = videoRefs.current[participantId];
        if (videoElement && videoElement.srcObject) {
          console.log('Cleaning up removed stream for:', participantId);
          videoElement.srcObject = null;
        }
      }
    });
  }, [remoteStreams]);

  const getGridClasses = () => {
    const count = participants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 lg:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
    if (count <= 9) return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-3";
    return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  const getParticipantVideoSize = () => {
    const count = participants.length;
    if (count === 1) return "aspect-video";
    if (count === 2) return "aspect-video";
    return "aspect-square lg:aspect-video";
  };

  return (
    <div className="h-full w-full p-2 sm:p-4 overflow-auto">
      <div className={`grid gap-2 sm:gap-4 h-full ${getGridClasses()}`}>
        {participants.map((participant) => {
          const isCurrentUser = participant.id === currentUserId;
          const hasRemoteStream = !isCurrentUser && remoteStreams[participant.id];
          const shouldShowVideo = participant.isVideoOn && (isCurrentUser ? currentUserStream : hasRemoteStream);
          
          console.log(`ParticipantGrid - ${participant.name}: isCurrentUser=${isCurrentUser}, hasRemoteStream=${hasRemoteStream}, shouldShowVideo=${shouldShowVideo}, isVideoOn=${participant.isVideoOn}`);
          
          return (
            <Card 
              key={participant.id} 
              className="relative bg-gray-800 border-gray-700 overflow-hidden group hover:border-blue-500 transition-colors"
            >
              <div className={`relative ${getParticipantVideoSize()} w-full bg-gradient-to-br from-gray-700 to-gray-800`}>
                {shouldShowVideo ? (
                  <video
                    ref={isCurrentUser ? currentUserVideoRef : (el) => {
                      videoRefs.current[participant.id] = el;
                      console.log(`Set video ref for ${participant.id}:`, !!el);
                    }}
                    autoPlay
                    playsInline
                    muted={isCurrentUser} // Only mute current user
                    className={`absolute inset-0 w-full h-full object-cover rounded-lg ${
                      isCurrentUser ? 'scale-x-[-1]' : ''
                    }`}
                  />
                ) : !participant.isVideoOn ? (
                  // Video off state
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300 text-xs sm:text-sm">Camera off</p>
                    </div>
                  </div>
                ) : (
                  // Loading/connecting state for remote video
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-center">
                      <User className="h-12 w-12 sm:h-16 sm:w-16 text-white/80 mx-auto mb-2" />
                      <p className="text-white/80 text-xs">Connecting video...</p>
                      <div className="mt-2 flex justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Participant Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-xs sm:text-sm truncate">
                        {participant.name}
                        {isCurrentUser && " (You)"}
                      </p>
                      {participant.rollNumber && (
                        <p className="text-gray-300 text-xs truncate">
                          Roll: {participant.rollNumber}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {/* Audio Status */}
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                        participant.isAudioOn ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {participant.isAudioOn ? (
                          <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        ) : (
                          <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        )}
                      </div>
                      
                      {/* Video Status */}
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                        participant.isVideoOn ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {participant.isVideoOn ? (
                          <Video className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        ) : (
                          <VideoOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Present Badge */}
                {participant.isPresent && (
                  <Badge 
                    className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1"
                  >
                    Present
                  </Badge>
                )}

                {/* Connection Status for Remote Participants */}
                {!isCurrentUser && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-3 h-3 rounded-full ${
                      hasRemoteStream ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    }`} title={hasRemoteStream ? 'Connected' : 'Connecting...'} />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantGrid;
