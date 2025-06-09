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
  ChevronLeft,
  KeyboardArrowDown,
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
  const [showSidebar, setShowSidebar] = useState(true);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const messagesEndRef = useRef(null);
  const pendingMarkRead = useRef([]);

  // Authenticate user and fetch profile
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setError("Please log in to continue.");
      window.location.href = "/login";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000;
      if (Date.now() > exp) {
        setError("Session has expired. Please log in again.");
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
  }, []);

  // Handle WebSocket connection
  const connectWebSocket = () => {
    if (!user || ws.current?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem(ACCESS_TOKEN);
    const socketUrl = `ws://localhost:8000/ws/chat/${user.username}/?token=${token}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
      reconnectAttempts.current = 0;
      setError("");
      pendingMarkRead.current.forEach((payload) => {
        try {
          ws.current.send(JSON.stringify(payload));
          console.log("Retried mark_read:", payload);
        } catch (e) {
          console.error("Failed to retry mark_read:", e);
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

        if (!data.message || !data.sender_type || !data.client) return;

        const {
          message,
          sender,
          sender_type,
          client,
          is_read,
          timestamp,
          message_id,
        } = data;
        const key = user.senderType === "client" ? user.username : client;

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
          }

          if (message.includes("is with")) {
            const match = message.match(/(\w+) is with (\w+)/);
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
            };
            return {
              ...prev,
              [key]: [...existingMessages, newMessage],
            };
          });
        } else {
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
            };
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
      if (user?.senderType === "agent") {
        setClients([]);
        setSelectedClient(null);
        setShowSidebar(true);
        setUnreadMessages({});
      }
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        console.log(`Reconnecting attempt ${reconnectAttempts.current}...`);
        setError(
          `Connection lost. Reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})...`
        );
        setTimeout(connectWebSocket, reconnectDelay);
      } else {
        setError("Unable to connect to chat. Please refresh or log in again.");
      }
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket error:", {
        message: e.message || "Unknown error",
        type: e.type,
        target: e.target?.url || "No URL",
      });
      setError("Chat connection failed. Retrying...");
      ws.current?.close();
    };
  };

  // Initialize WebSocket on user load
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [user]);

  // Mark messages as read
  const sendMarkRead = (payload) => {
    if (!ws.current || !wsConnected) {
      pendingMarkRead.current.push(payload);
      console.log("Queued mark_read:", payload);
      return false;
    }
    try {
      ws.current.send(JSON.stringify(payload));
      console.log("Sent mark_read:", payload);
      return true;
    } catch (err) {
      console.error("Failed to send mark_read:", err);
      setError("Failed to mark messages as read.");
      pendingMarkRead.current.push(payload);
      return false;
    }
  };

  // Auto-mark messages as read
  useEffect(() => {
    if (user && wsConnected) {
      if (user.senderType === "agent" && selectedClient) {
        const payload = {
          message_type: "mark_read",
          sender_type: user.senderType,
          room_name: selectedClient,
        };
        sendMarkRead(payload);
        setUnreadMessages((prev) => ({
          ...prev,
          [selectedClient]: 0,
        }));
      } else if (user?.senderType === "client" && isOpen) {
        const payload = {
          message_type: "mark_read",
          sender_type: user.senderType,
          room_name: user.username,
        };
        sendMarkRead(payload);
        setUnreadMessages((prev) => ({
          ...prev,
          [user.username]: 0,
        }));
      }
    }
  }, [selectedClient, isOpen, user, wsConnected]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedClient]);

  // Send user message
  const sendMessage = () => {
    if (!ws.current || !wsConnected || !input.trim() || !user) return;

    const receiver = user.senderType === "client" ? "" : selectedClient || "";
    if (user.senderType === "agent" && !receiver) return;

    const payload = {
      message: input,
      sender_type: user.senderType,
      receiver,
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

  // Handle Enter keypress
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle double-click
  const handleDoubleClick = (client) => {
    if (user.senderType === "agent") {
      console.log("Double-clicked client:", client);
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
      setSelectedClient(client);
      setShowSidebar(false);
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    setShowSidebar(true);
    setSelectedClient(null);
  };

  // Close chat session
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
        setShowSidebar(true);
      }
    }
  };

  // Confirm chat closure
  const handleCloseChat = (client) => {
    if (window.confirm(`Close chat with ${client}?`)) {
      closeChat(client);
    }
  };

  // Render error state
  if (
    error &&
    !wsConnected &&
    reconnectAttempts.current >= maxReconnectAttempts
  ) {
    return (
      <Box
        className="chat-widget"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1300,
          fontFamily: "Helvetica, sans-serif",
        }}
      >
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            maxWidth: 320,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            bgcolor: "#ffffff",
          }}
        >
          <Typography
            sx={{
              color: "#0288d1",
              mb: 1.5,
              fontSize: "0.9rem",
              fontWeight: 500,
              fontFamily: "Helvetica, sans-serif",
            }}
          >
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              localStorage.removeItem(ACCESS_TOKEN);
              window.location.href = "/login";
            }}
            sx={{
              backgroundColor: "#1976d2",
              color: "#ffffff",
              padding: "8px 24px",
              fontWeight: 600,
              fontSize: "0.9rem",
              textTransform: "none",
              borderRadius: "8px",
              fontFamily: "Helvetica, sans-serif",
              "&:hover": {
                backgroundColor: "#1565c0",
                transform: "scale(1.05)",
              },
              "&.Mui-disabled": {
                backgroundColor: "#e0e0e0",
                color: "#999",
              },
              transition: "all 0.3s ease",
            }}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!user) return null;

  const unreadCount =
    user.senderType === "agent"
      ? Object.values(unreadMessages).reduce((sum, count) => sum + count, 0)
      : unreadMessages[user.username] || 0;

  // Render chat UI
  return (
    <Box
      className="chat-widget"
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1300,
        fontFamily: "Helvetica, sans-serif",
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
            backgroundColor: "#1976d2",
            borderRadius: "50%",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            width: 60,
            height: 60,
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "#1565c0",
              transform: "scale(1.05)",
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            className="chat-icon-badge"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#d32f2f",
                color: "#ffffff",
                height: 16,
                minWidth: 16,
                borderRadius: "50%",
                top: -6,
                right: -6,
                fontWeight: 600,
                animation:
                  unreadCount > 0 ? "pulse 2s ease-in-out infinite" : "none",
              },
            }}
            invisible={unreadCount === 0}
          >
            <Chat sx={{ color: "#ffffff", fontSize: 24 }} />
          </Badge>
        </Box>
      ) : (
        <Paper
          className="chat-container"
          sx={{
            width:
              user.senderType === "agent" ? (showSidebar ? 600 : 400) : 350,
            height: 500,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#ffffff",
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
            transform: isOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Box
            className="chat-header"
            sx={{
              backgroundColor: "#1976d2",
              color: "#ffffff",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {user.senderType === "agent" &&
                !showSidebar &&
                selectedClient && (
                  <IconButton
                    className="back-button"
                    onClick={handleBackClick}
                    sx={{
                      color: "#ffffff",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
                      transition: "background-color 0.2s ease",
                      p: 0.5,
                    }}
                  >
                    <ChevronLeft sx={{ fontSize: "big", color: "#ffffff" }} />
                  </IconButton>
                )}
              <Typography
                sx={{
                  fontSize: "1.15rem",
                  fontWeight: 60,
                  fontFamily: "Helvetica, sans-serif",
                }}
              >
                {user.senderType === "agent" && !showSidebar && selectedClient
                  ? selectedClient
                  : wsConnected
                  ? "Chat Support"
                  : "Connecting..."}
              </Typography>
            </Box>
            <IconButton
              className="downward-button"
              onClick={() => setIsOpen(false)}
              sx={{
                color: "#ffffff",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
                transition: "background-color 0.2s ease",
                p: 0.5,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <KeyboardArrowDown sx={{ fontSize: "big", color: "#ffffff" }} />
            </IconButton>
          </Box>
          {error && (
            <Box
              sx={{
                padding: "8px",
                backgroundColor: "#e1f5fe",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#0288d1",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  fontFamily: "Helvetica, sans-serif",
                }}
              >
                {error}
              </Typography>
            </Box>
          )}
          <Box
            className="chat-body"
            sx={{ display: "flex", flex: 1, overflow: "hidden" }}
          >
            {user.senderType === "agent" && showSidebar && (
              <Box
                className="sidebar"
                sx={{
                  width: 200,
                  borderRight: 1,
                  borderColor: "#e0e0e0",
                  overflowY: "auto",
                  backgroundColor: "#f9f9f9",
                  padding: "8px 4px",
                }}
              >
                <Typography
                  className="sidebar-title"
                  sx={{
                    padding: "12px 16px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#212121",
                    fontFamily: "Helvetica, sans-serif",
                  }}
                >
                  Clients
                </Typography>
                <Divider sx={{ borderColor: "#e0e0e0" }} />
                <List className="client-list" sx={{ padding: 0 }}>
                  {clients.length === 0 ? (
                    <ListItem className="no-clients">
                      <ListItemText
                        primary="No clients available"
                        primaryTypographyProps={{
                          color: "#757575",
                          fontSize: "0.9rem",
                          fontFamily: "Helvetica, sans-serif",
                        }}
                      />
                    </ListItem>
                  ) : (
                    clients.map((client) => (
                      <ListItem
                        key={client}
                        button
                        className="client-item"
                        selected={selectedClient === client}
                        onClick={() => setSelectedClient(client)}
                        onDoubleClick={() => handleDoubleClick(client)}
                        sx={{
                          borderRadius: "8px",
                          "&.Mui-selected": {
                            backgroundColor: "#e3f2fd",
                            "&:hover": { backgroundColor: "#bbdefb" },
                          },
                          "&:hover": { backgroundColor: "#f1f5f9" },
                          margin: "4px 6px",
                          padding: "8px 12px",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Badge
                              badgeContent={unreadMessages[client] || 0}
                              sx={{
                                "& .MuiBadge-badge": {
                                  backgroundColor: "#0288d1",
                                  color: "#ffffff",
                                  fontSize: "0.7rem",
                                  height: 16,
                                  minWidth: 16,
                                  borderRadius: "8px",
                                  fontWeight: 600,
                                  right: -8,
                                },
                              }}
                              invisible={!unreadMessages[client]}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.95rem",
                                  fontWeight:
                                    selectedClient === client ? 600 : 500,
                                  color: "#212121",
                                  fontFamily: "Helvetica, sans-serif",
                                }}
                              >
                                {client}
                              </Typography>
                            </Badge>
                          }
                        />
                        <IconButton
                          className="close-chat-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseChat(client);
                          }}
                          sx={{
                            padding: 0.5,
                            color: "#9ca3af",
                            "&:hover": { color: "#1976d2" },
                            transition: "color 0.2s",
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            )}
            <Box
              className="chat-main"
              sx={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              {user.senderType === "agent" && !selectedClient && showSidebar ? (
                <Box
                  className="status-message"
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    backgroundColor: "#f9f9f5",
                  }}
                >
                  <Typography
                    className="status-text"
                    sx={{
                      color: "#6b7280",
                      fontSize: "0.9rem",
                      fontFamily: "Helvetica, sans-serif",
                    }}
                  >
                    Select a client to start chatting
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box
                    className="message-area"
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      backgroundColor: "#f9f9f5",
                    }}
                  >
                    {(user.senderType === "client"
                      ? messages[user.username] || []
                      : messages[selectedClient] || []
                    ).map((msg, idx) => (
                      <Box
                        key={msg.messageId || `msg-${user.username}-${idx}`}
                        className={`message ${
                          msg.senderType === "system"
                            ? "message-system"
                            : msg.from === user.username
                            ? "message-self"
                            : "message-other"
                        }`}
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
                          className="message-bubble"
                          elevation={1}
                          sx={{
                            padding: "10px 14px",
                            borderRadius: "12px",
                            maxWidth:
                              msg.senderType === "system" ? "80%" : "70%",
                            backgroundColor:
                              msg.senderType === "system"
                                ? "#e0e0e0"
                                : msg.from === user.username
                                ? "#1976d2"
                                : "#ffffff",
                            color:
                              msg.senderType === "system"
                                ? "#424242"
                                : msg.from === user.username
                                ? "#ffffff"
                                : "#1f2a44",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            transition: "transform 0.2s ease",
                            "&:hover": { transform: "translateY(-1px)" },
                            textAlign:
                              msg.senderType === "system" ? "center" : "left",
                          }}
                        >
                          <Typography
                            className="message-text"
                            sx={{
                              fontSize: "0.95rem",
                              wordBreak: "break-word",
                              fontFamily: "Helvetica, sans-serif",
                              lineHeight: 1.5,
                            }}
                          >
                            {msg.senderType === "system" ? (
                              msg.text
                            ) : (
                              <>
                                <strong>
                                  {msg.from === user.username
                                    ? "You"
                                    : `${msg.from} (${msg.senderType})`}
                                </strong>
                                : {msg.text}
                              </>
                            )}
                          </Typography>
                          {msg.senderType !== "system" && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                marginTop: "4px",
                              }}
                            >
                              {msg.timestamp && (
                                <Typography
                                  sx={{
                                    color:
                                      msg.from === user.username
                                        ? "#e0e7ff"
                                        : "#6b7280",
                                    fontSize: "0.75rem",
                                    marginRight: "4px",
                                    fontFamily: "Helvetica, sans-serif",
                                  }}
                                >
                                  {new Date(msg.timestamp).toLocaleString()}
                                </Typography>
                              )}
                              {msg.from === user.username && msg.isRead && (
                                <VisibilityIcon
                                  sx={{ fontSize: 14, color: "#e0e7ff" }}
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
                      padding: "12px 16px",
                      borderTop: 1,
                      borderColor: "#e5e7eb",
                      display: "flex",
                      gap: "10px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <TextField
                      className="message-input"
                      fullWidth
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={
                        (user?.senderType === "agent" && !selectedClient) ||
                        !wsConnected
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#f9fafb",
                          fontSize: "0.9rem",
                          fontFamily: "Helvetica, sans-serif",
                          "& fieldset": { borderColor: "#d1d5db" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                    <Button
                      className="send-button"
                      variant="contained"
                      onClick={sendMessage}
                      disabled={
                        !wsConnected ||
                        (user?.senderType === "agent" && !selectedClient)
                      }
                      endIcon={
                        wsConnected ? (
                          <Send sx={{ fontSize: 18, color: "#ffffff" }} />
                        ) : (
                          <CircularProgress
                            size={18}
                            sx={{ color: "#ffffff" }}
                          />
                        )
                      }
                      sx={{
                        backgroundColor: "#1976d2",
                        color: "#ffffff",
                        padding: "8px 24px",
                        fontSize: "0.9rem",
                        textTransform: "none",
                        borderRadius: "8px",
                        fontFamily: "Helvetica, sans-serif",
                        "&:hover": {
                          backgroundColor: "#1565c0",
                          transform: "scale(1.05)",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "#e0e0e0",
                          color: "#999",
                        },
                        transition: "all 0.3s ease",
                        "& .MuiCircularProgress-root": {
                          color: "#ffffff",
                        },
                      }}
                    >
                      Send
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ChatComponent;
