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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  Check,
  Close,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import ErrorBoundary from "./ErrorBoundary";

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
  });
  const [filteredQuotations, setFilteredQuotations] = useState([]);
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
  const [nestedData, setNestedData] = useState([]);

  const tabs = [
    {
      name: ENTITY_TYPES.QUOTATIONS,
      endpoint: "/api/quotations/review/",
      fields: [
        "id",
        "created_by_first_name",
        "company",
        "project_name",
        "status",
        "submitted_at",
        "approved_at",
        "rejected_at",
        "remarks",
      ],
      writableFields: ["company", "project_name", "items"],
      permissions: ["admin", "proposal_engineer", "client"],
      searchFields: ["company", "project_name"],
      actions: ["approve", "reject"],
      nestedFields: [
        {
          name: "items",
          fields: ["product_code", "quantity", "instrument.name"],
          writableFields: ["product_code", "quantity", "instrument_id"],
          lookups: { instrument_id: "instruments" },
          nested: [
            {
              name: "selections",
              fields: ["field_option.label"],
              writableFields: ["field_option_id"],
              lookups: { field_option_id: "fieldoptions" },
            },
            {
              name: "addons",
              fields: ["addon.label"],
              writableFields: ["addon_id"],
              lookups: { addon_id: "addons" },
            },
          ],
        },
      ],
    },
    {
      name: ENTITY_TYPES.QUOTATION_ITEMS,
      endpoint: "/api/quotation-items/",
      fields: ["id", "product_code", "quantity", "instrument.name"],
      writableFields: [
        "product_code",
        "quantity",
        "instrument_id",
        "quotation_id",
      ],
      permissions: ["admin", "proposal_engineer"],
      lookups: { instrument_id: "instruments", quotation_id: "quotations" },
      searchFields: ["product_code"],
    },
    {
      name: ENTITY_TYPES.QUOTATION_ITEM_SELECTIONS,
      endpoint: "/api/quotation-item-selections/",
      fields: ["id", "quotation_item.id", "field_option.label"],
      writableFields: ["quotation_item_id", "field_option_id"],
      permissions: ["admin", "proposal_engineer"],
      lookups: {
        quotation_item_id: "quotationitems",
        field_option_id: "fieldoptions",
      },
      searchFields: [],
    },
    {
      name: ENTITY_TYPES.QUOTATION_ITEM_ADDONS,
      endpoint: "/api/quotation-item-addons/",
      fields: ["id", "quotation_item.id", "addon.label"],
      writableFields: ["quotation_item_id", "addon_id"],
      permissions: ["admin", "proposal_engineer"],
      lookups: {
        quotation_item_id: "quotationitems",
        addon_id: "addons",
      },
      searchFields: [],
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const access = localStorage.getItem("access");
      if (!access) {
        setError("Please log in to access the admin panel.");
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${access}` };
      const endpoints = [
        "/api/quotations/review/",
        "/api/quotation-items/",
        "/api/quotation-item-selections/",
        "/api/quotation-item-addons/",
        "/api/instruments/",
        "/api/field-options/",
        "/api/addons/",
        "/api/users/me/",
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
        quotations: responses[0].data || [],
        quotationitems: responses[1].data || [],
        quotationitemselections: responses[2].data || [],
        quotationitemaddons: responses[3].data || [],
        instruments: responses[4].data || [],
        fieldoptions: responses[5].data || [],
        addons: responses[6].data || [],
      };
      console.log("Fetched Quotation Items:", newData.quotationitems);
      setData(newData);
      setFilteredQuotations(newData.quotations);
      setUserRole(responses[7].data.role || "client");

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
    let filtered = [...data.quotations];
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        tabs[0].searchFields.some((field) =>
          item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    filtered.sort((a, b) => {
      const getField = (obj, field) => {
        if (field.includes(".")) {
          const [key, subKey] = field.split(".");
          return obj[key]?.[subKey] || "";
        }
        return obj[field] || "";
      };
      const fieldA = getField(a, sortConfig.field);
      const fieldB = getField(b, sortConfig.field);
      const multiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.field === "id") {
        return multiplier * (fieldA - fieldB);
      }
      return multiplier * fieldA.toString().localeCompare(fieldB.toString());
    });
    setFilteredQuotations(filtered);
  }, [searchTerm, statusFilter, data.quotations, sortConfig]);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openAddModal = (type, parent = {}) => {
    if (!tabs.find((t) => t.name === type)?.permissions.includes(userRole)) {
      setError(`You do not have permission to add ${type}.`);
      return;
    }
    setModalType(type);
    setModalAction("add");
    setModalData({ ...parent });
    setNestedData([]);
    setOpenModal(true);
  };

  const openEditModal = (type, item) => {
    if (!tabs.find((t) => t.name === type)?.permissions.includes(userRole)) {
      setError(`You do not have permission to edit ${type}.`);
      return;
    }
    setModalType(type);
    setModalAction("edit");
    setModalData({ ...item });
    setNestedData(item.items || []);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({});
    setNestedData([]);
    setError("");
  };

  const handleSave = async () => {
    if (
      !tabs.find((t) => t.name === modalType)?.permissions.includes(userRole)
    ) {
      setError(`You do not have permission to save ${modalType}.`);
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const tab = tabs.find((t) => t.name === modalType);
      const endpoint =
        modalAction === "edit"
          ? `${tab.endpoint}${modalData.id}/`
          : tab.endpoint;
      const method = modalAction === "edit" ? "patch" : "post";
      const payload = { ...modalData };

      if (modalType === ENTITY_TYPES.QUOTATIONS && nestedData.length > 0) {
        payload.items = nestedData;
      } else if (modalType === ENTITY_TYPES.QUOTATION_ITEMS) {
        payload.quotation_id = modalData.quotation_id;
      }

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

  const handleDelete = async (id, type) => {
    if (!tabs.find((t) => t.name === type)?.permissions.includes(userRole)) {
      setError(`You do not have permission to delete ${type}.`);
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete this ${type
          .toLowerCase()
          .replace("s", "")}?`
      )
    ) {
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const tab = tabs.find((t) => t.name === type);
      await api.delete(`${tab.endpoint}${id}/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setSuccess(`${type} deleted successfully!`);
      fetchData();
    } catch (err) {
      setError(
        `Failed to delete ${type}: ${err.response?.data?.detail || err.message}`
      );
    }
  };

  const handleQuotationAction = async (id, action, remarks = "") => {
    if (!["admin", "proposal_engineer"].includes(userRole)) {
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

  const addNestedItem = () => {
    setNestedData([
      ...nestedData,
      {
        product_code: "",
        quantity: 1,
        instrument_id: "",
        selections: [],
        addons: [],
      },
    ]);
  };

  const updateNestedItem = (index, field, value) => {
    const updated = [...nestedData];
    updated[index][field] = value;
    setNestedData(updated);
  };

  const addNestedSubItem = (itemIndex, subField) => {
    const updated = [...nestedData];
    updated[itemIndex][subField].push({ [`${subField.slice(0, -1)}_id`]: "" });
    setNestedData(updated);
  };

  const updateNestedSubItem = (itemIndex, subField, subIndex, value) => {
    const updated = [...nestedData];
    updated[itemIndex][subField][subIndex][`${subField.slice(0, -1)}_id`] =
      value;
    setNestedData(updated);
  };

  const renderModalContent = () => {
    const tab = tabs.find((t) => t.name === modalType);
    if (!tab) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">Invalid entity type: {modalType}</Alert>
        </Box>
      );
    }

    return (
      <>
        {tab.writableFields.map((field) => {
          if (field === "items") return null;
          if (tab.lookups && tab.lookups[field]) {
            const lookupKey = tab.lookups[field];
            const lookupItems = data[lookupKey] || [];
            return (
              <FormControl fullWidth key={field} sx={{ mt: 2 }}>
                <InputLabel>
                  {field.replace("_id", "").replace("_", " ").toUpperCase()}
                </InputLabel>
                <Select
                  value={modalData[field] || ""}
                  onChange={(e) =>
                    setModalData({ ...modalData, [field]: e.target.value })
                  }
                >
                  {lookupItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name || item.label || item.id}
                    </MenuItem>
                  ))}
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
              type={
                field.includes("quantity") || field.includes("order")
                  ? "number"
                  : "text"
              }
              variant="outlined"
              sx={{ fontFamily: "Helvetica, sans-serif" }}
            />
          );
        })}
        {tab.nestedFields && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontFamily: "Helvetica, sans-serif" }}
            >
              Items
            </Typography>
            {nestedData.map((item, index) => (
              <Box key={index} sx={{ border: 1, p: 2, mb: 2, borderRadius: 2 }}>
                {tab.nestedFields[0].writableFields.map((field) => {
                  if (
                    tab.nestedFields[0].lookups &&
                    tab.nestedFields[0].lookups[field]
                  ) {
                    const lookupKey = tab.nestedFields[0].lookups[field];
                    const lookupItems = data[lookupKey] || [];
                    return (
                      <FormControl fullWidth key={field} sx={{ mt: 2 }}>
                        <InputLabel>
                          {field
                            .replace("_id", "")
                            .replace("_", " ")
                            .toUpperCase()}
                        </InputLabel>
                        <Select
                          value={item[field] || ""}
                          onChange={(e) =>
                            updateNestedItem(index, field, e.target.value)
                          }
                        >
                          {lookupItems.map((opt) => (
                            <MenuItem key={opt.id} value={opt.id}>
                              {opt.name || opt.label || opt.id}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    );
                  }
                  return (
                    <TextField
                      key={field}
                      label={field
                        .replace("_id", "")
                        .replace("_", " ")
                        .toUpperCase()}
                      value={item[field] || ""}
                      onChange={(e) =>
                        updateNestedItem(index, field, e.target.value)
                      }
                      fullWidth
                      margin="normal"
                      type={field === "quantity" ? "number" : "text"}
                      variant="outlined"
                      sx={{ fontFamily: "Helvetica, sans-serif" }}
                    />
                  );
                })}
                {tab.nestedFields[0].nested.map((sub) => (
                  <Box key={sub.name} sx={{ ml: 2, mt: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontFamily: "Helvetica, sans-serif" }}
                    >
                      {sub.name.charAt(0).toUpperCase() + sub.name.slice(1)}
                    </Typography>
                    {item[sub.name].map((subItem, subIndex) => {
                      const lookupKey = sub.lookups[sub.writableFields[0]];
                      const lookupItems = data[lookupKey] || [];
                      return (
                        <FormControl fullWidth key={subIndex} sx={{ mt: 1 }}>
                          <InputLabel>
                            {sub.writableFields[0]
                              .replace("_id", "")
                              .toUpperCase()}
                          </InputLabel>
                          <Select
                            value={subItem[`${sub.name.slice(0, -1)}_id`] || ""}
                            onChange={(e) =>
                              updateNestedSubItem(
                                index,
                                sub.name,
                                subIndex,
                                e.target.value
                              )
                            }
                          >
                            {lookupItems.map((opt) => (
                              <MenuItem key={opt.id} value={opt.id}>
                                {opt.label || opt.name || opt.id}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    })}
                    <Button
                      onClick={() => addNestedSubItem(index, sub.name)}
                      startIcon={<Add />}
                      sx={{
                        mt: 1,
                        bgcolor: "#1976d2",
                        "&:hover": { bgcolor: "#115293" },
                        color: "#fff",
                      }}
                    >
                      Add {sub.name.slice(0, -1)}
                    </Button>
                  </Box>
                ))}
              </Box>
            ))}
            <Button
              onClick={addNestedItem}
              startIcon={<Add />}
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#115293" },
                color: "#fff",
              }}
            >
              Add Item
            </Button>
          </Box>
        )}
      </>
    );
  };

  const renderQuotationTable = (quotations) => {
    const tab = tabs[0];
    return (
      <Table>
        <TableHead>
          <TableRow>
            {tab.fields.map((field) => (
              <TableCell
                key={field}
                sx={{ fontWeight: "bold", fontFamily: "Helvetica, sans-serif" }}
              >
                <TableSortLabel
                  active={sortConfig.field === field}
                  direction={
                    sortConfig.field === field ? sortConfig.direction : "asc"
                  }
                  onClick={() => handleSort(field)}
                >
                  {field.replace("_", " ").toUpperCase()}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell
              sx={{ fontWeight: "bold", fontFamily: "Helvetica, sans-serif" }}
            >
              ACTIONS
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quotations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={tab.fields.length + 1} align="center">
                <Typography sx={{ fontFamily: "Helvetica, sans-serif", py: 2 }}>
                  No quotations found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            quotations.map((item) => (
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
                    {field === "created_by_first_name"
                      ? item.created_by_first_name || "N/A"
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
                    onClick={() => openEditModal(ENTITY_TYPES.QUOTATIONS, item)}
                    disabled={!tab.permissions.includes(userRole)}
                    sx={{ color: "#1976d2" }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      handleDelete(item.id, ENTITY_TYPES.QUOTATIONS)
                    }
                    disabled={!tab.permissions.includes(userRole)}
                    sx={{ color: "#d32f2f" }}
                  >
                    <Delete />
                  </IconButton>
                  {["admin", "proposal_engineer"].includes(userRole) && (
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
                            handleQuotationAction(item.id, "reject", remarks);
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
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  const renderSubTable = (type, items, parentId) => {
    const tab = tabs.find((t) => t.name === type);
    if (!tab) return null;

    console.log(`Filtered ${type} for parentId ${parentId}:`, items);

    return (
      <Table>
        <TableHead>
          <TableRow>
            {tab.fields.map((field) => (
              <TableCell
                key={field}
                sx={{ fontWeight: "bold", fontFamily: "Helvetica, sans-serif" }}
              >
                {field
                  .replace("instrument.", "")
                  .replace("field_option.", "")
                  .replace("addon.", "")
                  .toUpperCase()}
              </TableCell>
            ))}
            <TableCell
              sx={{ fontWeight: "bold", fontFamily: "Helvetica, sans-serif" }}
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
                  No {type.toLowerCase()} found. Try adding a new item or check
                  the database for associated items.
                </Typography>
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
                    sx={{ fontFamily: "Helvetica, sans-serif" }}
                  >
                    {field.includes("instrument.name")
                      ? data.instruments.find((i) => i.id === item.instrument)
                          ?.name || "N/A"
                      : field.includes("field_option.label")
                      ? data.fieldoptions.find(
                          (f) => f.id === item.field_option
                        )?.label || "N/A"
                      : field.includes("addon.label")
                      ? data.addons.find((a) => a.id === item.addon)?.label ||
                        "N/A"
                      : field.includes(".id")
                      ? item[field.split(".")[0]]?.id || "N/A"
                      : item[field.split(".").pop()] || "N/A"}
                  </TableCell>
                ))}
                <TableCell>
                  <IconButton
                    onClick={() => openEditModal(type, item)}
                    disabled={!tab.permissions.includes(userRole)}
                    sx={{ color: "#1976d2" }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(item.id, type)}
                    disabled={!tab.permissions.includes(userRole)}
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
    );
  };

  return (
    <ErrorBoundary>
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
                  Loading quotations...
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
                  <TextField
                    label="Search by Company or Project Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, minWidth: "200px" }}
                    variant="outlined"
                    size="small"
                  />
                  <FormControl sx={{ minWidth: "150px" }} size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => openAddModal(ENTITY_TYPES.QUOTATIONS)}
                    disabled={!tabs[0].permissions.includes(userRole)}
                    sx={{
                      bgcolor: "#1976d2",
                      "&:hover": { bgcolor: "#115293" },
                      textTransform: "none",
                      px: 3,
                      color: "#fff",
                    }}
                  >
                    Add Quotation
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
                  {filteredQuotations.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Typography
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          color: "#555",
                        }}
                      >
                        No quotations found. Try adjusting the search or status
                        filter, or add a new quotation.
                      </Typography>
                    </Box>
                  ) : (
                    filteredQuotations.map((quotation) => (
                      <Accordion key={quotation.id}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography
                            sx={{
                              fontWeight: "bold",
                              fontFamily: "Helvetica, sans-serif",
                            }}
                          >
                            Quotation {quotation.id} - {quotation.project_name}{" "}
                            ({quotation.company})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 2 }}>
                            <Button
                              variant="outlined"
                              startIcon={<Add />}
                              onClick={() =>
                                openAddModal(ENTITY_TYPES.QUOTATION_ITEMS, {
                                  quotation_id: quotation.id,
                                })
                              }
                              disabled={!tabs[1].permissions.includes(userRole)}
                              sx={{
                                mb: 2,
                                color: "#1976d2",
                                borderColor: "#1976d2",
                              }}
                            >
                              Add Quotation Item
                            </Button>
                          </Box>
                          {renderQuotationTable([quotation])}
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography
                                sx={{ fontFamily: "Helvetica, sans-serif" }}
                              >
                                Quotation Items
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box sx={{ mb: 2 }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<Add />}
                                  onClick={() =>
                                    openAddModal(ENTITY_TYPES.QUOTATION_ITEMS, {
                                      quotation_id: quotation.id,
                                    })
                                  }
                                  disabled={
                                    !tabs[1].permissions.includes(userRole)
                                  }
                                  sx={{
                                    mb: 2,
                                    color: "#1976d2",
                                    borderColor: "#1976d2",
                                  }}
                                >
                                  Add Quotation Item
                                </Button>
                              </Box>
                              {renderSubTable(
                                ENTITY_TYPES.QUOTATION_ITEMS,
                                data.quotationitems.filter((item) => {
                                  if (!item.quotation) return false;
                                  if (typeof item.quotation === "object") {
                                    return (
                                      item.quotation.id === quotation.id ||
                                      item.quotation.quotation_id ===
                                        quotation.id
                                    );
                                  }
                                  return item.quotation === quotation.id;
                                }),
                                quotation.id
                              )}
                              {data.quotationitems
                                .filter((item) => {
                                  if (!item.quotation) return false;
                                  if (typeof item.quotation === "object") {
                                    return (
                                      item.quotation.id === quotation.id ||
                                      item.quotation.quotation_id ===
                                        quotation.id
                                    );
                                  }
                                  return item.quotation === quotation.id;
                                })
                                .map((item) => (
                                  <Accordion key={item.id}>
                                    <AccordionSummary
                                      expandIcon={<ExpandMore />}
                                    >
                                      <Typography
                                        sx={{
                                          fontFamily: "Helvetica, sans-serif",
                                        }}
                                      >
                                        Item {item.id} -{" "}
                                        {item.product_code || "N/A"}
                                      </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                      <Accordion>
                                        <AccordionSummary
                                          expandIcon={<ExpandMore />}
                                        >
                                          <Typography
                                            sx={{
                                              fontFamily:
                                                "Helvetica, sans-serif",
                                            }}
                                          >
                                            Selections
                                          </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                          <Button
                                            variant="outlined"
                                            startIcon={<Add />}
                                            onClick={() =>
                                              openAddModal(
                                                ENTITY_TYPES.QUOTATION_ITEM_SELECTIONS,
                                                {
                                                  quotation_item_id: item.id,
                                                }
                                              )
                                            }
                                            disabled={
                                              !tabs[2].permissions.includes(
                                                userRole
                                              )
                                            }
                                            sx={{
                                              mb: 2,
                                              color: "#1976d2",
                                              borderColor: "#1976d2",
                                            }}
                                          >
                                            Add Selection
                                          </Button>
                                          {renderSubTable(
                                            ENTITY_TYPES.QUOTATION_ITEM_SELECTIONS,
                                            data.quotationitemselections.filter(
                                              (s) =>
                                                s.quotation_item === item.id
                                            ),
                                            item.id
                                          )}
                                        </AccordionDetails>
                                      </Accordion>
                                      <Accordion>
                                        <AccordionSummary
                                          expandIcon={<ExpandMore />}
                                        >
                                          <Typography
                                            sx={{
                                              fontFamily:
                                                "Helvetica, sans-serif",
                                            }}
                                          >
                                            AddOns
                                          </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                          <Button
                                            variant="outlined"
                                            startIcon={<Add />}
                                            onClick={() =>
                                              openAddModal(
                                                ENTITY_TYPES.QUOTATION_ITEM_ADDONS,
                                                {
                                                  quotation_item_id: item.id,
                                                }
                                              )
                                            }
                                            disabled={
                                              !tabs[3].permissions.includes(
                                                userRole
                                              )
                                            }
                                            sx={{
                                              mb: 2,
                                              color: "#1976d2",
                                              borderColor: "#1976d2",
                                            }}
                                          >
                                            Add AddOn
                                          </Button>
                                          {renderSubTable(
                                            ENTITY_TYPES.QUOTATION_ITEM_ADDONS,
                                            data.quotationitemaddons.filter(
                                              (a) =>
                                                a.quotation_item === item.id
                                            ),
                                            item.id
                                          )}
                                        </AccordionDetails>
                                      </Accordion>
                                    </AccordionDetails>
                                  </Accordion>
                                ))}
                            </AccordionDetails>
                          </Accordion>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </Paper>
                <Dialog
                  open={openModal}
                  onClose={handleModalClose}
                  maxWidth="md"
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
                        color: "#555",
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
                        color: "#fff",
                      }}
                    >
                      Save
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Container>
        </main>
      </Box>
    </ErrorBoundary>
  );
};

export default QuotationsAdmin;
