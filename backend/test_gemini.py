#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.gemini import _model, chat_reply

print("=== Testing Gemini ===")
model = _model()
print(f"Model available: {model is not None}")

if model:
    print("Testing simple chat...")
    try:
        response = chat_reply([], "Hello, how are you?")
        print(f"Response: {response}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Model not available - check API key")
