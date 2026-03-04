# Run ONCE from backend/ folder:
# python -m app.scripts.embed_descriptors
from app.config import supabase
from app.services.embedding import embed_text

def run():
    result = supabase.table("muet_descriptors")\
        .select("id, component, band_level, descriptor_text, embedding_vector")\
        .execute()

    to_embed = [r for r in result.data if not r["embedding_vector"]]
    print(f"Found {len(to_embed)} descriptors to embed...")

    for row in to_embed:
        print(f"  Embedding {row['component']} {row['band_level']}...")
        vector = embed_text(row["descriptor_text"])
        supabase.table("muet_descriptors")\
            .update({"embedding_vector": vector})\
            .eq("id", row["id"])\
            .execute()
        print(f"  ✓ Done — vector length: {len(vector)}")

    print("\nAll descriptors embedded successfully!")

if __name__ == "__main__":
    run()