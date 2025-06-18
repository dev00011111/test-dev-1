
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  meeting_id: string;
  participant_id: string;
  message: string;
  created_at: string;
  participants: {
    name: string;
  };
}

export function useChat(meetingDbId: string | null, participantId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!meetingDbId) return;

    fetchMessages();
    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('Cleaning up chat subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [meetingDbId]);

  const fetchMessages = async () => {
    if (!meetingDbId) return;

    try {
      setLoading(true);
      console.log('Fetching chat messages for meeting:', meetingDbId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          participants (
            name
          )
        `)
        .eq('meeting_id', meetingDbId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error loading chat",
          description: "Failed to load chat messages.",
          variant: "destructive",
        });
      } else {
        console.log('Chat messages loaded:', data);
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Clean up existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('Setting up chat realtime subscription for meeting:', meetingDbId);
    
    channelRef.current = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `meeting_id=eq.${meetingDbId}`,
        },
        (payload) => {
          console.log('New chat message received:', payload);
          fetchMessages(); // Refresh messages when new ones arrive
        }
      )
      .subscribe();
  };

  const sendMessage = async (message: string) => {
    if (!meetingDbId || !participantId || !message.trim()) {
      console.warn('Missing required data for sending message:', { meetingDbId, participantId, message });
      return;
    }

    try {
      console.log('Sending chat message:', { meetingDbId, participantId, message });
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          meeting_id: meetingDbId,
          participant_id: participantId,
          message: message.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error sending message",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Message sent successfully');
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    loading,
    sendMessage,
  };
}
