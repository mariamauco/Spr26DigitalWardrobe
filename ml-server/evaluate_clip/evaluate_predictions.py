import pandas as pd

df = pd.read_csv("eval_out/predictions.csv")
df = df[df["true_fine"].notna() & df["pred_fine"].notna()]

df["correct"] = df["true_fine"] == df["pred_fine"]
accuracy_by_fine = df.groupby("true_fine")["correct"].mean().round(3).sort_values()
print(accuracy_by_fine)