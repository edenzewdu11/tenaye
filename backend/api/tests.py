import json
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .models import TgUser, ChatMessage, LocationRecommendation
from .crisis import is_crisis, CRISIS_RESPONSE
from .views import chat, recommendations, parse_and_save_recommendations

class TestCrisisSafety(TestCase):
    def test_regex_matching_english(self):
        self.assertTrue(is_crisis("I want to kill myself"))
        self.assertTrue(is_crisis("I can't go on anymore, life is useless"))
        self.assertTrue(is_crisis("How to commit suicide"))
        self.assertTrue(is_crisis("I'm thinking of ending my life"))
        
        self.assertFalse(is_crisis("I had a stressful exam today but I am fine"))
        self.assertFalse(is_crisis("Hello companion"))

    def test_regex_matching_amharic(self):
        self.assertTrue(is_crisis("ራሴን ማጥፋት እፈልጋለሁ"))
        self.assertTrue(is_crisis("መሞት እፈልጋለሁ"))
        self.assertTrue(is_crisis("ራሴን መግደል"))
        
        self.assertTrue(is_crisis("rasen mageded"))
        self.assertTrue(is_crisis("motku yene work"))

    @patch('api.views.chat_reply')
    def test_llm_crisis_trigger_interception(self, mock_chat_reply):
        factory = APIRequestFactory()
        user, _ = TgUser.objects.get_or_create(telegram_id=999999, username="test_safety_user")
        
        # Standard reply
        mock_chat_reply.return_value = "Keep going, yene guadegna."
        request = factory.post('/chat/', {"content": "stressed about exams"}, format='json')
        force_authenticate(request, user=user)
        resp = chat(request)
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["crisis"])

        # Crisis reply
        mock_chat_reply.return_value = '{"status": "CRISIS_TRIGGERED"}'
        request = factory.post('/chat/', {"content": "extreme thoughts"}, format='json')
        force_authenticate(request, user=user)
        resp = chat(request)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["crisis"])


class TestLocationRecommendations(TestCase):
    def setUp(self):
        self.user, _ = TgUser.objects.get_or_create(telegram_id=888888, username="test_rec_user")
        self.factory = APIRequestFactory()

    def tearDown(self):
        LocationRecommendation.objects.filter(user=self.user).delete()
        self.user.delete()

    def test_parser_with_recommendations(self):
        text = (
            "You should check out Entoto Park or Tomoca!\n\n"
            "[RECOMMENDATIONS]\n"
            '[\n'
            '  {"name": "Entoto Park", "category": "Park", "description": "A forest park.", "reason": "You like nature."},\n'
            '  {"name": "Tomoca Coffee", "category": "Cafe", "description": "Good coffee.", "reason": "You like coffee."}\n'
            ']'
        )
        clean_text, has_new = parse_and_save_recommendations(self.user, text)
        
        self.assertEqual(clean_text, "You should check out Entoto Park or Tomoca!")
        self.assertTrue(has_new)

        recs = LocationRecommendation.objects.filter(user=self.user).order_by("name")
        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0].name, "Entoto Park")
        self.assertEqual(recs[0].category, "Park")
        self.assertEqual(recs[0].description, "A forest park.")
        self.assertEqual(recs[0].reason, "You like nature.")

    def test_parser_unique_constraint(self):
        LocationRecommendation.objects.create(
            user=self.user,
            name="Entoto Park",
            category="Park",
            description="Initial desc",
            reason="Initial reason"
        )
        
        text = (
            "I highly suggest Entoto Park.\n\n"
            "[RECOMMENDATIONS]\n"
            '[{"name": "Entoto Park", "category": "Park", "description": "Updated desc", "reason": "Updated reason"}]'
        )
        clean_text, has_new = parse_and_save_recommendations(self.user, text)
        
        self.assertEqual(clean_text, "I highly suggest Entoto Park.")
        self.assertFalse(has_new)
        
        rec = LocationRecommendation.objects.get(user=self.user, name="Entoto Park")
        self.assertEqual(rec.description, "Updated desc")
        self.assertEqual(rec.reason, "Updated reason")

    @patch('api.views.chat_reply')
    def test_chat_view_integration(self, mock_chat_reply):
        mock_chat_reply.return_value = (
            "I think you will enjoy Friendship Park nearby Bole.\n\n"
            "[RECOMMENDATIONS]\n"
            '[{"name": "Friendship Park", "category": "Park", "description": "Urban garden.", "reason": "Nearby Bole."}]'
        )
        
        request = self.factory.post('/chat/', {"content": "Where can I go near Bole?"}, format='json')
        force_authenticate(request, user=self.user)
        
        resp = chat(request)
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["crisis"])
        self.assertEqual(resp.data["reply"], "I think you will enjoy Friendship Park nearby Bole.")
        self.assertTrue(resp.data["has_new_recommendations"])

        get_request = self.factory.get('/recommendations/')
        force_authenticate(get_request, user=self.user)
        
        get_resp = recommendations(get_request)
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(len(get_resp.data), 1)
        self.assertEqual(get_resp.data[0]["name"], "Friendship Park")
