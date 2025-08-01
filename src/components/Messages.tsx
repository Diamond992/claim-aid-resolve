import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  message_type: string;
  sender_id: string;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface MessagesProps {
  dossierId: string;
}

export const Messages = ({ dossierId }: MessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_profile: null
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          dossier_id: dossierId,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'user'
        })
        .select('*')
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, {
        ...data,
        sender_profile: null
      }]);
      setNewMessage('');
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [dossierId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageSenderName = (message: Message) => {
    if (message.message_type === 'system') return 'Système';
    if (message.message_type === 'expert') return 'Expert';
    if (message.sender_id === user?.id) return 'Vous';
    return message.sender_profile 
      ? `${message.sender_profile.first_name} ${message.sender_profile.last_name}`
      : 'Utilisateur';
  };

  const getMessageVariant = (message: Message) => {
    if (message.sender_id === user?.id) return 'user';
    if (message.message_type === 'expert') return 'expert';
    return 'system';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucun message pour le moment. Commencez la conversation !
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.sender_id === user?.id;
                const variant = getMessageVariant(message);
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`
                          ${variant === 'expert' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                        `}>
                          {variant === 'expert' ? 'E' : 'S'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
                      <div className={`rounded-lg p-3 ${
                        isUser 
                          ? 'bg-primary text-primary-foreground' 
                          : variant === 'expert'
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <div className="text-xs opacity-70 mb-1">
                          {getMessageSenderName(message)}
                        </div>
                        <div className="text-sm">{message.content}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 px-3">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </div>
                    </div>
                    
                    {isUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          V
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isSending || !newMessage.trim()}
            size="icon"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};