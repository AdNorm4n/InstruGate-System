from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Instrument, AddOn, Quotation
from .serializers import (
    InstrumentSerializer, InstrumentConfigSerializer,
    AddOnSerializer, QuotationSerializer, QuotationReviewSerializer
)

class IsProposalEngineerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['proposal_engineer', 'admin']

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

class QuotationCreateView(generics.CreateAPIView):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SubmittedQuotationView(generics.ListAPIView):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Quotation.objects.filter(created_by=self.request.user).order_by('-submitted_at')

class QuotationReviewView(generics.GenericAPIView):
    serializer_class = QuotationReviewSerializer
    permission_classes = [IsProposalEngineerOrAdmin]
    queryset = Quotation.objects.all().order_by('-submitted_at')

    def get(self, request, *args, **kwargs):
        serializer = QuotationSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        quotation_id = kwargs.get('pk')
        try:
            quotation = Quotation.objects.get(id=quotation_id)
        except Quotation.DoesNotExist:
            return Response({'detail': 'Quotation not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(quotation, data=request.data, partial=True)
        if serializer.is_valid():
            if request.data.get('status') == 'rejected':
                serializer.validated_data['rejected_at'] = timezone.now()
            elif request.data.get('status') == 'approved':
                serializer.validated_data['approved_at'] = timezone.now()
            serializer.save()
            return Response(QuotationSerializer(quotation).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)