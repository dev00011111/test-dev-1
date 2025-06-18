
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  id: string;
  meeting_id: string;
  title: string;
  host_id: string;
  status: 'scheduled' | 'active' | 'ended';
  started_at: string | null;
  ended_at: string | null;
  minimum_attendance_minutes: number;
}

interface Participant {
  id: string;
  meeting_id: string;
  user_id: string | null;
  name: string;
  joined_at: string;
  left_at: string | null;
  is_host: boolean;
  roll_number?: string;
}

export function useMeeting(meetingId: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!meetingId) {
      setError("Meeting ID is required");
      setLoading(false);
      return;
    }

    fetchMeeting();
    setupRealtimeSubscriptions();

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up meeting realtime subscriptions');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [meetingId, user]);

  const fetchMeeting = async () => {
    try {
      setError(null);
      console.log('Fetching meeting data for:', meetingId);
      
      // Fetch meeting details
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('meeting_id', meetingId)
        .maybeSingle();

      if (meetingError) {
        console.error('Error fetching meeting:', meetingError);
        setError('Failed to load meeting. Please check the meeting ID and try again.');
        return;
      }

      console.log('Meeting data:', meetingData);
      
      if (meetingData) {
        setMeeting(meetingData);
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('meeting_id', meetingData.id)
          .is('left_at', null);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
        } else {
          console.log('Participants data:', participantsData);
          setParticipants(participantsData || []);
          
          // Find current user's participant record
          const userParticipant = participantsData?.find(p => p.user_id === user?.id);
          if (userParticipant) {
            setCurrentParticipant(userParticipant);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchMeeting:', error);
      setError('Unable to access the meeting. Please check the meeting ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('Setting up realtime subscriptions');
    
    channelRef.current = supabase
      .channel('meeting-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          console.log('Participant update received:', payload);
          fetchMeeting();
        }
      )
      .subscribe();
  };

  const joinMeeting = async (name: string, rollNumber?: string) => {
    if (!user) {
      setError("Authentication required");
      toast({
        title: "Authentication required",
        description: "Please sign in to join the meeting.",
        variant: "destructive",
      });
      return false;
    }

    if (!name.trim()) {
      setError("Name is required");
      toast({
        title: "Name required",
        description: "Please enter your name to join the meeting.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setError(null);
      console.log('Attempting to join meeting:', { 
        meetingId, 
        name: name.trim(), 
        rollNumber: rollNumber?.trim() || null, 
        userId: user.id 
      });
      
      // Get minimum attendance from localStorage (set by host when creating meeting)
      const storedMinAttendance = localStorage.getItem(`meeting_${meetingId}_min_attendance`);
      const minimumAttendance = storedMinAttendance ? parseInt(storedMinAttendance) : 30;
      
      console.log('Calling get_or_create_meeting with params:', {
        input_meeting_id: meetingId,
        input_host_id: user.id,
        input_title: `Meeting ${meetingId}`
      });
      
      // Use the updated database function with new parameter names
      const { data: meetingResult, error: meetingError } = await supabase
        .rpc('get_or_create_meeting', {
          input_meeting_id: meetingId,
          input_host_id: user.id,
          input_title: `Meeting ${meetingId}`
        });

      console.log('get_or_create_meeting result:', { meetingResult, meetingError });

      if (meetingError) {
        console.error('Error getting/creating meeting:', meetingError);
        setError(`Failed to access meeting: ${meetingError.message}`);
        toast({
          title: "Meeting access failed",
          description: `Error: ${meetingError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!meetingResult || meetingResult.length === 0) {
        console.error('No meeting result returned from function');
        setError('Unable to create or access the meeting. Please try again.');
        toast({
          title: "Meeting access failed",
          description: "Unable to create or access the meeting. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Handle the new return column names from the updated function
      const meetingData = {
        id: meetingResult[0].result_id,
        meeting_id: meetingResult[0].result_meeting_id,
        title: meetingResult[0].result_title,
        host_id: meetingResult[0].result_host_id,
        status: meetingResult[0].result_status,
        started_at: meetingResult[0].result_started_at,
        ended_at: meetingResult[0].result_ended_at,
        created_at: meetingResult[0].result_created_at,
        updated_at: meetingResult[0].result_updated_at,
        minimum_attendance_minutes: meetingResult[0].result_minimum_attendance_minutes
      };
      
      console.log('Meeting created/found successfully:', meetingData);
      
      // Update meeting with minimum attendance if we created it
      if (storedMinAttendance && meetingData.minimum_attendance_minutes === 30) {
        const { error: updateError } = await supabase
          .from('meetings')
          .update({ minimum_attendance_minutes: minimumAttendance })
          .eq('id', meetingData.id);
        
        if (updateError) {
          console.error('Error updating minimum attendance:', updateError);
        } else {
          console.log('Updated minimum attendance to:', minimumAttendance);
        }
        
        // Clear from localStorage
        localStorage.removeItem(`meeting_${meetingId}_min_attendance`);
      }

      setMeeting(meetingData);

      console.log('Calling join_or_rejoin_meeting with params:', {
        input_meeting_id: meetingData.id,
        input_user_id: user.id,
        input_name: name.trim(),
        input_roll_number: rollNumber?.trim() || null,
        input_is_host: meetingData.host_id === user.id
      });

      // Use the updated database function with new parameter names
      const { data: participantResult, error: participantError } = await supabase
        .rpc('join_or_rejoin_meeting', {
          input_meeting_id: meetingData.id,
          input_user_id: user.id,
          input_name: name.trim(),
          input_roll_number: rollNumber?.trim() || null,
          input_is_host: meetingData.host_id === user.id
        });

      console.log('join_or_rejoin_meeting result:', { participantResult, participantError });

      if (participantError) {
        console.error('Error joining meeting:', participantError);
        setError(`Failed to join meeting: ${participantError.message}`);
        toast({
          title: "Failed to join meeting",
          description: `Error: ${participantError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!participantResult || participantResult.length === 0) {
        console.error('No participant result returned from function');
        setError('Failed to join meeting. Please try again.');
        toast({
          title: "Failed to join meeting",
          description: "No participant data returned. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Handle the new return column names from the updated function
      const participantData = {
        id: participantResult[0].result_id,
        meeting_id: participantResult[0].result_meeting_id,
        user_id: participantResult[0].result_user_id,
        name: participantResult[0].result_name,
        joined_at: participantResult[0].result_joined_at,
        left_at: participantResult[0].result_left_at,
        is_host: participantResult[0].result_is_host,
        created_at: participantResult[0].result_created_at,
        roll_number: participantResult[0].result_roll_number
      };
      
      console.log('Successfully joined meeting as participant:', participantData);
      setCurrentParticipant(participantData);
      
      toast({
        title: "Joined meeting successfully",
        description: `Welcome to the meeting, ${name}!`,
      });
      
      // Refresh meeting data to get updated participants list
      await fetchMeeting();
      
      return true;
    } catch (error) {
      console.error('Error in joinMeeting:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(`Unexpected error: ${errorMessage}`);
      toast({
        title: "Unexpected error",
        description: `Error: ${errorMessage}. Please refresh the page and try again.`,
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveMeeting = async () => {
    if (!currentParticipant) return;

    try {
      console.log('Leaving meeting:', currentParticipant.id);
      
      const { error } = await supabase
        .from('participants')
        .update({ left_at: new Date().toISOString() })
        .eq('id', currentParticipant.id);

      if (error) {
        console.error('Error leaving meeting:', error);
        toast({
          title: "Error leaving meeting",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      setCurrentParticipant(null);
      
      toast({
        title: "Left meeting",
        description: "You have successfully left the meeting.",
      });
    } catch (error) {
      console.error('Error leaving meeting:', error);
      toast({
        title: "Error leaving meeting",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    meeting,
    participants,
    currentParticipant,
    loading,
    error,
    joinMeeting,
    leaveMeeting,
  };
}
