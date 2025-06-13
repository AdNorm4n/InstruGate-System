from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .models import CustomUser
from .serializers import CustomUserSerializer, CustomUserUpdateSerializer, AdminUserUpdateSerializer, AdminUserCreateSerializer
from django.contrib.auth import logout
from django.core.mail import send_mail
from django.conf import settings
from uuid import uuid4
from django.core.cache import cache


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class RegisterClientView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [AllowAny]

class UserDetailsView(generics.RetrieveAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        print("UserDetailsView: GET /api/users/me/ serialized data:", serializer.data)
        return Response(serializer.data)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role == 'admin':
            return AdminUserUpdateSerializer
        return CustomUserUpdateSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserUpdateSerializer(request.user, context={'request': request})
        print("UserProfileUpdateView: GET /api/users/me/update/ serialized data:", serializer.data)
        return Response(serializer.data)

    def put(self, request):
        serializer = CustomUserUpdateSerializer(
            request.user,
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = serializer.save()
            return_response = CustomUserUpdateSerializer(user, context={'request': request}).data
            print("UserProfileUpdateView: PUT /api/users/me/update/ response data:", return_response)
            return Response(return_response, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListView(generics.ListAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        print("UserListView: User role:", user.role, "is_superuser:", user.is_superuser)
        if user.is_superuser and user.role == "admin":
            return CustomUser.objects.all()
        return CustomUser.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists() and request.user.is_authenticated:
            return Response(
                {"error": "Access denied. You are not an admin."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(queryset, many=True)
        print("UserListView: GET /api/users/list/ serialized users:", serializer.data)
        return Response(serializer.data)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Logged out"}, status=status.HTTP_200_OK)

class AdminUserCreateView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"error": "No user found with this email address."}, status=status.HTTP_404_NOT_FOUND)

        # Generate and store reset token
        token = str(uuid4())
        cache.set(f"reset_token_{user.pk}", token, timeout=15 * 60)  # 15 minutes

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}&uid={user.pk}"

        send_mail(
            subject="Password Reset Request",
            message=(
                f"Hi {user.username},\n\n"
                f"Click the link below to reset your password:\n{reset_link}\n\n"
                f"This link is valid for 15 minutes.\n\n"
                f"If you did not request this, please ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({"message": "Password reset link sent successfully."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")

        if not all([uid, token, new_password]):
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(pk=uid)
        except CustomUser.DoesNotExist:
            return Response({"error": "Invalid user."}, status=status.HTTP_404_NOT_FOUND)

        # Validate token
        cached_token = cache.get(f"reset_token_{uid}")
        if cached_token != token:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        cache.delete(f"reset_token_{uid}")

        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)