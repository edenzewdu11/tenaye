import uuid
from .models import TgUser

def get_web_user(request):
    """
    Get user from request based on authentication method:
    1. JWT authenticated Django user
    2. Telegram authenticated user  
    3. Guest user (web-user-id header or new guest)
    """
    # JWT authenticated user
    if request.user and hasattr(request.user, 'email'):
        user, created = TgUser.objects.get_or_create(
            telegram_id=f"web_{request.user.id}",
            defaults={
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'username': request.user.email.split('@')[0],
                'language_code': 'en'
            }
        )
        return user
    
    # Telegram authenticated user
    if request.user and hasattr(request.user, 'telegram_id'):
        return request.user
    
    # Guest user
    web_user_id = request.headers.get('web-user-id')
    if web_user_id:
        user, created = TgUser.objects.get_or_create(
            telegram_id=f"web_{web_user_id}",
            defaults={
                'first_name': 'Guest User',
                'username': '',
                'language_code': 'en'
            }
        )
        return user
    
    # Create new guest user
    guest_id = str(uuid.uuid4().hex[:16])
    user = TgUser.objects.create(
        telegram_id=f"web_{guest_id}",
        first_name='Guest User',
        username='',
        language_code='en'
    )
    return user
