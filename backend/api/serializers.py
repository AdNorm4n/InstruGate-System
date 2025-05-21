from rest_framework import serializers
from .models import (
    Category, InstrumentType, Instrument,
    ConfigurableField, FieldOption,
    AddOn, AddOnType, Quotation, QuotationItem,
    QuotationItemSelection, QuotationItemAddOn
)
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class InstrumentTypeSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = InstrumentType
        fields = ['id', 'name', 'category', 'category_id']

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
            'image': {'required': False, 'allow_null': True},
            'description': {'required': False, 'allow_blank': True},
            'specifications': {'required': False, 'allow_blank': True},
            'is_available': {'required': False},
        }

class FieldOptionSerializer(serializers.ModelSerializer):
    field = serializers.PrimaryKeyRelatedField(queryset=ConfigurableField.objects.all())

    class Meta:
        model = FieldOption
        fields = ['id', 'field', 'label', 'code']

class ConfigurableFieldSerializer(serializers.ModelSerializer):
    options = FieldOptionSerializer(many=True, read_only=True)
    instrument = serializers.PrimaryKeyRelatedField(queryset=Instrument.objects.all())
    parent_field = serializers.PrimaryKeyRelatedField(queryset=ConfigurableField.objects.all(), allow_null=True)

    class Meta:
        model = ConfigurableField
        fields = ['id', 'instrument', 'name', 'order', 'parent_field', 'trigger_value', 'options']
        extra_kwargs = {
            'order': {'required': False},
            'trigger_value': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

class InstrumentConfigSerializer(serializers.ModelSerializer):
    fields = ConfigurableFieldSerializer(many=True, read_only=True)

    class Meta:
        model = Instrument
        fields = ['id', 'name', 'description', 'fields']

class AddOnTypeSerializer(serializers.ModelSerializer):
    instruments = serializers.PrimaryKeyRelatedField(queryset=Instrument.objects.all(), many=True, required=False)

    class Meta:
        model = AddOnType
        fields = ['id', 'name', 'instruments']

class AddOnSerializer(serializers.ModelSerializer):
    addon_type = AddOnTypeSerializer(read_only=True)
    addon_type_id = serializers.PrimaryKeyRelatedField(
        queryset=AddOnType.objects.all(), source='addon_type', write_only=True
    )

    class Meta:
        model = AddOn
        fields = ['id', 'addon_type', 'addon_type_id', 'label', 'code']

class QuotationItemSelectionSerializer(serializers.ModelSerializer):
    field_option = FieldOptionSerializer(read_only=True)
    field_option_id = serializers.PrimaryKeyRelatedField(
        queryset=FieldOption.objects.all(), source='field_option', write_only=True
    )
    quotation_item = serializers.PrimaryKeyRelatedField(queryset=QuotationItem.objects.all())

    class Meta:
        model = QuotationItemSelection
        fields = ['id', 'quotation_item', 'field_option', 'field_option_id']

class QuotationItemAddOnSerializer(serializers.ModelSerializer):
    addon = AddOnSerializer(read_only=True)
    addon_id = serializers.PrimaryKeyRelatedField(
        queryset=AddOn.objects.all(), source='addon', write_only=True
    )
    quotation_item = serializers.PrimaryKeyRelatedField(queryset=QuotationItem.objects.all())

    class Meta:
        model = QuotationItemAddOn
        fields = ['id', 'quotation_item', 'addon', 'addon_id']

class QuotationItemSerializer(serializers.ModelSerializer):
    instrument = InstrumentSerializer(read_only=True)
    instrument_id = serializers.PrimaryKeyRelatedField(
        queryset=Instrument.objects.all(), source='instrument', write_only=True
    )
    selections = QuotationItemSelectionSerializer(many=True, required=False)
    addons = QuotationItemAddOnSerializer(many=True, required=False)

    class Meta:
        model = QuotationItem
        fields = ['id', 'product_code', 'quantity', 'instrument', 'instrument_id', 'selections', 'addons']

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

class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)
    created_by = serializers.CharField(source='created_by.username', read_only=True)
    created_by_first_name = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            'id', 'company', 'project_name', 'status', 'remarks', 'submitted_at',
            'rejected_at', 'approved_at', 'items', 'created_by', 'created_by_first_name'
        ]
        read_only_fields = ['status', 'remarks', 'rejected_at', 'approved_at', 'created_by', 'submitted_at']
        extra_kwargs = {
            'project_name': {'required': True, 'allow_blank': False},
            'company': {'required': True, 'allow_blank': False}
        }

    def get_created_by_first_name(self, obj):
        return obj.created_by.first_name if obj.created_by.first_name else "N/A"

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quotation = Quotation.objects.create(
            company=validated_data.pop('company'),
            project_name=validated_data.pop('project_name'),
            created_by=self.context['request'].user
        )
        for item_data in items_data:
            QuotationItemSerializer().create({
                **item_data,
                'quotation': quotation
            })
        return quotation

class QuotationReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = ['id', 'status', 'remarks', 'rejected_at', 'submitted_at']
        read_only_fields = ['id', 'submitted_at']

    def validate(self, data):
        if data.get('status') == 'rejected' and not data.get('remarks'):
            raise serializers.ValidationError({"remarks": "Remarks are required when rejecting a quotation."})
        return data