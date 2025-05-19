from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "password", "company", "first_name", "last_name", "role"]
        extra_kwargs = {
            "password": {"write_only": True},
            "role": {"read_only": True},  # role = "client" by default
        }

    def create(self, validated_data):
        validated_data["role"] = "client"  # enforce new signups as clients
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        print("CustomUserSerializer: Serialized data:", ret)  # Debug log
        return ret

class CustomUserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ["username", "first_name", "last_name", "email", "company", "password", "confirm_password", "role"]
        read_only_fields = ["username", "role"]

    def validate(self, data):
        user = self.context['request'].user
        role = user.role

        # Prevent admins/proposal engineers from changing email or company
        if role in ['admin', 'proposal_engineer']:
            if 'email' in data and data['email'] != user.email:
                raise serializers.ValidationError({"email": "Admins and proposal engineers cannot change their email."})
            if 'company' in data and data['company'] != user.company:
                raise serializers.ValidationError({"company": "Admins and proposal engineers cannot change their company."})

        # Password validation
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
            if password and len(password) < 8:
                raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})

        return data

    def update(self, instance, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance