import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Badge,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Chat,
  Close,
  Send,
  Visibility as VisibilityIcon,
  KeyboardArrowDown,
  AttachFile,
} from "@mui/icons-material";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import "../styles/ChatComponent.css";

const ChatComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000;
  const messagesEndRef = useRef(null);
  const pendingMarkRead = useRef([]);
  const fileInputRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const isConnecting = useRef(false);

  const publicPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicPage = publicPages.includes(window.location.pathname);

  useEffect(() => {
    if (isPublicPage) {
      console.log(
        "Skipping user fetch on public page:",
        window.location.pathname
      );
      return;
    }

    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      console.log("No token found, redirecting to login");
      setError("Please log in to continue.");
      window.location.href = "/login";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000;
      if (Date.now() > exp) {
        console.log("Token expired, redirecting to login");
        setError("Session expired. Please log in again.");
        localStorage.removeItem(ACCESS_TOKEN);
        window.location.href = "/login";
        return;
      }
    } catch (e) {
      console.error("Invalid token format:", e);
      setError("Invalid session. Please log in again.");
      localStorage.removeItem(ACCESS_TOKEN);
      window.location.href = "/login";
      return;
    }

    api
      .get("/api/users/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("User fetched:", res.data);
        setUser({
          username: res.data.username,
          role: res.data.role,
          senderType:
            res.data.role === "proposal_engineer" ? "agent" : "client",
        });
      })
      .catch((err) => {
        console.error("User fetch failed:", err);
        setError("Session expired or invalid. Please log in again.");
        localStorage.removeItem(ACCESS_TOKEN);
        window.location.href = "/login";
      });
  }, [isPublicPage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const connectWebSocket = () => {
    if (
      !user ||
      ws.current?.readyState === WebSocket.OPEN ||
      isPublicPage ||
      isConnecting.current
    ) {
      if (isPublicPage)
        console.log(
          "Skipping WebSocket connection on public page:",
          window.location.pathname
        );
      if (isConnecting.current)
        console.log("WebSocket connection already in progress");
      return;
    }

    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      console.log("No token for WebSocket, skipping connection");
      return;
    }

    isConnecting.current = true;
    console.log("Environment variables:", {
      VITE_WS_URL: import.meta.env.VITE_WS_URL,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      DEV: import.meta.env.DEV,
    });
    const baseWSUrl =
      import.meta.env.VITE_WS_URL || "wss://instrugate-system.onrender.com";
    const socketUrl = `${baseWSUrl}/ws/chat/${
      user.username
    }/?token=${encodeURIComponent(token)}`;
    console.log("Connecting to WebSocket:", socketUrl);
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected to:", socketUrl);
      setWsConnected(true);
      isConnecting.current = false;
      reconnectAttempts.current = 0;
      setError("");
      pendingMarkRead.current.forEach((payload) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          try {
            ws.current.send(JSON.stringify(payload));
            console.log("Retried mark_read:", payload);
          } catch (e) {
            console.error("Failed to retry mark_read:", e);
            pendingMarkRead.current.push(payload);
          }
        } else {
          console.log("WebSocket not open, re-queuing mark_read:", payload);
          pendingMarkRead.current.push(payload);
        }
      });
      pendingMarkRead.current = [];
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message:", data);
        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.type === "read_confirmation") {
          const { message_ids, client } = data;
          const key = user.senderType === "client" ? user.username : client;
          setMessages((prev) => {
            const existingMessages = prev[key] || [];
            return {
              ...prev,
              [key]: existingMessages.map((msg) =>
                message_ids.includes(msg.messageId)
                  ? { ...msg, isRead: true }
                  : msg
              ),
            };
          });
          return;
        }

        if (
          (!data.message && !(data.file_url && data.file_name)) ||
          !data.sender_type ||
          !data.client
        ) {
          console.log("Invalid message format:", data);
          return;
        }

        const {
          message,
          sender,
          sender_type,
          client,
          is_read,
          timestamp,
          message_id,
          file_url,
          file_name,
        } = data;
        const key = user.senderType === "client" ? user.username : client;

        console.log("Processed message:", {
          message,
          sender,
          sender_type,
          client,
          is_read,
          timestamp,
          message_id,
          file_url,
          file_name,
        });

        if (sender_type === "system") {
          let modifiedMessage = message;

          if (message.includes("disconnected")) {
            console.log(`Processing system disconnect message for ${client}`);
            if (user.senderType === "agent") {
              setClients((prev) => prev.filter((c) => c !== client));
              setMessages((prev) => {
                const newMessages = { ...prev };
                delete newMessages[client];
                return newMessages;
              });
              setUnreadMessages((prev) => {
                const newUnread = { ...prev };
                delete newUnread[client];
                return newUnread;
              });
              if (selectedClient === client) setSelectedClient(null);
            }
            return;
          }

          if (
            message.includes("is with") ||
            message.includes("already assisting")
          ) {
            const matchWith = message.match(/(\w+) is with (\w+)/);
            const matchAssisting = message.match(
              /(\w+) already assisting (\w+)/
            );
            const match = matchWith || matchAssisting;
            if (match) {
              const [, clientName, engineer] = match;
              if (
                user.senderType === "agent" &&
                clientName &&
                engineer !== user.username
              ) {
                setClients((prev) => prev.filter((c) => c !== clientName));
                if (selectedClient === clientName) setSelectedClient(null);
                setUnreadMessages((prev) => {
                  const newUnread = { ...prev };
                  delete newUnread[clientName];
                  return newUnread;
                });
                setError(
                  `Client ${clientName} is being assisted by ${engineer}.`
                );
                return;
              }
              if (
                user.senderType === "client" &&
                clientName === user.username
              ) {
                modifiedMessage = `Engineer ${engineer} is assisting you`;
              }
            }
          }

          if (message.includes("is available")) {
            const match = message.match(/(\w+) is available/);
            if (match && user.senderType === "agent") {
              const [, clientName] = match;
              setClients((prev) => [...new Set([...prev, clientName])]);
            }
          }

          setMessages((prev) => {
            const existingMessages = prev[key] || [];
            const messageExists = existingMessages.some(
              (msg) => msg.messageId === message_id
            );

            if (messageExists) {
              return {
                ...prev,
                [key]: existingMessages.map((msg) =>
                  msg.messageId === message_id
                    ? { ...msg, isRead: is_read ?? false }
                    : msg
                ),
              };
            }

            const newMessage = {
              text: modifiedMessage,
              from: sender,
              senderType: sender_type,
              client,
              timestamp: timestamp || new Date().toISOString(),
              isRead: is_read ?? false,
              messageId: message_id,
              fileUrl: file_url, // Use raw file_url
              fileName: file_name,
            };
            return {
              ...prev,
              [key]: [...existingMessages, newMessage],
            };
          });
        } else {
          if (processedMessageIds.current.has(message_id)) {
            console.log("Skipping duplicate message_id:", message_id);
            return;
          }
          processedMessageIds.current.add(message_id);

          setMessages((prev) => {
            const existingMessages = prev[key] || [];
            const messageExists = existingMessages.some(
              (msg) => msg.messageId === message_id
            );

            if (messageExists) {
              return {
                ...prev,
                [key]: existingMessages.map((msg) =>
                  msg.messageId === message_id
                    ? { ...msg, isRead: is_read ?? false }
                    : msg
                ),
              };
            }

            const newMessage = {
              text: message,
              from: sender,
              senderType: sender_type,
              client,
              timestamp: timestamp || new Date().toISOString(),
              isRead: is_read ?? false,
              messageId: message_id,
              fileUrl: file_url, // Use raw file_url
              fileName: file_name,
            };
            console.log("Adding new message to state:", newMessage);
            return {
              ...prev,
              [key]: [...existingMessages, newMessage],
            };
          });

          if (
            user.senderType === "agent" &&
            sender_type === "client" &&
            !is_read &&
            client !== selectedClient
          ) {
            setClients((prev) => [...new Set([...prev, client])]);
            setUnreadMessages((prev) => ({
              ...prev,
              [client]: (prev[client] || 0) + 1,
            }));
          } else if (
            user.senderType === "client" &&
            sender_type === "agent" &&
            !is_read
          ) {
            setUnreadMessages((prev) => ({
              ...prev,
              [user.username]: (prev[user.username] ?? 0) + 1,
            }));
          }
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
        setError("Error processing message.");
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket closed");
      setWsConnected(false);
      isConnecting.current = false;
      processedMessageIds.current.clear();
      if (user?.senderType === "agent") {
        setClients([]);
        setSelectedClient(null);
        setUnreadMessages({});
      }
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        console.log(
          `Attempting to reconnect: attempt ${reconnectAttempts.current}...`
        );
        setError(
          `Connection lost. Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`
        );
        setTimeout(() => connectWebSocket(), reconnectDelay);
      } else {
        setError("Failed to connect to chat. Please refresh or log in again.");
      }
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket error:", {
        message: e.message || "Unknown error",
        type: e.type || "unknown",
        target: e.target?.url || "unknown",
      });
      setError("Chat connection failed. Retrying...");
      isConnecting.current = false;
      ws.current?.close();
    };
  };

  useEffect(() => {
    if (!isPublicPage && user) {
      const timer = setTimeout(() => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }, 1000);
      return () => {
        clearTimeout(timer);
        if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
          console.log("Cleaning up WebSocket: preserving CONNECTING state");
          isConnecting.current = false;
        } else if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
          console.log("Cleaning up WebSocket: closing connection");
          isConnecting.current = false;
          ws.current.close();
        }
      };
    }
  }, [user, isPublicPage]);

  const sendMarkRead = (payload) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      pendingMarkRead.current.push(payload);
      console.log(
        "Pending mark_read queued due to WebSocket not ready:",
        payload
      );
      return false;
    }
    try {
      ws.current.send(JSON.stringify(payload));
      console.log("Mark read sent:", payload);
      return true;
    } catch (err) {
      console.error("Failed to send mark_read:", err);
      setError("Failed to mark messages as read.");
      pendingMarkRead.current.push(payload);
      return false;
    }
  };

  useEffect(() => {
    if (
      user &&
      wsConnected &&
      ws.current &&
      ws.current.readyState === WebSocket.OPEN
    ) {
      if (user.senderType === "agent" && selectedClient) {
        const payload = {
          message_type: "mark_read",
          sender_type: user.senderType,
          room_name: selectedClient,
        };
        if (sendMarkRead(payload)) {
          setUnreadMessages((prev) => ({
            ...prev,
            [selectedClient]: 0,
          }));
        }
      } else if (user?.senderType === "client" && isOpen) {
        const payload = {
          message_type: "mark_read",
          sender_type: user.senderType,
          room_name: user.username,
        };
        if (sendMarkRead(payload)) {
          setUnreadMessages((prev) => ({
            ...prev,
            [user.username]: 0,
          }));
        }
      }
    }
  }, [selectedClient, isOpen, user, wsConnected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedClient]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSelectedFile(null);
      fileInputRef.current.value = null;
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      setSelectedFile(null);
      fileInputRef.current.value = null;
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10 MB limit.");
      setSelectedFile(null);
      fileInputRef.current.value = null;
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleFileUpload = async () => {
    if (!ws.current || !wsConnected || !user || !selectedFile) return;
    if (user.senderType === "agent" && !selectedClient) {
      setError("Please select a client to send the file to.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (user.senderType === "agent") {
      formData.append("room_name", selectedClient);
    }

    try {
      const response = await api.post("/api/chat/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
        },
      });
      const { file_url, file_name, room_name, sender, sender_type } =
        response.data;
      console.log("Backend upload response:", {
        file_url,
        file_name,
        room_name,
        sender,
        sender_type,
      });

      const receiver = user.senderType === "client" ? "" : selectedClient || "";
      const effectiveRoom =
        user.senderType === "client" ? user.username : room_name;

      const payload = {
        message: input || "",
        sender_type: user.senderType,
        receiver,
        room_name: effectiveRoom,
        file_url, // Use raw file_url from backend
        file_name,
      };

      ws.current.send(JSON.stringify(payload));
      console.log("Sent file message:", payload);
      setInput("");
      setSelectedFile(null);
      fileInputRef.current.value = null;
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = () => {
    if (!ws.current || !wsConnected || !input.trim() || !user) return;

    const receiver = user.senderType === "client" ? "" : selectedClient || "";
    if (user.senderType === "agent" && !receiver) {
      setError("Please select a client to send the message.");
      return;
    }

    const payload = {
      message: input,
      sender_type: user.senderType,
      receiver,
      room_name: receiver || user.username,
    };

    try {
      ws.current.send(JSON.stringify(payload));
      console.log("Sent message:", payload);
      setInput("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Reconnecting...");
      ws.current?.close();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) {
        handleFileUpload();
      } else {
        sendMessage();
      }
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    if (user.senderType === "agent") {
      const payload = {
        message_type: "mark_read",
        sender_type: user.senderType,
        room_name: client,
      };
      sendMarkRead(payload);
      setUnreadMessages((prev) => ({
        ...prev,
        [client]: 0,
      }));
    }
    console.log("Selected client:", client);
  };

  const closeChat = (client) => {
    if (user?.senderType === "agent") {
      setClients((prev) => prev.filter((c) => c !== client));
      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[client];
        return newMessages;
      });
      setUnreadMessages((prev) => {
        const newUnread = { ...prev };
        delete newUnread[client];
        return newUnread;
      });
      if (selectedClient === client) {
        setSelectedClient(null);
      }
    }
  };

  const handleCloseChat = (client, event) => {
    event?.stopPropagation();
    if (window.confirm(`Close chat with ${client}?`)) {
      closeChat(client);
    }
  };

  if (isPublicPage) {
    console.log(
      "ChatComponent not rendering on public page:",
      window.location.pathname
    );
    return null;
  }

  if (user?.role === "admin") return null;

  if (
    error &&
    !wsConnected &&
    reconnectAttempts.current >= maxReconnectAttempts
  ) {
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1300,
          fontFamily: "inherit",
        }}
      >
        <Paper
          sx={{
            padding: 2.5,
            borderRadius: 3,
            maxWidth: 320,
            boxShadow: "0 10px 24px rgba(0,0,0,0.15)",
            bgcolor: "background.paper",
          }}
        >
          <Typography
            sx={{
              color: "error.main",
              marginBottom: 1.5,
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              localStorage.removeItem(ACCESS_TOKEN);
              window.location.href = "/login";
            }}
            sx={{ width: "100%", textTransform: "none" }}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!user) return null;

  const unreadCount =
    user.senderType === "client"
      ? unreadMessages[user.username] || 0
      : Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);

  return (
    <Box
      className="chat-widget"
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1300,
        fontFamily: "inherit",
      }}
    >
      {!isOpen ? (
        <Box
          className="chat-header-bar"
          onClick={() => setIsOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            borderRadius: "50%",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            color: "white",
            width: 60,
            height: 60,
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": { bgcolor: "primary.dark", transform: "scale(1.05)" },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                height: 16,
                minWidth: 16,
                borderRadius: "50%",
                top: -6,
                right: -6,
                fontWeight: "bold",
                animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
                "@keyframes pulse": {
                  "0%": { transform: "scale(1)", opacity: 1 },
                  "50%": { transform: "scale(1.2)", opacity: 0.7 },
                  "100%": { transform: "scale(1)", opacity: 1 },
                },
              },
            }}
            invisible={unreadCount === 0}
          >
            <Chat sx={{ color: "white", fontSize: 24 }} />
          </Badge>
        </Box>
      ) : (
        <Paper
          className="chat-container"
          sx={{
            width: 400,
            height: 500,
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <Box
            className="chat-header"
            sx={{
              bgcolor: "primary.main",
              color: "white",
              padding: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {user.senderType === "agent" && selectedClient
                ? selectedClient
                : wsConnected
                ? "Chat Support"
                : "Connecting..."}
            </Typography>
            <IconButton
              onClick={() => {
                setIsOpen(false);
                if (user.senderType === "agent") setSelectedClient(null);
              }}
              color="inherit"
              size="small"
            >
              <KeyboardArrowDown sx={{ color: "white", fontSize: 24 }} />
            </IconButton>
          </Box>
          {error && (
            <Box
              sx={{ padding: 1, bgcolor: "error.light", textAlign: "center" }}
            >
              <Typography sx={{ color: "white", fontSize: "0.875rem" }}>
                {error}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {user.senderType === "agent" && !selectedClient ? (
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  bgcolor: "grey.100",
                  padding: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    padding: 1,
                    fontSize: "1rem",
                    color: "#28a745",
                    fontWeight: 600,
                  }}
                >
                  Available Clients
                </Typography>
                <Divider />
                <List sx={{ padding: 0 }}>
                  {clients.length === 0 ? (
                    <ListItem>
                      <ListItemText
                        primary="No clients available"
                        primaryTypographyProps={{ color: "text.secondary" }}
                      />
                    </ListItem>
                  ) : (
                    clients.map((client) => (
                      <ListItem
                        key={client}
                        button
                        onClick={() => handleClientSelect(client)}
                        sx={{
                          marginY: 0.5,
                          marginX: 0.5,
                          borderRadius: 2,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Badge
                              badgeContent={unreadMessages[client] || 0}
                              color="primary"
                              invisible={!unreadMessages[client]}
                            >
                              {client}
                            </Badge>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => handleCloseChat(client, e)}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  className="message-area"
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    bgcolor: "grey.50",
                  }}
                >
                  {(user.senderType === "client"
                    ? messages[user.username] || []
                    : messages[selectedClient] || []
                  ).map((msg, idx) => (
                    <Box
                      key={msg.messageId || `msg-${idx}`}
                      sx={{
                        display: "flex",
                        justifyContent:
                          msg.senderType === "system"
                            ? "center"
                            : msg.from === user.username
                            ? "flex-end"
                            : "flex-start",
                        maxWidth: "100%",
                      }}
                    >
                      <Paper
                        sx={{
                          padding: 1.5,
                          borderRadius: 3,
                          maxWidth: msg.senderType === "system" ? "80%" : "70%",
                          bgcolor:
                            msg.senderType === "system"
                              ? "grey.200"
                              : msg.from === user.username
                              ? "primary.main"
                              : "white",
                          color:
                            msg.from === user.username
                              ? "white"
                              : "text.primary",
                          boxShadow: 1,
                        }}
                      >
                        <Box
                          sx={{ fontSize: "0.9rem", wordBreak: "break-word" }}
                        >
                          {msg.senderType === "system" ? (
                            <Typography sx={{ color: "inherit" }}>
                              {msg.text}
                            </Typography>
                          ) : (
                            <Box>
                              {msg.text && (
                                <Typography sx={{ color: "inherit" }}>
                                  {msg.text}
                                </Typography>
                              )}
                              {msg.fileName && msg.fileUrl ? (
                                <Box
                                  sx={{
                                    marginTop: 1,
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "0.75rem",
                                      color:
                                        msg.from === user.username
                                          ? "white"
                                          : "primary.main",
                                    }}
                                  >
                                    {msg.fileName}
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                      color:
                                        msg.from === user.username
                                          ? "white"
                                          : "primary.main",
                                      borderColor:
                                        msg.from === user.username
                                          ? "white"
                                          : "primary.main",
                                      fontSize: "0.625rem",
                                    }}
                                  >
                                    View
                                  </Button>
                                </Box>
                              ) : (
                                msg.fileName && (
                                  <Typography
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "error.main",
                                    }}
                                  >
                                    (File unavailable)
                                  </Typography>
                                )
                              )}
                            </Box>
                          )}
                        </Box>
                        {msg.senderType !== "system" && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              marginTop: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                color:
                                  msg.from === user.username
                                    ? "white"
                                    : "text.secondary",
                                marginRight: 1,
                              }}
                            >
                              {new Date(msg.timestamp).toLocaleString()}
                            </Typography>
                            {msg.from === user.username && msg.isRead && (
                              <VisibilityIcon
                                sx={{ fontSize: 14, color: "white" }}
                              />
                            )}
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>
                <Box
                  className="input-area"
                  sx={{
                    padding: 2,
                    borderTop: 1,
                    borderColor: "divider",
                    bgcolor: "white",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                      accept=".pdf"
                    />
                    <IconButton
                      onClick={() => fileInputRef.current.click()}
                      disabled={
                        uploading ||
                        !wsConnected ||
                        (user.senderType === "agent" && !selectedClient)
                      }
                      color="primary"
                    >
                      <AttachFile fontSize="small" />
                    </IconButton>
                    {selectedFile && (
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          color: "primary.main",
                          maxWidth: 150,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {selectedFile.name}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={
                        uploading ||
                        !wsConnected ||
                        (user.senderType === "agent" && !selectedClient)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "white",
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={selectedFile ? handleFileUpload : sendMessage}
                      disabled={
                        uploading ||
                        !wsConnected ||
                        (user.senderType === "agent" && !selectedClient)
                      }
                      endIcon={
                        wsConnected && !uploading ? (
                          <Send sx={{ color: "white" }} />
                        ) : (
                          <CircularProgress size={16} />
                        )
                      }
                      sx={{ textTransform: "none" }}
                    >
                      {uploading ? "Sending..." : "Send"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ChatComponent;
