from rest_framework import serializers
from .models import (
    Category, InstrumentType, Instrument,
    ConfigurableField, FieldOption,
    AddOn, AddOnType, Quotation, QuotationItem
)

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

# NEW SERIALIZERS

class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = ['product_code', 'instrument']

class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)

    class Meta:
        model = Quotation
        fields = ['items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        quotation = Quotation.objects.create(created_by=user, **validated_data)
        for item in items_data:
            QuotationItem.objects.create(quotation=quotation, **item)
        return quotation