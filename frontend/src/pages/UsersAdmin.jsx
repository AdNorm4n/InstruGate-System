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
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
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
      setUsers(usersResponse.data || []);
      setFilteredUsers(usersResponse.data || []);
      setUserRole(userResponse.data.role || "client");
    } catch (err) {
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
        return multiplier * (fieldA - fieldB);
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
    if (!modalData.role) {
      setError("Role is required.");
      return;
    }
    if (!modalData.email.includes("@") || !modalData.email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const access = localStorage.getItem("access");
      const endpoint =
        modalAction === "edit" ? `/api/users/${modalData.id}/` : "/api/users/";
      const method = modalAction === "edit" ? "patch" : "post";

      const payload = {
        username: modalData.username,
        email: modalData.email,
        company: modalData.company || null,
        role: modalData.role,
        first_name: modalData.first_name || "",
        last_name: modalData.last_name || "",
      };

      await api({
        method,
        url: endpoint,
        data: payload,
        headers: { Authorization: `Bearer ${access}` },
      });

      setSuccess(
        modalAction === "add"
          ? "User created successfully!"
          : "User updated successfully!"
      );
      fetchData();
      handleModalClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        Object.values(err.response?.data)?.[0] ||
        err.message;
      setError(`Failed to save user: ${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      setError("You do not have permission to delete users.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    try {
      const access = localStorage.getItem("access");
      await api.delete(`/api/users/${id}/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setSuccess("User deleted successfully!");
      fetchData();
    } catch (err) {
      setError(
        `Failed to delete user: ${err.response?.data?.detail || err.message}`
      );
    }
  };

  // Helper function to convert field names to title case
  const toTitleCase = (str) => {
    return str
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
      }}
    >
      <Navbar userRole={userRole} />
      <DrawerHeader />
      <main style={{ flex: 1 }}>
        <Container maxWidth="xl" sx={{ py: 4, mt: 12 }}>
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#000000",
              fontFamily: "Helvetica, sans-serif",
              textTransform: "uppercase",
              letterSpacing: 0,
              mb: 6,
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
            <Alert severity="success" onClose={() => setSuccess("")}>
              {success}
            </Alert>
          </Snackbar>
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError("")}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          </Snackbar>
          {loading ? (
            <Box sx={{ textAlign: "center", mt: "20vh" }}>
              <CircularProgress size={48} sx={{ color: "#1976d2" }} />
              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  color: "#000000",
                }}
              >
                Loading users...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
                <TextField
                  label="Search by Username, Email or Company"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ flex: 1, minWidth: "200px" }}
                  variant="outlined"
                  size="small"
                />
                <FormControl sx={{ minWidth: "150px" }} size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="proposal_engineer">
                      Proposal Engineer
                    </MenuItem>
                    <MenuItem value="client">Client</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openAddModal}
                  disabled={userRole !== "admin"}
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#115293" },
                    textTransform: "none",
                    px: 3,
                  }}
                >
                  Add User
                </Button>
              </Box>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  "&:hover": { boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)" },
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      {["id", "username", "email", "company", "role"].map(
                        (field) => (
                          <TableCell
                            key={field}
                            sx={{
                              fontWeight: "bold",
                              fontFamily: "Helvetica, sans-serif",
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
                              {toTitleCase(field)}
                            </TableSortLabel>
                          </TableCell>
                        )
                      )}
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Helvetica, sans-serif",
                          bgcolor: "#f5f5f5",
                        }}
                      >
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography
                            sx={{ fontFamily: "Helvetica, sans-serif", py: 2 }}
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
                                sx={{ fontFamily: "Helvetica, sans-serif" }}
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
                              sx={{ color: "#d32f2f" }}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
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
                    fontFamily: "Helvetica, sans-serif",
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
                    sx={{ fontFamily: "Helvetica, sans-serif" }}
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
                    sx={{ fontFamily: "Helvetica, sans-serif" }}
                  />
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
                    sx={{ fontFamily: "Helvetica, sans-serif" }}
                  />
                  <TextField
                    label=" BEFORE
Last Name"
                    value={modalData.last_name}
                    onChange={(e) =>
                      setModalData({ ...modalData, last_name: e.target.value })
                    }
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    size="small"
                    sx={{ fontFamily: "Helvetica, sans-serif" }}
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
                    size="small"
                    sx={{ fontFamily: "Helvetica, sans-serif" }}
                  />
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={modalData.role}
                      onChange={(e) =>
                        setModalData({ ...modalData, role: e.target.value })
                      }
                      label="Role"
                      required
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="proposal_engineer">
                        Proposal Engineer
                      </MenuItem>
                      <MenuItem value="client">Client</MenuItem>
                    </Select>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={handleModalClose}
                    sx={{
                      fontFamily: "Helvetica, sans-serif",
                      textTransform: "none",
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: "#1976d2",
                      "&:hover": { bgcolor: "#115293" },
                      fontFamily: "Helvetica, sans-serif",
                      textTransform: "none",
                    }}
                  >
                    {modalAction === "add" ? "Create" : "Save"}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Container>
      </main>
    </Box>
  );
};

export default UsersAdmin;
