"""Download images from metadata.csv to dataset/{image_path}.

Usage:
  python downloadImgs.py
  python downloadImgs.py --csv ../dataset/metadata.csv --dataset-root ../dataset
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from urllib.parse import urlparse

import requests


def _safe_destination(dataset_root: Path, image_path: str, image_url: str) -> Path | None:
	rel = Path(image_path.strip().lstrip("/\\"))

	# If metadata image_path omits extension, infer from URL or default to .jpg.
	if rel.suffix == "":
		url_suffix = Path(urlparse(image_url).path).suffix.lower()
		rel = rel.with_suffix(url_suffix if url_suffix else ".jpg")

	destination = (dataset_root / rel).resolve()
	root_resolved = dataset_root.resolve()

	# Prevent accidental writes outside the dataset directory.
	if root_resolved not in destination.parents and destination != root_resolved:
		return None

	return destination


def download_from_metadata(csv_path: Path, dataset_root: Path, timeout: int = 20, overwrite: bool = False) -> None:
	if not csv_path.exists():
		raise FileNotFoundError(f"metadata csv not found: {csv_path}")

	dataset_root.mkdir(parents=True, exist_ok=True)

	with open(csv_path, "r", newline="", encoding="utf-8") as fh:
		rows = list(csv.DictReader(fh))

	total = len(rows)
	downloaded = 0
	skipped = 0
	failed = 0

	session = requests.Session()
	session.headers.update(
		{
			"User-Agent": (
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
				"AppleWebKit/537.36 (KHTML, like Gecko) "
				"Chrome/123.0.0.0 Safari/537.36"
			)
		}
	)

	for i, row in enumerate(rows, start=1):
		image_url = (row.get("image_url") or "").strip()
		image_path = (row.get("image_path") or "").strip()

		if not image_url or not image_path:
			skipped += 1
			print(f"[{i}/{total}] skip: missing image_url/image_path")
			continue

		destination = _safe_destination(dataset_root, image_path, image_url)
		if destination is None:
			failed += 1
			print(f"[{i}/{total}] fail: unsafe image_path '{image_path}'")
			continue

		destination.parent.mkdir(parents=True, exist_ok=True)

		if destination.exists() and not overwrite:
			skipped += 1
			print(f"[{i}/{total}] skip: exists {destination}")
			continue

		try:
			response = session.get(image_url, timeout=timeout)
			response.raise_for_status()
			destination.write_bytes(response.content)
			downloaded += 1
			print(f"[{i}/{total}] ok: {destination}")
		except Exception as exc:
			failed += 1
			print(f"[{i}/{total}] fail: {image_url} -> {destination} ({exc})")

	print("\nDownload complete")
	print(f"  total rows:   {total}")
	print(f"  downloaded:   {downloaded}")
	print(f"  skipped:      {skipped}")
	print(f"  failed:       {failed}")


def main() -> None:
	here = Path(__file__).resolve().parent
	default_dataset_root = (here.parent / "dataset").resolve()
	default_csv = default_dataset_root / "metadata.csv"

	parser = argparse.ArgumentParser(description="Download images listed in metadata.csv")
	parser.add_argument("--csv", dest="csv_path", type=Path, default=default_csv, help="Path to metadata.csv")
	parser.add_argument(
		"--dataset-root",
		dest="dataset_root",
		type=Path,
		default=default_dataset_root,
		help="Base dataset folder where image_path is resolved",
	)
	parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds")
	parser.add_argument("--overwrite", action="store_true", help="Overwrite files if they already exist")
	args = parser.parse_args()

	download_from_metadata(args.csv_path.resolve(), args.dataset_root.resolve(), args.timeout, args.overwrite)


if __name__ == "__main__":
	main()
