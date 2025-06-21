from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from chat.views import upload_file

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include("api.urls")),
    path("api/users/", include("users.urls")),
    path('api/chat/upload/', upload_file, name='upload_file'),
    path('', RedirectView.as_view(url='/admin/', permanent=False), name='home'),
    path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico')),  # Favicon
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)