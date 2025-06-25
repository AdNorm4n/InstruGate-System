import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Snackbar,
  Fade,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { UserContext } from "../contexts/UserContext";
import ErrorBoundary from "../components/ErrorBoundary";
import api from "../api";
import "../styles/UsersAdmin.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...(theme?.mixins?.toolbar || {
    minHeight: 56,
    "@media (min-width:600px)": {
      minHeight: 64,
    },
  }),
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: theme.spacing(1, 2.5),
  fontWeight: 500,
  fontSize: "0.85rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "'Inter', sans-serif",
  "&:hover": {
    backgroundColor: "#2563eb",
    transform: "scale(1.03)",
  },
  "&.Mui-disabled": {
    backgroundColor: "#4b5563",
    color: "#9ca3af",
  },
  transition: "all 0.2s ease",
  "& .MuiCircularProgress-root": {
    color: "#ffffff",
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  color: "#ef4444",
  fontFamily: "'Inter', sans-serif",
  textTransform: "none",
  "&:hover": {
    color: "#dc2626",
    backgroundColor: "#1f2937",
  },
}));

const UsersAdmin = () => {
  const { userRole } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    company: "",
    role: "",
    first_name: "",
    last_name: "",
  });
  const [modalAction, setModalAction] = useState("add");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: "id",
    direction: "asc",
  });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const access = localStorage.getItem("access");
      if (!access) {
        setError("Please log in to access the admin panel.");
        return;
      }
      const headers = { Authorization: `Bearer ${access}` };
      const [usersResponse] = await Promise.all([
        api.get("/api/users/list/", { headers }),
      ]);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setFilteredUsers(
        Array.isArray(usersResponse.data) ? usersResponse.data : []
      );
    } catch (err) {
      console.error("fetchData Error:", err.response?.data || err.message);
      setError(
        `Error fetching users: ${err.response?.data?.detail || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...users];
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }
    filtered.sort((a, b) => {
      const fieldA = a[sortConfig.field] || "";
      const fieldB = b[sortConfig.field] || "";
      const multiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.field === "id") {
        return multiplier * ((fieldA || 0) - (fieldB || 0));
      }
      return multiplier * fieldA.toString().localeCompare(fieldB.toString());
    });
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users, sortConfig]);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openAddModal = () => {
    if (userRole !== "admin") {
      setError("You do not have permission to add users.");
      return;
    }
    setModalAction("add");
    setModalData({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
      company: "",
      role: "",
      first_name: "",
      last_name: "",
    });
    setOpenModal(true);
  };

  const openEditModal = (user) => {
    if (userRole !== "admin") {
      setError("You do not have permission to edit users.");
      return;
    }
    setModalAction("edit");
    setModalData({
      ...user,
      password: "",
      confirm_password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
    });
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
      company: "",
      role: "",
      first_name: "",
      last_name: "",
    });
    setError("");
  };

  const handleSave = async () => {
    if (userRole !== "admin") {
      setError("You do not have permission to save users.");
      return;
    }

    if (!modalData.username) {
      setError("Username is required.");
      return;
    }
    if (!modalData.email) {
      setError("Email is required.");
      return;
    }
    if (!modalData.company) {
      setError("Company is required.");
      return;
    }
    if (!modalData.role) {
      setError("Role is required.");
      return;
    }
    if (!modalData.email.includes("@") || !modalData.email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (modalAction === "add") {
      if (!modalData.password) {
        setError("Password is required.");
        return;
      }
      if (modalData.password !== modalData.confirm_password) {
        setError("Passwords do not match.");
        return;
      }
      if (modalData.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
    }

    try {
      const access = localStorage.getItem("access");
      const headers = {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      };
      let endpoint, method, payload;

      if (modalAction === "add") {
        endpoint = "/api/users/admin/users/";
        method = "post";
        payload = {
          username: modalData.username,
          email: modalData.email,
          password: modalData.password,
          confirm_password: modalData.confirm_password,
          company: modalData.company,
          role: modalData.role,
          first_name: modalData.first_name || "",
          last_name: modalData.last_name || "",
        };
      } else {
        endpoint = `/api/users/${modalData.id}/`;
        method = "patch";
        payload = {
          username: modalData.username,
          email: modalData.email,
          company: modalData.company,
          role: modalData.role,
          first_name: modalData.first_name || "",
          last_name: modalData.last_name || "",
        };
      }

      console.log(`${modalAction} Payload:`, payload);
      const response = await api({
        method,
        url: endpoint,
        data: payload,
        headers,
      });
      console.log("Save Response:", response.data);
      setSuccess(
        modalAction === "add"
          ? "User created successfully!"
          : "User updated successfully!"
      );
      fetchData();
      handleModalClose();
    } catch (err) {
      console.error("Error Response:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.email?.[0] ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.company?.[0] ||
        err.response?.data?.role?.[0] ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        err.message;
      setError(`Failed to save user: ${errorMessage}`);
    }
  };

  const handleOpenConfirmDialog = (action, message) => {
    setConfirmAction(() => action);
    setConfirmMessage(message);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const handleConfirmAction = async () => {
    if (confirmAction) {
      await confirmAction();
    }
    handleCloseConfirmDialog();
  };

  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      setError("You do not have permission to delete users.");
      return;
    }
    handleOpenConfirmDialog(async () => {
      try {
        const access = localStorage.getItem("access");
        await api.delete(`/api/users/${id}/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        setSuccess("User deleted successfully!");
        fetchData();
      } catch (err) {
        console.error("Delete Error:", err.response?.data || err);
        setError(
          `Failed to delete user: ${err.response?.data?.detail || err.message}`
        );
      }
    }, "Are you sure you want to delete this user?");
  };

  const toTitleCase = (str) => {
    return str
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          bgcolor: "#000000",
          width: "100%",
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
        className="users-admin-page"
      >
        <main
          style={{
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <ErrorBoundary>
            <Container
              maxWidth="lg"
              sx={{
                py: 8,
                px: { xs: 2, sm: 4 },
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
              }}
            >
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: "#ffffff",
                  fontFamily: "'Inter', sans-serif",
                  mb: 5,
                  fontSize: { xs: "1.75rem", md: "2.25rem" },
                  letterSpacing: "-0.02em",
                  textTransform: "none",
                  position: "relative",
                  "&:after": {
                    content: '""',
                    display: "block",
                    width: "60px",
                    height: "4px",
                    bgcolor: "#3b82f6",
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderRadius: "2px",
                  },
                }}
              >
                Users Management
              </Typography>
              <Box sx={{ mt: 4 }} />
              <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity="success"
                  onClose={() => setSuccess("")}
                  sx={{
                    fontFamily: "'Inter', sans-serif !important",
                    width: "100%",
                    color: "#ffffff",
                    backgroundColor: "#28a745",
                    "& .MuiAlert-icon": {
                      color: "#ffffff !important",
                      svg: { fill: "#ffffff !important" },
                    },
                    "& .MuiAlert-action": {
                      color: "#ffffff !important",
                      svg: { fill: "#ffffff !important" },
                    },
                  }}
                >
                  {success}
                </Alert>
              </Snackbar>
              <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity="error"
                  onClose={() => setError("")}
                  sx={{
                    fontFamily: "'Inter', sans-serif !important",
                    color: "#ffffff",
                    backgroundColor: "#ef4444",
                    "& .MuiAlert-icon": {
                      color: "#ffffff !important",
                      svg: { fill: "#ffffff !important" },
                    },
                    "& .MuiAlert-action": {
                      color: "#ffffff !important",
                      svg: { fill: "#ffffff !important" },
                    },
                  }}
                >
                  {error}
                </Alert>
              </Snackbar>
              {loading ? (
                <Box sx={{ textAlign: "center", mt: 8 }}>
                  <Box sx={{ p: 4, borderRadius: "16px", bgcolor: "#1e1e1e" }}>
                    <CircularProgress
                      size={48}
                      sx={{ color: "#3b82f6", mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        color: "#ffffff",
                      }}
                    >
                      Loading users...
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ width: "100%", mb: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 4,
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: { xs: "wrap", sm: "nowrap" },
                      width: "100%",
                    }}
                  >
                    <TextField
                      label="Search by Username, Email or Company"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{
                        width: { xs: "100%", sm: "50%" },
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontFamily: "'Inter', sans-serif",
                          bgcolor: "#2a2a2a",
                          color: "#ffffff",
                          "& fieldset": { borderColor: "#4b5563" },
                          "&:hover fieldset": { borderColor: "#3b82f6" },
                          "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                          "& input": { color: "#ffffff !important" },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "'Inter', sans-serif",
                          color: "#d1d5db",
                          "&.Mui-focused": { color: "#3b82f6" },
                        },
                      }}
                      variant="outlined"
                      size="small"
                    />
                    <FormControl
                      sx={{ width: { xs: "100%", sm: "24%" } }}
                      size="small"
                    >
                      <InputLabel
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#d1d5db",
                          "&.Mui-focused": { color: "#3b82f6" },
                        }}
                      >
                        Role
                      </InputLabel>
                      <Select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        label="Role"
                        sx={{
                          borderRadius: "8px",
                          fontFamily: "'Inter', sans-serif",
                          bgcolor: "#2a2a2a",
                          color: "#ffffff !important",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#4b5563",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#3b82f6",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#3b82f6",
                          },
                          "& .MuiSelect-select": {
                            color: "#ffffff !important",
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: "#000000",
                              "& .MuiMenuItem-root": {
                                fontFamily: "'Inter', sans-serif",
                                color: "#ffffff",
                                "&:hover": {
                                  bgcolor: "#3b82f61a",
                                  color: "#ffffff",
                                },
                                "&.Mui-selected": {
                                  bgcolor: "#3b82f61a",
                                  color: "#ffffff",
                                },
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem
                          value=""
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          All Roles
                        </MenuItem>
                        <MenuItem
                          value="admin"
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          Admin
                        </MenuItem>
                        <MenuItem
                          value="proposal_engineer"
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          Proposal Engineer
                        </MenuItem>
                        <MenuItem
                          value="client"
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          Client
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <CTAButton
                      variant="contained"
                      startIcon={<Add sx={{ color: "#ffffff" }} />}
                      onClick={openAddModal}
                      disabled={userRole !== "admin"}
                      sx={{
                        borderRadius: "8px",
                        px: 4,
                        py: 1.5,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        bgcolor: "#3b82f6",
                        "&:hover": { bgcolor: "#2563eb" },
                        "&.Mui-disabled": {
                          bgcolor: "#4b5563",
                          color: "#9ca3af",
                        },
                        width: { xs: "100%", sm: "24%" },
                        minWidth: { xs: "100%", sm: "180px" },
                      }}
                    >
                      Add User
                    </CTAButton>
                  </Box>
                  <Box sx={{ overflowX: "auto", borderRadius: "12px" }}>
                    <Table
                      sx={{
                        minWidth: 650,
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                        bgcolor: "#1a1a1a",
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          {["id", "username", "email", "company", "role"].map(
                            (field) => (
                              <TableCell
                                key={field}
                                sx={{
                                  fontWeight: 600,
                                  fontFamily: "'Inter', sans-serif",
                                  bgcolor: "#252525",
                                  color: "#ffffff",
                                  fontSize: "0.9rem",
                                  py: 2,
                                  px: 3,
                                  border: "none",
                                  width:
                                    field === "id"
                                      ? "80px"
                                      : field === "username"
                                      ? "15%"
                                      : field === "email"
                                      ? "25%"
                                      : field === "company"
                                      ? "20%"
                                      : "15%",
                                  textAlign: field === "id" ? "center" : "left",
                                  "&:first-of-type": {
                                    borderTopLeftRadius: "8px",
                                    borderBottomLeftRadius: "8px",
                                  },
                                  "&:last-of-type": {
                                    borderTopRightRadius: "8px",
                                    borderBottomRightRadius: "8px",
                                  },
                                }}
                              >
                                <TableSortLabel
                                  active={sortConfig.field === field}
                                  direction={
                                    sortConfig.field === field
                                      ? sortConfig.direction
                                      : "asc"
                                  }
                                  onClick={() => handleSort(field)}
                                  sx={{
                                    color: "#ffffff",
                                    "&.Mui-active": { color: "#3b82f6" },
                                    "&:hover": { color: "#3b82f6" },
                                    "& .MuiTableSortLabel-icon": {
                                      color: "#ffffff !important",
                                    },
                                  }}
                                >
                                  {field === "id" ? "ID" : toTitleCase(field)}
                                </TableSortLabel>
                              </TableCell>
                            )
                          )}
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontFamily: "'Inter', sans-serif",
                              bgcolor: "#252525",
                              color: "#ffffff",
                              fontSize: "0.9rem",
                              py: 2,
                              px: 3,
                              border: "none",
                              width: "120px",
                              textAlign: "center",
                              borderTopRightRadius: "8px",
                              borderBottomRightRadius: "8px",
                            }}
                          >
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              align="center"
                              sx={{
                                fontFamily: "'Inter', sans-serif",
                                color: "#ffffff",
                                py: 4,
                                fontSize: "0.95rem",
                                border: "none",
                                bgcolor: "#1a1a1a",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: "'Inter', sans-serif",
                                  color: "#ffffff",
                                }}
                              >
                                No users found.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow
                              key={user.id}
                              sx={{
                                bgcolor: "#2d2d2d",
                                "&:hover": {
                                  bgcolor: "#333333",
                                },
                                transition: "background-color 0.2s",
                                borderRadius: "8px",
                              }}
                            >
                              {[
                                "id",
                                "username",
                                "email",
                                "company",
                                "role",
                              ].map((field) => (
                                <TableCell
                                  key={field}
                                  sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.9rem",
                                    color: "#ffffff !important",
                                    py: 2,
                                    px: 3,
                                    border: "none",
                                    width:
                                      field === "id"
                                        ? "80px"
                                        : field === "username"
                                        ? "15%"
                                        : field === "email"
                                        ? "25%"
                                        : field === "company"
                                        ? "20%"
                                        : "15%",
                                    textAlign:
                                      field === "id" ? "center" : "left",
                                  }}
                                >
                                  {user[field] || "N/A"}
                                </TableCell>
                              ))}
                              <TableCell
                                sx={{
                                  py: 2,
                                  px: 3,
                                  border: "none",
                                  width: "120px",
                                  textAlign: "center",
                                }}
                              >
                                <IconButton
                                  onClick={() => openEditModal(user)}
                                  disabled={userRole !== "admin"}
                                  sx={{
                                    color: "#ffffff",
                                    "&:hover": {
                                      color: "#ffffff",
                                      bgcolor: "#3b82f61a",
                                    },
                                    mr: 1,
                                  }}
                                >
                                  <Edit
                                    sx={{
                                      fontSize: "1.2rem",
                                      color: "#2563eb",
                                    }}
                                  />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDelete(user.id)}
                                  disabled={userRole !== "admin"}
                                  sx={{
                                    color: "#ef4444",
                                    "&:hover": {
                                      color: "#ef4444",
                                      bgcolor: "#ef44441a",
                                    },
                                  }}
                                >
                                  <Delete
                                    sx={{
                                      fontSize: "1.2rem",
                                      color: "#ef4444",
                                    }}
                                  />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}
              <Dialog
                open={openModal}
                onClose={handleModalClose}
                maxWidth="sm"
                fullWidth
                sx={{
                  "& .MuiDialog-paper": {
                    bgcolor: "#1e1e1e",
                    borderRadius: "16px",
                    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.10)",
                    fontFamily: "'Inter', sans-serif",
                  },
                }}
              >
                <DialogTitle
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: "#3b82f6",
                    bgcolor: "#1e1e1e",
                    py: 2.5,
                    px: 4,
                    fontSize: "1.25rem",
                    textAlign: "center",
                    borderBottom: "1px solid #4b5563",
                  }}
                >
                  {modalAction === "add" ? "Add New User" : "Edit User"}
                </DialogTitle>
                <DialogContent sx={{ py: 4, px: 4, bgcolor: "#1e1e1e" }}>
                  <TextField
                    label="Username"
                    value={modalData.username}
                    onChange={(e) =>
                      setModalData({ ...modalData, username: e.target.value })
                    }
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    required
                    size="small"
                    InputLabelProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                      },
                    }}
                    InputProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff !important",
                        bgcolor: "#252525",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#4b5563",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Email"
                    value={modalData.email}
                    onChange={(e) =>
                      setModalData({ ...modalData, email: e.target.value })
                    }
                    fullWidth
                    margin="normal"
                    type="email"
                    variant="outlined"
                    required
                    size="small"
                    InputLabelProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                      },
                    }}
                    InputProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff !important",
                        bgcolor: "#252525",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#4b5563",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                      },
                    }}
                  />
                  {modalAction === "add" && (
                    <>
                      <TextField
                        label="Password"
                        value={modalData.password}
                        onChange={(e) =>
                          setModalData({
                            ...modalData,
                            password: e.target.value,
                          })
                        }
                        fullWidth
                        margin="normal"
                        type="password"
                        variant="outlined"
                        required
                        size="small"
                        InputLabelProps={{
                          sx: {
                            fontFamily: "'Inter', sans-serif",
                            color: "#d1d5db",
                          },
                        }}
                        InputProps={{
                          sx: {
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff !important",
                            bgcolor: "#252525",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#4b5563",
                              "& input": { color: "#ffffff !important" },
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#3b82f6",
                              "& input": { color: "#ffffff !important" },
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#3b82f6",
                              "& input": { color: "#ffffff !important" },
                            },
                          },
                        }}
                      />
                      <TextField
                        label="Confirm Password"
                        value={modalData.confirm_password}
                        onChange={(e) =>
                          setModalData({
                            ...modalData,
                            confirm_password: e.target.value,
                          })
                        }
                        fullWidth
                        margin="normal"
                        type="password"
                        variant="outlined"
                        required
                        size="small"
                        InputLabelProps={{
                          sx: {
                            fontFamily: "'Inter', sans-serif",
                            color: "#d1d5db",
                          },
                        }}
                        InputProps={{
                          sx: {
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff !important",
                            bgcolor: "#252525",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#4b5563",
                              "& input": { color: "#ffffff !important" },
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#3b82f6",
                              "& input": { color: "#ffffff !important" },
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#3b82f6",
                              "& input": { color: "#ffffff !important" },
                            },
                          },
                        }}
                      />
                    </>
                  )}
                  <TextField
                    label="First Name"
                    value={modalData.first_name}
                    onChange={(e) =>
                      setModalData({ ...modalData, first_name: e.target.value })
                    }
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    size="small"
                    InputLabelProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#d1d5db",
                      },
                    }}
                    InputProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff !important",
                        bgcolor: "#252525",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#4b5563",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Last Name"
                    value={modalData.last_name}
                    onChange={(e) =>
                      setModalData({ ...modalData, last_name: e.target.value })
                    }
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    size="small"
                    InputLabelProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#d1d5db",
                      },
                    }}
                    InputProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff !important",
                        bgcolor: "#252525",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#4b5563",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Company"
                    value={modalData.company}
                    onChange={(e) =>
                      setModalData({ ...modalData, company: e.target.value })
                    }
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    required
                    size="small"
                    InputLabelProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#d1d5db",
                      },
                    }}
                    InputProps={{
                      sx: {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff !important",
                        bgcolor: "#252525",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#4b5563",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                      },
                    }}
                  />
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                      }}
                    >
                      Role
                    </InputLabel>
                    <Select
                      value={modalData.role}
                      onChange={(e) =>
                        setModalData({ ...modalData, role: e.target.value })
                      }
                      label="Role"
                      required
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff !important",
                        bgcolor: "#252525",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#4b5563",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                          "& input": { color: "#ffffff !important" },
                        },
                        "& .MuiSelect-select": {
                          color: "#ffffff !important",
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: "#1a1a1a",
                            "& .MuiMenuItem-root": {
                              color: "#ffffff",
                              "&:hover": { bgcolor: "#333333" },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem
                        value=""
                        disabled
                        sx={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Select a role
                      </MenuItem>
                      <MenuItem
                        value="admin"
                        sx={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Admin
                      </MenuItem>
                      <MenuItem
                        value="proposal_engineer"
                        sx={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Proposal Engineer
                      </MenuItem>
                      <MenuItem
                        value="client"
                        sx={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Client
                      </MenuItem>
                    </Select>
                  </FormControl>
                </DialogContent>
                <DialogActions
                  sx={{
                    bgcolor: "#1e1e1e",
                    borderTop: "1px solid #4b5563",
                    py: 2.5,
                    px: 4,
                    justifyContent: "space-between",
                  }}
                >
                  <CancelButton
                    onClick={handleModalClose}
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      color: "#ef4444",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      "&:hover": { color: "#dc2626" },
                    }}
                  >
                    Cancel
                  </CancelButton>
                  <CTAButton
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      bgcolor: "#3b82f6",
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      px: 4,
                      py: 1.5,
                      borderRadius: "8px",
                      "&:hover": { bgcolor: "#2563eb" },
                      "&.Mui-disabled": {
                        bgcolor: "#4b5563",
                        color: "#9ca3af",
                      },
                    }}
                  >
                    {modalAction === "add" ? "Create" : "Save"}
                  </CTAButton>
                </DialogActions>
              </Dialog>
              <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                maxWidth="xs"
                fullWidth
                sx={{
                  "& .MuiDialog-paper": {
                    bgcolor: "#1e1e1e",
                    borderRadius: "16px",
                    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.10)",
                    fontFamily: "'Inter', sans-serif",
                  },
                }}
              >
                <DialogTitle
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: "#3b82f6",
                    bgcolor: "#1e1e1e",
                    py: 2.5,
                    px: 4,
                    fontSize: "1.25rem",
                    textAlign: "center",
                    borderBottom: "1px solid #4b5563",
                  }}
                >
                  Confirm Deletion
                </DialogTitle>
                <DialogContent sx={{ py: 4, px: 4, bgcolor: "#1e1e1e" }}>
                  <Typography
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      color: "#ffffff",
                      fontSize: "1rem",
                      fontWeight: 500,
                      paddingTop: 2,
                    }}
                  >
                    {confirmMessage}
                  </Typography>
                </DialogContent>
                <DialogActions
                  sx={{
                    bgcolor: "#1e1e1e",
                    borderTop: "1px solid #4b5563",
                    py: 2.5,
                    px: 4,
                    justifyContent: "space-between",
                  }}
                >
                  <CancelButton
                    onClick={handleCloseConfirmDialog}
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      color: "#ef4444",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      "&:hover": { color: "#dc2626" },
                    }}
                  >
                    Cancel
                  </CancelButton>
                  <CTAButton
                    variant="contained"
                    onClick={handleConfirmAction}
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      bgcolor: "#ef4444",
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      px: 4,
                      py: 1.5,
                      borderRadius: "8px",
                      "&:hover": { bgcolor: "#dc2626" },
                    }}
                  >
                    Delete
                  </CTAButton>
                </DialogActions>
              </Dialog>
            </Container>
          </ErrorBoundary>
        </main>
      </Box>
    </Fade>
  );
};

export default UsersAdmin;
