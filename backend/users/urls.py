from django.urls import path
from .views import RegisterClientView, UserDetailsView, UserProfileUpdateView
from .token_serializers import CustomTokenObtainPairView

urlpatterns = [
    path("register/", RegisterClientView.as_view(), name="register-client"),
    path("me/", UserDetailsView.as_view(), name="user-details"),
    path("me/update/", UserProfileUpdateView.as_view(), name="user-profile-update"),
    path("token/", CustomTokenObtainPairView.as_view(), name="custom-token"),
]