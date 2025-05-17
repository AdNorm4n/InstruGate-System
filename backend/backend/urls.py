from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
    
    # ✅ Your app routes
    path("api/", include("api.urls")),        # Instruments
    path("api/users/", include("users.urls")), # Custom user auth & profile     
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)