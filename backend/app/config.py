from supabase import create_client, Client
from dotenv import load_dotenv
import os
load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_STORAGE_URL = os.getenv("SUPABASE_STORAGE_URL")

# JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY not set in .env")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Model config
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 3072
LLM_MODEL = "gemini-3.1-flash-lite"
STT_MODEL = "whisper-large-v3"

# Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)