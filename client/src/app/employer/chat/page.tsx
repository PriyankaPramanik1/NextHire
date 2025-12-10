"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { useSocket } from "@/context/SocketContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Badge,
  InputAdornment,
  LinearProgress,
  ListItemButton,
} from "@mui/material";
import {
  Send,
  Search,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Videocam,
  Phone,
  ArrowBack,
} from "@mui/icons-material";
import { Grid, styled } from "@mui/system";
import Swal from "sweetalert2";

const ChatContainer = styled(Box)({
  height: "calc(100vh - 200px)",
  display: "flex",
  flexDirection: "column",
});

const MessageBubble = styled(Box)(({ isOwn }: { isOwn: boolean }) => ({
  maxWidth: "70%",
  padding: "12px 16px",
  borderRadius: "18px",
  backgroundColor: isOwn ? "#667eea" : "#f1f5f9",
  color: isOwn ? "white" : "inherit",
  alignSelf: isOwn ? "flex-end" : "flex-start",
  marginBottom: "8px",
  wordBreak: "break-word",
}));

export default function EmployerChat() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (socket) {
      socket.on("receive_message", (message: any) => {
        if (
          selectedConversation &&
          message.sender === selectedConversation.user._id
        ) {
          setMessages((prev) => [...prev, message]);
          markAsRead(message._id);
        }
        updateConversationList(message);
      });

      socket.on("new_message_notification", (notification: any) => {
        Swal.fire({
          title: "New Message",
          text: notification.message,
          icon: "info",
          toast: true,
          position: "top-right",
          showConfirmButton: false,
          timer: 3000,
        });
      });

      return () => {
        socket.off("receive_message");
        socket.off("new_message_notification");
      };
    }
  }, [socket, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get("/chat/conversations");
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await axios.get(`/chat/messages/${userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const updateConversationList = (message: any) => {
    setConversations((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(
        (conv) =>
          conv.user._id === message.sender ||
          conv.user._id === message.recipient
      );

      if (index !== -1) {
        updated[index] = {
          ...updated[index],
          lastMessage: message,
          unreadCount:
            message.sender !== selectedConversation?.user._id
              ? (updated[index].unreadCount || 0) + 1
              : 0,
        };
        // Move to top
        const [moved] = updated.splice(index, 1);
        updated.unshift(moved);
      }

      return updated;
    });
  };

  const markAsRead = async (messageId: string) => {
    try {
      await axios.put(`/chat/messages/${messageId}/read`);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        recipient: selectedConversation.user._id,
        content: newMessage.trim(),
      };

      if (socket && isConnected) {
        socket.emit("send_message", messageData);
      }

      const response = await axios.post("/chat/send", messageData);

      // Add to local messages
      setMessages((prev) => [...prev, response.data.message]);
      setNewMessage("");

      // Update conversation list
      updateConversationList(response.data.message);
    } catch (error) {
      console.error("Error sending message:", error);
      Swal.fire("Error!", "Failed to send message.", "error");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("recipient", selectedConversation.user._id);

      const response = await axios.post("/chat/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages((prev) => [...prev, response.data.message]);
      updateConversationList(response.data.message);
    } catch (error) {
      Swal.fire("Error!", "Failed to upload file.", "error");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.content
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <LinearProgress sx={{ width: "50%", height: 8, borderRadius: 4 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" mb={3}>
        Messages
      </Typography>

      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "calc(100vh - 200px)" }}>
            <CardContent>
              {/* Search */}
              <TextField
                fullWidth
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Conversations */}
              <List sx={{ overflow: "auto", maxHeight: "calc(100vh - 300px)" }}>
                {filteredConversations.map((conversation) => (
                  <ListItemButton
                    key={conversation.user._id}
                    selected={
                      selectedConversation?.user._id === conversation.user._id
                    }
                    onClick={() => setSelectedConversation(conversation)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      "&.Mui-selected": {
                        backgroundColor: "#667eea15",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={conversation.unreadCount}
                        color="error"
                        invisible={!conversation.unreadCount}
                      >
                        <Avatar
                          src={conversation.user.profile?.profilePicture?.url}
                        >
                          {conversation.user.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={conversation.user.name}
                      secondary={
                        conversation.lastMessage?.content || "No messages yet"
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedConversation ? (
            <Card sx={{ height: "calc(100vh - 200px)" }}>
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Chat Header */}
                <Box
                  display="flex"
                  alignItems="center"
                  mb={2}
                  pb={2}
                  borderBottom={1}
                  borderColor="divider"
                >
                  <IconButton
                    onClick={() => setSelectedConversation(null)}
                    sx={{ mr: 2, display: { md: "none" } }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Avatar
                    src={selectedConversation.user.profile?.profilePicture?.url}
                    sx={{ mr: 2 }}
                  >
                    {selectedConversation.user.name.charAt(0)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="600">
                      {selectedConversation.user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedConversation.user.profile?.title || "Job Seeker"}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton>
                      <Phone />
                    </IconButton>
                    <IconButton>
                      <Videocam />
                    </IconButton>
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>

                {/* Messages */}
                <Box flexGrow={1} overflow="auto" p={2}>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message._id}
                      isOwn={
                        message.sender?._id !== selectedConversation.user._id
                      }
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.8, display: "block", mt: 0.5 }}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {message.read && " ✓✓"}
                      </Typography>
                    </MessageBubble>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                  <Box display="flex" gap={1}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <IconButton onClick={() => fileInputRef.current?.click()}>
                      <AttachFile />
                    </IconButton>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendMessage()
                      }
                      multiline
                      maxRows={3}
                    />
                    <IconButton>
                      <EmojiEmotions />
                    </IconButton>
                    <Button
                      variant="contained"
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      sx={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        minWidth: "auto",
                        px: 3,
                      }}
                    >
                      <Send />
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card
              sx={{
                height: "calc(100vh - 200px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a conversation to start chatting
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a conversation from the list to view messages
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
