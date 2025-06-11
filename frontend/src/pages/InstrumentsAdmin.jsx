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
  Fade,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/InstrumentsAdmin.css";

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
  const [imagePreview, setImagePreview] = useState(null);

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

    filtered = Array.from(
      new Map(filtered.map((item) => [item.id, item])).values()
    );

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
    setModalData({ is_available: true });
    setModalType(tabs[activeTab].name);
    setFieldOptions([]);
    setAddonOptions([]);
    setNewOption({ label: "", code: "" });
    setImagePreview(null);
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
    setImagePreview(item.image || null);
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };

      if (tabs[activeTab].name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
        const response = await api.get(`/api/admin/field-options/`, {
          headers,
          params: { field_id: item.id },
        });
        const options = Array.isArray(response.data)
          ? response.data.filter((opt) => opt.field_id === item.id)
          : [];
        setFieldOptions(options);
      } else if (tabs[activeTab].name === ENTITY_TYPES.ADDON_TYPES) {
        const response = await api.get(`/api/admin/addons/`, {
          headers,
          params: { addon_type_id: item.id },
        });
        const addons = Array.isArray(response.data)
          ? response.data.filter((addon) => addon.addon_type_id === item.id)
          : [];
        setAddonOptions(addons);
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
    setImagePreview(null);
    setError("");
  };

  const validateImage = (file) => {
    if (!file) return true;
    const validTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      setError("Image must be a JPEG or PNG file.");
      return false;
    }
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (userRole !== "admin") {
      setError("You do not have permission to save items.");
      return;
    }

    const tab = tabs.find((t) => t.name === modalType);
    const requiredFields = tab.writableFields.filter(
      (f) =>
        f !== "description" &&
        f !== "specifications" &&
        f !== "image" &&
        f !== "is_available" &&
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
      const method = modalAction === "add" ? "post" : "patch";
      const headers = { Authorization: `Bearer ${access}` };

      if (tab.name === ENTITY_TYPES.INSTRUMENTS) {
        const formData = new FormData();
        formData.append("name", modalData.name || "");
        if (modalData.type_id) formData.append("type_id", modalData.type_id);
        formData.append("description", modalData.description || "");
        formData.append("specifications", modalData.specifications || "");
        formData.append(
          "is_available",
          modalData.is_available ? "true" : "false"
        );

        if (modalData.image instanceof File) {
          if (!validateImage(modalData.image)) return;
          formData.append("image", modalData.image);
        } else if (modalAction === "edit" && modalData.image === "") {
          formData.append("image", "");
        }

        for (let [key, value] of formData.entries()) {
          console.log(`FormData Entry: ${key}=${value}`);
        }

        const response = await api({
          method,
          url: endpoint,
          data: formData,
          headers,
        });
        console.log("Save Response:", response.data);
        setSuccess(
          `${modalType} ${
            modalAction === "add" ? "added" : "updated"
          } successfully!`
        );
      } else {
        let payload = {};
        if (tab.name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
          if (!modalData.instrument_id) {
            setError("Instrument is required.");
            return;
          }
          payload = {
            instrument_id: parseInt(modalData.instrument_id, 10),
            name: modalData.name || "",
            order: modalData.order ? parseInt(modalData.order, 10) : null,
            parent_field_id: modalData.parent_field_id
              ? parseInt(modalData.parent_field_id, 10)
              : null,
            trigger_value: modalData.trigger_value || "",
          };
        } else if (tab.name === ENTITY_TYPES.ADDON_TYPES) {
          payload = {
            name: modalData.name || "",
            instrument_ids: Array.isArray(modalData.instrument_ids)
              ? modalData.instrument_ids.map((id) => parseInt(id, 10))
              : [],
          };
        }
        console.log(`${modalType} Payload:`, payload);
        headers["Content-Type"] = "application/json";
        const response = await api({
          method,
          url: endpoint,
          data: payload,
          headers,
        });
        console.log("Save Response:", response.data);
        setSuccess(
          `${modalType} ${
            modalAction === "add" ? "added" : "updated"
          } successfully!`
        );
      }
      fetchData();
      handleModalClose();
    } catch (err) {
      console.error("Error Response:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.name?.[0] ||
        err.response?.data?.type_id?.[0] ||
        err.response?.data?.instrument_id?.[0] ||
        err.response?.data?.image?.[0] ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        err.message;
      setError(`Failed to save ${modalType}: ${errorMessage}`);
    }
  };

  const handleAddFieldOption = async () => {
    if (!newOption.label || !newOption.code) {
      setError("Label and code are required for field options.");
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };
      const payload = {
        field_id: modalData.id,
        label: newOption.label,
        code: newOption.code,
      };
      const response = await api.post("/api/admin/field-options/", payload, {
        headers,
      });
      setFieldOptions([...fieldOptions, response.data]);
      setNewOption({ label: "", code: "" });
      setSuccess("Field option added successfully!");
    } catch (err) {
      console.error("Error Adding FieldOption:", err.response?.data);
      setError(
        `Failed to add field option: ${
          err.response?.data?.detail ||
          Object.values(err.response?.data || {})[0]?.[0] ||
          err.message
        }`
      );
    }
  };

  const handleAddAddon = async () => {
    if (!newOption.label || !newOption.code) {
      setError("Label and code are required for addons.");
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };
      const payload = {
        addon_type_id: modalData.id,
        label: newOption.label,
        code: newOption.code,
      };
      const response = await api.post("/api/admin/addons/", payload, {
        headers,
      });
      setAddonOptions([...addonOptions, response.data]);
      setNewOption({ label: "", code: "" });
      setSuccess("AddOn added successfully!");
    } catch (err) {
      console.error("Error Adding Addon:", err.response?.data);
      setError(
        `Failed to add addon: ${
          err.response?.data?.detail ||
          Object.values(err.response?.data || {})[0]?.[0] ||
          err.message
        }`
      );
    }
  };

  const handleDeleteFieldOption = async (optionId) => {
    if (!window.confirm("Are you sure you want to delete this field option?"))
      return;
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
    if (!window.confirm("Are you sure you want to delete this addon?")) return;
    try {
      const access = localStorage.getItem("access");
      await api.delete(`/api/admin/addons/${addonId}/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      setAddonOptions(addonOptions.filter((opt) => opt.id !== addonId));
      setSuccess("Addon deleted successfully!");
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
    )
      return;
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
    if (!tab) {
      return <Alert severity="error">Invalid entity type: {modalType}</Alert>;
    }

    if (tab.name === ENTITY_TYPES.INSTRUMENTS) {
      return (
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Helvetica, sans-serif !important",
              mb: 2,
              fontWeight: "bold",
            }}
          >
            Basic Info
          </Typography>
          <TextField
            label="NAME"
            value={modalData.name || ""}
            onChange={(e) =>
              setModalData({ ...modalData, name: e.target.value })
            }
            fullWidth
            margin="normal"
            variant="outlined"
            size="small"
            required
            InputLabelProps={{
              sx: { fontFamily: "Helvetica, sans-serif !important" },
            }}
            InputProps={{
              sx: { fontFamily: "Helvetica, sans-serif !important" },
            }}
          />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel sx={{ fontFamily: "Helvetica, sans-serif !important" }}>
              TYPE
            </InputLabel>
            <Select
              value={modalData.type_id || ""}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  type_id: parseInt(e.target.value, 10) || null,
                })
              }
              required
              sx={{ fontFamily: "Helvetica, sans-serif !important" }}
            >
              <MenuItem
                value=""
                disabled
                sx={{ fontFamily: "Helvetica, sans-serif !important" }}
              >
                Select a type
              </MenuItem>
              {data.types.map((item) => (
                <MenuItem
                  key={item.id}
                  value={item.id}
                  sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                >
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel sx={{ fontFamily: "Helvetica, sans-serif !important" }}>
              Is Available
            </InputLabel>
            <Select
              value={modalData.is_available ? "true" : "false"}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  is_available: e.target.value === "true",
                })
              }
              sx={{ fontFamily: "Helvetica, sans-serif !important" }}
            >
              <MenuItem
                value="true"
                sx={{ fontFamily: "Helvetica, sans-serif !important" }}
              >
                Yes
              </MenuItem>
              <MenuItem
                value="false"
                sx={{ fontFamily: "Helvetica, sans-serif !important" }}
              >
                No
              </MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Helvetica, sans-serif !important",
              mb: 2,
              fontWeight: "bold",
            }}
          >
            Instrument Description
          </Typography>
          <TextField
            label="DESCRIPTION"
            value={modalData.description || ""}
            onChange={(e) =>
              setModalData({ ...modalData, description: e.target.value })
            }
            fullWidth
            margin="normal"
            variant="outlined"
            size="small"
            multiline
            rows={4}
            InputLabelProps={{
              sx: { fontFamily: "Helvetica, sans-serif !important" },
            }}
            InputProps={{
              sx: { fontFamily: "Helvetica, sans-serif !important" },
            }}
          />
          <TextField
            label="SPECIFICATIONS"
            value={modalData.specifications || ""}
            onChange={(e) =>
              setModalData({ ...modalData, specifications: e.target.value })
            }
            fullWidth
            margin="normal"
            variant="outlined"
            size="small"
            multiline
            rows={4}
            InputLabelProps={{
              sx: { fontFamily: "Helvetica, sans-serif !important" },
            }}
            InputProps={{
              sx: { fontFamily: "Helvetica, sans-serif !important" },
            }}
          />

          <Divider sx={{ my: 2 }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Helvetica, sans-serif !important",
              mb: 2,
              fontWeight: "bold",
            }}
          >
            Media
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.875rem",
                mb: 1,
                fontFamily: "Helvetica, sans-serif !important",
              }}
            >
              IMAGE
            </Typography>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && validateImage(file)) {
                  setModalData({ ...modalData, image: file });
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
              style={{ width: "100%", marginBottom: "10px" }}
            />
            {(imagePreview ||
              (modalData.image && typeof modalData.image === "string")) && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={imagePreview || modalData.image}
                  alt="Preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
                <CTAButton
                  size="small"
                  onClick={() => {
                    setModalData({ ...modalData, image: "" });
                    setImagePreview(null);
                  }}
                  sx={{
                    mt: 1,
                    bgcolor: "#d6393a",
                    "&:hover": { bgcolor: "#b71c1c" },
                  }}
                >
                  Remove Image
                </CTAButton>
              </Box>
            )}
          </Box>
        </Box>
      );
    }

    if (tab.name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
      return (
        <Box>
          {tab.writableFields.map((field) => {
            if (tab.lookups && tab.lookups[field]) {
              const lookupKey = tab.lookups[field];
              const lookupItems = data[lookupKey] || [];
              return (
                <FormControl fullWidth margin="normal" size="small" key={field}>
                  <InputLabel
                    sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                  >
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
                    sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                  >
                    <MenuItem
                      value=""
                      sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                    >
                      Select an option
                    </MenuItem>
                    {lookupItems.map((item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
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
                InputLabelProps={{
                  sx: { fontFamily: "Helvetica, sans-serif !important" },
                }}
                InputProps={{
                  sx: { fontFamily: "Helvetica, sans-serif !important" },
                }}
              />
            );
          })}
          {modalAction === "edit" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Helvetica, sans-serif !important",
                  mb: 2,
                  fontWeight: "bold",
                }}
              >
                Field Options
              </Typography>
              {fieldOptions.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        ID
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Label
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Code
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fieldOptions.map((option) => (
                      <TableRow key={option.id}>
                        <TableCell
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          {option.id}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          {option.label}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          {option.code}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDeleteFieldOption(option.id)}
                            sx={{ color: "#d6393a" }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography
                  sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                >
                  No field options available.
                </Typography>
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
                  sx={{ flex: 1 }}
                  InputLabelProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                  InputProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                />
                <TextField
                  label="Option Code"
                  value={newOption.code}
                  onChange={(e) =>
                    setNewOption({ ...newOption, code: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{ flex: 1 }}
                  InputLabelProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                  InputProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                />
                <CTAButton variant="contained" onClick={handleAddFieldOption}>
                  Add Option
                </CTAButton>
              </Box>
            </>
          )}
        </Box>
      );
    }

    if (tab.name === ENTITY_TYPES.ADDON_TYPES) {
      return (
        <Box>
          {tab.writableFields.map((field) => {
            if (field === "instrument_ids") {
              const lookupItems = data.instruments || [];
              return (
                <FormControl fullWidth margin="normal" size="small" key={field}>
                  <InputLabel
                    sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                  >
                    INSTRUMENTS
                  </InputLabel>
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
                    sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                  >
                    {lookupItems.map((item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
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
                InputLabelProps={{
                  sx: { fontFamily: "Helvetica, sans-serif !important" },
                }}
                InputProps={{
                  sx: { fontFamily: "Helvetica, sans-serif !important" },
                }}
              />
            );
          })}
          {modalAction === "edit" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Helvetica, sans-serif !important",
                  mb: 2,
                  fontWeight: "bold",
                }}
              >
                AddOns
              </Typography>
              {addonOptions.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        ID
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Label
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Code
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addonOptions.map((addon) => (
                      <TableRow key={addon.id}>
                        <TableCell
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          {addon.id}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          {addon.label}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                          }}
                        >
                          {addon.code}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDeleteAddon(addon.id)}
                            sx={{ color: "#d6393a" }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography
                  sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                >
                  No addons available.
                </Typography>
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
                  sx={{ flex: 1 }}
                  InputLabelProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                  InputProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                />
                <TextField
                  label="AddOn Code"
                  value={newOption.code}
                  onChange={(e) =>
                    setNewOption({ ...newOption, code: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{ flex: 1 }}
                  InputLabelProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                  InputProps={{
                    sx: { fontFamily: "Helvetica, sans-serif !important" },
                  }}
                />
                <CTAButton variant="contained" onClick={handleAddAddon}>
                  Add AddOn
                </CTAButton>
              </Box>
            </>
          )}
        </Box>
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
                  fontFamily: "Helvetica, sans-serif !important",
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
                <Typography sx={{ py: 2 }}>
                  No {tab.name.toLowerCase()} found.
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
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      ...(field === "is_available" &&
                        tab.name === ENTITY_TYPES.INSTRUMENTS && {
                          color: item[field] ? "#388e3c" : "#d6393a",
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
                          borderRadius: "4px",
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
                    sx={{ color: "#d6393a" }}
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
    <Fade in timeout={800}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
        }}
        className="instruments-admin-page"
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
                Instruments Management
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
                  sx={{ fontFamily: "Helvetica, sans-serif !important" }}
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
                      Loading data...
                    </Typography>
                  </ToolCard>
                </Box>
              ) : (
                <ToolCard>
                  <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => {
                      setActiveTab(newValue);
                      setFilterInstrumentId("");
                      setFilterCategoryId("");
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      mb: 4,
                      "& .MuiTab-root": {
                        fontFamily: "Helvetica, sans-serif !important",
                        textTransform: "none",
                        fontWeight: "bold",
                        color: "#666",
                        "&.Mui-selected": {
                          color: "#1976d2",
                        },
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#1976d2",
                      },
                    }}
                  >
                    {tabs.map((tab, index) => (
                      <Tab
                        label={tab.name}
                        key={tab.name}
                        value={index}
                        sx={{ fontFamily: "Helvetica, sans-serif !important" }}
                      />
                    ))}
                  </Tabs>
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
                        label={`Search ${tabs[activeTab].name}`}
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
                      {tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS && (
                        <FormControl sx={{ minWidth: "200px" }} size="small">
                          <InputLabel
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Filter by Category
                          </InputLabel>
                          <Select
                            value={filterCategoryId}
                            onChange={(e) =>
                              setFilterCategoryId(e.target.value)
                            }
                            label="Filter by Category"
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
                              All Categories
                            </MenuItem>
                            {data.categories.map((category) => (
                              <MenuItem
                                key={category.id}
                                value={category.id}
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                }}
                              >
                                {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                      {(tabs[activeTab].name ===
                        ENTITY_TYPES.CONFIGURABLE_FIELDS ||
                        tabs[activeTab].name === ENTITY_TYPES.ADDON_TYPES) && (
                        <FormControl sx={{ minWidth: "200px" }} size="small">
                          <InputLabel
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                            }}
                          >
                            Filter by Instrument
                          </InputLabel>
                          <Select
                            value={filterInstrumentId}
                            onChange={(e) =>
                              setFilterInstrumentId(e.target.value)
                            }
                            label="Filter by Instrument"
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
                              All Instruments
                            </MenuItem>
                            {data.instruments.map((instrument) => (
                              <MenuItem
                                key={instrument.id}
                                value={instrument.id}
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                }}
                              >
                                {instrument.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                    <CTAButton
                      variant="contained"
                      startIcon={<Add sx={{ color: "white" }} />}
                      onClick={openAddModal}
                      disabled={userRole !== "admin"}
                    >
                      Add {tabs[activeTab].name.slice(0, -1)}
                    </CTAButton>
                  </Box>
                  {renderTable()}
                </ToolCard>
              )}
            </Container>
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
                  fontFamily: "Helvetica, sans-serif !important",
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
                <CancelButton onClick={handleModalClose}>Cancel</CancelButton>
                <CTAButton type="submit" variant="contained">
                  {modalAction === "add" ? "Create" : "Save"}
                </CTAButton>
              </DialogActions>
            </Dialog>
          </ErrorBoundary>
        </main>
      </Box>
    </Fade>
  );
};

export default InstrumentsAdmin;
