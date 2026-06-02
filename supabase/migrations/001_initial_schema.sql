-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'principal_architect', 'architect', 'staff_engineer');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed');
CREATE TYPE phase_status AS ENUM ('pending', 'active', 'completed');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE project_member_role AS ENUM ('lead', 'member');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'deadline_soon', 'status_changed');

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'architect',
  is_active boolean NOT NULL DEFAULT true,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  organization text NOT NULL,
  address text,
  city text,
  state text,
  pin_code text,
  phone text,
  email text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  client_id uuid REFERENCES public.clients(id),
  city text,
  state text,
  pin_code text,
  status project_status NOT NULL DEFAULT 'planning',
  start_date date,
  deadline date,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Project members
CREATE TABLE public.project_members (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role_in_project project_member_role NOT NULL DEFAULT 'member',
  PRIMARY KEY (project_id, user_id)
);

-- Phases
CREATE TABLE public.phases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  order_index integer NOT NULL DEFAULT 0,
  status phase_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id uuid NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES public.users(id),
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  due_date date,
  completed_at timestamptz,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- Helper function (avoids RLS recursion when checking role)
-- =====================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- =====================
-- Trigger: auto-create users row when auth user is created
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'architect')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================
-- RLS Policies
-- =====================

-- USERS table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_full_access_users" ON public.users
  FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- CLIENTS table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_full_access_clients" ON public.clients
  FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "principal_architects_read_clients" ON public.clients
  FOR SELECT USING (public.get_my_role() = 'principal_architect');

-- PROJECTS table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_full_access_projects" ON public.projects
  FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "members_read_projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "principal_architects_manage_projects" ON public.projects
  FOR ALL USING (
    public.get_my_role() = 'principal_architect'
    AND EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

-- PROJECT_MEMBERS table
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_full_access_members" ON public.project_members
  FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "members_read_own_memberships" ON public.project_members
  FOR SELECT USING (user_id = auth.uid());

-- PHASES table
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phases_readable_by_project_members" ON public.phases
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = phases.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "phases_writable_by_admin_and_lead" ON public.phases
  FOR ALL USING (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = phases.project_id
        AND user_id = auth.uid()
        AND role_in_project = 'lead'
    )
  );

-- TASKS table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_readable_by_project_members" ON public.tasks
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.phases ph
      JOIN public.project_members pm ON pm.project_id = ph.project_id
      WHERE ph.id = tasks.phase_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_writable_by_assigned_or_lead" ON public.tasks
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.phases ph
      JOIN public.project_members pm ON pm.project_id = ph.project_id
      WHERE ph.id = tasks.phase_id
        AND pm.user_id = auth.uid()
        AND pm.role_in_project = 'lead'
    )
  );

CREATE POLICY "tasks_insert_by_lead_or_admin" ON public.tasks
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.phases ph
      JOIN public.project_members pm ON pm.project_id = ph.project_id
      WHERE ph.id = tasks.phase_id
        AND pm.user_id = auth.uid()
        AND pm.role_in_project = 'lead'
    )
  );

-- COMMENTS table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_readable_by_project_members" ON public.comments
  FOR SELECT USING (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.phases ph ON ph.id = t.phase_id
      JOIN public.project_members pm ON pm.project_id = ph.project_id
      WHERE t.id = comments.task_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- NOTIFICATIONS table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own_only" ON public.notifications
  FOR ALL USING (user_id = auth.uid());
