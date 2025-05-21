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
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, ExpandMore } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import ErrorBoundary from "./ErrorBoundary";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

// Define entity types as constants to ensure consistency
const ENTITY_TYPES = {
  INSTRUMENTS: "Instruments",
  CONFIGURABLE_FIELDS: "Configurable Fields",
  FIELD_OPTIONS: "Field Options",
  ADDON_TYPES: "AddOn Types",
  ADDONS: "AddOns",
};

const InstrumentsAdmin = () => {
  const [data, setData] = useState({
    categories: [],
    instrumenttypes: [],
    instruments: [],
    configurablefields: [],
    fieldoptions: [],
    addontypes: [],
    addons: [],
  });
  const [filteredInstruments, setFilteredInstruments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalType, setModalType] = useState("");
  const [modalAction, setModalAction] = useState("add");
  const [userRole, setUserRole] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: "id",
    direction: "asc",
  });

  const tabs = [
    {
      name: ENTITY_TYPES.INSTRUMENTS,
      endpoint: "/api/instruments/",
      fields: ["id", "name", "type.name", "type.category.name", "is_available"],
      writableFields: [
        "name",
        "type_id",
        "description",
        "specifications",
        "is_available",
        "image",
      ],
      permissions: ["admin", "proposal_engineer"],
      searchFields: ["name"],
    },
    {
      name: ENTITY_TYPES.CONFIGURABLE_FIELDS,
      endpoint: "/api/configurable-fields/",
      fields: ["id", "name", "instrument.name", "order"],
      writableFields: [
        "name",
        "instrument_id",
        "order",
        "parent_field_id",
        "trigger_value",
      ],
      permissions: ["admin", "proposal_engineer"],
      lookups: {
        instrument_id: "instruments",
        parent_field_id: "configurablefields",
      },
      searchFields: ["name"],
    },
    {
      name: ENTITY_TYPES.FIELD_OPTIONS,
      endpoint: "/api/field-options/",
      fields: ["id", "field.name", "label", "code"],
      writableFields: ["field_id", "label", "code"],
      permissions: ["admin", "proposal_engineer"],
      lookups: { field_id: "configurablefields" },
      searchFields: ["label", "code"],
    },
    {
      name: ENTITY_TYPES.ADDON_TYPES,
      endpoint: "/api/addon-types/",
      fields: ["id", "name"],
      writableFields: ["name", "instruments"],
      permissions: ["admin", "proposal_engineer"],
      lookups: { instruments: "instruments" },
      searchFields: ["name"],
    },
    {
      name: ENTITY_TYPES.ADDONS,
      endpoint: "/api/addons/",
      fields: ["id", "label", "code", "addon_type.name"],
      writableFields: ["addon_type_id", "label", "code"],
      permissions: ["admin", "proposal_engineer"],
      lookups: { addon_type_id: "addontypes" },
      searchFields: ["label", "code"],
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
        "/api/categories/",
        "/api/instrument-types/",
        "/api/instruments/",
        "/api/configurable-fields/",
        "/api/field-options/",
        "/api/addon-types/",
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
        categories: responses[0].data || [],
        instrumenttypes: responses[1].data || [],
        instruments: responses[2].data || [],
        configurablefields: responses[3].data || [],
        fieldoptions: responses[4].data || [],
        addontypes: responses[5].data || [],
        addons: responses[6].data || [],
      };
      setData(newData);
      setFilteredInstruments(newData.instruments);
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
    let filtered = [...data.instruments];
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter(
        (item) => item.type?.category?.name === categoryFilter
      );
    }
    if (typeFilter) {
      filtered = filtered.filter(
        (item) => item.type?.id === parseInt(typeFilter)
      );
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
    setFilteredInstruments(filtered);
  }, [searchTerm, categoryFilter, typeFilter, data.instruments, sortConfig]);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openAddModal = (type, parent = {}) => {
    console.log("openAddModal called with:", { type, parent });
    if (
      typeof type !== "string" ||
      !Object.values(ENTITY_TYPES).includes(type)
    ) {
      console.error(
        `Invalid modalType in openAddModal: ${JSON.stringify(
          type
        )} (type: ${typeof type})`
      );
      setError(
        `Invalid entity type: ${
          typeof type === "object" ? JSON.stringify(type) : type
        }`
      );
      return;
    }
    if (!tabs.find((t) => t.name === type)?.permissions.includes(userRole)) {
      setError(`You do not have permission to add ${type}.`);
      return;
    }
    setModalType(type);
    setModalAction("add");
    setModalData({ ...parent });
    setImageFile(null);
    setOpenModal(true);
  };

  const openEditModal = (type, item) => {
    console.log("openEditModal called with:", { type, item });
    if (
      typeof type !== "string" ||
      !Object.values(ENTITY_TYPES).includes(type)
    ) {
      console.error(
        `Invalid modalType in openEditModal: ${JSON.stringify(
          type
        )} (type: ${typeof type})`
      );
      setError(
        `Invalid entity type: ${
          typeof type === "object" ? JSON.stringify(type) : type
        }`
      );
      return;
    }
    if (!tabs.find((t) => t.name === type)?.permissions.includes(userRole)) {
      setError(`You do not have permission to edit ${type}.`);
      return;
    }
    setModalType(type);
    setModalAction("edit");
    setModalData({ ...item });
    setImageFile(null);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({});
    setModalType("");
    setImageFile(null);
    setError("");
  };

  const handleSave = async () => {
    if (
      typeof modalType !== "string" ||
      !Object.values(ENTITY_TYPES).includes(modalType)
    ) {
      console.error(
        `Invalid modalType in handleSave: ${JSON.stringify(
          modalType
        )} (type: ${typeof modalType})`
      );
      setError(
        `Invalid entity type: ${
          typeof modalType === "object" ? JSON.stringify(modalType) : modalType
        }`
      );
      return;
    }
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

      if (modalType === ENTITY_TYPES.ADDON_TYPES && payload.instruments) {
        payload.instruments = payload.instruments.map((id) => parseInt(id));
      }

      const response = await api({
        method,
        url: endpoint,
        data: payload,
        headers: { Authorization: `Bearer ${access}` },
      });

      if (modalType === ENTITY_TYPES.INSTRUMENTS && imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        await api.post(
          `/api/instruments/${response.data.id}/upload-image/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${access}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

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
    if (
      typeof type !== "string" ||
      !Object.values(ENTITY_TYPES).includes(type)
    ) {
      console.error(
        `Invalid type in handleDelete: ${JSON.stringify(
          type
        )} (type: ${typeof type})`
      );
      setError(
        `Invalid entity type: ${
          typeof type === "object" ? JSON.stringify(type) : type
        }`
      );
      return;
    }
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

  const renderModalContent = () => {
    const tab = tabs.find((t) => t.name === modalType);
    if (!tab) {
      console.warn(
        `No tab configuration found for modalType: ${JSON.stringify(
          modalType
        )} (type: ${typeof modalType})`,
        {
          tabs,
          modalType,
        }
      );
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            Invalid entity type:{" "}
            {typeof modalType === "object"
              ? JSON.stringify(modalType)
              : modalType}
            . Please try again.
          </Alert>
        </Box>
      );
    }

    return (
      <>
        {tab.writableFields.map((field) => {
          if (field === "type_id" && modalType === ENTITY_TYPES.INSTRUMENTS) {
            return (
              <Box key={field} sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={modalData.category_id || ""}
                    onChange={(e) => {
                      setModalData({
                        ...modalData,
                        category_id: e.target.value,
                        type_id: "",
                      });
                    }}
                    required
                  >
                    {data.categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Instrument Type</InputLabel>
                  <Select
                    value={modalData.type_id || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, type_id: e.target.value })
                    }
                    required
                    disabled={!modalData.category_id}
                  >
                    {data.instrumenttypes
                      .filter(
                        (type) => type.category?.id === modalData.category_id
                      )
                      .map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            );
          }
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
          if (
            field === "instruments" &&
            modalType === ENTITY_TYPES.ADDON_TYPES
          ) {
            return (
              <FormControl fullWidth key={field} sx={{ mt: 2 }}>
                <InputLabel>Instruments</InputLabel>
                <Select
                  multiple
                  value={modalData[field] || []}
                  onChange={(e) =>
                    setModalData({ ...modalData, [field]: e.target.value })
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={
                            data.instruments.find((i) => i.id === value)
                              ?.name || value
                          }
                        />
                      ))}
                    </Box>
                  )}
                >
                  {data.instruments.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          if (field === "image" && modalType === ENTITY_TYPES.INSTRUMENTS) {
            return (
              <Box key={field} sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Upload Image</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
                {modalData.image && (
                  <Box sx={{ mt: 1 }}>
                    <img
                      src={modalData.image}
                      alt="Instrument"
                      style={{ maxWidth: "100%", maxHeight: "200px" }}
                    />
                  </Box>
                )}
              </Box>
            );
          }
          if (field === "is_available") {
            return (
              <FormControl fullWidth key={field} sx={{ mt: 2 }}>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={
                    modalData[field] !== undefined ? modalData[field] : true
                  }
                  onChange={(e) =>
                    setModalData({ ...modalData, [field]: e.target.value })
                  }
                >
                  <MenuItem value={true}>Available</MenuItem>
                  <MenuItem value={false}>Not Available</MenuItem>
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
              type={field.includes("order") ? "number" : "text"}
              variant="outlined"
              multiline={field === "description" || field === "specifications"}
              rows={
                field === "description" || field === "specifications" ? 4 : 1
              }
            />
          );
        })}
      </>
    );
  };

  const renderInstrumentTable = (instruments, typeId) => {
    return (
      <Table>
        <TableHead>
          <TableRow>
            {tabs[0].fields.map((field) => (
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
                  {field
                    .replace("type.", "")
                    .replace("name", "")
                    .toUpperCase() || "NAME"}
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
          {instruments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography sx={{ fontFamily: "Helvetica, sans-serif", py: 2 }}>
                  No instruments found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            instruments.map((item) => (
              <TableRow
                key={item.id}
                sx={{
                  "&:hover": { bgcolor: "#e3f2fd" },
                  transition: "background-color 0.2s",
                }}
              >
                <TableCell sx={{ fontFamily: "Helvetica, sans-serif" }}>
                  {item.id}
                </TableCell>
                <TableCell sx={{ fontFamily: "Helvetica, sans-serif" }}>
                  {item.name}
                </TableCell>
                <TableCell sx={{ fontFamily: "Helvetica, sans-serif" }}>
                  {item.type?.name || "N/A"}
                </TableCell>
                <TableCell sx={{ fontFamily: "Helvetica, sans-serif" }}>
                  {item.type?.category?.name || "N/A"}
                </TableCell>
                <TableCell sx={{ fontFamily: "Helvetica, sans-serif" }}>
                  {item.is_available ? "Yes" : "No"}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() =>
                      openEditModal(ENTITY_TYPES.INSTRUMENTS, item)
                    }
                    disabled={!tabs[0].permissions.includes(userRole)}
                    sx={{ color: "#1976d2" }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      handleDelete(item.id, ENTITY_TYPES.INSTRUMENTS)
                    }
                    disabled={!tabs[0].permissions.includes(userRole)}
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

  const renderSubTable = (type, items, parentId) => {
    const tab = tabs.find((t) => t.name === type);
    if (!tab) {
      console.warn(
        `No tab configuration found for type: ${JSON.stringify(
          type
        )} (type: ${typeof type})`
      );
      return null;
    }
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
                  .replace("field.", "")
                  .replace("addon_type.", "")
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
                  No {type.toLowerCase()} found.
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
                          ?.name
                      : field.includes("field.name")
                      ? data.configurablefields.find((f) => f.id === item.field)
                          ?.name
                      : field.includes("addon_type.name")
                      ? data.addontypes.find((a) => a.id === item.addon_type)
                          ?.name
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
              Instrument Categories
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
                <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
                  <TextField
                    label="Search by Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, minWidth: "200px" }}
                    variant="outlined"
                    size="small"
                  />
                  <FormControl sx={{ minWidth: "150px" }} size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setTypeFilter("");
                      }}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {data.categories.map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: "150px" }} size="small">
                    <InputLabel>Instrument Type</InputLabel>
                    <Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      label="Instrument Type"
                      disabled={!categoryFilter}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {data.instrumenttypes
                        .filter(
                          (type) => type.category?.name === categoryFilter
                        )
                        .map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => openAddModal(ENTITY_TYPES.INSTRUMENTS)}
                    disabled={!tabs[0].permissions.includes(userRole)}
                    sx={{
                      bgcolor: "#1976d2",
                      "&:hover": { bgcolor: "#115293" },
                      textTransform: "none",
                      px: 3,
                    }}
                  >
                    Add Instrument
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
                  {data.categories.map((category) => (
                    <Accordion key={category.id}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography
                          sx={{
                            fontWeight: "bold",
                            fontFamily: "Helvetica, sans-serif",
                          }}
                        >
                          {category.name}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {data.instrumenttypes
                          .filter((type) => type.category?.id === category.id)
                          .map((type) => (
                            <Accordion key={type.id}>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography
                                  sx={{ fontFamily: "Helvetica, sans-serif" }}
                                >
                                  {type.name}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Box sx={{ mb: 2 }}>
                                  <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={() =>
                                      openAddModal(ENTITY_TYPES.INSTRUMENTS, {
                                        category_id: category.id,
                                        type_id: type.id,
                                      })
                                    }
                                    disabled={
                                      !tabs[0].permissions.includes(userRole)
                                    }
                                    sx={{ mb: 2 }}
                                  >
                                    Add Instrument
                                  </Button>
                                </Box>
                                {renderInstrumentTable(
                                  filteredInstruments.filter(
                                    (i) => i.type?.id === type.id
                                  ),
                                  type.id
                                )}
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography
                                      sx={{
                                        fontFamily: "Helvetica, sans-serif",
                                      }}
                                    >
                                      Configurable Fields
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Button
                                      variant="outlined"
                                      startIcon={<Add />}
                                      onClick={() =>
                                        openAddModal(
                                          ENTITY_TYPES.CONFIGURABLE_FIELDS,
                                          {
                                            instrument_id:
                                              filteredInstruments.find(
                                                (i) => i.type?.id === type.id
                                              )?.id,
                                          }
                                        )
                                      }
                                      disabled={
                                        !tabs[1].permissions.includes(userRole)
                                      }
                                      sx={{ mb: 2 }}
                                    >
                                      Add Configurable Field
                                    </Button>
                                    {renderSubTable(
                                      ENTITY_TYPES.CONFIGURABLE_FIELDS,
                                      data.configurablefields.filter((f) =>
                                        filteredInstruments.find(
                                          (i) =>
                                            i.type?.id === type.id &&
                                            i.id === f.instrument
                                        )
                                      ),
                                      type.id
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography
                                      sx={{
                                        fontFamily: "Helvetica, sans-serif",
                                      }}
                                    >
                                      Field Options
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Button
                                      variant="outlined"
                                      startIcon={<Add />}
                                      onClick={() =>
                                        openAddModal(
                                          ENTITY_TYPES.FIELD_OPTIONS,
                                          {
                                            field_id:
                                              data.configurablefields.find(
                                                (f) =>
                                                  filteredInstruments.find(
                                                    (i) =>
                                                      i.type?.id === type.id &&
                                                      i.id === f.instrument
                                                  )
                                              )?.id,
                                          }
                                        )
                                      }
                                      disabled={
                                        !tabs[2].permissions.includes(userRole)
                                      }
                                      sx={{ mb: 2 }}
                                    >
                                      Add Field Option
                                    </Button>
                                    {renderSubTable(
                                      ENTITY_TYPES.FIELD_OPTIONS,
                                      data.fieldoptions.filter((o) =>
                                        data.configurablefields.find(
                                          (f) =>
                                            filteredInstruments.find(
                                              (i) =>
                                                i.type?.id === type.id &&
                                                i.id === f.instrument
                                            ) && f.id === o.field
                                        )
                                      ),
                                      type.id
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography
                                      sx={{
                                        fontFamily: "Helvetica, sans-serif",
                                      }}
                                    >
                                      AddOn Types
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Button
                                      variant="outlined"
                                      startIcon={<Add />}
                                      onClick={() =>
                                        openAddModal(ENTITY_TYPES.ADDON_TYPES, {
                                          instruments: filteredInstruments
                                            .filter(
                                              (i) => i.type?.id === type.id
                                            )
                                            .map((i) => i.id),
                                        })
                                      }
                                      disabled={
                                        !tabs[3].permissions.includes(userRole)
                                      }
                                      sx={{ mb: 2 }}
                                    >
                                      Add AddOn Type
                                    </Button>
                                    {renderSubTable(
                                      ENTITY_TYPES.ADDON_TYPES,
                                      data.addontypes.filter((t) =>
                                        t.instruments.some((i) =>
                                          filteredInstruments.find(
                                            (fi) =>
                                              fi.type?.id === type.id &&
                                              fi.id === i
                                          )
                                        )
                                      ),
                                      type.id
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography
                                      sx={{
                                        fontFamily: "Helvetica, sans-serif",
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
                                        openAddModal(ENTITY_TYPES.ADDONS, {
                                          addon_type_id: data.addontypes.find(
                                            (t) =>
                                              t.instruments.some((i) =>
                                                filteredInstruments.find(
                                                  (fi) =>
                                                    fi.type?.id === type.id &&
                                                    fi.id === i
                                                )
                                              )
                                          )?.id,
                                        })
                                      }
                                      disabled={
                                        !tabs[4].permissions.includes(userRole)
                                      }
                                      sx={{ mb: 2 }}
                                    >
                                      Add AddOn
                                    </Button>
                                    {renderSubTable(
                                      ENTITY_TYPES.ADDONS,
                                      data.addons.filter((a) =>
                                        data.addontypes.find(
                                          (t) =>
                                            t.instruments.some((i) =>
                                              filteredInstruments.find(
                                                (fi) =>
                                                  fi.type?.id === type.id &&
                                                  fi.id === i
                                              )
                                            ) && t.id === a.addon_type
                                        )
                                      ),
                                      type.id
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                              </AccordionDetails>
                            </Accordion>
                          ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
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

export default InstrumentsAdmin;
