from django.urls import path
from .views import RegisterClientView, UserDetailsView
from .token_serializers import CustomTokenObtainPairView  # ✅ Add this

urlpatterns = [
    path("register/", RegisterClientView.as_view(), name="register-client"),
    path("me/", UserDetailsView.as_view(), name="user-details"),
    path("token/", CustomTokenObtainPairView.as_view(), name="custom-token"),  # ✅ JWT login
]
