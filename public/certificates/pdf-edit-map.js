/* Editable regions are measured by the PDF renderer, never a second page layout. */
(() => {
  const field = key => ({scope:'field',key});
  const table = (kind,index,key) => ({scope:kind==='circuits'?'circuit':kind==='tests'?'test':kind==='boards'?'board':'table',kind,index,key});
  function install(doc,cert,schema){
    doc.__editRegions=[];
    let schedule=-1;
    const original=doc.autoTable.bind(doc);
    const signatory=(role,part)=>{
      if(String(cert.fields?.signatoryMode||'').startsWith('One person'))return field('singleSignatory'+part[0].toUpperCase()+part.slice(1));
      const keys={designer:{name:'designer1',signature:'designer1Signature',date:'designer1Date'},designer2:{name:'designer2'},constructor:{name:'constructor'},inspector:{name:'inspector',date:'inspectionDate'}};
      return field(keys[role]?.[part]||role+part[0].toUpperCase()+part.slice(1));
    };
    doc.autoTable=options=>{
      const content=c=>typeof c==='object'?c?.content||'':String(c??'');
      const title=content(options.head?.[0]?.[0]);
      const section=title.match(/^SECTION ([A-K]):/)?.[1];
      let resolve=()=>[];
      if(cert.type==='eic'&&section){
        const simple={A:['clientName','clientAddress','clientPostcode'],B:['installationAddress','installationPostcode','description','extent','workType'],D:['nextInspectionInterval'],I:['existingComments'],J:['continuationSheets']};
        if(simple[section])resolve=(r,c)=>c===1&&simple[section][r]?[field(simple[section][r])]:[];
        const pairs={F:[['earthingArrangement','supplyACDC'],['liveConductors','nominalVoltage'],['frequency','ipf'],['ze','supplyDeviceBs'],['supplyDeviceType','supplyDeviceRating'],['supplyBreakingCapacity','supplyPolarity'],['otherSources']],G:[['meansOfEarthing',['maximumDemand','maximumDemandUnit']],['earthElectrodeType','earthElectrodeLocation'],['earthElectrodeResistance','earthingConductorMaterial'],['earthingConductorCsa','earthingContinuity'],['bondingMaterial','bondingCsa'],['bondingContinuity','bondingTo'],['mainSwitchLocation','mainSwitchBs'],[['mainSwitchPoles','mainSwitchCurrent','mainSwitchVoltage'],'mainSwitchDeviceType'],['mainSwitchBreaking',['mainRcdType','mainRcdIdn','mainRcdDelay']],['mainSwitchDeviceSetting','mainRcdTime'],['mainRcdBreaking']]};
        if(pairs[section])resolve=(r,c)=>c%2===1?[pairs[section][r]?.[(c-1)/2]].flat().filter(Boolean).map(field):[];
        if(section==='C'){
          let role='designer',sig=0; const bindings=[];
          options.body.forEach((row,r)=>{
            const label=content(row[0]);
            if(label==='FOR CONSTRUCTION')role='constructor';
            if(label==='FOR INSPECTION AND TESTING')role='inspector';
            if(label.startsWith('Signature')){
              const use=role==='designer'&&sig++>0?'designer2':role;
              bindings[r]=['signature','date','name'].map(p=>[signatory(use,p)]);
            }else if(label==='Details of departures from BS 7671')bindings[r]=[[],[field(({designer:'designDepartures',constructor:'constructionDepartures',inspector:'inspectionDepartures'})[role])]];
            else if(label==='Permitted exceptions / risk assessment')bindings[r]=[[],[field('permittedExceptions')]];
            else if(label==='Risk assessment attached')bindings[r]=[[],[field('riskAssessmentAttached')]];
          });
          resolve=(r,c)=>bindings[r]?.[c]||[];
        }
        if(section==='E'){
          const roles=['designer',...(cert.fields?.designer2||cert.fields?.designer2Signature?['designer2']:[]),'constructor','inspector'];
          resolve=(r,c)=>c>0?[signatory(roles[r],['','name','company','address','postcode','phone'][c])]:[];
        }
        if(section==='H')resolve=(r,c)=>[table('eicInspection',r,['item','description','outcome'][c])];
      } else if(cert.type==='eicr'&&section&&section!=='K'){
        const part=schema.sections.find(p=>p.title?.startsWith(section+' ·'));
        resolve=(r,c)=>{const f=part?.fields?.[(r-(section==='G'?1:0))*2+(c-1)/2];return c%2===1&&f?[field(f.key)]:[];};
      }
      if(section==='K'&&cert.type==='eicr')resolve=(r,c)=>cert.tables?.observations?.[r]?[table('observations',r,['item','observation','code','scheduleRef'][c])]:[];
      if(title==='CONDITION REPORT SCHEDULE OF INSPECTION')resolve=(r,c)=>[table('eicrInspection',r,['item','description','outcome'][c])];
      if(!title&&content(options.body?.[0]?.[0]).startsWith('DB/CU reference:'))schedule++;
      if(title==='CIRCUIT DETAILS'||title==='TEST RESULTS'){
        // Match the renderer's board grouping and numeric sort, including unassigned circuits.
        const normal=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
        const groups=[];
        const boards=(cert.tables?.boards||[]).slice();
        if(!boards.length&&!cert.boardWorkflowVersion)boards.push({ref:cert.fields?.dbReference||'DB1'});
        for(const row of cert.tables?.circuits||[])if(row.boardRef&&!boards.some(b=>normal(b.ref)===normal(row.boardRef)))boards.push({ref:row.boardRef});
        boards.forEach((b,bi)=>{
          const all=Array.from({length:Math.max(cert.tables?.circuits?.length||0,cert.tables?.tests?.length||0)},(_,index)=>({index,d:cert.tables?.circuits?.[index]||{},t:cert.tables?.tests?.[index]||{}})).filter(q=>normal(q.d.boardRef||q.t.boardRef)===normal(b.ref)||(bi===0&&!normal(q.d.boardRef||q.t.boardRef))).sort((a,b)=>String(a.d.circuitNo??a.t.circuitNo??'').localeCompare(String(b.d.circuitNo??b.t.circuitNo??''),undefined,{numeric:true}));
          for(let i=0;i<Math.max(1,all.length);i+=8)groups.push(all.slice(i,i+8));
        });
        const keys=title==='CIRCUIT DETAILS'?['circuitNo','description','wiringType','refMethod','points','liveCsa','cpcCsa','ocpdBs','ocpdType','ocpdRating','breakingCapacity','maxZs','rcdBs','rcdType','rcdIdn','rcdRating']:['circuitNo','r1','rn','r2','r1r2','r2only','irVoltage','irLL','irLE','polarity','zs','rcdTime','rcdButton','afddButton','remarks'];
        resolve=(r,c)=>groups[schedule]?.[r]?[table(title==='CIRCUIT DETAILS'?'circuits':'tests',groups[schedule][r].index,keys[c])]:[];
      }
      if(options.editResolve)resolve=options.editResolve;
      const hook=options.didDrawCell;
      return original({...options,didDrawCell:data=>{
        hook?.(data);
        if(data.section!=='body')return;
        const bindings=resolve(data.row.index,data.column.index);
        bindings.forEach((binding,i)=>{
          if(!binding.key)return;
          const cell=data.cell;
          doc.__editRegions.push({...binding,page:doc.internal.getCurrentPageInfo().pageNumber,x:cell.x+cell.width*i/bindings.length,y:cell.y,width:cell.width/bindings.length,height:cell.height});
        });
      }});
    };
  }
  window.SperinPdfEditMap={install};
})();
