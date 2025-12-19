#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class MatchInfo:
    file_path: Path
    original_reference: str
    expected_webp: str


SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
}


REFERENCE_RE = re.compile(
    r"(?P<prefix>(?:\./|/)?)"
    r"(?P<path>"
    r"assets/images/"
    r"(?:(?P<photos>photos)/)?"
    r"(?P<name>[^/\"'\)\s\?]+)"
    r"\.(?P<ext>jpe?g|png)"
    r")"
    r"(?P<query>\?[^\"'\)\s<>]*)?",
    re.IGNORECASE,
)


def find_repo_root(start: Path) -> Path:
    current = start.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".git").exists():
            return candidate
    return start.resolve()


def decode_text(data: bytes) -> tuple[str, str]:
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return data.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace"), "utf-8"


def encode_text(text: str, encoding: str) -> bytes:
    if encoding == "utf-8-sig":
        return text.encode("utf-8-sig")
    return text.encode(encoding, errors="strict")


def iter_target_files(root: Path) -> list[Path]:
    targets: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
        for filename in filenames:
            suffix = Path(filename).suffix.lower()
            if suffix in {".html", ".css", ".js"}:
                targets.append(Path(dirpath) / filename)
    return targets


def retarget_text(
    text: str,
    file_path: Path,
    repo_root: Path,
    missing: set[MatchInfo],
) -> tuple[str, int]:
    replacements = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal replacements
        prefix = match.group("prefix") or ""
        name = match.group("name")
        query = match.group("query") or ""

        expected_rel = f"assets/images/web/{name}.webp"
        expected_fs = repo_root / expected_rel
        original_reference = f"{prefix}{match.group('path')}{query}"
        if not expected_fs.exists():
            missing.add(
                MatchInfo(
                    file_path=file_path,
                    original_reference=original_reference,
                    expected_webp=expected_rel,
                )
            )

        replacements += 1
        return f"{prefix}{expected_rel}{query}"

    new_text = REFERENCE_RE.sub(repl, text)
    return new_text, replacements


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Recursively scan the repository and rewrite image references from "
            "assets/images[/photos]/<name>.(jpg|jpeg|png) to assets/images/web/<name>.webp "
            "in .html, .css, and .js files."
        )
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print a summary but do not write any changes.",
    )
    args = parser.parse_args(argv)

    repo_root = find_repo_root(Path(__file__).parent)
    targets = iter_target_files(repo_root)

    per_file_counts: dict[Path, int] = {}
    total_replacements = 0
    missing: set[MatchInfo] = set()

    for path in targets:
        data = path.read_bytes()
        text, encoding = decode_text(data)

        new_text, replacements = retarget_text(
            text=text,
            file_path=path,
            repo_root=repo_root,
            missing=missing,
        )
        if replacements <= 0:
            continue

        per_file_counts[path] = replacements
        total_replacements += replacements

        if not args.dry_run and new_text != text:
            path.write_bytes(encode_text(new_text, encoding))

    if args.dry_run:
        print("DRY RUN: no files written.\n")

    if per_file_counts:
        print("Replacements per file:")
        for path in sorted(per_file_counts, key=lambda p: str(p).lower()):
            rel = path.relative_to(repo_root)
            print(f"  {rel}: {per_file_counts[path]}")
        print()

    print(f"Total replacements: {total_replacements}")

    if missing:
        print("\nMissing expected WebP files (reference found, but file does not exist):")
        for item in sorted(
            missing,
            key=lambda m: (str(m.file_path).lower(), m.original_reference.lower()),
        ):
            rel_file = item.file_path.relative_to(repo_root)
            print(f"  {rel_file}: {item.original_reference} -> {item.expected_webp}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
