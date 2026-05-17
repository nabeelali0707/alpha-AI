import base64
import json

from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_or_ip(request):
	"""Rate limit by authenticated user when available, otherwise by IP."""
	auth = request.headers.get("Authorization", "")
	if auth.startswith("Bearer "):
		token = auth.removeprefix("Bearer ")
		try:
			payload = token.split(".")[1]
			payload += "=" * (-len(payload) % 4)
			data = json.loads(base64.urlsafe_b64decode(payload).decode("utf-8"))
			subject = data.get("sub")
			if subject:
				return f"user:{subject}"
		except Exception:
			pass
	return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=get_user_or_ip, default_limits=["60/minute"])
