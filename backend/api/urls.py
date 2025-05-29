from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView,
    InstrumentTypeListView, InstrumentTypeDetailView,
    InstrumentListView, InstrumentDetailView, InstrumentImageUploadView, InstrumentConfigView,
    ConfigurableFieldListView, ConfigurableFieldDetailView,
    FieldOptionListView, FieldOptionDetailView,
    AddOnTypeListView, AddOnTypeDetailView,
    AddOnListView, AddOnDetailView, InstrumentOptionListView,
    QuotationCreateView, SubmittedQuotationView, QuotationReviewView,
    QuotationItemListView, QuotationItemDetailView,
    QuotationItemSelectionListView, QuotationItemSelectionDetailView,
    QuotationItemAddOnListView, QuotationItemAddOnDetailView,
    AdminCategoryListView, AdminCategoryDetailView,
    AdminInstrumentTypeListView, AdminInstrumentTypeDetailView,
    AdminInstrumentListView, AdminInstrumentDetailView,
    AdminConfigurableFieldListView, AdminConfigurableFieldDetailView,
    AdminFieldOptionListView, AdminFieldOptionDetailView,
    AdminAddOnTypeListView, AdminAddOnTypeDetailView,
    AdminAddOnListView, AdminAddOnDetailView,
    AdminQuotationListView, AdminQuotationDetailView,
    AdminQuotationItemListView, AdminQuotationItemDetailView,
    AdminQuotationItemSelectionListView, AdminQuotationItemSelectionDetailView,
    AdminQuotationItemAddOnListView, AdminQuotationItemAddOnDetailView,
    UserListView, UserMeView
)

urlpatterns = [
    # User endpoints
    #path('users/list/', UserListView.as_view(), name='user-list'),
    path('users/me/', UserMeView.as_view(), name='user-me'),

    # Category endpoints
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),

    # InstrumentType endpoints
    path('instrument-types/', InstrumentTypeListView.as_view(), name='instrument-type-list'),
    path('instrument-types/<int:pk>/', InstrumentTypeDetailView.as_view(), name='instrument-type-detail'),

    # Instrument endpoints
    path('instruments/', InstrumentListView.as_view(), name='instrument-list'),
    path('instruments/<int:pk>/', InstrumentDetailView.as_view(), name='instrument-detail'),
    path('instruments/<int:pk>/image/', InstrumentImageUploadView.as_view(), name='instrument-image-upload'),
    path('instruments/<int:pk>/config/', InstrumentConfigView.as_view(), name='instrument-config'),

    # ConfigurableField endpoints
    path('configurable-fields/', ConfigurableFieldListView.as_view(), name='configurable-field-list'),
    path('configurable-fields/<int:pk>/', ConfigurableFieldDetailView.as_view(), name='configurable-field-detail'),

    # FieldOption endpoints
    path('field-options/', FieldOptionListView.as_view(), name='field-option-list'),
    path('field-options/<int:pk>/', FieldOptionDetailView.as_view(), name='field-option-detail'),

    # AddOnType endpoints
    path('addon-types/', AddOnTypeListView.as_view(), name='addon-type-list'),
    path('addon-types/<int:pk>/', AddOnTypeDetailView.as_view(), name='addon-type-detail'),

    # AddOn endpoints
    path('addons/', AddOnListView.as_view(), name='addon-list'),
    path('addons/<int:pk>/', AddOnDetailView.as_view(), name='addon-detail'),
    path('instruments/<int:pk>/addons/', InstrumentOptionListView.as_view(), name='instrument-addons'),

    # Quotation endpoints
    path('quotations/', QuotationCreateView.as_view(), name='quotation-create'),
    path('quotations/submitted/', SubmittedQuotationView.as_view(), name='quotation-submitted'),
    path('quotations/review/<int:pk>/', QuotationReviewView.as_view(), name='quotation-review'),
    path('quotations/review/', QuotationReviewView.as_view(), name='quotation-review-list'),

    # QuotationItem endpoints
    path('quotation-items/', QuotationItemListView.as_view(), name='quotation-item-list'),
    path('quotation-items/<int:pk>/', QuotationItemDetailView.as_view(), name='quotation-item-detail'),

    # QuotationItemSelection endpoints
    path('quotation-item-selections/', QuotationItemSelectionListView.as_view(), name='quotation-item-selection-list'),
    path('quotation-item-selections/<int:pk>/', QuotationItemSelectionDetailView.as_view(), name='quotation-item-selection-detail'),

    # QuotationItemAddOn endpoints
    path('quotation-item-addons/', QuotationItemAddOnListView.as_view(), name='quotation-item-addon-list'),
    path('quotation-item-addons/<int:pk>/', QuotationItemAddOnDetailView.as_view(), name='quotation-item-addon-detail'),

    # Admin endpoints
    path('admin/categories/', AdminCategoryListView.as_view(), name='admin-category-list'),
    path('admin/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),
    path('admin/instrument-types/', AdminInstrumentTypeListView.as_view(), name='admin-instrument-type-list'),
    path('admin/instrument-types/<int:pk>/', AdminInstrumentTypeDetailView.as_view(), name='admin-instrument-type-detail'),
    path('admin/instruments/', AdminInstrumentListView.as_view(), name='admin-instrument-list'),
    path('admin/instruments/<int:pk>/', AdminInstrumentDetailView.as_view(), name='admin-instrument-detail'),
    path('admin/configurable-fields/', AdminConfigurableFieldListView.as_view(), name='admin-configurable-field-list'),
    path('admin/configurable-fields/<int:pk>/', AdminConfigurableFieldDetailView.as_view(), name='admin-configurable-field-detail'),
    path('admin/field-options/', AdminFieldOptionListView.as_view(), name='admin-field-option-list'),
    path('admin/field-options/<int:pk>/', AdminFieldOptionDetailView.as_view(), name='admin-field-option-detail'),
    path('admin/addon-types/', AdminAddOnTypeListView.as_view(), name='admin-addon-type-list'),
    path('admin/addon-types/<int:pk>/', AdminAddOnTypeDetailView.as_view(), name='admin-addon-type-detail'),
    path('admin/addons/', AdminAddOnListView.as_view(), name='admin-addon-list'),
    path('admin/addons/<int:pk>/', AdminAddOnDetailView.as_view(), name='admin-addon-detail'),
    path('admin/quotations/', AdminQuotationListView.as_view(), name='admin-quotation-list'),
    path('admin/quotations/<int:pk>/', AdminQuotationDetailView.as_view(), name='admin-quotation-detail'),
    path('admin/quotation-items/', AdminQuotationItemListView.as_view(), name='admin-quotation-item-list'),
    path('admin/quotation-items/<int:pk>/', AdminQuotationItemDetailView.as_view(), name='admin-quotation-item-detail'),
    path('admin/quotation-item-selections/', AdminQuotationItemSelectionListView.as_view(), name='admin-quotation-item-selection-list'),
    path('admin/quotation-item-selections/<int:pk>/', AdminQuotationItemSelectionDetailView.as_view(), name='admin-quotation-item-selection-detail'),
    path('admin/quotation-item-addons/', AdminQuotationItemAddOnListView.as_view(), name='admin-quotation-item-addon-list'),
    path('admin/quotation-item-addons/<int:pk>/', AdminQuotationItemAddOnDetailView.as_view(), name='admin-quotation-item-addon-detail'),
]