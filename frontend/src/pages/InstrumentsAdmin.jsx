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
  Divider,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
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
  INSTRUMENTS: "Instruments",
  CONFIGURABLE_FIELDS: "Configurable Fields",
  ADDON_TYPES: "AddOn Types",
};

const InstrumentsAdmin = () => {
  const [data, setData] = useState({
    instruments: [],
    configurablefields: [],
    addontypes: [],
    types: [],
    categories: [],
  });
  const [filteredData, setFilteredData] = useState({
    instruments: [],
    configurablefields: [],
    addontypes: [],
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
  const [sortConfig, setSortConfig] = useState({
    field: "id",
    direction: "asc",
  });
  const [activeTab, setActiveTab] = useState(0);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [newOption, setNewOption] = useState({ label: "", code: "" });
  const [filterInstrumentId, setFilterInstrumentId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [addonOptions, setAddonOptions] = useState([]);

  const tabs = [
    {
      name: ENTITY_TYPES.INSTRUMENTS,
      endpoint: "/api/admin/instruments/",
      fields: [
        "id",
        "name",
        "type.name",
        "category.name",
        "image",
        "is_available",
      ],
      writableFields: [
        "name",
        "type_id",
        "description",
        "specifications",
        "image",
        "is_available",
      ],
      searchFields: ["name"],
      lookups: { type_id: "types" },
      displayFields: {
        id: "ID",
        name: "Name",
        "type.name": "Type",
        "category.name": "Category",
        image: "Image",
        is_available: "Available",
      },
    },
    {
      name: ENTITY_TYPES.CONFIGURABLE_FIELDS,
      endpoint: "/api/admin/configurable-fields/",
      fields: ["id", "instrument.name", "name", "order"],
      writableFields: [
        "instrument_id",
        "name",
        "order",
        "parent_field_id",
        "trigger_value",
      ],
      searchFields: ["name"],
      lookups: {
        instrument_id: "instruments",
        parent_field_id: "configurablefields",
      },
      displayFields: {
        id: "ID",
        "instrument.name": "Instrument",
        name: "Field Name",
        order: "Order",
      },
    },
    {
      name: ENTITY_TYPES.ADDON_TYPES,
      endpoint: "/api/admin/addon-types/",
      fields: ["id", "instruments", "name"],
      writableFields: ["name", "instrument_ids"],
      searchFields: ["name"],
      lookups: { instrument_ids: "instruments" },
      displayFields: {
        id: "ID",
        instruments: "Instruments",
        name: "Name",
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
        "/api/admin/instruments/",
        "/api/admin/configurable-fields/",
        "/api/admin/addon-types/",
        "/api/instrument-types/",
        "/api/categories/",
        "/api/users/me/",
      ];
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
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
        instruments: Array.isArray(responses[0].data) ? responses[0].data : [],
        configurablefields: Array.isArray(responses[1].data)
          ? responses[1].data
          : [],
        addontypes: Array.isArray(responses[2].data) ? responses[2].data : [],
        types: Array.isArray(responses[3].data) ? responses[3].data : [],
        categories: Array.isArray(responses[4].data) ? responses[4].data : [],
      };
      console.log("Fetched Data:", newData);
      setData(newData);
      setFilteredData({
        instruments: newData.instruments,
        configurablefields: newData.configurablefields,
        addontypes: newData.addontypes,
      });
      setUserRole(responses[5].data?.role || "client");

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

    if (tab.name === ENTITY_TYPES.INSTRUMENTS && filterCategoryId) {
      filtered = filtered.filter(
        (item) =>
          item.category_id === parseInt(filterCategoryId) ||
          (item.category && item.category.id === parseInt(filterCategoryId))
      );
    } else if (
      tab.name === ENTITY_TYPES.CONFIGURABLE_FIELDS &&
      filterInstrumentId
    ) {
      filtered = filtered.filter(
        (item) =>
          item.instrument_id === parseInt(filterInstrumentId) ||
          (item.instrument &&
            item.instrument.id === parseInt(filterInstrumentId))
      );
    } else if (tab.name === ENTITY_TYPES.ADDON_TYPES && filterInstrumentId) {
      filtered = filtered.filter((item) =>
        item.instrument_ids.includes(parseInt(filterInstrumentId))
      );
    }

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

    filtered.sort((a, b) => {
      const fieldA = getField(a, sortConfig.field) || "";
      const fieldB = getField(b, sortConfig.field) || "";
      const multiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.field === "id") {
        return multiplier * ((a?.id || 0) - (b?.id || 0));
      }
      return multiplier * fieldA.toString().localeCompare(fieldB.toString());
    });

    console.log(`Filtered ${tab.name}:`, filtered);

    setFilteredData((prev) => ({
      ...prev,
      [key]: filtered,
    }));
  }, [
    searchTerm,
    data,
    sortConfig,
    activeTab,
    filterInstrumentId,
    filterCategoryId,
  ]);

  const getField = (obj, field) => {
    if (!obj) return "";
    if (field === "instruments") {
      const instrumentIds = obj.instrument_ids || [];
      const instrumentNames = instrumentIds
        .map((id) => data.instruments.find((inst) => inst.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      return instrumentNames || "N/A";
    }
    if (field.includes(".")) {
      const [key, subKey] = field.split(".");
      if (key === "instrument" && subKey === "name") {
        const instrumentId =
          obj.instrument_id || (obj.instrument && obj.instrument.id);
        if (instrumentId) {
          const instrument = data.instruments.find(
            (inst) => inst.id === instrumentId
          );
          return instrument?.name || "N/A";
        }
        return obj.instrument?.name || "N/A";
      }
      if (key === "category" && subKey === "name") {
        const categoryId = obj.category_id || (obj.category && obj.category.id);
        if (categoryId) {
          const category = data.categories.find((cat) => cat.id === categoryId);
          return category?.name || "N/A";
        }
        return obj.category?.name || "N/A";
      }
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
    setFieldOptions([]);
    setAddonOptions([]);
    setNewOption({ label: "", code: "" });
    setOpenModal(true);
  };

  const openEditModal = async (item) => {
    if (userRole !== "admin") {
      setError("You do not have permission to edit items.");
      return;
    }
    setModalAction("edit");
    setModalData({ ...item });
    setModalType(tabs[activeTab].name);
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };

      if (tabs[activeTab].name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
        console.log("Fetching field options for field_id:", item.id);
        const response = await api.get(`/api/admin/field-options/`, {
          headers,
          params: { field_id: item.id },
        });
        console.log("Field Options Response:", response.data);
        const options = Array.isArray(response.data)
          ? response.data.filter((opt) => opt.field_id === item.id)
          : [];
        setFieldOptions(options);
        if (options.length === 0) {
          console.warn("No field options found for field_id:", item.id);
        }
      } else if (tabs[activeTab].name === ENTITY_TYPES.ADDON_TYPES) {
        console.log("Fetching addons for addon_type_id:", item.id);
        const response = await api.get(`/api/admin/addons/`, {
          headers,
          params: { addon_type_id: item.id },
        });
        console.log("AddOns Response:", response.data);
        const addons = Array.isArray(response.data)
          ? response.data.filter((addon) => addon.addon_type_id === item.id)
          : [];
        setAddonOptions(addons);
        if (addons.length === 0) {
          console.warn("No addons found for addon_type_id:", item.id);
        }
      }
    } catch (err) {
      console.error(
        "Error fetching options:",
        err.response?.data || err.message
      );
      setError(
        `Failed to load options: ${err.response?.data?.detail || err.message}`
      );
      setFieldOptions([]);
      setAddonOptions([]);
    }
    setNewOption({ label: "", code: "" });
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({});
    setModalType("");
    setFieldOptions([]);
    setAddonOptions([]);
    setNewOption({ label: "", code: "" });
    setError("");
  };

  const handleSave = async () => {
    if (userRole !== "admin") {
      setError("You do not have permission to save items.");
      return;
    }

    const tab = tabs.find((t) => t.name === modalType);
    const requiredFields = tab.writableFields.filter(
      (f) =>
        f !== "order" &&
        f !== "parent_field_id" &&
        f !== "trigger_value" &&
        f !== "instrument_ids"
    );
    for (const field of requiredFields) {
      if (
        !modalData[field] &&
        modalData[field] !== 0 &&
        modalData[field] !== false
      ) {
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
      const headers = { Authorization: `Bearer ${access}` };
      let payload = {
        name: modalData.name || "",
      };
      if (tab.name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
        payload = {
          instrument_id: modalData.instrument_id || null,
          name: modalData.name || "",
          order: modalData.order ? parseInt(modalData.order, 10) : null,
          parent_field_id: modalData.parent_field_id || null,
          trigger_value: modalData.trigger_value || "",
        };
      } else if (tab.name === ENTITY_TYPES.ADDON_TYPES) {
        payload.instrument_ids = modalData.instrument_ids || [];
      } else if (tab.name === ENTITY_TYPES.INSTRUMENTS) {
        payload = {
          name: modalData.name || "",
          type_id: modalData.type_id || null,
          description: modalData.description || "",
          specifications: modalData.specifications || "",
          image: modalData.image || null,
          is_available: modalData.is_available || false,
        };
      }
      console.log(`${modalType} Payload:`, payload);
      const response = await api({
        method,
        url: endpoint,
        data: payload,
        headers,
      });
      console.log("Save Response:", response.data);

      setSuccess(
        `${modalType} ${
          modalAction === "add" ? "created" : "updated"
        } successfully!`
      );
      fetchData();
      handleModalClose();
    } catch (err) {
      console.error("Error Response:", err.response?.data);
      const errorMessage =
        err.response?.data?.instrument_id?.[0] ||
        err.response?.data?.detail ||
        Object.values(err.response?.data)?.[0] ||
        err.message;
      setError(`Failed to save ${modalType}: ${errorMessage}`);
    }
  };

  const handleAddFieldOption = async () => {
    if (!newOption.label || !newOption.code) {
      setError("Label and Code are required for field options.");
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const payload = {
        field_id: modalData.id,
        label: newOption.label,
        code: newOption.code,
      };
      const headers = { Authorization: `Bearer ${access}` };
      const response = await api.post("/api/admin/field-options/", payload, {
        headers,
      });
      setFieldOptions([...fieldOptions, response.data]);
      setNewOption({ label: "", code: "" });
      setSuccess("Field option added successfully!");
    } catch (err) {
      console.error("Error Adding Field Option:", err.response?.data);
      setError(
        `Failed to add field option: ${
          err.response?.data?.detail ||
          Object.values(err.response?.data)?.[0] ||
          err.message
        }`
      );
    }
  };

  const handleAddAddon = async () => {
    if (!newOption.label || !newOption.code) {
      setError("Label and Code are required for addons.");
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const payload = {
        addon_type_id: modalData.id,
        label: newOption.label,
        code: newOption.code,
      };
      const headers = { Authorization: `Bearer ${access}` };
      const response = await api.post("/api/admin/addons/", payload, {
        headers,
      });
      setAddonOptions([...addonOptions, response.data]);
      setNewOption({ label: "", code: "" });
      setSuccess("AddOn added successfully!");
    } catch (err) {
      console.error("Error Adding AddOn:", err.response?.data);
      setError(
        `Failed to add addon: ${
          err.response?.data?.detail ||
          Object.values(err.response?.data)?.[0] ||
          err.message
        }`
      );
    }
  };

  const handleDeleteFieldOption = async (optionId) => {
    if (!window.confirm("Are you sure you want to delete this field option?")) {
      return;
    }
    try {
      const access = localStorage.getItem("access");
      await api.delete(`/api/admin/field-options/${optionId}/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setFieldOptions(fieldOptions.filter((opt) => opt.id !== optionId));
      setSuccess("Field option deleted successfully!");
    } catch (err) {
      setError(
        `Failed to delete field option: ${
          err.response?.data?.detail || err.message
        }`
      );
    }
  };

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm("Are you sure you want to delete this addon?")) {
      return;
    }
    try {
      const access = localStorage.getItem("access");
      await api.delete(`/api/admin/addons/${addonId}/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setAddonOptions(addonOptions.filter((opt) => opt.id !== addonId));
      setSuccess("AddOn deleted successfully!");
    } catch (err) {
      setError(
        `Failed to delete addon: ${err.response?.data?.detail || err.message}`
      );
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

  const renderModalContent = () => {
    const tab = tabs.find((t) => t.name === modalType);
    if (!tab)
      return <Alert severity="error">Invalid entity type: {modalType}</Alert>;

    if (tab.name === ENTITY_TYPES.INSTRUMENTS) {
      return (
        <>
          {tab.writableFields.map((field) => {
            if (field === "image") {
              return (
                <Box key={field} sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    IMAGE
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        image: e.target.files[0] || null,
                      })
                    }
                    style={{ width: "100%" }}
                  />
                  {modalData.image && typeof modalData.image === "string" && (
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={modalData.image}
                        alt="Current"
                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                      />
                    </Box>
                  )}
                </Box>
              );
            }
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
                      setModalData({
                        ...modalData,
                        [field]: parseInt(e.target.value, 10) || null,
                      })
                    }
                    required
                  >
                    <MenuItem value="" disabled>
                      Select an option
                    </MenuItem>
                    {lookupItems.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name || item.label || item.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }
            if (field === "is_available") {
              return (
                <FormControl fullWidth key={field} margin="normal" size="small">
                  <InputLabel>Is Available</InputLabel>
                  <Select
                    value={modalData[field] ? "true" : "false"}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        [field]: e.target.value === "true",
                      })
                    }
                    required
                  >
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
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
                  field.includes("order") || field.includes("quantity")
                    ? "number"
                    : "text"
                }
                variant="outlined"
                size="small"
                multiline={
                  field === "description" || field === "specifications"
                }
                rows={
                  field === "description" || field === "specifications" ? 4 : 1
                }
                required={
                  field !== "description" &&
                  field !== "specifications" &&
                  field !== "is_available"
                }
              />
            );
          })}
        </>
      );
    }

    if (tab.name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
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
                      setModalData({
                        ...modalData,
                        [field]: parseInt(e.target.value, 10) || null,
                      })
                    }
                    required={field === "instrument_id"}
                  >
                    <MenuItem value="" disabled>
                      Select an option
                    </MenuItem>
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
                type={field === "order" ? "number" : "text"}
                variant="outlined"
                size="small"
                required={field === "name"}
              />
            );
          })}
          {modalAction === "edit" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Field Options
              </Typography>
              {fieldOptions.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Label</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fieldOptions.map((option) => (
                      <TableRow key={option.id}>
                        <TableCell>{option.id}</TableCell>
                        <TableCell>{option.label}</TableCell>
                        <TableCell>{option.code}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDeleteFieldOption(option.id)}
                            sx={{ color: "#d32f2f" }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography>No field options available.</Typography>
              )}
              <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                <TextField
                  label="Option Label"
                  value={newOption.label}
                  onChange={(e) =>
                    setNewOption({ ...newOption, label: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                />
                <TextField
                  label="Option Code"
                  value={newOption.code}
                  onChange={(e) =>
                    setNewOption({ ...newOption, code: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  onClick={handleAddFieldOption}
                  sx={{ textTransform: "none" }}
                >
                  Add Option
                </Button>
              </Box>
            </>
          )}
        </>
      );
    }

    if (tab.name === ENTITY_TYPES.ADDON_TYPES) {
      return (
        <>
          {tab.writableFields.map((field) => {
            if (field === "instrument_ids") {
              const lookupItems = data.instruments || [];
              return (
                <FormControl fullWidth key={field} margin="normal" size="small">
                  <InputLabel>INSTRUMENTS</InputLabel>
                  <Select
                    multiple
                    value={modalData.instrument_ids || []}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        instrument_ids: e.target.value,
                      })
                    }
                    renderValue={(selected) =>
                      selected
                        .map(
                          (id) =>
                            data.instruments.find((inst) => inst.id === id)
                              ?.name
                        )
                        .filter(Boolean)
                        .join(", ")
                    }
                  >
                    {lookupItems.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name || item.id}
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
                  .replace("_ids", "")
                  .replace("_", " ")
                  .toUpperCase()}
                value={modalData[field] || ""}
                onChange={(e) =>
                  setModalData({ ...modalData, [field]: e.target.value })
                }
                fullWidth
                margin="normal"
                variant="outlined"
                size="small"
                required={field === "name"}
              />
            );
          })}
          {modalAction === "edit" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                AddOns
              </Typography>
              {addonOptions.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Label</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addonOptions.map((addon) => (
                      <TableRow key={addon.id}>
                        <TableCell>{addon.id}</TableCell>
                        <TableCell>{addon.label}</TableCell>
                        <TableCell>{addon.code}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDeleteAddon(addon.id)}
                            sx={{ color: "#d32f2f" }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography>No addons available.</Typography>
              )}
              <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                <TextField
                  label="AddOn Label"
                  value={newOption.label}
                  onChange={(e) =>
                    setNewOption({ ...newOption, label: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                />
                <TextField
                  label="AddOn Code"
                  value={newOption.code}
                  onChange={(e) =>
                    setNewOption({ ...newOption, code: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  onClick={handleAddAddon}
                  sx={{ textTransform: "none" }}
                >
                  Add AddOn
                </Button>
              </Box>
            </>
          )}
        </>
      );
    }

    return null;
  };

  const renderTable = () => {
    const tab = tabs[activeTab];
    const items = filteredData[tab.name.toLowerCase().replace(" ", "")] || [];
    const placeholderImage = "https://via.placeholder.com/50";

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
            items.map((item) => {
              console.log("Table Item:", item);
              return item && item.id ? (
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
                        fontFamily: "Helvetica, sans-serif",
                        ...(field === "is_available" &&
                          tab.name === ENTITY_TYPES.INSTRUMENTS && {
                            color: item[field] ? "#388e3c" : "#d32f2f",
                            fontWeight: "bold",
                          }),
                      }}
                    >
                      {field === "image" ? (
                        <img
                          src={item[field] || placeholderImage}
                          alt={item.name || "Instrument"}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                          }}
                          onError={(e) => (e.target.src = placeholderImage)}
                        />
                      ) : field.includes(".") || field === "instruments" ? (
                        getField(item, field) || "N/A"
                      ) : field === "is_available" ? (
                        item[field] ? (
                          "Yes"
                        ) : (
                          "No"
                        )
                      ) : (
                        item[field] || "N/A"
                      )}
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
                  </TableCell>
                </TableRow>
              ) : null;
            })
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
              Instruments Management
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
                  onChange={(e, newValue) => {
                    setActiveTab(newValue);
                    setFilterInstrumentId("");
                    setFilterCategoryId("");
                  }}
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
                  {tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS && (
                    <FormControl sx={{ minWidth: "200px" }} size="small">
                      <InputLabel>Filter by Category</InputLabel>
                      <Select
                        value={filterCategoryId}
                        onChange={(e) => setFilterCategoryId(e.target.value)}
                        label="Filter by Category"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {data.categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {(tabs[activeTab].name === ENTITY_TYPES.CONFIGURABLE_FIELDS ||
                    tabs[activeTab].name === ENTITY_TYPES.ADDON_TYPES) && (
                    <FormControl sx={{ minWidth: "200px" }} size="small">
                      <InputLabel>Filter by Instrument</InputLabel>
                      <Select
                        value={filterInstrumentId}
                        onChange={(e) => setFilterInstrumentId(e.target.value)}
                        label="Filter by Instrument"
                      >
                        <MenuItem value="">All Instruments</MenuItem>
                        {data.instruments.map((instrument) => (
                          <MenuItem key={instrument.id} value={instrument.id}>
                            {instrument.name}
                          </MenuItem>
                        ))}
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

export default InstrumentsAdmin;
