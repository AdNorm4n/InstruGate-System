import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import ErrorBoundary from "../components/ErrorBoundary";
import { UserContext } from "../contexts/UserContext";
import api from "../api";
import "../styles/QuotationsAdmin.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme?.mixins?.toolbar,
}));

const ToolCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#1e1e1e",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.10)",
  },
  fontFamily: "'Inter', sans-serif",
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: theme.spacing(1.5, 3),
  fontWeight: 500,
  fontSize: "0.9rem",
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

const QuotationsAdmin = () => {
  const navigate = useNavigate();
  const { userRole, loading: contextLoading } = useContext(UserContext);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const access = localStorage.getItem("access");
      if (!access) {
        throw new Error(
          "Please log in to access the quotations management page."
        );
      }
      const headers = { Authorization: `Bearer ${access}` };
      const endpoints = [
        "/api/admin/quotations/",
        "/api/instruments/",
        "/api/users/list/",
      ];
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          api.get(endpoint, { headers }).catch((err) => ({
            error: err.response?.data?.detail || err.message,
            data: [],
          }))
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
      setFilteredData({ quotations: newData.quotations });

      if (responses.some((res) => res.error)) {
        setError("Some data could not be loaded. Please try again.");
      }
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (contextLoading) return;

    if (!userRole) {
      setError("Please log in to access the quotations management page.");
      navigate("/login");
      return;
    }

    if (userRole !== "admin") {
      setError("You do not have permission to access this page.");
      navigate("/");
      return;
    }

    fetchData();
  }, [contextLoading, userRole, navigate, fetchData]);

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

    setFilteredData({ quotations: filtered });
  }, [searchTerm, statusFilter, data, sortConfig]);

  const getField = useCallback(
    (obj, field) => {
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
        [
          "submitted_at",
          "approved_at",
          "rejected_at",
          "updated_at",
          "emailed_at",
        ].includes(field)
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
    },
    [data.users]
  );

  const handleSort = useCallback((field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const openViewModal = useCallback(
    async (item) => {
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
    },
    [userRole]
  );

  const handleModalClose = useCallback(() => {
    setOpenModal(false);
    setModalData({});
    setQuotationItems([]);
    setModalAction("view");
    setError("");
  }, []);

  const handleOpenConfirmDialog = useCallback((action, message) => {
    setConfirmAction(() => action);
    setConfirmMessage(message);
    setOpenConfirmDialog(true);
  }, []);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setConfirmAction(null);
    setConfirmMessage("");
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (confirmAction) {
      await confirmAction();
    }
    handleCloseConfirmDialog();
  }, [confirmAction]);

  const handleDelete = useCallback(
    (id) => {
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
    },
    [userRole, fetchData]
  );

  const handleQuotationAction = useCallback(
    async (id, action, remarks = "") => {
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
        handleModalClose();
      } catch (err) {
        setError(
          `Failed to ${action} quotation: ${
            err.response?.data?.detail || err.message
          }`
        );
      }
    },
    [userRole, fetchData, handleModalClose]
  );

  const handleOpenRemarksDialog = useCallback((remarks) => {
    setSelectedRemarks(remarks || "N/A");
    setOpenRemarksDialog(true);
  }, []);

  const handleCloseRemarksDialog = useCallback(() => {
    setOpenRemarksDialog(false);
    setSelectedRemarks("");
  }, []);

  const truncateRemarks = useCallback((text, maxLength = 50) => {
    if (text === "N/A" || !text) return text;
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  }, []);

  const handleRejectSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (modalData.id && modalData.remarks) {
        handleQuotationAction(modalData.id, "reject", modalData.remarks);
      } else {
        setError("Remarks are required.");
      }
    },
    [modalData, handleQuotationAction]
  );

  const renderTable = useCallback(() => {
    const tab = tabs[0];
    const items = filteredData.quotations || [];

    return (
      <Box sx={{ overflowX: "auto", borderRadius: "12px", p: 4 }}>
        <Table
          sx={{
            minWidth: 1200,
            borderCollapse: "separate",
            borderSpacing: "0 12px",
            bgcolor: "#1a1a1a",
          }}
        >
          <TableHead>
            <TableRow>
              {tab.fields.map((field) => (
                <TableCell
                  key={field}
                  sx={{
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    bgcolor: "#252525",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    py: 2.5,
                    px: 4,
                    border: "none",
                    minWidth:
                      field === "id" ? 100 : field === "remarks" ? 250 : 180,
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
                      sortConfig.field === field ? sortConfig.direction : "asc"
                    }
                    onClick={() => handleSort(field)}
                    sx={{
                      color: "#ffffff",
                      "&:hover": { color: "#3b82f6" },
                      "&.Mui-active": { color: "#3b82f6" },
                      "& .MuiTableSortLabel-icon": {
                        color: "#ffffff !important",
                      },
                    }}
                  >
                    {tab.displayFields[field] || field.toUpperCase()}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  bgcolor: "#252525",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  py: 2.5,
                  px: 4,
                  border: "none",
                  minWidth: 150,
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
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tab.fields.length + 1}
                  align="center"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#9ca3af",
                    py: 5,
                    fontSize: "1rem",
                    border: "none",
                    bgcolor: "#1a1a1a",
                  }}
                >
                  No quotations found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    bgcolor: "#2d2d2d",
                    "&:hover": { bgcolor: "#333333" },
                    transition: "background-color 0.2s",
                    borderRadius: "8px",
                  }}
                >
                  {tab.fields.map((field) => (
                    <TableCell
                      key={field}
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.9rem",
                        color: "#ffffff",
                        py: 2.5,
                        px: 4,
                        border: "none",
                        minWidth:
                          field === "id"
                            ? 100
                            : field === "remarks"
                            ? 250
                            : 180,
                        textAlign: field === "id" ? "center" : "left",
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
                              : "#ffffff",
                          fontWeight: 500,
                        }),
                        ...(field === "remarks" && {
                          maxWidth: 250,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }),
                      }}
                    >
                      {field === "remarks" &&
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
                              color: "#3b82f6",
                              textDecoration: "underline",
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "0.85rem",
                              "&:hover": { color: "#2563eb" },
                            }}
                          >
                            View More
                          </Link>
                        </span>
                      ) : (
                        getField(item, field)
                      )}
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{ py: 2.5, px: 4, border: "none", minWidth: 150 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          onClick={() => openViewModal(item)}
                          disabled={!tab.permissions.includes(userRole)}
                          sx={{ "&:hover": { bgcolor: "#3b82f61a" } }}
                          title="View Quotation"
                        >
                          <Visibility
                            sx={{ fontSize: "1.3rem", color: "#2563eb" }}
                          />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(item.id)}
                          disabled={!tab.permissions.includes(userRole)}
                          sx={{ "&:hover": { bgcolor: "#ef44441a" } }}
                          title="Delete Quotation"
                        >
                          <Delete
                            sx={{ fontSize: "1.3rem", color: "#d6393a" }}
                          />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {tab.actions.includes("approve") && (
                          <IconButton
                            onClick={() =>
                              handleQuotationAction(item.id, "approve")
                            }
                            disabled={item.status === "approved"}
                            sx={{ "&:hover": { bgcolor: "#22c55e1a" } }}
                            title="Approve Quotation"
                          >
                            <Check
                              sx={{ fontSize: "1.3rem", color: "#388e3c" }}
                            />
                          </IconButton>
                        )}
                        {tab.actions.includes("reject") && (
                          <IconButton
                            onClick={() => {
                              setModalData({ id: item.id, remarks: "" });
                              setModalAction("reject");
                              setOpenModal(true);
                            }}
                            disabled={item.status === "rejected"}
                            sx={{ "&:hover": { bgcolor: "#ef44441a" } }}
                            title="Reject Quotation"
                          >
                            <Close
                              sx={{ fontSize: "1.3rem", color: "#d32f2f" }}
                            />
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
      </Box>
    );
  }, [
    filteredData.quotations,
    sortConfig,
    userRole,
    getField,
    truncateRemarks,
    handleSort,
    openViewModal,
    handleDelete,
    handleQuotationAction,
    handleOpenRemarksDialog,
  ]);

  const renderModalContent = useCallback(() => {
    const tab = tabs[0];

    if (modalAction === "reject") {
      return (
        <Box
          component="form"
          onSubmit={handleRejectSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3, py: 3 }}
          id="reject-form"
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              color: "#ffffff",
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
              sx: { fontFamily: "'Inter', sans-serif", color: "#ffffff" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3b82f6",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3b82f6",
                },
              },
            }}
          />
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          Quotation Details
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <TextField
            label="Created By"
            value={getField(modalData, "created_by.first_name")}
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: { fontFamily: "'Inter', sans-serif", color: "#ffffff" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
              },
            }}
          />
          <TextField
            label="Company"
            value={modalData.company || ""}
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: { fontFamily: "'Inter', sans-serif", color: "#ffffff" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
              },
            }}
          />
          <TextField
            label="Project Name"
            value={modalData.project_name || ""}
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputLabelProps={{
              sx: { fontFamily: "'Inter', sans-serif", color: "#ffffff" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
              },
            }}
          />
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
              sx: { fontFamily: "'Inter', sans-serif", color: "#ffffff" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
              },
            }}
          />
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
              sx: { fontFamily: "'Inter', sans-serif", color: "#ffffff" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
              },
            }}
          />
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
              sx: { fontFamily: "'Inter', sans-serif", color: "#ffffff" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
              },
            }}
          />
        </Box>
        <Divider sx={{ my: 3, bgcolor: "#4b5563" }} />
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          Submitted Instruments
        </Typography>
        {quotationItems.length > 0 ? (
          <Table size="small" sx={{ bgcolor: "#2d2d2d", borderRadius: "8px" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    bgcolor: "#252525",
                    fontSize: "0.9rem",
                    py: 2,
                    px: 3,
                  }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    bgcolor: "#252525",
                    fontSize: "0.9rem",
                    py: 2,
                    px: 3,
                  }}
                >
                  Product Code
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    bgcolor: "#252525",
                    fontSize: "0.9rem",
                    py: 2,
                    px: 3,
                  }}
                >
                  Instrument
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    bgcolor: "#252525",
                    fontSize: "0.9rem",
                    py: 2,
                    px: 3,
                  }}
                >
                  Quantity
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    bgcolor: "#252525",
                    fontSize: "0.9rem",
                    py: 2,
                    px: 3,
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
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                        py: 2,
                        px: 3,
                      }}
                    >
                      {item.id}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                        py: 2,
                        px: 3,
                      }}
                    >
                      {item.product_code || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                        py: 2,
                        px: 3,
                      }}
                    >
                      {instrument?.name || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                        py: 2,
                        px: 3,
                      }}
                    >
                      {item.quantity || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                        py: 2,
                        px: 3,
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
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              color: "#ffffff",
              fontSize: "0.95rem",
            }}
          >
            No instruments submitted for this quotation.
          </Typography>
        )}
      </Box>
    );
  }, [
    modalAction,
    modalData,
    quotationItems,
    data.instruments,
    getField,
    handleRejectSubmit,
  ]);

  if (contextLoading || loading) {
    return (
      <Fade in>
        <Box sx={{ minHeight: "100vh", bgcolor: "#000000" }}>
          <Container maxWidth="lg">
            <Box
              sx={{
                maxWidth: 400,
                mx: "auto",
                textAlign: "center",
                mt: 8,
                p: 4,
                borderRadius: "16px",
                bgcolor: "#1e1e1e",
              }}
            >
              <CircularProgress size={48} sx={{ color: "#3b82f6", mb: 2 }} />
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                Loading data...
              </Typography>
            </Box>
          </Container>
        </Box>
      </Fade>
    );
  }

  if (error && !success) {
    return (
      <Fade in>
        <Box sx={{ minHeight: "100vh", bgcolor: "#000000" }}>
          <Container maxWidth="lg">
            <ToolCard sx={{ maxWidth: 800, mx: "auto", mt: 8 }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: "8px",
                  fontFamily: "'Inter', sans-serif",
                  bgcolor: "#1e1e1e",
                  color: "#ffffff",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    color: "#ffffff",
                  }}
                >
                  {error}
                </Typography>
              </Alert>
            </ToolCard>
          </Container>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          bgcolor: "#000000",
          minHeight: "100vh",
          width: "100%",
        }}
        className="quotations-admin-page"
      >
        <DrawerHeader />
        <main
          style={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
        >
          <ErrorBoundary>
            <Container
              maxWidth="xl"
              sx={{
                py: 8,
                px: { xs: 3, sm: 6 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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
                  mb: 6,
                  fontSize: { xs: "1.8rem", md: "2.5rem" },
                  letterSpacing: "-0.02em",
                  position: "relative",
                  "&:after": {
                    content: '""',
                    display: "block",
                    width: 80,
                    height: "4px",
                    bgcolor: "#3b82f6",
                    position: "absolute",
                    bottom: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderRadius: "2px",
                  },
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
                    fontFamily: "'Inter', sans-serif",
                    bgcolor: "#28a745",
                    color: "#ffffff",
                    "& .MuiAlert-icon": { color: "#ffffff" },
                    "& .MuiAlert-action svg": { fill: "#ffffff" },
                  }}
                >
                  {success}
                </Alert>
              </Snackbar>
              <Snackbar
                open={!!error && !success}
                autoHideDuration={6000}
                onClose={() => setError("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity="error"
                  onClose={() => setError("")}
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    bgcolor: "#d6393a",
                    color: "#ffffff",
                    "& .MuiAlert-icon": { color: "#ffffff" },
                    "& .MuiAlert-action svg": { fill: "#ffffff" },
                  }}
                >
                  {error}
                </Alert>
              </Snackbar>
              <ToolCard sx={{ width: "100%" }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 3,
                    mb: 5,
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                  }}
                >
                  <TextField
                    label={`Search by ${tabs[0].searchFields.join(" or ")}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      flex: 1,
                      minWidth: { xs: "100%", sm: 300 },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontFamily: "'Inter', sans-serif",
                        bgcolor: "#252525",
                        color: "#ffffff",
                        "& fieldset": { borderColor: "#4b5563" },
                        "&:hover fieldset": { borderColor: "#3b82f6" },
                        "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                      },
                      "& .MuiInputLabel-root": {
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                        "&.Mui-focused": { color: "#3b82f6" },
                      },
                    }}
                    variant="outlined"
                    size="medium"
                  />
                  <FormControl
                    sx={{
                      flex: 1,
                      minWidth: { xs: "100%", sm: 300 },
                    }}
                    size="medium"
                  >
                    <InputLabel
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#ffffff",
                        "&.Mui-focused": { color: "#3b82f6" },
                      }}
                    >
                      Status
                    </InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                      sx={{
                        borderRadius: "8px",
                        fontFamily: "'Inter', sans-serif",
                        bgcolor: "#252525",
                        color: "#ffffff",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#4b5563",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3b82f6",
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: "#1a1a1a",
                            "& .MuiMenuItem-root": {
                              fontFamily: "'Inter', sans-serif",
                              color: "#ffffff",
                              "&:hover": { bgcolor: "#333333" },
                              "&.Mui-selected": { bgcolor: "#3b82f61a" },
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
                        All Statuses
                      </MenuItem>
                      {["pending", "approved", "rejected", "submitted"].map(
                        (status) => (
                          <MenuItem
                            key={status}
                            value={status}
                            sx={{
                              fontFamily: "'Inter', sans-serif",
                              color: "#ffffff",
                            }}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </Box>
                {renderTable()}
              </ToolCard>
            </Container>
            <Dialog
              open={openModal}
              onClose={handleModalClose}
              maxWidth={modalAction === "reject" ? "sm" : "lg"}
              fullWidth
              sx={{
                "& .MuiDialog-paper": {
                  bgcolor: "#1e1e1e",
                  borderRadius: "16px",
                },
              }}
            >
              <DialogTitle
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: "#3b82f6",
                  bgcolor: "#1e1e1e",
                  py: 3,
                  px: 5,
                  fontSize: "1.3rem",
                  borderBottom: "1px solid #4b5563",
                }}
              >
                {modalAction === "reject"
                  ? "Reject Quotation"
                  : "View Quotation"}
              </DialogTitle>
              <DialogContent sx={{ py: 5, px: 5, bgcolor: "#1e1e1e" }}>
                {renderModalContent()}
              </DialogContent>
              <DialogActions
                sx={{
                  bgcolor: "#1e1e1e",
                  borderTop: "1px solid #4b5563",
                  py: 3,
                  px: 5,
                }}
              >
                <CancelButton onClick={handleModalClose}>Close</CancelButton>
                {modalAction === "reject" && (
                  <CTAButton type="submit" form="reject-form">
                    Submit
                  </CTAButton>
                )}
              </DialogActions>
            </Dialog>
            <Dialog
              open={openRemarksDialog}
              onClose={handleCloseRemarksDialog}
              maxWidth="sm"
              fullWidth
              sx={{
                "& .MuiDialog-paper": {
                  bgcolor: "#1e1e1e",
                  borderRadius: "16px",
                },
              }}
            >
              <DialogTitle
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: "#3b82f6",
                  bgcolor: "#1e1e1e",
                  py: 3,
                  px: 5,
                  fontSize: "1.3rem",
                  borderBottom: "1px solid #4b5563",
                }}
              >
                Full Remarks
              </DialogTitle>
              <DialogContent sx={{ py: 5, px: 5, bgcolor: "#1e1e1e" }}>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    whiteSpace: "pre-wrap",
                    fontSize: "0.95rem",
                  }}
                >
                  {selectedRemarks}
                </Typography>
              </DialogContent>
              <DialogActions
                sx={{
                  bgcolor: "#1e1e1e",
                  borderTop: "1px solid #4b5563",
                  py: 3,
                  px: 5,
                }}
              >
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
              sx={{
                "& .MuiDialog-paper": {
                  bgcolor: "#1e1e1e",
                  borderRadius: "16px",
                },
              }}
            >
              <DialogTitle
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: "#ffffff",
                  bgcolor: "#1e1e1e",
                  py: 3,
                  px: 5,
                  fontSize: "1.3rem",
                  borderBottom: "1px solid #4b5563",
                }}
              >
                Confirm Deletion
              </DialogTitle>
              <DialogContent sx={{ py: 5, px: 5, bgcolor: "#1e1e1e" }}>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                  }}
                >
                  {confirmMessage}
                </Typography>
              </DialogContent>
              <DialogActions
                sx={{
                  bgcolor: "#1e1e1e",
                  borderTop: "1px solid #4b5563",
                  py: 3,
                  px: 5,
                }}
              >
                <CancelButton onClick={handleCloseConfirmDialog}>
                  Cancel
                </CancelButton>
                <CTAButton
                  sx={{ bgcolor: "#d6393a", "&:hover": { bgcolor: "#b02b2b" } }}
                  onClick={handleConfirmAction}
                >
                  Delete
                </CTAButton>
              </DialogActions>
            </Dialog>
          </ErrorBoundary>
        </main>
      </Box>
    </Fade>
  );
};

export default QuotationsAdmin;
