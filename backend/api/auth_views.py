from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import TgUser
from .serializers import TgUserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=400)
    
    # Create Django user
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    # Create corresponding TgUser
    tg_user = TgUser.objects.create(
        telegram_id=f"web_{user.id}",
        first_name=first_name or user.first_name,
        last_name=last_name or user.last_name,
        username=email.split('@')[0],
        language_code='en'
    )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': TgUserSerializer(tg_user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return tokens"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)
    
    user = authenticate(username=email, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=401)
    
    # Get or create TgUser
    tg_user, created = TgUser.objects.get_or_create(
        telegram_id=f"web_{user.id}",
        defaults={
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.email.split('@')[0],
            'language_code': 'en'
        }
    )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': TgUserSerializer(tg_user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })

@api_view(['POST'])
def logout(request):
    """Logout user"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
def profile(request):
    """Get current user profile"""
    try:
        # Get the web user ID from headers
        web_user_id = request.headers.get('web-user-id')
        if web_user_id:
            tg_user = TgUser.objects.get(telegram_id=f"web_{web_user_id}")
        else:
            # Fallback to authenticated user
            tg_user = request.user
        return Response(TgUserSerializer(tg_user).data)
    except TgUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
