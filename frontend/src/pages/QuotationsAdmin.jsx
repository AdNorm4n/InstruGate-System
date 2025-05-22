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
  Tabs,
  Tab,
} from "@mui/material";
import { Add, Edit, Delete, Check, Close } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import ErrorBoundary from "../components/ErrorBoundary";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ENTITY_TYPES = {
  QUOTATIONS: "Quotations",
  QUOTATION_ITEMS: "Quotation Items",
  QUOTATION_ITEM_SELECTIONS: "Quotation Item Selections",
  QUOTATION_ITEM_ADDONS: "Quotation Item AddOns",
};

const QuotationsAdmin = () => {
  const [data, setData] = useState({
    quotations: [],
    quotationitems: [],
    quotationitemselections: [],
    quotationitemaddons: [],
    instruments: [],
    fieldoptions: [],
    addons: [],
    users: [],
  });
  const [filteredData, setFilteredData] = useState({
    quotations: [],
    quotationitems: [],
    quotationitemselections: [],
    quotationitemaddons: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalType, setModalType] = useState("");
  const [modalAction, setModalAction] = useState("add");
  const [userRole, setUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: "id",
    direction: "asc",
  });
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      name: ENTITY_TYPES.QUOTATIONS,
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
      writableFields: [
        "created_by_id",
        "company",
        "project_name",
        "status",
        "remarks",
      ],
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
      actions: ["approve", "reject"],
    },
    {
      name: ENTITY_TYPES.QUOTATION_ITEMS,
      endpoint: "/api/admin/quotation-items/",
      fields: [
        "id",
        "quotation.id",
        "product_code",
        "quantity",
        "instrument.name",
      ],
      writableFields: [
        "quotation_id",
        "product_code",
        "quantity",
        "instrument_id",
      ],
      searchFields: ["product_code"],
      lookups: { quotation_id: "quotations", instrument_id: "instruments" },
      displayFields: {
        id: "ID",
        "quotation.id": "Quotation ID",
        product_code: "Product Code",
        quantity: "Quantity",
        "instrument.name": "Instrument",
      },
    },
    {
      name: ENTITY_TYPES.QUOTATION_ITEM_SELECTIONS,
      endpoint: "/api/admin/quotation-item-selections/",
      fields: ["id", "quotation_item.id", "field_option.label"],
      writableFields: ["quotation_item_id", "field_option_id"],
      searchFields: [],
      lookups: {
        quotation_item_id: "quotationitems",
        field_option_id: "fieldoptions",
      },
      displayFields: {
        id: "ID",
        "quotation_item.id": "Quotation Item ID",
        "field_option.label": "Field Option",
      },
    },
    {
      name: ENTITY_TYPES.QUOTATION_ITEM_ADDONS,
      endpoint: "/api/admin/quotation-item-addons/",
      fields: ["id", "quotation_item.id", "addon.label"],
      writableFields: ["quotation_item_id", "addon_id"],
      searchFields: [],
      lookups: { quotation_item_id: "quotationitems", addon_id: "addons" },
      displayFields: {
        id: "ID",
        "quotation_item.id": "Quotation Item ID",
        "addon.label": "AddOn",
      },
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
        "/api/admin/quotation-items/",
        "/api/admin/quotation-item-selections/",
        "/api/admin/quotation-item-addons/",
        "/api/instruments/",
        "/api/field-options/",
        "/api/addons/",
        "/api/users/list/",
        "/api/users/me/",
      ];
      const responses = await Promise.all(
        endpoints.map((endpoint, index) =>
          api.get(endpoint, { headers }).catch((err) => {
            console.error(
              `Error fetching ${endpoint}:`,
              err.response?.data || err.message
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
        quotationitems: Array.isArray(responses[1].data)
          ? responses[1].data
          : [],
        quotationitemselections: Array.isArray(responses[2].data)
          ? responses[2].data
          : [],
        quotationitemaddons: Array.isArray(responses[3].data)
          ? responses[3].data
          : [],
        instruments: Array.isArray(responses[4].data) ? responses[4].data : [],
        fieldoptions: Array.isArray(responses[5].data) ? responses[5].data : [],
        addons: Array.isArray(responses[6].data) ? responses[6].data : [],
        users: Array.isArray(responses[7].data) ? responses[7].data : [],
      };
      console.log("Fetched Data:", newData); // Debug log
      setData(newData);
      setFilteredData({
        quotations: newData.quotations,
        quotationitems: newData.quotationitems,
        quotationitemselections: newData.quotationitemselections,
        quotationitemaddons: newData.quotationitemaddons,
      });
      setUserRole(responses[8].data?.role || "client");

      if (responses.some((res) => res.error)) {
        setError("Some data could not be loaded. Please try again.");
      }
    } catch (err) {
      console.error("fetchData Error:", err, err.response?.data);
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
    const tab = tabs[activeTab];
    const key = tab.name.toLowerCase().replace(" ", "");
    let filtered = [...(data[key] || [])];
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        tab.searchFields.some((field) =>
          getField(item, field)
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }
    if (tab.name === ENTITY_TYPES.QUOTATIONS && statusFilter) {
      filtered = filtered.filter((item) => item?.status === statusFilter);
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
      [key]: filtered,
    }));
  }, [searchTerm, statusFilter, data, sortConfig, activeTab]);

  const getField = (obj, field) => {
    if (!obj) return "";
    if (field.includes(".")) {
      const [key, subKey] = field.split(".");
      return obj[key]?.[subKey] || "";
    }
    return obj[field] || "";
  };

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openAddModal = () => {
    if (userRole !== "admin") {
      setError("You do not have permission to add items.");
      return;
    }
    setModalAction("add");
    setModalData({});
    setModalType(tabs[activeTab].name);
    setOpenModal(true);
  };

  const openEditModal = (item) => {
    if (userRole !== "admin") {
      setError("You do not have permission to edit items.");
      return;
    }
    setModalAction("edit");
    setModalData({ ...item });
    setModalType(tabs[activeTab].name);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({});
    setModalType("");
    setError("");
  };

  const handleSave = async () => {
    if (userRole !== "admin") {
      setError("You do not have permission to save items.");
      return;
    }

    const tab = tabs.find((t) => t.name === modalType);
    const requiredFields = tab.writableFields.filter(
      (f) => !["status", "remarks"].includes(f)
    );
    for (const field of requiredFields) {
      if (!modalData[field] && modalData[field] !== 0) {
        setError(
          `${field
            .replace("_id", "")
            .replace("_", " ")
            .toUpperCase()} is required.`
        );
        return;
      }
    }

    try {
      const access = localStorage.getItem("access");
      const endpoint =
        modalAction === "edit"
          ? `${tab.endpoint}${modalData.id}/`
          : tab.endpoint;
      const method = modalAction === "edit" ? "patch" : "post";
      const payload = { ...modalData };

      await api({
        method,
        url: endpoint,
        data: payload,
        headers: { Authorization: `Bearer ${access}` },
      });

      setSuccess(
        `${modalType} ${
          modalAction === "add" ? "created" : "updated"
        } successfully!`
      );
      fetchData();
      handleModalClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        Object.values(err.response?.data)?.[0] ||
        err.message;
      setError(`Failed to save ${modalType}: ${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      setError("You do not have permission to delete items.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete this ${tabs[activeTab].name
          .toLowerCase()
          .replace("s", "")}?`
      )
    ) {
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const tab = tabs[activeTab];
      await api.delete(`${tab.endpoint}${id}/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setSuccess(`${tab.name} deleted successfully!`);
      fetchData();
    } catch (err) {
      setError(
        `Failed to delete ${tab.name}: ${
          err.response?.data?.detail || err.message
        }`
      );
    }
  };

  const handleQuotationAction = async (id, action, remarks = "") => {
    if (userRole !== "admin") {
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
      await api.patch(`/api/quotations/review/${id}/`, payload, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setSuccess(`Quotation ${action}d successfully!`);
      fetchData();
    } catch (err) {
      setError(
        `Failed to ${action} quotation: ${
          err.response?.data?.detail || err.message
        }`
      );
    }
  };

  const renderModalContent = () => {
    const tab = tabs.find((t) => t.name === modalType);
    if (!tab)
      return <Alert severity="error">Invalid entity type: {modalType}</Alert>;

    return (
      <>
        {tab.writableFields.map((field) => {
          if (tab.lookups && tab.lookups[field]) {
            const lookupKey = tab.lookups[field];
            const lookupItems = data[lookupKey] || [];
            return (
              <FormControl fullWidth key={field} margin="normal" size="small">
                <InputLabel>
                  {field.replace("_id", "").replace("_", " ").toUpperCase()}
                </InputLabel>
                <Select
                  value={modalData[field] || ""}
                  onChange={(e) =>
                    setModalData({ ...modalData, [field]: e.target.value })
                  }
                  required
                >
                  {lookupItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name || item.label || item.first_name || item.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          if (field === "status") {
            return (
              <FormControl fullWidth key={field} margin="normal" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={modalData[field] || "pending"}
                  onChange={(e) =>
                    setModalData({ ...modalData, [field]: e.target.value })
                  }
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            );
          }
          return (
            <TextField
              key={field}
              label={field.replace("_id", "").replace("_", " ").toUpperCase()}
              value={modalData[field] || ""}
              onChange={(e) =>
                setModalData({ ...modalData, [field]: e.target.value })
              }
              fullWidth
              margin="normal"
              type={field.includes("quantity") ? "number" : "text"}
              variant="outlined"
              size="small"
              multiline={field === "remarks"}
              rows={field === "remarks" ? 4 : 1}
              required={!["remarks"].includes(field)}
            />
          );
        })}
      </>
    );
  };

  const renderTable = () => {
    const tab = tabs[activeTab];
    const items = filteredData[tab.name.toLowerCase().replace(" ", "")] || [];

    return (
      <Table>
        <TableHead>
          <TableRow>
            {tab.fields.map((field) => (
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
                fontFamily: "Helvetica, sans-serif",
                bgcolor: "#f5f5f5",
              }}
            >
              ACTIONS
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={tab.fields.length + 1} align="center">
                <Typography sx={{ fontFamily: "Helvetica, sans-serif", py: 2 }}>
                  No {tab.name.toLowerCase()} found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) =>
              item && item.id ? ( // Ensure item is valid
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
                      sx={{ fontFamily: "Helvetica, sans-serif" }}
                    >
                      {field.includes(".")
                        ? getField(item, field) || "N/A"
                        : field === "submitted_at" ||
                          field === "approved_at" ||
                          field === "rejected_at"
                        ? item[field]
                          ? new Date(item[field]).toLocaleString()
                          : "N/A"
                        : item[field] || "N/A"}
                    </TableCell>
                  ))}
                  <TableCell>
                    <IconButton
                      onClick={() => openEditModal(item)}
                      disabled={userRole !== "admin"}
                      sx={{ color: "#1976d2" }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      disabled={userRole !== "admin"}
                      sx={{ color: "#d32f2f" }}
                    >
                      <Delete />
                    </IconButton>
                    {tab.name === ENTITY_TYPES.QUOTATIONS &&
                      userRole === "admin" && (
                        <>
                          <IconButton
                            onClick={() =>
                              handleQuotationAction(item.id, "approve")
                            }
                            disabled={item.status === "approved"}
                            sx={{ color: "#388e3c" }}
                          >
                            <Check />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              const remarks = prompt(
                                "Enter remarks for rejection:"
                              );
                              if (remarks)
                                handleQuotationAction(
                                  item.id,
                                  "reject",
                                  remarks
                                );
                            }}
                            disabled={item.status === "rejected"}
                            sx={{ color: "#d32f2f" }}
                          >
                            <Close />
                          </IconButton>
                        </>
                      )}
                  </TableCell>
                </TableRow>
              ) : null
            )
          )}
        </TableBody>
      </Table>
    );
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
        <ErrorBoundary>
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
              Quotations Management
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
                  Loading data...
                </Typography>
              </Box>
            ) : (
              <>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 4 }}
                >
                  {tabs.map((tab, index) => (
                    <Tab key={tab.name} label={tab.name} value={index} />
                  ))}
                </Tabs>
                <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
                  <TextField
                    label={`Search ${tabs[activeTab].name}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, minWidth: "200px" }}
                    variant="outlined"
                    size="small"
                  />
                  {tabs[activeTab].name === ENTITY_TYPES.QUOTATIONS && (
                    <FormControl sx={{ minWidth: "200px" }} size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  )}
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
                    Add {tabs[activeTab].name.slice(0, -1)}
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
                  {renderTable()}
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
                    {modalAction === "add"
                      ? `Add ${modalType}`
                      : `Edit ${modalType}`}
                  </DialogTitle>
                  <DialogContent>{renderModalContent()}</DialogContent>
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
        </ErrorBoundary>
      </main>
    </Box>
  );
};

export default QuotationsAdmin;
