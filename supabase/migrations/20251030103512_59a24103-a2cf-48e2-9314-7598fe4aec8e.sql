-- Create enum for worker roles
CREATE TYPE public.worker_role AS ENUM ('cleaner', 'checker');

-- Create enum for room types
CREATE TYPE public.room_type AS ENUM ('standard', 'suite', 'type1', 'type2', 'type3');

-- Create enum for leave types
CREATE TYPE public.leave_type AS ENUM ('sick', 'holiday', 'other');

-- Create enum for leave status
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table for worker information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role worker_role NOT NULL DEFAULT 'cleaner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create time entries table for attendance tracking
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(5,2),
  qr_scan_in TEXT,
  qr_scan_out TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time entries"
  ON public.time_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Create rooms cleaned table
CREATE TABLE public.rooms_cleaned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_type room_type NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.rooms_cleaned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rooms cleaned"
  ON public.rooms_cleaned FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rooms cleaned"
  ON public.rooms_cleaned FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rooms cleaned"
  ON public.rooms_cleaned FOR UPDATE
  USING (auth.uid() = user_id);

-- Create schedules table
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = user_id);

-- Create leaves table
CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leaves"
  ON public.leaves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leaves"
  ON public.leaves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaves"
  ON public.leaves FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for leave documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('leave-documents', 'leave-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for leave documents
CREATE POLICY "Users can upload their own leave documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'leave-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own leave documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'leave-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at
  BEFORE UPDATE ON public.leaves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Worker'),
    COALESCE((NEW.raw_user_meta_data->>'role')::worker_role, 'cleaner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();