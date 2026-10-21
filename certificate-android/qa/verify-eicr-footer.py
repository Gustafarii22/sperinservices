#!/usr/bin/env python3
"""Verify that the required EICR declaration dates do not overlap the PDF footer."""
import subprocess
import sys
import xml.etree.ElementTree as ET

pdf=sys.argv[1]
data=subprocess.check_output(["pdftotext","-f","1","-l","1","-bbox",pdf,"-"])
root=ET.fromstring(data)
pages=[el for el in root.iter() if el.tag.endswith("page")]
if not pages:raise AssertionError("No PDF page returned")
page=pages[0]
height=float(page.attrib["height"])
words=[(el.text or "",float(el.attrib["yMin"]),float(el.attrib["yMax"])) for el in page.iter() if el.tag.endswith("word")]
for d in ("20/10/2026","21/10/2026"):
 matches=[w for w in words if w[0]==d]
 if not matches:raise AssertionError("Missing declaration date "+d)
 for _,top,bottom in matches:
  if bottom >= height-48:
   raise AssertionError(f"Declaration {d} overlaps the page footer: bottom={bottom:.1f}, height={height:.1f}")
print("EICR_DECLARATIONS_CLEAR_OF_FOOTER")
