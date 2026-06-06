from rest_framework.permissions import BasePermission

class IsWebOrAuthenticated(BasePermission):
    """
    Allows access if:
    1. User is authenticated (Telegram bot)
    2. OR request is from web app (has web-user-id header)
    """
    def has_permission(self, request, view):
        # Allow authenticated users (Telegram bot)
        if request.user and request.user.is_authenticated:
            return True
        
        # Allow web app requests (with web-user-id header)
        web_user_id = request.headers.get('web-user-id')
        if web_user_id:
            return True
            
        return False
