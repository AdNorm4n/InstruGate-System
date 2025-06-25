import React, { useState, useEffect, useMemo, useContext } from "react";
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
  Snackbar,
  Tabs,
  Tab,
  Divider,
  Fade,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import api from "../api";
import { UserContext } from "../contexts/UserContext";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/InstrumentsAdmin.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...(theme?.mixins?.toolbar || {
    minHeight: 56,
    "@media (min-width:600px)": {
      minHeight: 64,
    },
  }),
}));

const ToolCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
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

const ENTITY_TYPES = {
  CATEGORIES: "Categories",
  INSTRUMENT_TYPES: "Instrument Types",
  INSTRUMENTS: "Instruments",
  CONFIGURABLE_FIELDS: "Configurable Fields",
  ADDON_TYPES: "AddOn Types",
};

const CATEGORY_CHOICES = [
  { value: "Pressure Instruments", label: "Pressure Instruments" },
  { value: "Temperature Instruments", label: "Temperature Instruments" },
  { value: "Test Instruments", label: "Test Instruments" },
];

const TYPE_CHOICES = [
  { value: "Pressure Gauges", label: "Pressure Gauges" },
  { value: "Digital Gauges", label: "Digital Gauges" },
  { value: "High-Purity", label: "High-Purity" },
  { value: "Test Gauges", label: "Test Gauges" },
  { value: "Differential Gauges", label: "Differential Gauges" },
  { value: "Pressure Switches", label: "Pressure Switches" },
  { value: "Pressure Sensors", label: "Pressure Sensors" },
  { value: "Diaphragm Seals - isolates", label: "Diaphragm Seals - Isolators" },
  { value: "Threaded Seals", label: "Threaded Seals" },
  { value: "Isolation Rings", label: "Isolation Rings" },
  { value: "Flanged Seals", label: "Flanged Seals" },
  { value: "In-Line", label: "In-Line" },
  { value: "Accessories", label: "Accessories" },
  { value: "Thermometers", label: "Thermometers" },
  { value: "Bimetals Thermometers", label: "Bimetals Thermometers" },
  { value: "Gas Actuated Thermometers", label: "Gas Actuated Thermometers" },
  { value: "Thermowells", label: "Thermowells" },
];

// Helper function to convert string to title case
const toTitleCase = (str) => {
  return str
    .replace("_id", "")
    .replace("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const InstrumentsAdmin = () => {
  const { userRole } = useContext(UserContext);
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
    types: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalType, setModalType] = useState("");
  const [modalAction, setModalAction] = useState("add");
  const [modalError, setModalError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: "id",
    direction: "asc",
  });
  const [activeTab, setActiveTab] = useState(0);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [newOption, setNewOption] = useState({
    label: "",
    code: "",
    price: "",
  });
  const [filterInstrumentId, setFilterInstrumentId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterTypeCategoryId, setFilterTypeCategoryId] = useState("");
  const [addonOptions, setAddonOptions] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const validateImage = (file) => {
    const validTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      setModalError("Only JPEG or PNG images are allowed.");
      return false;
    }
    if (file.size > maxSize) {
      setModalError("Image size must be less than 5MB.");
      return false;
    }
    return true;
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({});
    setModalType("");
    setModalAction("add");
    setModalError("");
    setFieldOptions([]);
    setAddonOptions([]);
    setNewOption({ label: "", code: "", price: "" });
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const tabs = [
    {
      name: ENTITY_TYPES.CATEGORIES,
      endpoint: "/api/admin/categories/",
      fields: ["id", "name"],
      writableFields: ["name"],
      searchFields: ["name"],
      lookups: {},
      displayFields: { id: "ID", name: "Name" },
      dataKey: "categories",
    },
    {
      name: ENTITY_TYPES.INSTRUMENT_TYPES,
      endpoint: "/api/admin/instrument-types/",
      fields: ["id", "name", "category.name"],
      writableFields: ["name", "category_id"],
      searchFields: ["name"],
      lookups: { category_id: "categories" },
      displayFields: { id: "ID", name: "Name", "category.name": "Category" },
      dataKey: "types",
    },
    {
      name: ENTITY_TYPES.INSTRUMENTS,
      endpoint: "/api/admin/instruments/",
      fields: [
        "id",
        "name",
        "type.name",
        "category.name",
        "base_price",
        "image",
        "is_available",
      ],
      writableFields: [
        "name",
        "type_id",
        "base_price",
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
        base_price: "Base Price (RM)",
        image: "Image",
        is_available: "Available",
      },
      dataKey: "instruments",
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
      dataKey: "configurablefields",
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
      dataKey: "addontypes",
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
        "/api/admin/instrument-types/",
        "/api/admin/categories/",
      ];
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          api.get(endpoint, { headers }).catch((err) => ({
            error: err.response?.data?.detail || "Network error",
            data: [],
          }))
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
      setData(newData);
      setFilteredData({
        instruments: newData.instruments,
        configurablefields: newData.configurablefields,
        addontypes: newData.addontypes,
        types: newData.types,
        categories: newData.categories,
      });

      if (responses.some((res) => res.error)) {
        setError("Some data could not be loaded. Please try again.");
      }
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

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
    if (field === "base_price") {
      return obj[field] ? `RM ${parseFloat(obj[field]).toFixed(2)}` : "N/A";
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
      if (key === "type" && subKey === "name") {
        const typeId = obj.type_id || (obj.type && obj.type.id);
        if (typeId) {
          const type = data.types.find((t) => t.id === typeId);
          return type?.name || "N/A";
        }
        return obj.type?.name || "N/A";
      }
      return obj[key]?.[subKey] || "N/A";
    }
    return obj[field] || "N/A";
  };

  const filteredItems = useMemo(() => {
    const tab = tabs[activeTab];
    const key = tab.dataKey;
    let filtered = [...(data[key] || [])];

    if (tab.name === ENTITY_TYPES.INSTRUMENTS && filterCategoryId) {
      filtered = filtered.filter(
        (item) =>
          item.category_id === parseInt(filterCategoryId) ||
          (item.category && item.category.id === parseInt(filterCategoryId))
      );
    } else if (
      tab.name === ENTITY_TYPES.INSTRUMENT_TYPES &&
      filterTypeCategoryId
    ) {
      filtered = filtered.filter(
        (item) =>
          item.category_id === parseInt(filterTypeCategoryId) ||
          (item.category && item.category.id === parseInt(filterTypeCategoryId))
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
        item.instrument_ids?.includes(parseInt(filterInstrumentId))
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
      if (sortConfig.field === "id" || sortConfig.field === "base_price") {
        return (
          multiplier *
          ((a?.[sortConfig.field] || 0) - (b?.[sortConfig.field] || 0))
        );
      }
      return multiplier * fieldA.toString().localeCompare(fieldB.toString());
    });

    return filtered;
  }, [
    activeTab,
    data,
    searchTerm,
    sortConfig,
    filterCategoryId,
    filterInstrumentId,
    filterTypeCategoryId,
  ]);

  useEffect(() => {
    const tab = tabs[activeTab];
    const key = tab.dataKey;
    setFilteredData((prev) => ({ ...prev, [key]: filteredItems }));
  }, [filteredItems, activeTab]);

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
    setNewOption({ label: "", code: "", price: "" });
    setImagePreview(null);
    setModalError("");
    setOpenModal(true);
  };

  const openEditModal = async (item) => {
    if (userRole !== "admin") {
      setError("You do not have permission to edit items.");
      return;
    }
    setModalAction("edit");
    setModalData({ ...item, image: item.image || null });
    setModalType(tabs[activeTab].name);
    setImagePreview(item.image || null);
    setModalError("");
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };

      if (tabs[activeTab].name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
        const response = await api.get(`/api/admin/field-options/`, {
          headers,
          params: { field_id: item.id },
        });
        setFieldOptions(
          Array.isArray(response.data)
            ? response.data.filter((opt) => opt.field_id === item.id)
            : []
        );
      } else if (tabs[activeTab].name === ENTITY_TYPES.ADDON_TYPES) {
        const response = await api.get(`/api/admin/addons/`, {
          headers,
          params: { addon_type_id: item.id },
        });
        setAddonOptions(
          Array.isArray(response.data)
            ? response.data.filter((addon) => addon.addon_type_id === item.id)
            : []
        );
      }
    } catch (err) {
      setModalError(
        `Failed to load options: ${
          err.response?.data?.detail || "Network error"
        }`
      );
    }
    setNewOption({ label: "", code: "", price: "" });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (userRole !== "admin") {
      setModalError("You do not have permission to save items.");
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

    if (tab.name === ENTITY_TYPES.CATEGORIES && !modalData.name) {
      setModalError("Please select a category name.");
      return;
    }
    if (
      tab.name === ENTITY_TYPES.INSTRUMENT_TYPES &&
      (!modalData.name || !modalData.category_id)
    ) {
      setModalError(
        !modalData.name
          ? "Please select an instrument type."
          : "Please select a category."
      );
      return;
    }

    for (const field of requiredFields) {
      if (!modalData[field] && modalData[field] !== 0) {
        setModalError(
          `Please provide ${field
            .replace("_id", "")
            .replace("_", " ")
            .toLowerCase()}.`
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
        if (!modalData.type_id || isNaN(parseInt(modalData.type_id, 10))) {
          setModalError("Please select a valid instrument type.");
          return;
        }
        formData.append("type_id", parseInt(modalData.type_id, 10));
        const basePrice = parseFloat(modalData.base_price);
        if (isNaN(basePrice)) {
          setModalError("Please provide a valid base price.");
          return;
        }
        formData.append("base_price", basePrice.toFixed(2));
        formData.append("description", modalData.description || "");
        formData.append("specifications", modalData.specifications || "");
        formData.append(
          "is_available",
          modalData.is_available === true ? "true" : "false"
        );

        if (modalData.image instanceof File) {
          if (!validateImage(modalData.image)) return;
          formData.append("image", modalData.image);
        } else if (modalAction === "edit" && modalData.image === null) {
          formData.append("image", "");
        }

        await api({
          method,
          url: endpoint,
          data: formData,
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setSuccess(
          `${modalType} ${
            modalAction === "add" ? "added" : "updated"
          } successfully!`
        );
      } else {
        let payload = {};
        if (tab.name === ENTITY_TYPES.CATEGORIES) {
          payload = { name: modalData.name || "" };
        } else if (tab.name === ENTITY_TYPES.INSTRUMENT_TYPES) {
          payload = {
            name: modalData.name || "",
            category_id: parseInt(modalData.category_id, 10),
          };
        } else if (tab.name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
          if (!modalData.instrument_id) {
            setModalError("Please select an instrument.");
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
        headers["Content-Type"] = "application/json";
        await api({ method, url: endpoint, data: payload, headers });
        setSuccess(
          `${modalType} ${
            modalAction === "add" ? "added" : "updated"
          } successfully!`
        );
      }
      await fetchData();
      handleModalClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        Object.entries(err.response?.data || {})
          .map(([key, value]) => `${key}: ${value[0] || value}`)
          .join(", ") ||
        "Network error. Please try again.";
      setModalError(
        `Failed to save ${modalType.toLowerCase()}: ${errorMessage}`
      );
      console.error(
        "API Error:",
        JSON.stringify(err.response?.data, null, 2),
        err
      );
    }
  };

  const handleAddFieldOption = async () => {
    if (!newOption.label || !newOption.code || !newOption.price) {
      setModalError("Label, code, and price are required for field options.");
      return;
    }
    if (!modalData.id) {
      setModalError(
        "Please save the configurable field before adding options."
      );
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };
      const payload = {
        field_id: modalData.id,
        label: newOption.label,
        code: newOption.code,
        price: parseFloat(newOption.price) || 0,
      };
      const response = await api.post("/api/admin/field-options/", payload, {
        headers,
      });
      setFieldOptions([...fieldOptions, response.data]);
      setNewOption({ label: "", code: "", price: "" });
      setSuccess("Field option added successfully!");
    } catch (err) {
      setModalError(
        `Failed to add field option: ${
          err.response?.data?.detail ||
          Object.values(err.response?.data || {})[0]?.[0] ||
          "Network error"
        }`
      );
    }
  };

  const handleAddAddon = async () => {
    if (!newOption.label || !newOption.code || !newOption.price) {
      setModalError("Label, code, and price are required for addons.");
      return;
    }
    if (!modalData.id) {
      setModalError("Please save the addon type before adding addons.");
      return;
    }
    try {
      const access = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${access}` };
      const payload = {
        addon_type_id: modalData.id,
        label: newOption.label,
        code: newOption.code,
        price: parseFloat(newOption.price) || 0,
      };
      const response = await api.post("/api/admin/addons/", payload, {
        headers,
      });
      setAddonOptions([...addonOptions, response.data]);
      setNewOption({ label: "", code: "", price: "" });
      setSuccess("AddOn added successfully!");
    } catch (err) {
      setModalError(
        `Failed to add addon: ${
          err.response?.data?.detail ||
          Object.values(err.response?.data || {})[0]?.[0] ||
          "Network error"
        }`
      );
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

  const handleDeleteFieldOption = async (optionId) => {
    handleOpenConfirmDialog(async () => {
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
            err.response?.data?.detail || "Network error"
          }`
        );
      }
    }, "Are you sure you want to delete this field option?");
  };

  const handleDeleteAddon = async (addonId) => {
    handleOpenConfirmDialog(async () => {
      try {
        const access = localStorage.getItem("access");
        await api.delete(`/api/admin/addons/${addonId}/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        setAddonOptions(addonOptions.filter((opt) => opt.id !== addonId));
        setSuccess("Addon deleted successfully!");
      } catch (err) {
        setError(
          `Failed to delete addon: ${
            err.response?.data?.detail || "Network error"
          }`
        );
      }
    }, "Are you sure you want to delete this addon?");
  };

  const handleDelete = async (id) => {
    if (userRole !== "admin") {
      setError("You do not have permission to delete items.");
      return;
    }
    handleOpenConfirmDialog(async () => {
      try {
        const access = localStorage.getItem("access");
        const tab = tabs[activeTab];
        await api.delete(`${tab.endpoint}${id}/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        setSuccess(`${tab.name} deleted successfully!`);
        await fetchData();
      } catch (err) {
        setError(
          `Failed to delete ${tab.name}: ${
            err.response?.data?.detail || "Network error"
          }`
        );
      }
    }, `Are you sure you want to delete this ${tabs[activeTab].name.toLowerCase().slice(0, -1)}?`);
  };

  const renderModalContent = () => {
    if (!modalType) {
      return null;
    }

    const tab = tabs.find((t) => t.name === modalType);
    if (!tab) {
      return null;
    }

    if (tab.name === ENTITY_TYPES.CATEGORIES) {
      return (
        <Box>
          <FormControl fullWidth margin="normal" size="small" required>
            <InputLabel
              sx={{ fontFamily: "'Inter', sans-serif", color: "#d1d5db" }}
            >
              Category Name
            </InputLabel>
            <Select
              value={modalData.name || ""}
              onChange={(e) =>
                setModalData({ ...modalData, name: e.target.value })
              }
              sx={{
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
                Select a category
              </MenuItem>
              {CATEGORY_CHOICES.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      );
    }

    if (tab.name === ENTITY_TYPES.INSTRUMENT_TYPES) {
      return (
        <Box>
          <FormControl fullWidth margin="normal" size="small" required>
            <InputLabel
              sx={{ fontFamily: "'Inter', sans-serif", color: "#d1d5db" }}
            >
              Instrument Type
            </InputLabel>
            <Select
              value={modalData.name || ""}
              onChange={(e) =>
                setModalData({ ...modalData, name: e.target.value })
              }
              sx={{
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
                Select an instrument type
              </MenuItem>
              {TYPE_CHOICES.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" size="small" required>
            <InputLabel
              sx={{ fontFamily: "'Inter', sans-serif", color: "#d1d5db" }}
            >
              Category
            </InputLabel>
            <Select
              value={modalData.category_id || ""}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  category_id: parseInt(e.target.value, 10) || null,
                })
              }
              sx={{
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
                Select a category
              </MenuItem>
              {data.categories.map((category) => (
                <MenuItem
                  key={category.id}
                  value={category.id}
                  sx={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      );
    }

    if (tab.name === ENTITY_TYPES.INSTRUMENTS) {
      return (
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Inter', sans-serif",
              paddingTop: 2,
              mb: 2,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Basic Info
          </Typography>
          <TextField
            label="Name"
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
              sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff", // Ensure input text is white
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff", // Explicitly set input text color
                },
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
          <TextField
            label="Base Price (RM)"
            value={modalData.base_price || ""}
            onChange={(e) =>
              setModalData({ ...modalData, base_price: e.target.value })
            }
            fullWidth
            margin="normal"
            variant="outlined"
            size="small"
            type="number"
            required
            inputProps={{ min: 0, step: "0.01" }}
            InputLabelProps={{
              sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff", // Ensure input text is white
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff", // Explicitly set input text color
                },
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
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel
              sx={{ fontFamily: "'Inter', sans-serif", color: "#d1d5db" }}
            >
              Type
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
              sx={{
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
                Select a type
              </MenuItem>
              {data.types.map((item) => (
                <MenuItem
                  key={item.id}
                  value={item.id}
                  sx={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel
              sx={{ fontFamily: "'Inter', sans-serif", color: "#d1d5db" }}
            >
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
              sx={{
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
              <MenuItem value="true" sx={{ fontFamily: "'Inter', sans-serif" }}>
                Yes
              </MenuItem>
              <MenuItem
                value="false"
                sx={{ fontFamily: "'Inter', sans-serif" }}
              >
                No
              </MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2, bgcolor: "#4b5563" }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Inter', sans-serif",
              mb: 2,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Instrument Description
          </Typography>
          <TextField
            label="Description"
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
              sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff", // Ensure input text is white
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff", // Explicitly set input text color
                },
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
          <TextField
            label="Specifications"
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
              sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Inter', sans-serif",
                color: "#ffffff", // Ensure input text is white
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff", // Explicitly set input text color
                },
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

          <Divider sx={{ my: 2, bgcolor: "#4b5563" }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Inter', sans-serif",
              mb: 2,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Media
          </Typography>
          <Box
            sx={{ mb: 2, display: "flex", alignItems: "flex-start", gap: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && validateImage(file)) {
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setModalData({ ...modalData, image: file });
                    setImagePreview(URL.createObjectURL(file));
                  } else if (!file) {
                    setModalData({ ...modalData, image: null });
                    setImagePreview(null);
                  }
                }}
                style={{ width: "100%", marginBottom: "8px", color: "#ffffff" }}
              />
              {(imagePreview ||
                (modalData.image && typeof modalData.image === "string")) && (
                <Box
                  sx={{
                    mt: 2,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <img
                    src={imagePreview || modalData.image}
                    alt="Instrument Preview"
                    style={{
                      maxWidth: "150px",
                      maxHeight: "150px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "1px solid #4b5563",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      color: "#9ca3af",
                      display: "none",
                      mt: 1,
                    }}
                  >
                    Image unavailable
                  </Typography>
                  <CTAButton
                    size="small"
                    onClick={() => {
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setModalData({ ...modalData, image: null });
                      setImagePreview(null);
                    }}
                    sx={{
                      mt: 0,
                      bgcolor: "#ef4444",
                      "&:hover": { bgcolor: "#dc2626" },
                      fontFamily: "'Inter', sans-serif",
                      color: "#ffffff",
                      minWidth: "100px",
                      height: "40px",
                    }}
                  >
                    Remove Image
                  </CTAButton>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      );
    }

    if (tab.name === ENTITY_TYPES.CONFIGURABLE_FIELDS) {
      return (
        <Box>
          {tab.writableFields.map((field) => {
            if (tab.lookups[field]) {
              const lookupKey = tab.lookups[field];
              const lookupItems = data[lookupKey] || [];
              return (
                <FormControl fullWidth margin="normal" size="small" key={field}>
                  <InputLabel
                    sx={{ fontFamily: "'Inter', sans-serif", color: "#d1d5db" }}
                  >
                    {toTitleCase(field)}
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
                    sx={{
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
                      sx={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Select an option
                    </MenuItem>
                    {lookupItems.map((item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                        sx={{ fontFamily: "'Inter', sans-serif" }}
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
                label={toTitleCase(field)}
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
                  sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                }}
                InputProps={{
                  sx: {
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff", // Ensure input text is white
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": {
                      color: "#ffffff", // Explicitly set input text color
                    },
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
            );
          })}
          {modalAction === "edit" && (
            <>
              <Divider sx={{ my: 2, bgcolor: "#4b5563" }} />
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  mb: 2,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                Field Options
              </Typography>
              {fieldOptions.length > 0 ? (
                <Table
                  size="small"
                  sx={{ bgcolor: "#2d2d2d", borderRadius: "8px" }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        ID
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        Label
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        Code
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        Price (RM)
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
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
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {option.id}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {option.label}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {option.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {option.price
                            ? `RM ${parseFloat(option.price).toFixed(2)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDeleteFieldOption(option.id)}
                            sx={{ color: "#d6393a" }}
                          >
                            <Delete sx={{ color: "#d6393a" }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography
                  sx={{ fontFamily: "'Inter', sans-serif", color: "#9ca3af" }}
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
                  sx={{
                    flex: 1,
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": { color: "#ffffff" },
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
                  InputLabelProps={{
                    sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                  }}
                  InputProps={{ sx: { fontFamily: "'Inter', sans-serif" } }}
                />
                <TextField
                  label="Option Code"
                  value={newOption.code}
                  onChange={(e) =>
                    setNewOption({ ...newOption, code: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    flex: 1,
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": { color: "#ffffff" },
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
                  InputLabelProps={{
                    sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                  }}
                  InputProps={{ sx: { fontFamily: "'Inter', sans-serif" } }}
                />
                <TextField
                  label="Price (RM)"
                  value={newOption.price}
                  onChange={(e) =>
                    setNewOption({ ...newOption, price: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    flex: 1,
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": { color: "#ffffff" },
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
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  InputLabelProps={{
                    sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                  }}
                  InputProps={{ sx: { fontFamily: "'Inter', sans-serif" } }}
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
                    sx={{ fontFamily: "'Inter', sans-serif", color: "#d1d5db" }}
                  >
                    {toTitleCase(field.replace("_ids", "s"))}
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
                    sx={{
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
                    {lookupItems.map((item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                        sx={{ fontFamily: "'Inter', sans-serif" }}
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
                label={toTitleCase(field)}
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
                  sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
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
            );
          })}
          {modalAction === "edit" && (
            <>
              <Divider sx={{ my: 2, bgcolor: "#4b5563" }} />
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  mb: 2,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                AddOns
              </Typography>
              {addonOptions.length > 0 ? (
                <Table
                  size="small"
                  sx={{ bgcolor: "#2d2d2d", borderRadius: "8px" }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        ID
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        Label
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        Code
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
                      >
                        Price (RM)
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          bgcolor: "#252525",
                        }}
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
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {addon.id}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {addon.label}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {addon.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            color: "#ffffff",
                          }}
                        >
                          {addon.price
                            ? `RM ${parseFloat(addon.price).toFixed(2)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDeleteAddon(addon.id)}
                            sx={{ color: "#d6393a" }}
                          >
                            <Delete sx={{ color: "#d6393a" }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography
                  sx={{ fontFamily: "'Inter', sans-serif", color: "#9ca3af" }}
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
                  sx={{
                    flex: 1,
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": { color: "#ffffff" },
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
                  InputLabelProps={{
                    sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                  }}
                  InputProps={{ sx: { fontFamily: "'Inter', sans-serif" } }}
                />
                <TextField
                  label="AddOn Code"
                  value={newOption.code}
                  onChange={(e) =>
                    setNewOption({ ...newOption, code: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    flex: 1,
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": { color: "#ffffff" },
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
                  InputLabelProps={{
                    sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                  }}
                  InputProps={{ sx: { fontFamily: "'Inter', sans-serif" } }}
                />
                <TextField
                  label="Price (RM)"
                  value={newOption.price}
                  onChange={(e) =>
                    setNewOption({ ...newOption, price: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{
                    flex: 1,
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": { color: "#ffffff" },
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
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  InputLabelProps={{
                    sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                  }}
                  InputProps={{ sx: { fontFamily: "'Inter', sans-serif" } }}
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
    const items = filteredData[tab.dataKey] || [];

    return (
      <Box sx={{ overflowX: "auto", borderRadius: "12px", p: 3 }}>
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
              {tab.fields.map((field) => (
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
                    width: field === "id" ? "80px" : "1fr",
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
                  {tab.displayFields[field] || field.toUpperCase()}
                </TableCell>
              ))}
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
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tab.fields.length + 1}
                  align="center"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#9ca3af",
                    py: 4,
                    fontSize: "0.95rem",
                    border: "none",
                    bgcolor: "#1a1a1a",
                  }}
                >
                  <Typography
                    sx={{ fontFamily: "'Inter', sans-serif", color: "#9ca3af" }}
                  >
                    No {tab.name.toLowerCase()} found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    bgcolor: "#2d2d2d",
                    "&:hover": {
                      bgcolor: "#333333",
                    },
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
                        py: 2,
                        px: 3,
                        border: "none",
                        width: field === "id" ? "80px" : "1fr",
                        textAlign: field === "id" ? "center" : "left",
                        ...(field === "is_available" &&
                          tab.name === ENTITY_TYPES.INSTRUMENTS && {
                            color: item[field] ? "#22c55e" : "#ef4444",
                            fontWeight: 500,
                          }),
                      }}
                    >
                      {field === "image" ? (
                        item[field] ? (
                          <>
                            <img
                              src={item[field]}
                              alt={item.name || "Instrument"}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                border: "1px solid #4b5563",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "block";
                              }}
                            />
                            <Typography
                              sx={{
                                fontFamily: "'Inter', sans-serif",
                                color: "#9ca3af",
                                display: "none",
                                fontSize: "0.85rem",
                              }}
                            >
                              Image unavailable
                            </Typography>
                          </>
                        ) : (
                          <Typography
                            sx={{
                              fontFamily: "'Inter', sans-serif",
                              color: "#9ca3af",
                              fontSize: "0.85rem",
                            }}
                          >
                            No image
                          </Typography>
                        )
                      ) : field.includes(".") ||
                        field === "instruments" ||
                        field === "base_price" ? (
                        getField(item, field)
                      ) : field === "is_available" ? (
                        item[field] ? (
                          "Yes"
                        ) : (
                          "No"
                        )
                      ) : (
                        item[field]
                      )}
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{ py: 2, px: 3, border: "none", width: "120px" }}
                  >
                    <IconButton
                      onClick={() => openEditModal(item)}
                      disabled={userRole !== "admin"}
                      sx={{
                        color: "#ffffff",
                        "&:hover": { color: "#ffffff", bgcolor: "#3b82f61a" },
                        mr: 1,
                      }}
                    >
                      <Edit sx={{ fontSize: "1.2rem", color: "#2563eb" }} />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      disabled={userRole !== "admin"}
                      sx={{
                        color: "#d6393a",
                        "&:hover": { color: "#d6393a", bgcolor: "#ef44441a" },
                      }}
                    >
                      <Delete sx={{ fontSize: "1.2rem", color: "#d6393a" }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    );
  };

  return (
    <Fade in timeout={800}>
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
        className="instruments-admin-page"
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
                  color: "#ffffff", // White for page title
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
                Instruments Management
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
                    fontFamily: "Inter, sans-serif !important",
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
                  sx={{ fontFamily: "Inter, sans-serif !important" }}
                >
                  {error}
                </Alert>
              </Snackbar>
              <Snackbar
                open={!!modalError}
                autoHideDuration={6000}
                onClose={() => setModalError("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity="error"
                  onClose={() => setModalError("")}
                  sx={{ fontFamily: "Inter, sans-serif !important" }}
                >
                  {modalError}
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
                      Loading data...
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <>
                  <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => {
                      setActiveTab(newValue);
                      setFilterInstrumentId("");
                      setFilterCategoryId("");
                      setFilterTypeCategoryId("");
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      mb: 4,
                      borderBottom: "1px solid #4b5563",
                      "& .MuiTab-root": {
                        fontFamily: "'Inter', sans-serif",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: "#9ca3af",
                        px: 3,
                        py: 2,
                        borderRadius: "8px",
                        "&.Mui-selected": {
                          color: "#3b82f6",
                          bgcolor: "#3b82f61a",
                        },
                        "&:hover": {
                          color: "#3b82f6",
                          bgcolor: "#3b82f61a",
                        },
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#3b82f6",
                        height: "3px",
                        borderRadius: "2px",
                      },
                    }}
                  >
                    {tabs.map((tab, index) => (
                      <Tab
                        label={tab.name}
                        key={tab.name}
                        value={index}
                        sx={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    ))}
                  </Tabs>
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
                      label={`Search ${tabs[activeTab].name}`}
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
                          "& input": { color: "#ffffff" },
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
                    {(tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS ||
                      tabs[activeTab].name === ENTITY_TYPES.INSTRUMENT_TYPES ||
                      tabs[activeTab].name ===
                        ENTITY_TYPES.CONFIGURABLE_FIELDS ||
                      tabs[activeTab].name === ENTITY_TYPES.ADDON_TYPES) && (
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
                          {tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS ||
                          tabs[activeTab].name === ENTITY_TYPES.INSTRUMENT_TYPES
                            ? "Filter by Category"
                            : "Filter by Instrument"}
                        </InputLabel>
                        <Select
                          value={
                            tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS
                              ? filterCategoryId
                              : tabs[activeTab].name ===
                                ENTITY_TYPES.INSTRUMENT_TYPES
                              ? filterTypeCategoryId
                              : filterInstrumentId
                          }
                          onChange={(e) =>
                            tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS
                              ? setFilterCategoryId(e.target.value)
                              : tabs[activeTab].name ===
                                ENTITY_TYPES.INSTRUMENT_TYPES
                              ? setFilterTypeCategoryId(e.target.value)
                              : setFilterInstrumentId(e.target.value)
                          }
                          label={
                            tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS ||
                            tabs[activeTab].name ===
                              ENTITY_TYPES.INSTRUMENT_TYPES
                              ? "Filter by Category"
                              : "Filter by Instrument"
                          }
                          sx={{
                            borderRadius: "8px",
                            fontFamily: "'Inter', sans-serif",
                            bgcolor: "#2a2a2a",
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
                            "& .MuiSelect-select": { color: "#ffffff" },
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
                            {tabs[activeTab].name ===
                              ENTITY_TYPES.INSTRUMENTS ||
                            tabs[activeTab].name ===
                              ENTITY_TYPES.INSTRUMENT_TYPES
                              ? "All Categories"
                              : "All Instruments"}
                          </MenuItem>
                          {(tabs[activeTab].name === ENTITY_TYPES.INSTRUMENTS ||
                          tabs[activeTab].name === ENTITY_TYPES.INSTRUMENT_TYPES
                            ? data.categories
                            : data.instruments
                          ).map((item) => (
                            <MenuItem
                              key={item.id}
                              value={item.id}
                              sx={{
                                fontFamily: "'Inter', sans-serif",
                                color: "#ffffff",
                              }}
                            >
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
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
                      Add New
                    </CTAButton>
                  </Box>
                  {renderTable()}
                </>
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
                  {modalAction === "add"
                    ? `Add ${modalType.slice(0, -1)}`
                    : `Edit ${modalType.slice(0, -1)}`}
                </DialogTitle>
                <DialogContent sx={{ py: 4, px: 4, bgcolor: "#1e1e1e" }}>
                  {renderModalContent()}
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
                    onClick={handleSave}
                    disabled={userRole !== "admin"}
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
                    {modalAction === "add" ? "Add" : "Save"}
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
                  Confirm Action
                </DialogTitle>
                <DialogContent
                  sx={{
                    py: 4,
                    px: 4,
                    bgcolor: "#1e1e1e",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
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
              <Dialog
                open={openModal}
                onClose={handleModalClose}
                maxWidth={modalType === ENTITY_TYPES.ADDON_TYPES ? "lg" : "md"} // Larger for addons
                fullWidth
                sx={{
                  "& .MuiDialog-paper": {
                    bgcolor: "#1a1a1a",
                    color: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                    p: 2,
                  },
                }}
              >
                <DialogTitle
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: "#ffffff",
                    bgcolor: "#252525",
                    borderRadius: "8px 8px 0 0",
                    py: 2,
                    px: 3,
                  }}
                >
                  {modalAction === "add"
                    ? `Add ${modalType}`
                    : `Edit ${modalType}`}
                </DialogTitle>
                <DialogContent sx={{ mt: 2, px: 3, py: 2, bgcolor: "#1a1a1a" }}>
                  {modalError && (
                    <Alert
                      severity="error"
                      sx={{ mb: 2, fontFamily: "'Inter', sans-serif" }}
                    >
                      {modalError}
                    </Alert>
                  )}
                  {renderModalContent()}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, bgcolor: "#1a1a1a" }}>
                  <CancelButton onClick={handleModalClose}>Cancel</CancelButton>
                  <CTAButton
                    onClick={handleSave}
                    disabled={userRole !== "admin"}
                    sx={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Save
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

export default InstrumentsAdmin;
