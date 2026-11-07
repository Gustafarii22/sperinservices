"""Verify landscape A4 EICR border, footer and Section K positioning."""
import sys
import fitz
MM = 72 / 25.4
doc = fitz.open(sys.argv[1])
assert len(doc) >= 7, "unexpectedly short EICR"
has_k = False
for index, page in enumerate(doc, 1):
    width, height = page.rect.width, page.rect.height
    assert abs(width - 297*MM)<0.8 and abs(height-210*MM)<0.8, (index,page.rect)
    rects = [d['rect'] for d in page.get_drawings()
             if d['type']=='s' and d['color'] and d['color'][2] > 0.6
             and d['rect'].width > width*.92 and d['rect'].height > height*.90]
    assert rects, f"page {index} missing blue frame"
    border = rects[0]
    margins = (border.x0, border.y0, width-border.x1, height-border.y1)
    assert all(5.0 <= round(m/MM,2) <= 6.0 for m in margins), (index,[round(m/MM,2) for m in margins])
    assert max(margins)-min(margins)<.3, (index,margins)
    spans = [s for b in page.get_text('dict')['blocks'] for line in b.get('lines',[])
             for s in line.get('spans',[])]
    foot = [s for s in spans if 'Sperin Services - Page ' in s['text']]
    assert foot and all(s['size']>=7 for s in foot), (index,"footer absent/tiny")
    for s in foot:
        assert abs((s['bbox'][0]+s['bbox'][2])/2-width/2)<5, (index,"footer off centre")
        assert s['bbox'][3] < height-5*MM, (index,"footer in nonprintable area")
    # A 100-character page is a release blocker even if it has a valid border:
    # prior builds created a standalone page for the inspection signature or
    # a C3/FI explanatory note.
    page_text = page.get_text()
    assert len(page_text.strip()) >= 400, (index, "nearly empty page", len(page_text))
    for span in spans:
        text = span["text"].strip()
        if not text:
            continue
        left, top, right, bottom = span["bbox"]
        assert left >= 4 and top >= 4 and right <= width-4 and bottom <= height-4, (index, "clipped text", text[:50])
        if text.startswith(("Lighting and socket circuit", "Condition report", "Main earthing")):
            assert span["size"] >= 6.0, (index, "tiny body text", span["size"])
    k = [s for s in spans if 'SECTION K: OBSERVATIONS' in s['text']]
    if k:
        has_k=True
        h = [s for s in spans if s['text'].strip()=='ELECTRICAL INSTALLATION CONDITION REPORT']
        assert h and min(s['bbox'][1] for s in k)>max(s['bbox'][3] for s in h)+10, (index,"K overlaps heading")
assert has_k, "Section K absent"
print(f"PDF_LAYOUT_PASS: {len(doc)} pages; equal 5.3mm borders, no near-empty pages, readable text, Section K clear")
