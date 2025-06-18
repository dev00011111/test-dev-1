
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MeetingInterface from "@/components/meeting/MeetingInterface";

const MeetingRoom = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [finalMeetingId, setFinalMeetingId] = useState<string | null>(null);

  useEffect(() => {
    console.log('MeetingRoom: URL params:', { meetingId });
    
    // If no meetingId in URL, redirect to home
    if (!meetingId) {
      console.log('MeetingRoom: No meeting ID found, redirecting to home');
      navigate("/");
      return;
    }

    // Handle direct meeting link joining
    // Extract meeting ID from URL if it's a full URL path
    let extractedMeetingId = meetingId;
    
    // If the meetingId contains slashes or other URL components, extract just the ID
    if (meetingId.includes('/')) {
      const parts = meetingId.split('/');
      extractedMeetingId = parts[parts.length - 1];
    }
    
    // Clean up any query parameters
    if (extractedMeetingId.includes('?')) {
      extractedMeetingId = extractedMeetingId.split('?')[0];
    }
    
    console.log('MeetingRoom: Extracted meeting ID:', extractedMeetingId);
    setFinalMeetingId(extractedMeetingId);
  }, [meetingId, navigate]);

  if (!finalMeetingId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Loading meeting...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <MeetingInterface meetingId={finalMeetingId} />
    </div>
  );
};

export default MeetingRoom;
