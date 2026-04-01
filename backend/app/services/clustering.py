import numpy as np
from collections import Counter

def assign_cluster_label(scores: dict) -> str:
    l = scores.get("listening_band") or 0
    r = scores.get("reading_band") or 0
    w = scores.get("writing_band") or 0
    s = scores.get("speaking_band") or 0

    avg = (l + r + w + s) / 4
    receptive = (l + r) / 2
    expressive = (w + s) / 2
    spread = max(l, r, w, s) - min(l, r, w, s)

    if avg < 2.5:
        return "Foundation Needed"
    if spread <= 1.5:
        return "Balanced Performer"
    if receptive >= expressive + 1:
        return "Good Understanding Skills"
    if expressive >= receptive + 1:
        return "Good Expressive Skills"
    return "Balanced Performer"


def run_kmeans(students: list[dict], k: int = 4, max_iter: int = 100) -> list[dict]:
    if not students:
        return []

    keys = ["listening_band", "reading_band", "writing_band", "speaking_band"]
    X = np.array([[s[key] or 0 for key in keys] for s in students], dtype=float)

    if len(X) < k:
        k = len(X)
    
    # Rule-based labels used to name the clusters after k-means groups them
    rule_labels = {
        s["student_band_id"]: assign_cluster_label(s) for s in students
    }

    # k-means++ initialisation with safety checks
    rng = np.random.default_rng(42)
    centroid_indices = [rng.integers(len(X))]
    
    for _ in range(k - 1):
        dists = np.min(
            np.linalg.norm(X[:, None] - X[centroid_indices], axis=2), axis=1
        )
        sum_dist = (dists ** 2).sum()
        
        if sum_dist == 0:
            remaining = [i for i in range(len(X)) if i not in centroid_indices]
            if remaining:
                centroid_indices.append(rng.choice(remaining))
            else:
                break
        else:
            probs = dists ** 2 / sum_dist
            centroid_indices.append(rng.choice(len(X), p=probs))
    
    centroids = X[centroid_indices].copy()

    assignments = np.zeros(len(X), dtype=int)
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

    # Map k-means cluster index → most common rule-based label in that cluster
    cluster_to_label = {}
    for j in range(len(centroids)):
        members_idx = np.where(assignments == j)[0]
        if len(members_idx) == 0:
            cluster_to_label[j] = "Balanced Performer"
            continue
        labels_in_cluster = [rule_labels[students[i]["student_band_id"]] for i in members_idx]
        cluster_to_label[j] = Counter(labels_in_cluster).most_common(1)[0][0]

    return [
        {
            "student_band_id": students[i]["student_band_id"],
            "cluster_label": cluster_to_label[assignments[i]],
        }
        for i in range(len(students))
    ]