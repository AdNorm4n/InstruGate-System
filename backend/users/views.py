from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .models import CustomUser
from .serializers import CustomUserSerializer, CustomUserUpdateSerializer, AdminUserUpdateSerializer, AdminUserCreateSerializer
from django.contrib.auth import logout

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