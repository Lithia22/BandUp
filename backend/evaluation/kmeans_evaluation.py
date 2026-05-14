"""
Print K-means Results for Report
Run: python -m evaluation.print_kmeans_results
"""

import sys
import os
import csv
import glob
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import supabase
from app.services.clustering import run_kmeans
import numpy as np

def fetch_students():
    result = supabase.table("student_bands")\
        .select("id, student_id, listening_band, reading_band, writing_band, speaking_band")\
        .execute()
    
    bands = result.data
    students = []
    for b in bands:
        if b.get("listening_band") and b.get("reading_band") and b.get("writing_band") and b.get("speaking_band"):
            students.append({
                "student_band_id": b["id"],
                "student_id": b["student_id"],
                "listening_band": float(b["listening_band"]),
                "reading_band": float(b["reading_band"]),
                "writing_band": float(b["writing_band"]),
                "speaking_band": float(b["speaking_band"])
            })
    return students

def calculate_silhouette_score(X, labels):
    n = len(X)
    if n < 2:
        return 0.0
    
    unique_labels = list(set(labels))
    if len(unique_labels) < 2:
        return 0.0
    
    clusters = {label: [] for label in unique_labels}
    for i, label in enumerate(labels):
        clusters[label].append(i)
    
    silhouette_scores = []
    
    for i in range(n):
        label_i = labels[i]
        same_cluster = clusters[label_i]
        
        if len(same_cluster) > 1:
            a_i = np.mean([np.linalg.norm(X[i] - X[j]) for j in same_cluster if j != i])
        else:
            a_i = 0
        
        b_i = float('inf')
        for other_label, other_indices in clusters.items():
            if other_label == label_i:
                continue
            if other_indices:
                mean_dist = np.mean([np.linalg.norm(X[i] - X[j]) for j in other_indices])
                if mean_dist < b_i:
                    b_i = mean_dist
        
        if b_i == float('inf'):
            continue
        
        s_i = (b_i - a_i) / max(a_i, b_i) if max(a_i, b_i) > 0 else 0
        silhouette_scores.append(s_i)
    
    return np.mean(silhouette_scores) if silhouette_scores else 0.0

def print_results():
    students = fetch_students()
    total = len(students)
    
    X = np.array([[s["listening_band"], s["reading_band"], s["writing_band"], s["speaking_band"]] for s in students])
    results = run_kmeans(students, k=4)
    labels = [r["cluster_label"] for r in results]
    
    silhouette = calculate_silhouette_score(X, labels)
    
    cluster_counts = {}
    for label in labels:
        cluster_counts[label] = cluster_counts.get(label, 0) + 1
    
    print("\n" + "=" * 90)
    print(" " * 35 + "K-MEANS CLUSTERING RESULTS")
    print("=" * 90)
    print(f"\n{'Metric':<35} {'Value'}")
    print("-" * 90)
    print(f"{'Total Students':<35} {total}")
    print(f"{'Number of Clusters (k)':<35} 4")
    print(f"{'Silhouette Score':<35} {silhouette:.4f}")
    print(f"{'Interpretation':<35} {'Good cluster separation' if silhouette >= 0.5 else 'Moderate cluster separation'}")
    
    print("\n" + "=" * 90)
    print(" " * 32 + "CLUSTER DISTRIBUTION")
    print("=" * 90)
    print(f"\n{'Cluster Type':<35} {'Count':<10} {'Percentage'}")
    print("-" * 90)
    for label, count in sorted(cluster_counts.items()):
        print(f"{label:<35} {count:<10} {count/total*100:.1f}%")
    
    print("\n" + "=" * 90 + "\n")
    
    # Find existing files to get next number
    existing = glob.glob(os.path.join(os.path.dirname(__file__), "kmeans_results_*.csv"))
    next_num = len(existing) + 1
    csv_path = os.path.join(os.path.dirname(__file__), f"kmeans_results_{next_num}.csv")
    
    # Save cluster distribution data
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["metric", "value"])
        writer.writerow(["total_students", total])
        writer.writerow(["num_clusters", 4])
        writer.writerow(["silhouette_score", round(silhouette, 4)])
        writer.writerow(["interpretation", "Good cluster separation" if silhouette >= 0.5 else "Moderate cluster separation"])
        writer.writerow([])
        writer.writerow(["cluster_type", "count", "percentage"])
        for label, count in sorted(cluster_counts.items()):
            writer.writerow([label, count, f"{count/total*100:.1f}%"])
    
    print(f"Results saved to: {csv_path}")

if __name__ == "__main__":
    print_results()