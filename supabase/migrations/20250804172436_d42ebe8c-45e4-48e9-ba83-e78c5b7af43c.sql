-- Disable Row Level Security on documents table
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on documents table
DROP POLICY IF EXISTS "Admin can manage all documents" ON public.documents;
DROP POLICY IF EXISTS "Admin can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Ultra simple document delete" ON public.documents;
DROP POLICY IF EXISTS "Ultra simple document insert" ON public.documents;
DROP POLICY IF EXISTS "Ultra simple document select" ON public.documents;
DROP POLICY IF EXISTS "Ultra simple document update" ON public.documents;