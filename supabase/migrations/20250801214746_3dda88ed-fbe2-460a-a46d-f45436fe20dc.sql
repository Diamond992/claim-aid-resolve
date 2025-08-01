-- Create messages table for user-expert communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'expert', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages from accessible dossiers" 
ON public.messages 
FOR SELECT 
USING (can_access_dossier(dossier_id, auth.uid()));

CREATE POLICY "Users can send messages to accessible dossiers" 
ON public.messages 
FOR INSERT 
WITH CHECK (can_access_dossier(dossier_id, auth.uid()) AND auth.uid() = sender_id);

CREATE POLICY "Admins can manage all messages" 
ON public.messages 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();