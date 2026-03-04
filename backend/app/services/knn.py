import math

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Manually compute cosine similarity between two vectors."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

def knn_search(query_vector: list[float], descriptors: list[dict], k: int = 3) -> list[dict]:
    """
    Manual KNN: compute cosine similarity between query and all descriptors,
    return top-k sorted by highest similarity.
    Each descriptor dict must have: id, band_level, descriptor_text, embedding_vector
    """
    scored = []
    for desc in descriptors:
        sim = cosine_similarity(query_vector, desc["embedding_vector"])
        scored.append({
            "id": desc["id"],
            "band_level": desc["band_level"],
            "descriptor_text": desc["descriptor_text"],
            "similarity": sim,
        })
    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:k]