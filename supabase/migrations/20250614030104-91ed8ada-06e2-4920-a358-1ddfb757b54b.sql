
-- Fix the ambiguous column reference issue in get_or_create_meeting function
DROP FUNCTION IF EXISTS public.get_or_create_meeting(text, uuid, text);

CREATE OR REPLACE FUNCTION public.get_or_create_meeting(
  p_meeting_id TEXT,
  p_host_id UUID,
  p_title TEXT DEFAULT NULL
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
  -- First try to get existing meeting using fully qualified column names
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
  INTO meeting_record
  FROM public.meetings m
  WHERE m.meeting_id = p_meeting_id;
  
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
    WHERE m.meeting_id = p_meeting_id;
    RETURN;
  END IF;
  
  -- If meeting doesn't exist, create it
  INSERT INTO public.meetings (meeting_id, title, host_id, status, started_at, minimum_attendance_minutes)
  VALUES (
    p_meeting_id, 
    COALESCE(p_title, 'Meeting ' || p_meeting_id), 
    p_host_id, 
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
