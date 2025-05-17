from rest_framework import serializers
from .models import (
    Category, InstrumentType, Instrument,
    ConfigurableField, FieldOption,
    AddOn, AddOnType, Quotation, QuotationItem,
    QuotationItemSelection, QuotationItemAddOn
)
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class InstrumentTypeSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    class Meta:
        model = InstrumentType
        fields = '__all__'

class InstrumentSerializer(serializers.ModelSerializer):
    type = InstrumentTypeSerializer(read_only=True)
    class Meta:
        model = Instrument
        fields = '__all__'

class FieldOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldOption
        fields = ['id', 'label', 'code']

class ConfigurableFieldSerializer(serializers.ModelSerializer):
    options = FieldOptionSerializer(many=True, read_only=True)
    parent_field = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = ConfigurableField
        fields = ['id', 'name', 'order', 'options', 'parent_field', 'trigger_value']

class InstrumentConfigSerializer(serializers.ModelSerializer):
    fields = ConfigurableFieldSerializer(many=True)
    class Meta:
        model = Instrument
        fields = ['id', 'name', 'description', 'fields']

class AddOnTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOnType
        fields = ['id', 'name']

class AddOnSerializer(serializers.ModelSerializer):
    addon_type = AddOnTypeSerializer()
    class Meta:
        model = AddOn
        fields = ['id', 'label', 'code', 'addon_type']

class QuotationItemSelectionSerializer(serializers.ModelSerializer):
    field_option = FieldOptionSerializer(read_only=True)
    field_option_id = serializers.PrimaryKeyRelatedField(
        queryset=FieldOption.objects.all(), source='field_option', write_only=True
    )

    class Meta:
        model = QuotationItemSelection
        fields = ['field_option', 'field_option_id']

class QuotationItemAddOnSerializer(serializers.ModelSerializer):
    addon = AddOnSerializer(read_only=True)
    addon_id = serializers.PrimaryKeyRelatedField(
        queryset=AddOn.objects.all(), source='addon', write_only=True
    )

    class Meta:
        model = QuotationItemAddOn
        fields = ['addon', 'addon_id']

class QuotationItemSerializer(serializers.ModelSerializer):
    instrument = InstrumentSerializer(read_only=True)
    instrument_id = serializers.PrimaryKeyRelatedField(
        queryset=Instrument.objects.all(), source='instrument', write_only=True
    )
    selections = QuotationItemSelectionSerializer(many=True, required=False)
    addons = QuotationItemAddOnSerializer(many=True, required=False)

    class Meta:
        model = QuotationItem
        fields = ['product_code', 'quantity', 'instrument', 'instrument_id', 'selections', 'addons']

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

    class Meta:
        model = Quotation
        fields = ['id', 'company', 'project_name', 'status', 'remarks', 'submitted_at', 'rejected_at', 'approved_at', 'items', 'created_by']
        read_only_fields = ['status', 'remarks', 'rejected_at', 'approved_at', 'created_by']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        company = validated_data.pop('company', None)
        project_name = validated_data.pop('project_name', '')
        quotation = Quotation.objects.create(
            company=company,
            project_name=project_name,
            created_by=self.context['request'].user,
            **validated_data
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
        read_only_fields = ['id']

    def validate(self, data):
        if data.get('status') == 'rejected' and not data.get('remarks'):
            raise serializers.ValidationError({"remarks": "Remarks are required when rejecting a quotation."})
        return data