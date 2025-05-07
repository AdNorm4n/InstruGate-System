from django.urls import path
from .views import (
    InstrumentListView, InstrumentConfigView,
    InstrumentOptionListView, SubmitQuotationView,
)

urlpatterns = [
    path("instruments/", InstrumentListView.as_view(), name="instrument-list"),
    path("instruments/<int:pk>/config/", InstrumentConfigView.as_view(), name="instrument-config"),
    path("instruments/<int:pk>/addons/", InstrumentOptionListView.as_view(), name="instrument-addons"),
    path("submit-quotation/", SubmitQuotationView.as_view(), name="submit-quotation"),
]
