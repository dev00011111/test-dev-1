
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PeerConnection {
  [participantId: string]: RTCPeerConnection;
}

interface RemoteStreams {
  [participantId: string]: MediaStream;
}

export function useWebRTC(meetingId: string, currentParticipantId: string | null, localStream: MediaStream | null) {
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreams>({});
  const peerConnections = useRef<PeerConnection>({});
  const channelRef = useRef<any>(null);
  const pendingCandidates = useRef<{ [participantId: string]: RTCIceCandidate[] }>({});

  // Enhanced STUN/TURN servers for better connectivity
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceCandidatePoolSize: 10
  };

  const createPeerConnection = useCallback((participantId: string) => {
    console.log('Creating peer connection for:', participantId);
    
    const pc = new RTCPeerConnection(rtcConfiguration);
    
    // Add local stream tracks to peer connection if available
    if (localStream) {
      console.log('Adding local stream tracks to peer connection for:', participantId);
      localStream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, 'enabled:', track.enabled);
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', participantId, 'streams:', event.streams.length);
      const [remoteStream] = event.streams;
      if (remoteStream && remoteStream.getTracks().length > 0) {
        console.log('Setting remote stream for participant:', participantId, 'tracks:', remoteStream.getTracks().length);
        setRemoteStreams(prev => ({
          ...prev,
          [participantId]: remoteStream
        }));
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log('Sending ICE candidate to:', participantId);
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            targetParticipant: participantId,
            fromParticipant: currentParticipantId
          }
        });
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${participantId}:`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.log('Connection failed, attempting to restart ICE');
        pc.restartIce();
      } else if (pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[participantId];
          return newStreams;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${participantId}:`, pc.iceConnectionState);
    };

    peerConnections.current[participantId] = pc;
    pendingCandidates.current[participantId] = [];
    return pc;
  }, [localStream, currentParticipantId]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromParticipant: string) => {
    console.log('Handling offer from:', fromParticipant);
    
    const pc = peerConnections.current[fromParticipant] || createPeerConnection(fromParticipant);
    
    try {
      await pc.setRemoteDescription(offer);
      console.log('Set remote description for offer from:', fromParticipant);
      
      // Process any pending ICE candidates
      if (pendingCandidates.current[fromParticipant]) {
        for (const candidate of pendingCandidates.current[fromParticipant]) {
          try {
            await pc.addIceCandidate(candidate);
            console.log('Added pending ICE candidate for:', fromParticipant);
          } catch (error) {
            console.error('Error adding pending ICE candidate:', error);
          }
        }
        pendingCandidates.current[fromParticipant] = [];
      }
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('Created and set local answer for:', fromParticipant);

      // Send answer through Supabase realtime
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            answer,
            targetParticipant: fromParticipant,
            fromParticipant: currentParticipantId
          }
        });
      }
    } catch (error) {
      console.error('Error handling offer from:', fromParticipant, error);
    }
  }, [createPeerConnection, currentParticipantId]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, fromParticipant: string) => {
    console.log('Handling answer from:', fromParticipant);
    
    const pc = peerConnections.current[fromParticipant];
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
        console.log('Set remote description for answer from:', fromParticipant);
        
        // Process any pending ICE candidates
        if (pendingCandidates.current[fromParticipant]) {
          for (const candidate of pendingCandidates.current[fromParticipant]) {
            try {
              await pc.addIceCandidate(candidate);
              console.log('Added pending ICE candidate for:', fromParticipant);
            } catch (error) {
              console.error('Error adding pending ICE candidate:', error);
            }
          }
          pendingCandidates.current[fromParticipant] = [];
        }
      } catch (error) {
        console.error('Error handling answer from:', fromParticipant, error);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidate, fromParticipant: string) => {
    console.log('Handling ICE candidate from:', fromParticipant);
    
    const pc = peerConnections.current[fromParticipant];
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(candidate);
        console.log('Added ICE candidate from:', fromParticipant);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    } else {
      console.log('Queuing ICE candidate for:', fromParticipant);
      if (!pendingCandidates.current[fromParticipant]) {
        pendingCandidates.current[fromParticipant] = [];
      }
      pendingCandidates.current[fromParticipant].push(candidate);
    }
  }, []);

  const initiateCall = useCallback(async (targetParticipant: string) => {
    console.log('Initiating call to:', targetParticipant);
    
    const pc = createPeerConnection(targetParticipant);
    
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      console.log('Created and set local offer for:', targetParticipant);

      // Send offer through Supabase realtime
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer,
            targetParticipant,
            fromParticipant: currentParticipantId
          }
        });
      }
    } catch (error) {
      console.error('Error creating offer for:', targetParticipant, error);
    }
  }, [createPeerConnection, currentParticipantId]);

  // Set up WebRTC signaling
  useEffect(() => {
    if (!currentParticipantId || !meetingId) return;

    console.log('Setting up WebRTC for meeting:', meetingId, 'participant:', currentParticipantId);

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set up Supabase realtime channel for signaling
    channelRef.current = supabase
      .channel(`webrtc-${meetingId}`)
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        console.log('Received offer event:', payload);
        if (payload.targetParticipant === currentParticipantId && payload.fromParticipant !== currentParticipantId) {
          handleOffer(payload.offer, payload.fromParticipant);
        }
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        console.log('Received answer event:', payload);
        if (payload.targetParticipant === currentParticipantId && payload.fromParticipant !== currentParticipantId) {
          handleAnswer(payload.answer, payload.fromParticipant);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        console.log('Received ICE candidate event:', payload);
        if (payload.targetParticipant === currentParticipantId && payload.fromParticipant !== currentParticipantId) {
          handleIceCandidate(payload.candidate, payload.fromParticipant);
        }
      })
      .on('broadcast', { event: 'participant-joined' }, ({ payload }) => {
        console.log('Participant joined event:', payload);
        if (payload.participantId !== currentParticipantId) {
          // Initiate call to newly joined participant after a delay
          setTimeout(() => {
            console.log('Initiating call to newly joined participant:', payload.participantId);
            initiateCall(payload.participantId);
          }, 2000);
        }
      })
      .on('broadcast', { event: 'participant-left' }, ({ payload }) => {
        console.log('Participant left event:', payload);
        if (payload.participantId !== currentParticipantId) {
          // Clean up peer connection for left participant
          const pc = peerConnections.current[payload.participantId];
          if (pc) {
            pc.close();
            delete peerConnections.current[payload.participantId];
          }
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[payload.participantId];
            return newStreams;
          });
        }
      })
      .subscribe((status) => {
        console.log('WebRTC channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          // Announce that we've joined after a delay to ensure proper setup
          setTimeout(() => {
            console.log('Announcing participant joined');
            channelRef.current?.send({
              type: 'broadcast',
              event: 'participant-joined',
              payload: {
                participantId: currentParticipantId
              }
            });
          }, 1000);
        }
      });

    return () => {
      console.log('Cleaning up WebRTC connections');
      
      // Announce leaving
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'participant-left',
          payload: {
            participantId: currentParticipantId
          }
        });
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Close all peer connections
      Object.values(peerConnections.current).forEach(pc => {
        pc.close();
      });
      peerConnections.current = {};
      pendingCandidates.current = {};
      setRemoteStreams({});
    };
  }, [meetingId, currentParticipantId, handleOffer, handleAnswer, handleIceCandidate, initiateCall]);

  // Update peer connections when local stream changes
  useEffect(() => {
    console.log('Local stream changed:', !!localStream);
    
    if (localStream) {
      Object.entries(peerConnections.current).forEach(([participantId, pc]) => {
        console.log('Updating peer connection for:', participantId);
        
        // Get current senders
        const senders = pc.getSenders();
        
        // Remove old tracks
        senders.forEach(sender => {
          if (sender.track) {
            console.log('Removing old track:', sender.track.kind);
            pc.removeTrack(sender);
          }
        });

        // Add new tracks
        localStream.getTracks().forEach(track => {
          console.log('Adding new track:', track.kind, 'enabled:', track.enabled);
          pc.addTrack(track, localStream);
        });
      });
    }
  }, [localStream]);

  return {
    remoteStreams,
    initiateCall
  };
}
