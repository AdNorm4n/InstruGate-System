from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from .models import Instrument, AddOn
from .serializers import (
    InstrumentSerializer, InstrumentConfigSerializer,
    AddOnSerializer, QuotationSerializer
)

class InstrumentListView(generics.ListAPIView):
    serializer_class = InstrumentSerializer
    queryset = Instrument.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        type_id = self.request.query_params.get("type")
        if category:
            queryset = queryset.filter(type__category__name__iexact=category)
        if type_id:
            queryset = queryset.filter(type__id=type_id)
        return queryset

class InstrumentConfigView(generics.RetrieveAPIView):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentConfigSerializer
    lookup_field = "pk"

class InstrumentOptionListView(generics.ListAPIView):
    serializer_class = AddOnSerializer

    def get_queryset(self):
        instrument_id = self.kwargs["pk"]
        return AddOn.objects.filter(addon_type__instruments__id=instrument_id)

# ✅ FIXED VIEW
class QuotationCreateView(generics.CreateAPIView):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)