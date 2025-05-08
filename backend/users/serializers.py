from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "password", "company", "first_name", "role"]
        extra_kwargs = {
            "password": {"write_only": True},
            "role": {"read_only": True},  # role = "client" by default
        }

    def create(self, validated_data):
        validated_data["role"] = "client"  # enforce new signups as clients
        user = CustomUser.objects.create_user(**validated_data)
        return user