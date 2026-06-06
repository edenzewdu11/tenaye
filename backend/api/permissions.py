from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from .telegram_auth import TelegramAuthentication

class IsWebOrAuthenticated(BasePermission):
    """
    Allows access if:
    1. User is authenticated via JWT
    2. OR user is authenticated via Telegram
    3. OR request is from web app (has web-user-id header for guest mode)
    """
    def has_permission(self, request, view):
        # Check JWT authentication first
        jwt_auth = JWTAuthentication()
        try:
            auth_result = jwt_auth.authenticate(request)
            if auth_result:
                request.user = auth_result[0]
                return True
        except:
            pass
        
        # Check Telegram authentication
        telegram_auth = TelegramAuthentication()
        try:
            auth_result = telegram_auth.authenticate(request)
            if auth_result:
                request.user = auth_result[0]
                return True
        except:
            pass
        
        # Allow web app requests (with web-user-id header for guest mode)
        web_user_id = request.headers.get('web-user-id')
        if web_user_id:
            return True
            
        return False
