
import { useState, useEffect, useRef, useCallback } from 'react';

export function useMediaStream() {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const checkPermissions = useCallback(async () => {
    try {
      const permissions = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName })
      ]);
      
      const cameraPermission = permissions[0];
      const micPermission = permissions[1];
      
      console.log('Permissions status:', { 
        camera: cameraPermission.state, 
        microphone: micPermission.state 
      });
      
      return cameraPermission.state === 'granted' && micPermission.state === 'granted';
    } catch (error) {
      console.log('Permissions API not supported, will request during getUserMedia');
      return false;
    }
  }, []);

  const initializeMedia = useCallback(async (retryOnDenied = true) => {
    try {
      setError(null);
      console.log('Requesting media permissions...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Media stream obtained:', mediaStream);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermissions(true);
      setIsVideoOn(true);
      setIsAudioOn(true);
      
      // Ensure tracks are enabled by default
      mediaStream.getVideoTracks().forEach(track => {
        track.enabled = true;
        console.log('Video track enabled:', track.label);
      });
      
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('Audio track enabled:', track.label);
      });

      return mediaStream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('Camera and microphone access denied. Please allow permissions and try again.');
        setHasPermissions(false);
      } else if (error.name === 'NotFoundError') {
        setError('No camera or microphone found. Please check your devices.');
        setHasPermissions(false);
      } else if (error.name === 'NotReadableError') {
        setError('Camera or microphone is already in use by another application.');
        setHasPermissions(false);
      } else {
        setError('Failed to access camera and microphone. Please try again.');
        setHasPermissions(false);
      }
      
      setIsVideoOn(false);
      setIsAudioOn(false);
      throw error;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const setupMedia = async () => {
      try {
        const hasPerms = await checkPermissions();
        if (hasPerms) {
          await initializeMedia();
        }
      } catch (error) {
        console.error('Failed to initialize media:', error);
      }
    };

    setupMedia();

    return () => {
      mounted = false;
      console.log('Cleaning up media streams...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track on cleanup:', track.kind, track.label);
          track.stop();
        });
        streamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          console.log('Stopping screen track on cleanup:', track.kind, track.label);
          track.stop();
        });
        screenStreamRef.current = null;
      }
    };
  }, [initializeMedia, checkPermissions]);

  const toggleVideo = useCallback(async () => {
    console.log('Toggling video, current state:', isVideoOn);
    
    if (!streamRef.current) {
      // Need to initialize stream first
      try {
        await initializeMedia();
        return;
      } catch (error) {
        console.error('Failed to initialize video:', error);
        return;
      }
    }

    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      const newVideoState = !isVideoOn;
      
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
        console.log('Video track toggled:', track.enabled, track.label);
      });
      
      setIsVideoOn(newVideoState);
      
      // Trigger re-render by updating stream reference
      setStream(streamRef.current);
    }
  }, [isVideoOn, initializeMedia]);

  const toggleAudio = useCallback(async () => {
    console.log('Toggling audio, current state:', isAudioOn);
    
    if (!streamRef.current) {
      // Need to initialize stream first
      try {
        await initializeMedia();
        return;
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        return;
      }
    }
    
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      const newAudioState = !isAudioOn;
      
      audioTracks.forEach(track => {
        track.enabled = newAudioState;
        console.log('Audio track toggled:', track.enabled, track.label);
      });
      
      setIsAudioOn(newAudioState);
    }
  }, [isAudioOn, initializeMedia]);

  const requestPermissions = useCallback(async () => {
    try {
      await initializeMedia();
      return true;
    } catch (error) {
      return false;
    }
  }, [initializeMedia]);

  const startScreenShare = useCallback(async () => {
    try {
      console.log('Starting screen share...');
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Store screen stream
      screenStreamRef.current = screenStream;
      
      // Replace video track with screen share
      setStream(screenStream);
      setIsScreenSharing(true);

      console.log('Screen sharing started');

      // Listen for screen share end
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen share ended by user');
        stopScreenShare();
      });
    } catch (error) {
      console.error('Error starting screen share:', error);
      setError('Failed to start screen sharing. Please try again.');
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    console.log('Stopping screen share...');
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }

    // Restart camera stream
    try {
      const newStream = await initializeMedia();
      setIsScreenSharing(false);
      
      // Apply current settings
      if (newStream) {
        newStream.getVideoTracks().forEach(track => {
          track.enabled = isVideoOn;
        });
        
        newStream.getAudioTracks().forEach(track => {
          track.enabled = isAudioOn;
        });
      }
    } catch (error) {
      console.error('Error restarting camera:', error);
      setIsScreenSharing(false);
    }
  }, [isVideoOn, isAudioOn, initializeMedia]);

  const stopAllTracks = useCallback(() => {
    console.log('Stopping all media tracks...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        console.log('Stopping screen track:', track.kind, track.label);
        track.stop();
      });
      screenStreamRef.current = null;
    }
    
    setStream(null);
    setIsVideoOn(false);
    setIsAudioOn(false);
    setIsScreenSharing(false);
    setHasPermissions(false);
    setError(null);
  }, []);

  return {
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    stream,
    hasPermissions,
    error,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    stopAllTracks,
    initializeMedia,
    requestPermissions
  };
}
