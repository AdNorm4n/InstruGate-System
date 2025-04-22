from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Category, InstrumentType, Instrument, FieldOption
from .serializers import (
    InstrumentSerializer,
    InstrumentConfigSerializer,
    FieldOptionSerializer,
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


class InstrumentConfigView(APIView):
    def get(self, request, pk):
        try:
            instrument = Instrument.objects.get(pk=pk)
            serializer = InstrumentConfigSerializer(instrument)
            return Response(serializer.data)
        except Instrument.DoesNotExist:
            return Response({"error": "Instrument not found"}, status=404)


class InstrumentOptionListView(generics.ListAPIView):
    serializer_class = FieldOptionSerializer

    def get_queryset(self):
        instrument_id = self.kwargs["pk"]
        return FieldOption.objects.filter(
            field__instrument__id=instrument_id,
            field__parent_field__isnull=True,
            field__name__icontains="option"
        )
