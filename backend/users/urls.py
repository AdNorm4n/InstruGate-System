from django.urls import path
from .views import RegisterClientView, UserDetailsView, UserProfileUpdateView, UserListView, LogoutView, UserDetailView
from .token_serializers import CustomTokenObtainPairView

urlpatterns = [
    path("register/", RegisterClientView.as_view(), name="register-client"),
    path("me/", UserDetailsView.as_view(), name="user-details"),
    path("me/update/", UserProfileUpdateView.as_view(), name="user-profile-update"),
    path("token/", CustomTokenObtainPairView.as_view(), name="custom-token"),
    path("list/", UserListView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),  # New route
    path("logout/", LogoutView.as_view(), name="logout"),
]