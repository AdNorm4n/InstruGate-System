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
  Divider,
  Fade,
  Link,
} from "@mui/material";
import { Visibility, Delete, Check, Close } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/quotationsadmin.css";

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

const CancelButton = styled(Button)(({ theme }) => ({
  color: "#d6393a",
  fontFamily: "Helvetica, sans-serif !important",
  textTransform: "none",
  "&:hover": {
    color: "#b71c1c",
  },
}));

const QuotationsAdmin = () => {
  const [data, setData] = useState({
    quotations: [],
    instruments: [],
    users: [],
  });
  const [filteredData, setFilteredData] = useState({
    quotations: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalAction, setModalAction] = useState("view");
  const [userRole, setUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: "id",
    direction: "asc",
  });
  const [quotationItems, setQuotationItems] = useState([]);
  const [openRemarksDialog, setOpenRemarksDialog] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const tabs = [
    {
      name: "Quotations",
      endpoint: "/api/admin/quotations/",
      fields: [
        "id",
        "created_by.first_name",
        "company",
        "project_name",
        "status",
        "submitted_at",
        "approved_at",
        "rejected_at",
        "remarks",
      ],
      writableFields: ["created_by_id", "company", "project_name"],
      searchFields: ["company", "project_name"],
      lookups: { created_by_id: "users" },
      displayFields: {
        id: "ID",
        "created_by.first_name": "Created By",
        company: "Company",
        project_name: "Project Name",
        status: "Status",
        submitted_at: "Submitted At",
        approved_at: "Approved At",
        rejected_at: "Rejected At",
        remarks: "Remarks",
      },
      permissions: ["admin"],
      actions: ["approve", "reject"],
    },
  ];

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
      const endpoints = [
        "/api/admin/quotations/",
        "/api/instruments/",
        "/api/users/list/",
        "/api/users/me/",
      ];
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          api.get(endpoint, { headers }).catch((err) => {
            setError(
              `Error fetching ${endpoint}: ${
                err.response?.data?.detail || err.message
              }`
            );
            return {
              error: err.response?.data?.detail || err.message,
              data: [],
            };
          })
        )
      );

      const newData = {
        quotations: Array.isArray(responses[0].data) ? responses[0].data : [],
        instruments: Array.isArray(responses[1].data) ? responses[1].data : [],
        users: Array.isArray(responses[2].data)
          ? responses[2].data.map((user) => ({
              ...user,
              company: user.company || "N/A",
              first_name: user.first_name || "Unknown User",
            }))
          : [],
      };

      setData(newData);
      setFilteredData({
        quotations: newData.quotations,
      });
      setUserRole(responses[3].data?.role || "client");

      if (responses.some((res) => res.error)) {
        setError("Some data could not be loaded. Please try again.");
      }
    } catch (err) {
      setError(
        `Error loading data: ${err.response?.data?.detail || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const tab = tabs[0];
    let filtered = [...data.quotations];

    if (searchTerm && tab.searchFields.length > 0) {
      filtered = filtered.filter((item) =>
        tab.searchFields.some((field) =>
          getField(item, field)
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    filtered.sort((a, b) => {
      const fieldA = getField(a, sortConfig.field) || "";
      const fieldB = getField(b, sortConfig.field) || "";
      const multiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.field === "id") {
        return multiplier * ((a?.id || 0) - (b?.id || 0));
      }
      return multiplier * fieldA.toString().localeCompare(fieldB.toString());
    });

    setFilteredData((prev) => ({
      ...prev,
      quotations: filtered,
    }));
  }, [searchTerm, statusFilter, data, sortConfig]);

  const getField = (obj, field) => {
    if (!obj) return "N/A";
    if (field.includes(".")) {
      const [key, subKey] = field.split(".");
      if (key === "created_by" && subKey === "first_name") {
        const userId =
          obj.created_by_id || (obj.created_by && obj.created_by.id);
        if (userId) {
          const user = data.users.find((u) => u.id === userId);
          return user?.first_name || "Unknown User";
        }
        return obj.created_by?.first_name || "Unknown User";
      }
      return obj[key]?.[subKey] || "N/A";
    }
    if (
      field === "submitted_at" ||
      field === "approved_at" ||
      field === "rejected_at" ||
      field === "updated_at" ||
      field === "emailed_at"
    ) {
      return obj[field] ? new Date(obj[field]).toLocaleString() : "N/A";
    }
    if (field === "status") {
      const status = obj[field] || "N/A";
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
    if (field === "total_price") {
      return typeof obj[field] === "number"
        ? `RM${obj[field].toLocaleString("en-MY", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "N/A";
    }
    return obj[field] || "N/A";
  };

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openViewModal = async (item) => {
    if (!tabs[0].permissions.includes(userRole)) {
      setError("You do not have permission to view quotations.");
      return;
    }
    setModalAction("view");
    setModalData({ ...item });
    setQuotationItems([]);
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };
      const quotationItemsResponse = await api.get(
        "/api/admin/quotation-items/",
        {
          headers,
          params: { quotation_id: item.id },
        }
      );
      const items = Array.isArray(quotationItemsResponse.data)
        ? quotationItemsResponse.data.filter(
            (qItem) => qItem.quotation_id === item.id
          )
        : [];
      setQuotationItems(items);
    } catch (err) {
      setError(
        `Failed to load quotation items: ${
          err.response?.data?.detail || err.message
        }`
      );
    }
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({});
    setQuotationItems([]);
    setError("");
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
    if (!tabs[0].permissions.includes(userRole)) {
      setError("You do not have permission to delete quotations.");
      return;
    }
    handleOpenConfirmDialog(async () => {
      try {
        const access = localStorage.getItem("access");
        await api.delete(`${tabs[0].endpoint}${id}/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        setSuccess("Quotation deleted successfully!");
        fetchData();
      } catch (err) {
        setError(
          `Failed to delete quotation: ${
            err.response?.data?.detail || err.message
          }`
        );
      }
    }, "Are you sure you want to delete this quotation?");
  };

  const handleQuotationAction = async (id, action, remarks = "") => {
    if (!tabs[0].permissions.includes(userRole)) {
      setError("You do not have permission to perform this action.");
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const payload = {
        status: action === "approve" ? "approved" : "rejected",
      };
      if (action === "reject") {
        if (!remarks) {
          setError("Remarks are required when rejecting a quotation.");
          return;
        }
        payload.remarks = remarks;
      }
      await api.patch(`/api/admin/quotations/${id}/`, payload, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setSuccess(
        `Quotation ${
          action === "approve" ? "approved" : "rejected"
        } successfully!`
      );
      fetchData();
    } catch (err) {
      setError(
        `Failed to ${action} quotation: ${
          err.response?.data?.detail || err.message
        }`
      );
    }
  };

  const handleOpenRemarksDialog = (remarks) => {
    setSelectedRemarks(remarks || "N/A");
    setOpenRemarksDialog(true);
  };

  const handleCloseRemarksDialog = () => {
    setOpenRemarksDialog(false);
    setSelectedRemarks("");
  };

  const truncateRemarks = (text, maxLength = 50) => {
    if (text === "N/A" || !text) return text;
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  };

  const renderTable = () => {
    const tab = tabs[0];
    const items = filteredData.quotations || [];

    return (
      <Table>
        <TableHead>
          <TableRow>
            {tab.fields.map((field) => (
              <TableCell
                key={field}
                sx={{
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif !important",
                  bgcolor: "#f5f5f5",
                  ...(field === "remarks" && { width: "200px" }),
                }}
              >
                <TableSortLabel
                  active={sortConfig.field === field}
                  direction={
                    sortConfig.field === field ? sortConfig.direction : "asc"
                  }
                  onClick={() => handleSort(field)}
                >
                  {tab.displayFields[field] || field.toUpperCase()}
                </TableSortLabel>
              </TableCell>
            ))}
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
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={tab.fields.length + 1}
                align="center"
                sx={{ fontFamily: "Helvetica, sans-serif !important" }}
              >
                <Typography sx={{ py: 2 }}>No quotations found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                sx={{
                  "&:hover": { bgcolor: "#e3f2fd" },
                  transition: "background-color 0.2s",
                }}
              >
                {tab.fields.map((field) => (
                  <TableCell
                    key={field}
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      ...(field === "status" && {
                        color:
                          getField(item, field) === "Approved"
                            ? "#388e3c"
                            : getField(item, field) === "Rejected"
                            ? "#d32f2f"
                            : getField(item, field) === "Pending"
                            ? "#fbc02d"
                            : getField(item, field) === "Submitted"
                            ? "#1976d2"
                            : "inherit",
                        fontWeight: field === "status" ? "bold" : "normal",
                      }),
                      ...(field === "remarks" && {
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }),
                    }}
                  >
                    {field === "remarks" ? (
                      getField(item, field).length > 50 ? (
                        <span>
                          {truncateRemarks(getField(item, field))}
                          <Link
                            component="button"
                            onClick={() =>
                              handleOpenRemarksDialog(getField(item, field))
                            }
                            sx={{
                              ml: 1,
                              color: "#1976d2",
                              textDecoration: "underline",
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            View More
                          </Link>
                        </span>
                      ) : (
                        getField(item, field)
                      )
                    ) : (
                      getField(item, field)
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        onClick={() => openViewModal(item)}
                        disabled={!tab.permissions.includes(userRole)}
                        sx={{ color: "#1976d2" }}
                        title="View Quotation"
                      >
                        <Visibility sx={{ color: "#1976d2" }} />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(item.id)}
                        disabled={!tab.permissions.includes(userRole)}
                        sx={{ color: "#d32f2f" }}
                        title="Delete Quotation"
                      >
                        <Delete sx={{ color: "#d32f2f" }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {tab.actions.includes("approve") && (
                        <IconButton
                          onClick={() =>
                            handleQuotationAction(item.id, "approve")
                          }
                          disabled={item.status === "approved"}
                          sx={{ color: "#388e3c" }}
                          title="Approve Quotation"
                        >
                          <Check sx={{ color: "#388e3c" }} />
                        </IconButton>
                      )}
                      {tab.actions.includes("reject") && (
                        <IconButton
                          onClick={() => {
                            setModalData({ id: item.id });
                            setModalAction("reject");
                            setOpenModal(true);
                          }}
                          disabled={item.status === "rejected"}
                          sx={{ color: "#d32f2f" }}
                          title="Reject Quotation"
                        >
                          <Close sx={{ color: "#d32f2f" }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  const renderModalContent = () => {
    const tab = tabs[0];

    if (modalAction === "reject") {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "Helvetica, sans-serif !important",
              fontWeight: "bold",
              color: "#000000",
            }}
          >
            Reject Quotation
          </Typography>
          <TextField
            label="Remarks"
            value={modalData.remarks || ""}
            onChange={(e) =>
              setModalData({ ...modalData, remarks: e.target.value })
            }
            fullWidth
            variant="outlined"
            size="small"
            multiline
            rows={4}
            required
            InputLabelProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                fontWeight: 500,
              },
            }}
            InputProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              },
            }}
          />
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: "Helvetica, sans-serif !important",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Quotation Details
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* Created By */}
          <TextField
            label="Created By"
            value={getField(modalData, "created_by.first_name")}
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                fontWeight: 500,
              },
            }}
            InputProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              },
            }}
          />
          {/* Company */}
          <TextField
            label="Company"
            value={modalData.company || ""}
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                fontWeight: 500,
              },
            }}
            InputProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              },
            }}
          />
          {/* Project Name */}
          <TextField
            label="Project Name"
            value={modalData.project_name || ""}
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                fontWeight: 500,
              },
            }}
            InputProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              },
            }}
          />
          {/* Updated At */}
          <TextField
            label="Updated At"
            value={
              modalData.updated_at
                ? new Date(modalData.updated_at).toLocaleString()
                : "N/A"
            }
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                fontWeight: 500,
              },
            }}
            InputProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              },
            }}
          />
          {/* Emailed At */}
          <TextField
            label="Emailed At"
            value={
              modalData.emailed_at
                ? new Date(modalData.emailed_at).toLocaleString()
                : "N/A"
            }
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                fontWeight: 500,
              },
            }}
            InputProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              },
            }}
          />
          {/* Total Quotation Price */}
          <TextField
            label="Total Quotation Price (RM)"
            value={
              typeof modalData.total_price === "number"
                ? `RM${modalData.total_price.toLocaleString("en-MY", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "N/A"
            }
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                fontWeight: 500,
              },
            }}
            InputProps={{
              sx: {
                fontFamily: "Helvetica, sans-serif !important",
                color: "#000000",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              },
            }}
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontFamily: "Helvetica, sans-serif !important",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Submitted Instruments
        </Typography>
        {quotationItems.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif !important",
                  }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif !important",
                  }}
                >
                  Product Code
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif !important",
                  }}
                >
                  Instrument
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif !important",
                  }}
                >
                  Quantity
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif !important",
                  }}
                >
                  Price (RM)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotationItems.map((item) => {
                const instrument = data.instruments.find(
                  (inst) => inst.id === item.instrument_id
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell
                      sx={{
                        fontFamily: "Helvetica, sans-serif !important",
                      }}
                    >
                      {item.id}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Helvetica, sans-serif !important",
                      }}
                    >
                      {item.product_code || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Helvetica, sans-serif !important",
                      }}
                    >
                      {instrument?.name || "Unknown Instrument"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Helvetica, sans-serif !important",
                      }}
                    >
                      {item.quantity || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Helvetica, sans-serif !important",
                      }}
                    >
                      {typeof item.total_price === "number"
                        ? `RM${item.total_price.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Typography sx={{ fontFamily: "Helvetica, sans-serif !important" }}>
            No instruments submitted for this quotation.
          </Typography>
        )}
      </Box>
    );
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
        className="quotations-admin-page"
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
                Quotations Management
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
                    <CircularProgress size={48} sx={{ color: "#d4a028" }} />
                    <Typography
                      variant="h6"
                      sx={{
                        mt: 2,
                        fontFamily: "Helvetica, sans-serif !important",
                        fontWeight: "bold",
                        color: "#000000",
                      }}
                    >
                      Loading data...
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
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        flex: 1,
                        width: "100%",
                      }}
                    >
                      <TextField
                        label={`Search by ${tabs[0].searchFields
                          .map((field) => tabs[0].displayFields[field])
                          .join(" or ")}`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 2, minWidth: "300px" }}
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
                      <FormControl
                        sx={{ flex: 1, minWidth: "200px" }}
                        size="small"
                      >
                        <InputLabel
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          Status
                        </InputLabel>
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          label="Status"
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
                            All Statuses
                          </MenuItem>
                          <MenuItem
                            value="pending"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Pending
                          </MenuItem>
                          <MenuItem
                            value="approved"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Approved
                          </MenuItem>
                          <MenuItem
                            value="rejected"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Rejected
                          </MenuItem>
                          <MenuItem
                            value="submitted"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Submitted
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  {renderTable()}
                </ToolCard>
              )}
              <Dialog
                open={openModal}
                onClose={handleModalClose}
                maxWidth={modalAction === "reject" ? "sm" : "lg"}
                fullWidth
                PaperProps={{
                  component: "form",
                  onSubmit: (e) => {
                    e.preventDefault();
                    if (modalAction === "reject") {
                      handleQuotationAction(
                        modalData.id,
                        "reject",
                        modalData.remarks
                      );
                      handleModalClose();
                    }
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
                  {modalAction === "reject"
                    ? "Reject Quotation"
                    : "View Quotation"}
                </DialogTitle>
                <DialogContent>{renderModalContent()}</DialogContent>
                <DialogActions>
                  <CancelButton onClick={handleModalClose}>Close</CancelButton>
                  {modalAction === "reject" && (
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        bgcolor: "#d6393a",
                        "&:hover": { bgcolor: "#b71c1c" },
                        fontFamily: "Helvetica, sans-serif !important",
                      }}
                    >
                      Submit
                    </Button>
                  )}
                </DialogActions>
              </Dialog>
              <Dialog
                open={openRemarksDialog}
                onClose={handleCloseRemarksDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
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
                  Full Remarks
                </DialogTitle>
                <DialogContent>
                  <Typography
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedRemarks}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <CancelButton onClick={handleCloseRemarksDialog}>
                    Close
                  </CancelButton>
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

export default QuotationsAdmin;
