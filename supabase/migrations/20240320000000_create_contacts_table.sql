-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS contacts_whatsapp_idx ON contacts(whatsapp);
CREATE INDEX IF NOT EXISTS contacts_name_idx ON contacts(name);
CREATE INDEX IF NOT EXISTS contacts_tags_idx ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS contacts_created_by_idx ON contacts(created_by);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 