(() => {
  'use strict';

  const NAVY=[7,17,31], BLUE=[24,105,211], PALE=[240,246,253], INK=[22,28,36], GREY=[78,88,101], LINE=[55,61,69];
  let BRAND='Sperin Services';
  const DEFAULT_BLUE=[24,105,211];

  function v(cert,key,worksheet=false,keep=false){
    if(worksheet && !keep) return '';
    const value=cert?.fields?.[key];
    if(value===undefined||value===null) return '';
    return String(value);
  }
  function val(value,worksheet=false,keep=false){
    if(worksheet && !keep) return '';
    if(value===undefined||value===null) return '';
    return String(value);
  }
  function fmtDate(value){
    if(!value) return '';
    const d=new Date(String(value)+(String(value).length===10?'T12:00:00':''));
    return Number.isNaN(d.getTime())?String(value):d.toLocaleDateString('en-GB');
  }
  function yes(value,choice){
    const a=String(value||'').toLowerCase(),b=String(choice||'').toLowerCase();
    return a===b || (choice==='✓'&&['yes','pass','satisfactory','true','✓'].includes(a));
  }
  function pdfText(value){
    return String(value??'')
      .replaceAll('✓','X')
      .replaceAll('✕','X')
      .replaceAll('Ω',' Ohms')
      .replaceAll('²','2')
      .replaceAll('Δ','delta')
      .replaceAll('·',' - ')
      .replace(/[–—]/g,'-');
  }
  function clip(doc,text,w,fontSize=7){
    doc.setFontSize(fontSize);
    const lines=doc.splitTextToSize(pdfText(text),Math.max(5,w));
    return lines;
  }
  function write(doc,text,x,y,w,opts={}){
    const size=opts.size||7,lh=opts.lineHeight||size*0.42+1.5;
    doc.setFont('helvetica',opts.bold?'bold':'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color||INK));
    const lines=clip(doc,text,w,size).slice(0,opts.maxLines||99);
    lines.forEach((line,i)=>doc.text(line,x,y+i*lh,opts.align?{align:opts.align}:undefined));
    return y+Math.max(1,lines.length)*lh;
  }
  // Mixed-weight inline printing, wrapped within its designated PDF cell.
  // Write labels in bold and saved answers in normal weight without changing
  // certificate data or relying on fake bold spaces in a single AutoTable cell.
  function writeRuns(doc,runs,x,y,w,size=7.2,lineHeight=4.2,maxLines=3){
    let xx=x, yy=y, lines=1;
    const right=x+w;
    for(const run of runs){
      const src=pdfText(run.text??'');
      if(!src)continue;
      doc.setFont('helvetica',run.bold?'bold':'normal');
      doc.setFontSize(size);doc.setTextColor(...INK);
      const segments=[src];
      // Preserve a complete label as one PDF text run where it fits.
      if(doc.getTextWidth(src)>right-xx)segments.splice(0,1,...src.split(/(?<=\\s)/));
      for(let part of segments){
        if(!part)continue;
        let width=doc.getTextWidth(part);
        if(xx+width>right && xx>x+.01 && part.trim()){
          if(lines>=maxLines)return yy;
          xx=x;yy+=lineHeight;lines++;
        }
        if(xx===x&&!part.trim())continue;
        width=doc.getTextWidth(part);
        if(width>right-xx){
          const clipped=doc.splitTextToSize(part,Math.max(2,right-xx))[0]||'';
          part=clipped;width=doc.getTextWidth(part);
        }
        if(part){doc.text(part,xx,yy);xx+=width;}
      }
    }
    return yy;
  }
  function checkbox(doc,x,y,checked=false,label='',opts={}){
    const s=opts.size||3.2;
    doc.setDrawColor(...LINE);doc.setLineWidth(.18);doc.rect(x,y-s+0.2,s,s);
    if(checked){
      doc.setDrawColor(...BLUE);doc.setLineWidth(.55);
      doc.line(x+.55,y-1.0,x+1.25,y-.3);doc.line(x+1.25,y-.3,x+2.7,y-2.1);
      doc.setLineWidth(.18);
    }
    if(label) write(doc,label,x+s+1.4,y,opts.labelWidth||35,{size:opts.fontSize||6.6});
  }
  function dotted(doc,x1,y,x2){
    doc.setDrawColor(...LINE);doc.setLineWidth(.12);doc.setLineDashPattern([.45,.45],0);doc.line(x1,y,x2,y);doc.setLineDashPattern([],0);
  }
  function choiceLine(doc,label,choices,value,worksheet,x,y,w,opts={}){
    const labelW=opts.labelW||30;
    write(doc,label,x,y,labelW-1,{size:opts.size||6.1,bold:true,maxLines:2});
    let cx=x+labelW;
    const available=Math.max(20,w-labelW);
    const step=available/Math.max(1,choices.length);
    choices.forEach((choice,idx)=>{
      checkbox(doc,cx,y,!worksheet&&String(value||'')===String(choice),pdfText(choice),{
        size:opts.boxSize||3,
        fontSize:opts.optionSize||5.5,
        labelWidth:Math.max(10,step-4)
      });
      cx+=step;
    });
  }
  function pageFrame(doc,title,number,standard){
    const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
    // The owner's HP M281fdw has 5 mm non-printable margins on every side.
    // Keep the frame a fraction inside this limit, centred on the original
    // ISO A4 media box. Android must print the original vector PDF at 100%.
    const edge=5.3;
    doc.setDrawColor(...BLUE);doc.setLineWidth(.55);doc.rect(edge,edge,w-2*edge,h-2*edge);
    // Equal-width frame on all four edges; no asymmetric heavy left bar.
    // Proportional, left-aligned logo inside the blue frame: never stretch a raster.
    let brandX=10;
    if(doc.__sperinLogo){
      try{
        const logo=doc.__sperinLogo, p=doc.getImageProperties(logo.data);
        const maxW=20,maxH=8.1, scale=Math.min(maxW/p.width,maxH/p.height);
        const logoW=p.width*scale,logoH=p.height*scale;
        doc.addImage(logo.data,logo.format,9.0+(maxW-logoW)/2,5.7+(maxH-logoH)/2,logoW,logoH,undefined,'FAST');
        brandX=31.5;
      }catch(err){console.warn('Unable to embed customer report logo',err);}
    }
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...NAVY);doc.text(BRAND.toUpperCase(),brandX,9.4);
    doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(...GREY);doc.text('ELECTRICAL CERTIFICATION',brandX,12.8);
    doc.setDrawColor(...BLUE);doc.setLineWidth(.25);doc.line(10,14,w-10,14);
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...INK);doc.text(String(title||''),10,20);
    const reportOnly=/^(?:ELECTRICAL INSTALLATION CONDITION REPORT|CONDITION REPORT SCHEDULE OF INSPECTION|CONDITION REPORT -)/.test(String(title||''));
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.text((number?(reportOnly?'Report No.: ':'Certificate/Report No.: ')+number:'')+(standard?'   ·   '+standard:''),w-10,20,{align:'right'});
    doc.setDrawColor(...LINE);doc.setLineWidth(.16);
    return 24;
  }
  function footer(doc,page,total){
    const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
    doc.setFont('helvetica','normal');doc.setFontSize(5.2);doc.setTextColor(...GREY);
    if(doc.__sperinWorksheet){
      doc.setTextColor(...BLUE);doc.setFont('helvetica','bold');doc.setFontSize(5.4);
      doc.text('MULTIPLE CHOICE: MARK ONE BOX WITH X. DO NOT CIRCLE OR CROSS OUT THE OTHER OPTIONS.',w/2,h-10,{align:'center'});
      if(doc.__sperinSheetId){
        doc.setFont('helvetica','normal');doc.setFontSize(4.6);doc.setTextColor(...GREY);
        doc.text('SPERIN SHEET '+doc.__sperinSheetId+' PAGE '+page,w-10,h-7,{align:'right'});
      }
    }
    // Footer stays within the printable edge but is legible on physical A4.
    doc.setFont('helvetica','bold');doc.setFontSize(7.2);doc.setTextColor(...NAVY);
    doc.text(BRAND+' - Page '+page+' of '+total,w/2,h-7.2,{align:'center'});
  }
  function box(doc,x,y,w,h,title,opts={}){
    doc.setDrawColor(...LINE);doc.setLineWidth(.16);doc.rect(x,y,w,h);
    let top=y;
    if(title){
      const hh=opts.titleH||7;
      doc.setFillColor(...(opts.titleFill||PALE));doc.rect(x,y,w,hh,'F');
      doc.setDrawColor(...LINE);doc.line(x,y+hh,x+w,y+hh);
      write(doc,String(title).toUpperCase(),x+2,y+4.8,w-4,{size:opts.titleSize||7.2,bold:true});
      top=y+hh;
    }
    return top;
  }
  function labelValue(doc,label,value,x,y,w,opts={}){
    const labelW=opts.labelW||Math.min(w*.42,48);
    if(doc.__editRegions&&opts.edit)doc.__editRegions.push({...opts.edit,page:doc.internal.getCurrentPageInfo().pageNumber,x:x+labelW,y:y-3,width:w-labelW,height:5});
    write(doc,label,x,y,w,{size:opts.size||6.4,bold:opts.boldLabel!==false,maxLines:opts.maxLabelLines||2});
    if(opts.checkboxChoices){
      let cx=x+labelW;
      opts.checkboxChoices.forEach(c=>{
        checkbox(doc,cx,y,yes(value,c),c,{fontSize:opts.size||6.2,labelWidth:opts.choiceWidth||24});
        cx+=opts.choiceStep||32;
      });
      return;
    }
    const display=opts.date?fmtDate(value):String(value||'');
    if(display) write(doc,display,x+labelW,y,w-labelW,{size:opts.valueSize||6.5,maxLines:opts.maxLines||2,color:opts.valueColor||INK});
    else dotted(doc,x+labelW,y+.8,x+w-1);
  }
  function multilineValue(doc,label,value,x,y,w,h,opts={}){
    write(doc,label,x+1.5,y+4,w-3,{size:opts.labelSize||6.5,bold:true});
    if(value) write(doc,value,x+1.5,y+9,w-3,{size:opts.valueSize||6.4,lineHeight:3,maxLines:Math.max(1,Math.floor((h-10)/3))});
    else{
      for(let yy=y+11;yy<y+h-2;yy+=5)dotted(doc,x+2,yy,x+w-2);
    }
  }
  function brandOnlyPage(doc,title,number,standard,orientation='portrait'){
    if(doc.getNumberOfPages()===0) doc.addPage('a4',orientation);
    else doc.addPage('a4',orientation);
    return pageFrame(doc,title,number,standard);
  }
  function signatory(cert,role){
    const f=cert.fields||{};
    // The 'constructor' field must be an OWN user string, never Object.prototype.constructor.
    const constructorName=Object.hasOwn(f,'constructor')&&typeof f.constructor==='string'?f.constructor:'';
    const single=String(f.signatoryMode||'').startsWith('One person');
    if(single){
      return {
        name:f.singleSignatoryName||f.inspector||f.designer1||constructorName||'',
        company:f.singleSignatoryCompany||f.inspectorCompany||f.designerCompany||f.constructorCompany||'',
        address:f.singleSignatoryAddress||f.inspectorAddress||f.designerAddress||f.constructorAddress||'',
        postcode:f.singleSignatoryPostcode||f.inspectorPostcode||f.designerPostcode||f.constructorPostcode||'',
        phone:f.singleSignatoryPhone||f.inspectorPhone||f.designerPhone||f.constructorPhone||'',
        signature:f.singleSignatorySignature||f.inspectorSignature||f.designer1Signature||f.constructorSignature||'',
        date:f.singleSignatoryDate||f.inspectionDate||f.designer1Date||f.constructorDate||''
      };
    }
    if(role==='designer')return {name:f.designer1||'',company:f.designerCompany||'',address:f.designerAddress||'',postcode:f.designerPostcode||'',phone:f.designerPhone||'',signature:f.designer1Signature||'',date:f.designer1Date||''};
    if(role==='designer2')return {name:f.designer2||'',company:f.designer2Company||'',address:f.designer2Address||'',postcode:f.designer2Postcode||'',phone:f.designer2Phone||'',signature:f.designer2Signature||'',date:f.designer2Date||''};
    if(role==='constructor')return {name:constructorName,company:f.constructorCompany||'',address:f.constructorAddress||'',postcode:f.constructorPostcode||'',phone:f.constructorPhone||'',signature:f.constructorSignature||'',date:f.constructorDate||''};
    return {name:f.inspector||'',company:f.inspectorCompany||'',address:f.inspectorAddress||'',postcode:f.inspectorPostcode||'',phone:f.inspectorPhone||'',signature:f.inspectorSignature||'',date:f.inspectionDate||''};
  }
  function display(value,worksheet,keep=false){return worksheet&&!keep?'':String(value??'');}
  function safeRows(rows){return Array.isArray(rows)?rows:[];}
  function normaliseBoardRef(value){
    return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  }
  function boardRows(cert){
    const source=safeRows(cert.tables?.boards);
    const boards=source.map((row,index)=>index===0?{
      ...row,
      location:row.location||cert.fields?.dbLocation||'',
      suppliedFrom:row.suppliedFrom||cert.fields?.suppliedFrom||'',
      spd:row.spd||cert.fields?.dbSpd||'',
      zdb:row.zdb||cert.fields?.zdb||'',
      ipf:row.ipf||cert.fields?.dbIpf||'',
      polarity:row.polarity||cert.fields?.dbPolarity||'',
      phaseSequence:row.phaseSequence||cert.fields?.phaseSequence||'',
      spdOperational:row.spdOperational||cert.fields?.spdOperational||''
    }:{...row});
    if(!boards.length && !cert.boardWorkflowVersion){
      boards.push({
        ref:cert.fields?.dbReference||'DB1',
        location:cert.fields?.dbLocation||'',
        suppliedFrom:cert.fields?.suppliedFrom||'',
        mainSwitch:cert.fields?.distributionOcpd||'',
        rcd:cert.fields?.dbRcd||'',
        spd:cert.fields?.dbSpd||'',
        zdb:cert.fields?.zdb||'',
        ipf:cert.fields?.dbIpf||''
      });
    }
    const known=new Set(boards.map(row=>normaliseBoardRef(row.ref)).filter(Boolean));
    const circuits=safeRows(cert.tables?.circuits),tests=safeRows(cert.tables?.tests);
    const total=Math.max(circuits.length,tests.length);
    for(let i=0;i<total;i++){
      const ref=String(circuits[i]?.boardRef||tests[i]?.boardRef||'').trim();
      const key=normaliseBoardRef(ref);
      if(ref&&key&&!known.has(key)){
        boards.push({ref,location:'',suppliedFrom:'',mainSwitch:'',rcd:'',spd:'',zdb:'',ipf:''});
        known.add(key);
      }
    }
    return boards;
  }
  function circuitsForBoard(cert,boardRef,includeUnassigned=false){
    const circuits=safeRows(cert.tables?.circuits),tests=safeRows(cert.tables?.tests);
    const list=[],target=normaliseBoardRef(boardRef||'DB1');
    const total=Math.max(circuits.length,tests.length);
    for(let i=0;i<total;i++){
      const detail=circuits[i]||{},test=tests[i]||{};
      const ref=detail.boardRef||test.boardRef||'';
      const key=normaliseBoardRef(ref);
      if(key===target||(includeUnassigned&&!key)){
        list.push({detail,test,index:i});
      }
    }
    return list.sort((a,b)=>String(a.detail.circuitNo??a.test.circuitNo??'').localeCompare(String(b.detail.circuitNo??b.test.circuitNo??''),undefined,{numeric:true}));
  }
  function wiringCode(value){
    const t=String(value||'').trim();
    const m=t.match(/^([A-HO])\b/i);if(m)return m[1].toUpperCase();
    if(/twin|thermoplastic insulated|sheathed/i.test(t))return 'A';
    return t;
  }
  function drawPageFooterAll(doc){
    const n=doc.getNumberOfPages();
    for(let i=1;i<=n;i++){doc.setPage(i);footer(doc,i,n);}
  }

  function renderEic(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet,f=cert.fields||{};
    const frame=()=>pageFrame(doc,'ELECTRICAL INSTALLATION CERTIFICATE',display(cert.number,worksheet,true),schema.standard);
    doc.setPage(1);
    let y=frame();
    const W=doc.internal.pageSize.getWidth(),x=10,w=W-20;
    const addLandscapePage=()=>{doc.addPage('a4','landscape');y=frame();};

    const sectionTable=(title,body,columnStyles,extra={})=>{
      doc.autoTable({
        startY:y,
        head:[[{content:title,colSpan:extra.colSpan||Object.keys(columnStyles).length,styles:{fontStyle:'bold',fontSize:7.1,fillColor:PALE,textColor:INK}}]],
        body,
        margin:{left:x,right:10,top:27,bottom:14},
        tableWidth:w,
        theme:'grid',
        pageBreak:'avoid',
        rowPageBreak:'avoid',
        styles:{fontSize:5.9,cellPadding:.9,minCellHeight:5.5,lineColor:LINE,lineWidth:.12,textColor:INK,valign:'middle',overflow:'linebreak'},
        headStyles:{fillColor:PALE,textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
        columnStyles,
        didDrawPage:()=>frame(),
        ...extra.auto
      });
      y=doc.lastAutoTable.finalY+2;
    };
    const pairRows=(rows)=>rows.map(([a,b,c,d])=>[
      {content:pdfText(a),styles:{fontStyle:'bold'}},worksheet?'':pdfText(b),
      {content:pdfText(c||''),styles:{fontStyle:'bold'}},worksheet?'':pdfText(d||'')
    ]);

    sectionTable('SECTION A: DETAILS OF THE CLIENT',[
      [{content:'Client / person ordering the work',styles:{fontStyle:'bold'}},display(f.clientName,worksheet)],
      [{content:'Client address',styles:{fontStyle:'bold'}},display(f.clientAddress,worksheet)],
      [{content:'Client postcode',styles:{fontStyle:'bold'}},display(f.clientPostcode,worksheet)]
    ],{0:{cellWidth:58},1:{cellWidth:w-58}},{colSpan:2});

    sectionTable('SECTION B: INSTALLATION DETAILS',[
      [{content:'Installation address',styles:{fontStyle:'bold'}},display(f.installationAddress,worksheet)],
      [{content:'Installation postcode',styles:{fontStyle:'bold'}},display(f.installationPostcode,worksheet)],
      [{content:'Description of installation',styles:{fontStyle:'bold'}},display(f.description,worksheet)],
      [{content:'Extent of installation covered by this Certificate',styles:{fontStyle:'bold'}},display(f.extent,worksheet)],
      [{content:'Type of work',styles:{fontStyle:'bold'}},display(f.workType,worksheet)]
    ],{0:{cellWidth:58},1:{cellWidth:w-58}},{colSpan:2});

    const d=signatory(cert,'designer'),c=signatory(cert,'constructor'),i=signatory(cert,'inspector');
    const declarationDesign='I/We certify that the design work described above has been carried out with reasonable skill and care and, except for any departures recorded below, is in accordance with BS 7671:2018 as amended.';
    const declarationConstruction='I certify that the construction work described above has been carried out with reasonable skill and care and, except for any departures recorded below, is in accordance with BS 7671:2018 as amended.';
    const declarationInspection='I certify that the inspection and testing described above has been carried out with reasonable skill and care and, except for any departures recorded below, is in accordance with BS 7671:2018 as amended.';
    const sigCells=(party)=>[
      {content:'Signature\n'+display(party.signature,worksheet),styles:{fontStyle:'bold'}},
      {content:'Date\n'+(worksheet?'':fmtDate(party.date)),styles:{fontStyle:'bold'}},
      {content:'Name (IN BLOCK CAPITALS)\n'+display(party.name,worksheet),styles:{fontStyle:'bold'}}
    ];
    const cBody=[
      [{content:'FOR DESIGN',colSpan:3,styles:{fontStyle:'bold',fillColor:[248,250,253]}}],
      [{content:declarationDesign,colSpan:3}],
      [{content:'Details of departures from BS 7671',styles:{fontStyle:'bold'}},{content:display(f.designDepartures,worksheet)||(!worksheet?'None':''),colSpan:2}],
      [{content:'Permitted exceptions / risk assessment',styles:{fontStyle:'bold'}},{content:display(f.permittedExceptions,worksheet)||(!worksheet?'N/A':''),colSpan:2}],
      [{content:'Risk assessment attached',styles:{fontStyle:'bold'}},{content:display(f.riskAssessmentAttached,worksheet),colSpan:2}],
      sigCells(d),
      ...(f.designer2||f.designer2Signature?[sigCells(signatory(cert,'designer2'))]:[]),
      [{content:'FOR CONSTRUCTION',colSpan:3,styles:{fontStyle:'bold',fillColor:[248,250,253]}}],
      [{content:declarationConstruction,colSpan:3}],
      [{content:'Details of departures from BS 7671',styles:{fontStyle:'bold'}},{content:display(f.constructionDepartures,worksheet)||(!worksheet?'None':''),colSpan:2}],
      sigCells(c),
      [{content:'FOR INSPECTION AND TESTING',colSpan:3,styles:{fontStyle:'bold',fillColor:[248,250,253]}}],
      [{content:declarationInspection,colSpan:3}],
      [{content:'Details of departures from BS 7671',styles:{fontStyle:'bold'}},{content:display(f.inspectionDepartures,worksheet)||(!worksheet?'None':''),colSpan:2}],
      sigCells(i)
    ];
    sectionTable('SECTION C: CERTIFICATION SIGNATORIES',cBody,{0:{cellWidth:92},1:{cellWidth:45},2:{cellWidth:w-137}},{colSpan:3});

    addLandscapePage();
    sectionTable('SECTION D: NEXT INSPECTION',[
      [{content:'Recommended interval before further inspection and testing',styles:{fontStyle:'bold'}},display(f.nextInspectionInterval,worksheet)]
    ],{0:{cellWidth:78},1:{cellWidth:w-78}},{colSpan:2});

    const parties=[['Designer (No 1)',d],...(f.designer2||f.designer2Signature?[['Designer (No 2)',signatory(cert,'designer2')]]:[]),['Constructor',c],['Inspector',i]];
    sectionTable('SECTION E: PARTICULARS OF SIGNATORIES IN SECTION C',
      parties.map(([role,p])=>[
        {content:role,styles:{fontStyle:'bold'}},
        display(p.name,worksheet),
        display(p.company,worksheet),
        display(p.address,worksheet),
        display(p.postcode,worksheet),
        display(p.phone,worksheet)
      ]),
      {0:{cellWidth:27},1:{cellWidth:42},2:{cellWidth:42},3:{cellWidth:96},4:{cellWidth:25},5:{cellWidth:45}},
      {colSpan:6,auto:{head:[[{content:'SECTION E: PARTICULARS OF SIGNATORIES IN SECTION C',colSpan:6,styles:{fontStyle:'bold',fontSize:7.1,fillColor:PALE,textColor:INK}}],
                         ['Role','Name','For/on behalf of','Address','Postcode','Tel.']]}}
    );

    sectionTable('SECTION F: SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS',pairRows([
      ['Earthing arrangement',f.earthingArrangement,'Supply',f.supplyACDC],
      ['Number/type of live conductors',f.liveConductors,'Nominal voltage U/U0 (V)',f.nominalVoltage],
      ['Nominal frequency (Hz)',f.frequency,'Prospective fault current Ipf (kA)',f.ipf],
      ['External earth fault loop impedance Ze (Ohms)',f.ze,'Supply protective device BS (EN)',f.supplyDeviceBs],
      ['Supply protective device type',f.supplyDeviceType,'Rated current (A)',f.supplyDeviceRating],
      ['Breaking capacity (kA)',f.supplyBreakingCapacity,'Supply polarity confirmed',f.supplyPolarity],
      ['Other sources of supply',f.otherSources,'','']
    ]),{0:{cellWidth:47},1:{cellWidth:(w-94)/2},2:{cellWidth:47},3:{cellWidth:(w-94)/2}},{colSpan:4});

    sectionTable('SECTION G: PARTICULARS OF INSTALLATION REFERRED TO IN THE CERTIFICATE',pairRows([
      ['Means of earthing',f.meansOfEarthing,'Maximum demand',[f.maximumDemand,f.maximumDemandUnit].filter(Boolean).join(' ')],
      ['Earth electrode type',f.earthElectrodeType,'Earth electrode location',f.earthElectrodeLocation],
      ['RA/Ze (Ohms)',f.earthElectrodeResistance,'Earthing conductor material',f.earthingConductorMaterial],
      ['Earthing conductor csa mm2',f.earthingConductorCsa,'Earthing continuity verified',f.earthingContinuity],
      ['Bonding conductor material',f.bondingMaterial,'Bonding conductor csa mm2',f.bondingCsa],
      ['Bonding continuity verified',f.bondingContinuity,'Main protective bonding to',f.bondingTo],
      ['Main switch location',f.mainSwitchLocation,'Main switch BS (EN)',f.mainSwitchBs],
      ['Main switch poles / current / voltage',[f.mainSwitchPoles&&f.mainSwitchPoles+' pole',f.mainSwitchCurrent&&f.mainSwitchCurrent+' A',f.mainSwitchVoltage&&f.mainSwitchVoltage+' V'].filter(Boolean).join(' / '),'Main switch OCPD type/setting',f.mainSwitchDeviceType],
      ['Main switch breaking capacity (kA)',f.mainSwitchBreaking,'Main RCD type / mA / delay',[f.mainRcdType,f.mainRcdIdn&&f.mainRcdIdn+' mA',f.mainRcdDelay&&f.mainRcdDelay+' ms'].filter(Boolean).join(' / ')],
      ['Main switch OCPD rating/setting (A)',f.mainSwitchDeviceSetting,'Main RCD measured operating time (ms)',f.mainRcdTime],
      ['Main RCD breaking capacity (kA)',f.mainRcdBreaking,'','']
    ]),{0:{cellWidth:47},1:{cellWidth:(w-94)/2},2:{cellWidth:47},3:{cellWidth:(w-94)/2}},{colSpan:4});

    addLandscapePage();
    const inspectionRows=safeRows(cert.tables?.eicInspection);
    const outcomeText=(value)=>{
      const raw=String(value||'').trim();
      if(worksheet)return '';
      if(yes(raw,'✓')||['yes','pass','satisfactory','true'].includes(raw.toLowerCase()))return '';
      if(/^n\/?a$/i.test(raw)||/^not applicable$/i.test(raw))return 'N/A';
      if(raw==='✕'||/^no$|^fail$/i.test(raw))return 'NOT SAT.';
      return pdfText(raw);
    };
    doc.autoTable({
      startY:y,
      head:[
        [{content:'SECTION H: SCHEDULE OF INSPECTIONS',colSpan:3,styles:{fontStyle:'bold',fontSize:7.1,fillColor:PALE,textColor:INK}}],
        ['Item No.','Description','Outcome']
      ],
      body:inspectionRows.map(r=>[pdfText(r.item||''),pdfText(r.description||''),outcomeText(r.outcome)]),
      margin:{left:x,right:10,top:27,bottom:14},
      tableWidth:w,
      theme:'grid',
      rowPageBreak:'avoid',
      styles:{fontSize:5.8,cellPadding:1.05,minCellHeight:6.4,lineColor:LINE,lineWidth:.12,textColor:INK,valign:'middle'},
      headStyles:{fillColor:[255,255,255],textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
      columnStyles:{0:{cellWidth:18},1:{cellWidth:w-43},2:{cellWidth:25,halign:'center'}},
      didDrawPage:()=>frame(),
      didDrawCell:(data)=>{
        if(worksheet||data.section!=='body'||data.column.index!==2)return;
        const raw=String(inspectionRows[data.row.index]?.outcome||'').trim();
        if(!(yes(raw,'✓')||['yes','pass','satisfactory','true'].includes(raw.toLowerCase())))return;
        const cell=data.cell,s=3.4,cx=cell.x+cell.width/2-s/2,cy=cell.y+cell.height/2+s/2;
        doc.setDrawColor(...LINE);doc.setLineWidth(.18);doc.rect(cx,cy-s,s,s);
        doc.setDrawColor(...BLUE);doc.setLineWidth(.55);
        doc.line(cx+.55,cy-1.0,cx+1.25,cy-.3);
        doc.line(cx+1.25,cy-.3,cx+2.75,cy-2.15);
        doc.setLineWidth(.18);
      }
    });
    y=doc.lastAutoTable.finalY+3;

    sectionTable('SECTION I: COMMENTS ON EXISTING INSTALLATION',[
      [{content:'Comments',styles:{fontStyle:'bold'}},display(f.existingComments,worksheet)]
    ],{0:{cellWidth:35},1:{cellWidth:w-35}},{colSpan:2});

    const boards=boardRows(cert);
    const scheduleSets=boards.reduce((count,b,bi)=>count+Math.max(1,Math.ceil(circuitsForBoard(cert,b.ref,bi===0).length/8)),0);
    sectionTable('SECTION J: SCHEDULES',[
      [{content:'Continuation sheet(s)',styles:{fontStyle:'bold'}},display(f.continuationSheets,worksheet)||(!worksheet?'0':'')],
      [{content:'Schedule(s) of Inspection',styles:{fontStyle:'bold'}},worksheet?'':'1'],
      [{content:'Schedule(s) of Circuit Details / Test Results',styles:{fontStyle:'bold'}},worksheet?'':String(Math.max(1,scheduleSets))],
      [{content:'Statement',styles:{fontStyle:'bold'}},'The schedules and continuation sheets listed form part of this certificate.']
    ],{0:{cellWidth:78},1:{cellWidth:w-78}},{colSpan:2});

    renderCircuitSchedules(doc,cert,schema,opts);
  }

  function renderMinor(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet,f=cert.fields||{},x=10,w=190;
    doc.setPage(1);let y=pageFrame(doc,'MINOR ELECTRICAL INSTALLATION WORKS CERTIFICATE',display(cert.number,worksheet,true),schema.standard);
    write(doc,'To be used only for minor electrical work which does not include the provision of a new circuit',10,y-1,190,{size:6.2});
    y+=3;
    let top=box(doc,x,y,w,48,'SECTION A: DESCRIPTION OF THE MINOR WORKS');
    labelValue(doc,'Details of the Client',display(f.clientName,worksheet),x+2,top+6,105,{labelW:28});
    labelValue(doc,'Date minor works completed',worksheet?'':fmtDate(f.completionDate),x+109,top+6,79,{labelW:39});
    labelValue(doc,'Installation location/address',display(f.installationAddress,worksheet),x+2,top+13,w-4,{labelW:36,maxLines:2});
    labelValue(doc,'Description of the minor works',display(f.description,worksheet),x+2,top+22,w-4,{labelW:39,maxLines:2});
    labelValue(doc,'Departures from BS 7671',display(f.departures,worksheet),x+2,top+31,w-4,{labelW:31,maxLines:2});
    labelValue(doc,'Permitted exceptions / risk assessment',display(f.permittedExceptions,worksheet),x+2,top+38,145,{labelW:46,maxLines:2});
    checkbox(doc,x+w-42,top+38,yes(f.riskAssessmentAttached,'Yes')&&!worksheet,'Risk assessment attached',{fontSize:5.8,labelWidth:37});
    labelValue(doc,'Comments / defects observed in existing installation',display(f.existingDefects,worksheet),x+2,top+45,w-4,{labelW:55,maxLines:1});
    y+=49;

    top=box(doc,x,y,w,39,'SECTION B: PRESENCE AND ADEQUACY OF INSTALLATION EARTHING AND BONDING ARRANGEMENTS');
    labelValue(doc,'System earthing arrangement',display(f.earthingArrangement,worksheet),x+2,top+7,w-4,{labelW:36});
    labelValue(doc,'Earth fault loop impedance at distribution board Zdb (Ω)',display(f.zdb,worksheet),x+2,top+16,w-4,{labelW:62});
    labelValue(doc,'Adequate main protective conductors',display(f.earthingConductorAdequate,worksheet),x+2,top+25,w-4,{labelW:46});
    labelValue(doc,'Main protective bonding conductor(s) to',display(f.bondingPresent,worksheet),x+2,top+33,w-4,{labelW:48});
    y+=40;

    top=box(doc,x,y,w,58,'SECTION C: CIRCUIT DETAILS');
    labelValue(doc,'DB Reference No.',display(f.dbReference,worksheet),x+2,top+6,55,{labelW:24});
    labelValue(doc,'DB Location and type',display(f.dbLocationType,worksheet),x+59,top+6,129,{labelW:32});
    labelValue(doc,'Circuit No.',display(f.circuitNo,worksheet),x+2,top+14,38,{labelW:18});
    labelValue(doc,'Circuit description',display(f.circuitDescription,worksheet),x+42,top+14,91,{labelW:28});
    labelValue(doc,'Reference method',display(f.referenceMethod,worksheet),x+135,top+14,53,{labelW:26});
    labelValue(doc,'Live csa mm²',display(f.liveCsa,worksheet),x+2,top+22,54,{labelW:22});
    labelValue(doc,'CPC csa mm²',display(f.cpcCsa,worksheet),x+58,top+22,54,{labelW:22});
    write(doc,'Circuit overcurrent protective device',x+2,top+31,56,{size:6.3,bold:true});
    labelValue(doc,'BS (EN)',display(f.ocpdBs,worksheet),x+2,top+37,45,{labelW:14});
    labelValue(doc,'Type',display(f.ocpdType,worksheet),x+49,top+37,34,{labelW:10});
    labelValue(doc,'Rating A',display(f.ocpdRating,worksheet),x+85,top+37,35,{labelW:14});
    labelValue(doc,'Breaking kA',display(f.breakingCapacity,worksheet),x+122,top+37,43,{labelW:19});
    write(doc,'RCD',x+2,top+45,12,{size:6.2,bold:true});
    labelValue(doc,'BS (EN)',display(f.rcdBs,worksheet),x+15,top+45,42,{labelW:14});
    labelValue(doc,'Type',display(f.rcdType,worksheet),x+59,top+45,31,{labelW:10});
    labelValue(doc,'Rating A',display(f.rcdRating,worksheet),x+92,top+45,31,{labelW:14});
    labelValue(doc,'IΔn mA',display(f.rcdIdn,worksheet),x+125,top+45,31,{labelW:14});
    labelValue(doc,'Delay ms',display(f.rcdDelay,worksheet),x+158,top+45,30,{labelW:15});
    labelValue(doc,'AFDD BS (EN) / rating',display((f.afddBs||'')+' '+(f.afddRating||''),worksheet),x+2,top+53,92,{labelW:35});
    labelValue(doc,'SPD BS (EN) / type',display((f.spdBs||'')+' '+(f.spdType||''),worksheet),x+96,top+53,92,{labelW:31});
    y+=59;

    top=box(doc,x,y,w,54,'SECTION D: TEST RESULTS FOR THE ALTERED OR EXTENDED CIRCUIT');
    labelValue(doc,'Protective conductor continuity (R1 + R2) Ω',display(f.r1r2,worksheet),x+2,top+7,91,{labelW:53});
    labelValue(doc,'or R2 Ω',display(f.r2,worksheet),x+95,top+7,43,{labelW:16});
    labelValue(doc,'Ring r1-r1 Ω',display(f.ringR1,worksheet),x+2,top+15,48,{labelW:23});
    labelValue(doc,'rn-rn Ω',display(f.ringRn,worksheet),x+52,top+15,43,{labelW:16});
    labelValue(doc,'r2-r2 Ω',display(f.ringR2,worksheet),x+97,top+15,43,{labelW:16});
    labelValue(doc,'IR test voltage V',display(f.irVoltage,worksheet),x+2,top+23,51,{labelW:25});
    labelValue(doc,'Live-Live MΩ',display(f.irLL,worksheet),x+55,top+23,51,{labelW:23});
    labelValue(doc,'Live-Earth MΩ',display(f.irLE,worksheet),x+108,top+23,51,{labelW:25});
    labelValue(doc,'Polarity satisfactory',display(f.polarity,worksheet),x+2,top+31,57,{labelW:30});
    labelValue(doc,'Maximum measured Zs Ω',display(f.zs,worksheet),x+61,top+31,64,{labelW:35});
    labelValue(doc,'RCD disconnection time ms',display(f.rcdTime,worksheet),x+127,top+31,61,{labelW:37});
    labelValue(doc,'RCD test button',display(f.rcdButton,worksheet),x+2,top+39,57,{labelW:25});
    labelValue(doc,'AFDD test button',display(f.afddButton,worksheet),x+61,top+39,57,{labelW:28});
    labelValue(doc,'SPD functionality',display(f.spdFunction,worksheet),x+120,top+39,68,{labelW:29});
    y+=55;

    top=box(doc,x,y,w,56,'SECTION E: DECLARATION');
    write(doc,'I certify that the work covered by this certificate does not impair the safety of the existing installation and that the work has been designed, constructed, inspected and tested in accordance with BS 7671 except as recorded in Section A.',x+2,top+7,w-4,{size:6.2,lineHeight:3,maxLines:4});
    labelValue(doc,'Name',display(f.engineerName,worksheet),x+2,top+23,91,{labelW:15});
    labelValue(doc,'For/on behalf of',display(f.forOnBehalfOf,worksheet),x+95,top+23,93,{labelW:28});
    labelValue(doc,'Address',display(f.address,worksheet),x+2,top+32,91,{labelW:18,maxLines:2});
    labelValue(doc,'Position',display(f.position,worksheet),x+95,top+32,93,{labelW:18});
    labelValue(doc,'Signature',display(f.signature,worksheet),x+2,top+45,91,{labelW:18});
    labelValue(doc,'Date',worksheet?'':fmtDate(f.declarationDate),x+95,top+45,93,{labelW:12});
  }

  // v1.9.6: EICR uses LANDSCAPE A4 on every page. Do not mix portrait
  // declarations/inspection pages with landscape board and test schedules.
  // All values come from the same certificate fields consumed by Quick Entry.
  // IET BS 7671:2018+A4:2026 Appendix 6 EICR model:
  // Sections A-K, including the two distinct Section K classification groups.
  // The issued form never prints app-only metadata fields; underlying saved data is unchanged.
  function renderEicrLandscape(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet,f=cert.fields||{},x=10,w=doc.internal.pageSize.getWidth()-20;
    const heading='ELECTRICAL INSTALLATION CONDITION REPORT';
    const frame=()=>pageFrame(doc,heading,display(cert.number,worksheet,true),schema.standard);
    doc.setPage(1);let y=frame();
    const titles={
      A:'SECTION A: DETAILS OF THE PERSON ORDERING THE REPORT',
      B:'SECTION B: REASON FOR PRODUCING THIS REPORT',
      C:'SECTION C: DETAILS OF THE INSTALLATION WHICH IS THE SUBJECT OF THIS REPORT',
      D:'SECTION D: EXTENT AND LIMITATIONS OF INSPECTION AND TESTING',
      E:'SECTION E: SUMMARY OF THE CONDITION OF THE INSTALLATION',
      F:'SECTION F: RECOMMENDATION FOR NEXT INSPECTION',
      G:'SECTION G: DECLARATION',
      H:'SECTION H: SCHEDULES AND CONTINUATION SHEET(S) ATTACHED',
      I:'SECTION I: SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS',
      J:'SECTION J: PARTICULARS OF INSTALLATION REFERRED TO IN THE CERTIFICATE'
    };
    const fieldsBySection={
      A:['clientName','clientAddress'],
      B:['reason','inspectionDates'],
      C:['occupier','installationAddress','premisesType','age','additionsEvidence','additionsAge','recordsAvailable','lastInspection'],
      D:['extentInspected','agreedLimitations','agreedWith','operationalLimitations','operationalLimitationsPage','standardAmendedTo'],
      E:['overallAssessment','generalCondition'],
      F:['nextInspectionDate','nextInspectionReason'],
      G:['inspectedBy','inspectorSignature','inspectorCompany','inspectorPosition','inspectorAddress','inspectorDate','authorisedBy','authoriserSignature','authoriserCompany','authoriserPosition','authoriserAddress','authoriserDate'],
      H:['continuationSheetCount','continuationSheetSections','inspectionSchedules','circuitSchedules'],
      I:['earthingArrangement','liveConductors','supplyACDC','nominalVoltage','frequency','ipf','ze','supplyDeviceBs','supplyDeviceType','supplyDeviceRating','supplyBreakingCapacity','supplyPolarity','otherSources'],
      J:['earthingDistributor','earthingElectrode','maximumDemand','earthElectrodeType','earthElectrodeLocation','earthElectrodeResistance','earthingConductorMaterial','earthingConductorCsa','earthingContinuity','bondingMaterial','bondingCsa','bondingContinuity','bondingToWater','bondingToGas','bondingToOil','bondingToSteel','bondingToLightning','bondingToOtherChecked','bondingToOther','mainSwitchLocation','mainSwitchBs','mainSwitchPoles','mainSwitchCurrent','mainSwitchVoltage','mainSwitchDeviceType','mainSwitchDeviceSetting','mainSwitchBreaking','mainRcdType','mainRcdIdn','mainRcdDelay','mainRcdTime','mainRcdBreaking']
    };
    const labels={
      clientName:'Name',clientAddress:'Address',inspectionDates:'Date(s) on which inspection and testing was carried out',
      installationAddress:'Address',premisesType:'Description of premises',
      age:'Estimated age of wiring system (years)',lastInspection:'Date of last inspection',
      extentInspected:'Details of parts inspected and tested',agreedLimitations:'Agreed limitations including reasons',
      overallAssessment:'Overall assessment (suitability for continued service)',
      nextInspectionDate:'Further inspection and testing before',nextInspectionReason:'Reasons for recommendation',
      inspectedBy:'Inspected and tested by (name)',authorisedBy:'Report authorised for issue by (name)',
      inspectorSignature:'Signature',inspectorCompany:'For/on behalf of',inspectorPosition:'Position',inspectorAddress:'Address',inspectorDate:'Date',
      authoriserSignature:'Signature',authoriserCompany:'For/on behalf of',authoriserPosition:'Position',authoriserAddress:'Address',authoriserDate:'Date',
      operationalLimitationsPage:'Operational limitations (see page no.)',continuationSheetCount:'Continuation sheet(s)',continuationSheetSections:'For Section(s)',inspectionSchedules:'Schedules of Inspection',circuitSchedules:'Schedules of Circuit Details and Test Results',
      supplyDeviceBs:'Supply protective device BS (EN)',supplyDeviceType:'Supply protective device type',
      supplyDeviceRating:'Supply protective device rated current (A)',supplyBreakingCapacity:'Supply device breaking capacity (kA)',
      earthingConductorCsa:'Earthing conductor csa (mm2)',bondingCsa:'Bonding conductor csa (mm2)',
      earthingDistributor:'Distributor’s facility',earthingElectrode:'Installation earth electrode',mainSwitchDeviceType:'Overcurrent device type',mainSwitchDeviceOther:'Other device type (specify)',mainSwitchDeviceSetting:'Device rating / setting (A)',
      bondingToWater:'To water installation pipes',bondingToGas:'To gas installation pipes',bondingToOil:'To oil installation pipes',bondingToSteel:'To structural steel',bondingToLightning:'To lightning protection system',bondingToOtherChecked:'To other',bondingToOther:'Specify other'
    };
    const notes={
      D:[
        'Unless agreed beforehand, concealed cables in trunking, conduits, under floors, in roof spaces, in the building fabric or underground have not been inspected.',
        'No checks for safety alerts, corrective actions or product recalls for equipment forming part of the installation have been made. Accessible roof-space electrical equipment should be inspected.',
        'The inspection and testing described in this report and its schedules was carried out in accordance with BS 7671:2018 as amended to the date shown above.'
      ],
      E:[
        'UNSATISFACTORY indicates C1 (danger present) and/or C2 (potentially dangerous), for which remedial action is urgent.',
        'C3 (improvement recommended) and FI (further investigation advised) are advisory and do not affect the overall assessment.'
      ],
      F:['Subject to any necessary remedial action being taken, the installation should be further inspected and tested before the recorded date.'],
      G:['The persons responsible for inspection and testing declare that, having exercised reasonable skill and care, this report, the observations and the attached schedules accurately assess the installation within the extent and limitations in Section D.'],
      H:['The schedules and continuation sheets listed form part of this document. This report is valid only when those schedules are attached.'],
      I:['Nominal voltage and frequency: by enquiry. Prospective fault current and external earth fault loop impedance: by enquiry or measurement.'],
      J:[]
    };
    const getPart=letter=>schema.sections.find(p=>p.type==='section'&&p.title.startsWith(letter+' ·'));
    const fresh=()=>{doc.addPage('a4','landscape');y=frame();};
    const writeSection=letter=>{
      if(y>181)fresh();
      const part=getPart(letter);
      const definitions=part?.fields||[];
      const keys=fieldsBySection[letter]||[];
      const rowBindings=[];
      const body=[];
      const format=(key,def)=>{
        if(worksheet)return '';
        if(key==='maximumDemand')return String(f.maximumDemand??'').trim()?display(f.maximumDemand,worksheet)+' '+(String(f.maximumDemandUnit||'').trim()||'N/A'):'N/A';
        if(key==='continuationSheetCount')return display(f.continuationSheetCount||f.continuationSheets,worksheet);
        if(key==='earthingDistributor')return Object.hasOwn(f,key)?(f[key]?'Yes':''):(['Distributor’s facility','Both'].includes(f.meansOfEarthing)?'Yes':'');
        if(key==='earthingElectrode')return Object.hasOwn(f,key)?(f[key]?'Yes':''):(['Installation earth electrode','Both'].includes(f.meansOfEarthing)?'Yes':'');
        // Section D of the IET model asks for the amendment DATE, while the
        // certificate heading retains the edition ID. Do not alter saved data.
        if(key==='standardAmendedTo'){
          const ref=String(f.standardAmendedTo||'').trim();
          if(/^BS\s*7671:2018\s*(?:\+\s*A4:2026|amendment\s*4\s*2026)$/i.test(ref))return '15/04/2026';
        }
        if(key==='premisesType')return display(f.premisesType,worksheet)+(String(f.premisesType||'')==='Other'&&f.premisesOther?' ('+display(f.premisesOther,worksheet)+')':'');
        if(key==='mainSwitchDeviceType')return display(f.mainSwitchDeviceType,worksheet)+(String(f.mainSwitchDeviceType||'')==='Other'&&f.mainSwitchDeviceOther?' ('+display(f.mainSwitchDeviceOther,worksheet)+')':'');
        if(key==='mainRcdType')return display(f.mainRcdType,worksheet)+(String(f.mainRcdType||'')==='Other'&&f.mainRcdOther?' ('+display(f.mainRcdOther,worksheet)+')':'');
        if(key==='earthElectrodeResistance'){
          const reading=String(f.earthElectrodeResistance??'').trim();
          const method=String(f.earthElectrodeMeasurementType||'').trim();
          return reading?(method&&method.toUpperCase()!=='N/A'?method+' = ':'')+reading:'N/A';
        }
        const legacyBond=String(f.bondingTo||'').toLowerCase();
        const matchLegacy={bondingToWater:/water/,bondingToGas:/gas/,bondingToOil:/oil/,bondingToSteel:/steel/,bondingToLightning:/lightning/};
        if(matchLegacy[key])return Object.hasOwn(f,key)?(f[key]?'Yes':''):matchLegacy[key].test(legacyBond)?'Yes':'';
        if(key==='bondingToOtherChecked')return f.bondingToOtherChecked||f.bondingToOther?'Yes':legacyBond&&!/(water|gas|oil|steel|lightning)/.test(legacyBond)?'Yes':'';
        if(key==='bondingToOther')return f.bondingToOther||(legacyBond&&!/(water|gas|oil|steel|lightning)/.test(legacyBond)?f.bondingTo:'');
        const value=f[key];
        return def?.type==='date'?fmtDate(value):display(value,worksheet);
      };
      for(let i=0;i<keys.length;i+=2){
        const a=keys[i],b=keys[i+1];
        const da=definitions.find(q=>q.key===a),db=definitions.find(q=>q.key===b);
        body.push([
          {content:pdfText(labels[a]||da?.label||a),styles:{fontStyle:'bold'}},
          pdfText(worksheet?'':String(format(a,da)??'').trim()||'N/A'),
          {content:b?pdfText(labels[b]||db?.label||b):'',styles:{fontStyle:'bold'}},
          b?pdfText(worksheet?'':String(format(b,db)??'').trim()||'N/A'):''
        ]);
        rowBindings.push([a,b]);
      }
      for(const note of notes[letter]||[]){
        body.push([{content:pdfText(note),colSpan:4,styles:{fontStyle:'italic',fontSize:6.8}}]);
        rowBindings.push([]);
      }
      doc.autoTable({
        startY:y,head:[[{content:titles[letter],colSpan:4,styles:{fontStyle:'bold',fillColor:PALE,textColor:INK,fontSize:7.2}}]],
        body,margin:{left:x,right:10,top:27,bottom:14},tableWidth:w,
        // Let sections use the available A4 space instead of forcing entire
        // sections to a new sheet and leaving a large blank area.
        theme:'grid',rowPageBreak:'avoid',pageBreak:'auto',
        styles:{fontSize:7.1,cellPadding:.82,minCellHeight:5.9,lineColor:LINE,lineWidth:.12,textColor:INK,valign:'middle',overflow:'linebreak'},
        headStyles:{fillColor:PALE,textColor:INK,lineColor:LINE,lineWidth:.12},
        columnStyles:{0:{cellWidth:61},1:{cellWidth:78},2:{cellWidth:60},3:{cellWidth:w-199}},
        editResolve:(r,c)=>{
          if(c%2!==1)return [];
          const key=rowBindings[r]?.[(c-1)/2];
          if(!key)return [];
          return (key==='premisesType'?['premisesType','premisesOther']:key==='mainSwitchDeviceType'?['mainSwitchDeviceType','mainSwitchDeviceOther']:key==='mainRcdType'?['mainRcdType','mainRcdOther']:key==='earthElectrodeResistance'?['earthElectrodeMeasurementType','earthElectrodeResistance']:[key]).map(k=>({scope:'field',key:k}));
        },
        didDrawPage:()=>frame()
      });
      y=doc.lastAutoTable.finalY+2.2;
    };
    // Report layout contract: A-I on pages 1-2, J alone on page 3,
    // K alone on page 4; the inspection/circuit schedules follow afterward.
    ['A','B','C','D','E','F','G','H','I'].forEach(writeSection);
    if(doc.getNumberOfPages()>2)throw new Error('EICR A-I exceed pages 1-2; cannot silently displace Section J');
    // Fill out the two-page declaration without adding unrelated sections.
    while(doc.getNumberOfPages()<2)fresh();
    fresh();  // page 3, Section J only.
    writeSection('J');
    if(doc.getNumberOfPages()!==3)throw new Error('Section J exceeds its dedicated A4 page');
    fresh();  // page 4, Section K only.
    y=Math.max(y,32);
    const observations=safeRows(cert.tables?.observations)
      .map((row,index)=>({row,index}))
      .filter(({row})=>String(row.observation||'').trim()||String(row.code||'').trim()||String(row.location||'').trim());
    write(doc,'SECTION K: OBSERVATIONS',x,y,w,{size:9.3,bold:true});y+=7;
    const observationsSelection=String(f.remedialActionStatus|| (observations.length?'The following observations are made':'No remedial action is required'));
    checkbox(doc,x,y,observationsSelection==='No remedial action is required','No remedial action is required',{fontSize:7.3,labelWidth:95});
    checkbox(doc,x+111,y,observationsSelection==='The following observations are made','The following observations are made',{fontSize:7.3,labelWidth:130});
    if(doc.__editRegions)doc.__editRegions.push({scope:'field',key:'remedialActionStatus',page:doc.internal.getCurrentPageInfo().pageNumber,x,y:y-4,width:w,height:6});
    y+=7;
    const limitationsY=y;
    y=write(doc,'Referring to the attached inspection and test schedules, subject to Section D extent and limitations: '+(worksheet?'':String(f.limitationsReference||'').trim()||'N/A'),x,y,w,{size:7.2,maxLines:12,lineHeight:4.3})+3;
    if(doc.__editRegions)doc.__editRegions.push({scope:'field',key:'limitationsReference',page:doc.internal.getCurrentPageInfo().pageNumber,x,y:limitationsY-3,width:w,height:y-limitationsY+3});
    y=write(doc,'NOTE: Photographic and/or thermographic images can be attached to support observations made in this Section.',x,y,w,{size:7.0,lineHeight:4.1})+5;
    for(const group of [
      {title:'C1 AND C2 OBSERVATIONS',codes:['C1','C2'],note:'C1: Danger present - immediate remedial action necessary. C2: Potentially dangerous - urgent remedial action necessary. These affect the overall assessment.'},
      {title:'C3 AND FI OBSERVATIONS',codes:['C3','FI'],note:'C3: Improvement recommended. FI: Further investigation advised. These are advisory and do not affect the overall assessment.'}
    ]){
      if(y>164){fresh();y=Math.max(y,32);}
      const selected=observations.filter(({row})=>group.codes.includes(String(row.code||'').trim()) || (group.codes.includes('FI')&&!['C1','C2','C3','FI'].includes(String(row.code||'').trim())));
      doc.autoTable({
        startY:y,
        head:[[{content:group.title,colSpan:4,styles:{fontStyle:'bold',fillColor:PALE}}],
              ['Item No.','Observations','Location','Classification code']],
        // Keep the C1/C2 or C3/FI explanation with its observation table,
        // not alone on a new sheet after an automatic page break.
        body:(selected.length?selected.map(({row})=>[
          pdfText(String(row.item||'').trim()||'N/A'),
          pdfText(String(row.observation||'').trim()||'N/A'),
          pdfText(String(row.location||'').trim()||'N/A'),
          pdfText(String(row.code||'').trim()||'N/A')
        ]):[['N/A','N/A','N/A','N/A']]).concat([[{content:group.note,colSpan:4,styles:{fontStyle:'italic',fontSize:7.0,minCellHeight:9}}]]),
        margin:{left:x,right:10,top:32,bottom:16},tableWidth:w,theme:'grid',rowPageBreak:'avoid',pageBreak:'avoid',
        styles:{fontSize:7.3,cellPadding:1.35,minCellHeight:8.3,lineColor:LINE,lineWidth:.12,textColor:INK,overflow:'linebreak'},
        headStyles:{fillColor:PALE,textColor:INK,lineColor:LINE,lineWidth:.12},
        columnStyles:{0:{cellWidth:24},1:{cellWidth:151},2:{cellWidth:58},3:{cellWidth:w-233}},
        editResolve:(r,c)=>{
          const index=selected[r]?.index;
          if(index===undefined)return [];
          if(c===0)return [{scope:'table',kind:'observations',index,key:'item'}];
          if(c===1)return [{scope:'table',kind:'observations',index,key:'observation'}];
          if(c===2)return [{scope:'table',kind:'observations',index,key:'location'}];
          if(c===3)return [{scope:'table',kind:'observations',index,key:'code'}];
          return [];
        },
        didDrawPage:()=>frame()
      });
      y=doc.lastAutoTable.finalY+6;
    }
    renderEicrInspectionLandscape(doc,cert,schema,opts);
    renderCircuitSchedules(doc,cert,schema,opts);
    if(!worksheet)renderEicrRecipientGuidance(doc,cert,schema);
  }
  function renderEicrInspectionLandscape(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet,rows=safeRows(cert.tables?.eicrInspection),x=10,w=277;
    const canonicalRows=schema.sections?.find(part=>part.type==='table'&&part.key==='eicrInspection')?.defaultRows||[];
    const canonicalDescription=new Map(canonicalRows.map(row=>[String(row.item||''),String(row.description||'')]));
    doc.addPage('a4','landscape');
    const title='CONDITION REPORT SCHEDULE OF INSPECTION FOR RESIDENTIAL AND SIMILAR PREMISES WITH UP TO 100 A SUPPLY';
    const drawPage=()=>pageFrame(doc,'CONDITION REPORT SCHEDULE OF INSPECTION',display(cert.number,worksheet,true),schema.standard);
    drawPage();
    write(doc,'Outcomes: acceptable condition = tick; unacceptable = C1 or C2; improvement = C3; further investigation = FI; not verified = N/V; limitation = LIM; not applicable = N/A.',x,27,w,{size:7.1,maxLines:2});
    write(doc,'C1, C2, C3 and FI coded inspection items are to be recorded in Section K.',x,33,w,{size:7.0});
    const sections={
      '1':'INTAKE EQUIPMENT (VISUAL INSPECTION ONLY)',
      '2':'PRESENCE OF ADEQUATE ARRANGEMENTS FOR OTHER SOURCES SUCH AS MICROGENERATORS',
      '3':'EARTHING / BONDING ARRANGEMENTS',
      '4':'CONSUMER UNIT(S) / DISTRIBUTION BOARD(S)',
      '5':'DISTRIBUTION / FINAL CIRCUITS',
      '6':'LOCATION(S) CONTAINING A BATH OR SHOWER',
      '7':'OTHER PART 7 SPECIAL INSTALLATIONS OR LOCATIONS',
      '8':'PROSUMER’S LOW VOLTAGE ELECTRICAL INSTALLATION(S)'
    };
    const body=[],rowMap=[];
    const intakeRows=[
      ['intakeServiceCable','Service cable'],
      ['intakeServiceHead','Service head'],
      ['intakeEarthingArrangement','Earthing arrangement'],
      ['intakeMeterTails','Meter tails'],
      ['intakeMeteringEquipment','Metering equipment'],
      ['intakeMeansOfIsolation','Means of isolation (where present)']
    ];
    let lastGroup='';
    rows.forEach((r,index)=>{
      const group=String(r.item||'').split('.')[0];
      if(sections[group]&&group!==lastGroup&&!(group==='2'&&String(r.item||'')==='2.0')){
        body.push([{content:group+'.0',styles:{fontStyle:'bold'}},{content:sections[group],styles:{fontStyle:'bold'}},{content:''}]);
        rowMap.push(-1);lastGroup=group;
      }
      const isIntake=String(r.item||'')==='1.1';
      body.push([pdfText(r.item||''),pdfText(isIntake?'Distributor/supplier intake equipment':canonicalDescription.get(String(r.item||''))||r.description||''),isIntake||worksheet||String(r.outcome||'').trim()==='✓'?'':pdfText(String(r.outcome||'').trim()||'N/A')]);
      rowMap.push(index);
      if(isIntake){
        intakeRows.forEach(([key,description],subIndex)=>{
          const raw=String(cert.fields?.[key]||'').trim();
          body.push(['',pdfText('– '+description),worksheet||raw==='✓'?'':pdfText(raw||'N/A')]);
          rowMap.push(-3-subIndex);
        });
        body.push(['','NOTE: Distributor intake equipment should be visually assessed; report concerns in Section K as appropriate.','']);
        rowMap.push(-9);
        body.push(['','NOTE: Where dangerous intake conditions are identified, inform the person ordering the inspection.','']);
        rowMap.push(-10);
        const notification=String(cert.fields?.intakeNotified||'');
        body.push(['', 'Person ordering inspection notified of dangerous or potentially dangerous situations', worksheet?'':notification||'N/A']);
        rowMap.push(-2);
      }
    });
    doc.autoTable({
      startY:39,
      head:[[{content:title,colSpan:3,styles:{fontStyle:'bold',fontSize:8.2}}],
            ['Item No.','Description','Outcome']],
      body,
      margin:{left:x,right:10,top:29,bottom:20},tableWidth:w,theme:'grid',rowPageBreak:'avoid',
      styles:{fontSize:7.2,cellPadding:1.0,minCellHeight:6.8,lineColor:LINE,lineWidth:.12,textColor:INK,valign:'middle'},
      headStyles:{fillColor:[255,255,255],textColor:INK,lineColor:LINE,lineWidth:.12},
      columnStyles:{0:{cellWidth:19},1:{cellWidth:w-47},2:{cellWidth:28,halign:'center'}},
      editResolve:(r,c)=>{
        const row=rowMap[r];
        if(row===-2)return c===2?[{scope:'field',key:'intakeNotified'}]:[];
        if(row<=-3&&row>=-8)return c===2?[{scope:'field',key:intakeRows[-3-row][0]}]:[];
        return row>=0?[{scope:'table',kind:'eicrInspection',index:row,key:['item','description','outcome'][c]}]:[];
      },
      didDrawPage:drawPage,
      didDrawCell:data=>{
        if(worksheet||data.section!=='body'||data.column.index!==2)return;
        const i=rowMap[data.row.index];
        const outcome=i<=-3&&i>=-8?cert.fields?.[intakeRows[-3-i][0]]:i>=0?rows[i]?.outcome:'';
        if(i===undefined||(i>=0&&String(rows[i]?.item||'')==='1.1')||String(outcome||'').trim()!=='✓')return;
        // Free-standing blue check: no surrounding square.
        const cell=data.cell,cx=cell.x+cell.width/2,cy=cell.y+cell.height/2;
        doc.setDrawColor(...BLUE);doc.setLineWidth(.65);
        doc.line(cx-2,cy,cx-.6,cy+1.5);
        doc.line(cx-.6,cy+1.5,cx+2.6,cy-2);
        doc.setLineWidth(.18);
      }
    });
    // Reserve the bottom strip for the inspector sign-off. Never generate
    // a nearly blank additional sheet containing only this line.
    const f=cert.fields||{};
    write(doc,'Inspected and tested by: '+display(f.inspectedBy,worksheet)+'     Signature: '+display(f.inspectorSignature,worksheet)+'     Date: '+(worksheet?'':fmtDate(f.inspectorDate)),x,195,w,{size:8.0,bold:true});
  }
  // The IET's Amendment 4 model specifies guidance for recipients to be
  // appended to the issued EICR. Do not append internal inspector notes.
  function renderEicrRecipientGuidance(doc,cert,schema){
    const title='CONDITION REPORT - GUIDANCE FOR RECIPIENTS';
    const frame=()=>pageFrame(doc,title,String(cert.number||''),schema.standard);
    const guidance=[
      'The purpose of this Report is to confirm, so far as reasonably practicable, whether the electrical installation is in a satisfactory condition for continued service at the date of inspection and testing (see Section E). The Report should identify any damage, deterioration, defects, dangerous conditions and/or non-compliances with the requirements of BS 7671, which might give rise to danger (see Section K).',
      'This Report is only valid if accompanied by the Schedule(s) of Inspections and the Schedule(s) of Circuit Details and Schedule(s) of Test Results.',
      'The person ordering the Report should have received the original Report and the inspector should have retained a duplicate.',
      'The original Report should be retained in a safe place and be made available to any person inspecting or undertaking work on the electrical installation in the future. If the property is vacated, this Report will provide the new owner/occupier with details of the condition of the electrical installation at the time the Report was issued.',
      'Section D (Extent and Limitations) should identify fully the extent of the installation covered by this Report and any limitations on the inspection and testing. The inspector should have agreed these aspects with the person ordering the Report and with other interested parties (licensing authority, insurance company, mortgage provider and the like) before the inspection was carried out.',
      'Some operational limitations such as inability to gain access to parts of the installation or an item of equipment may have been encountered during the inspection. The inspector should have noted these in Section D.',
      'For items classified in Section K as C1 (Danger present), the safety of those using the installation is at risk, and it is recommended that a skilled person or persons competent in electrical installation work undertakes the necessary remedial work immediately.',
      'For items classified in Section K as C2 (Potentially dangerous), the safety of those using the installation may be at risk and it is recommended that a skilled person or persons competent in electrical installation work undertakes the necessary remedial work as a matter of urgency.',
      'For items classified in Section K as C3 (Improvement recommended), in some cases remedial work may improve the safety of the installation. However, a C3 recommendation is advisory only and does not affect the overall assessment of the Report.',
      'Where further investigation is advised in Section K, this is because the inspection and testing has identified a potential issue for which the inspector is unable to determine a classification code until further investigation has taken place. Further investigation is recommended to obtain the necessary information to reach an appropriate classification.',
      'For safety reasons, the electrical installation should be re-inspected at appropriate intervals by a skilled person competent in such work. The recommended next inspection date is stated in Section F.',
      'Where the installation includes a residual current device (RCD) it should be tested six-monthly by pressing the button marked T or Test. The device should switch off the supply and should then be switched on to restore supply. If it does not operate when the button is pressed, seek expert advice.',
      'Where the installation includes an arc fault detection device (AFDD) with a manual test facility, it should be tested six-monthly by pressing the test button. Where an AFDD has both a test button and automatic test function, follow the manufacturer instructions for test button operation.',
      'Where the installation includes a surge protective device (SPD), the status indicator should be checked to confirm it is operational in accordance with manufacturer information. If not operational, seek expert advice.',
      'Where the installation includes alternative or additional sources of supply, warning notices should be found at the origin or meter position or, if remote from the origin, at the consumer unit or distribution board and at all points of isolation of all sources of supply.'
    ];
    doc.addPage('a4','landscape');frame();
    write(doc,'This Report is an important and valuable document which should be retained for future reference.',10,29,277,{size:8.5,bold:true,maxLines:2});
    doc.autoTable({
      startY:36,
      head:[[{content:'GUIDANCE FOR RECIPIENTS (to be appended to the Report)',colSpan:2,styles:{fontStyle:'bold',fillColor:PALE}}]],
      body:guidance.map((item,i)=>[String(i+1)+'.',pdfText(item)]),
      margin:{left:10,right:10,top:29,bottom:15},tableWidth:277,
      theme:'plain',rowPageBreak:'avoid',
      styles:{fontSize:7.7,cellPadding:1.5,minCellHeight:7.5,textColor:INK,overflow:'linebreak'},
      columnStyles:{0:{cellWidth:12,fontStyle:'bold'},1:{cellWidth:265}},
      didDrawPage:frame
    });
  }

  function renderEicr(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet,f=cert.fields||{},x=10,w=190;
    doc.setPage(1);let y=pageFrame(doc,'ELECTRICAL INSTALLATION CONDITION REPORT',display(cert.number,worksheet,true),schema.standard);
    let top=box(doc,x,y,w,21,'SECTION A: DETAILS OF THE PERSON ORDERING THE REPORT');
    labelValue(doc,'Name',display(f.clientName,worksheet),x+2,top+6,w-4,{labelW:15});
    labelValue(doc,'Address',display(f.clientAddress,worksheet),x+2,top+12,w-4,{labelW:18,maxLines:1});y+=22;

    top=box(doc,x,y,w,22,'SECTION B: REASON FOR PRODUCING THIS REPORT');
    labelValue(doc,'Reason',display(f.reason,worksheet),x+2,top+6,w-4,{labelW:18,maxLines:2});
    labelValue(doc,'Date(s) inspection and testing carried out',display(f.inspectionDates,worksheet),x+2,top+13,w-4,{labelW:52});y+=23;

    top=box(doc,x,y,w,39,'SECTION C: DETAILS OF THE INSTALLATION WHICH IS THE SUBJECT OF THIS REPORT');
    labelValue(doc,'Occupier',display(f.occupier,worksheet),x+2,top+6,62,{labelW:18});
    labelValue(doc,'Installation address',display(f.installationAddress,worksheet),x+66,top+6,122,{labelW:34,maxLines:2});
    labelValue(doc,'Description of premises',display(f.premisesType,worksheet)+' '+display(f.premisesOther,worksheet),x+2,top+15,w-4,{labelW:34});
    labelValue(doc,'Estimated age of wiring system (years)',display(f.age,worksheet),x+2,top+23,65,{labelW:46});
    labelValue(doc,'Evidence of additions/alterations',display(f.additionsEvidence,worksheet),x+69,top+23,63,{labelW:39});
    labelValue(doc,'Estimated age if yes',display(f.additionsAge,worksheet),x+134,top+23,54,{labelW:31});
    labelValue(doc,'Installation records available',display(f.recordsAvailable,worksheet),x+2,top+31,72,{labelW:38});
    labelValue(doc,'Date of last inspection',worksheet?'':fmtDate(f.lastInspection),x+76,top+31,56,{labelW:29});y+=40;

    top=box(doc,x,y,w,54,'SECTION D: EXTENT AND LIMITATIONS OF INSPECTION AND TESTING');
    labelValue(doc,'Parts of installation inspected and tested',display(f.extentInspected,worksheet),x+2,top+7,w-4,{labelW:52,maxLines:2});
    labelValue(doc,'Agreed limitations including reasons',display(f.agreedLimitations,worksheet),x+2,top+18,w-4,{labelW:46,maxLines:2});
    labelValue(doc,'Agreed with',display(f.agreedWith,worksheet),x+2,top+29,90,{labelW:22});
    labelValue(doc,'Operational limitations including reasons',display(f.operationalLimitations,worksheet),x+2,top+38,w-4,{labelW:50,maxLines:2});
    labelValue(doc,'Inspection carried out to BS 7671 amended to',display(f.standardAmendedTo,worksheet),x+2,top+44,w-4,{labelW:57});y+=55;

    top=box(doc,x,y,w,30,'SECTION E: SUMMARY OF THE CONDITION OF THE INSTALLATION');
    labelValue(doc,'Overall assessment',display(f.overallAssessment,worksheet),x+2,top+7,80,{labelW:31});
    labelValue(doc,'General condition of the installation in terms of electrical safety',display(f.generalCondition,worksheet),x+2,top+16,w-4,{labelW:68,maxLines:4});y+=31;

    top=box(doc,x,y,w,23,'SECTION F: RECOMMENDATION FOR NEXT INSPECTION');
    labelValue(doc,'Further inspection recommended before',worksheet?'':fmtDate(f.nextInspectionDate),x+2,top+7,w-4,{labelW:48});
    labelValue(doc,'Reason for recommended interval',display(f.nextInspectionReason,worksheet),x+2,top+13,w-4,{labelW:43,maxLines:2});y+=24;

    top=box(doc,x,y,w,57,'SECTION G: DECLARATION');
    write(doc,'I/We declare that the information in this report, including observations and attached schedules, provides an accurate assessment of the condition of the electrical installation, taking into account the stated extent and limitations.',x+2,top+7,w-4,{size:6.2,lineHeight:3,maxLines:4});
    // All six issued EICR declaration fields for both persons, without
    // inventing extra certificate metadata or omitting their authorisation.
    const signers=[
      {name:f.inspectedBy,signature:f.inspectorSignature,company:f.inspectorCompany,position:f.inspectorPosition,address:f.inspectorAddress,date:f.inspectorDate},
      {name:f.authorisedBy,signature:f.authoriserSignature,company:f.authoriserCompany,position:f.authoriserPosition,address:f.authoriserAddress,date:f.authoriserDate}
    ];
    for(let idx=0;idx<2;idx++){
      const x0=x+2+idx*97,p=signers[idx];
      write(doc,idx===0?'Inspected and tested by:':'Report authorised for issue by:',x0,top+21,91,{size:6,bold:true});
      [
        ['Name (Capitals)',p.name],
        ['Signature',p.signature],
        ['For/on behalf of',p.company],
        ['Position',p.position],
        ['Address',p.address],
        ['Date',worksheet?'':fmtDate(p.date)]
      ].forEach(([label,value],i)=>labelValue(doc,label,display(value,worksheet),x0,top+24+i*4,91,{labelW:30,maxLines:1,valueSize:5.7}));
    }

    doc.addPage('a4','portrait');doc.setPage(2);y=pageFrame(doc,'ELECTRICAL INSTALLATION CONDITION REPORT',display(cert.number,worksheet,true),schema.standard);
    top=box(doc,x,y,w,18,'SECTION H: SCHEDULES AND CONTINUATION SHEET(S) ATTACHED');
    labelValue(doc,'Continuation sheet(s)',display(f.continuationSheets,worksheet),x+2,top+6,60,{labelW:34});
    labelValue(doc,'Schedule(s) of Inspection',display(f.inspectionSchedules,worksheet),x+64,top+6,60,{labelW:39});
    labelValue(doc,'Circuit Details / Test Results',display(f.circuitSchedules,worksheet),x+126,top+6,62,{labelW:39});y+=19;

    top=box(doc,x,y,w,60,'SECTION I: SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS');
    choiceLine(doc,'Earthing arrangement',['TN-C','TN-S','TN-C-S PME','TN-C-S PNB','TT','IT'],String(f.earthingArrangement||'').replace(' (PME)',' PME').replace(' (PNB)',' PNB'),worksheet,x+2,top+6,186,{labelW:25,optionSize:5.4});
    choiceLine(doc,'Supply',['AC','DC'],f.supplyACDC,worksheet,x+2,top+13,50,{labelW:14,optionSize:5.4});
    labelValue(doc,'Number/type of live conductors',display(f.liveConductors,worksheet),x+60,top+13,128,{labelW:45,maxLines:1});
    labelValue(doc,'Nominal voltage U/U0 (V)',display(f.nominalVoltage,worksheet),x+2,top+22,52,{labelW:31});
    labelValue(doc,'Nominal frequency (Hz)',display(f.frequency,worksheet),x+56,top+22,45,{labelW:28});
    labelValue(doc,'Prospective fault current Ipf (kA)',display(f.ipf,worksheet),x+103,top+22,45,{labelW:31});
    labelValue(doc,'External earth fault loop impedance Ze (Ω)',display(f.ze,worksheet),x+150,top+22,38,{labelW:30});
    write(doc,'Supply protective device',x+2,top+32,45,{size:6.4,bold:true});
    labelValue(doc,'BS (EN)',display(f.supplyDeviceBs,worksheet),x+2,top+38,46,{labelW:14});
    labelValue(doc,'Type',display(f.supplyDeviceType,worksheet),x+50,top+38,35,{labelW:10});
    labelValue(doc,'Rated current (A)',display(f.supplyDeviceRating,worksheet),x+87,top+38,45,{labelW:23});
    labelValue(doc,'Breaking capacity (kA)',display(f.supplyBreakingCapacity,worksheet),x+134,top+38,54,{labelW:28});
    choiceLine(doc,'Supply polarity confirmed',['Yes','No'],f.supplyPolarity,worksheet,x+2,top+47,90,{labelW:36});
    choiceLine(doc,'Other sources of supply',['Yes','No'],f.otherSources,worksheet,x+96,top+47,92,{labelW:35});y+=61;

    top=box(doc,x,y,w,91,'SECTION J: PARTICULARS OF INSTALLATION REFERRED TO IN THE CERTIFICATE');
    choiceLine(doc,'Means of earthing',['Distributor','Earth electrode','Both','Other'],String(f.meansOfEarthing||'').replace('Distributor’s facility','Distributor').replace('Installation earth electrode','Earth electrode'),worksheet,x+2,top+6,186,{labelW:25,optionSize:5});
    labelValue(doc,'Maximum demand',display(f.maximumDemand,worksheet)+' '+display(f.maximumDemandUnit,worksheet),x+2,top+13,92,{labelW:27});
    labelValue(doc,'Earth electrode type',display(f.earthElectrodeType,worksheet),x+96,top+13,92,{labelW:27});
    labelValue(doc,'Earth electrode location',display(f.earthElectrodeLocation,worksheet),x+2,top+20,92,{labelW:31});
    labelValue(doc,'RA/Ze (Ω)',display(f.earthElectrodeResistance,worksheet),x+96,top+20,92,{labelW:17});
    write(doc,'Main Protective Conductors',x+2,top+29,55,{size:6.5,bold:true});
    labelValue(doc,'Earthing conductor material',display(f.earthingConductorMaterial,worksheet),x+2,top+36,56,{labelW:34});
    labelValue(doc,'csa mm²',display(f.earthingConductorCsa,worksheet),x+60,top+36,35,{labelW:15});
    labelValue(doc,'Continuity verified',display(f.earthingContinuity,worksheet),x+97,top+36,40,{labelW:24});
    labelValue(doc,'Bonding conductor material',display(f.bondingMaterial,worksheet),x+2,top+43,56,{labelW:34});
    labelValue(doc,'csa mm²',display(f.bondingCsa,worksheet),x+60,top+43,35,{labelW:15});
    labelValue(doc,'Continuity verified',display(f.bondingContinuity,worksheet),x+97,top+43,40,{labelW:24});
    labelValue(doc,'Main protective bonding to',display(f.bondingTo,worksheet),x+139,top+36,49,{labelW:31,maxLines:2});
    write(doc,'Main switch (Isolation device / Switch-fuse / Circuit-breaker / RCD etc.)',x+2,top+54,w-4,{size:6.5,bold:true});
    labelValue(doc,'Location',display(f.mainSwitchLocation,worksheet),x+2,top+61,45,{labelW:14});
    labelValue(doc,'BS (EN)',display(f.mainSwitchBs,worksheet),x+49,top+61,35,{labelW:14});
    labelValue(doc,'No. poles',display(f.mainSwitchPoles,worksheet),x+86,top+61,31,{labelW:16});
    labelValue(doc,'Current A',display(f.mainSwitchCurrent,worksheet),x+119,top+61,31,{labelW:15});
    labelValue(doc,'Voltage V',display(f.mainSwitchVoltage,worksheet),x+152,top+61,36,{labelW:15});
    labelValue(doc,'OCPD type/setting',display(f.mainSwitchDeviceType,worksheet),x+2,top+70,55,{labelW:27});
    labelValue(doc,'Breaking kA',display(f.mainSwitchBreaking,worksheet),x+59,top+70,38,{labelW:19});
    labelValue(doc,'RCD type',display(f.mainRcdType,worksheet),x+99,top+70,32,{labelW:17});
    labelValue(doc,'IΔn mA',display(f.mainRcdIdn,worksheet),x+133,top+70,27,{labelW:14});
    labelValue(doc,'Delay ms',display(f.mainRcdDelay,worksheet),x+162,top+70,26,{labelW:15});
    labelValue(doc,'OCPD rating/setting (A)',display(f.mainSwitchDeviceSetting,worksheet),x+2,top+77,54,{labelW:34});
    labelValue(doc,'RCD measured time (ms)',display(f.mainRcdTime,worksheet),x+58,top+77,59,{labelW:38});
    labelValue(doc,'RCD breaking capacity (kA)',display(f.mainRcdBreaking,worksheet),x+119,top+77,69,{labelW:45});
    y+=92;

    top=box(doc,x,y,w,80,'SECTION K: OBSERVATIONS');
    const obs=safeRows(cert.tables?.observations);
    doc.autoTable({
      startY:top+1,
      head:[['Item No.','Observation(s)','Classification code','Schedule ref.']],
      body:Array.from({length:6},(_,idx)=>{
        const r=obs[idx]||{};
        return [worksheet?'':pdfText(r.item||''),worksheet?'':pdfText(r.observation||''),worksheet?'':pdfText(r.code||''),worksheet?'':pdfText(r.scheduleRef||'')];
      }),
      margin:{left:x,right:210-(x+w)},tableWidth:w,theme:'grid',
      styles:{fontSize:5.8,cellPadding:1,minCellHeight:8,lineColor:LINE,lineWidth:.12,textColor:INK},
      headStyles:{fillColor:[255,255,255],textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
      columnStyles:{0:{cellWidth:17},1:{cellWidth:112},2:{cellWidth:31},3:{cellWidth:30}}
    });
    renderEicrInspection(doc,cert,schema,opts);
    renderCircuitSchedules(doc,cert,schema,opts);
  }

  function renderEicrInspection(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet,rows=safeRows(cert.tables?.eicrInspection);
    doc.addPage('a4','portrait');
    let first=true;
    doc.autoTable({
      startY:31,
      head:[
        [{content:'CONDITION REPORT SCHEDULE OF INSPECTION',colSpan:3,styles:{fontStyle:'bold',fontSize:8}}],
        ['Item No.','Description','Outcome']
      ],
      body:rows.map(r=>[pdfText(r.item||''),pdfText(r.description||''),worksheet?'':pdfText(r.outcome||'')]),
      margin:{left:10,right:10,top:31,bottom:12},
      theme:'grid',
      rowPageBreak:'avoid',
      styles:{fontSize:5.4,cellPadding:.85,minCellHeight:5.6,lineColor:LINE,lineWidth:.12,textColor:INK,valign:'middle'},
      headStyles:{fillColor:[255,255,255],textColor:INK,lineColor:LINE,lineWidth:.12},
      columnStyles:{0:{cellWidth:18},1:{cellWidth:147},2:{cellWidth:25,halign:'center'}},
      didDrawPage:()=>{
        pageFrame(doc,'CONDITION REPORT SCHEDULE OF INSPECTION',display(cert.number,worksheet,true),schema.standard);
        if(first){
          write(doc,'Outcomes: S = Satisfactory; C1/C2 = Unacceptable; C3 = Improvement recommended; FI = Further investigation; N/V = Not verified; LIM = Limitation; N/A = Not applicable',10,27,190,{size:5.4});
          first=false;
        }
      }
    });
  }

  function renderCircuitSchedules(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet;
    const boards=boardRows(cert);
    boards.forEach((board,bi)=>{
      const ref=board.ref||('DB'+(bi+1));
      const circuits=circuitsForBoard(cert,ref,bi===0);
      const chunks=[];
      if(circuits.length){
        for(let i=0;i<circuits.length;i+=8)chunks.push(circuits.slice(i,i+8));
      }else chunks.push([]);
      chunks.forEach((chunk,chunkIndex)=>{
        doc.addPage('a4','landscape');
        pageFrame(doc,'GENERIC SCHEDULE OF CIRCUIT DETAILS',display(cert.number,worksheet,true),schema.standard);
        const W=doc.internal.pageSize.getWidth(),x=10,w=W-20;
        const y=27;
        write(doc,'Distribution board/Consumer unit details',x,y,w,{size:7,bold:true});
        // Flexible board cells preserve long SPD/device/location text without overlap.
        // The printable header records BS 7671 Appendix 6 circuit-schedule
        // information only. CU make, model and module counts are internal photo
        // recognition aids, not extra certificate fields.
        const distributionBs=board.distributionOcpdBs||'';
        const distributionType=board.distributionOcpdType||'';
        const distributionRating=board.distributionOcpdRating||'';
        const spdSource=String(board.spd||'').trim();
        const spdMatch=spdSource.match(/\bType\s*([123])(?:\s*\+\s*(?:Type\s*)?([123]))?/i);
        const spdCertified=/^No SPD\s*\/\s*N\/A$|^N\/A$/i.test(spdSource)?'N/A':spdMatch?'T'+spdMatch[1]+(spdMatch[2]?' + T'+spdMatch[2]:''):/^T[123](?:\s*\+\s*T[123])?$/i.test(spdSource)?spdSource:'';
        const boardCells=[
          [[['DB/CU reference: ',ref]],[['Location: ',board.location]],[['Supplied from: ',board.suppliedFrom]]],
          [[['Distribution circuit OCPD - BS (EN): ',distributionBs]],[['Type: ',distributionType]],[['Rating / setting (A): ',distributionRating]]],
          [[['SPD type(s): ',spdCertified]],[['RCD - BS (EN): ',board.rcdBs],['  Type: ',board.rcdType]],[['RCD rating (A): ',board.rcdRating],['  IΔn (mA): ',board.rcdIdn]]]
        ];
        doc.autoTable({
          startY:y+3,head:[],
          editResolve:(row,col)=>{
            const keys=[['ref','location','suppliedFrom'],['distributionOcpdBs','distributionOcpdType','distributionOcpdRating'],['spd',['rcdBs','rcdType'],['rcdRating','rcdIdn']]];
            return cert.tables?.boards?.[bi]?[keys[row][col]].flat().map(key=>({scope:'board',kind:'boards',index:bi,key})):[];
          },
          body:boardCells.map(row=>row.map(parts=>parts.map(pair=>pair.join('')).join(''))),
          margin:{left:x,right:10},theme:'grid',
          styles:{fontSize:7.2,cellPadding:2,minCellHeight:11.5,lineColor:LINE,lineWidth:.12,textColor:INK,overflow:'linebreak'},
          columnStyles:{0:{cellWidth:w/3},1:{cellWidth:w/3},2:{cellWidth:w/3}},
          didParseCell:data=>{
            if(data.section==='body')data.cell.text=[''];
          },
          didDrawCell:data=>{
            if(data.section!=='body')return;
            const parts=boardCells[data.row.index]?.[data.column.index]||[];
            const runs=parts.flatMap(([label,value])=>[
              {text:label,bold:true},{text:worksheet?'':String(value??''),bold:false}
            ]);
            writeRuns(doc,runs,data.cell.x+2,data.cell.y+4.9,data.cell.width-4,7.2,3.6,3);
          }
        });
        const circuitStartY=doc.lastAutoTable.finalY+3;
        const cols=[
          ['1','Circuit number','circuitNo'],['2','Circuit description','description'],['3','Type of wiring','wiringType'],['4','Reference method','refMethod'],
          ['5','Number of points served','points'],['6','Live (mm²)','liveCsa'],['7','CPC (mm²)','cpcCsa'],['8','BS (EN)','ocpdBs'],
          ['9','Type','ocpdType'],['10','Rating (A)','ocpdRating'],['11','Breaking capacity (kA)','breakingCapacity'],['12','Maximum permitted Zs (Ω)','maxZs'],
          ['13','BS (EN)','rcdBs'],['14','Type','rcdType'],['15','IΔn (mA)','rcdIdn'],['16','Rating (A)','rcdRating']
        ];
        const rows=[];
        for(let r=0;r<8;r++){
          const item=chunk[r]?.detail||{};
          rows.push(cols.map(c=>{
            let z=item[c[2]];
            if(c[2]==='wiringType'){
              z=wiringCode(z); // Installation notes stay with internal job data, not appended to the IET wiring-type field.
            }
            return worksheet?'':pdfText(z??'');
          }));
        }
        doc.autoTable({
          startY:circuitStartY,
          head:[
            [{content:'CIRCUIT DETAILS',colSpan:16,styles:{fontStyle:'bold',fontSize:7}}],
            [{content:'',colSpan:2},{content:'Conductor details',colSpan:5},{content:'Overcurrent protective device',colSpan:5},{content:'RCD',colSpan:4}],
            cols.map(c=>pdfText(c[1]))
          ],
          body:rows,margin:{left:x,right:10,bottom:28},theme:'grid',rowPageBreak:'avoid',
          styles:{fontSize:6.2,cellPadding:.72,minCellHeight:9,lineColor:LINE,lineWidth:.12,textColor:INK,halign:'center',valign:'middle',overflow:'linebreak'},
          headStyles:{fillColor:[255,255,255],textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
          columnStyles:{0:{cellWidth:10},1:{cellWidth:44,halign:'left'},2:{cellWidth:17},3:{cellWidth:15},4:{cellWidth:15},5:{cellWidth:14},6:{cellWidth:14},7:{cellWidth:22},8:{cellWidth:12},9:{cellWidth:12},10:{cellWidth:17},11:{cellWidth:19},12:{cellWidth:23},13:{cellWidth:14},14:{cellWidth:15},15:{cellWidth:14}}
        });
        const ky=Math.min(doc.internal.pageSize.getHeight()-18,doc.lastAutoTable.finalY+4);
        write(doc,'CODES FOR TYPES OF WIRING',x,ky,w,{size:7.2,bold:true});
        write(doc,'A Thermoplastic insulated/sheathed · B Thermoplastic in metallic conduit · C Thermoplastic in non-metallic conduit · D Thermoplastic in metallic trunking · E Thermoplastic in non-metallic trunking · F Thermoplastic SWA · G Thermosetting SWA · H Mineral insulated · O Other',x,ky+4.5,w,{size:6.1,maxLines:3,lineHeight:3.4});

        doc.addPage('a4','landscape');
        pageFrame(doc,'GENERIC SCHEDULE OF TEST RESULTS',display(cert.number,worksheet,true),schema.standard);
        write(doc,'Distribution board/Consumer unit details',x,y,w,{size:7,bold:true});
        labelValue(doc,'DB/CU reference',display(ref,worksheet,true),x,y+7,45,{labelW:23});
        labelValue(doc,'Zdb Ω',display(board.zdb,worksheet),x+47,y+7,38,{labelW:20,edit:cert.tables?.boards?.[bi]?{scope:'board',kind:'boards',index:bi,key:'zdb'}:null});
        labelValue(doc,'Ipf kA',display(board.ipf,worksheet),x+87,y+7,38,{labelW:12,edit:cert.tables?.boards?.[bi]?{scope:'board',kind:'boards',index:bi,key:'ipf'}:null});
        labelValue(doc,'Correct polarity',display(board.polarity,worksheet),x+127,y+7,50,{labelW:25,edit:cert.tables?.boards?.[bi]?{scope:'board',kind:'boards',index:bi,key:'polarity'}:null});
        labelValue(doc,'Phase sequence',display(board.phaseSequence,worksheet),x+179,y+7,46,{labelW:24,edit:cert.tables?.boards?.[bi]?{scope:'board',kind:'boards',index:bi,key:'phaseSequence'}:null});
        labelValue(doc,'SPD operational',display(board.spdOperational,worksheet),x+227,y+7,w-227,{labelW:25,edit:cert.tables?.boards?.[bi]?{scope:'board',kind:'boards',index:bi,key:'spdOperational'}:null});
        const tcols=[
          ['17','Circuit number','circuitNo'],['18','r1 (line) Ω','r1'],['19','rn (neutral) Ω','rn'],['20','r2 (CPC) Ω','r2'],['21','(R1 + R2) Ω','r1r2'],['22','R2 (Ω)','r2only'],
          ['23','Test voltage (V)','irVoltage'],['24','Live - Live (MΩ)','irLL'],['25','Live - Earth (MΩ)','irLE'],['26','Polarity','polarity'],['27','Maximum measured Zs (Ω)','zs'],
          ['28','Disconnection time (ms)','rcdTime'],['29','Test button operation','rcdButton'],['30','Manual test button operation','afddButton'],['31','Remarks','remarks']
        ];
        const trows=[];
        for(let r=0;r<8;r++){
          const item=chunk[r]||{},d=item.detail||{},t=item.test||{};
          const merged={...d,...t};
          trows.push(tcols.map(col=>{
            if(worksheet)return '';
            const result=String(merged[col[2]]??'').trim();
            if(cert.type==='eicr'&&['polarity','rcdButton','afddButton'].includes(col[2])&&/^(?:✓|✔|✕|✗|pass|fail|yes|no)$/i.test(result))return '';
            return pdfText(result);
          }));
        }
        doc.autoTable({
          startY:y+18,
          head:[
            [{content:'TEST RESULTS',colSpan:15,styles:{fontStyle:'bold',fontSize:7}}],
            [{content:'',colSpan:1},{content:'Continuity (Ohms)',colSpan:5},{content:'Insulation resistance',colSpan:3},{content:'',colSpan:2},{content:'RCD',colSpan:2},{content:'AFDD',colSpan:1},{content:'',colSpan:1}],
            tcols.map(c=>pdfText(c[1]))
          ],
          body:trows,margin:{left:x,right:10,bottom:32},theme:'grid',rowPageBreak:'avoid',
          styles:{fontSize:6.2,cellPadding:.72,minCellHeight:9,lineColor:LINE,lineWidth:.12,textColor:INK,halign:'center',valign:'middle',overflow:'linebreak'},
          headStyles:{fillColor:[255,255,255],textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
          columnStyles:{0:{cellWidth:10},1:{cellWidth:14},2:{cellWidth:14},3:{cellWidth:14},4:{cellWidth:16},5:{cellWidth:13},6:{cellWidth:15},7:{cellWidth:17},8:{cellWidth:17},9:{cellWidth:15},10:{cellWidth:17},11:{cellWidth:19},12:{cellWidth:19},13:{cellWidth:19},14:{cellWidth:58,halign:'left'}},
          didDrawCell:data=>{
            if(worksheet||cert.type!=='eicr'||data.section!=='body'||![9,12,13].includes(data.column.index))return;
            const record=chunk[data.row.index];
            if(!record)return;
            const key=tcols[data.column.index][2];
            const raw=String(record.test?.[key]??record.detail?.[key]??'').trim();
            const tick=/^(?:✓|✔|pass|yes)$/i.test(raw);
            const cross=/^(?:✕|✗|fail|no)$/i.test(raw);
            if(!tick&&!cross)return;
            const cell=data.cell,cx=cell.x+cell.width/2,cy=cell.y+cell.height/2;
            doc.setLineWidth(.45);
            doc.setDrawColor(...(tick?BLUE:[170,35,35]));
            if(tick){
              doc.line(cx-2,cy,cx-.6,cy+1.5);
              doc.line(cx-.6,cy+1.5,cx+2.6,cy-2);
            }else{
              doc.line(cx-2,cy-2,cx+2,cy+2);
              doc.line(cx-2,cy+2,cx+2,cy-2);
            }
            doc.setLineWidth(.12);
          }
        });
        const ty=Math.min(doc.internal.pageSize.getHeight()-31,doc.lastAutoTable.finalY+3);
        const ff=cert.fields||{};
        const testedBy=ff.testedBy||ff.inspector||ff.singleSignatoryName||'';
        const testedDate=ff.testedDate||ff.inspectionDate||ff.singleSignatoryDate||'';
        const testedSignature=ff.inspectorSignature||ff.singleSignatorySignature||'';
        const signatureLine=worksheet?'':String(testedSignature||'').trim()||'N/A';
        write(doc,'Details of test instruments used (serial and/or asset numbers)',x,ty,w,{size:7.2,bold:true});
        const instrumentDetails=[
          ['Multifunction: ',ff.testerSerial],
          ['Continuity: ',ff.instrumentContinuity],
          ['Insulation resistance: ',ff.instrumentInsulation],
          ['Earth fault loop impedance: ',ff.instrumentLoop],
          ['RCD: ',ff.instrumentRcd],
          ['Earth electrode resistance: ',ff.instrumentEarth]
        ];
        instrumentDetails.forEach(([label,value],idx)=>{
          const col=idx%3,row=Math.floor(idx/3);
          const xx=x+col*(w/3);
          writeRuns(doc,[
            {text:label,bold:true},
            {text:worksheet?'':String(value??'').trim()||'N/A',bold:false}
          ],xx,ty+5+row*5.1,w/3-3,6.7,3.5,2);
        });
        writeRuns(doc,[
          {text:'Tested by name (Capitals): ',bold:true},
          {text:worksheet?'':String(testedBy||'').trim().toUpperCase()||'N/A',bold:false}
        ],x,ty+17,107,7.2,4,2);
        writeRuns(doc,[
          {text:'Signature: ',bold:true},
          {text:signatureLine,bold:false}
        ],x+110,ty+17,95,7.2,4,2);
        writeRuns(doc,[
          {text:'Date: ',bold:true},
          {text:worksheet?'':fmtDate(testedDate)||'N/A',bold:false}
        ],x+207,ty+17,w-207,7.2,4,2);
      });
    });
  }

  function renderGeneric(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet;
    let y=pageFrame(doc,schema.name.toUpperCase(),display(cert.number,worksheet,true),schema.standard);
    const x=10,w=190;
    schema.sections.forEach(part=>{
      if(part.type==='section'){
        const rows=part.fields.map(field=>{
          const current=field.type==='date'?fmtDate(cert.fields?.[field.key]):String(cert.fields?.[field.key]||'');
          const value=worksheet && field.type==='select' && Array.isArray(field.options) && field.options.length<=8
            ? field.options.map(o=>'[ ] '+pdfText(o)).join('   ')
            : (worksheet?'':pdfText(current));
          return [pdfText(field.label),value];
        });
        const needed=9+rows.length*7;
        if(y+Math.min(needed,55)>281){
          doc.addPage('a4','portrait');y=pageFrame(doc,schema.name.toUpperCase(),display(cert.number,worksheet,true),schema.standard);
        }
        doc.autoTable({
          startY:y,
          head:[[part.title.toUpperCase(),'']],
          body:rows,
          margin:{left:x,right:10,top:26,bottom:12},
          theme:'grid',rowPageBreak:'avoid',
          styles:{fontSize:6.2,cellPadding:1.2,minCellHeight:6,lineColor:LINE,lineWidth:.12,textColor:INK},
          headStyles:{fillColor:PALE,textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
          columnStyles:{0:{cellWidth:75,fontStyle:'bold'},1:{cellWidth:115}},
          didDrawPage:()=>pageFrame(doc,schema.name.toUpperCase(),display(cert.number,worksheet,true),schema.standard)
        });
        y=doc.lastAutoTable.finalY+4;
      } else if(part.type==='table'){
        const rows=safeRows(cert.tables?.[part.key]);
        if(y>225){doc.addPage('a4','portrait');y=pageFrame(doc,schema.name.toUpperCase(),display(cert.number,worksheet,true),schema.standard);}
        // Wide specialist records (e.g. PAT with 14 per-item columns) are
        // printed vertically per asset so every measured value remains legible.
        if(part.columns.length>8){
          if(!rows.length)return;
          rows.forEach((row,i)=>{
            if(y>215){doc.addPage('a4','portrait');y=pageFrame(doc,schema.name.toUpperCase(),display(cert.number,worksheet,true),schema.standard);}
            doc.autoTable({
              startY:y,head:[[part.title.toUpperCase()+' · ITEM '+(i+1),'']],
              body:part.columns.map(c=>[pdfText(c.label),worksheet?'':pdfText(row?.[c.key]??'')]),
              margin:{left:x,right:10,top:26,bottom:12},
              theme:'grid',rowPageBreak:'avoid',
              styles:{fontSize:7,cellPadding:1.3,minCellHeight:6,lineColor:LINE,lineWidth:.12,textColor:INK},
              headStyles:{fillColor:PALE,textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
              columnStyles:{0:{cellWidth:78,fontStyle:'bold'},1:{cellWidth:112}},
              didDrawPage:()=>pageFrame(doc,schema.name.toUpperCase(),display(cert.number,worksheet,true),schema.standard)
            });
            y=doc.lastAutoTable.finalY+4;
          });
          return;
        }
        doc.autoTable({
          startY:y,
          head:[[...part.columns.map(c=>c.label)]],
          body:rows.map(r=>part.columns.map(c=>worksheet?'':pdfText(r?.[c.key]||''))),
          margin:{left:x,right:10,top:26,bottom:12},theme:'grid',rowPageBreak:'avoid',
          styles:{fontSize:5.6,cellPadding:1,minCellHeight:6,lineColor:LINE,lineWidth:.12,textColor:INK},
          headStyles:{fillColor:PALE,textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
          didDrawPage:()=>pageFrame(doc,schema.name.toUpperCase(),display(cert.number,worksheet,true),schema.standard)
        });
        y=doc.lastAutoTable.finalY+4;
      }
    });
  }

  function build({cert,schema,settings={},worksheet=false,editable=false}){
    BRAND=String(settings.companyName||'Sperin Services').slice(0,58);
    const colour=/^#[0-9a-f]{6}$/i.test(settings.reportAccent||'')?settings.reportAccent:'#1869d3';
    const rgb=[parseInt(colour.slice(1,3),16),parseInt(colour.slice(3,5),16),parseInt(colour.slice(5,7),16)];
    BLUE.splice(0,3,...rgb);
    const C=window.jspdf?.jsPDF;
    if(!C) throw new Error('PDF engine unavailable');
    const doc=new C({unit:'mm',format:'a4',orientation:['eic','eicr'].includes(cert.type)?'landscape':'portrait'});
    // A4 print at 100% without opposite-side registration or double-sided
    // binding offsets in PDF readers that honour PDF ViewerPreferences.
    if(typeof doc.viewerPreferences==='function')doc.viewerPreferences({PrintScaling:'None',Duplex:'Simplex'});
    if(typeof doc.autoTable!=='function') throw new Error('PDF table engine unavailable');
    if(editable)window.SperinPdfEditMap?.install(doc,cert,schema);
    doc.__sperinWorksheet=!!worksheet;
    doc.__sperinSheetId=worksheet?String(cert.siteSheetId||''):'';
    const logo=typeof settings.reportLogo==='string'?settings.reportLogo:'';
    const m=/^data:image\/(png|jpeg);base64,/.exec(logo);
    if(m&&logo.length<=790000)doc.__sperinLogo={data:logo,format:m[1]==='png'?'PNG':'JPEG'};
    const opts={worksheet,settings};
    if(cert.type==='eic')renderEic(doc,cert,schema,opts);
    else if(cert.type==='eicr')renderEicrLandscape(doc,cert,schema,opts);
    else if(cert.type==='minor')renderMinor(doc,cert,schema,opts);
    else renderGeneric(doc,cert,schema,opts);
    if(['pat','ev','solar','commercialFire'].includes(cert.type)){
      for(let page=1;page<=doc.getNumberOfPages();page++){
        doc.setPage(page);
        const width=doc.internal.pageSize.getWidth();
        const height=doc.internal.pageSize.getHeight();
        doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(175,38,43);
        doc.text('DRAFT SPECIALIST RECORD - TECHNICAL REVIEW REQUIRED',width/2,height-12,{align:'center'});
        doc.setTextColor(20,28,38);
      }
    }
    if(!worksheet && cert.signatureApprovedAt && settings.reportSignature){
      const file=String(settings.reportSignature||'');
      const signed=/^data:image\/(png|jpeg);base64,/.exec(file);
      if(signed&&file.length<790000){
        // Add a separate and explicitly authorised sign-off: never overlay mandatory form test values.
        doc.addPage('a4','portrait');
        pageFrame(doc,'AUTHORISED SIGNATURE ATTACHMENT',String(cert.number||''),schema.standard);
        const name=String(cert.signatureApprovedBy||'Authorised electrician').slice(0,80);
        doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...INK);
        doc.text('Recorded signature: '+name,16,37);
        doc.addImage(file,signed[1]==='png'?'PNG':'JPEG',16,44,75,23,undefined,'FAST');
        doc.setFont('helvetica','normal');doc.setFontSize(8);
        doc.text('Applied to this certificate with explicit user approval on '+String(cert.signatureApprovedAt).slice(0,19),16,76);
        doc.text('The signatory remains responsible for independent verification of inspections and test results.',16,83);
      }
    }
    drawPageFooterAll(doc);
    return doc;
  }

  window.SperinIetForms={build};
})();
