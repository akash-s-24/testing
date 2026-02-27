-- Create Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_anonymous_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Posts Table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  alias TEXT,
  emotion TEXT NOT NULL,
  category TEXT NOT NULL,
  hug_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Comments Table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Reactions Table
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('hug', 'relate', 'cheer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id, type)
);

-- Create Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Saved Posts Table
CREATE TABLE saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Note: We will use permissive RLS policies for now to simplify hackathon development,
-- since we can have public posts.
CREATE POLICY "Public Profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts." ON posts FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own posts." ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts." ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone." ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments." ON comments FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Reactions are viewable by everyone." ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reactions." ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can see own notifications." ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create notifications for others." ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications." ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can see own saved posts." ON saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts." ON saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved posts." ON saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Insert Seed Data (Anonymous posts without real user_id)
INSERT INTO posts (title, content, alias, emotion, category, hug_count) VALUES
('Feeling a bit overwhelmed with work today', 'I''ve been staring at the same screen for 6 hours. Just need a moment to breathe and realize it''s okay to step away for a bit. The deadlines feel heavy.', 'AmberWave33', 'Frustrated', 'Work', 24),
('Finally found peace in the morning rain', 'Sat by the window with a warm mug of chamomile. The world outside is gray but my heart feels light for the first time this week.', 'LavenderSky09', 'Calm', 'Health', 56),
('Missing someone I shouldn''t', 'Saw a photo of the old park we used to visit. It''s funny how a simple image can trigger a whole day of longing. Anyone else feeling nostalgic?', 'BlueBird21', 'Melancholy', 'Relationships', 102),
('Got rejected but I''m choosing to see it differently', 'Failed my third interview this month. But I''m still here. Still trying. Something better is coming — I have to believe that.', 'GoldenMist44', 'Hopeful', 'College', 87),
('Family pressure is crushing me silently', 'Everyone expects so much and I smile and nod. But inside I''m screaming. Does anyone else carry this invisible weight?', 'CrimsonLeaf17', 'Anxious', 'Family', 143);
