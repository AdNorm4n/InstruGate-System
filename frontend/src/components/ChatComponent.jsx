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
} from "@mui/material";
import { Chat, Close, Send } from "@mui/icons-material";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

const ChatComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [assignedEngineer, setAssignedEngineer] = useState(null);
  const [messages, setMessages] = useState({}); // { clientUsername: [{ text, from, senderType }, ...] }
  const [assignedClients, setAssignedClients] = useState([]); // For engineers: list of clients
  const [selectedClient, setSelectedClient] = useState(null); // For engineers: selected client
  const [error, setError] = useState(null);
  const [clientAssignments, setClientAssignments] = useState({}); // { clientUsername: engineerUsername }
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    api
      .get("/api/users/me/")
      .then((res) => {
        setUser({
          username: res.data.username,
          role: res.data.role,
          senderType:
            res.data.role === "proposal_engineer" ? "agent" : "client",
        });
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError("Failed to load user data.");
        }
      });
  }, []);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      console.error("No access token found");
      setError("Please log in to access chat.");
      return;
    }

    const connectWebSocket = () => {
      const socketUrl = `ws://localhost:8000/ws/chat/${user.username}/?token=${token}`;
      ws.current = new WebSocket(socketUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected for:", user.username);
        setWsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { message, sender, sender_type } = data;

          // Handle system messages
          if (sender_type === "system") {
            if (user.senderType === "client") {
              const engineerMatch = message.match(/(\w+) is assisting you/);
              if (engineerMatch) {
                setAssignedEngineer(engineerMatch[1]);
              } else if (message.includes("disconnected")) {
                setAssignedEngineer(null);
              }
            } else if (user.senderType === "agent") {
              const assignmentMatch = message.match(
                /(\w+) is now assigned to (\w+)/
              );
              const disconnectMatch = message.match(/(\w+) has disconnected/);
              if (assignmentMatch) {
                const [, engineer, client] = assignmentMatch;
                setClientAssignments((prev) => ({
                  ...prev,
                  [client]: engineer,
                }));
                // Remove client from other engineers' sidebar
                if (engineer !== user.username) {
                  setAssignedClients((prev) =>
                    prev.filter((c) => c !== client)
                  );
                  setMessages((prev) => {
                    const newMessages = { ...prev };
                    delete newMessages[client];
                    return newMessages;
                  });
                  if (selectedClient === client) setSelectedClient(null);
                }
              } else if (disconnectMatch) {
                const [, client] = disconnectMatch;
                setClientAssignments((prev) => {
                  const newAssignments = { ...prev };
                  delete newAssignments[client];
                  return newAssignments;
                });
                setMessages((prev) => {
                  const newMessages = { ...prev };
                  delete newMessages[client];
                  return newMessages;
                });
                if (selectedClient === client) setSelectedClient(null);
              }
            }
          }

          // Determine message key
          const clientKey =
            user.senderType === "agent" && sender_type !== "agent"
              ? sender
              : user.senderType === "client" && sender_type !== "client"
              ? assignedEngineer || sender
              : user.username;

          // Store message only if client is not assigned to another engineer
          if (
            user.senderType === "agent" &&
            clientAssignments[clientKey] &&
            clientAssignments[clientKey] !== user.username
          ) {
            return; // Skip storing messages for clients assigned to others
          }

          setMessages((prev) => ({
            ...prev,
            [clientKey]: [
              ...(prev[clientKey] || []),
              { text: message, from: sender, senderType: sender_type },
            ],
          }));

          // Update assigned clients for engineers, avoiding duplicates
          if (
            user.senderType === "agent" &&
            sender_type === "client" &&
            !assignedClients.includes(sender) &&
            !clientAssignments[sender]
          ) {
            setAssignedClients((prev) => [...new Set([...prev, sender])]);
            if (!selectedClient) setSelectedClient(sender);
          }
        } catch (e) {
          console.error("WebSocket message error:", e);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setWsConnected(false);
        if (user?.senderType === "agent") {
          setAssignedClients([]);
          setSelectedClients([]);
          setSelectedClient(null);
        }
        setAssignedEngineer(null);

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          setTimeout(connectWebSocket, 2000 * reconnectAttempts.current);
        } else {
          setError(
            "Unable to connect to chat. Please refresh or log in again."
          );
        }
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.current.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedClient]);

  const sendMessage = () => {
    if (!ws.current || !wsConnected || !input.trim() || !user) return;

    const receiver =
      user.senderType === "client"
        ? assignedEngineer || ""
        : selectedClient || "";

    if (user.senderType === "agent" && !receiver) return;

    const payload = {
      message: input,
      sender_type: user.senderType,
      receiver,
    };
    ws.current.send(JSON.stringify(payload));

    const clientKey =
      user.senderType === "client"
        ? assignedEngineer || user.username
        : receiver;
    setMessages((prev) => ({
      ...prev,
      [clientKey]: [
        ...(prev[clientKey] || []),
        { text: input, from: user.username, senderType: user.senderType },
      ],
    }));

    // Notify other engineers of assignment
    if (user.senderType === "agent") {
      const assignmentPayload = {
        message: `${user.username} is now assigned to ${receiver}`,
        sender_type: "system",
        receiver: "",
      };
      ws.current.send(JSON.stringify(assignmentPayload));
    }

    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  if (error) {
    return (
      <Box
        className="chat-widget"
        sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}
      >
        <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="contained"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            sx={{
              mt: 1,
              bgcolor: "#d6393a",
              "&:hover": { bgcolor: "#b32f2e" },
            }}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box
      className="chat-widget"
      sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}
    >
      {!isOpen ? (
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            bgcolor: "#d6393a",
            color: "white",
            "&:hover": { bgcolor: "#b32f2e" },
            width: 60,
            height: 60,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <Chat fontSize="large" />
        </IconButton>
      ) : (
        <Paper
          elevation={3}
          sx={{
            width: { xs: "90vw", sm: user.senderType === "agent" ? 600 : 320 },
            height: 400,
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              bgcolor: "#d6393a",
              color: "white",
              p: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontSize: "1rem" }}>
              {wsConnected ? "Chat Support" : "Connecting..."}
            </Typography>
            <IconButton
              onClick={() => setIsOpen(false)}
              sx={{ color: "white" }}
            >
              <Close />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {user.senderType === "agent" && (
              <Box
                sx={{
                  width: 200,
                  bgcolor: "#f0f0f0",
                  borderRight: "1px solid #ddd",
                  overflowY: "auto",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ p: 1, fontWeight: "bold" }}
                >
                  Clients
                </Typography>
                <List>
                  {assignedClients.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No clients assigned" />
                    </ListItem>
                  ) : (
                    assignedClients.map((client, index) => (
                      <ListItem
                        key={`${client}-${index}`}
                        button
                        selected={selectedClient === client}
                        onClick={() => setSelectedClient(client)}
                        sx={{
                          "&.Mui-selected": {
                            bgcolor: "#d6393a",
                            color: "white",
                            "&:hover": { bgcolor: "#b32f2e" },
                          },
                        }}
                      >
                        <ListItemText primary={client} />
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            )}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {user.senderType === "agent" &&
              selectedClient &&
              clientAssignments[selectedClient] &&
              clientAssignments[selectedClient] !== user.username ? (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#f5f5f5",
                  }}
                >
                  <Typography>
                    This client is already in progress with{" "}
                    {clientAssignments[selectedClient]}.
                  </Typography>
                </Box>
              ) : user.senderType === "agent" && !selectedClient ? (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#f5f5f5",
                  }}
                >
                  <Typography>Select a client to start chatting.</Typography>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      overflowY: "auto",
                      bgcolor: "#f5f5f5",
                    }}
                  >
                    {(user.senderType === "client"
                      ? messages[assignedEngineer || user.username] || []
                      : messages[selectedClient] || []
                    ).map((msg, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          mb: 1,
                          display: "flex",
                          justifyContent:
                            msg.from === user.username
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1,
                            maxWidth: "70%",
                            bgcolor:
                              msg.from === user.username ? "#d6393a" : "#fff",
                            color:
                              msg.from === user.username ? "white" : "black",
                            borderRadius: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.85rem" }}
                          >
                            <strong>
                              {msg.from === user.username
                                ? "You"
                                : `${msg.from} (${msg.senderType})`}
                              :{" "}
                            </strong>
                            {msg.text}
                          </Typography>
                        </Paper>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                  <Box sx={{ p: 1, display: "flex", bgcolor: "white" }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      sx={{ mr: 1 }}
                      disabled={user.senderType === "agent" && !selectedClient}
                    />
                    <Button
                      variant="contained"
                      onClick={sendMessage}
                      disabled={
                        !wsConnected ||
                        (user.senderType === "agent" && !selectedClient)
                      }
                      endIcon={<Send />}
                      sx={{
                        bgcolor: "#d6393a",
                        "&:hover": { bgcolor: "#b32f2e" },
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
