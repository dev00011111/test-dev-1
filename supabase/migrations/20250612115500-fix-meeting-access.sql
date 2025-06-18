
-- Fix the ambiguous column reference issue completely
DROP FUNCTION IF EXISTS public.get_or_create_meeting(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_or_create_meeting(
  meeting_id_param TEXT,
  host_id_param UUID,
  title_param TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  meeting_id TEXT,
  title TEXT,
  host_id UUID,
  status meeting_status,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  minimum_attendance_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  meeting_record RECORD;
BEGIN
  -- First try to get existing meeting
  SELECT 
    meetings.id,
    meetings.meeting_id,
    meetings.title,
    meetings.host_id,
    meetings.status,
    meetings.started_at,
    meetings.ended_at,
    meetings.created_at,
    meetings.updated_at,
    meetings.minimum_attendance_minutes
  INTO meeting_record
  FROM public.meetings
  WHERE meetings.meeting_id = meeting_id_param;
  
  -- If meeting exists, return it
  IF FOUND THEN
    RETURN QUERY
    SELECT 
      meetings.id,
      meetings.meeting_id,
      meetings.title,
      meetings.host_id,
      meetings.status,
      meetings.started_at,
      meetings.ended_at,
      meetings.created_at,
      meetings.updated_at,
      meetings.minimum_attendance_minutes
    FROM public.meetings
    WHERE meetings.meeting_id = meeting_id_param;
    RETURN;
  END IF;
  
  -- If meeting doesn't exist, create it
  INSERT INTO public.meetings (meeting_id, title, host_id, status, started_at, minimum_attendance_minutes)
  VALUES (
    meeting_id_param, 
    COALESCE(title_param, 'Meeting ' || meeting_id_param), 
    host_id_param, 
    'active', 
    NOW(),
    30
  )
  ON CONFLICT (meeting_id) DO UPDATE SET
    updated_at = NOW()
  RETURNING 
    meetings.id,
    meetings.meeting_id,
    meetings.title,
    meetings.host_id,
    meetings.status,
    meetings.started_at,
    meetings.ended_at,
    meetings.created_at,
    meetings.updated_at,
    meetings.minimum_attendance_minutes
  INTO meeting_record;
  
  -- Return the meeting
  RETURN QUERY
  SELECT 
    meeting_record.id,
    meeting_record.meeting_id,
    meeting_record.title,
    meeting_record.host_id,
    meeting_record.status,
    meeting_record.started_at,
    meeting_record.ended_at,
    meeting_record.created_at,
    meeting_record.updated_at,
    meeting_record.minimum_attendance_minutes;
END;
$$;

-- Also fix the join_or_rejoin_meeting function for consistency
DROP FUNCTION IF EXISTS public.join_or_rejoin_meeting(UUID, UUID, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.join_or_rejoin_meeting(
  meeting_id_param UUID,
  user_id_param UUID,
  name_param TEXT,
  roll_number_param TEXT DEFAULT NULL,
  is_host_param BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  id UUID,
  meeting_id UUID,
  user_id UUID,
  name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  is_host BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  roll_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_record RECORD;
BEGIN
  -- Check if user already has a participant record for this meeting
  SELECT 
    participants.id,
    participants.meeting_id,
    participants.user_id,
    participants.name,
    participants.joined_at,
    participants.left_at,
    participants.is_host,
    participants.created_at,
    participants.roll_number
  INTO participant_record
  FROM public.participants
  WHERE participants.meeting_id = meeting_id_param AND participants.user_id = user_id_param;
  
  -- If participant exists and left, rejoin them
  IF FOUND AND participant_record.left_at IS NOT NULL THEN
    UPDATE public.participants
    SET left_at = NULL, joined_at = NOW(), name = name_param
    WHERE participants.id = participant_record.id
    RETURNING 
      participants.id,
      participants.meeting_id,
      participants.user_id,
      participants.name,
      participants.joined_at,
      participants.left_at,
      participants.is_host,
      participants.created_at,
      participants.roll_number
    INTO participant_record;
    
    RETURN QUERY
    SELECT 
      participant_record.id,
      participant_record.meeting_id,
      participant_record.user_id,
      participant_record.name,
      participant_record.joined_at,
      participant_record.left_at,
      participant_record.is_host,
      participant_record.created_at,
      participant_record.roll_number;
    RETURN;
  END IF;
  
  -- If participant exists and hasn't left, return existing record
  IF FOUND AND participant_record.left_at IS NULL THEN
    RETURN QUERY
    SELECT 
      participant_record.id,
      participant_record.meeting_id,
      participant_record.user_id,
      participant_record.name,
      participant_record.joined_at,
      participant_record.left_at,
      participant_record.is_host,
      participant_record.created_at,
      participant_record.roll_number;
    RETURN;
  END IF;
  
  -- Create new participant
  INSERT INTO public.participants (meeting_id, user_id, name, is_host, roll_number)
  VALUES (meeting_id_param, user_id_param, name_param, is_host_param, roll_number_param)
  RETURNING 
    participants.id,
    participants.meeting_id,
    participants.user_id,
    participants.name,
    participants.joined_at,
    participants.left_at,
    participants.is_host,
    participants.created_at,
    participants.roll_number
  INTO participant_record;
  
  RETURN QUERY
  SELECT 
    participant_record.id,
    participant_record.meeting_id,
    participant_record.user_id,
    participant_record.name,
    participant_record.joined_at,
    participant_record.left_at,
    participant_record.is_host,
    participant_record.created_at,
    participant_record.roll_number;
END;
$$;
