import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import lightgbm as lgb
import matplotlib.pyplot as plt
import seaborn as sns
import json


def load_and_prepare_data(csv_path):
    df = pd.read_csv(csv_path)
    domain_counts = df.groupby(['Date', 'Domain']).size().reset_index(name='Count')
    pivot_df = domain_counts.pivot(index='Date', columns='Domain', values='Count').fillna(0)
    pivot_df.index = pivot_df.index.astype(int)
    pivot_df = pivot_df.sort_index()    
    return pivot_df


def predict_domain_trends(pivot_df, future_years=[2026, 2027, 2028], weight_lr=0.4, weight_gbm=0.6):
    composite_scores = {}
    future_years_np = np.array(future_years).reshape(-1, 1)

    for domain in pivot_df.columns:
        years = np.array(pivot_df.index).reshape(-1, 1)
        counts = pivot_df[domain].values

        # Linear Regression
        lr = LinearRegression()
        lr.fit(years, counts)
        lr_pred = lr.predict(future_years_np)

        # LightGBM
        gbm = lgb.LGBMRegressor(min_data_in_leaf=1, num_leaves=4, max_depth=3, verbosity=-1,random_state=42)
        gbm.fit(years, counts)
        gbm_pred = gbm.predict(future_years_np)

        # Composite Score
        composite = weight_lr * np.mean(lr_pred) + weight_gbm * np.mean(gbm_pred)
        composite_scores[domain] = round(composite, 2)

    return composite_scores


#def plot_domain_trends(pivot_df, top_domains):
    sns.set(style="whitegrid")
    pivot_df[top_domains].plot(figsize=(10, 6))
    plt.title("Historical Trend Count per Domain")
    plt.xlabel("Year")
    plt.ylabel("Trend Mentions")
    plt.legend(title="Domain")
    plt.tight_layout()
    plt.show()

def plot_domain_trends(pivot_df, top_domains):
    sns.set(style="whitegrid")

    # Sum total mentions across years for each top domain
    domain_totals = pivot_df.sum()

    # Plot pie chart
    plt.figure(figsize=(10, 8))
    plt.pie(domain_totals, labels=domain_totals.index, autopct='%1.1f%%', startangle=140)
    plt.title("Predicted Domain Trends from 2026-2029 ")
    plt.tight_layout()
    #plt.show()

def display_ranked_scores(scores):
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    print("\n Top Domains by Predicted Momentum Score:")
    for domain, score in ranked:
        print(f"{domain}: {score}")
    return ranked


if __name__ == "__main__":

    csv_file = "technology_trends_dataset.csv"
    pivot_df = load_and_prepare_data(csv_file)
    scores = predict_domain_trends(pivot_df)
    # Save predicted scores to JSON
    with open("predicted_trends.json", "w", encoding="utf-8") as json_file:
      json.dump(scores, json_file, indent=4, ensure_ascii=False)
    print("Predicted domain trends saved to predicted_trends.json")
    ranked = display_ranked_scores(scores)
    top_domains = [domain for domain, _ in ranked[:3]]
    plot_domain_trends(pivot_df, top_domains)


