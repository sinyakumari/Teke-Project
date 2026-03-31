-- Create worksheets table
CREATE TABLE IF NOT EXISTS worksheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create worksheet_questions table
CREATE TABLE IF NOT EXISTS worksheet_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_worksheets_training_id ON worksheets(training_id);
CREATE INDEX IF NOT EXISTS idx_worksheets_lesson_id ON worksheets(lesson_id);
CREATE INDEX IF NOT EXISTS idx_worksheet_questions_worksheet_id ON worksheet_questions(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_worksheet_questions_order ON worksheet_questions(worksheet_id, "order");

-- Update the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_worksheets_updated_at 
    BEFORE UPDATE ON worksheets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worksheet_questions_updated_at 
    BEFORE UPDATE ON worksheet_questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
