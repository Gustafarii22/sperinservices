(() => {
  'use strict';

  const NAVY=[7,17,31], BLUE=[24,105,211], PALE=[240,246,253], INK=[22,28,36], GREY=[78,88,101], LINE=[55,61,69];
  const BRAND='Sperin Services';

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
  function pageFrame(doc,title,number,standard){
    const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
    doc.setDrawColor(...BLUE);doc.setLineWidth(.55);doc.rect(5,5,w-10,h-10);
    doc.setFillColor(...BLUE);doc.rect(5,5,1.8,h-10,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7.4);doc.setTextColor(...NAVY);doc.text(BRAND.toUpperCase(),10,9);
    doc.setFont('helvetica','normal');doc.setFontSize(5.3);doc.setTextColor(...GREY);doc.text('ELECTRICAL CERTIFICATION',10,12.6);
    doc.setDrawColor(...BLUE);doc.setLineWidth(.25);doc.line(10,14,w-10,14);
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...INK);doc.text(String(title||''),10,20);
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.text((number?'Certificate/Report No.: '+number:'')+(standard?'   ·   '+standard:''),w-10,20,{align:'right'});
    doc.setDrawColor(...LINE);doc.setLineWidth(.16);
    return 24;
  }
  function footer(doc,page,total){
    const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
    doc.setFont('helvetica','normal');doc.setFontSize(5.2);doc.setTextColor(...GREY);
    if(doc.__sperinWorksheet){
      doc.setTextColor(...BLUE);doc.setFont('helvetica','bold');doc.setFontSize(5.4);
      doc.text('MULTIPLE CHOICE: MARK ONE BOX WITH X. DO NOT CIRCLE OR CROSS OUT THE OTHER OPTIONS.',w/2,h-10,{align:'center'});
    }
    doc.setFont('helvetica','normal');doc.setFontSize(5.2);doc.setTextColor(...GREY);
    doc.text(BRAND+' - Page '+page+' of '+total,w/2,h-7,{align:'center'});
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
    const single=String(f.signatoryMode||'').startsWith('One person');
    if(single){
      return {
        name:f.singleSignatoryName||f.inspector||f.designer1||f.constructor||'',
        company:f.singleSignatoryCompany||f.inspectorCompany||f.designerCompany||f.constructorCompany||'',
        address:f.singleSignatoryAddress||f.inspectorAddress||f.designerAddress||f.constructorAddress||'',
        postcode:f.singleSignatoryPostcode||f.inspectorPostcode||f.designerPostcode||f.constructorPostcode||'',
        phone:f.singleSignatoryPhone||f.inspectorPhone||f.designerPhone||f.constructorPhone||'',
        signature:f.singleSignatorySignature||f.inspectorSignature||f.designer1Signature||f.constructorSignature||'',
        date:f.singleSignatoryDate||f.inspectionDate||f.designer1Date||f.constructorDate||''
      };
    }
    if(role==='designer')return {name:f.designer1||'',company:f.designerCompany||'',address:f.designerAddress||'',postcode:f.designerPostcode||'',phone:f.designerPhone||'',signature:f.designer1Signature||'',date:f.designer1Date||''};
    if(role==='constructor')return {name:f.constructor||'',company:f.constructorCompany||'',address:f.constructorAddress||'',postcode:f.constructorPostcode||'',phone:f.constructorPhone||'',signature:f.constructorSignature||'',date:f.constructorDate||''};
    return {name:f.inspector||'',company:f.inspectorCompany||'',address:f.inspectorAddress||'',postcode:f.inspectorPostcode||'',phone:f.inspectorPhone||'',signature:f.inspectorSignature||'',date:f.inspectionDate||''};
  }
  function display(value,worksheet,keep=false){return worksheet&&!keep?'':String(value||'');}
  function safeRows(rows){return Array.isArray(rows)?rows:[];}
  function boardRows(cert){
    const boards=safeRows(cert.tables?.boards);
    if(boards.length)return boards;
    return [{ref:cert.fields?.dbReference||'DB1',location:cert.fields?.dbLocation||'',suppliedFrom:cert.fields?.suppliedFrom||'',mainSwitch:cert.fields?.distributionOcpd||'',rcd:cert.fields?.dbRcd||'',spd:cert.fields?.dbSpd||'',zdb:cert.fields?.zdb||'',ipf:cert.fields?.dbIpf||''}];
  }
  function circuitsForBoard(cert,boardRef){
    const circuits=safeRows(cert.tables?.circuits),tests=safeRows(cert.tables?.tests);
    const list=[];
    circuits.forEach((row,i)=>{
      const br=String(row.boardRef||'DB1');
      if(br===String(boardRef||'DB1')) list.push({detail:row,test:tests[i]||{},index:i});
    });
    return list;
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
    const worksheet=!!opts.worksheet, f=cert.fields||{};
    doc.setPage(1);let y=pageFrame(doc,'ELECTRICAL INSTALLATION CERTIFICATE',display(cert.number,worksheet,true),schema.standard);
    const x=10,w=190;
    let top=box(doc,x,y,w,15,'SECTION A: DETAILS OF THE CLIENT');
    labelValue(doc,'Client',display(f.clientName,worksheet),x+2,top+6,w-4,{labelW:24});
    y+=16;

    top=box(doc,x,y,w,48,'SECTION B: INSTALLATION DETAILS');
    labelValue(doc,'Installation address',display(f.installationAddress,worksheet),x+2,top+6,w-4,{labelW:35,maxLines:2});
    doc.setDrawColor(...LINE);doc.line(x,top+13,x+w,top+13);
    write(doc,'DESCRIPTION AND EXTENT OF THE INSTALLATION',x+2,top+18,w-4,{size:6.7,bold:true});
    labelValue(doc,'Description of installation',display(f.description,worksheet),x+2,top+24,w-47,{labelW:37,maxLines:2});
    checkbox(doc,x+w-39,top+23,yes(f.workType,'New installation')&&!worksheet,'New installation',{fontSize:6.1,labelWidth:32});
    labelValue(doc,'Extent of installation covered by this Certificate',display(f.extent,worksheet),x+2,top+33,w-47,{labelW:54,maxLines:2});
    checkbox(doc,x+w-39,top+31,/adding/i.test(String(f.workType||''))&&!worksheet,'Adding to existing',{fontSize:6.1,labelWidth:31});
    checkbox(doc,x+w-39,top+39,/alteration/i.test(String(f.workType||''))&&!worksheet,'Alteration',{fontSize:6.1,labelWidth:28});
    y+=49;

    const d=signatory(cert,'designer'),c=signatory(cert,'constructor'),i=signatory(cert,'inspector');
    top=box(doc,x,y,w,155,'SECTION C: CERTIFICATION SIGNATORIES');
    write(doc,'FOR DESIGN',x+2,top+6,w-4,{size:7,bold:true});
    write(doc,'I/We certify that the design work described above has been carried out with reasonable skill and care and, except for any departures recorded below, is in accordance with BS 7671:2018 as amended.',x+2,top+11,w-4,{size:6.1,lineHeight:3,maxLines:3});
    multilineValue(doc,'Details of departures from BS 7671',display(f.designDepartures,worksheet),x+2,top+22,w-4,15,{labelSize:6.1});
    multilineValue(doc,'Details of permitted exceptions / risk assessment',display(f.permittedExceptions,worksheet),x+2,top+37,w-4,16,{labelSize:6.1});
    checkbox(doc,x+w-39,top+50,yes(f.riskAssessmentAttached,'Yes')&&!worksheet,'Risk assessment attached',{fontSize:5.8,labelWidth:34});
    labelValue(doc,'Signature',display(d.signature,worksheet),x+2,top+59,60,{labelW:16});
    labelValue(doc,'Date',worksheet?'':fmtDate(d.date),x+64,top+59,34,{labelW:10});
    labelValue(doc,'Name (IN BLOCK CAPITALS)',display(d.name,worksheet),x+100,top+59,88,{labelW:42});

    doc.line(x,top+66,x+w,top+66);
    write(doc,'FOR CONSTRUCTION',x+2,top+72,w-4,{size:7,bold:true});
    write(doc,'I certify that the construction work described above has been carried out with reasonable skill and care and, except for any departures recorded below, is in accordance with BS 7671:2018 as amended.',x+2,top+77,w-4,{size:6.1,lineHeight:3,maxLines:3});
    multilineValue(doc,'Details of departures from BS 7671',display(f.constructionDepartures,worksheet),x+2,top+88,w-4,13,{labelSize:6.1});
    labelValue(doc,'Signature',display(c.signature,worksheet),x+2,top+106,60,{labelW:16});
    labelValue(doc,'Date',worksheet?'':fmtDate(c.date),x+64,top+106,34,{labelW:10});
    labelValue(doc,'Name (IN BLOCK CAPITALS)',display(c.name,worksheet),x+100,top+106,88,{labelW:42});

    doc.line(x,top+113,x+w,top+113);
    write(doc,'FOR INSPECTION AND TESTING',x+2,top+119,w-4,{size:7,bold:true});
    write(doc,'I certify that the inspection and testing described above has been carried out with reasonable skill and care and, except for any departures recorded below, is in accordance with BS 7671:2018 as amended.',x+2,top+124,w-4,{size:6.1,lineHeight:3,maxLines:3});
    multilineValue(doc,'Details of departures from BS 7671',display(f.inspectionDepartures,worksheet),x+2,top+135,w-4,11,{labelSize:6.1});
    labelValue(doc,'Signature',display(i.signature,worksheet),x+2,top+150,60,{labelW:16});
    labelValue(doc,'Date',worksheet?'':fmtDate(i.date),x+64,top+150,34,{labelW:10});
    labelValue(doc,'Name (IN BLOCK CAPITALS)',display(i.name,worksheet),x+100,top+150,88,{labelW:42});
    y+=156;

    top=box(doc,x,y,w,22,'SECTION D: NEXT INSPECTION');
    write(doc,'I/We recommend that this installation is further inspected and tested after an interval of not more than:',x+2,top+6,w-4,{size:6.2});
    labelValue(doc,'Interval',display(f.nextInspectionInterval,worksheet),x+2,top+13,w-4,{labelW:25});
    doc.addPage('a4','portrait');

    doc.setPage(2);y=pageFrame(doc,'ELECTRICAL INSTALLATION CERTIFICATE',display(cert.number,worksheet,true),schema.standard);
    top=box(doc,x,y,w,49,'SECTION E: PARTICULARS OF SIGNATORIES IN SECTION C');
    const parties=[['Designer (No 1)',d],['Constructor',c],['Inspector',i]];
    parties.forEach((entry,idx)=>{
      const yy=top+6+idx*13;
      write(doc,entry[0],x+2,yy,29,{size:6.4,bold:true});
      labelValue(doc,'Name',display(entry[1].name,worksheet),x+31,yy,53,{labelW:12});
      labelValue(doc,'For/on behalf of',display(entry[1].company,worksheet),x+86,yy,54,{labelW:24});
      labelValue(doc,'Tel No.',display(entry[1].phone,worksheet),x+142,yy,46,{labelW:14});
      labelValue(doc,'Address',display(entry[1].address,worksheet),x+31,yy+5,110,{labelW:16,maxLines:1});
      labelValue(doc,'Postcode',display(entry[1].postcode,worksheet),x+142,yy+5,46,{labelW:17});
    });
    y+=50;

    top=box(doc,x,y,w,47,'SECTION F: SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS');
    labelValue(doc,'Earthing arrangement',display(f.earthingArrangement,worksheet),x+2,top+6,43,{labelW:24});
    labelValue(doc,'Number and type of live conductors',display(f.liveConductors,worksheet),x+47,top+6,58,{labelW:31});
    labelValue(doc,'Supply',display(f.supplyACDC,worksheet),x+107,top+6,30,{labelW:12});
    labelValue(doc,'Nominal voltage U/U0 (V)',display(f.nominalVoltage,worksheet),x+2,top+15,52,{labelW:31});
    labelValue(doc,'Nominal frequency (Hz)',display(f.frequency,worksheet),x+56,top+15,45,{labelW:28});
    labelValue(doc,'Prospective fault current Ipf (kA)',display(f.ipf,worksheet),x+103,top+15,45,{labelW:31});
    labelValue(doc,'External earth fault loop impedance Ze (Ω)',display(f.ze,worksheet),x+150,top+15,38,{labelW:30});
    write(doc,'Supply protective device',x+2,top+25,45,{size:6.4,bold:true});
    labelValue(doc,'BS (EN)',display(f.supplyDeviceBs,worksheet),x+2,top+31,46,{labelW:14});
    labelValue(doc,'Type',display(f.supplyDeviceType,worksheet),x+50,top+31,35,{labelW:10});
    labelValue(doc,'Rated current (A)',display(f.supplyDeviceRating,worksheet),x+87,top+31,45,{labelW:23});
    labelValue(doc,'Breaking capacity (kA)',display(f.supplyBreakingCapacity,worksheet),x+134,top+31,54,{labelW:28});
    labelValue(doc,'Confirmation of supply polarity',display(f.supplyPolarity,worksheet),x+2,top+40,90,{labelW:39});
    labelValue(doc,'Other sources of supply',display(f.otherSources,worksheet),x+96,top+40,92,{labelW:32});
    y+=48;

    top=box(doc,x,y,w,74,'SECTION G: PARTICULARS OF INSTALLATION REFERRED TO IN THE CERTIFICATE');
    labelValue(doc,'Means of earthing',display(f.meansOfEarthing,worksheet),x+2,top+6,57,{labelW:26});
    labelValue(doc,'Maximum demand',display(f.maximumDemand,worksheet)+' '+display(f.maximumDemandUnit,worksheet),x+61,top+6,56,{labelW:27});
    labelValue(doc,'Earth electrode type',display(f.earthElectrodeType,worksheet),x+119,top+6,69,{labelW:27});
    labelValue(doc,'Earth electrode location',display(f.earthElectrodeLocation,worksheet),x+2,top+13,92,{labelW:31});
    labelValue(doc,'RA/Ze (Ω)',display(f.earthElectrodeResistance,worksheet),x+96,top+13,92,{labelW:17});
    write(doc,'Main Protective Conductors',x+2,top+22,55,{size:6.5,bold:true});
    labelValue(doc,'Earthing conductor material',display(f.earthingConductorMaterial,worksheet),x+2,top+29,56,{labelW:34});
    labelValue(doc,'csa mm²',display(f.earthingConductorCsa,worksheet),x+60,top+29,35,{labelW:15});
    labelValue(doc,'Continuity verified',display(f.earthingContinuity,worksheet),x+97,top+29,40,{labelW:24});
    labelValue(doc,'Bonding conductor material',display(f.bondingMaterial,worksheet),x+2,top+36,56,{labelW:34});
    labelValue(doc,'csa mm²',display(f.bondingCsa,worksheet),x+60,top+36,35,{labelW:15});
    labelValue(doc,'Continuity verified',display(f.bondingContinuity,worksheet),x+97,top+36,40,{labelW:24});
    labelValue(doc,'Main protective bonding to',display(f.bondingTo,worksheet),x+139,top+29,49,{labelW:31,maxLines:2});
    write(doc,'Main switch (Isolation device / Switch-fuse / Circuit-breaker / RCD etc.)',x+2,top+47,w-4,{size:6.5,bold:true});
    labelValue(doc,'Location',display(f.mainSwitchLocation,worksheet),x+2,top+54,45,{labelW:14});
    labelValue(doc,'BS (EN)',display(f.mainSwitchBs,worksheet),x+49,top+54,35,{labelW:14});
    labelValue(doc,'No. poles',display(f.mainSwitchPoles,worksheet),x+86,top+54,31,{labelW:16});
    labelValue(doc,'Current A',display(f.mainSwitchCurrent,worksheet),x+119,top+54,31,{labelW:15});
    labelValue(doc,'Voltage V',display(f.mainSwitchVoltage,worksheet),x+152,top+54,36,{labelW:15});
    labelValue(doc,'OCPD type/setting',display(f.mainSwitchDeviceType,worksheet),x+2,top+63,55,{labelW:27});
    labelValue(doc,'Breaking kA',display(f.mainSwitchBreaking,worksheet),x+59,top+63,38,{labelW:19});
    labelValue(doc,'RCD type',display(f.mainRcdType,worksheet),x+99,top+63,32,{labelW:17});
    labelValue(doc,'IΔn mA',display(f.mainRcdIdn,worksheet),x+133,top+63,27,{labelW:14});
    labelValue(doc,'Delay ms',display(f.mainRcdDelay,worksheet),x+162,top+63,26,{labelW:15});
    y+=75;

    top=box(doc,x,y,w,62,'SECTION H: SCHEDULE OF INSPECTIONS');
    const rows=safeRows(cert.tables?.eicInspection);
    doc.autoTable({
      startY:top+1,
      head:[['Item No.','Description','Outcome: Satisfactory / N/A','Item No.','Description','Outcome: Satisfactory / N/A']],
      body:Array.from({length:7},(_,r)=>{
        const a=rows[r]||{},b=rows[r+7]||{};
        return [a.item||'',a.description||'',worksheet?'':pdfText(a.outcome||''),b.item||'',b.description||'',worksheet?'':pdfText(b.outcome||'')];
      }),
      margin:{left:x,right:210-(x+w)},tableWidth:w,theme:'grid',
      styles:{fontSize:5.3,cellPadding:.8,minCellHeight:6.2,lineColor:LINE,lineWidth:.12,textColor:INK,valign:'middle'},
      headStyles:{fillColor:[255,255,255],textColor:INK,fontStyle:'bold',lineColor:LINE,lineWidth:.12},
      columnStyles:{0:{cellWidth:12},1:{cellWidth:61},2:{cellWidth:18,halign:'center'},3:{cellWidth:12},4:{cellWidth:61},5:{cellWidth:18,halign:'center'}}
    });
    y=doc.lastAutoTable.finalY+2;
    top=box(doc,x,y,w,18,'SECTION I: COMMENTS ON EXISTING INSTALLATION');
    multilineValue(doc,'',display(f.existingComments,worksheet),x+1,top+1,w-2,10,{labelSize:1});
    y+=19;
    top=box(doc,x,y,w,17,'SECTION J: SCHEDULES');
    const boardCount=boardRows(cert).length,circuitCount=safeRows(cert.tables?.circuits).length;
    write(doc,'Continuation sheet(s): ________   Schedule(s) of Inspection: 1   Schedule(s) of Circuit Details / Test Results: '+Math.max(1,boardCount),x+2,top+6,w-4,{size:6.2});
    write(doc,'The schedules and continuation sheets listed form part of this certificate.',x+2,top+12,w-4,{size:5.8});
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

  function renderEicr(doc,cert,schema,opts){
    const worksheet=!!opts.worksheet,f=cert.fields||{},x=10,w=190;
    doc.setPage(1);let y=pageFrame(doc,'ELECTRICAL INSTALLATION CONDITION REPORT',display(cert.number,worksheet,true),schema.standard);
    let top=box(doc,x,y,w,18,'SECTION A: DETAILS OF THE PERSON ORDERING THE REPORT');
    labelValue(doc,'Name',display(f.clientName,worksheet),x+2,top+6,w-4,{labelW:15});
    labelValue(doc,'Address',display(f.clientAddress,worksheet),x+2,top+12,w-4,{labelW:18,maxLines:1});y+=19;

    top=box(doc,x,y,w,20,'SECTION B: REASON FOR PRODUCING THIS REPORT');
    labelValue(doc,'Reason',display(f.reason,worksheet),x+2,top+6,w-4,{labelW:18,maxLines:2});
    labelValue(doc,'Date(s) inspection and testing carried out',display(f.inspectionDates,worksheet),x+2,top+13,w-4,{labelW:52});y+=21;

    top=box(doc,x,y,w,42,'SECTION C: DETAILS OF THE INSTALLATION WHICH IS THE SUBJECT OF THIS REPORT');
    labelValue(doc,'Occupier',display(f.occupier,worksheet),x+2,top+6,62,{labelW:18});
    labelValue(doc,'Installation address',display(f.installationAddress,worksheet),x+66,top+6,122,{labelW:34,maxLines:2});
    labelValue(doc,'Description of premises',display(f.premisesType,worksheet)+' '+display(f.premisesOther,worksheet),x+2,top+15,w-4,{labelW:34});
    labelValue(doc,'Estimated age of wiring system (years)',display(f.age,worksheet),x+2,top+23,65,{labelW:46});
    labelValue(doc,'Evidence of additions/alterations',display(f.additionsEvidence,worksheet),x+69,top+23,63,{labelW:39});
    labelValue(doc,'Estimated age if yes',display(f.additionsAge,worksheet),x+134,top+23,54,{labelW:31});
    labelValue(doc,'Installation records available',display(f.recordsAvailable,worksheet),x+2,top+31,72,{labelW:38});
    labelValue(doc,'Date of last inspection',worksheet?'':fmtDate(f.lastInspection),x+76,top+31,56,{labelW:29});y+=43;

    top=box(doc,x,y,w,56,'SECTION D: EXTENT AND LIMITATIONS OF INSPECTION AND TESTING');
    labelValue(doc,'Parts of installation inspected and tested',display(f.extentInspected,worksheet),x+2,top+7,w-4,{labelW:52,maxLines:2});
    labelValue(doc,'Agreed limitations including reasons',display(f.agreedLimitations,worksheet),x+2,top+18,w-4,{labelW:46,maxLines:2});
    labelValue(doc,'Agreed with',display(f.agreedWith,worksheet),x+2,top+29,90,{labelW:22});
    labelValue(doc,'Operational limitations including reasons',display(f.operationalLimitations,worksheet),x+2,top+38,w-4,{labelW:50,maxLines:2});
    labelValue(doc,'Inspection carried out to BS 7671 amended to',display(f.standardAmendedTo,worksheet),x+2,top+49,w-4,{labelW:57});y+=57;

    top=box(doc,x,y,w,40,'SECTION E: SUMMARY OF THE CONDITION OF THE INSTALLATION');
    labelValue(doc,'Overall assessment',display(f.overallAssessment,worksheet),x+2,top+7,80,{labelW:31});
    labelValue(doc,'General condition of the installation in terms of electrical safety',display(f.generalCondition,worksheet),x+2,top+16,w-4,{labelW:68,maxLines:4});y+=41;

    top=box(doc,x,y,w,28,'SECTION F: RECOMMENDATION FOR NEXT INSPECTION');
    labelValue(doc,'Further inspection recommended before',worksheet?'':fmtDate(f.nextInspectionDate),x+2,top+7,w-4,{labelW:48});
    labelValue(doc,'Reason for recommended interval',display(f.nextInspectionReason,worksheet),x+2,top+16,w-4,{labelW:43,maxLines:2});y+=29;

    top=box(doc,x,y,w,47,'SECTION G: DECLARATION');
    write(doc,'I/We declare that the information in this report, including observations and attached schedules, provides an accurate assessment of the condition of the electrical installation, taking into account the stated extent and limitations.',x+2,top+7,w-4,{size:6.2,lineHeight:3,maxLines:4});
    write(doc,'Inspected and tested by:',x+2,top+22,80,{size:6.3,bold:true});
    labelValue(doc,'Name',display(f.inspectedBy,worksheet),x+2,top+29,80,{labelW:15});
    labelValue(doc,'Signature',display(f.inspectorSignature,worksheet),x+2,top+36,80,{labelW:20});
    write(doc,'Report authorised for issue by:',x+98,top+22,90,{size:6.3,bold:true});
    labelValue(doc,'Name',display(f.authorisedBy,worksheet),x+98,top+29,90,{labelW:15});
    labelValue(doc,'Signature',display(f.authoriserSignature,worksheet),x+98,top+36,90,{labelW:20});

    doc.addPage('a4','portrait');doc.setPage(2);y=pageFrame(doc,'ELECTRICAL INSTALLATION CONDITION REPORT',display(cert.number,worksheet,true),schema.standard);
    top=box(doc,x,y,w,18,'SECTION H: SCHEDULES AND CONTINUATION SHEET(S) ATTACHED');
    labelValue(doc,'Continuation sheet(s)',display(f.continuationSheets,worksheet),x+2,top+6,60,{labelW:34});
    labelValue(doc,'Schedule(s) of Inspection',display(f.inspectionSchedules,worksheet),x+64,top+6,60,{labelW:39});
    labelValue(doc,'Circuit Details / Test Results',display(f.circuitSchedules,worksheet),x+126,top+6,62,{labelW:39});y+=19;

    top=box(doc,x,y,w,47,'SECTION I: SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS');
    labelValue(doc,'Earthing arrangement',display(f.earthingArrangement,worksheet),x+2,top+6,43,{labelW:24});
    labelValue(doc,'Number and type of live conductors',display(f.liveConductors,worksheet),x+47,top+6,58,{labelW:31});
    labelValue(doc,'Supply',display(f.supplyACDC,worksheet),x+107,top+6,30,{labelW:12});
    labelValue(doc,'Nominal voltage U/U0 (V)',display(f.nominalVoltage,worksheet),x+2,top+15,52,{labelW:31});
    labelValue(doc,'Nominal frequency (Hz)',display(f.frequency,worksheet),x+56,top+15,45,{labelW:28});
    labelValue(doc,'Prospective fault current Ipf (kA)',display(f.ipf,worksheet),x+103,top+15,45,{labelW:31});
    labelValue(doc,'External earth fault loop impedance Ze (Ω)',display(f.ze,worksheet),x+150,top+15,38,{labelW:30});
    write(doc,'Supply protective device',x+2,top+25,45,{size:6.4,bold:true});
    labelValue(doc,'BS (EN)',display(f.supplyDeviceBs,worksheet),x+2,top+31,46,{labelW:14});
    labelValue(doc,'Type',display(f.supplyDeviceType,worksheet),x+50,top+31,35,{labelW:10});
    labelValue(doc,'Rated current (A)',display(f.supplyDeviceRating,worksheet),x+87,top+31,45,{labelW:23});
    labelValue(doc,'Breaking capacity (kA)',display(f.supplyBreakingCapacity,worksheet),x+134,top+31,54,{labelW:28});
    labelValue(doc,'Confirmation of supply polarity',display(f.supplyPolarity,worksheet),x+2,top+40,90,{labelW:39});
    labelValue(doc,'Other sources of supply',display(f.otherSources,worksheet),x+96,top+40,92,{labelW:32});y+=48;

    top=box(doc,x,y,w,76,'SECTION J: PARTICULARS OF INSTALLATION REFERRED TO IN THE CERTIFICATE');
    labelValue(doc,'Means of earthing',display(f.meansOfEarthing,worksheet),x+2,top+6,57,{labelW:26});
    labelValue(doc,'Maximum demand',display(f.maximumDemand,worksheet)+' '+display(f.maximumDemandUnit,worksheet),x+61,top+6,56,{labelW:27});
    labelValue(doc,'Earth electrode type',display(f.earthElectrodeType,worksheet),x+119,top+6,69,{labelW:27});
    labelValue(doc,'Earth electrode location',display(f.earthElectrodeLocation,worksheet),x+2,top+13,92,{labelW:31});
    labelValue(doc,'RA/Ze (Ω)',display(f.earthElectrodeResistance,worksheet),x+96,top+13,92,{labelW:17});
    write(doc,'Main Protective Conductors',x+2,top+22,55,{size:6.5,bold:true});
    labelValue(doc,'Earthing conductor material',display(f.earthingConductorMaterial,worksheet),x+2,top+29,56,{labelW:34});
    labelValue(doc,'csa mm²',display(f.earthingConductorCsa,worksheet),x+60,top+29,35,{labelW:15});
    labelValue(doc,'Continuity verified',display(f.earthingContinuity,worksheet),x+97,top+29,40,{labelW:24});
    labelValue(doc,'Bonding conductor material',display(f.bondingMaterial,worksheet),x+2,top+36,56,{labelW:34});
    labelValue(doc,'csa mm²',display(f.bondingCsa,worksheet),x+60,top+36,35,{labelW:15});
    labelValue(doc,'Continuity verified',display(f.bondingContinuity,worksheet),x+97,top+36,40,{labelW:24});
    labelValue(doc,'Main protective bonding to',display(f.bondingTo,worksheet),x+139,top+29,49,{labelW:31,maxLines:2});
    write(doc,'Main switch (Isolation device / Switch-fuse / Circuit-breaker / RCD etc.)',x+2,top+47,w-4,{size:6.5,bold:true});
    labelValue(doc,'Location',display(f.mainSwitchLocation,worksheet),x+2,top+54,45,{labelW:14});
    labelValue(doc,'BS (EN)',display(f.mainSwitchBs,worksheet),x+49,top+54,35,{labelW:14});
    labelValue(doc,'No. poles',display(f.mainSwitchPoles,worksheet),x+86,top+54,31,{labelW:16});
    labelValue(doc,'Current A',display(f.mainSwitchCurrent,worksheet),x+119,top+54,31,{labelW:15});
    labelValue(doc,'Voltage V',display(f.mainSwitchVoltage,worksheet),x+152,top+54,36,{labelW:15});
    labelValue(doc,'OCPD type/setting',display(f.mainSwitchDeviceType,worksheet),x+2,top+63,55,{labelW:27});
    labelValue(doc,'Breaking kA',display(f.mainSwitchBreaking,worksheet),x+59,top+63,38,{labelW:19});
    labelValue(doc,'RCD type',display(f.mainRcdType,worksheet),x+99,top+63,32,{labelW:17});
    labelValue(doc,'IΔn mA',display(f.mainRcdIdn,worksheet),x+133,top+63,27,{labelW:14});
    labelValue(doc,'Delay ms',display(f.mainRcdDelay,worksheet),x+162,top+63,26,{labelW:15});
    y+=77;

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
      const circuits=circuitsForBoard(cert,ref);
      const chunks=[];
      if(circuits.length){
        for(let i=0;i<circuits.length;i+=12)chunks.push(circuits.slice(i,i+12));
      }else chunks.push([]);
      chunks.forEach((chunk,chunkIndex)=>{
        doc.addPage('a4','landscape');
        pageFrame(doc,'GENERIC SCHEDULE OF CIRCUIT DETAILS',display(cert.number,worksheet,true),schema.standard);
        const W=doc.internal.pageSize.getWidth(),x=10,w=W-20;
        const y=27;
        write(doc,'Distribution board/Consumer unit details',x,y,w,{size:7,bold:true});
        labelValue(doc,'DB/CU reference',display(ref,worksheet,true),x,y+7,53,{labelW:24});
        labelValue(doc,'Location',display(board.location,worksheet,true),x+55,y+7,67,{labelW:18});
        labelValue(doc,'Supplied from',display(board.suppliedFrom,worksheet),x+124,y+7,70,{labelW:23});
        labelValue(doc,'Distribution circuit OCPD',display(board.mainSwitch,worksheet),x+196,y+7,w-196,{labelW:34});
        labelValue(doc,'SPD Type(s)',display(board.spd,worksheet),x,y+14,53,{labelW:20});
        labelValue(doc,'RCD',display(board.rcd,worksheet),x+55,y+14,67,{labelW:12});
        labelValue(doc,'Zdb Ω',display(board.zdb,worksheet),x+124,y+14,40,{labelW:13});
        labelValue(doc,'Ipf kA',display(board.ipf,worksheet),x+166,y+14,40,{labelW:13});
        const cols=[
          ['1','Circuit number','circuitNo'],['2','Circuit description','description'],['3','Type of wiring','wiringType'],['4','Reference method','refMethod'],
          ['5','Number of points served','points'],['6','Live mm²','liveCsa'],['7','CPC mm²','cpcCsa'],['8','BS (EN)','ocpdBs'],
          ['9','Type','ocpdType'],['10','Rating A','ocpdRating'],['11','Breaking kA','breakingCapacity'],['12','Max permitted Zs Ω','maxZs'],
          ['13','RCD BS (EN)','rcdBs'],['14','Type','rcdType'],['15','IΔn mA','rcdIdn'],['16','Rating A','rcdRating']
        ];
        const rows=[];
        for(let r=0;r<12;r++){
          const item=chunk[r]?.detail||{};
          rows.push(cols.map(c=>{
            let z=item[c[2]];
            if(c[2]==='wiringType') z=wiringCode(z);
            return worksheet?'':pdfText(z||'');
          }));
        }
        doc.autoTable({
          startY:y+20,
          head:[
            [{content:'CIRCUIT DETAILS',colSpan:16,styles:{fontStyle:'bold',fontSize:7}}],
            [{content:'',colSpan:2},{content:'Conductor details',colSpan:5},{content:'Overcurrent protective device',colSpan:5},{content:'RCD',colSpan:4}],
            cols.map(c=>c[1])
          ],
          body:rows,margin:{left:x,right:10,bottom:28},theme:'grid',
          styles:{fontSize:4.8,cellPadding:.55,minCellHeight:6,lineColor:LINE,lineWidth:.12,textColor:INK,halign:'center',valign:'middle',overflow:'linebreak'},
          headStyles:{fillColor:[255,255,255],textColor:INK,fontStyle:'normal',lineColor:LINE,lineWidth:.12},
          columnStyles:{0:{cellWidth:9},1:{cellWidth:40,halign:'left'},2:{cellWidth:15},3:{cellWidth:14},4:{cellWidth:14},5:{cellWidth:13},6:{cellWidth:13},7:{cellWidth:20},8:{cellWidth:11},9:{cellWidth:11},10:{cellWidth:16},11:{cellWidth:17},12:{cellWidth:21},13:{cellWidth:12},14:{cellWidth:12},15:{cellWidth:12}}
        });
        const ky=Math.min(doc.internal.pageSize.getHeight()-18,doc.lastAutoTable.finalY+4);
        write(doc,'CODES FOR TYPES OF WIRING',x,ky,w,{size:5.8,bold:true});
        write(doc,'A Thermoplastic insulated/sheathed · B Thermoplastic in metallic conduit · C Thermoplastic in non-metallic conduit · D Thermoplastic in metallic trunking · E Thermoplastic in non-metallic trunking · F Thermoplastic SWA · G Thermosetting SWA · H Mineral insulated · O Other',x,ky+4,w,{size:4.8,maxLines:2});

        doc.addPage('a4','landscape');
        pageFrame(doc,'GENERIC SCHEDULE OF TEST RESULTS',display(cert.number,worksheet,true),schema.standard);
        write(doc,'Distribution board/Consumer unit details',x,y,w,{size:7,bold:true});
        labelValue(doc,'DB/CU reference',display(ref,worksheet,true),x,y+7,55,{labelW:24});
        labelValue(doc,'Zdb Ω',display(board.zdb,worksheet),x+57,y+7,43,{labelW:13});
        labelValue(doc,'Ipf kA',display(board.ipf,worksheet),x+102,y+7,43,{labelW:13});
        labelValue(doc,'Correct polarity',display(board.polarity,worksheet),x+147,y+7,50,{labelW:26});
        labelValue(doc,'Phase sequence',display(board.phaseSequence,worksheet),x+199,y+7,50,{labelW:25});
        labelValue(doc,'SPD operational',display(board.spdOperational,worksheet),x+251,y+7,w-251,{labelW:27});
        const tcols=[
          ['17','Circuit','circuitNo'],['18','r1 line Ω','r1'],['19','rn neutral Ω','rn'],['20','r2 CPC Ω','r2'],['21','R1+R2 Ω','r1r2'],['22','R2 Ω','r2only'],
          ['23','IR test V','irVoltage'],['24','Live-Live MΩ','irLL'],['25','Live-Earth MΩ','irLE'],['26','Polarity','polarity'],['27','Max measured Zs Ω','zs'],
          ['28','RCD time ms','rcdTime'],['29','RCD test button','rcdButton'],['30','AFDD test button','afddButton'],['31','Remarks','remarks']
        ];
        const trows=[];
        for(let r=0;r<12;r++){
          const item=chunk[r]||{},d=item.detail||{},t=item.test||{};
          const merged={...d,...t};
          trows.push(tcols.map(c=>worksheet?'':pdfText(merged[c[2]]||'')));
        }
        doc.autoTable({
          startY:y+18,
          head:[
            [{content:'TEST RESULTS',colSpan:15,styles:{fontStyle:'bold',fontSize:7}}],
            [{content:'',colSpan:1},{content:'Continuity Ω',colSpan:5},{content:'Insulation resistance',colSpan:3},{content:'',colSpan:2},{content:'RCD',colSpan:2},{content:'AFDD',colSpan:1},{content:'',colSpan:1}],
            tcols.map(c=>c[1])
          ],
          body:trows,margin:{left:x,right:10,bottom:32},theme:'grid',
          styles:{fontSize:4.8,cellPadding:.55,minCellHeight:6,lineColor:LINE,lineWidth:.12,textColor:INK,halign:'center',valign:'middle',overflow:'linebreak'},
          headStyles:{fillColor:[255,255,255],textColor:INK,fontStyle:'normal',lineColor:LINE,lineWidth:.12},
          columnStyles:{0:{cellWidth:9},1:{cellWidth:13},2:{cellWidth:13},3:{cellWidth:13},4:{cellWidth:15},5:{cellWidth:12},6:{cellWidth:14},7:{cellWidth:16},8:{cellWidth:16},9:{cellWidth:14},10:{cellWidth:16},11:{cellWidth:18},12:{cellWidth:18},13:{cellWidth:18},14:{cellWidth:57,halign:'left'}}
        });
        const ty=Math.min(doc.internal.pageSize.getHeight()-17,doc.lastAutoTable.finalY+4);
        const ff=cert.fields||{};
        write(doc,'Details of test instruments used (serial and/or asset numbers)',x,ty,w,{size:5.8,bold:true});
        write(doc,'Multifunction: '+display((ff.testerMake||'')+' '+(ff.testerModel||'')+' '+(ff.testerSerial||''),worksheet)+'   Continuity: __________   Insulation resistance: __________   Earth fault loop impedance: __________   RCD: __________   Earth electrode resistance: __________',x,ty+4,w,{size:4.8});
        write(doc,'Tested by name (Capitals): '+display(ff.testedBy,worksheet)+'     Signature: __________________________     Date: '+(worksheet?'':fmtDate(ff.testedDate)),x,ty+9,w,{size:5.2});
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
          const value=worksheet?'':(field.type==='date'?fmtDate(cert.fields?.[field.key]):String(cert.fields?.[field.key]||''));
          return [field.label,value];
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

  function build({cert,schema,settings={},worksheet=false}){
    const C=window.jspdf?.jsPDF;
    if(!C) throw new Error('PDF engine unavailable');
    const doc=new C({unit:'mm',format:'a4',orientation:'portrait'});
    if(typeof doc.autoTable!=='function') throw new Error('PDF table engine unavailable');
    doc.__sperinWorksheet=!!worksheet;
    const opts={worksheet,settings};
    if(cert.type==='eic')renderEic(doc,cert,schema,opts);
    else if(cert.type==='eicr')renderEicr(doc,cert,schema,opts);
    else if(cert.type==='minor')renderMinor(doc,cert,schema,opts);
    else renderGeneric(doc,cert,schema,opts);
    drawPageFooterAll(doc);
    return doc;
  }

  window.SperinIetForms={build};
})();