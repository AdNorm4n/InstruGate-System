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

// ... (All other imports, styled components, constants, and initial state remain unchanged)

// InstrumentsAdmin Component
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
  const [modalError, setModalError] = useState(""); // This remains for tracking errors
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

  // ... (validateImage function remains unchanged)

  const handleModalClose = () => {
    setOpenModal(false);
    setModalData({});
    setModalType("");
    setModalAction("add");
    setModalError(""); // Clear modalError when closing
    setFieldOptions([]);
    setAddonOptions([]);
    setNewOption({ label: "", code: "", price: "" });
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // ... (tabs array, fetchData, useEffect, getField, filteredItems, useEffect for filteredData, handleSort, openAddModal, openEditModal remain unchanged)

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

  // ... (handleOpenConfirmDialog, handleCloseConfirmDialog, handleConfirmAction, handleDeleteFieldOption, handleDeleteAddon, handleDelete remain unchanged)

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
              {CATEGORY_CHOICES.map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.value}
                  sx={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {item.label}
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
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff",
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
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff",
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
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff",
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
                color: "#ffffff",
                bgcolor: "#252525",
                "& .MuiInputBase-input": {
                  color: "#ffffff",
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
                  sx: { fontFamily: "'Inter', sans-serif", color: "#d1d5db" },
                }}
                InputProps={{
                  sx: {
                    fontFamily: "'Inter', sans-serif",
                    color: "#ffffff",
                    bgcolor: "#252525",
                    "& .MuiInputBase-input": {
                      color: "#ffffff",
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
                    Instruments
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

  // ... (renderTable remains unchanged)

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
                  color: "#ffffff",
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
                    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.6)",
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
                    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.8)",
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
                <DialogContent sx={{ py: 4, px: 4, bgcolor: "#1e1e1e" }}>
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
            </Container>
          </ErrorBoundary>
        </main>
      </Box>
    </Fade>
  );
};

export default InstrumentsAdmin;
