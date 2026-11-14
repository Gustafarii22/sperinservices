#!/usr/bin/env python3
"""Check that BS 7671 Minor Works A4 sections do not collide visually.

Uses pdftotext -bbox from the installed Poppler package. This catches the
previously missed collision between the bottom lines of Sections A/B/C and
their following section headings; pure text extraction tests missed it.
"""
import subprocess
import sys
import xml.etree.ElementTree as ET

if len(sys.argv) != 2:
    raise SystemExit("Usage: check-minor-layout.py minor-certificate.pdf")
raw = subprocess.check_output(["pdftotext", "-bbox-layout", "-f", "1", "-l", "1", sys.argv[1], "-"])
root = ET.fromstring(raw)
ns = {"x": "http://www.w3.org/1999/xhtml"}
words = []
for item in root.findall(".//x:word", ns):
    if item.text is not None:
        words.append((item.text.strip(), float(item.get("yMin")), float(item.get("yMax"))))
sections = sorted((ymin for word, ymin, _ in words if word == "SECTION"))
if len(sections) < 5:
    raise AssertionError("Expected Sections A–E on first printed Minor Works page")

# Require a legible breathing space between a final printed row and the next
# section header; even a 1 pt gap can conceal collisions with the box lines.
checks = [
    ("Comments", 1, 10.0),
    ("Water", 2, 10.0),
    ("AFDD", 3, 10.0),
]
for label, section_index, minimum_gap in checks:
    matches = [(ymin, ymax) for word, ymin, ymax in words
               if word == label and ymin < sections[section_index]]
    if not matches:
        raise AssertionError("Minor Works required item not printed: " + label)
    last = max(ymax for _, ymax in matches)
    gap = sections[section_index] - last
    if gap < minimum_gap:
        raise AssertionError(
            f"Minor Works printed overlap/insufficient space: {label} to "
            f"Section {chr(65 + section_index)} = {gap:.1f} pt "
            f"(minimum {minimum_gap:.1f} pt)")
print("MINOR_WORKS_PRINT_SPACING_PASS")
