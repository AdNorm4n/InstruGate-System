from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        print("CustomTokenObtainPairSerializer: JWT role set to:", user.role)  # Debug
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        print("CustomTokenObtainPairSerializer: Response role set to:", self.user.role)  # Debug
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer