"""Verify landscape A4 EICR border, footer and Section K positioning."""
import sys
import fitz
MM = 72 / 25.4
doc = fitz.open(sys.argv[1])
assert len(doc) >= 7, "unexpectedly short EICR"
# Exact page placement and field semantics, checked on the actual generated PDF.
page3=doc[2].get_text()
page4=doc[3].get_text()
assert 'SECTION J: PARTICULARS OF INSTALLATION' in page3, 'Section J not on page 3'
assert 'SECTION K: OBSERVATIONS' not in page3, 'Section K leaked onto page 3'
assert 'SECTION K: OBSERVATIONS' in page4, 'Section K not on page 4'
assert 'SECTION J: PARTICULARS OF INSTALLATION' not in page4, 'Section J leaked onto page 4'
assert 'Earthelectroderesistance/impedance(Ohms)' in ''.join(page3.split()), 'Earth electrode field absent'
assert 'N/A =' not in page3 and 'N/A =' not in page4, 'Invalid electrode formatting'
for label in ('Item No.','Observations','Location','Classification code','Kitchen','Consumer unit'):
    assert label in page4,(label,'observation column/entry absent')
assert page4.index('Item No.') < page4.index('Observations') < page4.index('Location') < page4.index('Classification code'), 'Observation column order'
assert 'CONT-2026-123' in ''.join(p.get_text() for p in doc), 'Actual instrument serial missing'
assert 'AUGUSTINE SPERIN' in ''.join(p.get_text() for p in doc), 'Tester name not uppercase'
assert 'augustine sperin' not in ''.join(p.get_text() for p in doc), 'Lowercase tester name leaked'
# Section K footer text belongs at the bottom of page four, not on page five.
assert 'Outcomes: Acceptable condition' in page4, 'Capitalised outcomes legend missing from Section K'
assert 'C1, C2, C3 and FI coded inspection items are to be recorded in Section K.' in page4, 'Inspection code note missing from Section K'
page5=doc[4].get_text()
assert 'Outcomes: Acceptable condition' not in page5 and 'C1, C2, C3 and FI coded inspection items are to be recorded' not in page5, 'Section K legend remains incorrectly on page five'
def top_mm(page,phrase):
    matches=page.search_for(phrase)
    assert matches, (phrase,'not found')
    return matches[0].y0/MM
for legend in ('Outcomes: Acceptable condition','C1, C2, C3 and FI coded inspection items'):
    y=top_mm(doc[3],legend)
    assert 176 <= y <= 197, (legend,'not in Section K bottom strip',y)
for number,page in enumerate(doc,1):
    text=page.get_text()
    if 'SCHEDULE OF CIRCUIT DETAILS' in text:
        assert 'GENERIC SCHEDULE' not in text, ('Generic title still present',number)
        y=top_mm(page,'CODES FOR TYPES OF WIRING')
        assert 175<=y<=189, ('Wiring codes not near bottom',number,y)
        assert 'A Thermoplastic insulated/sheathed' in text and 'O Other' in text, ('Wiring-code definitions missing',number)
    if 'SCHEDULE OF TEST RESULTS' in text:
        assert 'GENERIC SCHEDULE' not in text, ('Generic test title still present',number)
        y=top_mm(page,'Details of test instruments used')
        assert 170<=y<=184, ('Instrument details not near bottom',number,y)
        sign=top_mm(page,'Tested by name (Capitals)')
        assert 188<=sign<=198, ('Tester signoff not near bottom',number,sign)

# Circuit Details and Test Results must have matching 3x3 metadata boxes,
# exactly aligned first-circuit rows and identical 9 mm row grids. This catches
# regressions that a generic A4 size check would miss.
pairs=[]
for i in range(len(doc)-1):
    if 'SCHEDULE OF CIRCUIT DETAILS' not in doc[i].get_text():
        continue
    assert 'SCHEDULE OF TEST RESULTS' in doc[i+1].get_text(), (
        i+1,'Circuit Details must be followed by its matching Test Results page'
    )
    details,results=doc[i],doc[i+1]
    def first_rect(page,term):
        matches=page.search_for(term)
        assert matches, (i+1,term,'heading not found')
        return matches[0]
    for term in ('DB/CU reference:', 'Location:', 'Supplied from:', 'Circuit number'):
        a,b=first_rect(details,term),first_rect(results,term)
        assert abs(a.x0-b.x0)<0.3*MM and abs(a.y0-b.y0)<0.3*MM,(
            i+1,term,'field/header misaligned',a,b
        )
    def row_grid(page):
        # These are the first 10 mm circuit-number column rectangles, not
        # the page border or the three large board-header cells.
        result=[]
        for drawing in page.get_drawings():
            r=drawing['rect']
            if (abs(r.x0/MM-10)<0.15 and abs(r.width/MM-10)<0.15
                and 85<=r.y0/MM<=174 and r.y1/MM<=178):
                result.append((r.y0,r.y1))
        return sorted(set((round(a,2),round(b,2)) for a,b in result))
    left,right=row_grid(details),row_grid(results)
    assert len(left)>=8 and left==right,(
        i+1,'Circuit number rows have different start positions/heights',left,right
    )
    # Ensure no overflow that sends the sign-off to a separate unframed page.
    assert 'CODES FOR TYPES OF WIRING' in details.get_text()
    assert 'Details of test instruments used' in results.get_text()
    assert 'Tested by name (Capitals)' in results.get_text()
    pairs.append(i+1)
assert pairs, 'No circuit/test schedule pairs found for alignment testing'

# Every page uses the same real-proportion logo in the top-left of the frame.
for page in doc:
    image_rects=[rect for img in page.get_images(full=True) for rect in page.get_image_rects(img[0])]
    assert image_rects, 'Logo image missing on a page'
    assert any(3.8 < rect.width/rect.height < 4.5
               and rect.x0 < 31*MM and rect.y0 < 14*MM for rect in image_rects), 'Logo stretched or not top-left'
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
