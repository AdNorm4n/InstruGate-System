import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Paper,
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
import Navbar from "../components/Navbar";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/UsersAdmin.css";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ToolCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif !important",
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
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
  "& .MuiCircularProgress-root": {
    color: "#ffffff",
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  color: "#d6393a",
  fontFamily: "Helvetica, sans-serif !important",
  textTransform: "none",
  "&:hover": {
    color: "#b71c1c",
  },
}));

const UsersAdmin = () => {
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
  const [userRole, setUserRole] = useState("");
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
      const [usersResponse, userResponse] = await Promise.all([
        api.get("/api/users/list/", { headers }),
        api.get("/api/users/me/", { headers }),
      ]);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setFilteredUsers(
        Array.isArray(usersResponse.data) ? usersResponse.data : []
      );
      setUserRole(userResponse.data?.role || "client");
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
    <Fade in timeout={800}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <ErrorBoundary>
            <Container maxWidth="xl" sx={{ py: 6, mt: 8 }}>
              <Typography
                variant="h6"
                align="center"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#000000",
                  fontFamily: "Helvetica, sans-serif !important",
                  textTransform: "uppercase",
                  mb: 4,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                  textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                Users Management
              </Typography>
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
                    fontFamily: "Helvetica, sans-serif !important",
                    width: "100%",
                    color: "white",
                    backgroundColor: "#28a745",
                    "& .MuiAlert-icon": {
                      color: "white !important",
                      svg: { fill: "white !important" },
                    },
                    "& .MuiAlert-action": {
                      color: "white !important",
                      svg: { fill: "white !important" },
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
                  sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                >
                  {error}
                </Alert>
              </Snackbar>
              {loading ? (
                <Box sx={{ textAlign: "center", mt: "20vh" }}>
                  <ToolCard
                    sx={{ maxWidth: 400, mx: "auto", textAlign: "center" }}
                  >
                    <CircularProgress size={48} sx={{ color: "#1976d2" }} />
                    <Typography
                      variant="h6"
                      sx={{
                        mt: 2,
                        fontFamily: "Helvetica, sans-serif !important",
                        fontWeight: "bold",
                        color: "#000000",
                      }}
                    >
                      Loading users...
                    </Typography>
                  </ToolCard>
                </Box>
              ) : (
                <ToolCard>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 4,
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        flex: 1,
                        minWidth: "200px",
                      }}
                    >
                      <TextField
                        label="Search by Username, Email or Company"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1, minWidth: "200px" }}
                        variant="outlined"
                        size="small"
                        InputLabelProps={{
                          sx: {
                            fontFamily: "Helvetica, sans-serif !important",
                          },
                        }}
                        InputProps={{
                          sx: {
                            fontFamily: "Helvetica, sans-serif !important",
                          },
                        }}
                      />
                      <FormControl sx={{ minWidth: "150px" }} size="small">
                        <InputLabel
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          Role
                        </InputLabel>
                        <Select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          label="Role"
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          <MenuItem
                            value=""
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            All Roles
                          </MenuItem>
                          <MenuItem
                            value="admin"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Admin
                          </MenuItem>
                          <MenuItem
                            value="proposal_engineer"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Proposal Engineer
                          </MenuItem>
                          <MenuItem
                            value="client"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Client
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <CTAButton
                      variant="contained"
                      startIcon={<Add sx={{ color: "white" }} />}
                      onClick={openAddModal}
                      disabled={userRole !== "admin"}
                    >
                      Add User
                    </CTAButton>
                  </Box>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["id", "username", "email", "company", "role"].map(
                          (field) => (
                            <TableCell
                              key={field}
                              sx={{
                                fontWeight: "bold",
                                fontFamily: "Helvetica, sans-serif !important",
                                bgcolor: "#f5f5f5",
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
                              >
                                {field === "id" ? "ID" : toTitleCase(field)}
                              </TableSortLabel>
                            </TableCell>
                          )
                        )}
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            fontFamily: "Helvetica, sans-serif !important",
                            bgcolor: "#f5f5f5",
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
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Helvetica, sans-serif !important",
                                py: 2,
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
                              "&:hover": { bgcolor: "#e3f2fd" },
                              transition: "background-color 0.2s",
                            }}
                          >
                            {["id", "username", "email", "company", "role"].map(
                              (field) => (
                                <TableCell
                                  key={field}
                                  sx={{
                                    fontFamily:
                                      "Helvetica, sans-serif !important",
                                  }}
                                >
                                  {user[field] || "N/A"}
                                </TableCell>
                              )
                            )}
                            <TableCell>
                              <IconButton
                                onClick={() => openEditModal(user)}
                                disabled={userRole !== "admin"}
                                sx={{ color: "#1976d2" }}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(user.id)}
                                disabled={userRole !== "admin"}
                                sx={{ color: "#d6393a" }}
                              >
                                <Delete sx={{ color: "#d32f2f" }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ToolCard>
              )}
              <Dialog
                open={openModal}
                onClose={handleModalClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                  component: "form",
                  onSubmit: (e) => {
                    e.preventDefault();
                    handleSave();
                  },
                  sx: { borderRadius: 2, p: 2 },
                }}
              >
                <DialogTitle
                  sx={{
                    fontFamily: "Helvetica, sans-serif !important",
                    fontWeight: "bold",
                    color: "#1976d2",
                  }}
                >
                  {modalAction === "add" ? "Add New User" : "Edit User"}
                </DialogTitle>
                <DialogContent>
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
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
                    }}
                    InputProps={{
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
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
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
                    }}
                    InputProps={{
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
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
                            fontFamily: "Helvetica, sans-serif !important",
                          },
                        }}
                        InputProps={{
                          sx: {
                            fontFamily: "Helvetica, sans-serif !important",
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
                            fontFamily: "Helvetica, sans-serif !important",
                          },
                        }}
                        InputProps={{
                          sx: {
                            fontFamily: "Helvetica, sans-serif !important",
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
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
                    }}
                    InputProps={{
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
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
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
                    }}
                    InputProps={{
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
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
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
                    }}
                    InputProps={{
                      sx: { fontFamily: "Helvetica, sans-serif !important" },
                    }}
                  />
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel
                      sx={{ fontFamily: "Helvetica, sans-serif !important" }}
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
                      sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                    >
                      <MenuItem
                        value=""
                        disabled
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Select a role
                      </MenuItem>
                      <MenuItem
                        value="admin"
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Admin
                      </MenuItem>
                      <MenuItem
                        value="proposal_engineer"
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Proposal Engineer
                      </MenuItem>
                      <MenuItem
                        value="client"
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Client
                      </MenuItem>
                    </Select>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <CancelButton onClick={handleModalClose}>Cancel</CancelButton>
                  <CTAButton type="submit" variant="contained">
                    {modalAction === "add" ? "Create" : "Save"}
                  </CTAButton>
                </DialogActions>
              </Dialog>
              <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, p: 2 } }}
              >
                <DialogTitle
                  sx={{
                    fontFamily: "Helvetica, sans-serif !important",
                    fontWeight: "bold",
                    color: "#d6393a",
                  }}
                >
                  Confirm Deletion
                </DialogTitle>
                <DialogContent>
                  <Typography
                    sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                  >
                    {confirmMessage}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <CancelButton onClick={handleCloseConfirmDialog}>
                    Cancel
                  </CancelButton>
                  <Button
                    variant="contained"
                    onClick={handleConfirmAction}
                    sx={{
                      bgcolor: "#d6393a",
                      "&:hover": { bgcolor: "#b71c1c" },
                      fontFamily: "Helvetica, sans-serif !important",
                    }}
                  >
                    Delete
                  </Button>
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
