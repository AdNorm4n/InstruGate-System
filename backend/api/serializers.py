from rest_framework import serializers
from .models import (
    Category, InstrumentType, Instrument,
    ConfigurableField, FieldOption,
    AddOn, AddOnType, Quotation, QuotationItem,
    QuotationItemSelection, QuotationItemAddOn
)
from django.contrib.auth import get_user_model

User = get_user_model()

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role']

# Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False}
        }

# Instrument Type Serializer
class InstrumentTypeSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = InstrumentType
        fields = ['id', 'name', 'category', 'category_id']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'category_id': {'required': True}
        }

# Instrument Serializer
class InstrumentSerializer(serializers.ModelSerializer):
    type = InstrumentTypeSerializer(read_only=True)
    type_id = serializers.PrimaryKeyRelatedField(
        queryset=InstrumentType.objects.all(), source='type', write_only=True
    )

    class Meta:
        model = Instrument
        fields = ['id', 'name', 'type', 'type_id', 'description', 'specifications', 'image', 'is_available', 'created_at']
        read_only_fields = ['created_at']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'type_id': {'required': True},
            'image': {'required': False, 'allow_null': True},
            'description': {'required': False, 'allow_blank': True},
            'specifications': {'required': False, 'allow_blank': True},
            'is_available': {'required': False}
        }

# Field Option Serializer
class FieldOptionSerializer(serializers.ModelSerializer):
    field = serializers.PrimaryKeyRelatedField(queryset=ConfigurableField.objects.all())

    class Meta:
        model = FieldOption
        fields = ['id', 'field', 'label', 'code']
        extra_kwargs = {
            'field': {'required': True},
            'label': {'required': True, 'allow_blank': False},
            'code': {'required': True, 'allow_blank': False}
        }

# Configurable Field Serializer
class ConfigurableFieldSerializer(serializers.ModelSerializer):
    options = FieldOptionSerializer(many=True, read_only=True)
    instrument = serializers.PrimaryKeyRelatedField(queryset=Instrument.objects.all())
    parent_field = serializers.PrimaryKeyRelatedField(queryset=ConfigurableField.objects.all(), allow_null=True)

    class Meta:
        model = ConfigurableField
        fields = ['id', 'instrument', 'name', 'order', 'parent_field', 'trigger_value', 'options']
        extra_kwargs = {
            'instrument': {'required': True},
            'name': {'required': True, 'allow_blank': False},
            'order': {'required': False},
            'trigger_value': {'required': False, 'allow_blank': True, 'allow_null': True}
        }

# AddOn Type Serializer
class AddOnTypeSerializer(serializers.ModelSerializer):
    instruments = serializers.PrimaryKeyRelatedField(queryset=Instrument.objects.all(), many=True, required=False)

    class Meta:
        model = AddOnType
        fields = ['id', 'name', 'instruments']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False}
        }

# AddOn Serializer
class AddOnSerializer(serializers.ModelSerializer):
    addon_type = AddOnTypeSerializer(read_only=True)
    addon_type_id = serializers.PrimaryKeyRelatedField(
        queryset=AddOnType.objects.all(), source='addon_type', write_only=True
    )

    class Meta:
        model = AddOn
        fields = ['id', 'addon_type', 'addon_type_id', 'label', 'code']
        extra_kwargs = {
            'addon_type_id': {'required': True},
            'label': {'required': True, 'allow_blank': False},
            'code': {'required': True, 'allow_blank': False}
        }

# Quotation Item Selection Serializer
class QuotationItemSelectionSerializer(serializers.ModelSerializer):
    field_option = FieldOptionSerializer(read_only=True)
    field_option_id = serializers.PrimaryKeyRelatedField(
        queryset=FieldOption.objects.all(), source='field_option', write_only=True
    )
    quotation_item = serializers.PrimaryKeyRelatedField(queryset=QuotationItem.objects.all())

    class Meta:
        model = QuotationItemSelection
        fields = ['id', 'quotation_item', 'field_option', 'field_option_id']
        extra_kwargs = {
            'quotation_item': {'required': True},
            'field_option_id': {'required': True}
        }

# Quotation Item AddOn Serializer
class QuotationItemAddOnSerializer(serializers.ModelSerializer):
    addon = AddOnSerializer(read_only=True)
    addon_id = serializers.PrimaryKeyRelatedField(
        queryset=AddOn.objects.all(), source='addon', write_only=True
    )
    quotation_item = serializers.PrimaryKeyRelatedField(queryset=QuotationItem.objects.all())

    class Meta:
        model = QuotationItemAddOn
        fields = ['id', 'quotation_item', 'addon', 'addon_id']
        extra_kwargs = {
            'quotation_item': {'required': True},
            'addon_id': {'required': True}
        }

# Quotation Item Serializer
class QuotationItemSerializer(serializers.ModelSerializer):
    instrument = InstrumentSerializer(read_only=True)
    instrument_id = serializers.PrimaryKeyRelatedField(
        queryset=Instrument.objects.all(), source='instrument', write_only=True
    )
    selections = QuotationItemSelectionSerializer(many=True, required=False)
    addons = QuotationItemAddOnSerializer(many=True, required=False)

    class Meta:
        model = QuotationItem
        fields = ['id', 'quotation', 'product_code', 'quantity', 'instrument', 'instrument_id', 'selections', 'addons']
        extra_kwargs = {
            'quotation': {'required': True},
            'product_code': {'required': True, 'allow_blank': False},
            'quantity': {'required': True},
            'instrument_id': {'required': True}
        }

    def create(self, validated_data):
        selections_data = validated_data.pop('selections', [])
        addons_data = validated_data.pop('addons', [])
        quotation_item = QuotationItem.objects.create(**validated_data)
        for selection_data in selections_data:
            QuotationItemSelection.objects.create(
                quotation_item=quotation_item,
                field_option=selection_data['field_option']
            )
        for addon_data in addons_data:
            QuotationItemAddOn.objects.create(
                quotation_item=quotation_item,
                addon=addon_data['addon']
            )
        return quotation_item

# Quotation Serializer
class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)
    created_by = UserSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='created_by', write_only=True
    )
    created_by_first_name = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            'id', 'created_by', 'created_by_id', 'created_by_first_name', 'company', 'project_name', 'status',
            'remarks', 'submitted_at', 'approved_at', 'rejected_at', 'updated_at', 'items'
        ]
        read_only_fields = ['status', 'remarks', 'submitted_at', 'approved_at', 'rejected_at', 'updated_at']
        extra_kwargs = {
            'created_by_id': {'required': True},
            'company': {'required': True, 'allow_blank': False},
            'project_name': {'required': True, 'allow_blank': False}
        }

    def get_created_by_first_name(self, obj):
        return obj.created_by.first_name if obj.created_by.first_name else "N/A"

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quotation = Quotation.objects.create(**validated_data)
        for item_data in items_data:
            item_data['quotation'] = quotation
            QuotationItemSerializer().create(item_data)
        return quotation

# Quotation Review Serializer
class QuotationReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = ['id', 'status', 'remarks', 'submitted_at', 'approved_at', 'rejected_at']
        read_only_fields = ['id', 'submitted_at']

    def validate(self, data):
        if data.get('status') == 'rejected' and not data.get('remarks'):
            raise serializers.ValidationError({"remarks": "Remarks are required when rejecting a quotation."})
        return data

# Instrument Config Serializer (Added)
class InstrumentConfigSerializer(serializers.ModelSerializer):
    configurable_fields = ConfigurableFieldSerializer(
        source='configurablefield_set', many=True, read_only=True
    )
    addons = AddOnSerializer(
        source='addontype_set.addon_set', many=True, read_only=True
    )

    class Meta:
        model = Instrument
        fields = ['id', 'name', 'configurable_fields', 'addons']

# Admin-specific serializers
class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False}
        }

class AdminInstrumentTypeSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category'
    )

    class Meta:
        model = InstrumentType
        fields = ['id', 'name', 'category_id']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'category_id': {'required': True}
        }

class AdminInstrumentSerializer(serializers.ModelSerializer):
    type_id = serializers.PrimaryKeyRelatedField(
        queryset=InstrumentType.objects.all(), source='type'
    )

    class Meta:
        model = Instrument
        fields = ['id', 'name', 'type_id', 'description', 'specifications', 'image', 'is_available']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'type_id': {'required': True},
            'description': {'required': False, 'allow_blank': True},
            'specifications': {'required': False, 'allow_blank': True},
            'image': {'required': False, 'allow_null': True},
            'is_available': {'required': False}
        }

class AdminConfigurableFieldSerializer(serializers.ModelSerializer):
    instrument_id = serializers.PrimaryKeyRelatedField(
        queryset=Instrument.objects.all(), source='instrument'
    )
    parent_field_id = serializers.PrimaryKeyRelatedField(
        queryset=ConfigurableField.objects.all(), source='parent_field', allow_null=True
    )

    class Meta:
        model = ConfigurableField
        fields = ['id', 'instrument_id', 'name', 'order', 'parent_field_id', 'trigger_value']
        extra_kwargs = {
            'instrument_id': {'required': True},
            'name': {'required': True, 'allow_blank': False},
            'order': {'required': False},
            'trigger_value': {'required': False, 'allow_blank': True, 'allow_null': True}
        }

class AdminFieldOptionSerializer(serializers.ModelSerializer):
    field_id = serializers.PrimaryKeyRelatedField(
        queryset=ConfigurableField.objects.all(), source='field'
    )

    class Meta:
        model = FieldOption
        fields = ['id', 'field_id', 'label', 'code']
        extra_kwargs = {
            'field_id': {'required': True},
            'label': {'required': True, 'allow_blank': False},
            'code': {'required': True, 'allow_blank': False}
        }

class AdminAddOnTypeSerializer(serializers.ModelSerializer):
    instrument_ids = serializers.PrimaryKeyRelatedField(
        queryset=Instrument.objects.all(), source='instruments', many=True, required=False
    )

    class Meta:
        model = AddOnType
        fields = ['id', 'name', 'instrument_ids']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False}
        }

class AdminAddOnSerializer(serializers.ModelSerializer):
    addon_type_id = serializers.PrimaryKeyRelatedField(
        queryset=AddOnType.objects.all(), source='addon_type'
    )

    class Meta:
        model = AddOn
        fields = ['id', 'addon_type_id', 'label', 'code']
        extra_kwargs = {
            'addon_type_id': {'required': True},
            'label': {'required': True, 'allow_blank': False},
            'code': {'required': True, 'allow_blank': False}
        }

class AdminQuotationSerializer(serializers.ModelSerializer):
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='created_by'
    )

    class Meta:
        model = Quotation
        fields = [
            'id', 'created_by_id', 'company', 'project_name', 'status',
            'remarks', 'submitted_at', 'approved_at', 'rejected_at', 'updated_at'
        ]
        read_only_fields = ['submitted_at', 'approved_at', 'rejected_at', 'updated_at']
        extra_kwargs = {
            'created_by_id': {'required': True},
            'company': {'required': True, 'allow_blank': False},
            'project_name': {'required': True, 'allow_blank': False},
            'status': {'required': False},
            'remarks': {'required': False, 'allow_blank': True}
        }

class AdminQuotationItemSerializer(serializers.ModelSerializer):
    quotation_id = serializers.PrimaryKeyRelatedField(
        queryset=Quotation.objects.all(), source='quotation'
    )
    instrument_id = serializers.PrimaryKeyRelatedField(
        queryset=Instrument.objects.all(), source='instrument'
    )

    class Meta:
        model = QuotationItem
        fields = ['id', 'quotation_id', 'product_code', 'quantity', 'instrument_id']
        extra_kwargs = {
            'quotation_id': {'required': True},
            'product_code': {'required': True, 'allow_blank': False},
            'quantity': {'required': True},
            'instrument_id': {'required': True}
        }

class AdminQuotationItemSelectionSerializer(serializers.ModelSerializer):
    quotation_item_id = serializers.PrimaryKeyRelatedField(
        queryset=QuotationItem.objects.all(), source='quotation_item'
    )
    field_option_id = serializers.PrimaryKeyRelatedField(
        queryset=FieldOption.objects.all(), source='field_option'
    )

    class Meta:
        model = QuotationItemSelection
        fields = ['id', 'quotation_item_id', 'field_option_id']
        extra_kwargs = {
            'quotation_item_id': {'required': True},
            'field_option_id': {'required': True}
        }

class AdminQuotationItemAddOnSerializer(serializers.ModelSerializer):
    quotation_item_id = serializers.PrimaryKeyRelatedField(
        queryset=QuotationItem.objects.all(), source='quotation_item'
    )
    addon_id = serializers.PrimaryKeyRelatedField(
        queryset=AddOn.objects.all(), source='addon'
    )

    class Meta:
        model = QuotationItemAddOn
        fields = ['id', 'quotation_item_id', 'addon_id']
        extra_kwargs = {
            'quotation_item_id': {'required': True},
            'addon_id': {'required': True}
        }