from rest_framework import serializers
from .models import (
    Category,
    InstrumentType,
    Instrument,
    ConfigurableField,
    FieldOption,
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
