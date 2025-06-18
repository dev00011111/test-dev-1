
-- Drop all existing versions of the functions to start clean
DROP FUNCTION IF EXISTS public.get_or_create_meeting(text, uuid, text);
DROP FUNCTION IF EXISTS public.get_or_create_meeting(meeting_id_param text, host_id_param uuid, title_param text);
DROP FUNCTION IF EXISTS public.join_or_rejoin_meeting(uuid, uuid, text, text, boolean);
DROP FUNCTION IF EXISTS public.join_or_rejoin_meeting(meeting_id_param uuid, user_id_param uuid, name_param text, roll_number_param text, is_host_param boolean);

-- Create get_or_create_meeting function with completely unique parameter names
CREATE OR REPLACE FUNCTION public.get_or_create_meeting(
  input_meeting_id TEXT,
  input_host_id UUID,
  input_title TEXT DEFAULT NULL
)
RETURNS TABLE(
  result_id UUID,
  result_meeting_id TEXT,
  result_title TEXT,
  result_host_id UUID,
  result_status meeting_status,
  result_started_at TIMESTAMP WITH TIME ZONE,
  result_ended_at TIMESTAMP WITH TIME ZONE,
  result_created_at TIMESTAMP WITH TIME ZONE,
  result_updated_at TIMESTAMP WITH TIME ZONE,
  result_minimum_attendance_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_meeting RECORD;
BEGIN
  -- Try to find existing meeting
  SELECT 
    m.id,
    m.meeting_id,
    m.title,
    m.host_id,
    m.status,
    m.started_at,
    m.ended_at,
    m.created_at,
    m.updated_at,
    m.minimum_attendance_minutes
  INTO found_meeting
  FROM public.meetings m
  WHERE m.meeting_id = input_meeting_id;
  
  -- If meeting exists, return it
  IF FOUND THEN
    RETURN QUERY
    SELECT 
      m.id,
      m.meeting_id,
      m.title,
      m.host_id,
      m.status,
      m.started_at,
      m.ended_at,
      m.created_at,
      m.updated_at,
      m.minimum_attendance_minutes
    FROM public.meetings m
    WHERE m.meeting_id = input_meeting_id;
    RETURN;
  END IF;
  
  -- Create new meeting if it doesn't exist
  INSERT INTO public.meetings (meeting_id, title, host_id, status, started_at, minimum_attendance_minutes)
  VALUES (
    input_meeting_id, 
    COALESCE(input_title, 'Meeting ' || input_meeting_id), 
    input_host_id, 
    'active', 
    NOW(),
    30
  )
  ON CONFLICT (meeting_id) DO UPDATE SET
    updated_at = NOW()
  RETURNING 
    id,
    meeting_id,
    title,
    host_id,
    status,
    started_at,
    ended_at,
    created_at,
    updated_at,
    minimum_attendance_minutes
  INTO found_meeting;
  
  -- Return the created meeting
  RETURN QUERY
  SELECT 
    found_meeting.id,
    found_meeting.meeting_id,
    found_meeting.title,
    found_meeting.host_id,
    found_meeting.status,
    found_meeting.started_at,
    found_meeting.ended_at,
    found_meeting.created_at,
    found_meeting.updated_at,
    found_meeting.minimum_attendance_minutes;
END;
$$;

-- Create join_or_rejoin_meeting function with completely unique parameter names
CREATE OR REPLACE FUNCTION public.join_or_rejoin_meeting(
  input_meeting_id UUID,
  input_user_id UUID,
  input_name TEXT,
  input_roll_number TEXT DEFAULT NULL,
  input_is_host BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  result_id UUID,
  result_meeting_id UUID,
  result_user_id UUID,
  result_name TEXT,
  result_joined_at TIMESTAMP WITH TIME ZONE,
  result_left_at TIMESTAMP WITH TIME ZONE,
  result_is_host BOOLEAN,
  result_created_at TIMESTAMP WITH TIME ZONE,
  result_roll_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_participant RECORD;
BEGIN
  -- Check if user already has a participant record for this meeting
  SELECT 
    p.id,
    p.meeting_id,
    p.user_id,
    p.name,
    p.joined_at,
    p.left_at,
    p.is_host,
    p.created_at,
    p.roll_number
  INTO found_participant
  FROM public.participants p
  WHERE p.meeting_id = input_meeting_id AND p.user_id = input_user_id;
  
  -- If participant exists and left, rejoin them
  IF FOUND AND found_participant.left_at IS NOT NULL THEN
    UPDATE public.participants
    SET left_at = NULL, joined_at = NOW(), name = input_name
    WHERE id = found_participant.id
    RETURNING 
      id,
      meeting_id,
      user_id,
      name,
      joined_at,
      left_at,
      is_host,
      created_at,
      roll_number
    INTO found_participant;
    
    RETURN QUERY
    SELECT 
      found_participant.id,
      found_participant.meeting_id,
      found_participant.user_id,
      found_participant.name,
      found_participant.joined_at,
      found_participant.left_at,
      found_participant.is_host,
      found_participant.created_at,
      found_participant.roll_number;
    RETURN;
  END IF;
  
  -- If participant exists and hasn't left, return existing record
  IF FOUND AND found_participant.left_at IS NULL THEN
    RETURN QUERY
    SELECT 
      found_participant.id,
      found_participant.meeting_id,
      found_participant.user_id,
      found_participant.name,
      found_participant.joined_at,
      found_participant.left_at,
      found_participant.is_host,
      found_participant.created_at,
      found_participant.roll_number;
    RETURN;
  END IF;
  
  -- Create new participant
  INSERT INTO public.participants (meeting_id, user_id, name, is_host, roll_number)
  VALUES (input_meeting_id, input_user_id, input_name, input_is_host, input_roll_number)
  RETURNING 
    id,
    meeting_id,
    user_id,
    name,
    joined_at,
    left_at,
    is_host,
    created_at,
    roll_number
  INTO found_participant;
  
  RETURN QUERY
  SELECT 
    found_participant.id,
    found_participant.meeting_id,
    found_participant.user_id,
    found_participant.name,
    found_participant.joined_at,
    found_participant.left_at,
    found_participant.is_host,
    found_participant.created_at,
    found_participant.roll_number;
END;
$$;
