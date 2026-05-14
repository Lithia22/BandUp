import numpy as np
from collections import Counter


def assign_cluster_label(scores: dict) -> str:
    """
    Assign a cluster label based on individual student's band scores.
    Priority order: Foundation -> Good Understanding -> Good Expressive -> Balanced
    """
    l = scores.get("listening_band") or 0
    r = scores.get("reading_band") or 0
    w = scores.get("writing_band") or 0
    s = scores.get("speaking_band") or 0

    avg = (l + r + w + s) / 4
    understanding = (l + r) / 2
    expressive = (w + s) / 2
    diff = understanding - expressive
    spread = max(l, r, w, s) - min(l, r, w, s)

    # ========== FOUNDATION CLUSTER ==========
    # Average below 2.5 indicates overall low performance
    if avg < 2.5:
        return "Foundation Needed"

    # ========== GOOD UNDERSTANDING CLUSTER ==========
    # Understanding skills at least 1 band higher than expressive
    # Check this BEFORE Balanced because (5,5,2,2) has spread=3.0 but is clearly Good Understanding
    if diff >= 1.0:
        return "Good Understanding Skills"

    # ========== GOOD EXPRESSIVE CLUSTER ==========
    # Expressive skills at least 1 band higher than understanding
    if diff <= -1.0:
        return "Good Expressive Skills"

    # ========== BALANCED CLUSTER ==========
    # All component bands are within 1.5 levels of each other
    if spread <= 1.5:
        return "Balanced Performer"

    # ========== FALLBACK ==========
    return "Balanced Performer"


def run_kmeans(students: list[dict], k: int = 4, max_iter: int = 300) -> list[dict]:
    """
    Apply K-means clustering to group students by performance patterns,
    then label each cluster based on its centroid scores.
    """
    if not students:
        return []

    # ========== STEP 1: DATA PREPARATION ==========
    keys = ["listening_band", "reading_band", "writing_band", "speaking_band"]
    X = np.array([[s[key] or 0 for key in keys] for s in students], dtype=float)

    n = len(X)

    # ========== STEP 2: EDGE CASES ==========
    if n < k:
        return [
            {
                "student_band_id": s["student_band_id"],
                "cluster_label": assign_cluster_label(s),
            }
            for s in students
        ]

    if np.all(X == X[0]):
        label = assign_cluster_label(students[0])
        return [
            {"student_band_id": s["student_band_id"], "cluster_label": label}
            for s in students
        ]

    # ========== STEP 3: INITIALIZE CENTROIDS (K-MEANS++) ==========
    rng = np.random.default_rng(42)
    centroid_indices = [int(rng.integers(n))]

    for _ in range(k - 1):
        dists = np.min(
            np.linalg.norm(X[:, None] - X[centroid_indices], axis=2), axis=1
        )
        sum_dist = (dists ** 2).sum()

        if sum_dist == 0:
            remaining = [i for i in range(n) if i not in centroid_indices]
            if remaining:
                centroid_indices.append(int(rng.choice(remaining)))
            else:
                break
        else:
            probs = dists ** 2 / sum_dist
            centroid_indices.append(int(rng.choice(n, p=probs)))

    centroids = X[centroid_indices].copy()

    # ========== STEP 4: K-MEANS ITERATIONS ==========
    assignments = np.zeros(n, dtype=int)
    for _ in range(max_iter):
        dists = np.linalg.norm(X[:, None] - centroids[None], axis=2)
        new_assignments = np.argmin(dists, axis=1)
        
        if np.array_equal(new_assignments, assignments):
            break
        
        assignments = new_assignments
        
        for j in range(len(centroids)):
            members = X[assignments == j]
            if len(members) > 0:
                centroids[j] = members.mean(axis=0)

    # ========== STEP 5: CLUSTER LABELING ==========
    # Label each cluster based on its CENTROID scores
    cluster_to_label = {}
    for j in range(len(centroids)):
        members_idx = np.where(assignments == j)[0]

        if len(members_idx) == 0:
            cluster_to_label[j] = "Balanced Performer"
            continue

        centroid_scores = {
            "listening_band": float(centroids[j][0]),
            "reading_band":   float(centroids[j][1]),
            "writing_band":   float(centroids[j][2]),
            "speaking_band":  float(centroids[j][3]),
        }
        cluster_to_label[j] = assign_cluster_label(centroid_scores)

    # ========== STEP 6: FINAL OUTPUT ==========
    return [
        {
            "student_band_id": students[i]["student_band_id"],
            "cluster_label": cluster_to_label[assignments[i]],
        }
        for i in range(n)
    ]