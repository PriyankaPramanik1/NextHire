import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import axios from '@/lib/axios';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profile?: { profilePicture?: { url: string } };
  };
  recipient: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  user: {
    _id: string;
    name: string;
    profile?: { 
      profilePicture?: { url: string };
      title?: string;
    };
  };
  lastMessage: Message;
  unreadCount: number;
}

export const useChat = () => {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/chat/conversations');
      setConversations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/chat/messages/${userId}`);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (recipientId: string, content: string) => {
    try {
      const messageData = {
        recipient: recipientId,
        content: content.trim(),
      };

      // Emit socket event if connected
      if (socket && isConnected) {
        socket.emit('send_message', messageData);
      }

      const response = await axios.post('/chat/send', messageData);
      
      // Add to messages
      setMessages(prev => [...prev, response.data.message]);
      
      // Update conversations
      setConversations(prev => {
        const updated = [...prev];
        const index = updated.findIndex(conv => conv.user._id === recipientId);
        
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            lastMessage: response.data.message,
            unreadCount: 0,
          };
          // Move to top
          const [moved] = updated.splice(index, 1);
          updated.unshift(moved);
        }
        
        return updated;
      });

      return response.data.message;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    }
  }, [socket, isConnected]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await axios.put(`/chat/messages/${messageId}/read`);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (err: any) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  const uploadFile = useCallback(async (recipientId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('recipient', recipientId);

      const response = await axios.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Add to messages
      setMessages(prev => [...prev, response.data.message]);
      
      // Update conversations
      setConversations(prev => {
        const updated = [...prev];
        const index = updated.findIndex(conv => conv.user._id === recipientId);
        
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            lastMessage: response.data.message,
          };
          // Move to top
          const [moved] = updated.splice(index, 1);
          updated.unshift(moved);
        }
        
        return updated;
      });

      return response.data.message;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
      throw err;
    }
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
        
        // Update conversations
        setConversations(prev => {
          const updated = [...prev];
          const senderId = message.sender._id;
          const index = updated.findIndex(conv => conv.user._id === senderId);
          
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              lastMessage: message,
              unreadCount: updated[index].unreadCount + 1,
            };
            // Move to top
            const [moved] = updated.splice(index, 1);
            updated.unshift(moved);
          }
          
          return updated;
        });
      };

      socket.on('receive_message', handleReceiveMessage);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [socket]);

  return {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    uploadFile,
    isConnected,
  };
};