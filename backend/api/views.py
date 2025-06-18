from django.http import HttpResponse
from rest_framework import generics, permissions, status
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import EmailMessage
from django.utils import timezone
import logging
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
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Frame, PageTemplate, KeepTogether, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
import os
from io import BytesIO
import traceback

logger = logging.getLogger(__name__)

User = get_user_model()

# Custom Permissions
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsClient:
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
class AddOnTypeListView(generics.ListCreateAPIView):
    queryset = AddOnType.objects.all()
    serializer_class = AddOnTypeSerializer
    permission_classes = [IsProposalEngineerOrAdmin]

class AddOnTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
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

def page_canvas(canvas, doc):
    canvas.saveState()
    letterhead_path = os.path.join(settings.STATIC_ROOT, 'images', 'letterhead.jpg')
    logger.info(f"Rendering letterhead for page {doc.page} at {letterhead_path}")
    if os.path.exists(letterhead_path):
        try:
            canvas.drawImage(letterhead_path, 0, 0, width=A4[0], height=A4[1], preserveAspectRatio=True)
        except Exception as e:
            logger.error(f"Failed to render letterhead on page {doc.page}: {str(e)}\n{traceback.format_exc()}")
    else:
        logger.warning(f"Letterhead not found at {letterhead_path}")
    canvas.restoreState()

class CustomDocTemplate(SimpleDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(15*mm, 15*mm, A4[0]-30*mm, A4[1]-30*mm)
        template = PageTemplate(id='AllPages', frames=[frame], onPage=page_canvas)
        self.addPageTemplates(template)  # Single template for all pages

def generate_quotation_pdf(quotation):
    buffer = BytesIO()
    doc = CustomDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(name='Title', fontSize=16, leading=20, fontName='Helvetica-Bold', spaceAfter=10, leftIndent=0, alignment=0)
    heading_style = ParagraphStyle(name='Heading', fontSize=12, leading=16, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=8, leftIndent=0, alignment=0)
    normal_style = ParagraphStyle(name='Normal', fontSize=10, leading=12, fontName='Helvetica')
    bold_style = ParagraphStyle(name='Bold', fontSize=10, leading=12, fontName='Helvetica-Bold', leftIndent=0)
    list_style = ParagraphStyle(name='List', fontSize=10, leading=14, fontName='Helvetica')

    # Title
    elements.append(Spacer(1, 20*mm))  # Top padding
    elements.append(Paragraph(f"Purchase Order Quotation #{quotation.id}", title_style))
    elements.append(Spacer(1, 5*mm))

    # Details: Two-column layout
    try:
        total_price = quotation.calculate_total_price()
        total_price_str = f"RM {total_price:,.2f}" if total_price is not None else "N/A"
    except Exception as e:
        logger.error(f"Failed to calculate total_price for quotation {quotation.id}: {str(e)}")
        total_price_str = "N/A"
    logger.debug(f"Quotation {quotation.id} total_price: {total_price_str}")

    details_left = [
        f"<b>Submitted by:</b> {quotation.created_by.first_name if quotation.created_by else 'N/A'}",
        f"<b>Company:</b> {quotation.company or 'N/A'}",
        f"<b>Project:</b> {quotation.project_name or 'N/A'}",
        f"<b>Total Quotation Price:</b> {total_price_str}",
    ]
    details_right = [
        f"<b>Submitted at:</b> {quotation.submitted_at.strftime('%b %d, %Y, %I:%M %p') if quotation.submitted_at else 'N/A'}",
        f"<b>Reviewed by:</b> {quotation.reviewed_by.first_name if quotation.reviewed_by else 'N/A'}",
        f"<b>Status:</b> {quotation.status.capitalize() if quotation.status else 'N/A'}",
        f"<b>Approved at:</b> {quotation.approved_at.strftime('%b %d, %Y, %I:%M %p') if quotation.approved_at else 'N/A'}",
    ]

    details_data = [[Paragraph(left, normal_style), Paragraph(right, normal_style)] for left, right in zip(details_left, details_right)]
    details_table = Table(details_data, colWidths=[85*mm, 85*mm])
    details_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 5*mm))

    # Divider
    divider_data = [['']]
    divider_table = Table(divider_data, colWidths=[A4[0]-40*mm])
    divider_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 0.3, colors.HexColor('#646464')),
    ]))
    elements.append(divider_table)
    elements.append(Spacer(1, 10*mm))

    # Instruments section
    items = quotation.items.all()
    if not items:
        elements.append(Paragraph("No instruments listed.", normal_style))
    else:
        page_height_limit = 744.85
        current_page_height = 20*mm + 30 + 5*mm + len(details_left)*14 + 5*mm + 10 + 10*mm + 28
        items_per_page = []
        page_groups = []

        for idx, item in enumerate(items, 1):
            item_group = []
            estimated_height = 14  # Item #<n> table (~14pt)

            try:
                item_total_price = item.calculate_total_price()
                item_total_price_str = f"RM {item_total_price:,.2f}" if item_total_price is not None else "N/A"
            except (AttributeError, Exception) as e:
                logger.error(f"Failed to calculate total_price for QuotationItem {item.id}: {str(e)}")
                item_total_price_str = "N/A"
            logger.debug(f"QuotationItem {item.id} total_price: {item_total_price_str}")

            selections_text = ""
            selections = item.selections.all()
            if selections:
                for s in selections:
                    if s.field_option:
                        selections_text += f"• {s.field_option.label} ({s.field_option.code})<br/>"
            else:
                selections_text = "None"

            addons_text = ""
            addons = item.addons.all()
            if addons:
                for a in addons:
                    if a.addon:
                        addons_text += f"• {a.addon.label} ({a.addon.code})<br/>"
            else:
                addons_text = "None"

            item_data = [
                [Paragraph("Instrument Name:", bold_style), Paragraph((item.instrument.name if item.instrument else item.name) or 'N/A', normal_style)],
                [Paragraph("Product Code:", bold_style), Paragraph(item.product_code or 'N/A', normal_style)],
                [Paragraph("Quantity:", bold_style), Paragraph(str(item.quantity or 1), normal_style)],
                [Paragraph("Total Price:", bold_style), Paragraph(item_total_price_str, normal_style)],
                [Paragraph("Selections:", bold_style), Paragraph(selections_text, list_style)],
                [Paragraph("Add-Ons:", bold_style), Paragraph(addons_text, list_style)],
            ]
            item_table = Table(item_data, colWidths=[50*mm, 120*mm])
            item_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ]))
            # Item #<n> in a Table for alignment
            item_number_table = Table([[Paragraph(f"Item #{idx}", bold_style)]], colWidths=[170*mm])
            item_number_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ]))
            item_group.append(item_number_table)
            item_group.append(Spacer(1, 2))  # Match Details spacing
            item_group.append(item_table)
            estimated_height += 84  # 6 rows * ~14pt
            estimated_height += (len(selections) + len(addons)) * 14  # ~14pt per line
            item_group.append(Spacer(1, 24))
            estimated_height += 24

            items_per_page.append((item_group, estimated_height))
            current_page_height += estimated_height

            if len(items_per_page) >= 3 or current_page_height > page_height_limit or idx == len(items):
                page_groups.append(items_per_page)
                items_per_page = []
                current_page_height = 28 + 10*mm
            elif idx < len(items):
                current_page_height += 24

        for page_idx, page_items in enumerate(page_groups):
            if page_idx > 0:
                elements.append(PageBreak())
                elements.append(Paragraph("Instruments (Continued)", heading_style))
                elements.append(Spacer(1, 10*mm))

            for item_group, _ in page_items:
                elements.append(KeepTogether(item_group))

    try:
        doc.build(elements)
        pdf_data = buffer.getvalue()
    except Exception as e:
        logger.error(f"PDF generation failed for quotation {quotation.id}: {str(e)}\n{traceback.format_exc()}")
        raise
    finally:
        buffer.close()

    return pdf_data

class QuotationSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        try:
            quotation = Quotation.objects.get(pk=pk, created_by=request.user, status='approved')
        except Quotation.DoesNotExist:
            logger.error(f"Quotation {pk} not found or not approved for user {request.user.id}")
            return Response(
                {'detail': 'Quotation not found or not approved'},
                status=status.HTTP_404_NOT_FOUND
            )

        client_email = request.user.email
        if not client_email:
            logger.warning(f"Client email not set for user {request.user.id}")
            return Response(
                {'detail': 'Client email is not set'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            pdf_data = generate_quotation_pdf(quotation)
        except Exception as e:
            logger.error(f"PDF generation failed for quotation {pk}: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {'detail': f'Failed to generate PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            logger.error(f"Email sending failed for quotation {pk}: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {'detail': f'Failed to send email to sales team: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        quotation.status = 'submitted'
        quotation.emailed_at = timezone.now()
        quotation.save()

        return Response(
            {'detail': 'Quotation submitted successfully via email'},
            status=status.HTTP_200_OK
        )

class QuotationDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            if request.user.role == 'client':
                quotation = get_object_or_404(Quotation, pk=pk, created_by=request.user)
            else:
                quotation = get_object_or_404(Quotation, pk=pk)

            logger.info(f"Generating PDF for quotation {pk} by user {request.user.id}")
            pdf_data = generate_quotation_pdf(quotation)

            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=Quotation_{pk}.pdf'
            response.write(pdf_data)
            logger.info(f"PDF generated successfully for quotation {pk}")
            return response
        except Exception as e:
            logger.error(f"Error in QuotationDownloadView for quotation {pk}: {str(e)}\n{traceback.format_exc()}")
            return Response(
                {'detail': f'Failed to generate PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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