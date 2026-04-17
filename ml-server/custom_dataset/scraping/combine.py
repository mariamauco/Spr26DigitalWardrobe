from pathlib import Path
import pandas as pd
import csv

base = Path(__file__).resolve().parent
target = base / "metadata_labeled1.csv"
source = base / "metadata_labeled2.csv"

# Optional safety backup
backup = base / "metadata_labeled.backup.csv"
if not backup.exists():
    backup.write_bytes(target.read_bytes())

# Read everything as text to avoid dtype surprises
target_df = pd.read_csv(target, dtype=str, keep_default_na=False)
source_df = pd.read_csv(source, dtype=str, keep_default_na=False)

# Ensure schemas match exactly
if list(target_df.columns) != list(source_df.columns):
    raise ValueError("Column mismatch between [metadata_labeled.csv](http://_vscodecontentref_/1) and metadata_labeled2.csv")

# Continue row_id from current max in target
max_id = pd.to_numeric(target_df["row_id"], errors="coerce").dropna().astype(int).max()
start_id = int(max_id) + 1 if pd.notna(max_id) else 0
source_df["row_id"] = [str(i) for i in range(start_id, start_id + len(source_df))]

# Append
combined_df = pd.concat([target_df, source_df], ignore_index=True)

# Write with strong quoting so commas/newlines in text fields stay valid CSV
tmp = base / "metadata_labeled.combined.tmp.csv"
combined_df.to_csv(
    tmp,
    index=False,
    encoding="utf-8",
    quoting=csv.QUOTE_ALL,
    lineterminator="\n"
)

# Atomic replace
tmp.replace(target)

print(f"last_id_before={start_id - 1}")
print(f"last_id_after={start_id + len(source_df) - 1}")
print(f"rows_added={len(source_df)}")