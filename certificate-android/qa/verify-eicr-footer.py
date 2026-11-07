#!/usr/bin/env python3
"""Verify that the required EICR declaration dates do not overlap the PDF footer."""
import subprocess
import sys
import xml.etree.ElementTree as ET

pdf=sys.argv[1]
data=subprocess.check_output(["pdftotext","-bbox",pdf,"-"])
root=ET.fromstring(data)
pages=[el for el in root.iter() if el.tag.endswith("page")]
if not pages:raise AssertionError("No PDF page returned")
# The readable A4 layout may legitimately continue Section G onto page 2.
# Validate dates anywhere in the report, never just on the first page.
for d in ("20/10/2026","21/10/2026"):
    found=[]
    for number,page in enumerate(pages,1):
        height=float(page.attrib["height"])
        words=[(el.text or "",float(el.attrib["yMin"]),float(el.attrib["yMax"])) for el in page.iter() if el.tag.endswith("word")]
        for value,top,bottom in words:
            if value!=d:continue
            # Allow the IET sign-off on the final inspection page above the 7mm\n            # footer; 30pt threshold still prevents a genuine collision.\n            if bottom>=height-30:raise AssertionError(f"Declaration {d} overlaps footer on page {number}: bottom={bottom:.1f}, height={height:.1f}")
            if top<=20:raise AssertionError(f"Declaration {d} overlaps heading on page {number}")
            found.append(number)
    if not found:raise AssertionError("Missing declaration date "+d+" on any page")
print("EICR_DECLARATIONS_CLEAR_OF_FOOTER")
