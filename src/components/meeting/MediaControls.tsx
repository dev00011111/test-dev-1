
import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MediaControlsProps {
  isVideoOn: boolean;
  isAudioOn: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  stream?: MediaStream | null;
  error?: string | null;
  onRequestPermissions?: () => Promise<boolean>;
}

const MediaControls = ({ 
  isVideoOn, 
  isAudioOn, 
  onToggleVideo, 
  onToggleAudio, 
  stream, 
  error,
  onRequestPermissions 
}: MediaControlsProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.log('MediaControls effect - stream:', !!stream, 'isVideoOn:', isVideoOn);
    
    if (videoRef.current) {
      if (stream && isVideoOn) {
        console.log('Setting video stream');
        videoRef.current.srcObject = stream;
        
        // Ensure video plays and is muted for self-view
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video playing successfully');
            })
            .catch(error => {
              console.error('Error playing video:', error);
            });
        }
      } else {
        console.log('Clearing video stream');
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject = null;
        }
      }
    }
  }, [stream, isVideoOn]);

  const handleToggleVideo = async () => {
    console.log('MediaControls - toggling video');
    await onToggleVideo();
  };

  const handleToggleAudio = async () => {
    console.log('MediaControls - toggling audio');
    await onToggleAudio();
  };

  const handleRetryPermissions = async () => {
    if (!onRequestPermissions) return;
    
    setIsRetrying(true);
    try {
      await onRequestPermissions();
    } catch (error) {
      console.error('Failed to retry permissions:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            {onRequestPermissions && (
              <Button
                onClick={handleRetryPermissions}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="ml-2 h-6 text-xs"
              >
                {isRetrying ? 'Retrying...' : 'Allow Permissions'}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="aspect-video relative overflow-hidden bg-gray-900 w-full">
        {stream && isVideoOn ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="flex flex-col items-center gap-3">
              <User className="h-16 w-16 text-gray-500" />
              <div className="text-center">
                <div className="text-white text-sm bg-black/50 px-3 py-2 rounded mb-2">
                  {error ? 'Camera access needed' : isVideoOn ? 'Starting camera...' : 'Camera off'}
                </div>
                {error && onRequestPermissions && (
                  <Button
                    onClick={handleRetryPermissions}
                    disabled={isRetrying}
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                  >
                    {isRetrying ? 'Requesting...' : 'Enable Camera'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <Button
            size="sm"
            variant={isVideoOn ? "default" : "destructive"}
            onClick={handleToggleVideo}
            disabled={!!error && !stream}
          >
            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          
          <Button
            size="sm"
            variant={isAudioOn ? "default" : "destructive"}
            onClick={handleToggleAudio}
            disabled={!!error && !stream}
          >
            {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MediaControls;
