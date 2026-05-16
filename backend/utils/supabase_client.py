import os
from typing import Optional

from supabase import Client, create_client

from utils.config import settings


def get_supabase_client() -> Optional[Client]:
    url = settings.supabase_url or os.getenv("SUPABASE_URL")
    key = settings.supabase_service_role or settings.supabase_anon_key or os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        return None

    return create_client(url, key)
