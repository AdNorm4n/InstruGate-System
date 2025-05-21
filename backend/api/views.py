from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import (
    Category, InstrumentType, Instrument, ConfigurableField,
    FieldOption, AddOnType, AddOn, Quotation, QuotationItem,
    QuotationItemSelection, QuotationItemAddOn
)
from .serializers import (
    CategorySerializer, InstrumentTypeSerializer, InstrumentSerializer,
    ConfigurableFieldSerializer, FieldOptionSerializer,
    AddOnTypeSerializer, AddOnSerializer,
    InstrumentConfigSerializer, QuotationSerializer,
    QuotationReviewSerializer, QuotationItemSerializer,
    QuotationItemSelectionSerializer, QuotationItemAddOnSerializer
)

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'

class IsProposalEngineerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['proposal_engineer', 'admin']

# Category Views
class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsProposalEngineerOrAdmin]

# InstrumentType Views
class InstrumentTypeListView(generics.ListCreateAPIView):
    queryset = InstrumentType.objects.all()
    serializer_class = InstrumentTypeSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class InstrumentTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InstrumentType.objects.all()
    serializer_class = InstrumentTypeSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

# Instrument Views
class InstrumentListView(generics.ListCreateAPIView):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        type_id = self.request.query_params.get("type")
        if category:
            queryset = queryset.filter(type__category__name__iexact=category)
        if type_id:
            queryset = queryset.filter(type__id=type_id)
        return queryset

class InstrumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class InstrumentImageUploadView(APIView):
    permission_classes = [IsProposalEngineerOrAdmin]

    def post(self, request, pk):
        try:
            instrument = Instrument.objects.get(pk=pk)
        except Instrument.DoesNotExist:
            return Response({'detail': 'Instrument not found'}, status=status.HTTP_404_NOT_FOUND)
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        instrument.image = image
        instrument.save()
        serializer = InstrumentSerializer(instrument)
        return Response(serializer.data)

class InstrumentConfigView(generics.RetrieveAPIView):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentConfigSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

# ConfigurableField Views
class ConfigurableFieldListView(generics.ListCreateAPIView):
    queryset = ConfigurableField.objects.all()
    serializer_class = ConfigurableFieldSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class ConfigurableFieldDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ConfigurableField.objects.all()
    serializer_class = ConfigurableFieldSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

# FieldOption Views
class FieldOptionListView(generics.ListCreateAPIView):
    queryset = FieldOption.objects.all()
    serializer_class = FieldOptionSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class FieldOptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FieldOption.objects.all()
    serializer_class = FieldOptionSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

# AddOnType Views
class AddonTypeListView(generics.ListCreateAPIView):
    queryset = AddOnType.objects.all()
    serializer_class = AddOnTypeSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class AddonTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AddOnType.objects.all()
    serializer_class = AddOnTypeSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

# AddOn Views
class AddOnListView(generics.ListCreateAPIView):
    queryset = AddOn.objects.all()
    serializer_class = AddOnSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class AddOnDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AddOn.objects.all()
    serializer_class = AddOnSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class InstrumentOptionListView(generics.ListAPIView):
    serializer_class = AddOnSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        instrument_id = self.kwargs["pk"]
        return AddOn.objects.filter(addon_type__instruments__id=instrument_id)

# Quotation Views
class QuotationCreateView(generics.CreateAPIView):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SubmittedQuotationView(generics.ListAPIView):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Quotation.objects.filter(created_by=self.request.user).order_by('-submitted_at')
        status_filter = self.request.query_params.get('status')
        if status_filter in ['pending', 'approved', 'rejected']:
            queryset = queryset.filter(status=status_filter)
        return queryset

class QuotationReviewView(generics.GenericAPIView):
    serializer_class = QuotationReviewSerializer
    permission_classes = [IsProposalEngineerOrAdmin]
    queryset = Quotation.objects.all().order_by('-submitted_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter in ['pending', 'approved', 'rejected']:
            queryset = queryset.filter(status=status_filter)
        return queryset

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

# QuotationItem Views
class QuotationItemListView(generics.ListCreateAPIView):
    queryset = QuotationItem.objects.all()
    serializer_class = QuotationItemSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class QuotationItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuotationItem.objects.all()
    serializer_class = QuotationItemSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

# QuotationItemSelection Views
class QuotationItemSelectionListView(generics.ListCreateAPIView):
    queryset = QuotationItemSelection.objects.all()
    serializer_class = QuotationItemSelectionSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class QuotationItemSelectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuotationItemSelection.objects.all()
    serializer_class = QuotationItemSelectionSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

# QuotationItemAddOn Views
class QuotationItemAddOnListView(generics.ListCreateAPIView):
    queryset = QuotationItemAddOn.objects.all()
    serializer_class = QuotationItemAddOnSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class QuotationItemAddOnDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuotationItemAddOn.objects.all()
    serializer_class = QuotationItemAddOnSerializer
    permission_classes = [IsProposalEngineerOrAdmin]