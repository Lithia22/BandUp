from supabase import create_client, Client
from dotenv import load_dotenv
import os
load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Model config - change ONLY these if Google updates
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 3072
LLM_MODEL = "gemini-3.1-flash-lite-preview"
STT_MODEL = "whisper-large-v3"

# Supabase client (service_role bypasses RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)