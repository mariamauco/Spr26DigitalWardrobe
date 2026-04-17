"""Download images from metadata.csv to dataset/{image_path} concurrently.

Usage:
  python downloader.py
  python downloader.py --csv ../dataset/metadata.csv --dataset-root ../dataset --workers 20
"""

from __future__ import annotations

import argparse
import csv
import time
from pathlib import Path
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests


def _safe_destination(dataset_root: Path, image_path: str) -> Path | None:
    """Resolves the destination path and prevents writing outside the dataset root."""
    rel = Path(image_path.strip().lstrip("/\\"))
    destination = (dataset_root / rel).resolve()
    root_resolved = dataset_root.resolve()

    if root_resolved not in destination.parents and destination != root_resolved:
        return None

    return destination

# 
def _download_single_image(
    row: dict, 
    dataset_root: Path, 
    session: requests.Session, 
    timeout: int, 
    overwrite: bool
) -> tuple[str, str]:
    """Worker function to process a single row from the csv and download it."""
    image_url = (row.get("image_url") or "").strip()
    image_path = (row.get("image_path") or "").strip()

    if not image_url or not image_path:
        return "skip", f"missing image_url/image_path for {image_url}"

    destination = _safe_destination(dataset_root, image_path)
    if destination is None:
        return "fail", f"unsafe image_path '{image_path}'"

    destination.parent.mkdir(parents=True, exist_ok=True)

	# checks if the image already exists, so it can pick up where it left off
	# if script fails at any point
    if destination.exists() and not overwrite:
        return "skip", f"exists {destination.name}"

	# tries to download the image 3 times 
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = session.get(image_url, timeout=timeout)
            
            # Handle Pinterest Rate Limiting
            if response.status_code == 429:
                time.sleep(5) # Back off for 5 seconds
                continue
                
            response.raise_for_status()
            destination.write_bytes(response.content)
            return "ok", f"downloaded {destination.name}"
            
        except requests.exceptions.RequestException as exc:
            if attempt == max_retries - 1:
                return "fail", f"{image_url} -> {exc}"
            time.sleep(1) # Short pause before retry on general network drops
            
    return "fail", f"max retries exceeded for {image_url}"

# this is the dowloader
def download_from_metadata(
    csv_path: Path, 
    dataset_root: Path, 
    timeout: int = 20, 
    overwrite: bool = False, 
    max_workers: int = 20
) -> None:
    
    if not csv_path.exists():
        raise FileNotFoundError(f"metadata csv not found: {csv_path}")

    dataset_root.mkdir(parents=True, exist_ok=True)

    with open(csv_path, "r", newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    total = len(rows)
    results = {"ok": 0, "skip": 0, "fail": 0}

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

    print(f"Starting concurrent download of {total} images using {max_workers} workers...")
    
    # Process downloads 20 images at a time, to complete faster
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks to the pool
        futures = {
            executor.submit(_download_single_image, row, dataset_root, session, timeout, overwrite): row 
            for row in rows
        }
        
        processed = 0
        for future in as_completed(futures):
            processed += 1
            status, message = future.result()
            results[status] += 1
            
            # Print a clean progress line
            print(f"[{processed}/{total}] [{status.upper()}] {message}")

    print("\n" + "="*30)
    print("Download Complete")
    print("="*30)
    print(f" Total rows processed: {total}")
    print(f" Downloaded:           {results['ok']}")
    print(f" Skipped:              {results['skip']}")
    print(f" Failed:               {results['fail']}")
    print("="*30)


def main() -> None:
    here = Path(__file__).resolve().parent
    default_dataset_root = (here.parent / "dataset").resolve()
    default_csv = default_dataset_root / "metadata.csv"

    parser = argparse.ArgumentParser(description="Download images listed in metadata.csv concurrently")
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
    parser.add_argument("--workers", type=int, default=20, help="Number of concurrent download threads")
    
    args = parser.parse_args()

    download_from_metadata(
        args.csv_path.resolve(), 
        args.dataset_root.resolve(), 
        args.timeout, 
        args.overwrite,
        args.workers
    )


if __name__ == "__main__":
    main()