from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser
from .serializers import CustomUserSerializer, CustomUserUpdateSerializer

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
        print("UserDetailsView: GET /api/users/me/ serialized data:", serializer.data)  # Debug log
        return Response(serializer.data)

class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserUpdateSerializer(request.user, context={'request': request})
        print("UserProfileUpdateView: GET serialized data:", serializer.data)  # Debug log
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
            print("UserProfileUpdateView: PUT /api/users/me/update/ response data:", return_response)  # Debug log
            return Response(return_response, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)