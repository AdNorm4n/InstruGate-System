from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import EmailMessage
from django.utils import timezone
from django.contrib.auth import get_user_model
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
    QuotationItemSelectionSerializer, QuotationItemAddOnSerializer,
    AdminCategorySerializer, AdminInstrumentTypeSerializer,
    AdminInstrumentSerializer, AdminConfigurableFieldSerializer,
    AdminFieldOptionSerializer, AdminAddOnTypeSerializer,
    AdminAddOnSerializer, AdminQuotationSerializer,
    AdminQuotationItemSerializer, AdminQuotationItemSelectionSerializer,
    AdminQuotationItemAddOnSerializer, UserSerializer
)
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
import os
from io import BytesIO

User = get_user_model()

# Custom Permissions
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'

class IsProposalEngineerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['proposal_engineer', 'admin']

# User Views
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

class UserMeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

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
class AddOnTypeListView(generics.ListCreateAPIView):  # Fixed naming
    queryset = AddOnType.objects.all()
    serializer_class = AddOnTypeSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class AddOnTypeDetailView(generics.RetrieveUpdateDestroyAPIView):  # Fixed naming
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
        if status_filter in ['pending', 'rejected', 'approved', 'submitted']:
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

        serializer = self.get_serializer(quotation, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            if request.data.get('status') == 'rejected':
                quotation.rejected_at = timezone.now()
                quotation.reviewed_by = request.user
            elif request.data.get('status') == 'approved':
                quotation.approved_at = timezone.now()
                quotation.reviewed_by = request.user
            serializer.save()
            return Response(QuotationSerializer(quotation).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class QuotationSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        try:
            quotation = Quotation.objects.get(pk=pk, created_by=request.user, status='approved')
        except Quotation.DoesNotExist:
            return Response(
                {'detail': 'Quotation not found or not approved'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate client email
        client_email = request.user.email
        if not client_email:
            return Response(
                {'detail': 'Client email is not set'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=15*mm, leftMargin=15*mm, topMargin=40*mm, bottomMargin=15*mm)
        elements = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(name='Title', fontSize=16, leading=20, fontName='Helvetica-Bold')
        heading_style = ParagraphStyle(name='Heading', fontSize=12, leading=16, fontName='Helvetica-Bold')
        normal_style = ParagraphStyle(name='Normal', fontSize=10, leading=12, fontName='Helvetica')
        bold_style = ParagraphStyle(name='Bold', fontSize=10, leading=12, fontName='Helvetica-Bold')

        # Add letterhead (if exists)
        letterhead_path = os.path.join(settings.STATIC_ROOT or settings.BASE_DIR, 'static', 'images', 'letterhead.jpg')
        if os.path.exists(letterhead_path):
            elements.append(Image(letterhead_path, width=A4[0], height=A4[1]))
            elements.append(Spacer(1, -A4[1]))  # Move cursor back to top

        # Title
        elements.append(Paragraph(f"Purchase Order Quotation #{quotation.id}", title_style))
        elements.append(Spacer(1, 8*mm))

        # Status
        elements.append(Paragraph(f"Status: Approved", normal_style))
        elements.append(Spacer(1, 4*mm))

        # Separator
        elements.append(Paragraph("<hr>", normal_style))
        elements.append(Spacer(1, 4*mm))

        # Details Section
        elements.append(Paragraph("Details", heading_style))
        elements.append(Spacer(1, 8*mm))

        details_data = [
            ["Submitted by:", quotation.created_by.first_name or "N/A"],
            ["Company:", quotation.company or "N/A"],
            ["Project:", quotation.project_name or "N/A"],
            ["Submitted at:", quotation.submitted_at.strftime("%b %d, %Y, %I:%M %p") if quotation.submitted_at else "N/A"],
            ["Approved at:", quotation.approved_at.strftime("%b %d, %Y, %I:%M %p") if quotation.approved_at else "N/A"],
            ["Reviewed by:", quotation.reviewed_by.first_name or "N/A" if quotation.reviewed_by else "N/A"],
            ["Emailed at:", quotation.emailed_at.strftime("%b %d, %Y, %I:%M %p") if quotation.emailed_at else "N/A"],
        ]
        details_table = Table(details_data, colWidths=[50*mm, 120*mm])
        details_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 8*mm))

        # Instruments Section
        elements.append(Paragraph("Instruments", heading_style))
        elements.append(Spacer(1, 8*mm))

        items = quotation.items.all()
        if not items:
            elements.append(Paragraph("No instruments listed.", normal_style))
        else:
            for idx, item in enumerate(items, 1):
                elements.append(Paragraph(f"Item #{idx}", bold_style))
                elements.append(Spacer(1, 2*mm))
                instrument_data = [
                    ["Instrument Name:", item.instrument.name or "N/A"],
                    ["Product Code:", item.product_code or "N/A"],
                    ["Quantity:", str(item.quantity or 1)],
                ]
                # Add selections if available
                selections = item.selections.all()
                if selections:
                    instrument_data.append(["Selections:", ""])
                    for selection in selections:
                        instrument_data.append(["", f"{selection.field_option.label} ({selection.field_option.code})"])
                # Add addons if available
                addons = item.addons.all()
                if addons:
                    instrument_data.append(["Add-Ons:", ""])
                    for addon in addons:
                        instrument_data.append(["", f"{addon.addon.label} ({addon.addon.code})"])
                instrument_table = Table(instrument_data, colWidths=[50*mm, 120*mm])
                instrument_table.setStyle(TableStyle([
                    ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ]))
                elements.append(instrument_table)
                elements.append(Spacer(1, 8*mm))

        doc.build(elements)
        pdf_data = buffer.getvalue()
        buffer.close()

        # Send Email to Sales Team with Client CC
        try:
            sales_email_msg = EmailMessage(
                subject=f"Approved Purchase Order Quotation #{quotation.id} Submission",
                body=f"Dear Sales Team,\n\nQuotation #{quotation.id} from {quotation.company or 'N/A'} has been approved and submitted by {request.user.first_name or 'Client'} ({client_email}).\nThe PDF is attached for your reference.\n\nBest regards,\nInstruGate System",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=['adriannorman@graduate.utm.my'],
                cc=[client_email],
            )
            sales_email_msg.attach(f"Quotation_{quotation.id}.pdf", pdf_data, 'application/pdf')
            sales_email_msg.send(fail_silently=False)
        except Exception as e:
            return Response(
                {'detail': f'Failed to send email to sales team: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Update quotation status to 'submitted' and set emailed_at
        quotation.status = 'submitted'
        quotation.emailed_at = timezone.now()
        quotation.save()

        return Response(
            {'detail': 'Quotation submitted successfully via email'},
            status=status.HTTP_200_OK
        )
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

# Admin-specific Views
class AdminCategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdmin]

class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdmin]

class AdminInstrumentTypeListView(generics.ListCreateAPIView):
    queryset = InstrumentType.objects.all()
    serializer_class = AdminInstrumentTypeSerializer
    permission_classes = [IsAdmin]

class AdminInstrumentTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InstrumentType.objects.all()
    serializer_class = AdminInstrumentTypeSerializer
    permission_classes = [IsAdmin]

class AdminInstrumentListView(generics.ListCreateAPIView):
    queryset = Instrument.objects.all()
    serializer_class = AdminInstrumentSerializer
    permission_classes = [IsAdmin]

class AdminInstrumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Instrument.objects.all()
    serializer_class = AdminInstrumentSerializer
    permission_classes = [IsAdmin]

class AdminConfigurableFieldListView(generics.ListCreateAPIView):
    queryset = ConfigurableField.objects.all()
    serializer_class = AdminConfigurableFieldSerializer
    permission_classes = [IsAdmin]

class AdminConfigurableFieldDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ConfigurableField.objects.all()
    serializer_class = AdminConfigurableFieldSerializer
    permission_classes = [IsAdmin]

class AdminFieldOptionListView(generics.ListCreateAPIView):
    queryset = FieldOption.objects.all()
    serializer_class = AdminFieldOptionSerializer
    permission_classes = [IsAdmin]

class AdminFieldOptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FieldOption.objects.all()
    serializer_class = AdminFieldOptionSerializer
    permission_classes = [IsAdmin]

class AdminAddOnTypeListView(generics.ListCreateAPIView):
    queryset = AddOnType.objects.all()
    serializer_class = AdminAddOnTypeSerializer
    permission_classes = [IsAdmin]

class AdminAddOnTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AddOnType.objects.all()
    serializer_class = AdminAddOnTypeSerializer
    permission_classes = [IsAdmin]

class AdminAddOnListView(generics.ListCreateAPIView):
    queryset = AddOn.objects.all()
    serializer_class = AdminAddOnSerializer
    permission_classes = [IsAdmin]

class AdminAddOnDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AddOn.objects.all()
    serializer_class = AdminAddOnSerializer
    permission_classes = [IsAdmin]

class AdminQuotationListView(generics.ListCreateAPIView):
    queryset = Quotation.objects.all()
    serializer_class = AdminQuotationSerializer
    permission_classes = [IsAdmin]

class AdminQuotationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quotation.objects.all()
    serializer_class = AdminQuotationSerializer
    permission_classes = [IsAdmin]

class AdminQuotationItemListView(generics.ListCreateAPIView):
    queryset = QuotationItem.objects.all()
    serializer_class = AdminQuotationItemSerializer
    permission_classes = [IsAdmin]

class AdminQuotationItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuotationItem.objects.all()
    serializer_class = AdminQuotationItemSerializer
    permission_classes = [IsAdmin]

class AdminQuotationItemSelectionListView(generics.ListCreateAPIView):
    queryset = QuotationItemSelection.objects.all()
    serializer_class = AdminQuotationItemSelectionSerializer
    permission_classes = [IsAdmin]

class AdminQuotationItemSelectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuotationItemSelection.objects.all()
    serializer_class = AdminQuotationItemSelectionSerializer
    permission_classes = [IsAdmin]

class AdminQuotationItemAddOnListView(generics.ListCreateAPIView):
    queryset = QuotationItemAddOn.objects.all()
    serializer_class = AdminQuotationItemAddOnSerializer
    permission_classes = [IsAdmin]

class AdminQuotationItemAddOnDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuotationItemAddOn.objects.all()
    serializer_class = AdminQuotationItemAddOnSerializer
    permission_classes = [IsAdmin]