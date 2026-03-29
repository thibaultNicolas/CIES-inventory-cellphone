-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models table (unique devices)
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, slug)
);

-- Prices table (condition + memory variants)
CREATE TABLE IF NOT EXISTS prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  condition TEXT NOT NULL,
  memory TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(model_id, condition, memory)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_models_brand_id ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_prices_model_id ON prices(model_id);

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access for brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access for models" ON models FOR SELECT USING (true);
CREATE POLICY "Public read access for prices" ON prices FOR SELECT USING (true);

-- Create storage bucket for device images
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-images', 'device-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for storage
CREATE POLICY "Public read access for device images" ON storage.objects
FOR SELECT USING (bucket_id = 'device-images');

-- Service role upload access
CREATE POLICY "Service role upload for device images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'device-images');
