-- Interview Tracking and Scoring Database Schema

-- Table for tracking all interview events
CREATE TABLE IF NOT EXISTS "InterviewTracking" (
  id SERIAL PRIMARY KEY,
  interview_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('eye_tracking', 'tab_switch', 'answer_recorded', 'focus_change')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing interview scoring results
CREATE TABLE IF NOT EXISTS "InterviewScoring" (
  id SERIAL PRIMARY KEY,
  interview_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  focus_score DECIMAL(5,4) NOT NULL CHECK (focus_score >= 0 AND focus_score <= 1),
  answer_score DECIMAL(5,4) NOT NULL CHECK (answer_score >= 0 AND answer_score <= 1),
  final_score DECIMAL(5,4) NOT NULL CHECK (final_score >= 0 AND final_score <= 1),
  focus_weight DECIMAL(3,2) NOT NULL DEFAULT 0.4,
  answer_weight DECIMAL(3,2) NOT NULL DEFAULT 0.6,
  focus_metrics JSONB NOT NULL DEFAULT '{}',
  answers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing detailed answer analysis
CREATE TABLE IF NOT EXISTS "AnswerAnalysis" (
  id SERIAL PRIMARY KEY,
  interview_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  question_id TEXT,
  question_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  technical_score DECIMAL(3,2) CHECK (technical_score >= 0 AND technical_score <= 1),
  clarity_score DECIMAL(3,2) CHECK (clarity_score >= 0 AND clarity_score <= 1),
  overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing focus session data
CREATE TABLE IF NOT EXISTS "FocusSessions" (
  id SERIAL PRIMARY KEY,
  interview_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER NOT NULL, -- in seconds
  focus_percentage DECIMAL(5,2) CHECK (focus_percentage >= 0 AND focus_percentage <= 100),
  distractions_count INTEGER DEFAULT 0,
  tab_switches_count INTEGER DEFAULT 0,
  eye_movement_score DECIMAL(5,4) CHECK (eye_movement_score >= 0 AND eye_movement_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_tracking_interview_id ON "InterviewTracking"(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_tracking_candidate_id ON "InterviewTracking"(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_tracking_event_type ON "InterviewTracking"(event_type);
CREATE INDEX IF NOT EXISTS idx_interview_tracking_timestamp ON "InterviewTracking"(timestamp);

CREATE INDEX IF NOT EXISTS idx_interview_scoring_interview_id ON "InterviewScoring"(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_scoring_candidate_id ON "InterviewScoring"(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_scoring_final_score ON "InterviewScoring"(final_score);

CREATE INDEX IF NOT EXISTS idx_answer_analysis_interview_id ON "AnswerAnalysis"(interview_id);
CREATE INDEX IF NOT EXISTS idx_answer_analysis_candidate_id ON "AnswerAnalysis"(candidate_id);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_interview_id ON "FocusSessions"(interview_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_candidate_id ON "FocusSessions"(candidate_id);

-- Views for common queries

-- View for interview summary with tracking data
CREATE OR REPLACE VIEW "InterviewSummary" AS
SELECT 
  i.id as interview_id,
  i.job_position,
  i.type,
  i.duration,
  i.created_at as interview_created,
  s.final_score,
  s.focus_score,
  s.answer_score,
  s.created_at as scored_at,
  COUNT(t.id) as total_tracking_events,
  COUNT(CASE WHEN t.event_type = 'eye_tracking' THEN 1 END) as eye_tracking_events,
  COUNT(CASE WHEN t.event_type = 'tab_switch' THEN 1 END) as tab_switch_events,
  COUNT(CASE WHEN t.event_type = 'answer_recorded' THEN 1 END) as answer_events
FROM "Interview" i
LEFT JOIN "InterviewScoring" s ON i.interview_id = s.interview_id
LEFT JOIN "InterviewTracking" t ON i.interview_id = t.interview_id
GROUP BY i.id, i.job_position, i.type, i.duration, i.created_at, s.final_score, s.focus_score, s.answer_score, s.created_at;

-- View for candidate performance analysis
CREATE OR REPLACE VIEW "CandidatePerformance" AS
SELECT 
  s.candidate_id,
  s.interview_id,
  s.final_score,
  s.focus_score,
  s.answer_score,
  s.focus_weight,
  s.answer_weight,
  (s.focus_weight * s.focus_score) as focus_contribution,
  (s.answer_weight * s.answer_score) as answer_contribution,
  s.created_at as scored_at,
  COUNT(a.id) as total_answers,
  AVG(a.overall_score) as average_answer_score,
  AVG(a.relevance_score) as average_relevance,
  AVG(a.technical_score) as average_technical,
  AVG(a.clarity_score) as average_clarity
FROM "InterviewScoring" s
LEFT JOIN "AnswerAnalysis" a ON s.interview_id = a.interview_id AND s.candidate_id = a.candidate_id
GROUP BY s.candidate_id, s.interview_id, s.final_score, s.focus_score, s.answer_score, s.focus_weight, s.answer_weight, s.created_at;

-- Functions for common operations

-- Function to calculate focus score from tracking data
CREATE OR REPLACE FUNCTION calculate_focus_score(
  p_interview_id TEXT,
  p_candidate_id TEXT,
  p_time_range_minutes INTEGER DEFAULT 5
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
  v_focus_score DECIMAL(5,4) := 0;
  v_total_events INTEGER := 0;
  v_distraction_events INTEGER := 0;
  v_tab_switches INTEGER := 0;
BEGIN
  -- Count total events in time range
  SELECT COUNT(*) INTO v_total_events
  FROM "InterviewTracking"
  WHERE interview_id = p_interview_id
    AND candidate_id = p_candidate_id
    AND timestamp >= NOW() - INTERVAL '1 minute' * p_time_range_minutes;
  
  -- Count distraction events
  SELECT COUNT(*) INTO v_distraction_events
  FROM "InterviewTracking"
  WHERE interview_id = p_interview_id
    AND candidate_id = p_candidate_id
    AND event_type = 'eye_tracking'
    AND timestamp >= NOW() - INTERVAL '1 minute' * p_time_range_minutes
    AND data->>'processed'->>'isOnScreen' = 'false';
  
  -- Count tab switches
  SELECT COUNT(*) INTO v_tab_switches
  FROM "InterviewTracking"
  WHERE interview_id = p_interview_id
    AND candidate_id = p_candidate_id
    AND event_type = 'tab_switch'
    AND timestamp >= NOW() - INTERVAL '1 minute' * p_time_range_minutes
    AND data->>'processed'->>'isDistraction' = 'true';
  
  -- Calculate focus score (0-1, higher is better)
  IF v_total_events > 0 THEN
    v_focus_score := GREATEST(0, 1 - ((v_distraction_events + v_tab_switches)::DECIMAL / v_total_events));
  END IF;
  
  RETURN v_focus_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get interview statistics
CREATE OR REPLACE FUNCTION get_interview_stats(
  p_interview_id TEXT
)
RETURNS TABLE(
  total_candidates INTEGER,
  average_final_score DECIMAL(5,4),
  average_focus_score DECIMAL(5,4),
  average_answer_score DECIMAL(5,4),
  total_tracking_events BIGINT,
  total_answers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT s.candidate_id)::INTEGER as total_candidates,
    AVG(s.final_score) as average_final_score,
    AVG(s.focus_score) as average_focus_score,
    AVG(s.answer_score) as average_answer_score,
    COUNT(t.id) as total_tracking_events,
    COUNT(a.id) as total_answers
  FROM "InterviewScoring" s
  LEFT JOIN "InterviewTracking" t ON s.interview_id = t.interview_id
  LEFT JOIN "AnswerAnalysis" a ON s.interview_id = a.interview_id
  WHERE s.interview_id = p_interview_id
  GROUP BY s.interview_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updates

-- Trigger to update focus metrics when tracking data is inserted
CREATE OR REPLACE FUNCTION update_focus_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update focus sessions table when new tracking data is added
  IF NEW.event_type IN ('eye_tracking', 'tab_switch') THEN
    -- Insert or update focus session
    INSERT INTO "FocusSessions" (
      interview_id, 
      candidate_id, 
      session_start, 
      total_duration,
      focus_percentage
    ) VALUES (
      NEW.interview_id,
      NEW.candidate_id,
      NEW.timestamp,
      0,
      100
    )
    ON CONFLICT (interview_id, candidate_id) 
    DO UPDATE SET
      session_end = NEW.timestamp,
      total_duration = EXTRACT(EPOCH FROM (NEW.timestamp - session_start)),
      focus_percentage = CASE 
        WHEN NEW.event_type = 'tab_switch' AND NEW.data->>'processed'->>'isDistraction' = 'true'
        THEN GREATEST(0, focus_percentage - 5)
        ELSE focus_percentage
      END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_focus_metrics
  AFTER INSERT ON "InterviewTracking"
  FOR EACH ROW
  EXECUTE FUNCTION update_focus_metrics();

-- Comments for documentation
COMMENT ON TABLE "InterviewTracking" IS 'Stores all interview tracking events including eye movement, tab switches, and focus changes';
COMMENT ON TABLE "InterviewScoring" IS 'Stores calculated interview scores based on focus metrics and answer quality';
COMMENT ON TABLE "AnswerAnalysis" IS 'Stores detailed analysis of candidate answers with AI-generated scores';
COMMENT ON TABLE "FocusSessions" IS 'Stores focus session data for tracking candidate attention during interviews';

COMMENT ON FUNCTION calculate_focus_score IS 'Calculates focus score based on tracking data within specified time range';
COMMENT ON FUNCTION get_interview_stats IS 'Returns comprehensive statistics for a specific interview';
