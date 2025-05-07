from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Instrument, AddOn, SubmittedConfiguration, Quotation
from .serializers import (
    InstrumentSerializer, InstrumentConfigSerializer,
    AddOnSerializer, SubmittedConfigurationSerializer, QuotationSerializer
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
    serializer_class = AddOnSerializer

    def get_queryset(self):
        instrument_id = self.kwargs["pk"]
        return AddOn.objects.filter(addon_type__instruments__id=instrument_id)

# NEW API TO SUBMIT CONFIGURATION AND QUOTATION

class SubmitQuotationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data
        configs = data.get('configurations', [])
        status_val = data.get('status', 'draft')
        remarks = data.get('remarks', '')

        config_objs = []
        for config in configs:
            obj = SubmittedConfiguration.objects.create(
                instrument_id=config['instrument_id'],
                selected_fields=config['selected_fields'],
                selected_addons=config.get('selected_addons', []),
                product_code=config['product_code']
            )
            config_objs.append(obj)

        quotation = Quotation.objects.create(
            user=user,
            status=status_val,
            remarks=remarks
        )
        quotation.configurations.set(config_objs)

        serializer = QuotationSerializer(quotation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
