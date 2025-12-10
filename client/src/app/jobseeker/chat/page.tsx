'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import { Send, Person } from '@mui/icons-material';
import { styled } from '@mui/system';
import axios from '@/lib/axios';

const ChatContainer = styled(Paper)({
  height: '70vh',
  display: 'flex',
  flexDirection: 'column',
});

const MessagesContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '1rem',
});

const MessageBubble = styled(Box)(({ isOwn }: { isOwn: boolean }) => ({
  maxWidth: '70%',
  marginBottom: '1rem',
  marginLeft: isOwn ? 'auto' : '0',
  marginRight: isOwn ? '0' : 'auto',
}));

const MessageContent = styled(Paper)(({ isOwn }: { isOwn: boolean }) => ({
  padding: '0.75rem 1rem',
  backgroundColor: isOwn ? '#667eea' : '#f5f5f5',
  color: isOwn ? 'white' : 'inherit',
}));

interface Conversation {
  user: {
    _id: string;
    name: string;
    profilePicture?: {
      url: string;
    };
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: {
      url: string;
    };
  };
  recipient: {
    _id: string;
    name: string;
    profilePicture?: {
      url: string;
    };
  };
  content: string;
  createdAt: string;
  read: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation && socket) {
      // Join the chat room
      socket.emit('join_chat', { recipientId: selectedConversation.user._id });

      // Fetch messages for this conversation
      fetchMessages(selectedConversation.user._id);

      // Mark messages as read
      socket.emit('mark_messages_read', { senderId: selectedConversation.user._id });
    }
  }, [selectedConversation, socket]);

  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('receive_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);

      return () => {
        socket.off('receive_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (recipientId: string) => {
    try {
      const response = await axios.get(`/chat/messages/${recipientId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Update conversations list
    setConversations(prev => 
      prev.map(conv => 
        conv.user._id === message.sender._id 
          ? { 
              ...conv, 
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                sender: message.sender._id
              },
              unreadCount: message.sender._id === selectedConversation?.user._id ? 0 : conv.unreadCount + 1
            } 
          : conv
      )
    );
  };

  const handleMessagesRead = (data: { readerId: string }) => {
    // Update read status for messages
    setMessages(prev =>
      prev.map(msg =>
        msg.sender._id === data.readerId ? { ...msg, read: true } : msg
      )
    );
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    const messageData = {
      recipientId: selectedConversation.user._id,
      content: newMessage.trim(),
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Connect with employers and discuss opportunities
      </Typography>

      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid size={{xs:12, md:4}} >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversations
              </Typography>
              <List>
                {conversations.map((conversation) => (
                  <ListItem
                    key={conversation.user._id}
                    button
                    selected={selectedConversation?.user._id === conversation.user._id}
                    onClick={() => setSelectedConversation(conversation)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: '#667eea',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#5a6fd8',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={conversation.user.profilePicture?.url}
                        sx={{
                          bgcolor: conversation.user.role === 'employer' ? '#ff6b35' : '#667eea',
                        }}
                      >
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">
                            {conversation.user.name}
                          </Typography>
                          {conversation.unreadCount > 0 && (
                            <Chip
                              label={conversation.unreadCount}
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conversation.lastMessage.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid size={{xs:12, md:8}} >
          <ChatContainer>
            {selectedConversation ? (
              <>
                <Box
                  sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <Typography variant="h6">
                    {selectedConversation.user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedConversation.user.role}
                  </Typography>
                </Box>

                <MessagesContainer>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message._id}
                      isOwn={message.sender._id === user?.id}
                    >
                      <MessageContent isOwn={message.sender._id === user?.id}>
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.8,
                          }}
                        >
                          {formatTime(message.createdAt)}
                        </Typography>
                      </MessageContent>
                    </MessageBubble>
                  ))}
                  <div ref={messagesEndRef} />
                </MessagesContainer>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={3}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!isConnected}
                    />
                    <Button
                      variant="contained"
                      endIcon={<Send />}
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                      sx={{ minWidth: '100px' }}
                    >
                      Send
                    </Button>
                  </Box>
                  {!isConnected && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Connection lost. Reconnecting...
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                flexDirection="column"
              >
                <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            )}
          </ChatContainer>
        </Grid>
      </Grid>
    </Container>
  );
}