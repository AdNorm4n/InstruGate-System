from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView,
    InstrumentTypeListView, InstrumentTypeDetailView,
    InstrumentListView, InstrumentDetailView,
    ConfigurableFieldListView, ConfigurableFieldDetailView,
    FieldOptionListView, FieldOptionDetailView,
    AddonTypeListView, AddonTypeDetailView,
    AddOnListView, AddOnDetailView,
    InstrumentConfigView, InstrumentOptionListView,
    QuotationCreateView, SubmittedQuotationView, QuotationReviewView,
    QuotationItemListView, QuotationItemDetailView,
    QuotationItemSelectionListView, QuotationItemSelectionDetailView,
    QuotationItemAddOnListView, QuotationItemAddOnDetailView,
    InstrumentImageUploadView
)

urlpatterns = [
    # Category Routes
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    # InstrumentType Routes
    path("instrument-types/", InstrumentTypeListView.as_view(), name="instrument-type-list"),
    path("instrument-types/<int:pk>/", InstrumentTypeDetailView.as_view(), name="instrument-type-detail"),
    # Instrument Routes
    path("instruments/", InstrumentListView.as_view(), name="instrument-list"),
    path("instruments/<int:pk>/", InstrumentDetailView.as_view(), name="instrument-detail"),
    path("instruments/<int:pk>/config/", InstrumentConfigView.as_view(), name="instrument-config"),
    path("instruments/<int:pk>/addons/", InstrumentOptionListView.as_view(), name="instrument-addons"),
    path("instruments/<int:pk>/upload-image/", InstrumentImageUploadView.as_view(), name="instrument-image-upload"),
    # ConfigurableField Routes
    path("configurable-fields/", ConfigurableFieldListView.as_view(), name="configurable-field-list"),
    path("configurable-fields/<int:pk>/", ConfigurableFieldDetailView.as_view(), name="configurable-field-detail"),
    # FieldOption Routes
    path("field-options/", FieldOptionListView.as_view(), name="field-option-list"),
    path("field-options/<int:pk>/", FieldOptionDetailView.as_view(), name="field-option-detail"),
    # AddonType Routes
    path("addon-types/", AddonTypeListView.as_view(), name="addon-type-list"),
    path("addon-types/<int:pk>/", AddonTypeDetailView.as_view(), name="addon-type-detail"),
    # AddOn Routes
    path("addons/", AddOnListView.as_view(), name="addon-list"),
    path("addons/<int:pk>/", AddOnDetailView.as_view(), name="addon-detail"),
    # Quotation Routes
    path("quotations/", QuotationCreateView.as_view(), name="quotation-create"),
    path("quotations/submitted/", SubmittedQuotationView.as_view(), name="submitted-quotation"),
    path("quotations/review/", QuotationReviewView.as_view(), name="quotation-review"),
    path("quotations/review/<int:pk>/", QuotationReviewView.as_view(), name="quotation-review-detail"),
    # QuotationItem Routes
    path("quotation-items/", QuotationItemListView.as_view(), name="quotation-item-list"),
    path("quotation-items/<int:pk>/", QuotationItemDetailView.as_view(), name="quotation-item-detail"),
    # QuotationItemSelection Routes
    path("quotation-item-selections/", QuotationItemSelectionListView.as_view(), name="quotation-item-selection-list"),
    path("quotation-item-selections/<int:pk>/", QuotationItemSelectionDetailView.as_view(), name="quotation-item-selection-detail"),
    # QuotationItemAddOn Routes
    path("quotation-item-addons/", QuotationItemAddOnListView.as_view(), name="quotation-item-addon-list"),
    path("quotation-item-addons/<int:pk>/", QuotationItemAddOnDetailView.as_view(), name="quotation-item-addon-detail"),
]