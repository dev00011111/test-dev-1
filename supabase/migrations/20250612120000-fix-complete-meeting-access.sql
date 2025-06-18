
-- Drop existing functions to recreate with correct parameter names
DROP FUNCTION IF EXISTS public.get_or_create_meeting(text, uuid, text);
DROP FUNCTION IF EXISTS public.join_or_rejoin_meeting(uuid, uuid, text, text, boolean);

-- Create the get_or_create_meeting function with correct parameter names that match TypeScript types
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
  WHERE meetings.meeting_id = p_meeting_id;
  
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
    WHERE meetings.meeting_id = p_meeting_id;
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

-- Create the join_or_rejoin_meeting function with correct parameter names
CREATE OR REPLACE FUNCTION public.join_or_rejoin_meeting(
  p_meeting_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_roll_number TEXT DEFAULT NULL,
  p_is_host BOOLEAN DEFAULT FALSE
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
  WHERE participants.meeting_id = p_meeting_id AND participants.user_id = p_user_id;
  
  -- If participant exists and left, rejoin them
  IF FOUND AND participant_record.left_at IS NOT NULL THEN
    UPDATE public.participants
    SET left_at = NULL, joined_at = NOW(), name = p_name
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
  VALUES (p_meeting_id, p_user_id, p_name, p_is_host, p_roll_number)
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

-- Enable RLS on all tables
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view meetings they host or participate in" ON public.meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update meetings they host" ON public.meetings;
DROP POLICY IF EXISTS "Users can view participants in meetings they're part of" ON public.participants;
DROP POLICY IF EXISTS "Users can join meetings" ON public.participants;
DROP POLICY IF EXISTS "Users can update their participant record" ON public.participants;
DROP POLICY IF EXISTS "Users can view chat messages in meetings they're part of" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages in meetings they're part of" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view attendance records in meetings they're part of" ON public.attendance_records;
DROP POLICY IF EXISTS "System can manage attendance records" ON public.attendance_records;

-- Create comprehensive RLS policies for meetings
CREATE POLICY "Users can view meetings they host or participate in" 
  ON public.meetings 
  FOR SELECT 
  USING (
    host_id = auth.uid() OR 
    id IN (
      SELECT meeting_id FROM public.participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can create meetings" 
  ON public.meetings 
  FOR INSERT 
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Users can update meetings they host" 
  ON public.meetings 
  FOR UPDATE 
  USING (host_id = auth.uid());

-- Create RLS policies for participants
CREATE POLICY "Users can view participants in meetings they're part of" 
  ON public.participants 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    meeting_id IN (
      SELECT id FROM public.meetings WHERE host_id = auth.uid()
    ) OR
    meeting_id IN (
      SELECT meeting_id FROM public.participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can join meetings" 
  ON public.participants 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participant record" 
  ON public.participants 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create RLS policies for chat messages
CREATE POLICY "Users can view chat messages in meetings they're part of" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings WHERE host_id = auth.uid()
    ) OR
    meeting_id IN (
      SELECT meeting_id FROM public.participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can send chat messages in meetings they're part of" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    participant_id IN (
      SELECT id FROM public.participants 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Create RLS policies for attendance records
CREATE POLICY "Users can view attendance records in meetings they're part of" 
  ON public.attendance_records 
  FOR SELECT 
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings WHERE host_id = auth.uid()
    ) OR
    participant_id IN (
      SELECT id FROM public.participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage attendance records" 
  ON public.attendance_records 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
