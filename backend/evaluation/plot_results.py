"""
Evaluation Charts - RAG Comparison & K-means Cluster Distribution
Run: python -m evaluation.plot_results
"""

import os
import csv
import sys

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np
except ImportError:
    print("Run: pip install matplotlib")
    sys.exit(1)

BASE = os.path.dirname(__file__)
CLUSTER_COLORS = {
    'Foundation Needed': '#E9424C',
    'Balanced Performer': '#FFD800',
    'Good Understanding Skills': '#B57EDC',
    'Good Expressive Skills': '#2BBFBF',
}

# ============================================================
# RAG EVALUATION CHART
# ============================================================

RAG_CSV_PATH = os.path.join(BASE, "rag_eval_results_1.csv")

def calculate_rag_metrics():
    with open(RAG_CSV_PATH, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        rows = list(reader)
    
    total = len(rows)
    no_rag_correct = sum(1 for r in rows if r[4] == 'True')
    full_rag_correct = sum(1 for r in rows if r[6] == 'True')
    no_rag_times = [float(r[7]) for r in rows]
    full_rag_times = [float(r[8]) for r in rows]
    no_rag_hall = sum(1 for r in rows if int(r[9]) < 2)
    full_rag_hall = sum(1 for r in rows if int(r[10]) < 2)
    
    return {
        'no_rag_acc': no_rag_correct / total * 100,
        'full_rag_acc': full_rag_correct / total * 100,
        'no_rag_hall': no_rag_hall / total * 100,
        'full_rag_hall': full_rag_hall / total * 100,
        'no_rag_time': sum(no_rag_times) / total,
        'full_rag_time': sum(full_rag_times) / total,
        'total': total
    }

def create_rag_chart():
    metrics = calculate_rag_metrics()
    
    categories = ['Band Accuracy', 'Hallucination Rate', 'Response Time']
    no_rag_values = [metrics['no_rag_acc'], metrics['no_rag_hall'], metrics['no_rag_time']]
    full_rag_values = [metrics['full_rag_acc'], metrics['full_rag_hall'], metrics['full_rag_time']]
    
    # Normalize response time
    max_time = max(metrics['no_rag_time'], metrics['full_rag_time'])
    no_rag_values[2] = no_rag_values[2] / max_time * 100
    full_rag_values[2] = full_rag_values[2] / max_time * 100
    
    x = np.arange(len(categories))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(10, 6))
    bars1 = ax.bar(x - width/2, no_rag_values, width, label='No RAG', color='#94a3b8', edgecolor='white', linewidth=1.2)
    bars2 = ax.bar(x + width/2, full_rag_values, width, label='Full RAG', color='#3b82f6', edgecolor='white', linewidth=1.2)
    
    # Add value labels
    for bar, val in zip(bars1, [metrics['no_rag_acc'], metrics['no_rag_hall'], metrics['no_rag_time']]):
        unit = '%' if val < 100 else 's'
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, 
                f'{val:.1f}{unit}', ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    for bar, val in zip(bars2, [metrics['full_rag_acc'], metrics['full_rag_hall'], metrics['full_rag_time']]):
        unit = '%' if val < 100 else 's'
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f'{val:.1f}{unit}', ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    ax.set_ylabel('Percentage (%) / Time (seconds)', fontsize=11)
    ax.set_title(f'RAG Evaluation: No RAG vs Full RAG (n={metrics["total"]} test cases)', fontsize=13, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.legend(loc='upper left', bbox_to_anchor=(1.02, 1), fontsize=10)
    ax.set_ylim(0, 110)
    ax.spines[['top', 'right']].set_visible(False)
    ax.grid(axis='y', linestyle='--', alpha=0.3)
    
    plt.tight_layout()
    
    chart_path = os.path.join(BASE, "chart_rag_comparison.png")
    plt.savefig(chart_path, dpi=150, bbox_inches='tight')
    print(f"RAG chart saved to: {chart_path}")

# ============================================================
# K-MEANS CLUSTER DISTRIBUTION CHART
# ============================================================

def get_kmeans_data():
    """Get latest kmeans results from CSV"""
    import glob
    kmeans_files = glob.glob(os.path.join(BASE, "kmeans_results_*.csv"))
    if not kmeans_files:
        print("No kmeans_results_*.csv found. Run print_kmeans_results.py first.")
        return None
    
    # Get the latest file
    latest_file = max(kmeans_files, key=os.path.getctime)
    
    clusters = []
    counts = []
    
    with open(latest_file, 'r') as f:
        reader = csv.reader(f)
        in_cluster_section = False
        for row in reader:
            if len(row) >= 2 and row[0] == 'cluster_type':
                in_cluster_section = True
                continue
            if in_cluster_section and len(row) >= 2 and row[0]:
                clusters.append(row[0])
                counts.append(int(row[1]))
    
    return clusters, counts, sum(counts)

def create_kmeans_chart():
    data = get_kmeans_data()
    if not data:
        return
    
    clusters, counts, total = data
    colors = [CLUSTER_COLORS.get(c, '#3b82f6') for c in clusters]
    
    # Create multi-line labels (split long names)
    labels = []
    for c in clusters:
        if c == 'Good Understanding Skills':
            labels.append('Good Understanding\nSkills')
        elif c == 'Good Expressive Skills':
            labels.append('Good Expressive\nSkills')
        elif c == 'Foundation Needed':
            labels.append('Foundation\nNeeded')
        elif c == 'Balanced Performer':
            labels.append('Balanced\nPerformer')
        else:
            labels.append(c)
    
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(labels, counts, color=colors, edgecolor='white', linewidth=1.5)
    
    for bar, count, cluster in zip(bars, counts, clusters):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                f'{count} students\n({count/total*100:.1f}%)', 
                ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    ax.set_ylabel('Number of Students', fontsize=12)
    ax.set_title(f'K-Means Cluster Distribution (k=4, n={total} students)', fontsize=13, fontweight='bold')
    ax.set_ylim(0, max(counts) + 5)
    ax.spines[['top', 'right']].set_visible(False)
    ax.grid(axis='y', linestyle='--', alpha=0.3)
    
    # Add legend with full names and colors
    from matplotlib.patches import Patch
    legend_elements = [Patch(facecolor=CLUSTER_COLORS[c], edgecolor='white', label=c) for c in clusters]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=9)
    
    plt.tight_layout()
    
    chart_path = os.path.join(BASE, "chart_kmeans_distribution.png")
    plt.savefig(chart_path, dpi=150, bbox_inches='tight')
    print(f"K-means chart saved to: {chart_path}")

def main():
    print("=" * 60)
    print("GENERATING EVALUATION CHARTS")
    print("=" * 60)
    
    print("\n[1] Generating RAG Comparison Chart")
    create_rag_chart()
    
    print("\n[2] Generating K-means Cluster Distribution Chart")
    create_kmeans_chart()
    
    print("\n" + "=" * 60)
    print("COMPLETE! Files generated:")
    print("  - chart_rag_comparison.png → for section 5.3.2")
    print("  - chart_kmeans_distribution.png → for section 5.3.3")
    print("=" * 60)

if __name__ == "__main__":
    main()