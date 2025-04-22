from django.urls import path
from .views import (
    InstrumentListView,
    InstrumentConfigView,
    InstrumentOptionListView,
)

urlpatterns = [
    path("instruments/", InstrumentListView.as_view(), name="instrument-list"),
    path("instruments/<int:pk>/config/", InstrumentConfigView.as_view(), name="instrument-config"),
    path("instruments/<int:pk>/options/", InstrumentOptionListView.as_view(), name="instrument-options"),
]