import numpy as np
from collections import Counter


def assign_cluster_label(scores: dict) -> str:
    """
    Assign a cluster label based on individual student's band scores.
    Priority order: Foundation -> Balanced -> Good Understanding -> Good Expressive
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
    # Average below 2.5 indicates overall low performance (Band 1-2 across components)
    # This must be checked first because a student with all low bands (1,1,1,1)
    # would otherwise appear "balanced" (spread=0) and be misclassified
    if avg < 2.5:
        return "Foundation Needed"

    # ========== BALANCED CLUSTER ==========
    # All component bands are within 1.5 levels of each other
    # Example: (4,4,3,3) has spread=1.0 -> Balanced
    # Example: (4,4,2,2) has spread=2.0 -> not Balanced
    if spread <= 1.5:
        return "Balanced Performer"

    # ========== GOOD UNDERSTANDING CLUSTER ==========
    # Understanding skills (Listening + Reading) are at least 1 band higher than expressive
    # Example: (4,4,2,2) -> understanding=4.0, expressive=2.0, diff=2.0
    if diff >= 1.0:
        return "Good Understanding Skills"

    # ========== GOOD EXPRESSIVE CLUSTER ==========
    # Expressive skills (Writing + Speaking) are at least 1 band higher than understanding
    # Example: (2,2,4,4) -> understanding=2.0, expressive=4.0, diff=-2.0
    if diff <= -1.0:
        return "Good Expressive Skills"

    # ========== FALLBACK ==========
    # No clear pattern (e.g., mixed profiles like 4,2,4,2)
    return "Balanced Performer"


def run_kmeans(students: list[dict], k: int = 4, max_iter: int = 300) -> list[dict]:
    """
    Apply K-means clustering to group students by performance patterns,
    then label each cluster based on its centroid scores.
    """
    if not students:
        return []

    # ========== STEP 1: DATA PREPARATION ==========
    # Convert student band scores into a numpy matrix X
    # Each row represents a student: [listening, reading, writing, speaking]
    keys = ["listening_band", "reading_band", "writing_band", "speaking_band"]
    X = np.array([[s[key] or 0 for key in keys] for s in students], dtype=float)

    n = len(X)

    # ========== STEP 2: EDGE CASES ==========
    # Fallback 1: Not enough students for K-means → use rule labels directly
    if n < k:
        return [
            {
                "student_band_id": s["student_band_id"],
                "cluster_label": assign_cluster_label(s),
            }
            for s in students
        ]

    # Fallback 2: All students have identical scores → K-means would break
    if np.all(X == X[0]):
        label = assign_cluster_label(students[0])
        return [
            {"student_band_id": s["student_band_id"], "cluster_label": label}
            for s in students
        ]

    # ========== STEP 3: CHOOSE k ==========
    # k=4 is determined by survey findings (4 natural student patterns)
    # This is domain-driven rather than using elbow method

    # ========== STEP 4: INITIALIZE CENTROIDS (K-MEANS++) ==========
    # K-means++ improves random initialization by spreading centroids
    # Fixed random seed (42) ensures reproducible results
    rng = np.random.default_rng(42)
    centroid_indices = [int(rng.integers(n))]

    for _ in range(k - 1):
        # Calculate distance from each point to nearest existing centroid
        dists = np.min(
            np.linalg.norm(X[:, None] - X[centroid_indices], axis=2), axis=1
        )
        sum_dist = (dists ** 2).sum()

        # Select next centroid weighted by squared distance (probability)
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

    # ========== STEPS 5: K-MEANS ITERATIONS ==========
    # Repeat until convergence or max_iter reached:
    #   - Assign each point to nearest centroid (Euclidean distance)
    #   - Recalculate centroids as mean of points in each cluster
    assignments = np.zeros(n, dtype=int)
    for _ in range(max_iter):
        # ASSIGN - each student to nearest centroid
        dists = np.linalg.norm(X[:, None] - centroids[None], axis=2)
        new_assignments = np.argmin(dists, axis=1)
        
        # CHECK CONVERGENCE - If assignments didn't change from last iteration, we have converged
        if np.array_equal(new_assignments, assignments):
            break 
        
        assignments = new_assignments
        
    # ========== STEPS 6: UPDATE CENTROIDS - recalculate centroids as mean of points in cluster ==========
        for j in range(len(centroids)):
            members = X[assignments == j]
            if len(members) > 0:
                centroids[j] = members.mean(axis=0)

    # ========== STEP 7: CLUSTER LABELING ==========
    # Label each cluster based on its CENTROID scores (not majority vote)
    # This is the correct K-means approach - the centroid represents the cluster
    cluster_to_label = {}
    for j in range(len(centroids)):
        members_idx = np.where(assignments == j)[0]

        if len(members_idx) == 0:
            cluster_to_label[j] = "Balanced Performer"
            continue

        # Convert centroid array to dictionary for assign_cluster_label()
        centroid_scores = {
            "listening_band": float(centroids[j][0]),
            "reading_band":   float(centroids[j][1]),
            "writing_band":   float(centroids[j][2]),
            "speaking_band":  float(centroids[j][3]),
        }
        cluster_to_label[j] = assign_cluster_label(centroid_scores)

    # ========== STEP 8: FINAL OUTPUT ==========
    # Return results: each student gets the label of their assigned cluster
    return [
        {
            "student_band_id": students[i]["student_band_id"],
            "cluster_label": cluster_to_label[assignments[i]],
        }
        for i in range(n)
    ]