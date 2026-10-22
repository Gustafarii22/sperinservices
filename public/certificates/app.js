(() => {
  'use strict';

  const STORAGE_KEY = 'sperin-certificates-data-v1';
  const SETTINGS_KEY = 'sperin-certificates-settings-v1';
  const PRE_RESTORE_KEY = 'sperin-certificates-pre-restore-v1';
  const VIEW_KEY = 'sperin-certificates-view-v1';
  const VERSION = '1.9.6-dev';
  const EDIT_MODE_KEY = 'sperin-certificates-edit-mode-v196';
  let editMode = 'quick';
  let lastRequestedOrientation = '';
  // v1.7 form-reset verification trigger
  const TODAY = new Date().toISOString().slice(0, 10);
  const SHEET_PLANS_KEY = 'sperin-certificates-site-sheets-v1';
  const BOARD_TEMPLATES_KEY = 'sperin-certificates-board-templates-v1';
  const CIRCUIT_TEMPLATES_KEY = 'sperin-certificates-circuit-templates-v1';
  const SHEET_TEMPLATES_KEY = 'sperin-certificates-site-sheet-templates-v1';

  const OPTIONS = {
    yesNo: ['Yes', 'No'],
    yesNoNA: ['Yes', 'No', 'N/A'],
    passNA: ['✓', '✕', 'N/A'],
    eicrOutcome: ['✓', 'C1', 'C2', 'C3', 'FI', 'N/V', 'LIM', 'N/A'],
    earthing: ['TN-C', 'TN-S', 'TN-C-S (PME)', 'TN-C-S (PNB)', 'TT', 'IT', 'Other'],
    liveConductors: ['1-phase, 2-wire', '2-phase, 3-wire', '3-phase, 3-wire', '3-phase, 4-wire', 'DC 2-wire', 'DC 3-wire', 'Other'],
    acdc: ['AC', 'DC'],
    rcdType: ['AC', 'A', 'F', 'B', 'Other', 'N/A'],
    ocpdType: ['B','C','D','K','Z','1','2','3','4','gG','gL','aM','gM','gR','aR','BS 88 fuse','MCCB','ACB','Other'],
    wiringType: ['Twin & earth (flat)', 'A - Thermoplastic insulated/sheathed', 'B - Thermoplastic in metallic conduit', 'C - Thermoplastic in non-metallic conduit', 'D - Thermoplastic in metallic trunking', 'E - Thermoplastic in non-metallic trunking', 'F - Thermoplastic SWA', 'G - Thermosetting SWA', 'H - Mineral insulated', 'O - Other'],
    refMethod: ['A1', 'A2', 'B', 'C', 'D1', 'D2', 'E', 'F', 'G', '100', '101', '102', '103', 'Other'],
    premises: ['Residential', 'Commercial', 'Industrial', 'Educational', 'Healthcare', 'Hospitality', 'Retail', 'HMO', 'Other'],
    workType: ['New installation', 'Addition to existing installation', 'Alteration to existing installation'],
    overall: ['Satisfactory', 'Unsatisfactory'],
    observationCode: ['C1', 'C2', 'C3', 'FI'],
    certStatus: ['Draft', 'Complete'],
    emergencyType: ['Completion certificate', 'Periodic inspection & test', 'Small installation certificate'],
    emergencyMode: ['Maintained', 'Non-maintained', 'Combined', 'Central battery', 'Static inverter', 'Other'],
    testDuration: ['1 hour', '3 hours', 'Other'],
    smokeGrade: ['Grade A', 'Grade C', 'Grade D1', 'Grade D2', 'Grade F1', 'Grade F2', 'Other'],
    smokeCategory: ['LD1', 'LD2', 'LD3', 'PD1', 'PD2', 'Other'],
    alarmType: ['Optical smoke', 'Ionisation smoke', 'Heat', 'Multi-sensor', 'CO', 'Sounder', 'Strobe / visual alarm', 'Vibrating pad', 'Control / relay', 'Other'],
    interlink: ['Hard-wired', 'Radio-linked', 'Hybrid', 'Standalone', 'Other'],
    testResult: ['Pass', 'Fail', 'N/A'],
    ocpdBs: ['BS EN 60898-1','BS EN 60898-2','BS EN 61009-1','BS EN 61009-2-1','BS EN 61009-2-2',
      'BS EN 60947-2','BS EN 60947-3','BS 3871','BS 4293','BS EN 61008-1',
      'BS 88-2','BS88-3','BS EN 60269-1','BS EN 60269-2','BS EN 60269-3',
      'BS 3036','BS 1361','BS 1362','Other (enter exact marking)'],
    rcdBs: ['BS EN 61008-1','BS EN 61008-2-1','BS EN 61008-2-2','BS EN 61009-1',
      'BS EN 61009-2-1','BS EN 61009-2-2','BS EN 62423','BS EN 60947-2','BS 4293','Other (enter exact marking)'],
    deviceKind: ['MCB','RCBO','RCD','RCCB','MCCB','ACB','Fuse','Main switch','SPD','AFDD','Spare','Other'],
    ocpdRating: ['2', '4', '6', '10', '16', '20', '25', '32', '40', '50', '63', '80', '100', '125'],
    testerFunction: ['Multifunction', 'Low resistance ohmmeter', 'Insulation resistance', 'Earth fault loop impedance (Zs)', 'RCD', 'Earth electrode resistance', 'Voltage indicator', 'Other'],
    nominalVoltage: ['230', '230/400', '400/230', '400', 'Other'],
    frequency: ['50', '60', 'Other'],
    breakingCapacity: ['3', '4.5', '6', '10', '16', '25', '33', '36', '50', 'Other'],
    conductorCsa: ['1', '1.5', '2.5', '4', '6', '10', '16', '25', '35', '50', '70', '95', '120', '150', '185', '240', 'Other'],
    conductorMaterial: ['Copper', 'Aluminium', 'Other'],
    poles: ['1', '2', '3', '4'],
    rcdIdn: ['10', '30', '100', '300', '500', 'Other'],
    earthElectrodeType: ['Rod', 'Tape', 'Plate', 'Foundation earth electrode', 'Mesh', 'Other'],
    supplyDeviceBs: ['BS 88-2', 'BS88-3', 'BS 1361', 'BS EN 60898-1', 'BS EN 60947-2', 'BS EN 61009-1', 'Other'],
    spdType: [
      'No SPD / N/A',
      'Type 1 — BS EN IEC 61643-11:2025+A11:2025',
      'Type 2 — BS EN IEC 61643-11:2025+A11:2025',
      'Type 1+2 — BS EN IEC 61643-11:2025+A11:2025',
      'Type 2+3 — BS EN IEC 61643-11:2025+A11:2025',
      'Type 3 — BS EN IEC 61643-11:2025+A11:2025',
      'Legacy marking — BS EN 61643-11:2012+A11:2018',
      'Other'
    ]
  };

  // Short on-screen guidance only; the saved/PDF field remains the BS 7671 method code.
  // Use Appendix 4/Table 4A2 and the applicable rating table to verify selection.
  const REF_METHOD_HELP = Object.freeze({
    A1:'Single-core conductors in conduit within a thermally insulating wall',
    A2:'Multicore cable in conduit within a thermally insulating wall',
    B:'Conductors in surface conduit or trunking on a wall',
    C:'Cable clipped direct to a wall or similar surface',
    D1:'Cable in ducting buried in the ground',
    D2:'Cable buried directly in the ground',
    E:'Multicore cable in free air or on perforated tray',
    F:'Single-core cables touching each other in free air',
    G:'Single-core cables spaced apart in free air',
    '100':'Flat twin & earth above plasterboard ceiling; insulation up to 100 mm',
    '101':'Flat twin & earth above plasterboard ceiling; insulation over 100 mm',
    '102':'Flat twin & earth in an insulated stud wall, touching the inner wall surface',
    '103':'Flat twin & earth in an insulated stud wall, not touching the inner wall surface',
    Other:'Check BS 7671 Appendix 4, Table 4A2 for the installation conditions'
  });
  function refMethodDescription(value){
    const key=String(value||'').trim();
    return (key&&REF_METHOD_HELP[key])||'Choose the actual installation method; check Appendix 4/Table 4A2.';
  }
  function refMethodHelp(value){
    return '<small class="meta ref-method-help" data-ref-method-hint>'+
      esc(refMethodDescription(value))+'</small>';
  }
  function refMethodOption(option,key){
    return (key==='refMethod'||key==='referenceMethod') && REF_METHOD_HELP[option]
      ? option+' — '+REF_METHOD_HELP[option] : String(option);
  }

  const BONDING_OPTIONS = ['Water', 'Gas', 'Oil', 'Structural steel', 'Lightning protection system', 'Other'];
  const NUMERIC_INPUT_KEYS = new Set([
    'nominalVoltage','frequency','ipf','ze','maximumDemand','supplyDeviceRating',
    'earthingConductorCsa','bondingConductorCsa','mainSwitchRating','mainRcdIdn','mainRcdDelay','mainRcdTime',
    'zdb','dbIpf','points','liveCsa','cpcCsa','ocpdRating','breakingCapacity','maxZs','rcdIdn','rcdRating',
    'r1','rn','r2','r1r2','r2only','irVoltage','irLL','irLE','zs','rcdTime',
    'ringR1','ringRn','ringR2','rcdDelay','afddRating'
  ]);
  const INTEGER_INPUT_KEYS = new Set(['circuitNo','points','irVoltage']);

  function inputModeAttrs(key){
    if(INTEGER_INPUT_KEYS.has(key)) return ' inputmode="numeric" pattern="[0-9]*"';
    if(NUMERIC_INPUT_KEYS.has(key)) return ' inputmode="decimal"';
    return '';
  }

  const f = (key, label, type = 'text', opts = {}) => ({ key, label, type, ...opts });
  const table = (key, title, columns, defaultRows = []) => ({ type: 'table', key, title, columns, defaultRows });
  const section = (title, fields = [], opts = {}) => ({ type: 'section', title, fields, ...opts });
  const select = (key, label, options, opts = {}) => f(key, label, 'select', { options, ...opts });

  const boardColumns = [
    { key:'ref', label:'Board ref.' },
    { key:'location', label:'Location' },
    { key:'suppliedFrom', label:'Supplied from' },
    { key:'zdb', label:'Zdb Ω' },
    { key:'ipf', label:'Ipf kA' },
    { key:'mainSwitch', label:'Main switch / device' },
    { key:'rcd', label:'RCD / RCBO details' },
    { key:'spd', label:'SPD' },
    { key:'polarity', label:'Polarity', type:'select', options:OPTIONS.yesNoNA },
    { key:'phaseSequence', label:'Phase sequence', type:'select', options:OPTIONS.yesNoNA },
    { key:'spdOperational', label:'SPD operational', type:'select', options:OPTIONS.yesNoNA }
  ];

  const circuitColumns = [
    { key: 'boardRef', label: 'Board ref.' },
    { key: 'circuitNo', label: 'Circuit no.' },
    { key: 'description', label: 'Circuit description' },
    { key: 'wiringType', label: 'Wiring type', type: 'select', options: OPTIONS.wiringType },
    { key: 'installMethod', label: 'Installation / containment' },
    { key: 'refMethod', label: 'Reference method', type: 'select', options: OPTIONS.refMethod },
    { key: 'points', label: 'Points' },
    { key: 'liveCsa', label: 'Live mm²' },
    { key: 'cpcCsa', label: 'CPC mm²' },
    { key: 'deviceKind', label: 'Device type', type:'select', options: OPTIONS.deviceKind },
    { key: 'ocpdBs', label: 'OCPD BS (EN)', type: 'select', options: OPTIONS.ocpdBs },
    { key: 'ocpdType', label: 'OCPD type', type: 'select', options: OPTIONS.ocpdType },
    { key: 'ocpdRating', label: 'Rating A', type: 'select', options: OPTIONS.ocpdRating },
    { key: 'breakingCapacity', label: 'Breaking kA', type: 'select', options: OPTIONS.breakingCapacity },
    { key: 'maxZs', label: 'Max Zs Ω' },
    { key: 'rcdBs', label: 'RCD BS (EN)', type: 'select', options: OPTIONS.rcdBs },
    { key: 'rcdType', label: 'RCD type', type: 'select', options: OPTIONS.rcdType },
    { key: 'rcdIdn', label: 'IΔn mA', type: 'select', options: OPTIONS.rcdIdn },
    { key: 'rcdRating', label: 'RCD A', type: 'select', options: OPTIONS.ocpdRating }
  ];

  const testColumns = [
    { key: 'circuitNo', label: 'Circuit no.' },
    { key: 'r1', label: 'r1 Ω' },
    { key: 'rn', label: 'rn Ω' },
    { key: 'r2', label: 'r2 Ω' },
    { key: 'r1r2', label: 'R1+R2 Ω' },
    { key: 'r2only', label: 'R2 Ω' },
    { key: 'irVoltage', label: 'IR V' },
    { key: 'irLL', label: 'L-L MΩ' },
    { key: 'irLE', label: 'L-E MΩ' },
    { key: 'polarity', label: 'Polarity', type: 'select', options: OPTIONS.testResult },
    { key: 'zs', label: 'Zs Ω' },
    { key: 'rcdTime', label: 'RCD ms' },
    { key: 'rcdButton', label: 'RCD test', type: 'select', options: OPTIONS.testResult },
    { key: 'afddButton', label: 'AFDD test', type: 'select', options: OPTIONS.testResult },
    { key: 'remarks', label: 'Remarks' }
  ];



  const CIRCUIT_DETAIL_GROUPS = [
    { title: 'Circuit', fields: [
      { key:'boardRef', label:'Distribution board / CU reference' },
      { key:'circuitNo', label:'Circuit number' },
      { key:'description', label:'Circuit description', span:'full' },
      { key:'phaseAssociation', label:'Verified phase / line (L1, L2, L3 or TP&N)' },
      { key:'wiringType', label:'Type of wiring', options:OPTIONS.wiringType },
      { key:'installMethod', label:'Installation / containment method', span:'full' },
      { key:'refMethod', label:'Reference method', options:OPTIONS.refMethod },
      { key:'points', label:'Number of points served' },
      { key:'liveCsa', label:'Live conductor csa (mm²)', options:OPTIONS.conductorCsa },
      { key:'cpcCsa', label:'CPC csa (mm²)', options:OPTIONS.conductorCsa }
    ]},
    { title: 'Overcurrent protective device', fields: [
      { key:'deviceKind', label:'Device type', options:OPTIONS.deviceKind },
      { key:'poleCount', label:'Number of poles (visually confirmed)', options:OPTIONS.poles },
      { key:'testButtonVisual', label:'Photo shows test button (not electrical test)', options:['Visible','Not visible','Unclear'] },
      { key:'ocpdBs', label:'BS (EN)', options:OPTIONS.ocpdBs },
      { key:'ocpdType', label:'Type / curve', options:OPTIONS.ocpdType },
      { key:'ocpdRating', label:'Rating (A)', options:OPTIONS.ocpdRating },
      { key:'breakingCapacity', label:'Breaking capacity (kA)', options:OPTIONS.breakingCapacity },
      { key:'maxZs', label:'Maximum permitted Zs (Ω)', suffix:'zs' }
    ]},
    { title: 'RCD', fields: [
      { key:'rcdBs', label:'BS (EN)', options:OPTIONS.rcdBs },
      { key:'rcdType', label:'Type', options:OPTIONS.rcdType },
      { key:'rcdIdn', label:'IΔn (mA)', options:OPTIONS.rcdIdn },
      { key:'rcdRating', label:'Rating (A)', options:OPTIONS.ocpdRating }
    ]}
  ];

  const CIRCUIT_TEST_GROUPS = [
    { title:'Continuity', fields:[
      { key:'r1', label:'r1 (line) Ω' }, { key:'rn', label:'rn (neutral) Ω' }, { key:'r2', label:'r2 (CPC) Ω' },
      { key:'r1r2', label:'R1 + R2 (Ω)' }, { key:'r2only', label:'R2 (Ω)' }
    ]},
    { title:'Insulation resistance', fields:[
      { key:'irVoltage', label:'Test voltage (V)', options:['250','500','1000'] },
      { key:'irLL', label:'Live–Live (MΩ)' }, { key:'irLE', label:'Live–Earth (MΩ)' }
    ]},
    { title:'Final tests', fields:[
      { key:'polarity', label:'Polarity', options:OPTIONS.testResult },
      { key:'zs', label:'Maximum measured Zs (Ω)' },
      { key:'rcdTime', label:'RCD disconnection time (ms)' },
      { key:'rcdButton', label:'RCD test button', options:OPTIONS.testResult },
      { key:'afddButton', label:'AFDD manual test button', options:OPTIONS.testResult },
      { key:'remarks', label:'Remarks', span:'full', textarea:true }
    ]}
  ];

  function normaliseBoardKey(value) {
    return String(value??'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  }

  const PRIMARY_BOARD_FIELD_MAP = {
    ref:'dbReference',
    location:'dbLocation',
    suppliedFrom:'suppliedFrom',
    mainSwitch:'distributionOcpd',
    rcd:'dbRcd',
    spd:'dbSpd',
    zdb:'zdb',
    ipf:'dbIpf',
    polarity:'dbPolarity',
    phaseSequence:'phaseSequence',
    spdOperational:'spdOperational'
  };

  // Explicit allowlists: templates and linked feeds can never carry measured readings.
  function circuitDesign(row){
    const keys=['deviceManufacturer','deviceModel','deviceKind','poleCount','phaseAssociation','testButtonVisual','description','wiringType','installMethod','refMethod','points','liveCsa','cpcCsa','ocpdBs','ocpdType','ocpdRating','breakingCapacity','rcdBs','rcdType','rcdIdn','rcdRating','afddBs','afddType','afddRating','spd'];
    return Object.fromEntries(keys.filter(k=>row[k]!==undefined).map(k=>[k,row[k]]));
  }
  function boardDesign(row){return Object.fromEntries(['mainSwitch','rcd','spd','manufacturer','model','ways','populated','spareWays','markings'].filter(k=>row[k]!==undefined).map(k=>[k,row[k]]));}
  function templateKey(kind){return kind==='board'?BOARD_TEMPLATES_KEY:CIRCUIT_TEMPLATES_KEY;}
  function cleanTemplate(kind,t){
    return {id:String(t.id||uid()),name:String(t.name||'Template').slice(0,80),design:kind==='board'?boardDesign(t.design||{}):circuitDesign(t.design||{}),...(kind==='board'?{circuits:(Array.isArray(t.circuits)?t.circuits:[]).filter(isRecord).map(circuitDesign)}:{})};
  }
  function reusableTemplates(kind){const list=readStore(templateKey(kind),[]);return Array.isArray(list)?list.filter(isRecord).map(t=>cleanTemplate(kind,t)):[];}
  function saveReusableTemplates(kind,list){localStorage.setItem(templateKey(kind),JSON.stringify(list.map(t=>cleanTemplate(kind,t))));}
  function addBoard(cert,template=null){
    pushEditHistory(template?'Insert board template':'Add board');
    const board={...(template?boardDesign(template.design):{}),id:uid(),ref:nextBoardRef(cert),feedSourceType:'Mains',suppliedFrom:'Mains'};
    cert.tables.boards.push(board);
    rememberAccordions();
    cert.tables.boards.forEach(b=>accordionState.set('board:'+cert.id+':'+b.id,b.id===board.id));
    preserveRequestedAccordions=true;
    (template?.circuits||[]).forEach(design=>{const no=nextCircuitNumber(cert,board.ref);cert.tables.circuits.push({...circuitDesign(design),id:uid(),boardRef:board.ref,circuitNo:no});cert.tables.tests.push({boardRef:board.ref,circuitNo:no});recalculateCircuitZs(cert,cert.tables.circuits.length-1,true);});
    saveNow();render();goBoardCard(board.id);
  }
  function deleteBoard(cert,index){
    const board=cert.tables.boards[index];if(!board)return;
    if(cert.tables.boards.some(b=>b!==board&&normaliseBoardKey(b.sourceBoardRef)===normaliseBoardKey(board.ref))){alert('Another consumer unit is fed from '+board.ref+'. Change its supply before deleting this board.');return;}
    const indices=boardCircuitIndices(cert,board.ref);
    if(!confirm('Delete '+board.ref+'?'+(indices.length?' Its '+indices.length+' circuits and test results will also be removed.':'')+' A recovery copy will be saved.'))return;
    const y=window.scrollY;savePreRestoreSnapshot();pushEditHistory('Delete board');
    indices.reverse().forEach(i=>{cert.tables.circuits.splice(i,1);cert.tables.tests.splice(i,1);});
    cert.tables.boards.splice(index,1);cert.boardWorkflowVersion=1;
    Object.values(PRIMARY_BOARD_FIELD_MAP).forEach(k=>cert.fields[k]='');syncPrimaryBoardLegacyFields(cert);
    saveNow();render();restoreScroll(y);toast('Consumer unit deleted · recovery saved');
  }
  function changeBoardInput(cert,el){
    const index=Number(el.dataset.boardIndex),key=el.dataset.boardInput,board=cert.tables.boards[index];if(!board)return;
    if(key==='ref'){
      const ref=el.value.trim(),old=board.ref;
      if(!normaliseBoardKey(ref)||cert.tables.boards.some(b=>b!==board&&normaliseBoardKey(b.ref)===normaliseBoardKey(ref))){el.value=old;alert('Enter a unique board reference.');return;}
      boardCircuitIndices(cert,old).forEach(i=>{cert.tables.circuits[i].boardRef=ref;cert.tables.tests[i].boardRef=ref;});
      cert.tables.boards.forEach(b=>{if(normaliseBoardKey(b.sourceBoardRef)===normaliseBoardKey(old))b.sourceBoardRef=ref;});board.ref=ref;
    }else{
      board[key]=el.value;
      if(key==='sourceBoardRef')board.sourceCircuitNo='';
      if(['feedSourceType','sourceBoardRef','sourceCircuitNo'].includes(key)){
        if(key==='sourceCircuitNo' && String(el.value)!==''){
          const existing=cert.tables.circuits.find(r=>normaliseBoardKey(r.boardRef)===normaliseBoardKey(board.ref)&&String(r.circuitNo??'')==='0'&&!r._incomingFeed);
          if(existing){board.sourceCircuitNo='';alert('Circuit 0 already exists. Renumber it before linking the incoming supply.');}
        }
        syncBoardIncomingCircuit(cert,board);
      }
    }
    cert.tables.boards.filter(b=>b.feedSourceType==='Another consumer unit').forEach(b=>syncBoardIncomingCircuit(cert,b));
    syncPrimaryBoardLegacyFields(cert);saveNow();
    if(['ref','feedSourceType','sourceBoardRef','sourceCircuitNo'].includes(key)){const y=window.scrollY;render();restoreScroll(y);}
  }
  let templatePicker=null;
  function saveDesignTemplate(kind,cert,index){
    const row=kind==='board'?cert.tables.boards[index]:cert.tables.circuits[index];if(!row)return;
    const name=prompt('Template name',kind==='board'?'Consumer unit':row.description||'Circuit');if(!name?.trim())return;
    const item={id:uid(),name:name.trim(),design:kind==='board'?boardDesign(row):circuitDesign(row)};
    if(kind==='board'&&confirm('Include the circuit design layout? Measured readings are always excluded.'))item.circuits=boardCircuitIndices(cert,row.ref).filter(i=>!cert.tables.circuits[i]._incomingFeed).map(i=>circuitDesign(cert.tables.circuits[i]));
    try{saveReusableTemplates(kind,[...reusableTemplates(kind),item]);scheduleNativeAutoBackup();toast('Template saved');}catch(err){alert('Template could not be saved: '+err.message);}
  }
  function openTemplatePicker(kind,boardRef){
    templatePicker={kind,boardRef};closeModal();
    const rows=reusableTemplates(kind).map(t=>`<div class="template-row"><div><strong>${esc(t.name)}</strong><small>${esc(kind==='board'?[t.design.mainSwitch,t.design.spd,(t.circuits?.length||0)+' circuits'].filter(Boolean).join(' · '):[t.design.ocpdRating&&t.design.ocpdRating+' A',t.design.ocpdType,t.design.description].filter(Boolean).join(' · '))}</small></div><div class="template-actions"><button class="btn small" data-action="template-use" data-id="${esc(t.id)}">Use</button><button class="btn small" data-action="template-rename" data-id="${esc(t.id)}">Rename</button><button class="btn small danger" data-action="template-delete" data-id="${esc(t.id)}">Delete</button></div></div>`).join('');
    document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop"><div class="card modal template-picker" data-modal><div class="profile-head"><h3>${kind==='board'?'Consumer unit':'Circuit'} templates</h3><button class="btn small" data-action="close-modal">Close</button></div>${rows||'<p>No saved templates yet.</p>'}</div></div>`);
  }
  function manageDesignTemplate(id,remove){
    const {kind,boardRef}=templatePicker,list=reusableTemplates(kind),t=list.find(t=>t.id===id);if(!t)return;
    if(remove){if(!confirm('Delete template '+t.name+'?'))return;savePreRestoreSnapshot();saveReusableTemplates(kind,list.filter(t=>t.id!==id));}
    else {const name=prompt('Template name',t.name);if(!name?.trim())return;t.name=name.trim();saveReusableTemplates(kind,list);}
    scheduleNativeAutoBackup();openTemplatePicker(kind,boardRef);
  }
  function useDesignTemplate(id){
    const cert=getCurrent(),{kind,boardRef}=templatePicker,t=reusableTemplates(kind).find(t=>t.id===id);if(!cert||!t)return;
    closeModal();
    if(kind==='board'){addBoard(cert,t);return;}
    if(boardIndexByRef(cert,boardRef)<0)return;
    pushEditHistory('Insert circuit template');const no=nextCircuitNumber(cert,boardRef),row={...circuitDesign(t.design),id:uid(),boardRef,circuitNo:no};
    cert.tables.circuits.push(row);cert.tables.tests.push({boardRef,circuitNo:no});recalculateCircuitZs(cert,cert.tables.circuits.length-1,true);sortCircuitsByNumber(cert,row);view.circuitIndex=cert.tables.circuits.indexOf(row);view.circuitStep='details';saveNow();render();goTop();
  }

  function boardIndexByRef(cert,ref){
    const key=normaliseBoardKey(ref);
    return (cert?.tables?.boards||[]).findIndex(b=>normaliseBoardKey(b?.ref)===key);
  }

  function boardCircuitIndices(cert,ref){
    const key=normaliseBoardKey(ref);
    return (cert?.tables?.circuits||[]).map((row,i)=>({row,i})).filter(x=>normaliseBoardKey(x.row?.boardRef)===key).map(x=>x.i);
  }

  function syncPrimaryBoardLegacyFields(cert){
    if(!cert || !['eic','eicr'].includes(cert.type)) return;
    const board=cert.tables?.boards?.[0];
    if(!board) return;
    Object.entries(PRIMARY_BOARD_FIELD_MAP).forEach(([boardKey,fieldKey])=>{
      const boardValue=board[boardKey];
      cert.fields[fieldKey]=boardValue??'';
    });
  }

  function ensureBoardWorkflowData(cert){
    if(!cert || !['eic','eicr'].includes(cert.type)) return;
    cert.tables=cert.tables||{};
    let boards=Array.isArray(cert.tables.boards)?cert.tables.boards.filter(isRecord):[];
    if(!boards.length && !cert.boardWorkflowVersion) boards=[{ref:cert.fields?.dbReference||'DB1'}];
    const legacyRef=String(cert.fields?.dbReference??'').trim();
    if(!cert.boardWorkflowVersion && legacyRef && !boards.some(b=>normaliseBoardKey(b.ref)===normaliseBoardKey(legacyRef))){
      const placeholder=boards.length===1 && Object.entries(boards[0]).every(([k,v])=>['id','ref'].includes(k)||v===undefined||v===null||String(v).trim()==='');
      if(placeholder) boards[0].ref=legacyRef;
      else boards.push({ref:legacyRef});
    }
    const legacyIndex=legacyRef?boards.findIndex(b=>normaliseBoardKey(b.ref)===normaliseBoardKey(legacyRef)):0;
    boards=boards.map((board,i)=>{
      const b={...board};
      b.id=String(b.id||uid());
      b.ref=String(b.ref||('DB'+(i+1))).trim()||('DB'+(i+1));
      if(i===legacyIndex && !cert.boardWorkflowVersion){
        Object.entries(PRIMARY_BOARD_FIELD_MAP).forEach(([boardKey,fieldKey])=>{
          if((b[boardKey]===undefined||b[boardKey]===null||String(b[boardKey]).trim()==='') && cert.fields?.[fieldKey]!==undefined && cert.fields?.[fieldKey]!==null && String(cert.fields[fieldKey]).trim()!==''){
            b[boardKey]=cert.fields[fieldKey];
          }
        });
      }
      if(!b.feedSourceType){
        if(b.sourceBoardRef&&String(b.sourceCircuitNo??'').trim()!=='') b.feedSourceType='Another consumer unit';
        else if(/^mains$/i.test(String(b.suppliedFrom||'').trim()) || (i===0&&!String(b.suppliedFrom||'').trim())) b.feedSourceType='Mains';
        else b.feedSourceType='';
      }
      if(i===0 && !String(b.suppliedFrom||'').trim() && b.feedSourceType==='Mains') b.suppliedFrom='Mains';
      return b;
    });
    for(const row of [...(cert.tables.circuits||[]),...(cert.tables.tests||[])]){
      const ref=String(row.boardRef??'').trim();
      if(ref && !boards.some(b=>normaliseBoardKey(b.ref)===normaliseBoardKey(ref))) boards.push({id:uid(),ref,feedSourceType:'Mains',suppliedFrom:'Mains'});
    }
    cert.tables.boards=boards;
    cert.boardWorkflowVersion=1;
    syncPrimaryBoardLegacyFields(cert);
  }

  function nextBoardRef(cert){
    const used=new Set((cert.tables?.boards||[]).map(b=>normaliseBoardKey(b.ref)));
    const prefix=String(cert.tables?.boards?.[0]?.ref||'DB1').match(/^([A-Za-z]+)\d+$/)?.[1]||'DB';
    let n=1;
    while(used.has(normaliseBoardKey(prefix+n))) n++;
    return prefix+n;
  }

  function removeIncomingFeedCircuit(cert,boardRef){
    syncCircuitRows(cert);
    const key=normaliseBoardKey(boardRef);
    for(let i=cert.tables.circuits.length-1;i>=0;i--){
      const row=cert.tables.circuits[i];
      if(normaliseBoardKey(row.boardRef)===key && row._incomingFeed===true){
        cert.tables.circuits.splice(i,1);
        cert.tables.tests.splice(i,1);
      }
    }
  }

  function syncBoardIncomingCircuit(cert,board){
    if(!cert||!board) return;
    syncCircuitRows(cert);
    if(board.feedSourceType!=='Another consumer unit'){
      removeIncomingFeedCircuit(cert,board.ref);
      if(board.feedSourceType==='Mains') board.suppliedFrom='Mains';
      board.sourceBoardRef='';
      board.sourceCircuitNo='';
      return;
    }
    const sourceBoard=String(board.sourceBoardRef||'').trim();
    const sourceNo=String(board.sourceCircuitNo??'').trim();
    if(!sourceBoard||sourceNo===''){removeIncomingFeedCircuit(cert,board.ref);board.suppliedFrom='';return;}
    const sourceIndex=cert.tables.circuits.findIndex(row=>
      normaliseBoardKey(row.boardRef)===normaliseBoardKey(sourceBoard) &&
      String(row.circuitNo??'').trim()===sourceNo
    );
    if(sourceIndex<0){removeIncomingFeedCircuit(cert,board.ref);board.suppliedFrom='';return;}
    const sourceDetail=cert.tables.circuits[sourceIndex]||{};
    // Incoming design follows the upstream device; measured results belong to this board.
    const childKey=normaliseBoardKey(board.ref);
    let incomingIndex=cert.tables.circuits.findIndex(row=>
      normaliseBoardKey(row.boardRef)===childKey &&
      (row._incomingFeed===true || String(row.circuitNo??'').trim()==='0')
    );
    const oldId=incomingIndex>=0 ? cert.tables.circuits[incomingIndex]?.id : '';
    const incomingDetail={
      ...circuitDesign(sourceDetail),
      id:String(oldId||uid()),
      boardRef:board.ref,
      circuitNo:'0',
      _incomingFeed:true,
      _sourceBoardRef:sourceBoard,
      _sourceCircuitNo:sourceNo
    };
    const previousDetail=incomingIndex>=0?cert.tables.circuits[incomingIndex]:null;
    if(previousDetail?.maxZsManual && ['ocpdBs','ocpdType','ocpdRating'].every(k=>String(previousDetail[k]??'')===String(incomingDetail[k]??''))){
      incomingDetail.maxZsManual=true;incomingDetail.maxZs=previousDetail.maxZs;
    }
    const sameSource=Boolean(
      previousDetail &&
      normaliseBoardKey(previousDetail._sourceBoardRef)===normaliseBoardKey(sourceBoard) &&
      String(previousDetail._sourceCircuitNo??'').trim()===sourceNo
    );
    const incomingTest={
      ...(sameSource && incomingIndex>=0 ? cert.tables.tests[incomingIndex] : {}),
      boardRef:board.ref,
      circuitNo:'0',
      _incomingFeed:true,
      _sourceBoardRef:sourceBoard,
      _sourceCircuitNo:sourceNo
    };
    if(incomingIndex>=0){
      cert.tables.circuits[incomingIndex]=incomingDetail;
      cert.tables.tests[incomingIndex]=incomingTest;
    }else{
      cert.tables.circuits.push(incomingDetail);
      cert.tables.tests.push(incomingTest);
      incomingIndex=cert.tables.circuits.length-1;
    }
    board.suppliedFrom=sourceBoard+' · Circuit '+sourceNo;
    recalculateCircuitZs(cert,incomingIndex);
    // Only a newly inserted incoming row needs sorting; renders must preserve manual moves.
    if(!oldId) sortCircuitsByNumber(cert,incomingDetail);
  }

  function syncDependentBoardFeeds(cert,sourceBoardRef,sourceCircuitNo){
    if(!cert||!['eic','eicr'].includes(cert.type)) return;
    const boardKey=normaliseBoardKey(sourceBoardRef);
    const no=String(sourceCircuitNo??'').trim();
    (cert.tables?.boards||[]).forEach(board=>{
      if(board.feedSourceType==='Another consumer unit' &&
         normaliseBoardKey(board.sourceBoardRef)===boardKey &&
         String(board.sourceCircuitNo??'').trim()===no){
        syncBoardIncomingCircuit(cert,board);
      }
    });
  }

  function nextCircuitNumber(cert, boardRef='DB1') {
    const boardKey=normaliseBoardKey(boardRef);
    const nums=(cert.tables?.circuits||[])
      .filter(r=>normaliseBoardKey(r.boardRef)===boardKey)
      .map(r=>parseInt(r.circuitNo,10))
      .filter(Number.isFinite);
    return String((nums.length ? Math.max(...nums) : 0)+1);
  }

  function syncCircuitRows(cert) {
    if (!cert?.tables) return;
    cert.tables.circuits = Array.isArray(cert.tables.circuits) ? cert.tables.circuits : [];
    cert.tables.tests = Array.isArray(cert.tables.tests) ? cert.tables.tests : [];
    const total=Math.max(cert.tables.circuits.length,cert.tables.tests.length);
    while(cert.tables.circuits.length<total) cert.tables.circuits.push({});
    while(cert.tables.tests.length<total) cert.tables.tests.push({});
    cert.tables.circuits=cert.tables.circuits.map(row=>isRecord(row)?row:{});
    cert.tables.tests=cert.tables.tests.map(row=>isRecord(row)?row:{});
    cert.tables.circuits.forEach((row,i)=>{
      const test=cert.tables.tests[i]||{};
      const boardRef=String(row.boardRef??'').trim() || String(test.boardRef??'').trim() || 'DB1';
      const rowNo=row.circuitNo;
      const testNo=test.circuitNo;
      const circuitNo=(rowNo!==undefined&&rowNo!==null&&String(rowNo).trim()!=='')
        ? String(rowNo)
        : ((testNo!==undefined&&testNo!==null&&String(testNo).trim()!=='') ? String(testNo) : String(i+1));
      row.id=String(row.id||uid());
      row.boardRef=boardRef;
      row.circuitNo=circuitNo;
      test.boardRef=boardRef;
      test.circuitNo=circuitNo;
      cert.tables.tests[i]=test;
    });
  }

  function circuitNumberParts(value) {
    const text=String(value??'').trim();
    if(!text) return {blank:true,numeric:false,number:Number.POSITIVE_INFINITY,suffix:''};
    const match=text.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if(!match) return {blank:false,numeric:false,number:Number.POSITIVE_INFINITY,suffix:text.toLowerCase()};
    return {blank:false,numeric:true,number:Number(match[1]),suffix:String(match[2]||'').trim().toLowerCase()};
  }

  function sortCircuitsByNumber(cert, activeCircuit=null) {
    syncCircuitRows(cert);
    const boardOrder=new Map((cert.tables.boards||[]).map((b,i)=>[normaliseBoardKey(b.ref),i]));
    cert.tables.circuits.forEach((row,i)=>{
      const board=normaliseBoardKey(row.boardRef);
      if(!boardOrder.has(board)) boardOrder.set(board,boardOrder.size);
    });
    const pairs=cert.tables.circuits.map((circuit,index)=>({
      circuit,
      test:cert.tables.tests[index]||{},
      index,
      board:normaliseBoardKey(circuit.boardRef),
      no:circuitNumberParts(circuit.circuitNo)
    }));
    pairs.sort((a,b)=>{
      const boardDiff=(boardOrder.get(a.board)??999)-(boardOrder.get(b.board)??999);
      if(boardDiff) return boardDiff;
      if(a.no.blank!==b.no.blank) return a.no.blank?1:-1;
      if(a.no.numeric!==b.no.numeric) return a.no.numeric?-1:1;
      if(a.no.numeric && b.no.numeric && a.no.number!==b.no.number) return a.no.number-b.no.number;
      const suffixDiff=a.no.suffix.localeCompare(b.no.suffix,undefined,{numeric:true,sensitivity:'base'});
      return suffixDiff || a.index-b.index;
    });
    cert.tables.circuits=pairs.map(p=>p.circuit);
    cert.tables.tests=pairs.map(p=>p.test);
    cert.tables.circuits.forEach((row,i)=>{
      cert.tables.tests[i].boardRef=row.boardRef||'DB1';
      cert.tables.tests[i].circuitNo=row.circuitNo??'';
    });
    return activeCircuit ? cert.tables.circuits.indexOf(activeCircuit) : -1;
  }

  function renumberCircuits(cert) {
    // Call only after an explicit delete or move: never rewrite an engineer's
    // deliberately entered circuit numbers on an ordinary save/import.
    syncCircuitRows(cert);
    const previous=cert.tables.circuits.map(row=>({
      boardKey:normaliseBoardKey(row.boardRef),
      oldNo:String(row.circuitNo??'').trim(),
      row
    }));
    const counts={},remap=new Map();
    for(let i=0;i<previous.length;i++){
      const {boardKey,oldNo,row}=previous[i];
      const no=String((counts[boardKey]||0)+1);
      counts[boardKey]=Number(no);
      row.circuitNo=no;
      cert.tables.tests[i].boardRef=row.boardRef;
      cert.tables.tests[i].circuitNo=no;
      if(oldNo){
        const key=boardKey+':'+oldNo;
        if(!remap.has(key))remap.set(key,no);
        else remap.set(key,null); // Ambiguous older schedule: never guess which feed.
      }
    }
    // Dependent consumer units follow their physical source circuit, not its old
    // numeric position. A deletion of a live source circuit is refused beforehand.
    for(const board of cert.tables.boards||[]){
      if(!board.sourceBoardRef||!String(board.sourceCircuitNo??'').trim())continue;
      const key=normaliseBoardKey(board.sourceBoardRef)+':'+String(board.sourceCircuitNo).trim();
      const replacement=remap.get(key);
      if(replacement)board.sourceCircuitNo=replacement;
    }
  }

  function moveCircuit(cert,index,direction) {
    syncCircuitRows(cert);
    const from=Number(index);
    if(!Number.isInteger(from)||from<0||from>=cert.tables.circuits.length) return;
    const row=cert.tables.circuits[from];
    if(row?._incomingFeed) return;
    const sameBoard=boardCircuitIndices(cert,row?.boardRef);
    const position=sameBoard.indexOf(from);
    const nextPosition=position+Number(direction);
    if(position<0||nextPosition<0||nextPosition>=sameBoard.length) return;
    const to=sameBoard[nextPosition];
    if(cert.tables.circuits[to]?._incomingFeed) return;
    pushEditHistory('Move circuit');
    const y=window.scrollY;
    [cert.tables.circuits[from],cert.tables.circuits[to]]=[cert.tables.circuits[to],cert.tables.circuits[from]];
    [cert.tables.tests[from],cert.tables.tests[to]]=[cert.tables.tests[to],cert.tables.tests[from]];
    renumberCircuits(cert);
    // Keep the same board/circuit dropdowns open after reordering, otherwise
    // the engineer loses their place every time they press Up or Down.
    openBoardAccordion(row.boardRef);
    saveNow();
    render();
    keepCircuitAccordionVisible(cert,row.boardRef,row.id);
    restoreScroll(y);
  }

  function calculateMaxZs(row, cert) {
    const curve=String(row?.ocpdType||'').trim().toUpperCase();
    const factor={B:5,C:10,D:20}[curve];
    const rating=parseFloat(row?.ocpdRating);
    const standard=String(row?.ocpdBs||'');
    if(!factor || !Number.isFinite(rating) || rating<=0 || !/60898|61009/.test(standard)) return '';
    const voltage=String(cert?.fields?.nominalVoltage??'').trim();
    if(!/^(?:\d+(?:\.\d+)?)(?:\s*\/\s*\d+(?:\.\d+)?)?$/.test(voltage)) return '';
    const values=voltage.split('/').map(Number);
    let u0=Math.min(...values);
    if(!Number.isFinite(u0) || u0<=0 || u0>300) return '';
    const zs=(0.95*u0)/(factor*rating);
    return zs>=10 ? zs.toFixed(1) : zs.toFixed(2);
  }

  function recalculateCircuitZs(cert,index,force=false) {
    const row=cert?.tables?.circuits?.[index]; if(!row) return;
    if(force) row.maxZsManual=false;
    if(row.maxZsManual) return;
    const calc=calculateMaxZs(row,cert);
    row.maxZs=calc||'';
  }

  function singleSignatoryMode(cert) {
    return cert?.fields?.signatoryMode === 'One person — design, construction & inspection';
  }

  function syncSingleSignatory(cert) {
    if(!cert || cert.type!=='eic' || !singleSignatoryMode(cert)) return;
    const f=cert.fields;
    const name=f.singleSignatoryName||'';
    const company=f.singleSignatoryCompany||'';
    const address=f.singleSignatoryAddress||'';
    const postcode=f.singleSignatoryPostcode||'';
    const phone=f.singleSignatoryPhone||'';
    const signature=f.singleSignatorySignature||'';
    const date=f.singleSignatoryDate||'';
    f.designer1=name; f.constructor=name; f.inspector=name;
    f.designerCompany=company; f.constructorCompany=company; f.inspectorCompany=company;
    f.designerAddress=address; f.constructorAddress=address; f.inspectorAddress=address;
    f.designerPostcode=postcode; f.constructorPostcode=postcode; f.inspectorPostcode=postcode;
    f.designerPhone=phone; f.constructorPhone=phone; f.inspectorPhone=phone;
    f.designer1Signature=signature; f.constructorSignature=signature; f.inspectorSignature=signature;
    f.designer1Date=date; f.constructorDate=date; f.inspectionDate=date;
  }

  function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function normaliseCertificateShape(cert) {
    if(!isRecord(cert)) return null;
    const legacyTypeMap = {
      electricalInstallationCertificate:'eic',
      electrical_installation_certificate:'eic',
      conditionReport:'eicr',
      electricalInstallationConditionReport:'eicr',
      electrical_installation_condition_report:'eicr',
      minorWorks:'minor',
      minor_works:'minor',
      emergencyLighting:'emergency',
      emergency_lighting:'emergency',
      smokeAlarm:'smoke',
      smoke_alarm:'smoke'
    };
    if(!SCHEMAS[cert.type] && legacyTypeMap[cert.type]) cert.type=legacyTypeMap[cert.type];
    if(!SCHEMAS[cert.type]) return null;

    cert.id = String(cert.id || uid());
    cert.fields = isRecord(cert.fields) ? cert.fields : {};
    cert.tables = isRecord(cert.tables) ? cert.tables : {};
    cert.status = cert.status === 'Complete' ? 'Complete' : 'Draft';
    cert.createdAt = cert.createdAt || cert.updatedAt || new Date().toISOString();
    cert.updatedAt = cert.updatedAt || cert.createdAt || new Date().toISOString();
    cert.voiceMeta = isRecord(cert.voiceMeta) ? cert.voiceMeta : {};
    cert.voiceMeta.completed = isRecord(cert.voiceMeta.completed) ? cert.voiceMeta.completed : {};
    cert.voiceMeta.later = isRecord(cert.voiceMeta.later) ? cert.voiceMeta.later : {};
    cert.voiceMeta.dismissed = isRecord(cert.voiceMeta.dismissed) ? cert.voiceMeta.dismissed : {};

    const schema=SCHEMAS[cert.type];
    schema.sections.forEach(part=>{
      if(part.type==='section'){
        part.fields.forEach(field=>{
          if(!Object.hasOwn(cert.fields,field.key)) cert.fields[field.key]=defaultFor(field);
        });
      } else if(part.type==='table'){
        let rows=Array.isArray(cert.tables[part.key]) ? cert.tables[part.key] : [];
        rows=rows.filter(isRecord).map(row=>({...row}));
        if(Array.isArray(part.defaultRows) && part.defaultRows.length){
          if(!rows.length && !(cert.boardWorkflowVersion && ['boards','circuits','tests'].includes(part.key))) rows=clone(part.defaultRows);
          else if(part.key!=='boards' && part.defaultRows.every(r=>isRecord(r) && (r.item!==undefined || r.ref!==undefined))){
            const keyName=part.defaultRows.some(r=>r.item!==undefined)?'item':'ref';
            const keyedRows=rows.filter(r=>String(r[keyName]??'').trim()!=='');
            const unkeyedRows=rows.filter(r=>String(r[keyName]??'').trim()==='');
            const existing=new Map(keyedRows.map(r=>[String(r[keyName]??''),r]));
            rows=part.defaultRows.map(def=>({...clone(def),...(existing.get(String(def[keyName]??''))||{})}));
            const known=new Set(part.defaultRows.map(r=>String(r[keyName]??'')));
            rows.push(...Array.from(existing.entries()).filter(([k])=>!known.has(k)).map(([,r])=>r));
            rows.push(...unkeyedRows);
          }
        }
        cert.tables[part.key]=rows;
      }
    });

    if(!cert.number) cert.number=cert.fields.certificateNo || '';
    if(!cert.fields.certificateNo && cert.number) cert.fields.certificateNo=cert.number;
    return cert;
  }

  function normaliseBs883Value(value) {
    if(typeof value!=='string') return value;
    const trimmed=value.trim();
    return (trimmed==='BS 88-3 Type 3' || trimmed==='BS 88-3') ? 'BS88-3' : value;
  }

  function normaliseLegacyDeviceLabels(cert) {
    if(!cert) return cert;
    if(isRecord(cert.fields)){
      Object.keys(cert.fields).forEach(key=>{
        cert.fields[key]=normaliseBs883Value(cert.fields[key]);
      });
    }
    if(isRecord(cert.tables)){
      Object.values(cert.tables).forEach(rows=>{
        if(!Array.isArray(rows)) return;
        rows.forEach(row=>{
          if(!isRecord(row)) return;
          Object.keys(row).forEach(key=>{
            row[key]=normaliseBs883Value(row[key]);
          });
        });
      });
    }
    return cert;
  }

  function migrateCertificate(cert) {
    cert = normaliseCertificateShape(cert);
    if(!cert) return null;
    cert.fields = isRecord(cert.fields) ? cert.fields : {};
    cert.tables = isRecord(cert.tables) ? cert.tables : {};
    normaliseLegacyDeviceLabels(cert);
    if(cert.type==='eic'){
      const f=cert.fields;
      if(!f.signatoryMode){
        const names=[f.designer1,typeof f.constructor==='string'?f.constructor:'',f.inspector].filter(Boolean);
        const same=names.length<=1 || names.every(n=>n===names[0]);
        f.signatoryMode=same ? 'One person — design, construction & inspection' : 'Separate people';
      }
      if(f.signatoryMode==='One person — design, construction & inspection'){
        f.singleSignatoryName=f.singleSignatoryName||f.designer1||(typeof f.constructor==='string'?f.constructor:'')||f.inspector||settings.engineerName||'';
        f.singleSignatoryCompany=f.singleSignatoryCompany||f.designerCompany||f.constructorCompany||f.inspectorCompany||settings.companyName||'';
        f.singleSignatoryAddress=f.singleSignatoryAddress||f.designerAddress||f.constructorAddress||f.inspectorAddress||settings.address||'';
        f.singleSignatoryPostcode=f.singleSignatoryPostcode||f.designerPostcode||f.constructorPostcode||f.inspectorPostcode||settings.postcode||'';
        f.singleSignatoryPhone=f.singleSignatoryPhone||f.designerPhone||f.constructorPhone||f.inspectorPhone||settings.phone||'';
        f.singleSignatoryQualification=f.singleSignatoryQualification||settings.qualification||'';
        f.singleSignatorySignature=f.singleSignatorySignature||f.designer1Signature||f.constructorSignature||f.inspectorSignature||'';
        f.singleSignatoryDate=f.singleSignatoryDate||f.designer1Date||f.constructorDate||f.inspectionDate||'';
        syncSingleSignatory(cert);
      }
    }
    if(cert.type==='eic'||cert.type==='eicr'){
      ensureBoardWorkflowData(cert);
      syncCircuitRows(cert);
      (cert.tables.boards||[]).forEach(board=>{
        if(board.feedSourceType==='Another consumer unit') syncBoardIncomingCircuit(cert,board);
      });
      syncPrimaryBoardLegacyFields(cert);
      const f=cert.fields;
      f.testerMake=f.testerMake||'';
      f.testerModel=f.testerModel||'';
      f.testerSerial=f.testerSerial||f.instrumentMft||'';
      if(f.testerMft===undefined) f.testerMft=Boolean(f.instrumentMft);
      ['testerLowOhm','testerInsulation','testerLoop','testerRcd','testerEarth','testerVoltage'].forEach(k=>{if(f[k]===undefined)f[k]=false;});
    }
    return cert;
  }

  function goTop() {
    requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
  }

  function goCircuits() {
    requestAnimationFrame(()=>{
      const target=document.querySelector('.consumer-unit-workflow')||document.querySelector('.circuit-list');
      if(target) target.scrollIntoView({behavior:'auto',block:'start'});
    });
  }

  function restoreScroll(y){
    requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}));
  }

  function goCircuitBottom(boardRef){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const key=normaliseBoardKey(boardRef);
      // Section J wraps each board and its separate circuits accordion in one
      // consumer-unit-group. Always scroll to the selected board, not DB1.
      const target=document.querySelector('.consumer-unit-group[data-board-key="'+CSS.escape(key)+'"] .cu-circuits-accordion [data-board-add-circuit]') ||
        document.querySelector('.consumer-unit-workflow .add-consumer-unit');
      if(!target)return;
      // Center the Add Circuit control inside the unobstructed viewport.
      // Scroll-to-end can put it behind the sticky bottom PDF/save toolbar,
      // particularly on an EICR with additional inspection sections.
      const absoluteTop=target.getBoundingClientRect().top+window.scrollY;
      const visibleTop=Math.max(72,Math.min(270,window.innerHeight*.38));
      window.scrollTo({top:Math.max(0,absoluteTop-visibleTop),left:0,behavior:'auto'});
      requestAnimationFrame(()=>{
        const rect=target.getBoundingClientRect();
        const safeBottom=window.innerHeight-110;
        if(rect.bottom>safeBottom)window.scrollBy({top:rect.bottom-safeBottom,left:0,behavior:'auto'});
      });
    }));
  }

  function goBoardCard(boardId){
    requestAnimationFrame(()=>{
      const target=document.querySelector('[data-board-id="'+CSS.escape(String(boardId||''))+'"]');
      if(target) target.scrollIntoView({behavior:'auto',block:'start'});
    });
  }

  const eicInspectionRows = [
    ['1.0', 'Condition of consumer’s intake equipment (visual inspection only)'],
    ['2.0', 'Parallel or switched alternative sources of supply'],
    ['3.0', 'Protective measure: Automatic Disconnection of Supply (ADS)'],
    ['4.0', 'Basic protection'],
    ['5.0', 'Protective measures other than ADS'],
    ['6.0', 'Additional protection'],
    ['7.0', 'Distribution equipment'],
    ['8.0', 'Circuits (Distribution and Final)'],
    ['9.0', 'Isolation and switching'],
    ['10.0', 'Current-using equipment (permanently connected)'],
    ['11.0', 'Identification and notices'],
    ['12.0', 'Location(s) containing a bath or shower'],
    ['13.0', 'Other special installations or locations'],
    ['14.0', 'Prosumer’s low voltage electrical installation(s)']
  ].map(([item, description]) => ({ item, description, outcome: '' }));

  const eicrInspectionRows = [
    ['1.1', 'Distributor/supplier intake equipment — service cable, service head, earthing arrangement, meter tails, metering equipment and means of isolation'],
    ['1.2', 'Consumer’s means of isolation (where present)'],
    ['1.3', 'Consumer’s meter tails'],
    ['2.0', 'Adequate arrangements for other sources such as microgenerators'],
    ['3.1', 'Presence and condition of distributor’s earthing arrangement'],
    ['3.2', 'Presence and condition of earth electrode connection where applicable'],
    ['3.3', 'Provision of earthing/bonding labels at appropriate locations'],
    ['3.4', 'Confirmation of earthing conductor size'],
    ['3.5', 'Accessibility and condition of earthing conductor at MET'],
    ['3.6', 'Confirmation of main protective bonding conductor sizes'],
    ['3.7', 'Condition and accessibility of main protective bonding conductor connections'],
    ['3.8', 'Accessibility and condition of other protective bonding connections'],
    ['4.1', 'Adequacy of working space/accessibility to consumer unit/distribution board'],
    ['4.2', 'Security of fixing'],
    ['4.3', 'Condition of enclosure(s) in terms of IP rating'],
    ['4.4', 'Condition of enclosure(s) in terms of fire rating'],
    ['4.5', 'Enclosure not damaged/deteriorated so as to impair safety'],
    ['4.6', 'Presence of main linked switch where required'],
    ['4.7', 'Operation of main switch (functional check)'],
    ['4.8', 'Manual operation of circuit-breakers and RCDs to prove disconnection'],
    ['4.9', 'Correct identification of circuit details and protective devices'],
    ['4.10', 'Presence of RCD six-monthly test notice where required'],
    ['4.11', 'Presence of alternative supply warning notice at or near CU/DB'],
    ['4.12', 'Presence of other required labelling'],
    ['4.13', 'Compatibility of protective devices, bases and components; correct type/rating and no unacceptable thermal damage'],
    ['4.14', 'Single-pole switching or protective devices in line conductor only'],
    ['4.15', 'Protection against mechanical damage where cables enter CU/DB'],
    ['4.16', 'Protection against electromagnetic effects where cables enter CU/DB/enclosures'],
    ['4.17', 'RCDs provided for fault protection including RCBOs'],
    ['4.18', 'RCDs provided for additional protection/requirements including RCBOs'],
    ['4.19', 'Confirmation of indication that SPD is functional'],
    ['4.20', 'Conductor connections correctly located in terminals and tight/secure'],
    ['4.21', 'Adequate arrangements where generating set operates as switched alternative to public supply'],
    ['4.22', 'Adequate arrangements where generating set operates in parallel with public supply'],
    ['4.23', 'Confirmation of indication that AFDD(s) are operational'],
    ['5.1', 'Identification of conductors'],
    ['5.2', 'Cables correctly supported throughout their run'],
    ['5.3', 'Condition of insulation of live parts'],
    ['5.4', 'Non-sheathed cables protected by enclosure in conduit, ducting or trunking'],
    ['5.5', 'Adequacy of cables for current-carrying capacity'],
    ['5.6', 'Coordination between conductors and overload protective devices'],
    ['5.7', 'Adequacy of protective devices: type and rated current for fault protection'],
    ['5.8', 'Presence and adequacy of circuit protective conductors'],
    ['5.9', 'Wiring system(s) appropriate for installation and external influences'],
    ['5.10', 'Concealed cables installed in prescribed zones'],
    ['5.11', 'Concealed cables adequately protected against damage'],
    ['5.12', 'Additional RCD protection not exceeding 30 mA where required'],
    ['5.13', 'Provision of fire barriers, sealing and protection against thermal effects'],
    ['5.14', 'Band II cables segregated/separated from Band I cables'],
    ['5.15', 'Cables segregated/separated from communications cabling'],
    ['5.16', 'Cables segregated/separated from non-electrical services'],
    ['5.17', 'Termination of cables at enclosures; sound connections, insulation enclosed and entry adequately protected'],
    ['5.18', 'Condition of accessories including socket-outlets, switches and joint boxes'],
    ['5.19', 'Suitability of accessories for external influences'],
    ['5.20', 'Adequacy of working space/accessibility to equipment'],
    ['5.21', 'Single-pole switching or protective devices in line conductors only'],
    ['6.1', 'Bath/shower: additional protection for LV circuits by RCD not exceeding 30 mA'],
    ['6.2', 'Bath/shower: SELV or PELV requirements where used'],
    ['6.3', 'Bath/shower: shaver supply units comply with applicable standard'],
    ['6.4', 'Bath/shower: supplementary bonding conductors present where required'],
    ['6.5', 'Bath/shower: LV socket-outlets correctly sited'],
    ['6.6', 'Bath/shower: suitability of equipment for external influences/IP rating'],
    ['6.7', 'Bath/shower: suitability of accessories/controlgear for zone'],
    ['6.8', 'Bath/shower: suitability of current-using equipment for position'],
    ['7.1', 'Other Part 7 special installations or locations — separate details attached where applicable'],
    ['8.1', 'Prosumer’s low voltage electrical installation(s) — Chapter 82 items recorded where applicable']
  ].map(([item, description]) => ({ item, description, outcome: '', comment: '' }));

  const SCHEMAS = {
    eic: {
      code: 'EIC',
      name: 'Electrical Installation Certificate',
      icon: '⚡',
      standard: 'BS 7671:2018+A4:2026',
      description: 'New installations, new circuits, consumer-unit changes and qualifying additions/alterations.',
      sections: [
        section('A · Client details', [f('clientName', 'Client / person ordering the work', 'text', { span: 'full' }), f('clientPostcode', 'Client postcode'), f('clientAddress', 'Client address', 'textarea', { span: 'full' }), f('certificateNo', 'Certificate number'), f('issueDate', 'Issue date', 'date')]),
        section('B · Installation details', [f('installationPostcode', 'Installation postcode'), f('installationAddress', 'Installation address', 'textarea', { span: 'full' }), f('description', 'Description of installation', 'textarea', { span: 'full' }), select('workType', 'Type of work', OPTIONS.workType), f('extent', 'Extent of installation covered by this certificate', 'textarea', { span: 'full' })]),
        section('C · Certification & signatories', [
          select('signatoryMode', 'Responsibility', ['One person — design, construction & inspection', 'Separate people']),
          f('singleSignatoryName', 'Name', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryCompany', 'For/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryPostcode', 'Postcode', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryAddress', 'Address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryPhone', 'Telephone', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryQualification', 'Qualification / role', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatorySignature', 'Signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryDate', 'Date', 'date', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('designer1', 'Designer name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designerCompany', 'Designer — for/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designerPostcode', 'Designer postcode', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designerAddress', 'Designer address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designerPhone', 'Designer telephone', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer1Signature', 'Designer signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer1Date', 'Designer date', 'date', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer2', 'Second designer name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer2Company', 'Second designer — for/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer2Address', 'Second designer address', 'textarea', { span:'full',showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer2Postcode', 'Second designer postcode', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer2Phone', 'Second designer telephone', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer2Signature', 'Second designer signature', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer2Date', 'Second designer date', 'date', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructor', 'Installer / constructor name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorCompany', 'Constructor — for/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorPostcode', 'Installer / constructor postcode', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorAddress', 'Installer / constructor address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorPhone', 'Installer / constructor telephone', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorSignature', 'Constructor signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorDate', 'Construction date', 'date', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspector', 'Inspector name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorCompany', 'Inspector — for/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorPostcode', 'Inspector postcode', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorAddress', 'Inspector address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorPhone', 'Inspector telephone', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorSignature', 'Inspector signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectionDate', 'Inspection & testing date', 'date', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designDepartures', 'Design departures from BS 7671', 'textarea', { span:'full' }),
          f('constructionDepartures', 'Construction departures from BS 7671', 'textarea', { span:'full' }),
          f('inspectionDepartures', 'Inspection & testing departures from BS 7671', 'textarea', { span:'full' }),
          f('permittedExceptions', 'Permitted exceptions / risk assessment details', 'textarea', { span:'full' }),
          select('riskAssessmentAttached', 'Risk assessment attached', OPTIONS.yesNoNA)
        ]),
        section('D · Next inspection', [f('nextInspectionInterval', 'Recommended interval before next inspection (years/months)', 'text', { span: 'full' })]),
        section('F · Supply characteristics & earthing', [select('earthingArrangement', 'Earthing arrangement', OPTIONS.earthing), select('liveConductors', 'Number/type of live conductors', OPTIONS.liveConductors), select('supplyACDC', 'Supply', OPTIONS.acdc), select('nominalVoltage', 'Nominal voltage U/U0 (V)', OPTIONS.nominalVoltage), select('frequency', 'Nominal frequency (Hz)', OPTIONS.frequency), f('ipf', 'Prospective fault current Ipf (kA)'), f('ze', 'External earth fault loop impedance Ze (Ω)'), select('supplyDeviceBs', 'Supply protective device BS (EN)', OPTIONS.supplyDeviceBs), select('supplyDeviceType', 'Supply protective device type', OPTIONS.ocpdType), select('supplyDeviceRating', 'Rated current (A)', OPTIONS.ocpdRating), select('supplyBreakingCapacity', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), select('supplyPolarity', 'Supply polarity confirmed', OPTIONS.yesNoNA), select('otherSources', 'Other sources of supply present', OPTIONS.yesNo)]),
        section('G · Installation particulars', [select('meansOfEarthing', 'Means of earthing', ['Distributor’s facility', 'Installation earth electrode', 'Both', 'Other']), f('maximumDemand', 'Maximum demand'), select('maximumDemandUnit', 'Maximum demand unit', ['A', 'kVA']), select('earthElectrodeType', 'Earth electrode type', OPTIONS.earthElectrodeType), f('earthElectrodeLocation', 'Earth electrode location'), f('earthElectrodeResistance', 'Electrode resistance/impedance (Ω)'), select('earthingConductorMaterial', 'Earthing conductor material', OPTIONS.conductorMaterial), select('earthingConductorCsa', 'Earthing conductor csa (mm²)', OPTIONS.conductorCsa), select('earthingContinuity', 'Earthing conductor continuity verified', OPTIONS.yesNoNA), select('bondingMaterial', 'Main bonding conductor material', OPTIONS.conductorMaterial), select('bondingCsa', 'Main bonding conductor csa (mm²)', OPTIONS.conductorCsa), select('bondingContinuity', 'Bonding continuity verified', OPTIONS.yesNoNA), f('bondingTo', 'Main bonding to (water/gas/oil/steel/LPS/other)', 'text', { span: 'full' }), f('mainSwitchLocation', 'Main switch location'), f('mainSwitchBs', 'Main switch BS (EN)'), select('mainSwitchPoles', 'No. of poles', OPTIONS.poles), select('mainSwitchCurrent', 'Current rating (A)', OPTIONS.ocpdRating), select('mainSwitchVoltage', 'Voltage rating (V)', OPTIONS.nominalVoltage), select('mainSwitchDeviceType', 'Overcurrent device type / setting', OPTIONS.ocpdType), select('mainSwitchBreaking', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), select('mainRcdType', 'RCD main switch type', OPTIONS.rcdType), select('mainRcdIdn', 'RCD IΔn (mA)', OPTIONS.rcdIdn), f('mainRcdDelay', 'RCD time delay (ms)'), f('mainRcdTime', 'Measured operating time (ms)'), select('mainRcdBreaking', 'RCD breaking capacity (kA)', OPTIONS.breakingCapacity), select('mainSwitchDeviceSetting', 'Main switch OCPD device rating/setting (A)', OPTIONS.ocpdRating)]),
        table('eicInspection', 'H · Installation inspection checklist', [
          { key: 'item', label: 'Item', readonly: true },
          { key: 'description', label: 'Check', readonly: true },
          { key: 'outcome', label: 'Result', type: 'select', options: OPTIONS.passNA }
        ], eicInspectionRows),
        section('I · Existing installation comments', [f('existingComments', 'Comments on existing installation (for additions/alterations)', 'textarea', { span: 'full' })]),
        section('J · Schedule details', [f('dbReference', 'DB/CU reference'), f('dbLocation', 'DB/CU location'), f('suppliedFrom', 'Supplied from'), f('distributionOcpd', 'Distribution circuit OCPD'), f('dbRcd', 'DB RCD details'), select('dbSpd', 'SPD details / type(s)', OPTIONS.spdType), f('zdb', 'Zdb (Ω)'), f('dbIpf', 'DB Ipf (kA)'), select('dbPolarity', 'Correct polarity confirmed', OPTIONS.yesNoNA), select('phaseSequence', 'Phase sequence confirmed', OPTIONS.yesNoNA), select('spdOperational', 'SPD operational status confirmed', OPTIONS.yesNoNA)]),
        table('boards', 'Distribution board / consumer unit register', boardColumns, [{ ref:'DB1' }]),
        table('circuits', 'Schedule of circuit details', circuitColumns, [{ boardRef:'DB1', circuitNo: '1' }]),
        table('tests', 'Schedule of test results', testColumns, [{ boardRef:'DB1', circuitNo: '1' }]),
        section('Test instrument', [
          f('testerMake', 'Make'), f('testerModel', 'Model'), f('testerSerial', 'Serial number'),
          f('testerMft', 'Multifunction tester', 'checkbox', { span:'third' }),
          f('testerLowOhm', 'Low resistance ohmmeter', 'checkbox', { span:'third' }),
          f('testerInsulation', 'Insulation resistance', 'checkbox', { span:'third' }),
          f('testerLoop', 'Earth fault loop impedance / Zs', 'checkbox', { span:'third' }),
          f('testerRcd', 'RCD', 'checkbox', { span:'third' }),
          f('testerEarth', 'Earth electrode resistance', 'checkbox', { span:'third' }),
          f('testerVoltage', 'Voltage indicator', 'checkbox', { span:'third' }),
          f('instrumentContinuity','Continuity instrument serial / asset number'),
          f('instrumentInsulation','Insulation resistance instrument serial / asset number'),
          f('instrumentLoop','Earth fault loop impedance instrument serial / asset number'),
          f('instrumentRcd','RCD instrument serial / asset number'),
          f('instrumentEarth','Earth electrode resistance instrument serial / asset number'),
          f('testedBy', 'Tested by'), f('testedDate', 'Tested date', 'date')
        ])
      ]
    },

    eicr: {
      code: 'EICR',
      name: 'Electrical Installation Condition Report',
      icon: '🔎',
      standard: 'BS 7671:2018+A4:2026',
      description: 'Periodic inspection and testing with observations, coding, schedules and overall assessment.',
      sections: [
        section('A · Person ordering the report', [f('clientName', 'Name', 'text', { span: 'full' }), f('clientPostcode', 'Postcode'), f('clientAddress', 'Address', 'textarea', { span: 'full' }), f('certificateNo', 'Report number'), f('issueDate', 'Report issue date', 'date')]),
        section('B · Reason for producing this report', [f('reason', 'Reason for report', 'textarea', { span: 'full' }), f('inspectionDates', 'Date(s) inspection and testing carried out', 'text', { span: 'full' })]),
        section('C · Installation details', [f('occupier', 'Occupier'), f('installationPostcode', 'Installation postcode'), f('installationAddress', 'Installation address', 'textarea', { span: 'full' }), select('premisesType', 'Description of premises', OPTIONS.premises), f('premisesOther', 'Other description'), f('age', 'Estimated age of wiring system (years)'), select('additionsEvidence', 'Evidence of additions/alterations', ['Yes', 'Not apparent']), f('additionsAge', 'If yes, estimated age (years)'), select('recordsAvailable', 'Installation records available', OPTIONS.yesNo), f('lastInspection', 'Date of last inspection', 'date')]),
        section('D · Extent & limitations', [f('extentInspected', 'Parts of installation inspected and tested', 'textarea', { span: 'full' }), f('agreedLimitations', 'Agreed limitations including reasons', 'textarea', { span: 'full' }), f('agreedWith', 'Agreed with'), f('operationalLimitations', 'Operational limitations and reasons', 'textarea', { span: 'full' }), f('standardAmendedTo', 'Inspection carried out to BS 7671 amended to', 'text', { placeholder: 'A4:2026' })]),
        section('E · Summary of condition', [select('overallAssessment', 'Overall assessment', OPTIONS.overall), f('generalCondition', 'General condition of the installation (electrical safety)', 'textarea', { span: 'full' })]),
        section('F · Recommendation for next inspection', [f('nextInspectionDate', 'Further inspection recommended before', 'date'), f('nextInspectionReason', 'Reason for recommended interval', 'textarea', { span: 'full' })]),
        section('G · Declaration', [f('inspectedBy', 'Inspected and tested by'), f('inspectorPosition', 'Position'), f('inspectorCompany', 'For/on behalf of'), f('inspectorAddress', 'Inspector address', 'textarea'), f('inspectorSignature', 'Inspector signature / typed name'), f('inspectorDate', 'Inspector date', 'date'), f('authorisedBy', 'Report authorised for issue by'), f('authoriserPosition', 'Authoriser position'), f('authoriserCompany', 'For/on behalf of'), f('authoriserAddress', 'Authoriser address', 'textarea'), f('authoriserSignature', 'Authoriser signature / typed name'), f('authoriserDate', 'Authoriser date', 'date')]),
        section('H · Schedules attached', [f('continuationSheets', 'Continuation sheets / sections'), f('inspectionSchedules', 'No. of inspection schedules'), f('circuitSchedules', 'No. of circuit/test schedules')]),
        section('I · Supply characteristics & earthing', [select('earthingArrangement', 'Earthing arrangement', OPTIONS.earthing), select('liveConductors', 'Number/type of live conductors', OPTIONS.liveConductors), select('supplyACDC', 'Supply', OPTIONS.acdc), select('nominalVoltage', 'Nominal voltage U/U0 (V)', OPTIONS.nominalVoltage), select('frequency', 'Nominal frequency (Hz)', OPTIONS.frequency), f('ipf', 'Prospective fault current Ipf (kA)'), f('ze', 'External earth fault loop impedance Ze (Ω)'), select('supplyDeviceBs', 'Supply protective device BS (EN)', OPTIONS.supplyDeviceBs), select('supplyDeviceType', 'Supply protective device type', OPTIONS.ocpdType), select('supplyDeviceRating', 'Rated current (A)', OPTIONS.ocpdRating), select('supplyBreakingCapacity', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), select('supplyPolarity', 'Supply polarity confirmed', OPTIONS.yesNoNA), select('otherSources', 'Other sources of supply present', OPTIONS.yesNo)]),
        section('J · Installation particulars', [select('meansOfEarthing', 'Means of earthing', ['Distributor’s facility', 'Installation earth electrode', 'Both', 'Other']), f('maximumDemand', 'Maximum demand'), f('maximumDemandUnit', 'Unit', 'select', { options: ['A', 'kVA'] }), select('earthElectrodeType', 'Earth electrode type', OPTIONS.earthElectrodeType), f('earthElectrodeLocation', 'Earth electrode location'), f('earthElectrodeResistance', 'Electrode resistance/impedance (Ω)'), select('earthingConductorMaterial', 'Earthing conductor material', OPTIONS.conductorMaterial), select('earthingConductorCsa', 'Earthing conductor csa (mm²)', OPTIONS.conductorCsa), select('earthingContinuity', 'Earthing conductor continuity verified', OPTIONS.yesNoNA), select('bondingMaterial', 'Main bonding conductor material', OPTIONS.conductorMaterial), select('bondingCsa', 'Main bonding conductor csa (mm²)', OPTIONS.conductorCsa), select('bondingContinuity', 'Bonding continuity verified', OPTIONS.yesNoNA), f('bondingTo', 'Main protective bonding to', 'text', { span: 'full' }), f('mainSwitchLocation', 'Main switch location'), f('mainSwitchBs', 'Main switch BS (EN)'), select('mainSwitchPoles', 'No. of poles', OPTIONS.poles), select('mainSwitchCurrent', 'Current rating (A)', OPTIONS.ocpdRating), select('mainSwitchVoltage', 'Voltage rating (V)', OPTIONS.nominalVoltage), select('mainSwitchDeviceType', 'Overcurrent device type / setting', OPTIONS.ocpdType), select('mainSwitchBreaking', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), select('mainRcdType', 'RCD main switch type', OPTIONS.rcdType), select('mainRcdIdn', 'RCD IΔn (mA)', OPTIONS.rcdIdn), f('mainRcdDelay', 'RCD time delay (ms)'), f('mainRcdTime', 'Measured operating time (ms)'), select('mainRcdBreaking', 'RCD breaking capacity (kA)', OPTIONS.breakingCapacity), select('mainSwitchDeviceSetting', 'Main switch OCPD device rating/setting (A)', OPTIONS.ocpdRating)]),
        table('observations', 'K · Observations', [
          { key: 'item', label: 'Item' }, { key: 'observation', label: 'Observation / defect' }, { key: 'code', label: 'Code', type: 'select', options: OPTIONS.observationCode }, { key: 'scheduleRef', label: 'Schedule ref.' }
        ], [{ item: '1' }]),
        table('eicrInspection', 'Condition report schedule of inspection', [
          { key: 'item', label: 'Item', readonly: true }, { key: 'description', label: 'Description', readonly: true }, { key: 'outcome', label: 'Outcome', type: 'select', options: OPTIONS.eicrOutcome }
        ], eicrInspectionRows),
        section('Circuit schedule header', [f('dbReference', 'DB/CU reference'), f('dbLocation', 'DB/CU location'), f('suppliedFrom', 'Supplied from'), f('distributionOcpd', 'Distribution circuit OCPD'), f('dbRcd', 'DB RCD details'), select('dbSpd', 'SPD details / type(s)', OPTIONS.spdType), f('zdb', 'Zdb (Ω)'), f('dbIpf', 'DB Ipf (kA)'), select('dbPolarity', 'Correct polarity confirmed', OPTIONS.yesNoNA), select('phaseSequence', 'Phase sequence confirmed', OPTIONS.yesNoNA), select('spdOperational', 'SPD operational status confirmed', OPTIONS.yesNoNA)]),
        table('boards', 'Distribution board / consumer unit register', boardColumns, [{ ref:'DB1' }]),
        table('circuits', 'Schedule of circuit details', circuitColumns, [{ boardRef:'DB1', circuitNo: '1' }]),
        table('tests', 'Schedule of test results', testColumns, [{ boardRef:'DB1', circuitNo: '1' }]),
        section('Test instrument', [
          f('testerMake', 'Make'), f('testerModel', 'Model'), f('testerSerial', 'Serial number'),
          f('testerMft', 'Multifunction tester', 'checkbox', { span:'third' }),
          f('testerLowOhm', 'Low resistance ohmmeter', 'checkbox', { span:'third' }),
          f('testerInsulation', 'Insulation resistance', 'checkbox', { span:'third' }),
          f('testerLoop', 'Earth fault loop impedance / Zs', 'checkbox', { span:'third' }),
          f('testerRcd', 'RCD', 'checkbox', { span:'third' }),
          f('testerEarth', 'Earth electrode resistance', 'checkbox', { span:'third' }),
          f('testerVoltage', 'Voltage indicator', 'checkbox', { span:'third' }),
          f('instrumentContinuity', 'Continuity instrument serial / asset number'),
          f('instrumentInsulation', 'Insulation resistance instrument serial / asset number'),
          f('instrumentLoop', 'Earth fault loop impedance instrument serial / asset number'),
          f('instrumentRcd', 'RCD instrument serial / asset number'),
          f('instrumentEarth', 'Earth electrode resistance instrument serial / asset number'),
          f('testedBy', 'Tested by'), f('testedDate', 'Tested date', 'date')
        ])
      ]
    },

    minor: {
      code: 'MEIWC',
      name: 'Minor Electrical Installation Works Certificate',
      icon: '🛠️',
      standard: 'BS 7671:2018+A4:2026',
      description: 'For an addition or alteration to a single existing circuit where no new circuit is provided.',
      sections: [
        section('A · Description of the minor works', [f('certificateNo', 'Certificate number'), f('clientName', 'Client details', 'text', { span: 'full' }), f('completionDate', 'Date minor works completed', 'date'), f('installationPostcode', 'Installation postcode'), f('installationAddress', 'Installation location/address', 'textarea', { span: 'full' }), f('description', 'Description of minor works', 'textarea', { span: 'full' }), f('departures', 'Departures from BS 7671', 'textarea', { span: 'full' }), f('permittedExceptions', 'Permitted exceptions / risk assessment details', 'textarea', { span: 'full' }), select('riskAssessmentAttached', 'Risk assessment attached', OPTIONS.yesNoNA), f('existingDefects', 'Comments / defects observed in existing installation', 'textarea', { span: 'full' })]),
        section('B · Earthing & bonding adequacy', [select('earthingArrangement', 'System earthing arrangement', OPTIONS.earthing), f('zdb', 'Earth fault loop impedance at DB Zdb (Ω)'), select('earthingConductorAdequate', 'Adequate earthing conductor present', OPTIONS.yesNoNA), f('bondingPresent', 'Main protective bonding to', 'text', { span: 'full' })]),
        section('C · Circuit details', [f('dbReference', 'DB reference no.'), f('dbLocationType', 'DB location and type'), f('circuitNo', 'Circuit no.'), f('circuitDescription', 'Circuit description'), select('referenceMethod', 'Reference method', OPTIONS.refMethod), f('liveCsa', 'Live conductor csa (mm²)'), f('cpcCsa', 'CPC csa (mm²)'), select('ocpdBs', 'OCPD BS (EN)', OPTIONS.ocpdBs), select('ocpdType', 'OCPD type', OPTIONS.ocpdType), select('ocpdRating', 'OCPD rating (A)', OPTIONS.ocpdRating), select('breakingCapacity', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), f('rcdBs', 'RCD BS (EN)'), select('rcdType', 'RCD type', OPTIONS.rcdType), f('rcdRating', 'RCD rating (A)'), f('rcdIdn', 'RCD IΔn (mA)'), f('rcdDelay', 'RCD time delay (ms)'), f('afddBs', 'AFDD BS (EN)'), f('afddRating', 'AFDD rating (A)'), f('spdBs', 'SPD BS (EN)'), f('spdType', 'SPD type')]),
        section('D · Test results', [f('r1r2', 'Protective conductor continuity R1+R2 (Ω)'), f('r2', 'Protective conductor continuity R2 (Ω)'), f('ringR1', 'Ring r1-r1 (Ω)'), f('ringRn', 'Ring rn-rn (Ω)'), f('ringR2', 'Ring r2-r2 (Ω)'), f('irVoltage', 'Insulation resistance test voltage (V)'), f('irLL', 'Insulation resistance Live-Live (MΩ)'), f('irLE', 'Insulation resistance Live-Earth (MΩ)'), select('polarity', 'Polarity satisfactory', OPTIONS.yesNoNA), f('zs', 'Maximum measured Zs (Ω)'), f('rcdTime', 'RCD disconnection time at IΔn (ms)'), select('rcdButton', 'RCD test button satisfactory', OPTIONS.yesNoNA), select('afddButton', 'AFDD test button satisfactory', OPTIONS.yesNoNA), select('spdFunction', 'SPD functionality confirmed', OPTIONS.yesNoNA)]),
        section('E · Declaration', [f('engineerName', 'Name'), f('forOnBehalfOf', 'For/on behalf of'), f('address', 'Address', 'textarea'), f('position', 'Position'), f('signature', 'Signature / typed name'), f('declarationDate', 'Date', 'date')])
      ]
    },

    emergency: {
      code: 'EL',
      name: 'Emergency Lighting Certificate',
      icon: '🟩',
      standard: 'BS 5266:2025 · BS EN 1838:2024 · BS EN 50172:2024',
      description: 'Completion, periodic inspection/test or small-installation record with design/installation/verification information.',
      sections: [
        section('Certificate & premises', [select('certificateType', 'Certificate type', OPTIONS.emergencyType), f('certificateNo', 'Certificate number'), f('issueDate', 'Issue date', 'date'), f('clientName', 'Client / responsible person'), f('premisesName', 'Premises name'), f('premisesPostcode', 'Premises postcode'), f('premisesAddress', 'Premises address', 'textarea', { span: 'full' }), select('premisesType', 'Premises type', OPTIONS.premises), f('systemRef', 'System / drawing reference')]),
        section('System design information', [f('standard', 'Standards applied', 'text', { span: 'full', defaultValue: 'BS 5266:2025; BS EN 1838:2024; BS EN 50172:2024' }), select('operatingMode', 'Emergency lighting operating mode', OPTIONS.emergencyMode), select('ratedDuration', 'Rated emergency duration', OPTIONS.testDuration), f('designIlluminance', 'Design illuminance / design criteria', 'textarea', { span: 'full' }), f('riskAssessmentRef', 'Fire risk assessment / design risk reference'), f('drawingRef', 'Emergency lighting layout drawing reference'), f('deviations', 'Variations / deviations from standards or design', 'textarea', { span: 'full' }), f('designerName', 'Designer name'), f('designerCompany', 'Designer company'), f('designerSignature', 'Design declaration signature / typed name'), f('designerDate', 'Design declaration date', 'date')]),
        section('Installation & supply', [f('installerName', 'Installer name'), f('installerCompany', 'Installer company'), f('supplyOrigin', 'Emergency lighting supply / distribution reference'), f('protectiveDevice', 'Protective device details'), f('testFacility', 'Test/key-switch/automatic test facility details', 'textarea', { span: 'full' }), f('installationNotes', 'Installation notes / cable / fire-resistance information', 'textarea', { span: 'full' }), f('installerSignature', 'Installation declaration signature / typed name'), f('installerDate', 'Installation declaration date', 'date')]),
        table('luminaires', 'Luminaire / sign / device schedule', [
          { key: 'ref', label: 'Ref.' }, { key: 'location', label: 'Location' }, { key: 'device', label: 'Luminaire / sign type' }, { key: 'mode', label: 'Mode', type: 'select', options: OPTIONS.emergencyMode }, { key: 'duration', label: 'Duration', type: 'select', options: OPTIONS.testDuration }, { key: 'battery', label: 'Battery / source' }, { key: 'result', label: 'Result', type: 'select', options: OPTIONS.testResult }, { key: 'remarks', label: 'Remarks' }
        ], [{ ref: 'EL1' }]),
        section('Verification / test', [f('verificationDate', 'Verification / test date', 'date'), f('mainsFailureTest', 'Mains failure / functional test result'), f('durationTest', 'Full duration test result'), f('luxTest', 'Illuminance / lux test details', 'textarea', { span: 'full' }), select('signsCorrect', 'Exit / safety signs correct and visible', OPTIONS.yesNoNA), select('chargingIndicators', 'Charging/status indicators satisfactory', OPTIONS.yesNoNA), select('autoTest', 'Automatic test system satisfactory / N/A', OPTIONS.yesNoNA), f('defects', 'Defects / remedial work required', 'textarea', { span: 'full' }), f('nextTestDate', 'Next periodic test / service due', 'date'), f('verifierName', 'Verifier / competent person'), f('verifierCompany', 'For/on behalf of'), f('verifierSignature', 'Verification signature / typed name'), f('verifierDate', 'Verification declaration date', 'date')]),
        section('Handover documentation', [select('logbookProvided', 'Logbook / test record provided', OPTIONS.yesNoNA), select('drawingsProvided', 'As-fitted drawings / location plan provided', OPTIONS.yesNoNA), select('instructionsProvided', 'User / maintenance instructions provided', OPTIONS.yesNoNA), f('handoverNotes', 'Handover notes', 'textarea', { span: 'full' })])
      ]
    },

    smoke: {
      code: 'FDAS',
      name: 'Household Smoke Alarm Certificate',
      icon: '🚨',
      standard: 'BS 5839-6:2019+A1:2020',
      description: 'Domestic fire detection and alarm design / installation / commissioning record for household systems.',
      sections: [
        section('Certificate & premises', [f('certificateNo', 'Certificate number'), f('issueDate', 'Issue date', 'date'), f('clientName', 'Client / occupier'), f('premisesPostcode', 'Premises postcode'), f('premisesAddress', 'Premises address', 'textarea', { span: 'full' }), f('premisesDescription', 'Premises description', 'textarea', { span: 'full' })]),
        section('System classification & design', [f('standard', 'Standard', 'text', { defaultValue: 'BS 5839-6:2019+A1:2020' }), select('grade', 'System grade', OPTIONS.smokeGrade), select('category', 'System category', OPTIONS.smokeCategory), select('interlink', 'Interconnection method', OPTIONS.interlink), f('systemDescription', 'System description / extent', 'textarea', { span: 'full' }), f('riskBasis', 'Risk assessment / category basis / special risks', 'textarea', { span: 'full' }), f('variations', 'Variations from recommendations', 'textarea', { span: 'full' }), f('designerName', 'Designer / responsible person'), f('designerSignature', 'Design signature / typed name'), f('designDate', 'Design date', 'date')]),
        table('alarms', 'Alarm / detector schedule', [
          { key: 'ref', label: 'Ref.' }, { key: 'location', label: 'Location' }, { key: 'type', label: 'Device type', type: 'select', options: OPTIONS.alarmType }, { key: 'makeModel', label: 'Make / model' }, { key: 'power', label: 'Power source / battery' }, { key: 'interlink', label: 'Interlink', type: 'select', options: OPTIONS.interlink }, { key: 'test', label: 'Test', type: 'select', options: OPTIONS.testResult }, { key: 'remarks', label: 'Remarks' }
        ], [{ ref: 'A1' }]),
        section('Installation checks', [select('sitingCompliant', 'Detector siting / coverage satisfactory', OPTIONS.yesNoNA), select('powerCompliant', 'Power supplies / standby provision satisfactory', OPTIONS.yesNoNA), select('interlinkTest', 'Interconnection / radio link tested satisfactory', OPTIONS.yesNoNA), select('soundersTest', 'Audibility / alarm operation satisfactory', OPTIONS.yesNoNA), select('visualWarning', 'Visual/tactile warning provision satisfactory where required', OPTIONS.yesNoNA), select('labels', 'Labelling / circuit identification satisfactory', OPTIONS.yesNoNA), f('installationNotes', 'Installation notes / defects / departures', 'textarea', { span: 'full' }), f('installerName', 'Installer'), f('installerCompany', 'For/on behalf of'), f('installerSignature', 'Installation signature / typed name'), f('installationDate', 'Installation date', 'date')]),
        section('Commissioning & handover', [f('commissioningDate', 'Commissioning date', 'date'), select('allDevicesTested', 'All detectors / alarms function tested', OPTIONS.yesNoNA), select('interconnectionConfirmed', 'All interconnected alarms activate as intended', OPTIONS.yesNoNA), select('mainsFailure', 'Standby supply / mains failure operation checked', OPTIONS.yesNoNA), select('faultIndicators', 'Fault / low-battery indicators checked where applicable', OPTIONS.yesNoNA), select('instructionsGiven', 'User instructions and test/maintenance guidance given', OPTIONS.yesNoNA), f('commissioningNotes', 'Commissioning notes', 'textarea', { span: 'full' }), f('commissionerName', 'Commissioner'), f('commissionerCompany', 'For/on behalf of'), f('commissionerSignature', 'Commissioning signature / typed name'), f('commissionerDate', 'Commissioning declaration date', 'date'), f('nextServiceDate', 'Next service / inspection recommended', 'date')])
      ]
    }
  };


  // Specialist records: original independent layouts. These supplement the
  // inspection, testing and statutory certificates required for each installation.
  Object.assign(SCHEMAS, {
    pat:{
      code:'PAT',name:'Portable Appliance Inspection & Testing Record',icon:'🔌',
      standard:'IET Code of Practice for In-service Inspection and Testing of Electrical Equipment, 5th Edition',
      description:'Risk-based equipment register, visual inspection, measurements, repairs and faulty-item records.',
      sections:[
        section('Client and risk assessment',[
          f('certificateNo','Record reference'),f('issueDate','Inspection date','date'),
          f('clientName','Duty-holder / client'),f('installationAddress','Premises','textarea',{span:'full'}),
          f('installationPostcode','Postcode'),f('riskBasis','Equipment risk assessment and test intervals','textarea',{span:'full'}),
          f('limitations','Scope and limitations / inaccessible equipment','textarea',{span:'full'})
        ]),
        section('Test instruments',[
          f('instrumentMake','Manufacturer'),f('instrumentModel','Model'),f('instrumentSerial','Serial / asset reference'),
          f('calibrationDate','Last calibration / verification','date'),f('functionCheck','Instrument function check / details'),
          f('testingMethod','Tests selected and reasons','textarea',{span:'full'})
        ]),
        table('appliances','Equipment register and inspection / test schedule',[
          {key:'asset',label:'Asset ID'},{key:'location',label:'Location'},{key:'description',label:'Equipment / manufacturer / model'},
          {key:'class',label:'Class',type:'select',options:['','I','II','III','Other']},
          {key:'visual',label:'Visual result',type:'select',options:['','Pass','Fail','N/A']},
          {key:'earth',label:'Protective conductor resistance (Ω)'},{key:'insulation',label:'Insulation resistance (MΩ)'},
          {key:'leakage',label:'Leakage / touch current (mA)'},{key:'polarity',label:'Polarity / wiring',type:'select',options:['','Pass','Fail','N/A']},
          {key:'functional',label:'Functional test',type:'select',options:['','Pass','Fail','N/A']},
          {key:'outcome',label:'Final result',type:'select',options:['','Pass','Fail','Not tested','Requires review']},
          {key:'nextDate',label:'Next assessment date'},{key:'remarks',label:'Defects / action / limitations'}
        ],[{asset:'PAT-001'}]),
        table('repairs','Repair register',[
          {key:'asset',label:'Asset ID'},{key:'defect',label:'Fault / repair work'},
          {key:'date',label:'Date'},{key:'retest',label:'Post-repair test'},{key:'by',label:'Responsible person'}
        ],[]),
        table('faulty','Failed equipment and isolation / disposition',[
          {key:'asset',label:'Asset ID'},{key:'defect',label:'Defect'},{key:'isolation',label:'Removed from service / labelled'},
          {key:'owner',label:'Person informed'},{key:'action',label:'Repair / disposal / replacement'}
        ],[]),
        section('Declaration',[
          f('testedBy','Tester name'),f('qualification','Competence / role'),f('company','For / on behalf of'),
          f('signature','Signature / typed name'),f('declarationDate','Declaration date','date')
        ])
      ]
    },
    ev:{
      code:'EV',name:'EV Charge Point Installation & Commissioning Record',icon:'🚗',
      standard:'BS 7671:2018+A4:2026, Section 722 · IET EV Charging Equipment Installation Code of Practice',
      description:'EVSE commissioning, safety checks and DNO handover; supplement the applicable electrical certificate.',
      sections:[
        section('Customer and equipment',[
          f('certificateNo','Record reference'),f('issueDate','Date','date'),
          f('clientName','Client / operator'),f('installationAddress','Site address','textarea',{span:'full'}),
          f('installationPostcode','Postcode'),f('chargerLocation','Charger location'),
          f('manufacturer','EVSE manufacturer'),f('model','Model'),f('serial','Serial / unique ID'),
          f('firmware','Firmware / configuration'),f('ratedOutput','Rated output (kW)'),f('ratedCurrent','Rated current (A)'),
          select('phases','Phases',['','Single-phase','Three-phase'])
        ]),
        section('Supply, circuit and protection',[
          f('supplyReference','Origin / distribution board'),f('circuitReference','Dedicated circuit reference'),
          f('ocpd','Overcurrent device standard / type / rating'),f('rcd','RCD type, rating, IΔn and DC detection arrangement'),
          f('earthing','Earthing arrangement'),f('openPen','Open-PEN arrangement / applicable risk assessment'),
          f('cable','Cable size, type, route and installation method'),f('loadManagement','Load management / CT / setting'),
          f('maxDemand','Existing demand and supply capacity assessment'),
          f('isolation','Local isolation and switching arrangements')
        ]),
        section('DNO and commissioning',[
          f('dno','DNO'),f('mpan','MPAN or supply reference'),
          select('dnoStatus','DNO notification / application',['','Notification required','Prior approval required','Approved','Not applicable','To check']),
          f('dnoReference','DNO approval / notification reference'),f('dnoDate','DNO response / notification date','date'),
          f('r1r2','Measured R1+R2 (Ω)'),f('zs','Measured Zs (Ω)'),f('ir','Insulation resistance (MΩ)'),
          select('polarity','Polarity confirmed',OPTIONS.yesNoNA),
          f('rcdTime','RCD measured operating time (ms)'),
          select('penTest','Open-PEN protection / earthing function tested',OPTIONS.yesNoNA),
          select('chargeTest','Charging operation',OPTIONS.testResult),
          select('loadTest','Load management function',OPTIONS.testResult),
          select('labels','Labels / user warnings',OPTIONS.yesNoNA),
          f('testInstrument','Instrument / serial number'),f('limitations','Defects, departures and limitations','textarea',{span:'full'})
        ]),
        section('Handover and declaration',[
          f('linkedEic','Related EIC / MEIWC number'),
          select('instructions','User instructions and manufacturer documentation handed over',OPTIONS.yesNoNA),
          f('installerName','Installer / tester'),f('installerCompany','Company'),
          f('signature','Signature / typed name'),f('declarationDate','Declaration date','date')
        ])
      ]
    },
    solar:{
      code:'PV',name:'Solar PV Inspection & Commissioning Record',icon:'☀️',
      standard:'BS EN 62446-1:2016+A1:2018 · BS 7671:2018+A4:2026 Section 712',
      description:'PV string measurements, safety inspection and handover; supplement the applicable EIC / DNO submission.',
      sections:[
        section('System and site',[
          f('certificateNo','Record reference'),f('issueDate','Date','date'),
          f('clientName','Client'),f('installationAddress','Site address','textarea',{span:'full'}),
          f('installationPostcode','Postcode'),f('designReference','Design / drawing / single-line diagram reference'),
          f('arrayPower','Rated DC system output (kWp)'),f('moduleMake','PV module make and model'),
          f('moduleCount','PV module count'),f('inverterMake','Inverter make and model'),
          f('inverterSerial','Inverter serial'),f('batteryDetails','Battery / hybrid inverter details if applicable')
        ]),
        section('Inspection / DNO / electrical safety',[
          f('acSupply','AC circuit / board'),f('acProtection','AC OCPD, isolation and protection'),
          f('dcProtection','DC isolation, protection and SPDs'),f('earthing','Protective earthing / bonding'),
          f('dcCable','DC cable specifications / routing'),f('acCable','AC cable specifications / routing'),
          f('structural','Mounting / structure / roof inspection notes','textarea',{span:'full'}),
          f('dno','DNO / G98 / G99 status and reference'),
          f('inverterSettings','Grid protection / inverter settings'),
          f('labels','Array / isolation / equipment identification labels'),
          f('limitations','Limitations, deviations and hazards','textarea',{span:'full'})
        ]),
        table('strings','DC string inspection and measurements',[
          {key:'ref',label:'String reference'},{key:'modules',label:'Modules'},{key:'polarity',label:'Polarity',type:'select',options:['','Pass','Fail','N/A']},
          {key:'voc',label:'Voc (V)'},{key:'isc',label:'Isc (A)'},{key:'ir',label:'Insulation resistance (MΩ)'},
          {key:'inspected',label:'Visual',type:'select',options:['','Pass','Fail','N/A']},
          {key:'remarks',label:'Conditions / test conditions / notes'}
        ],[{ref:'PV1'}]),
        section('AC commissioning, checks and handover',[
          f('acZs','AC Zs (Ω)'),f('acInsulation','AC insulation resistance (MΩ)'),
          f('acRcd','RCD type / test'),f('inverterStart','Inverter start-up / generation checks'),
          f('shutdown','Shutdown / isolation / disconnection checks'),f('monitoring','Generation monitoring / metering verification'),
          f('testInstrument','Test instrument(s), serial and calibration'),
          f('handover','Handover drawings, manuals, warranties and test documents','textarea',{span:'full'}),
          f('linkedEic','Related electrical certificate reference'),f('testedBy','Inspector / competent person'),
          f('company','Company'),f('signature','Signature / typed name'),f('declarationDate','Declaration date','date')
        ])
      ]
    },
    commercialFire:{
      code:'FDAS-1',name:'Non-Domestic Fire Alarm System Record',icon:'🚨',
      standard:'BS 5839-1:2025',
      description:'Design, installation, commissioning, modification and periodic servicing records for non-domestic systems.',
      sections:[
        section('Premises and report details',[
          select('certificateType','Record type',['','Design','Installation','Commissioning','Periodic inspection / service','Modification / extension']),
          f('certificateNo','Record reference'),f('issueDate','Date','date'),
          f('clientName','Responsible person / client'),f('premisesAddress','Premises address','textarea',{span:'full'}),
          f('premisesPostcode','Postcode'),f('systemRef','System / drawing reference'),
          f('panel','Control and indicating equipment / panel identification'),f('panelLocation','Panel location')
        ]),
        section('Design and installation particulars',[
          f('category','System category / purpose'),f('coverage','Extent and protected areas','textarea',{span:'full'}),
          f('designRisk','Fire strategy / risk assessment basis'),f('devices','Detection, alarms, interfaces and call points / design'),
          f('power','Mains / standby power supply arrangements'),f('cabling','Cable system and fire performance'),
          f('monitoring','Monitoring / signalling arrangements'),f('variations','Variations / departures, agreement and authority','textarea',{span:'full'}),
          f('installationScope','Installation / modification scope','textarea',{span:'full'})
        ]),
        table('zones','Zone / device / interface inspection schedule',[
          {key:'zone',label:'Zone / ref'},{key:'area',label:'Area / location'},{key:'device',label:'Device / interface'},
          {key:'test',label:'Functional result',type:'select',options:['','Pass','Fail','Not tested','N/A']},
          {key:'remarks',label:'Fault / variation / action'}
        ],[{zone:'1'}]),
        section('Commissioning / servicing / faults',[
          select('mainsFailure','Mains failure & standby supply test',OPTIONS.yesNoNA),
          select('detectors','Detection operation verified',OPTIONS.yesNoNA),
          select('callPoints','Manual call points verified',OPTIONS.yesNoNA),
          select('sounders','Sounders / audibility / visual signals checked',OPTIONS.yesNoNA),
          select('interfaces','Fire safety interfaces verified',OPTIONS.yesNoNA),
          select('signals','Remote signalling tested / N/A',OPTIONS.yesNoNA),
          f('logBook','Log book entries / service history'),f('faults','Outstanding faults / recommendations','textarea',{span:'full'}),
          f('testLimitations','Unverified items and limitations','textarea',{span:'full'}),
          f('nextService','Next service / review date','date')
        ]),
        section('Responsibility / declaration / handover',[
          f('designer','Designer name and organisation'),f('installer','Installation company'),
          f('commissioner','Commissioning / service engineer'),f('qualification','Role / competency'),
          f('documentation','As-fitted documentation, log book, user instructions / handover'),
          f('signature','Declaration signature / typed name'),f('declarationDate','Date','date')
        ])
      ]
    }
  });


  // The published PAT V1–V6 forms distinguish the organisation responsible for
  // the equipment from the premises, and separately identify the inspector.
  SCHEMAS.pat.sections[0].fields.push(
    f('organisationName','Organisation name (equipment register)'),
    f('organisationAddress','Organisation address','textarea',{span:'full'}),
    f('responsiblePerson','Responsible person / duty-holder'),
    f('inspectorOrganisation','Inspection/testing organisation (if different)')
  );
  // PAT is reconciled with the IET's freely published model Forms V1–V6.
  // This remains our original table layout, and must not be advertised as an
  // official IET product or identical to an IET copyrighted form.
  function addColumns(form,key,additional){
    const tab=form.sections.find(x=>x.type==='table'&&x.key===key);
    if(!tab)throw Error('Specialist schedule absent: '+key);
    for(const c of additional)if(!tab.columns.some(x=>x.key===c.key))tab.columns.push(c);
  }
  addColumns(SCHEMAS.pat,'appliances',[
    {key:'equipmentType',label:'Equipment type / usage (portable, stationary, etc.)'},
    {key:'make',label:'Manufacturer'},{key:'model',label:'Model'},{key:'serial',label:'Equipment serial number'},
    {key:'voltage',label:'Voltage (V, AC/DC)'},{key:'rating',label:'Rating (W or A)'},{key:'fuseRating',label:'Plug or FCU fuse (A)'},
    {key:'visualFrequency',label:'Formal visual inspection interval (risk-based)'},
    {key:'combinedFrequency',label:'Combined inspection/test interval (risk-based)'},
    {key:'socketCondition',label:'Socket-outlet condition',type:'select',options:['','Pass','Fail','N/A','Not checked']},
    {key:'plugCondition',label:'Plug condition',type:'select',options:['','Pass','Fail','N/A','Not checked']},
    {key:'flexCondition',label:'Flex and cord condition',type:'select',options:['','Pass','Fail','N/A','Not checked']},
    {key:'bodyCondition',label:'Enclosure/body condition',type:'select',options:['','Pass','Fail','N/A','Not checked']},
    {key:'otherCondition',label:'Other visual condition details'},
    {key:'earthIncludingCable',label:'Total continuity including lead (Ω)'},
    {key:'insulationVoltage',label:'Insulation test voltage used (V DC)'},
    {key:'otherTests',label:'Other applicable measurements / units'},
    {key:'suitableEnvironment',label:'Suitable for environment',type:'select',options:['','Yes','No','Limited assessment']},
    {key:'suitableForUse',label:'Duty-holder assessment: suitable for continued use',type:'select',options:['','Yes','No','Awaiting decision']},
    {key:'inspectorInitials',label:'Inspector initials'},
    {key:'dutyHolderInitials',label:'Duty-holder initials'},
    {key:'labelCheckDate',label:'Safety-check label date'},
    {key:'labelInitials',label:'Safety-check label initials'}
  ]);
  addColumns(SCHEMAS.pat,'repairs',[
    {key:'customer',label:'Customer'},{key:'serial',label:'Equipment serial'},
    {key:'repairer',label:'Repairer'},{key:'suitable',label:'Return to use suitable',type:'select',options:['','Yes','No']},
    {key:'signature',label:'Repairer sign-off'}
  ]);
  addColumns(SCHEMAS.pat,'faulty',[
    {key:'date',label:'Date recorded'},{key:'location',label:'Equipment location'}
  ]);
  SCHEMAS.pat.sections.splice(SCHEMAS.pat.sections.length-1,0,table('instrumentChecks','IET PAT test instrument verification points',[
    {key:'type',label:'Low resistance / high resistance / other'},
    {key:'make',label:'Instrument make/model'},{key:'serial',label:'Instrument serial'},
    {key:'calibrationDate',label:'Last calibration date'},
    {key:'testDate',label:'Function verification date'},
    {key:'point05',label:'0.5 Ω / MΩ check result'},{key:'deviation05',label:'0.5 Ω / MΩ deviation %'},
    {key:'point1',label:'1.0 Ω / MΩ check result'},{key:'deviation1',label:'1.0 Ω / MΩ deviation %'},
    {key:'point10',label:'10.0 Ω / MΩ check result'},{key:'deviation10',label:'10.0 Ω / MΩ deviation %'}
  ],[]));
  // An EV commissioning record supplements the electrical certificate; it cannot
  // itself replace a BS 7671 EIC/MEIWC or site-specific EV charging assessment.
  const evSections=SCHEMAS.ev.sections;
  evSections.splice(evSections.length-1,0,section('EVSE safety and site risk checks',[
    f('chargingMode','Charging mode / connector type'),
    f('rcdDcDetails','6 mA DC protection: integral/remote equipment details'),
    f('simultaneousContact','Simultaneous contact / adjacent earthing risk assessment'),
    f('penProtectionStandard','Open-PEN device standard or alternative earthing protective measure'),
    f('protectionTripTest','RCD/OPDD test method, conditions and recorded outcome'),
    f('gridInteraction','V2G / V2H or islanding arrangement where applicable'),
    f('accessibility','User access and physical protection checks'),
    f('manufacturerTests','Other manufacturer commissioning and functional test results','textarea',{span:'full'})
  ]));
  // PV commissioning records must distinguish mandatory and installation-
  // dependent test regimes; do not invent a Category 2 test for a Category 1 site.
  const pvSections=SCHEMAS.solar.sections;
  pvSections.splice(pvSections.length-1,0,section('PV design, inspection and test regime',[
    f('systemDesigner','System designer and responsible person'),
    f('arrayLayout','Array layout and string configuration drawing reference'),
    f('cableAndFuseSpecification','Specified DC cable, connector, string fuse and maximum ratings'),
    f('earthingContinuity','Protective continuity and bonding test result'),
    f('dcIsolatorTest','DC isolator and switching test result'),
    f('testConditions','Irradiance / module temperature / measurement conditions'),
    select('pvTestCategory','PV verification regime',['','Category 1','Category 2 / enhanced','Other (describe)']),
    f('ivCurveEvidence','I-V characteristic test / evidence reference, if applicable'),
    f('infraredEvidence','Thermal image inspection / evidence reference, if applicable'),
    f('designDeviation','Variations from system design / rectifications'),
    f('emergencyShutdown','Emergency shutdown and isolation instructions'),
    f('faultResponse','Fault reporting and fault-response instructions'),
    f('maintenance','Cleaning, service and inspection recommendations'),
    f('warranty','Module/inverter/workmanship/weatherproofing warranty information')
  ]));
  const fireSections=SCHEMAS.commercialFire.sections;
  fireSections.splice(fireSections.length-1,0,section('Non-domestic fire safety acceptance and handover',[
    f('designOrganisation','Fire system designer organisation'),
    f('designDeclaration','Design responsibility and signed declaration'),
    f('installationDeclaration','Installation responsibility and signed declaration'),
    f('commissionDeclaration','Commissioning responsibility and signed declaration'),
    f('acceptanceBy','System accepted on behalf of user / responsible person'),
    f('acceptanceDate','Acceptance date','date'),
    f('categoryDeviations','Variations from category/coverage and relevant approvals'),
    f('batteryStandby','Standby battery capacity / autonomy assessment'),
    f('soundLevelEvidence','Audibility / sound measurement and test evidence'),
    f('interfacesEvidence','Cause-and-effect and interfaces to other systems'),
    f('commissionReport','Commissioning test schedule and defects references'),
    f('zoneChart','Zones / as-fitted drawings and location references'),
    f('causeEffect','Cause-and-effect operating matrix, alarm outputs and system interfaces reference'),
    f('userTraining','System demonstration, user training and operator instructions'),
    f('logbookDelivery','Logbook, maintenance documentation and service arrangements')
  ]));

  try{editMode=localStorage.getItem(EDIT_MODE_KEY)==='certificate'?'certificate':'quick';}catch{}
  let settings = loadSettings();
  let state = loadState();
  let view = loadView();
  const accordionState=new Map();
  let preserveRequestedAccordions=false;
  const accordionOpen=(key,initial=false)=>accordionState.has(key)?accordionState.get(key):initial;
  function rememberAccordions(){document.querySelectorAll('#app details[data-accordion-key]').forEach(el=>accordionState.set(el.dataset.accordionKey,el.open));}
  function openBoardAccordion(boardRef){rememberAccordions();const cert=getCurrent(),board=cert?.tables?.boards?.find(b=>normaliseBoardKey(b.ref)===normaliseBoardKey(boardRef));if(board){accordionState.set('section:'+cert.id+':J Distribution',true);
    accordionState.set('board-circuits:'+cert.id+':'+board.id,true);
    preserveRequestedAccordions=true;}}
  function keepCircuitAccordionVisible(cert,boardRef,circuitId=''){
    const board=(cert?.tables?.boards||[]).find(b=>normaliseBoardKey(b.ref)===normaliseBoardKey(boardRef));
    if(!board)return;
    const sectionKey='section:'+cert.id+':J Distribution',boardKey='board-circuits:'+cert.id+':'+board.id;
    accordionState.set(sectionKey,true);accordionState.set(boardKey,true);
    const section=document.querySelector('details.distribution-section');
    if(section)section.open=true;
    const list=document.querySelector('details.cu-circuits-accordion[data-accordion-key="'+CSS.escape(boardKey)+'"]');
    if(list)list.open=true;
    if(circuitId){
      const key='inline-circuit:'+cert.id+':'+circuitId;
      accordionState.set(key,true);
      const card=document.querySelector('details.inline-circuit[data-accordion-key="'+CSS.escape(key)+'"]');
      if(card)card.open=true;
    }
  }
  let autosaveTimer = null;
  let nativeBackupTimer = null;
  let pendingRecoveryAction = null;
  let editHistory = { certId:null, undo:[], redo:[] };

  function resetEditHistory(certId=null){
    editHistory={certId,undo:[],redo:[]};
  }

  function historySnapshot(label='Edit'){
    const cert=getCurrent();
    if(!cert) return null;
    return {certId:cert.id,label,cert:clone(cert),view:clone(view),json:JSON.stringify(cert)};
  }

  function refreshHistoryButtons(){
    document.querySelectorAll('[data-action="edit-undo"]').forEach(b=>b.disabled=!editHistory.undo.length);
    document.querySelectorAll('[data-action="edit-redo"]').forEach(b=>b.disabled=!editHistory.redo.length);
  }

  function pushEditHistory(label='Edit'){
    const snap=historySnapshot(label);
    if(!snap) return;
    if(editHistory.certId!==snap.certId) resetEditHistory(snap.certId);
    const last=editHistory.undo.at(-1);
    if(last?.json===snap.json) return;
    editHistory.undo.push(snap);
    if(editHistory.undo.length>60) editHistory.undo.shift();
    editHistory.redo=[];
    refreshHistoryButtons();
  }

  function applyHistorySnapshot(snap){
    if(!snap) return;
    const i=state.certificates.findIndex(c=>c.id===snap.certId);
    if(i<0) return;
    state.certificates[i]=clone(snap.cert);
    view=clone(snap.view);
    persist();
  }

  function undoEdit(){
    const current=historySnapshot('Redo');
    const previous=editHistory.undo.pop();
    if(!previous||!current) return;
    editHistory.redo.push(current);
    const y=window.scrollY;
    applyHistorySnapshot(previous);
    render();
    requestAnimationFrame(()=>window.scrollTo(0,y));
    toast('Undone');
  }

  function redoEdit(){
    const current=historySnapshot('Undo');
    const next=editHistory.redo.pop();
    if(!next||!current) return;
    editHistory.undo.push(current);
    const y=window.scrollY;
    applyHistorySnapshot(next);
    render();
    requestAnimationFrame(()=>window.scrollTo(0,y));
    toast('Redone');
  }

  function historyButtons(){
    return '<button class="btn history-btn" data-action="edit-undo" '+(!editHistory.undo.length?'disabled':'')+'>Undo</button><button class="btn history-btn" data-action="edit-redo" '+(!editHistory.redo.length?'disabled':'')+'>Redo</button>';
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const certificates = Array.isArray(parsed.certificates) ? parsed.certificates : [];
      const cleaned=[];
      certificates.forEach(raw=>{
        try {
          const cert=migrateCertificate(raw);
          if(cert) cleaned.push(cert);
          else if(isRecord(raw)) {
            cleaned.push({
              ...raw,
              id:String(raw.id||uid()),
              fields:isRecord(raw.fields)?raw.fields:{},
              tables:isRecord(raw.tables)?raw.tables:{},
              status:raw.status==='Complete'?'Complete':'Draft',
              createdAt:raw.createdAt||raw.updatedAt||new Date().toISOString(),
              updatedAt:raw.updatedAt||raw.createdAt||new Date().toISOString(),
              _unsupportedFormat:true
            });
          }
        } catch(err) {
          console.error('Preserved damaged saved certificate without migration',err,raw);
          if(isRecord(raw)) cleaned.push({...raw,_unsupportedFormat:true});
        }
      });
      return { certificates: cleaned };
    } catch(err) {
      console.error('Could not load certificate storage',err);
      return { certificates: [] };
    }
  }

  function loadView() {
    const fallback={ page:'home', currentId:null, circuitIndex:null, circuitStep:'details' };
    try {
      const saved=JSON.parse(localStorage.getItem(VIEW_KEY)||'null');
      if(!saved || saved.page!=='form' || !saved.currentId) return fallback;
      if(!state.certificates.some(c=>c.id===saved.currentId)) return fallback;
      return {
        page:'form',
        currentId:saved.currentId,
        circuitIndex:Number.isInteger(saved.circuitIndex)?saved.circuitIndex:null,
        circuitStep:saved.circuitStep==='tests'?'tests':'details'
      };
    } catch { return fallback; }
  }

  function persistView() {
    try { localStorage.setItem(VIEW_KEY,JSON.stringify(view)); } catch {}
  }

  function loadSettings() {
    const defaults = {
      companyName: 'Sperin Services', engineerName: '', engineerPosition: 'Electrician / Inspector',
      address: '', postcode: '', phone: '', email: '', registration: '',
      qualification: 'C&G 2391 / 18th Edition', defaultStandard: 'BS 7671:2018+A4:2026',
      testerMake: '', testerModel: '', testerSerial: '', testerCalibrationDue: '',
      postcodeApiKey: '', reportAccent:'#1365cc', reportLogo:'', reportSignature:''
    };
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) }; } catch { return defaults; }
  }

  function persist() {
    if (view.currentId) {
      const c = getCurrent();
      if (c) c.updatedAt = new Date().toISOString();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    persistView();
    window.SperinCloudWorkspace?.schedule?.();
  }

  function autoBackupPayload() {
    return JSON.stringify({ version: VERSION, exportedAt: new Date().toISOString(), settings, boardTemplates: reusableTemplates('board'), circuitTemplates: reusableTemplates('circuit'), certificates: state.certificates, jobs:window.SperinJobCentre?.backup?.()||[] });
  }

  function flushNativeAutoBackup() {
    clearTimeout(nativeBackupTimer);
    nativeBackupTimer=null;
    if(!state.certificates.length) return;
    if(window.Android && typeof window.Android.saveAutoBackup==='function'){
      try { window.Android.saveAutoBackup(autoBackupPayload()); } catch(err) { console.warn('Automatic recovery backup failed',err); }
    }
  }

  function scheduleNativeAutoBackup() {
    clearTimeout(nativeBackupTimer);
    nativeBackupTimer=setTimeout(flushNativeAutoBackup,1800);
  }

  function saveNow() {
    clearTimeout(autosaveTimer);
    persist();
    scheduleNativeAutoBackup();
    updateSaveState('Saved');
  }

  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

  function saveSettingsFromModal() {
    document.querySelectorAll('.profile-modal [data-setting]').forEach(el=>{
      settings[el.dataset.setting]=el.value;
    });
    if(!/^#[0-9a-fA-F]{6}$/.test(settings.reportAccent))settings.reportAccent='#1365cc';
    saveSettings();
  }
  function esc(v) { return String(v ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch])); }
  function fmtDate(v) { if (!v) return ''; const d = new Date(v + (v.length === 10 ? 'T12:00:00' : '')); return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB'); }
  function displayType(type) { return SCHEMAS[type]?.name || type; }
  function getCurrent() { return state.certificates.find(c => c.id === view.currentId); }
  function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function certificateNumber(type) {
    const code = SCHEMAS[type].code;
    const date = TODAY.replaceAll('-', '');
    const count = state.certificates.filter(c => c.type === type && String(c.number || '').includes(date)).length + 1;
    return `SS-${code}-${date}-${String(count).padStart(3, '0')}`;
  }

  function defaultFor(field) {
    if (field.defaultValue !== undefined) return field.defaultValue;
    if (field.type === 'checkbox') return false;
    if (field.type === 'date' && /date|Date/.test(field.key)) return '';
    return '';
  }

  function makeCertificate(type) {
    const schema = SCHEMAS[type];
    const fields = {};
    const tables = {};
    schema.sections.forEach(part => {
      if (part.type === 'section') part.fields.forEach(field => fields[field.key] = defaultFor(field));
      if (part.type === 'table') tables[part.key] = clone(part.defaultRows || []);
    });
    const no = certificateNumber(type);
    fields.certificateNo = no;
    if ('issueDate' in fields) fields.issueDate = TODAY;
    if ('completionDate' in fields) fields.completionDate = TODAY;
    if ('declarationDate' in fields) fields.declarationDate = TODAY;
    if ('inspectorCompany' in fields) fields.inspectorCompany = settings.companyName;
    if ('constructorCompany' in fields) fields.constructorCompany = settings.companyName;
    if ('designerCompany' in fields) fields.designerCompany = settings.companyName;
    if ('engineerName' in fields) fields.engineerName = settings.engineerName;
    if ('forOnBehalfOf' in fields) fields.forOnBehalfOf = settings.companyName;
    if ('inspectedBy' in fields) fields.inspectedBy = settings.engineerName;
    if ('installerName' in fields) fields.installerName = settings.engineerName;
    if ('installerCompany' in fields) fields.installerCompany = settings.companyName;
    if ('verifierCompany' in fields) fields.verifierCompany = settings.companyName;
    if ('commissionerCompany' in fields) fields.commissionerCompany = settings.companyName;
    if ('signatoryMode' in fields) {
      fields.signatoryMode = 'One person — design, construction & inspection';
      fields.singleSignatoryName = settings.engineerName;
      fields.singleSignatoryCompany = settings.companyName;
      fields.singleSignatoryAddress = settings.address;
      fields.singleSignatoryPostcode = settings.postcode;
      fields.singleSignatoryPhone = settings.phone;
      fields.singleSignatoryQualification = settings.qualification;
    }
    if ('testerMake' in fields) fields.testerMake = settings.testerMake || '';
    if ('testerModel' in fields) fields.testerModel = settings.testerModel || '';
    if ('testerSerial' in fields) fields.testerSerial = settings.testerSerial || '';
    if ('testedBy' in fields) fields.testedBy = settings.engineerName || '';
    if ('position' in fields && !fields.position) fields.position = settings.engineerPosition || '';
    if ('inspectorPosition' in fields && !fields.inspectorPosition) fields.inspectorPosition = settings.engineerPosition || '';
    if ('testerMft' in fields) fields.testerMft = true;
    const cert = { id: uid(), type, number: no, status: 'Draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), fields, tables };
    migrateCertificate(cert);
    syncSingleSignatory(cert);
    return cert;
  }


  function askEntryMode(){
    document.querySelector('.cv-opening')?.remove();
    const m=document.createElement('div');m.className='cv-opening';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
    m.innerHTML='<div class="cv-opening-inner"><h2>How would you like to complete your certificate?</h2><p>Both views edit the same saved certificate. Switch views at any time.</p>'+
      '<div class="cv-opening-options"><button type="button" data-action="choose-entry" data-mode="quick"><span aria-hidden="true">☷</span><strong>Quick Entry</strong><small>Fast forms and step-by-step circuit details</small></button>'+
      '<button type="button" data-action="choose-entry" data-mode="certificate"><span aria-hidden="true">▤</span><strong>Certificate View</strong><small>Edit directly on the paged certificate</small></button></div></div>';
    document.body.appendChild(m);m.querySelector('button')?.focus();
  }
  function applyEntryOrientation(cert){
    const value=editMode==='certificate' && window.SperinCertificateView?.isLandscape(cert?.type)?'landscape':'unspecified';
    if(value===lastRequestedOrientation)return;
    lastRequestedOrientation=value;
    try{window.Android?.setCertificateOrientation?.(value);}catch(err){console.warn('Native orientation not available',err);}
    if(!window.Android && window.screen?.orientation?.lock && value==='landscape'){
      window.screen.orientation.lock('landscape').catch(()=>{}); // Browser may require fullscreen or user rotation.
    }else if(!window.Android && window.screen?.orientation?.unlock && value==='unspecified'){
      try{window.screen.orientation.unlock();}catch{}
    }
  }
  function chooseEntry(mode){
    if(!['quick','certificate'].includes(mode))return;
    const cert=getCurrent();if(!cert)return;
    saveNow();
    editMode=mode;localStorage.setItem(EDIT_MODE_KEY,mode);
    window.SperinCertificateView?.reset?.();
    view.circuitIndex=null;view.circuitStep='details';
    document.querySelector('.cv-opening')?.remove();
    applyEntryOrientation(cert);render();goTop();
  }
  function certificateWorkspace(cert){
    const sheet=window.SperinCertificateView;
    if(!sheet)return '<div class="card app-error">Certificate View is unavailable. Switch to Quick Entry.</div>';
    const schema=SCHEMAS[cert.type];
    return '<div class="form-head"><button class="btn back" data-action="home">← Home</button><div class="form-title"><div class="eyebrow">'+esc(schema.standard)+'</div><h2>'+esc(schema.name)+'</h2><p>'+esc(cert.number)+' · '+esc(cert.status)+'</p></div></div>'+
      sheet.render(cert,schema);
  }
  function refreshCertificateView(){
    if(editMode!=='certificate')return;
    const port=document.querySelector('.cv-viewport');const cert=getCurrent();if(!cert)return;
    const left=port?.scrollLeft||0,top=port?.scrollTop||0,zoom=window.SperinCertificateView.state.zoom;
    const container=document.querySelector('.cv-shell');if(!container)return;
    container.outerHTML=window.SperinCertificateView.render(cert,SCHEMAS[cert.type]);
    window.SperinCertificateView.attachGestures();
    if(port?.isConnected!==true && (left||top)){
      const target=document.querySelector('.cv-viewport');target.scrollLeft=left;target.scrollTop=top;
    }
    window.SperinCertificateView.setZoom(zoom);
  }

  function openCertificate(id) {
    const cert=state.certificates.find(c=>c.id===id);
    if(!cert){toast('Certificate not found');return;}
    try {
      const migrated=migrateCertificate(cert);
      if(!migrated) throw new Error('Unsupported certificate format');
      view = { page: 'form', currentId: migrated.id, circuitIndex:null, circuitStep:'details' };
      resetEditHistory(migrated.id);
      persist();
      render();
      goTop();
      askEntryMode();
    } catch(err) {
      console.error('Could not open saved certificate',err);
      view = { page: 'home', currentId:null, circuitIndex:null, circuitStep:'details' };
      render();
      alert('This saved certificate could not be opened safely. Your saved data has been kept. Create a backup before making further changes.');
    }
  }

  function newCertificate(type) {
    const cert = makeCertificate(type);
    state.certificates.unshift(cert);
    view = { page: 'form', currentId: cert.id, circuitIndex: null, circuitStep: 'details' };
    resetEditHistory(cert.id);
    persist();
    render(); goTop();
    askEntryMode();
    toast('New certificate created');
  }

  function duplicateCertificate(id) {
    const original = state.certificates.find(c => c.id === id); if (!original) return;
    const safe=migrateCertificate(original); if(!safe || !SCHEMAS[safe.type]) { toast('Cannot duplicate this older certificate format'); return; }
    const copy = clone(safe); copy.id = uid(); copy.number = certificateNumber(copy.type); copy.fields.certificateNo = copy.number; copy.status = 'Draft'; copy.createdAt = copy.updatedAt = new Date().toISOString();
    state.certificates.unshift(copy); persist(); render(); toast('Certificate duplicated');
  }

  function deleteCertificate(id) {
    const c = state.certificates.find(x => x.id === id); if (!c) return;
    if (!confirm(`Delete ${c.number || displayType(c.type)}? A recovery snapshot will be kept.`)) return;
    savePreRestoreSnapshot();
    state.certificates = state.certificates.filter(x => x.id !== id); persist(); scheduleNativeAutoBackup();
    if (view.currentId === id) view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' };
    render(); toast('Certificate deleted · recovery saved');
  }

  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      persist();
      scheduleNativeAutoBackup();
      updateSaveState('Saved');
    }, 300);
    updateSaveState('Saving…');
  }

  function updateSaveState(text) { const el = document.querySelector('[data-save-state]'); if (el) el.textContent = text; }

  function render() {
    if(!preserveRequestedAccordions)rememberAccordions();
    preserveRequestedAccordions=false;
    const root = document.getElementById('app');
    persistView();
    document.body.dataset.page=view.page;
    try {
      root.innerHTML = `<div class="shell">${topbar()}${view.page === 'home' ? homeView() : view.page === 'new' ? newCertificateListView() : view.page === 'library' ? certificateLibraryView() : formView()}${view.page==='form'?editorDock():''}</div>`;
      requestAnimationFrame(()=>{ try { decorateVoiceUI(); } catch(err) { console.error('Voice UI decoration failed',err); } if(editMode==='certificate'&&view.page==='form')window.SperinCertificateView?.attachGestures?.(); });
    } catch(err) {
      console.error('Certificate render failed',err);
      view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' };
      root.innerHTML = `<div class="shell">${topbar()}<div class="card app-error"><h2>Certificate could not be opened</h2><p>A saved item contained older or damaged data. Your certificates have not been deleted.</p><button class="btn primary" data-action="home">Return to saved certificates</button></div></div>`;
    }
  }

  function boardScanButton(cert,ref='') {
    return ['eic','eicr','minor'].includes(cert.type)?`<button class="btn primary" data-action="board-scan" data-board-ref="${esc(ref)}">${uiIcon('camera')} Scan Consumer Unit</button>`:'';
  }
  function openBoardScan(ref) {
    const cert=getCurrent();if(!cert)return;
    if(cert.type!=='minor'){
      ensureBoardWorkflowData(cert);syncCircuitRows(cert);
      if(!ref && cert.tables.boards.length>1){
        const m=document.createElement('div');m.className='modal-backdrop';m.innerHTML=`<div class="card modal"><h2>Choose consumer unit</h2>${cert.tables.boards.map(b=>`<button class="btn" data-action="board-scan" data-board-ref="${esc(b.ref)}">${esc(b.ref)} · ${esc(b.location||'')}</button>`).join('')}<button class="btn" data-action="close-modal">Cancel</button></div>`;document.body.appendChild(m);return;
      }
      if(!cert.tables.boards.length){addBoard(cert);}
      ref=ref||cert.tables.boards[0].ref;
    }else ref=cert.fields.dbReference||'Minor Works';
    closeModal();saveNow();
    window.SperinConsumerScan.open({getCert:()=>cert,commit:(next)=>{
      pushEditHistory('Apply consumer unit scan');
      const old=clone(cert);
      try{Object.assign(cert,next);if(cert.type!=='minor'){sortCircuitsByNumber(cert);syncPrimaryBoardLegacyFields(cert);}saveNow();}
      catch(err){Object.keys(cert).forEach(k=>delete cert[k]);Object.assign(cert,old);throw err;}
      render();toast('Added to certificate ✓');
    }},ref);
  }

  function uiIcon(name) {
    const icons={
      tools:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/></svg>',
      camera:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="13" r="4"/></svg>',
      home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
      user:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>',
      mic:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></svg>',
      pdf:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M8 15h8M8 18h6"/></svg>',
      shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.8 3 8.2 7.5 9.5 4.5-1.3 7.5-4.7 7.5-9.5V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
      backup:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 14v6h14v-6"/></svg>',
      importFile:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19h14"/></svg>',
      chevron:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
    };
    return icons[name]||icons.chevron;
  }

  function topbar() {
    return `<div class="topbar"><div class="toprow"><button class="brand brand-home" data-action="home" aria-label="Sperin Certificates home"><div class="brand-mark"><span class="bolt"></span></div><div><h1>Sperin Certificates</h1><p>Survey · certify · save · issue</p></div></button><div class="spacer"></div><div class="top-actions"><button class="btn small ghost top-action" data-action="backup">Backup</button><button class="btn small ghost top-action restore-action" data-action="restore">Restore</button><button class="btn small ghost top-action" data-action="settings">Profile</button></div></div></div>`;
  }

  let librarySearch='',libraryStatus='all',librarySort='recent';
  function screen(page){
    if(view.page==='form')saveNow();
    view={page,currentId:null,circuitIndex:null,circuitStep:'details'};
    render();goTop();
  }
  function homeView(){
    return '<main class="minimal-home" aria-label="Home"><h2>Certificates</h2>'+
      '<div class="home-primary-actions"><button class="home-big-action primary" data-action="open-new"><span class="home-action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg></span><span>New Certificate</span><strong>›</strong></button>'+
      '<button class="home-big-action" data-action="open-library"><span class="home-action-icon">'+uiIcon('pdf')+'</span><span>My Certificates</span><strong>›</strong></button></div><button class="home-tools" data-action="open-tools">'+uiIcon('tools')+'<span>Tools</span>'+uiIcon('chevron')+'</button></main>';
  }
  function newCertificateListView(){
    return '<main class="simple-list-page"><header><button class="btn back" data-action="home">← Home</button><h2>New Certificate</h2></header>'+
      '<div class="new-certificate-tools"><button class="btn" data-action="import-ai">Import existing PDF</button></div><div class="cert-launch-list">'+Object.entries(SCHEMAS).map(([type,s])=>
      '<button class="cert-launch" data-action="new" data-type="'+esc(type)+'"><span class="cert-launch-icon">'+esc(s.code)+'</span><span><strong>'+esc(s.name)+'</strong><small>'+esc(s.standard||'')+'</small></span><span class="cert-launch-arrow">›</span></button>').join('')+'</div></main>';
  }
  function certificateLibraryView(){
    const sortable=state.certificates.filter(c=>{
      if(libraryStatus==='draft'&&c.status==='Complete')return false;
      if(libraryStatus==='completed'&&c.status!=='Complete')return false;
      const f=c.fields||{},q=librarySearch.trim().toLowerCase();
      return !q||[c.number,c.type,SCHEMAS[c.type]?.name,f.clientName,f.customerName,f.personOrdering,f.occupier,
        f.installationAddress,f.premisesAddress,f.clientAddress,f.siteAddress,f.installationPostcode,f.premisesPostcode]
        .some(x=>String(x||'').toLowerCase().includes(q));
    });
    const name=c=>String(c.fields?.clientName||c.fields?.customerName||c.fields?.occupier||c.fields?.premisesName||'');
    sortable.sort((a,b)=>librarySort==='name'?name(a).localeCompare(name(b)):
      librarySort==='type'?String(SCHEMAS[a.type]?.name||'').localeCompare(String(SCHEMAS[b.type]?.name||'')):
      librarySort==='old'?new Date(a.updatedAt||0)-new Date(b.updatedAt||0):
      new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
    const rows=sortable.map(c=>{
      const sch=SCHEMAS[c.type]||{name:'Certificate',code:'CERT'},f=c.fields||{};
      const customer=name(c)||'Unnamed customer',
      address=f.installationAddress||f.premisesAddress||f.clientAddress||f.siteAddress||'',
      when=f.issueDate||f.completionDate||String(c.updatedAt||'').slice(0,10);
      return '<div class="saved-cert-row" data-action="edit" data-id="'+esc(c.id)+'" role="button" tabindex="0">'+
        '<span class="saved-cert-accent">'+esc(sch.code)+'</span>'+
        '<div class="saved-cert-copy"><strong>'+esc(customer)+'</strong><span>'+esc(String(address).replace(/\n/g,', '))+'</span><small>'+esc(sch.name)+' · '+esc(c.number||'')+'</small></div>'+
        '<div class="saved-cert-date"><strong>'+esc(fmtDate(when))+'</strong><span class="pill">'+(c.status==='Complete'?'Completed':'In progress')+'</span></div>'+
        '<div class="saved-cert-actions"><button class="btn small" data-action="duplicate" data-id="'+esc(c.id)+'">Duplicate</button><button class="btn small danger" data-action="delete" data-id="'+esc(c.id)+'">Delete</button></div></div>';
    }).join('');
    return '<main class="simple-list-page" aria-label="My Certificates"><header><button class="btn back" data-action="home">← Home</button><h2>My Certificates</h2><button class="btn primary" data-action="open-new">＋ New</button></header>'+
      '<div class="library-controls"><label class="library-search"><span>Search</span><input type="search" data-library-search autocomplete="off" placeholder="Customer, address, number…" value="'+esc(librarySearch)+'"></label>'+
      '<label>Status<select data-library-status><option value="all"'+(libraryStatus==='all'?' selected':'')+'>All</option><option value="draft"'+(libraryStatus==='draft'?' selected':'')+'>In progress</option><option value="completed"'+(libraryStatus==='completed'?' selected':'')+'>Completed</option></select></label>'+
      '<label>Sort by<select data-library-sort><option value="recent"'+(librarySort==='recent'?' selected':'')+'>Newest</option><option value="old"'+(librarySort==='old'?' selected':'')+'>Oldest</option><option value="name"'+(librarySort==='name'?' selected':'')+'>Customer name</option><option value="type"'+(librarySort==='type'?' selected':'')+'>Certificate type</option></select></label></div>'+
      '<div class="saved-cert-list" data-library-results>'+ (rows||'<div class="home-empty">No matching certificates</div>')+'</div></main>';
  }

  function editorDock(){
    return '<div class="editor-dock" role="toolbar" aria-label="Certificate actions"><button class="btn cv-switch-button" data-action="switch-entry">'+(editMode==='certificate'?'☷ Quick Entry':'▤ Certificate View')+'</button>'+historyButtons()+'<button class="btn" data-action="certificate-review">Review</button><button class="btn primary" data-action="pdf">'+uiIcon('pdf')+' PDF</button></div>';
  }

  function formView() {
    const cert = getCurrent(); if (!cert) { view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' }; return homeView(); }
    migrateCertificate(cert);
    if(view.circuitIndex!==null && (cert.type==='eic'||cert.type==='eicr')) return circuitEditorView(cert);
    const schema = SCHEMAS[cert.type];
    if(editMode==='certificate'){applyEntryOrientation(cert);return certificateWorkspace(cert);}
    const sections = schema.sections.map(part => {
      if(['eic','eicr'].includes(cert.type) && part.type==='section' && (part.title==='J · Schedule details' || part.title==='Circuit schedule header')) return '';
      if(part.key==='boards' && ['eic','eicr'].includes(cert.type)) return renderBoardWorkflow(cert);
      if(part.key==='circuits' || part.key==='tests') return '';
      if(part.type==='section') return renderSection(part,cert);
      return renderTable(part,cert);
    }).join('');
    const finish = `<section class="card form-section finish-panel"><h3>Finish</h3><button class="btn" data-action="jobs">📷 Linked job, photos &amp; handover</button>${cert.type==='eicr'?'<button class="btn" data-action="ai-eicr">AI EICR observations review</button>':''}${['eic','eicr','pat'].includes(cert.type)?'<button class="btn" data-action="instrument-import">Import tester CSV</button>':''}<div class="finish-actions"><div><strong>Ready to issue?</strong><div class="meta">Save, complete and create the PDF.</div></div><label class="pdf-sign-consent"><input type="checkbox" data-sign-pdf ${cert.signatureApprovedAt?'checked':''}/> Apply my own saved signature to this certificate (optional)</label><button class="btn primary" data-action="complete-pdf">Complete and open PDF</button></div></section>`;
    return `<div class="form-head"><button class="btn back" data-action="home">← Home</button><div class="form-title"><div class="eyebrow">${esc(schema.standard)}</div><h2>${esc(schema.name)}</h2><p>${esc(cert.number)} · ${esc(cert.status)}</p></div><div class="actions">${cert.type==='minor'?boardScanButton(cert):''}<button class="btn rapid-entry-btn" data-action="rapid-entry">Voice</button><button class="btn" data-action="rapid-sheet">Site sheet</button><button class="btn" data-action="speed-convert">Copy/convert</button><button class="btn" data-action="speed-bulk">Bulk edit</button><button class="btn" data-action="status">${cert.status === 'Complete' ? 'Draft' : 'Complete'}</button><button class="btn" data-action="print">Print</button></div></div><div class="entry-tools-explainer compact"><span><strong>Voice</strong> adds to long answers.</span><span><strong>Site sheet</strong> matches the issued PDF.</span></div><div class="note warning">Sperin Services model-form layout. Complete only where competent and authorised.</div>${validationBanner(cert)}${sections}${finish}<div class="savebar"><div class="savebar-inner"><div class="meta"><span data-save-state>Saved</span> · on this device</div><button class="btn small" data-action="home">Home</button></div></div>`;
  }

  function fieldVisible(field,cert){
    if(!field.showWhen) return true;
    return String(cert.fields[field.showWhen.key]||'')===String(field.showWhen.value);
  }

  function renderSection(part, cert) {
    const fields = part.fields.filter(field=>fieldVisible(field,cert)).map(field => renderField(field, cert.fields[field.key] ?? '',cert)).join('');
    const sameClient=(part.title.includes('Installation details') && 'clientAddress' in cert.fields && 'installationAddress' in cert.fields)
      ? '<div class="section-quick-actions"><button class="btn same-details-btn" type="button" data-action="copy-client-installation">Same as client</button><span>Copies address and postcode.</span></div>'
      : '';
    const signatorySummary=(part.title.startsWith('C · Certification & signatories') && singleSignatoryMode(cert))
      ? '<div class="signatory-summary"><strong>One signatory</strong><span>Design · Installation · Inspection & testing</span></div>'
      : '';
    const key='section:'+cert.id+':'+part.title;
    return `<details class="card form-section cert-accordion" data-accordion-key="${esc(key)}" ${accordionOpen(key,part.title.startsWith('A ·'))?'open':''}><summary class="cert-accordion-head"><h3>${esc(part.title)}</h3><span class="cert-chevron">⌄</span></summary><div class="cert-accordion-body">${part.note ? `<div class="note">${esc(part.note)}</div>` : ''}${sameClient}${signatorySummary}<div class="fields">${fields}</div></div></details>`;
  }

  const POSTCODE_TARGETS={
    clientPostcode:'clientAddress',
    installationPostcode:'installationAddress',
    premisesPostcode:'premisesAddress',
    singleSignatoryPostcode:'singleSignatoryAddress',
    designerPostcode:'designerAddress',
    constructorPostcode:'constructorAddress',
    inspectorPostcode:'inspectorAddress'
  };

  function formatUkPostcode(raw){
    const compact=String(raw||'').toUpperCase().replace(/\s+/g,'');
    return compact.length>3 ? compact.slice(0,-3)+' '+compact.slice(-3) : compact;
  }

  function formatSpokenAddress(raw){
    let text=String(raw||'').trim().replace(/\bnew line\b/gi,'\n').replace(/\bcomma\b/gi,'\n');
    const pc=text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
    if(pc){
      const postcode=formatUkPostcode(pc[1]);
      text=text.replace(pc[0],'').replace(/[ ,]+$/,'').trim();
      text=text+(text?'\n':'')+postcode;
    }
    return text.replace(/\n\s+/g,'\n').replace(/\n{2,}/g,'\n');
  }

  async function postcodeLookup(postcodeKey){
    const cert=getCurrent(); if(!cert)return;
    const target=POSTCODE_TARGETS[postcodeKey]; if(!target)return;
    const postcode=formatUkPostcode(cert.fields[postcodeKey]||'');
    if(!postcode){toast('Enter a postcode first');return;}
    const key=String(settings.postcodeApiKey||'').trim();
    if(!key){alert('Postcode address lookup is ready, but it needs an Ideal Postcodes API key. Open Profile and add the key under UK postcode address lookup. You can still type or speak the address manually.');return;}
    toast('Finding addresses…');
    try{
      const url='https://api.ideal-postcodes.co.uk/v1/postcodes/'+encodeURIComponent(postcode)+'?api_key='+encodeURIComponent(key);
      const res=await fetch(url,{headers:{Accept:'application/json'}});
      const data=await res.json();
      if(!res.ok||!Array.isArray(data.result)) throw new Error(data.message||'Address lookup failed');
      if(!data.result.length){alert('No addresses were found for '+postcode);return;}
      const choices=data.result.map((a,i)=>{
        const lines=[a.line_1,a.line_2,a.line_3,a.post_town,a.county].filter(Boolean);
        return {i,label:lines.join(', '),address:lines.join('\n'),postcode:a.postcode||postcode};
      });
      const modal=document.createElement('div');modal.className='modal-backdrop postcode-backdrop';
      modal.innerHTML='<div class="card modal postcode-modal" data-modal><div class="profile-head"><div><div class="eyebrow">ADDRESS LOOKUP</div><h2>'+esc(postcode)+'</h2><p>Select the address and it will fill the certificate in a proper address format.</p></div><button class="btn" data-action="close-modal">Close</button></div><div class="postcode-results">'+choices.map(c=>'<button class="postcode-result" data-action="postcode-select" data-postcode-key="'+esc(postcodeKey)+'" data-address-index="'+c.i+'"><strong>'+esc(c.label)+'</strong><span>Use this address ›</span></button>').join('')+'</div></div>';
      modal._postcodeChoices=choices;document.body.appendChild(modal);
    }catch(err){console.error(err);alert('Address lookup failed: '+err.message);}
  }

  function selectPostcodeAddress(postcodeKey,index){
    const modal=document.querySelector('.postcode-backdrop');
    const choice=modal?._postcodeChoices?.[Number(index)];
    const cert=getCurrent(),target=POSTCODE_TARGETS[postcodeKey];
    if(!choice||!cert||!target)return;
    cert.fields[postcodeKey]=formatUkPostcode(choice.postcode);
    cert.fields[target]=choice.address;
    saveNow();closeModal();render();toast('Address filled');
  }

  function bondingSelections(value) {
    const raw=String(value||'').toLowerCase();
    const selected=new Set();
    BONDING_OPTIONS.forEach(option=>{
      const key=option.toLowerCase();
      if(raw.split(/[,;]+/).map(x=>x.trim()).includes(key)) selected.add(option);
    });
    if(/\bwater\b/.test(raw)) selected.add('Water');
    if(/\bgas\b/.test(raw)) selected.add('Gas');
    if(/\boil\b/.test(raw)) selected.add('Oil');
    if(/structural\s+steel|\bsteel\b/.test(raw)) selected.add('Structural steel');
    if(/lightning|\blps\b/.test(raw)) selected.add('Lightning protection system');
    if(/\bother\b/.test(raw)) selected.add('Other');
    return selected;
  }

  function renderField(field, value, cert) {
    const span = field.span === 'full' ? 'full' : field.span === 'third' ? 'third' : field.span === 'quarter' ? 'quarter' : '';
    const attrs = `data-field="${esc(field.key)}"`;

    if(field.key==='signatoryMode'){
      const one='One person — design, construction & inspection';
      const separate='Separate people';
      return `<div class="field full"><label>Certification responsibility</label><input ${attrs} type="hidden" value="${esc(value)}"/><div class="segmented-choice"><button type="button" class="${value===one?'selected':''}" data-action="signatory-mode" data-value="${esc(one)}"><strong>One person</strong><span>Design · Installation · Inspection & testing</span></button><button type="button" class="${value===separate?'selected':''}" data-action="signatory-mode" data-value="${esc(separate)}"><strong>Separate people</strong><span>Individual designer, installer and inspector/tester details</span></button></div></div>`;
    }

    if(field.key==='bondingTo' || field.key==='bondingPresent'){
      const selected=bondingSelections(value);
      const chips=BONDING_OPTIONS.map(option=>`<button type="button" class="bonding-chip ${selected.has(option)?'selected':''}" data-action="bonding-toggle" data-bonding-field="${esc(field.key)}" data-value="${esc(option)}">${esc(option)}</button>`).join('');
      return `<div class="field full bonding-field"><label>Main protective bonding connected to</label><input ${attrs} type="hidden" value="${esc(value)}"/><div class="bonding-options">${chips}</div><div class="meta">Tap every bonded service.</div></div>`;
    }

    let control = '';
    if(field.type==='checkbox') control=`<label class="checkline compact-check"><input ${attrs} type="checkbox" ${value?'checked':''}/><span>Yes</span></label>`;
    else if (field.type === 'textarea') control = `<textarea ${attrs} placeholder="${esc(field.placeholder || '')}">${esc(value)}</textarea>`;
    else if (field.type === 'select') control = NUMERIC_INPUT_KEYS.has(field.key)||['ocpdBs','ocpdType','supplyDeviceBs'].includes(field.key) ? comboControl(attrs,field,value) : `<select ${attrs}><option value="">Select…</option>${(field.options || []).map(o => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(refMethodOption(o,field.key))}</option>`).join('')}</select>`;
    else control = `<input ${attrs} type="${field.type || 'text'}"${field.type==='date'?'':inputModeAttrs(field.key)} value="${esc(value)}" placeholder="${esc(field.placeholder || '')}" />`;
    const postcodeButton=POSTCODE_TARGETS[field.key] ? `<button class="btn postcode-find" type="button" data-action="postcode-find" data-postcode-key="${esc(field.key)}">Find address</button>` : '';
    return `<div class="field ${span}"><label>${esc(field.label)}</label><div class="voice-control">${control}<button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(field.label)}">🎙 <span>Speak</span></button>${postcodeButton}</div>${['refMethod','referenceMethod'].includes(field.key)?refMethodHelp(value):''}</div>`;
  }

  function boardControl(boardIndex,key,label,value,options=null,extra=''){
    const attrs=`data-board-input="${esc(key)}" data-board-index="${boardIndex}"`;
    const control=Array.isArray(options)
      ? comboControl(attrs,{key,label,options},value)
      : `<input ${attrs}${inputModeAttrs(key)} value="${esc(value??'')}" ${extra}/>`;
    return `<div class="field"><label>${esc(label)}</label>${control}</div>`;
  }

  function renderBoardCircuits(cert,board,boardIndex){
    syncCircuitRows(cert);
    const indices=boardCircuitIndices(cert,board.ref);
    const cards=indices.map((i,pos)=>{
      const row=cert.tables.circuits[i]||{},test=cert.tables.tests[i]||{};
      const number=String(row.circuitNo??pos+1);
      const details=[row.description,row.ocpdType&&row.ocpdRating?row.ocpdType+row.ocpdRating+' A':'',
        test.zs?'Zs '+test.zs+' Ω':''].filter(Boolean).join(' · ');
      const key='inline-circuit:'+cert.id+':'+(row.id||i);
      return '<details class="inline-circuit cert-accordion" data-accordion-key="'+esc(key)+'" data-inline-index="'+i+'" '+(accordionOpen(key,false)?'open':'')+'>'+
        '<summary class="inline-circuit-summary"><strong>'+esc(row.deviceKind==='Main switch'?'Main switch':'Circuit '+number)+'</strong>'+
        '<small>'+esc(details||'Enter details and measurements')+'</small><span class="cert-chevron">⌄</span></summary>'+
        '<div class="inline-circuit-fields" data-inline-body="'+i+'"></div>'+
        '<div class="inline-circuit-actions" role="group" aria-label="Circuit '+esc(number)+' actions">'+
        '<button class="btn small primary inline-circuit-edit" data-action="circuit-open" data-index="'+i+'" aria-label="Edit circuit '+esc(number)+' in the full editor" title="Open complete circuit editor">✎ Edit</button>'+
        '<button class="btn small" data-action="circuit-move-up" data-index="'+i+'" aria-label="Move circuit '+esc(number)+' up" title="Move circuit up" '+(pos===0||row._incomingFeed?'disabled':'')+'>↑ <span class="inline-action-word">Up</span></button>'+
        '<button class="btn small" data-action="circuit-move-down" data-index="'+i+'" aria-label="Move circuit '+esc(number)+' down" title="Move circuit down" '+(pos===indices.length-1||row._incomingFeed?'disabled':'')+'>↓ <span class="inline-action-word">Down</span></button>'+
        '<button class="btn small" data-action="circuit-duplicate" data-index="'+i+'" '+(row._incomingFeed?'disabled':'')+'>Duplicate</button>'+
        '<button class="btn small" data-action="template-save-circuit" data-index="'+i+'" title="Save this circuit as a reusable template" '+(row._incomingFeed?'disabled':'')+'>＋ <span>Save Template</span></button>'+
        '<button class="btn small" data-action="template-open" data-kind="circuit" data-board-ref="'+esc(board.ref)+'" title="Insert a saved circuit template">↳ <span>Use Template</span></button>'+
        '<button class="btn small danger" data-action="circuit-delete" data-index="'+i+'" '+(row._incomingFeed?'disabled':'')+'>Delete</button></div></details>';
    }).join('');
    return '<div class="board-circuit-list circuit-list">'+(cards||'<div class="empty">No circuits added.</div>')+'</div>'+
      '<div class="table-tools board-circuit-tools"><button class="btn primary" data-board-add-circuit data-action="circuit-add" data-board-ref="'+esc(board.ref)+'">＋ Add circuit</button>'+
      '<button class="btn small" data-action="speed-quick">Quick-add</button><button class="btn small" data-action="template-open" data-kind="circuit" data-board-ref="'+esc(board.ref)+'">Use template</button></div>';
  }
  function populateInlineCircuit(details){
    if(!details.open)return;
    const cert=getCurrent(),idx=Number(details.dataset.inlineIndex),body=details.querySelector('[data-inline-body]');
    if(!cert||!body||body.dataset.loaded==='true'||!Number.isInteger(idx)||!cert.tables.circuits?.[idx])return;
    const renderGroups=(groups,scope,src)=>groups.map(g=>
      '<div class="inline-circuit-group"><h4>'+esc(g.title)+'</h4><div class="fields">'+
      g.fields.map(f=>editorInput(cert,scope,idx,f,src?.[f.key]??'')).join('')+'</div></div>').join('');
    body.innerHTML=renderGroups(CIRCUIT_DETAIL_GROUPS,'details',cert.tables.circuits[idx])+
      renderGroups(CIRCUIT_TEST_GROUPS,'tests',cert.tables.tests[idx]||{})+
      '<p class="meta">Changes save automatically. Verify every reading before issue.</p>';
    body.dataset.loaded='true';
  }

  function renderBoardWorkflow(cert){
    ensureBoardWorkflowData(cert);
    syncCircuitRows(cert);
    const boards=cert.tables.boards||[];
    const boardCards=boards.map((board,bi)=>{
      const previousBoards=boards.slice(0,bi);
      const sourceBoardOptions=previousBoards.map(b=>b.ref);
      if(board.sourceBoardRef && !sourceBoardOptions.includes(board.sourceBoardRef)) sourceBoardOptions.push(board.sourceBoardRef);
      const sourceIndices=board.sourceBoardRef ? boardCircuitIndices(cert,board.sourceBoardRef) : [];
      const sourceCircuitOptions=sourceIndices
        .map(i=>String(cert.tables.circuits[i]?.circuitNo??'').trim())
        .filter(v=>v!=='' && !cert.tables.circuits[sourceIndices.find(i=>String(cert.tables.circuits[i]?.circuitNo??'').trim()===v)]?._incomingFeed);
      const feed=board.feedSourceType || (bi===0?'Mains':'');
      const feedFields=bi===0
        ? '<div class="field"><label>Fed from</label><select data-board-input="feedSourceType" data-board-index="'+bi+'"><option value="Mains" selected>Mains</option></select></div>'
        : `<div class="field"><label>Fed from</label><select data-board-input="feedSourceType" data-board-index="${bi}"><option value="">Select…</option><option value="Mains" ${feed==='Mains'?'selected':''}>Mains</option><option value="Another consumer unit" ${feed==='Another consumer unit'?'selected':''}>Another consumer unit</option></select></div>`+
          (feed==='Another consumer unit'
            ? `<div class="field"><label>Source consumer unit</label><select data-board-input="sourceBoardRef" data-board-index="${bi}"><option value="">Select…</option>${sourceBoardOptions.map(ref=>`<option value="${esc(ref)}" ${String(board.sourceBoardRef||'')===String(ref)?'selected':''}>${esc(ref)}</option>`).join('')}</select></div>
               <div class="field"><label>Source circuit</label><select data-board-input="sourceCircuitNo" data-board-index="${bi}"><option value="">Select…</option>${sourceCircuitOptions.map(no=>`<option value="${esc(no)}" ${String(board.sourceCircuitNo??'')===String(no)?'selected':''}>Circuit ${esc(no)}</option>`).join('')}</select></div>`
            : '');
      const accordionKey='board:'+cert.id+':'+board.id;
      return `<div class="consumer-unit-group" data-board-key="${esc(normaliseBoardKey(board.ref))}"><details class="card form-section consumer-unit-card cu-accordion" data-board-id="${esc(board.id)}" data-accordion-key="${esc(accordionKey)}" ${accordionOpen(accordionKey,bi===0)?'open':''}>
        <summary class="cu-summary"><span class="cu-index">${bi+1}</span><span class="cu-label"><strong>Consumer unit ${bi+1} · ${esc(board.ref||('DB'+(bi+1)))}</strong><small>${esc(board.manufacturer||'')}${boardCircuitIndices(cert,board.ref).length?' · '+boardCircuitIndices(cert,board.ref).length+' circuits':''}</small></span><span class="cert-chevron">⌄</span></summary><div class="cu-accordion-body">
        <div class="consumer-unit-head">
          <div><span class="eyebrow">CONSUMER UNIT ${bi+1}</span><h3>${esc(board.ref||('DB'+(bi+1)))}</h3></div>
          <button class="btn small" data-action="template-save-board" data-board-index="${bi}">Save template</button>${boards.length?`<button class="btn small danger" data-action="board-delete" data-board-index="${bi}">Delete CU</button>`:''}
        </div>
        <div class="fields consumer-unit-fields">
          ${boardControl(bi,'ref','Board reference',board.ref)}
          ${boardControl(bi,'location','Location',board.location)}
          ${feedFields}
          ${boardControl(bi,'zdb','Zdb (Ω)',board.zdb)}
          ${boardControl(bi,'ipf','Ipf (kA)',board.ipf)}
          ${boardControl(bi,'distributionOcpdBs','Distribution circuit OCPD BS (EN)',board.distributionOcpdBs)}
          ${boardControl(bi,'distributionOcpdType','Distribution circuit OCPD type',board.distributionOcpdType,OPTIONS.ocpdType)}
          ${boardControl(bi,'distributionOcpdRating','Distribution circuit OCPD rating / setting (A)',board.distributionOcpdRating)}
          ${boardControl(bi,'spd','SPD type(s)',board.spd,OPTIONS.spdType)}
          ${boardControl(bi,'spdBs','SPD standard / BS EN (as marked)',board.spdBs||'')}
          ${boardControl(bi,'rcdBs','RCD BS (EN)',board.rcdBs)}
          ${boardControl(bi,'rcdType','RCD type',board.rcdType,OPTIONS.rcdType)}
          ${boardControl(bi,'rcdRating','RCD rating (A)',board.rcdRating,OPTIONS.ocpdRating)}
          ${boardControl(bi,'rcdIdn','RCD IΔn (mA)',board.rcdIdn,OPTIONS.rcdIdn)}
          ${boardControl(bi,'polarity','Correct polarity',board.polarity,OPTIONS.yesNoNA)}
          ${boardControl(bi,'phaseSequence','Phase sequence',board.phaseSequence,OPTIONS.yesNoNA)}
          ${boardControl(bi,'spdOperational','SPD operational',board.spdOperational,OPTIONS.yesNoNA)}
        </div>
      </div></details>
      <details class="card form-section cu-circuits-accordion" data-accordion-key="board-circuits:${esc(cert.id)}:${esc(board.id)}">
        <summary class="cu-summary"><span class="cu-index">↳</span><span class="cu-label"><strong>${esc(board.ref||('DB'+(bi+1)))} circuits</strong><small>${boardCircuitIndices(cert,board.ref).length} circuits</small></span><span class="cert-chevron">⌄</span></summary>
        <div class="cu-accordion-body"><div class="toolbar">${boardScanButton(cert,board.ref)}</div>${renderBoardCircuits(cert,board,bi)}</div>
      </details></div>`;
    }).join('');
    return `<details class="card form-section cert-accordion distribution-section" data-accordion-key="section:${esc(cert.id)}:J Distribution"><summary class="cert-accordion-head"><h3>J · Distribution, Consumer units and circuits</h3><span class="cert-chevron">⌄</span></summary><div class="distribution-body">
      ${boardCards}
      <div class="add-consumer-unit"><button class="btn primary" data-action="board-add">Add another consumer unit</button><button class="btn small" data-action="template-open" data-kind="board">Use template</button></div>
    </div></details>`;
  }

  function renderCircuitList(cert){
    return renderBoardWorkflow(cert);
  }

  function comboControl(attrs,field,value){
    const id='options-'+uid();
    return `<div class="combo-field"><input ${attrs}${inputModeAttrs(field.key)} value="${esc(value??'')}" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="${id}" aria-label="${esc(field.label)}"/><button class="combo-arrow" type="button" data-action="combo-toggle" aria-label="Show ${esc(field.label)} options" aria-controls="${id}" aria-expanded="false">⌄</button><div class="combo-menu" id="${id}" role="listbox" hidden>${field.options.map(o=>`<button type="button" role="option" class="combo-option" data-action="combo-option" data-value="${esc(o)}">${esc(refMethodOption(o,field.key))}</button>`).join('')}</div></div>`;
  }

  function editorInput(cert,scope,index,field,value){
    const attrs=`data-circuit-input="${scope}" data-index="${index}" data-col="${field.key}"`;
    let control;
    if(field.key==='boardRef' || (scope==='details' && cert.tables.circuits[index]?._incomingFeed && field.key!=='maxZs')){
      control=`<input ${attrs} value="${esc(value??'')}" readonly/>`;
    }else if(field.textarea){
      control=`<textarea ${attrs}>${esc(value??'')}</textarea>`;
    }else if(field.options){
      control=comboControl(attrs,field,value);
    }else{
      control=`<input ${attrs}${inputModeAttrs(field.key)} value="${esc(value??'')}"/>`;
    }
    const extra=field.suffix==='zs'
      ? '<div class="meta auto-zs-note">Design limit from BS, curve, rating and voltage. Manual override available.</div>'
      : '';
    const auto=cert.autoMeta?.['circuit:'+index+':'+field.key] ? `<button class="auto-derived-badge" type="button" data-action="auto-info" data-index="${index}" data-key="${esc(field.key)}">Auto</button>` : '';
    return `<div class="field ${field.span==='full'?'full':''}"><label>${esc(field.label)} ${auto}</label><div class="voice-control">${control}<button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(field.label)}">🎙 <span>Speak</span></button>${warningButton(cert,index,field.key)}</div>${field.key==='refMethod'?refMethodHelp(value):''}${extra}</div>`;
  }

  function circuitEditorView(cert){
    syncCircuitRows(cert);
    const i=Math.max(0,Math.min(Number(view.circuitIndex)||0,cert.tables.circuits.length-1));
    view.circuitIndex=i;
    recalculateCircuitZs(cert,i);
    const circuit=cert.tables.circuits[i]||{};
    const test=cert.tables.tests[i]||{};
    const step=view.circuitStep==='tests'?'tests':'details';
    const groups=(step==='details'?CIRCUIT_DETAIL_GROUPS:CIRCUIT_TEST_GROUPS).map(g=>{
      const source=step==='details'?circuit:test;
      return `<section class="card form-section"><h3>${esc(g.title)}</h3><div class="fields">${g.fields.map(f=>editorInput(cert,step,i,f,source[f.key]??'')).join('')}</div></section>`;
    }).join('');
    const number=circuit.circuitNo!==undefined&&circuit.circuitNo!==null&&String(circuit.circuitNo).trim()!=='' ? String(circuit.circuitNo) : String(i+1);
    const title=`Circuit ${esc(number)}`;
    const nav=step==='details'
      ? '<button class="btn primary" data-action="circuit-next">Next · Test results →</button>'
      : `<button class="btn" data-action="circuit-prev">← Circuit details</button><button class="btn primary" data-action="circuit-complete" data-board-ref="${esc(circuit.boardRef||'DB1')}">Complete circuit</button>`;
    return `<div class="form-head circuit-head"><button class="btn back" data-action="circuit-list" data-board-ref="${esc(circuit.boardRef||'DB1')}">← Circuits</button><div class="form-title"><div class="eyebrow">${step==='details'?'1 of 2 · Circuit details':'2 of 2 · Test results'}</div><h2>${title}</h2><p>${esc(circuit.description||'')}</p></div><div class="actions">${boardScanButton(cert,circuit.boardRef)}<button class="btn small" data-action="job-evidence" data-ref="${esc(circuit.boardRef||'DB1')} / ${esc(number)}">📷 Circuit evidence</button><button class="btn small" data-action="speed-convert">Copy to new type</button><button class="btn small" data-action="template-save-circuit">Save template</button><span class="pill"><span data-save-state>Saved</span></span></div></div>${groups}<div class="circuit-page-nav">${nav}</div><div class="savebar"><div class="savebar-inner"><div class="meta"><span data-save-state>Saved</span> · circuit autosaved</div><button class="btn small" data-action="circuit-list" data-board-ref="${esc(circuit.boardRef||'DB1')}">Circuits</button></div></div>`;
  }

  function renderInspectionChecklist(part, cert) {
    const rows=cert.tables[part.key]||[];
    const body=rows.map((row,ri)=>{
      const selected=String(row.outcome||'');
      return `<div class="inspection-row"><div class="inspection-copy"><strong>${esc(row.item||String(ri+1))}</strong><span>${esc(row.description||'')}</span></div><div class="inspection-choices" role="group" aria-label="Result for item ${esc(row.item||String(ri+1))}">${OPTIONS.passNA.map(v=>`<button type="button" class="${selected===v?'selected':''} ${v==='✕'?'fail':''}" data-action="inspection-outcome" data-row="${ri}" data-value="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`;
    }).join('');
    const key='section:'+cert.id+':'+part.title;
    return `<details class="card form-section inspection-section cert-accordion" data-accordion-key="${esc(key)}" ${accordionOpen(key,false)?'open':''}><summary class="cert-accordion-head"><h3>${esc(part.title)}</h3><span class="cert-chevron">⌄</span></summary><div class="cert-accordion-body"><div class="inspection-bulk"><span>Apply to all:</span><button class="btn small" data-action="inspection-bulk" data-value="✓">✓ All</button><button class="btn small danger" data-action="inspection-bulk" data-value="✕">✕ All</button><button class="btn small" data-action="inspection-bulk" data-value="N/A">N/A All</button><button class="btn small ghost" data-action="inspection-bulk" data-value="">Clear</button></div><div class="inspection-list">${body}</div></div></details>`;
  }

  function renderTable(part, cert) {
    if(part.key==='eicInspection') return renderInspectionChecklist(part,cert);
    const rows = cert.tables[part.key] || [];
    const head = part.columns.map(c => `<th>${esc(c.label)}</th>`).join('') + `<th></th>`;
    const body = rows.map((row, ri) => `<tr>${part.columns.map(c => `<td>${renderTableControl(part.key, ri, c, row[c.key] ?? '')}</td>`).join('')}<td>${part.key==='observations'?`<button class="btn small" data-action="job-evidence" data-ref="${esc(row.item||String(ri+1))}">Evidence</button>`:''}<button class="btn small danger" data-action="row-delete" data-table="${part.key}" data-row="${ri}">×</button></td></tr>`).join('');
    return `<section class="card form-section"><h3>${esc(part.title)}</h3><div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><div class="table-tools"><button class="btn small" data-action="row-add" data-table="${part.key}">+ Add row</button></div></section>`;
  }

  function renderTableControl(tableKey, rowIndex, col, value) {
    if (col.readonly) return `<span>${esc(value)}</span>`;
    const attrs = `data-table-input="${tableKey}" data-row="${rowIndex}" data-col="${col.key}"`;
    if (col.type === 'select') return `<div class="voice-control table-voice"><select ${attrs}><option value=""></option>${(col.options || []).map(o => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(refMethodOption(o,col.key))}</option>`).join('')}</select><button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(col.label)}">🎙 <span>Speak</span></button></div>`;
    return `<div class="voice-control table-voice"><input ${attrs}${inputModeAttrs(col.key)} value="${esc(value)}" /><button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(col.label)}">🎙 <span>Speak</span></button></div>`;
  }

  function openSettings() {
    const textField=(k,l,wide=false,type='text')=>`<div class="field ${wide?'full':''}"><label>${l}</label><input data-setting="${k}" type="${type}" value="${esc(settings[k]||'')}" /></div>`;
    const html=`<div class="modal-backdrop" data-action="close-modal"><div class="card modal profile-modal" data-modal>
      <div class="profile-head"><div><div class="eyebrow">ENGINEER PROFILE</div><h2>Your defaults</h2><p>Used on new certificates. Every certificate can still be edited.</p></div><button class="btn" data-action="close-modal">Close</button></div>
      <section class="profile-section"><h3>Engineer & business</h3><div class="settings-grid">
        ${textField('engineerName','Engineer name')}${textField('engineerPosition','Position / role')}${textField('companyName','Company name')}${textField('registration','Registration / scheme number')}
        <div class="field full"><label>Business address</label><textarea data-setting="address">${esc(settings.address||'')}</textarea></div>
        ${textField('postcode','Business postcode')}${textField('phone','Phone')}${textField('email','Email')}${textField('qualification','Qualifications / competence',true)}
      </div></section>
      <section class="profile-section"><h3>Default test instrument</h3><p class="profile-help">Used to pre-fill the Test Instrument section. Clear any field on a certificate when a different tester was used.</p><div class="settings-grid">
        ${textField('testerMake','Tester make')}${textField('testerModel','Tester model')}${textField('testerSerial','Serial number')}${textField('testerCalibrationDue','Calibration due','', 'date')}
      </div></section>
      <section class="profile-section"><h3>UK postcode address lookup</h3><p class="profile-help">Optional. Add an Ideal Postcodes API key to enable postcode-first address selection. The key stays in this app’s local settings on your device.</p><div class="settings-grid">${textField('postcodeApiKey','Ideal Postcodes API key',true)}</div></section>
      <section class="profile-section"><h3>Customer report branding</h3>
      <p class="profile-help">Branding changes appearance only; mandatory certificate information stays unchanged.</p>
      <div class="settings-grid">
      <div class="field"><label>Report accent</label><input data-setting="reportAccent" type="color" value="${esc(settings.reportAccent||'#1365cc')}" /></div>
      <div class="field"><label>Company logo (PNG, JPEG, WebP or BMP · up to 8 MB, automatically resized)</label><input data-report-image="reportLogo" type="file" accept="image/png,image/jpeg,image/webp,image/bmp" /></div>
      <div class="field"><label>Your signature image (PNG, JPEG, WebP or BMP · up to 8 MB)</label><input data-report-image="reportSignature" type="file" accept="image/png,image/jpeg,image/webp,image/bmp" /></div></div>
      <button class="btn small" type="button" data-action="clear-brand-images">Clear logo and signature</button>
      </section>
      <section class="profile-section"><h3>Backup & recovery</h3><p class="profile-help">The app keeps an automatic recovery copy. Imports and destructive deletes save an undo snapshot first.</p><div class="toolbar recovery-toolbar"><button class="btn" data-action="backup">Backup</button><button class="btn primary" data-action="import-backup">Import file</button><button class="btn" data-action="restore">Restore latest</button><button class="btn" data-action="undo-restore">Undo recovery</button><button class="btn" data-action="share-backup">Share</button></div></section>
      <div class="profile-footer"><button class="btn primary" data-action="save-settings">Save profile</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  }

  function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }

  function backupPayload() {
    return JSON.stringify({ version: VERSION, exportedAt: new Date().toISOString(), settings, boardTemplates: reusableTemplates('board'), circuitTemplates: reusableTemplates('circuit'), certificates: state.certificates, jobs:window.SperinJobCentre?.backup?.()||[] }, null, 2);
  }

  function savePreRestoreSnapshot() {
    const content=backupPayload();
    localStorage.setItem(PRE_RESTORE_KEY,content);
    if(window.Android && typeof window.Android.saveRecoverySnapshot==='function'){
      try{window.Android.saveRecoverySnapshot(content,`pre-restore-${Date.now()}.json`);}catch(err){console.warn(err);}
    }
    return content;
  }

  function prepareBackupData(json) {
    const data=typeof json==='string'?JSON.parse(json):json;
    if(!isRecord(data) || !Array.isArray(data.certificates)) throw new Error('Not a Sperin Certificates backup');
    const certificates=data.certificates.map((raw,index)=>{
      const copy=clone(raw);
      const migrated=migrateCertificate(copy);
      if(!migrated) throw new Error('Unsupported certificate at item '+(index+1));
      return migrated;
    });
    const importedSettings=isRecord(data.settings)?{...settings,...data.settings}:settings;
    const templates={};
    for(const kind of ['board','circuit']){
      const key=kind+'Templates';
      if(data[key]!==undefined){
        if(!Array.isArray(data[key]) || data[key].some(t=>!isRecord(t)||typeof t.name!=='string'||!isRecord(t.design))) throw new Error('Invalid '+kind+' templates');
        templates[kind]=data[key].map(t=>cleanTemplate(kind,t));
      }
    }
    return {certificates,settings:importedSettings,templates,jobs:Array.isArray(data.jobs)?data.jobs:[]};
  }

  function applyBackupJson(json,preserveCurrent=true) {
    const prepared=prepareBackupData(json);
    if(preserveCurrent) savePreRestoreSnapshot();
    Object.entries(prepared.templates).forEach(([kind,list])=>saveReusableTemplates(kind,list));
    resetEditHistory();
    state={certificates:prepared.certificates};
    settings=prepared.settings;
    if(prepared.jobs?.length)window.SperinJobCentre?.importMetadata?.(prepared.jobs);
    view={page:'home',currentId:null,circuitIndex:null,circuitStep:'details'};
    closeModal();
    persist(); saveSettings(); scheduleNativeAutoBackup(); render(); goTop();
  }

  function undoLastRestore(){
    const recovery=localStorage.getItem(PRE_RESTORE_KEY);
    if(!recovery){alert('No pre-restore recovery snapshot is available on this device.');return;}
    try{
      const current=backupPayload();
      applyBackupJson(recovery,false);
      localStorage.setItem(PRE_RESTORE_KEY,current);
      toast('Previous certificate data recovered');
    }catch(err){alert('Could not recover the previous data: '+err.message);}
  }

  window.sperinRestoreBackup=function(json,error){
    if(error){alert('Backup import/restore failed: '+error);return;}
    try{applyBackupJson(json,true);toast('Backup loaded — Undo Last Restore is available');}
    catch(err){alert('Could not load backup: '+err.message);}
  };

  function recoveryConfirmCopy(kind,stage) {
    const copy={
      backup:{
        firstTitle:'Backup certificates?',
        firstText:'This creates a new backup copy. It does not replace your current certificates.',
        secondTitle:'Confirm backup',
        secondText:'Press Backup now to create the backup.',
        finalLabel:'Backup now'
      },
      restore:{
        firstTitle:'Restore latest backup?',
        firstText:'This replaces the current certificate data with the latest backup. Your current data is saved to recovery first.',
        secondTitle:'Confirm restore',
        secondText:'This is the restore action. Press Restore now only if you want to replace the current data.',
        finalLabel:'Restore now'
      },
      import:{
        firstTitle:'Import backup file?',
        firstText:'This will load certificate data from a backup file. Your current data is saved to recovery first.',
        secondTitle:'Confirm import',
        secondText:'Press Import now to choose and load the backup file.',
        finalLabel:'Import now'
      }
    };
    const item=copy[kind];
    if(!item)return null;
    return stage===2
      ? {title:item.secondTitle,text:item.secondText,label:item.finalLabel}
      : {title:item.firstTitle,text:item.firstText,label:'Continue'};
  }

  function showRecoveryConfirmation(kind,stage=1) {
    const copy=recoveryConfirmCopy(kind,stage);
    if(!copy)return;
    pendingRecoveryAction={kind,stage};
    document.querySelector('.recovery-confirm-backdrop')?.remove();
    const danger=kind==='restore' && stage===2 ? ' danger' : '';
    const html=`<div class="modal-backdrop recovery-confirm-backdrop" data-action="recovery-confirm-cancel"><div class="card modal recovery-confirm-modal" data-modal><div class="eyebrow">BACKUP & RECOVERY</div><h2>${esc(copy.title)}</h2><p>${esc(copy.text)}</p><div class="recovery-confirm-actions"><button class="btn" data-action="recovery-confirm-cancel">Cancel</button><button class="btn primary${danger}" data-action="${stage===1?'recovery-confirm-next':'recovery-confirm-do'}">${esc(copy.label)}</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  }

  function performBackup() {
    const content=backupPayload();
    const filename=`sperin-certificates-backup-${TODAY}.json`;
    if(window.Android && typeof window.Android.saveBackup==='function'){
      try {
        const saved=window.Android.saveBackup(content,filename);
        if(saved===false) throw new Error('Android could not save the backup');
        toast('Backup complete');
        return;
      } catch(err){console.warn(err);alert('Backup failed: '+(err?.message||err));return;}
    }
    downloadBlob(content,filename,'application/json');
    toast('Backup complete');
  }

  function backup() {
    showRecoveryConfirmation('backup',1);
  }

  function performImportBackupFile() {
    if(window.Android && typeof window.Android.importBackupFile==='function'){
      try { window.Android.importBackupFile(); return; } catch(err){console.warn(err);}
    }
    const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json,text/json';
    input.onchange=()=>{
      const file=input.files?.[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=()=>{try{applyBackupJson(reader.result);toast('Import complete');}catch(err){alert('Could not import backup: '+err.message);}};
      reader.readAsText(file);
    };
    input.click();
  }

  function importBackupFile() {
    showRecoveryConfirmation('import',1);
  }

  function performRestore() {
    if(window.Android && typeof window.Android.restoreLatestBackup==='function'){
      try { window.Android.restoreLatestBackup(); return; } catch(err){console.warn(err);}
    }
    performImportBackupFile();
  }

  function restore() {
    showRecoveryConfirmation('restore',1);
  }

  function completeRecoveryConfirmation() {
    const pending=pendingRecoveryAction;
    pendingRecoveryAction=null;
    document.querySelector('.recovery-confirm-backdrop')?.remove();
    if(!pending)return;
    if(pending.kind==='backup') performBackup();
    else if(pending.kind==='restore') performRestore();
    else if(pending.kind==='import') performImportBackupFile();
  }

  function shareBackup() {
    const content=backupPayload();
    const filename=`sperin-certificates-backup-${TODAY}.json`;
    if(window.Android && typeof window.Android.shareBackup==='function'){
      try { window.Android.shareBackup(content,filename); return; } catch(err){console.warn(err);}
    }
    if(navigator.share){
      const file=new File([content],filename,{type:'application/json'});
      navigator.share({title:'Sperin Certificates backup',files:[file]}).catch(()=>{});
    } else downloadBlob(content,filename,'application/json');
  }


  function downloadBlob(content, filename, mime) {
    if (window.Android && typeof window.Android.saveTextFile === 'function') {
      try { window.Android.saveTextFile(String(content), filename, mime || 'text/plain'); return; } catch (err) { console.warn('Android file save failed', err); }
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function printCertificate() {
    saveNow();
    if(window.Android && typeof window.Android.printPage==='function'){
      try { window.Android.printPage(); return; } catch(err) { console.warn('Android print failed',err); }
    }
    window.print();
  }

  function pdfSafeName(cert) { return `${cert.number || SCHEMAS[cert.type].code}-${(cert.fields.installationAddress || cert.fields.premisesAddress || '').split('\n')[0] || 'certificate'}`.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-'); }

  function pdfHeader(doc, schema, cert) {
    const w=doc.internal.pageSize.getWidth();
    doc.setFillColor(7, 17, 31); doc.rect(0, 0, w, 24, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text('SPERIN SERVICES', 14, 10);
    doc.setFontSize(10); doc.text(schema.name.toUpperCase(), 14, 17);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(cert.number || '', w-14, 10, { align: 'right' }); doc.text(schema.standard, w-14, 17, { align: 'right' });
    doc.setTextColor(20,28,38);
  }

  function pdfFooter(doc) {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const w=doc.internal.pageSize.getWidth(), h=doc.internal.pageSize.getHeight();
      doc.setFontSize(7); doc.setTextColor(100);
      doc.text(`Sperin Certificates · Independent certificate software · Page ${i} of ${pages}`, w/2, h-6, { align: 'center' });
    }
  }

  function hasPdfValue(field,value){
    if(field.type==='checkbox') return value===true;
    return value!==undefined && value!==null && String(value).trim()!=='';
  }

  let lastPdfPreviewUrl=null;
  function showPdfSaved(filename){
    document.querySelector('.pdf-download-backdrop')?.remove();
    const m=document.createElement('div');m.className='modal-backdrop pdf-download-backdrop';
    m.innerHTML='<div class="card modal pdf-downloaded-modal" role="dialog" aria-modal="true" aria-label="PDF downloaded">'+
      '<h2>PDF downloaded ✓</h2><p>'+esc(filename)+' saved to Downloads.</p>'+
      '<div class="toolbar"><button class="btn primary" data-action="pdf-open">Open file</button><button class="btn" data-action="pdf-dismiss">Close</button></div></div>';
    document.body.appendChild(m);
  }
  async function downloadPDF() {
    const cert=getCurrent(); if(!cert)return false;
    syncSingleSignatory(cert); persist();
    try{
      if(!window.SperinIetForms?.build) throw new Error('Certificate form renderer unavailable');
      const doc=window.SperinIetForms.build({cert,schema:SCHEMAS[cert.type],settings,worksheet:false});
      const pdfName=`${pdfSafeName(cert)}.pdf`;
      toast('Download started…');
      if(window.Android && typeof window.Android.savePdfBase64==='function'){
        const saved=window.Android.savePdfBase64(doc.output('datauristring'),pdfName);
        if(saved===false) throw new Error('Android could not save the PDF');
        showPdfSaved(pdfName);
      }else{
        if(lastPdfPreviewUrl)URL.revokeObjectURL(lastPdfPreviewUrl);
        lastPdfPreviewUrl=URL.createObjectURL(doc.output('blob'));
        doc.save(pdfName);
        showPdfSaved(pdfName);
      }
      return true;
    }catch(err){
      console.error(err);
      alert('Certificate PDF generation failed: '+(err?.message||err));
      return false;
    }
  }

  async function completeAndCreatePdf(reviewed=false) {
    const cert=getCurrent(); if(!cert)return;
    if(['pat','ev','solar','commercialFire'].includes(cert.type)){
      alert('Specialist records are DRAFT ONLY in this development preview. Final professional issue is blocked until the applicable technical/IET standards audit and real-world testing have passed. You can still export a clearly marked draft PDF.');
      return;
    }
    if(!reviewed){openCertificateReview(true);return;}
    syncSingleSignatory(cert);
    saveNow();
    const ok=await downloadPDF();
    if(!ok)return;
    cert.status='Complete';
    saveNow();
    render();
    toast('Certificate completed');
    if(window.Android?.openLatestPdf)window.Android.openLatestPdf();
    else if(lastPdfPreviewUrl)window.open(lastPdfPreviewUrl,'_blank','noopener');
  }

  function formatPdfValue(field, value) {
    if(field.type==='checkbox') return value ? 'Yes' : '';
    if (!value) return '';
    if (field.type === 'date') return fmtDate(value);
    return String(value);
  }

  function toast(message) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.appendChild(el); setTimeout(() => el.remove(), 1800);
  }



  // v1.6 machine-readable Site Sheet workflow.
  let siteBuilderState=null, siteReadState=null, siteScanState=null, siteScanSeq=0;

  const SITE_CIRCUIT_FIELDS=[
    {s:'NO',l:'Circuit',k:'circuitNo',t:'circuits',a:['circuit number','circuit']},
    {s:'DESC',l:'Description',k:'description',t:'circuits',a:['circuit description','description']},
    {s:'PTS',l:'Points',k:'points',t:'circuits',a:['points served','number of points','points']},
    {s:'CABLE',l:'Cable',kind:'cable',a:['cable size','cable type','cable']},
    {s:'CPC',l:'CPC',k:'cpcCsa',t:'circuits',a:['c p c','cpc','earth conductor']},
    {s:'INST',l:'Installation',kind:'installation',a:['installation method','containment','installation']},
    {s:'REF',l:'Reference method',k:'refMethod',t:'circuits',a:['reference method','ref method']},
    {s:'OCPD',l:'Protective device',k:'ocpdBs',t:'circuits',a:['protective device standard','protective device','ocpd']},
    {s:'CURVE',l:'Curve',k:'ocpdType',t:'circuits',a:['breaker curve','curve']},
    {s:'RATING',l:'Rating',k:'ocpdRating',t:'circuits',a:['device rating','breaker rating','rating']},
    {s:'RCDTYPE',l:'RCD type',k:'rcdType',t:'circuits',a:['r c d type','rcd type']},
    {s:'IDN',l:'IΔn',k:'rcdIdn',t:'circuits',a:['i delta n','rcd milliamps']},
    {s:'IRV',l:'Insulation test voltage',k:'irVoltage',t:'tests',a:['insulation test voltage','test voltage']},
    {s:'IRLL',l:'Live to live',k:'irLL',t:'tests',a:['live to live','line to line']},
    {s:'IRLE',l:'Live to earth',k:'irLE',t:'tests',a:['live to earth','line to earth']},
    {s:'R1R2',l:'R1 + R2',k:'r1r2',t:'tests',a:['r 1 plus r 2','r1 plus r2','r one plus r two']},
    {s:'R2',l:'R2',k:'r2only',t:'tests',a:['r 2 only','r2 only']},
    {s:'ZS',l:'Zs',k:'zs',t:'tests',a:['z s','zs','earth fault loop impedance']},
    {s:'POL',l:'Polarity',k:'polarity',t:'tests',a:['polarity']},
    {s:'RCDMS',l:'RCD time',k:'rcdTime',t:'tests',a:['r c d time','rcd time','trip time']},
    {s:'REMARKS',l:'Remarks',k:'remarks',t:'tests',a:['remarks','notes']}
  ];
  const SITE_BOARD_FIELDS=[
    {s:'REF',l:'Board reference',k:'ref',a:['board reference','board ref']},
    {s:'LOC',l:'Board location',k:'location',a:['board location']},
    {s:'FROM',l:'Supplied from',k:'suppliedFrom',a:['supplied from']},
    {s:'ZDB',l:'Zdb',k:'zdb',a:['z d b','zdb']},{s:'IPF',l:'Ipf',k:'ipf',a:['i p f','ipf']},
    {s:'MAIN',l:'Main switch / device',k:'mainSwitch',a:['main switch','main device']},
    {s:'RCD',l:'RCD / RCBO details',k:'rcd',a:['board rcd','rcbo details']},
    {s:'SPD',l:'SPD',k:'spd',a:['s p d','spd']},{s:'POL',l:'Board polarity',k:'polarity',a:['board polarity']},
    {s:'PHASE',l:'Phase sequence',k:'phaseSequence',a:['phase sequence']}
  ];
  const FIELD_SPEECH_LABELS={clientName:'Client name',clientPostcode:'Client postcode',clientAddress:'Client address',
    installationPostcode:'Installation postcode',installationAddress:'Installation address',premisesPostcode:'Premises postcode',
    premisesAddress:'Premises address',certificateNo:'Certificate number',issueDate:'Issue date',description:'Installation description',
    extent:'Extent of work',occupier:'Occupier',earthingArrangement:'Earthing arrangement',nominalVoltage:'Nominal voltage',
    frequency:'Frequency',ipf:'Supply Ipf',ze:'Ze',maximumDemand:'Maximum demand',dbReference:'Primary board reference',
    dbLocation:'Primary board location',testerMake:'Tester make',testerModel:'Tester model',testerSerial:'Tester serial number',testedBy:'Tested by'};

  function readStore(k,fallback){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x??fallback;}catch{return fallback;}}
  function sitePlans(){const x=readStore(SHEET_PLANS_KEY,[]);return Array.isArray(x)?x:[];}
  function saveSitePlans(x){localStorage.setItem(SHEET_PLANS_KEY,JSON.stringify(x.slice(0,40)));}
  function siteTemplates(){const x=readStore(SHEET_TEMPLATES_KEY,[]);return Array.isArray(x)?x:[];}
  function saveSiteTemplates(x){localStorage.setItem(SHEET_TEMPLATES_KEY,JSON.stringify(x.slice(0,20)));}
  function siteSheetId(){return 'SS-'+TODAY.replace(/-/g,'').slice(2)+'-'+uid().replace(/[^a-z0-9]/gi,'').slice(-6).toUpperCase();}
  function cleanBoardPlan(b,i){return {ref:String(b?.ref||('DB'+(i+1))).trim()||('DB'+(i+1)),location:String(b?.location||'').trim(),circuits:Math.max(1,Math.min(72,parseInt(b?.circuits,10)||12))};}
  function makeSitePlan(type,boards,name){return {id:siteSheetId(),version:VERSION,type,name:String(name||'').trim(),createdAt:new Date().toISOString(),certificateId:null,boards:(type==='eic'||type==='eicr')?(boards||[{ref:'DB1',circuits:12}]).map(cleanBoardPlan):[],descriptors:[],pages:0};}
  function planSummary(p){const code=SCHEMAS[p.type]?.code||String(p.type).toUpperCase();const b=(p.boards||[]).map(x=>x.ref+':'+x.circuits).join('|');return b?code+'|'+b:code;}
  function updateStoredPlan(p){const x=sitePlans().filter(q=>q.id!==p.id);x.unshift(p);saveSitePlans(x);}

  function plannedCertificate(p){
    let cert=p.certificateId?state.certificates.find(c=>c.id===p.certificateId):null;
    if(cert){migrateCertificate(cert);return cert;}
    cert=makeCertificate(p.type);cert.siteSheetId=p.id;
    if(p.type==='eic'||p.type==='eicr'){
      cert.tables.boards=(p.boards||[]).map(b=>({ref:b.ref,location:b.location||''}));cert.tables.circuits=[];cert.tables.tests=[];
      (p.boards||[]).forEach(b=>{for(let i=1;i<=b.circuits;i++){cert.tables.circuits.push({boardRef:b.ref,circuitNo:String(i)});cert.tables.tests.push({boardRef:b.ref,circuitNo:String(i)});}});
    }
    state.certificates.unshift(cert);p.certificateId=cert.id;persist();return cert;
  }

  function buildSiteDescriptors(p,cert){
    const out=[];let fn=0,tn=0;const schema=SCHEMAS[p.type];
    schema.sections.forEach(part=>{
      if(part.type==='section')part.fields.forEach(field=>{if(!fieldVisible(field,cert))return;fn++;const label=FIELD_SPEECH_LABELS[field.key]||field.label;out.push({code:'F'+String(fn).padStart(3,'0'),kind:'field',key:field.key,section:part.title,label,type:field.type||'text',options:field.options||[],aliases:[label,field.label]});});
      else if(part.type==='table'&&!['circuits','tests','boards'].includes(part.key)){
        const rows=cert.tables?.[part.key]||part.defaultRows||[];
        rows.forEach((row,ri)=>part.columns.forEach(col=>{if(col.readonly)return;tn++;const prefix=[row.item||row.ref||('Row '+(ri+1)),row.description].filter(Boolean).join(' · ');out.push({code:'T'+String(tn).padStart(3,'0'),kind:'table',table:part.key,row:ri,key:col.key,section:part.title,label:String(prefix)+' · '+col.label,type:col.type||'text',options:col.options||[],aliases:[String(prefix)+' '+col.label,col.label]});}));
      }
    });
    if(p.type==='eic'||p.type==='eicr'){
      let offset=0;(p.boards||[]).forEach((b,bi)=>{
        SITE_BOARD_FIELDS.forEach(x=>out.push({code:'B'+String(bi+1).padStart(2,'0')+'-'+x.s,kind:'table',table:'boards',row:bi,key:x.k,section:'Distribution board '+b.ref,label:x.l,aliases:x.a,boardIndex:bi}));
        for(let ci=0;ci<b.circuits;ci++){const row=offset+ci;SITE_CIRCUIT_FIELDS.forEach(x=>out.push({code:'B'+String(bi+1).padStart(2,'0')+'C'+String(ci+1).padStart(2,'0')+'-'+x.s,kind:x.kind||'table',table:x.t,row,key:x.k,section:b.ref+' · Circuit '+(ci+1),label:x.l,aliases:x.a,boardIndex:bi,circuitIndex:ci,boardRef:b.ref}));}offset+=b.circuits;
      });
    }
    return out;
  }

  function descValue(cert,d){if(d.kind==='field')return cert.fields?.[d.key]??'';if(d.kind==='cable'){const r=cert.tables?.circuits?.[d.row]||{};return ((r.liveCsa?r.liveCsa+' mm² ':'')+(r.wiringType||'')).trim();}if(d.kind==='installation')return cert.tables?.circuits?.[d.row]?.installMethod??'';return cert.tables?.[d.table]?.[d.row]?.[d.key]??'';}
  function tneCpc(size){return ({'1':'1','1.5':'1','2.5':'1.5','4':'1.5','6':'2.5','10':'4','16':'6'})[String(size||'')]||'';}
  function markAuto(cert,path,reason){cert.autoMeta=isRecord(cert.autoMeta)?cert.autoMeta:{};cert.autoMeta[path]={reason,at:new Date().toISOString()};}
  function parseCableSpec(cert,rowIndex,raw){const text=String(raw||'').trim().replace(/[;,]+$/,'').replace(/\.(?=\s*$)/,''),row=cert.tables.circuits[rowIndex]||(cert.tables.circuits[rowIndex]={});const m=text.match(/\b(1(?:\.0)?|1\.5|2(?:\.5)?|4|6|10|16)\b/),size=m?String(Number(m[1])):'';const tne=/\b(twin\s*(?:and|&)\s*earth|t\s*&\s*e|twin earth)\b/i.test(text);if(size)row.liveCsa=size;if(tne)row.wiringType='Twin & earth (flat)';if(size&&tne){const c=tneCpc(size);if(c){row.cpcCsa=c;markAuto(cert,'circuit:'+rowIndex+':cpcCsa','Derived from standard flat twin & earth conductor pairing. Confirm actual cable construction.');}}if(!size)row.cableNotes=text;return !!text;}
  function inferRef(raw){const n=voiceNormalise(raw);if(/\bclipped direct\b/.test(n))return {v:'C',c:'high',why:'Clipped direct'};if(/\b(surface|on wall|masonry wall)\b/.test(n)&&/\b(trunking|conduit)\b/.test(n))return {v:'B',c:'high',why:'Surface conduit/trunking on a wall'};if(/\b(trunking|conduit|buried)\b/.test(n))return {v:'',c:'check',why:'Containment alone is not enough to determine the reference method.'};return {v:'',c:'none',why:''};}
  function normaliseStd(raw){const n=voiceNormalise(raw).replace(/\s/g,'');if(n.includes('61009'))return 'BS EN 61009-1';if(n.includes('60898'))return 'BS EN 60898-1';if(n.includes('61008'))return 'BS EN 61008-1';if(n.includes('60947'))return 'BS EN 60947-2';if(n.includes('bs88'))return 'BS 88-2';return String(raw||'').trim();}
  function coerceSite(d,raw){const text=String(raw||'').trim().replace(/[;,]+$/,'').replace(/\.(?=\s*$)/,''),n=voiceNormalise(text);if(!text)return {ok:false};if(/^(skip|blank|not recorded|leave blank)$/.test(n))return {ok:true,skip:true};if(/^(not applicable|n a|na)$/.test(n))return {ok:true,value:'N/A'};if(d.key==='ocpdBs'||d.key==='rcdBs')return {ok:true,value:normaliseStd(text)};
    if(d.key==='refMethod'){
      const compact=n.replace(/\s+/g,'');
      const map={a1:'A1',aone:'A1',a2:'A2',atwo:'A2',b:'B',bee:'B',c:'C',see:'C',d1:'D1',done:'D1',d2:'D2',dtwo:'D2',e:'E',f:'F',g:'G','100':'100','101':'101','102':'102','103':'103'};
      if(map[compact])return {ok:true,value:map[compact]};
    }
    if(d.key==='polarity'){if(/^(tick|pass|passed|yes|correct)$/.test(n))return {ok:true,value:'Pass'};if(/^(fail|failed|no|incorrect)$/.test(n))return {ok:true,value:'Fail'};}if(d.key==='ocpdType'){const m=n.match(/\btype\s+([bcd])\b/)||n.match(/\b([bcd])\b/);if(m)return {ok:true,value:m[1].toUpperCase()};}if(d.key==='rcdType'){const m=n.match(/\btype\s+(ac|a|f|b)\b/);if(m)return {ok:true,value:m[1].toUpperCase()};}if(['points','liveCsa','cpcCsa','ocpdRating','rcdIdn','irVoltage','irLL','irLE','r1r2','r2only','zs','rcdTime','zdb','ipf'].includes(d.key)){const num=spokenNumber(text),direct=text.match(/-?\d+(?:\.\d+)?/);if(num!==null)return {ok:true,value:num};if(direct)return {ok:true,value:direct[0]};}return {ok:true,value:text};}
  function setSiteValue(cert,d,raw){if(d.kind==='cable')return parseCableSpec(cert,d.row,raw);if(d.kind==='installation'){const r=cert.tables.circuits[d.row]||(cert.tables.circuits[d.row]={});r.installMethod=String(raw||'').trim().replace(/[;,]+$/,'').replace(/\.(?=\s*$)/,'');const x=inferRef(r.installMethod);if(x.v&&!r.refMethod){r.refMethod=x.v;markAuto(cert,'circuit:'+d.row+':refMethod','Reference Method '+x.v+' inferred from "'+String(raw).trim()+'". Confirm actual installation conditions.');}return true;}const p=coerceSite(d,raw);if(!p.ok)return false;if(p.skip)return true;rapidSetValue(cert,d,p.value);return true;}

  function sheetHeader(doc,p,no,type){const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();doc.setFillColor(7,17,31);doc.rect(0,0,w,22,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('SPERIN CERTIFICATES · SITE SHEET',14,9);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text('SPERIN SHEET '+p.id+' | PAGE '+no+' | '+type,14,16);doc.text('PLAN '+planSummary(p),w-14,16,{align:'right'});doc.setFillColor(0);[[4,4],[w-8,4],[4,h-8],[w-8,h-8]].forEach(q=>doc.rect(q[0],q[1],4,4,'F'));doc.setTextColor(20,28,38);}
  function generateSiteSheetPdf(p,cert){
    try{
      if(!window.SperinIetForms?.build) throw new Error('Certificate form renderer unavailable');
      const descs=buildSiteDescriptors(p,cert);
      p.descriptors=descs;
      const doc=window.SperinIetForms.build({cert,schema:SCHEMAS[p.type],settings,worksheet:true});
      p.pages=doc.getNumberOfPages();
      p.updatedAt=new Date().toISOString();
      updateStoredPlan(p);
      const name='Sperin-Site-Sheet-'+SCHEMAS[p.type].code+'-'+p.id+'.pdf';
      if(window.Android&&window.Android.savePdfBase64){
        window.Android.savePdfBase64(doc.output('datauristring'),name);
        toast('Site sheet PDF saved');
      }else{
        doc.save(name);
        toast('Site sheet PDF created');
      }
    }catch(err){
      console.error(err);
      alert('Site sheet PDF generation failed: '+(err?.message||err));
    }
  }

  function renderSiteBuilder(){let m=document.querySelector('.site-builder-backdrop');if(!m){m=document.createElement('div');m.className='modal-backdrop site-builder-backdrop';m.innerHTML='<div class="card modal site-builder-modal" data-modal><div data-site-builder-body></div></div>';document.body.appendChild(m);}const s=siteBuilderState,boards=s.type==='eic'||s.type==='eicr',templates=siteTemplates();m.querySelector('[data-site-builder-body]').innerHTML='<div class="profile-head"><div><div class="eyebrow">BLANK SITE SHEETS</div><h2>Build exactly the paper pack you need</h2><p>The whole certificate is included, with exactly the boards and circuit slots you choose.</p></div><button class="btn" data-action="site-builder-close">Close</button></div><section class="profile-section"><div class="settings-grid"><div class="field"><label>Certificate type</label><select data-site-builder="type">'+Object.entries(SCHEMAS).map(e=>'<option value="'+esc(e[0])+'" '+(s.type===e[0]?'selected':'')+'>'+esc(e[1].name)+'</option>').join('')+'</select></div><div class="field"><label>Template name (optional)</label><input data-site-builder="name" value="'+esc(s.name||'')+'"/></div></div></section>'+(boards?'<section class="profile-section"><div class="sheet-builder-title"><div><h3>Distribution boards / consumer units</h3><p class="profile-help">Set the exact number of circuit spaces to print.</p></div><button class="btn" data-action="site-board-add">+ Add board</button></div><div class="sheet-board-list">'+s.boards.map((b,i)=>'<div class="sheet-board-row"><div class="field"><label>Board reference</label><input data-site-board="'+i+'" data-site-board-key="ref" value="'+esc(b.ref)+'"/></div><div class="field"><label>Location</label><input data-site-board="'+i+'" data-site-board-key="location" value="'+esc(b.location||'')+'"/></div><div class="field"><label>Circuits to print</label><input type="number" min="1" max="72" data-site-board="'+i+'" data-site-board-key="circuits" value="'+esc(b.circuits)+'"/></div><button class="btn danger" data-action="site-board-remove" data-index="'+i+'" '+(s.boards.length===1?'disabled':'')+'>Remove</button></div>').join('')+'</div></section>':'<section class="profile-section"><p class="profile-help">The complete blank certificate will be generated.</p></section>')+(templates.length?'<section class="profile-section"><h3>Saved templates</h3><div class="sheet-template-list">'+templates.map(t=>'<button class="btn" data-action="site-template-load" data-template-id="'+esc(t.id)+'">'+esc(t.name)+'</button>').join('')+'</div></section>':'')+'<div class="profile-footer"><button class="btn" data-action="site-template-save">Save as template</button><button class="btn primary" data-action="site-generate">Create draft & download site PDF</button></div>';}
  function openSiteSheetBuilder(type='eic'){siteBuilderState={type:SCHEMAS[type]?type:'eic',name:'',boards:[{ref:'DB1',location:'',circuits:12}]};renderSiteBuilder();}
  function closeSiteBuilder(){document.querySelector('.site-builder-backdrop')?.remove();siteBuilderState=null;}
  function generateSiteSheetFromBuilder(){if(!siteBuilderState)return;const p=makeSitePlan(siteBuilderState.type,siteBuilderState.boards,siteBuilderState.name),cert=plannedCertificate(p);p.descriptors=buildSiteDescriptors(p,cert);updateStoredPlan(p);generateSiteSheetPdf(p,cert);closeSiteBuilder();render();toast('Blank site pack created and linked to a draft certificate');}
  function saveCurrentSheetTemplate(){if(!siteBuilderState)return;const name=String(siteBuilderState.name||'').trim()||((SCHEMAS[siteBuilderState.type]?.code||'CERT')+' site sheet'),item={id:uid(),name,type:siteBuilderState.type,boards:clone(siteBuilderState.boards||[]),createdAt:new Date().toISOString()},list=siteTemplates().filter(x=>x.name!==name);list.unshift(item);saveSiteTemplates(list);renderSiteBuilder();toast('Site sheet template saved');}
  function loadSheetTemplate(id){const t=siteTemplates().find(x=>x.id===id);if(!t)return;siteBuilderState={type:t.type,name:t.name,boards:clone(t.boards||[{ref:'DB1',circuits:12}])};renderSiteBuilder();}

  function planPicker(mode){const plans=sitePlans();if(!plans.length){alert('No site sheets exist yet. Create a blank site sheet first.');return;}const m=document.createElement('div');m.className='modal-backdrop sheet-picker-backdrop';m.innerHTML='<div class="card modal sheet-picker" data-modal><div class="profile-head"><div><div class="eyebrow">'+(mode==='read'?'VOICE READ-BACK':'PHOTO SCAN')+'</div><h2>Select the site sheet job</h2><p>Choose the pack you printed.</p></div><button class="btn" data-action="close-modal">Close</button></div><div class="sheet-plan-list">'+plans.map(p=>'<button class="sheet-plan-row" data-action="'+(mode==='read'?'site-read-plan':'site-scan-plan')+'" data-plan-id="'+esc(p.id)+'"><strong>'+esc(p.name||SCHEMAS[p.type]?.name||p.type)+'</strong><span>'+esc(p.id)+' · '+esc(planSummary(p))+'</span><em>›</em></button>').join('')+'</div></div>';document.body.appendChild(m);}
  function ensurePlan(p){const cert=plannedCertificate(p);if(!Array.isArray(p.descriptors)||!p.descriptors.length)p.descriptors=buildSiteDescriptors(p,cert);updateStoredPlan(p);return {p,cert};}
  function aliasesFor(d){return [...new Set([...(d.aliases||[]),d.label].filter(Boolean).map(x=>voiceNormalise(x)).filter(Boolean))].sort((a,b)=>b.length-a.length);}
  function openSheetRead(id){closeModal();const p=sitePlans().find(x=>x.id===id);if(!p)return;const x=ensurePlan(p);siteReadState={plan:x.p,cert:x.cert,cursor:0,listening:false,transcript:'',filled:0,issues:[]};renderSheetRead();}
  function parseSheetSpeech(text){if(!siteReadState)return {filled:0};const ds=siteReadState.plan.descriptors||[],n=voiceNormalise(text),matches=[];if(!n)return {filled:0};for(let i=0;i<ds.length;i++)for(const a of aliasesFor(ds[i])){const pos=n.indexOf(a);if(pos>=0)matches.push({pos,end:pos+a.length,i,a});}matches.sort((a,b)=>a.pos-b.pos||b.a.length-a.a.length);const chosen=[];for(const m of matches)if(!chosen.some(x=>m.pos>=x.pos&&m.pos<x.end))chosen.push(m);let filled=0;if(!chosen.length){const d=ds[siteReadState.cursor];if(d&&setSiteValue(siteReadState.cert,d,text)){filled++;siteReadState.cursor++;}}else chosen.forEach((m,j)=>{const d=ds[m.i],next=chosen[j+1];let v=n.slice(m.end,next?next.pos:n.length).replace(/^(is|equals|equal to|reading|value)\s+/,'').trim();if(v&&setSiteValue(siteReadState.cert,d,v)){filled++;siteReadState.cursor=Math.max(siteReadState.cursor,m.i+1);}});siteReadState.transcript+=(siteReadState.transcript?'\n':'')+String(text).trim();siteReadState.filled+=filled;saveNow();return {filled};}
  function renderSheetRead(){if(!siteReadState)return;let m=document.querySelector('.sheet-read-backdrop');if(!m){m=document.createElement('div');m.className='modal-backdrop sheet-read-backdrop';m.innerHTML='<div class="card modal sheet-read-modal" data-modal><div data-sheet-read-body></div></div>';document.body.appendChild(m);}const ds=siteReadState.plan.descriptors||[],d=ds[siteReadState.cursor];m.querySelector('[data-sheet-read-body]').innerHTML='<div class="profile-head"><div><div class="eyebrow">READ COMPLETED SITE SHEET</div><h2>'+esc(siteReadState.plan.name||SCHEMAS[siteReadState.plan.type].name)+'</h2><p>Read the printed heading, then its answer, from top to bottom. Say SKIP for an empty box.</p></div><button class="btn" data-action="sheet-read-close">Close</button></div><section class="sheet-read-progress"><div><strong>'+siteReadState.filled+'</strong><span>answers filled</span></div><div><strong>'+siteReadState.cursor+' / '+ds.length+'</strong><span>position</span></div></section>'+(d?'<section class="sheet-read-next"><span>Expected next</span><strong>'+esc(d.label)+'</strong><small>'+esc(d.section)+'</small></section>':'<section class="sheet-read-next done"><strong>Read-back complete</strong></section>')+'<section class="profile-section"><textarea class="sheet-read-transcript" data-sheet-read-text>'+esc(siteReadState.transcript)+'</textarea><div class="toolbar"><button class="btn primary" data-action="'+(siteReadState.listening?'sheet-read-stop':'sheet-read-start')+'">'+(siteReadState.listening?'■ Stop listening':'🎙 Start reading sheet')+'</button><button class="btn" data-action="sheet-read-process">Process typed text</button><button class="btn" data-action="sheet-read-open-cert">Open certificate</button></div></section><div class="note">Use field first, value second: “Zs, zero point three six. R1 plus R2, zero point two seven.” Values are never swapped to make them look plausible.</div>';}
  function sheetReadLoop(){if(!siteReadState?.listening)return;voiceAsk('Read site sheet',(text,error)=>{if(!siteReadState?.listening)return;if(text)parseSheetSpeech(text);if(error&&!/no speech|nothing/i.test(error))siteReadState.issues.push(error);renderSheetRead();if(siteReadState?.listening&&siteReadState.cursor<(siteReadState.plan.descriptors||[]).length)setTimeout(sheetReadLoop,300);else if(siteReadState){siteReadState.listening=false;renderSheetRead();}});}


  function openSheetScan(id){closeModal();const p=sitePlans().find(x=>x.id===id);if(!p)return;const x=ensurePlan(p);siteScanState={plan:x.p,cert:x.cert,pages:[],results:[],errors:[],pendingToken:''};renderSheetScan();}
  function renderSheetScan(){if(!siteScanState)return;let m=document.querySelector('.sheet-scan-backdrop');if(!m){m=document.createElement('div');m.className='modal-backdrop sheet-scan-backdrop';m.innerHTML='<div class="card modal sheet-scan-modal" data-modal><div data-sheet-scan-body></div></div>';document.body.appendChild(m);}const green=siteScanState.results.filter(r=>r.confidence==='high').length,check=siteScanState.results.filter(r=>r.confidence==='check'&&!r.accepted).length,missing=siteScanState.results.filter(r=>r.confidence==='missing').length;m.querySelector('[data-sheet-scan-body]').innerHTML='<div class="profile-head"><div><div class="eyebrow">SCAN COMPLETED SITE SHEETS</div><h2>'+esc(siteScanState.plan.name||SCHEMAS[siteScanState.plan.type].name)+'</h2><p>Photograph each page. Clear BLOCK CAPITALS and clear numbers give the best recognition.</p></div><button class="btn" data-action="sheet-scan-close">Close</button></div><section class="scan-controls"><button class="btn primary" data-action="sheet-scan-camera">📷 Take photo</button><label class="btn scan-files">🖼 Choose photos<input hidden type="file" accept="image/*" multiple data-sheet-scan-files></label><span>'+siteScanState.pages.length+' page'+(siteScanState.pages.length===1?'':'s')+' scanned</span></section>'+(siteScanState.results.length?'<section class="scan-summary"><span class="scan-green">✓ '+green+' clear</span><span class="scan-amber">⚠ '+check+' check</span><span class="scan-red">✕ '+missing+' unread</span></section><section class="scan-review-list">'+siteScanState.results.map((r,i)=>'<div class="scan-review-row '+r.confidence+'"><button class="scan-status" data-action="scan-accept" data-index="'+i+'">'+(r.confidence==='high'||r.accepted?'✓':'⚠')+'</button><div><strong>'+esc(r.label)+'</strong><small>'+esc(r.code)+' · '+esc(r.section||'')+'</small></div><input data-scan-value="'+i+'" value="'+esc(r.value||'')+'" placeholder="'+(r.confidence==='missing'?'Not read — type or speak it':'Recognised value')+'"/><button class="btn small" data-action="scan-speak" data-index="'+i+'">🎙</button></div>').join('')+'</section><div class="profile-footer"><button class="btn primary" data-action="scan-apply">Apply reviewed values to certificate</button></div>':'<section class="scan-empty"><div class="scan-page-illustration">▣</div><h3>Scan the first page</h3><p>The app uses the printed Sheet ID and field codes to match handwriting to exact fields. It does not guess unreadable values.</p></section>');}
  function nextScanToken(){return 'sheet-scan-'+(++siteScanSeq);}
  function queueScanFiles(files){
    if(!siteScanState)return;
    siteScanState.fileQueue=(siteScanState.fileQueue||[]).concat(files||[]);
    scanNextQueuedFile();
  }
  function scanNextQueuedFile(){
    if(!siteScanState||siteScanState.pendingToken||!siteScanState.fileQueue?.length)return;
    const file=siteScanState.fileQueue.shift();
    const reader=new FileReader();
    reader.onload=()=>scanImageData(String(reader.result||''));
    reader.onerror=()=>{siteScanState.errors.push('Could not read '+(file?.name||'photo'));scanNextQueuedFile();};
    reader.readAsDataURL(file);
  }
  function scanImageData(dataUrl){
    if(!siteScanState)return;
    if(!(window.Android&&typeof window.Android.scanSheetImageBase64==='function')){alert('On-device photo recognition is available in the Android app.');return;}
    const token=nextScanToken();siteScanState.pendingToken=token;toast('Reading site sheet…');
    try{window.Android.scanSheetImageBase64(token,dataUrl);}catch(err){siteScanState.pendingToken='';siteScanState.errors.push(err.message);renderSheetScan();scanNextQueuedFile();}
  }
  window.sperinSheetScanResult=function(token,json,error){
    if(window.SperinConsumerScan?.ocrResult(token,json,error))return;
    if(!siteScanState||String(token)!==String(siteScanState.pendingToken))return;
    siteScanState.pendingToken='';
    if(error){siteScanState.errors.push(String(error));alert('Could not read this photo: '+error);scanNextQueuedFile();return;}
    try{const data=typeof json==='string'?JSON.parse(json):json;siteScanState.pages.push(data);parseScannedPage(data);renderSheetScan();toast('Page read — review highlighted items');}
    catch(err){console.error(err);alert('The sheet was read but the result could not be processed safely.');}
    scanNextQueuedFile();
  };
  function pageNoFromText(t){const m=String(t||'').match(/PAGE\s+(\d+)/i);return m?Number(m[1]):null;}
  function replaceOnceCI(text,needle){const s=String(text||''),n=String(needle||'');const i=s.toLowerCase().indexOf(n.toLowerCase());return i<0?s:(s.slice(0,i)+' '+s.slice(i+n.length));}
  function stripOcrLabel(text,d){let v=replaceOnceCI(text,d.code);[d.label,...(d.aliases||[])].sort((a,b)=>String(b).length-String(a).length).forEach(l=>{v=replaceOnceCI(v,l);});return v.replace(/[_|:[\]{}]+/g,' ').replace(/\s+/g,' ').trim();}
  function extractMarkedChoice(d,line,lines){
    if(!line||!Array.isArray(d.options)||!d.options.length)return null;
    const cy=((line.top||0)+(line.bottom||0))/2,h=Math.max(10,(line.bottom||0)-(line.top||0));
    const nearby=lines.filter(x=>{
      const y=((x.top||0)+(x.bottom||0))/2;
      return Math.abs(y-cy)<=h*2.2;
    }).sort((a,b)=>(a.left||0)-(b.left||0));
    const text=' '+voiceNormalise(nearby.map(x=>x.text||'').join(' '))+' ';
    const hits=d.options.filter(option=>{
      const o=voiceNormalise(option);
      if(!o)return false;
      const escaped=o.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&').replace(/\s+/g,'\\s+');
      return new RegExp('(?:\\bx\\b\\s*(?:in\\s*)?(?:the\\s*)?'+escaped+'\\b|\\b'+escaped+'\\b\\s*\\bx\\b)','i').test(text);
    });
    if(hits.length===1)return {value:hits[0],confidence:'high'};
    if(hits.length>1)return {value:'',confidence:'check'};
    return null;
  }
  function extractOcrValue(d,lines,data){
    const code=String(d.code||'').toUpperCase();
    let line=code?lines.find(l=>String(l.text||'').toUpperCase().includes(code)):null;
    if(!line){
      const aliases=[d.label,...(d.aliases||[])].filter(Boolean).map(x=>voiceNormalise(x));
      line=lines.find(l=>{const n=voiceNormalise(l.text||'');return aliases.some(a=>a&&n.includes(a));});
    }
    if(line){
      const marked=extractMarkedChoice(d,line,lines);
      if(marked)return marked;
      let v=stripOcrLabel(line.text,d);
      if(v)return {value:v,confidence:'high'};
      const cy=((line.top||0)+(line.bottom||0))/2,h=Math.max(10,(line.bottom||0)-(line.top||0));
      const near=lines.filter(x=>x!==line).filter(x=>Math.abs((((x.top||0)+(x.bottom||0))/2)-cy)<=h*1.6).filter(x=>(x.left||0)>=(line.right||line.left||0)).sort((a,b)=>(a.left||0)-(b.left||0))[0];
      if(near){v=String(near.text||'').trim();if(v&&!/SPERIN SHEET|PLAN |PAGE |SCHEDULE OF/i.test(v))return {value:v,confidence:'check'};}
    }
    if(d.grid&&data?.width&&data?.height){
      const padX=.012,padY=.012;
      const candidates=lines.filter(l=>{
        const cx=(((l.left||0)+(l.right||0))/2)/data.width,cy=(((l.top||0)+(l.bottom||0))/2)/data.height;
        return cx>=d.grid.x1-padX&&cx<=d.grid.x2+padX&&cy>=d.grid.y1-padY&&cy<=d.grid.y2+padY;
      }).filter(l=>!/CIRCUIT DETAILS|TEST RESULTS|SPERIN|SCHEDULE OF/i.test(String(l.text||'')));
      if(candidates.length){
        const v=candidates.map(l=>String(l.text||'').trim()).filter(Boolean).join(' ').trim();
        if(v)return {value:v,confidence:'check'};
      }
    }
    return {value:'',confidence:'missing'};
  }
  function parseScannedPage(data){const full=String(data?.fullText||''),id=(full.match(/SPERIN\s+SHEET\s+([A-Z0-9-]+)/i)||[])[1];if(id&&id!==siteScanState.plan.id){siteScanState.errors.push('Wrong sheet '+id);alert('This page belongs to '+id+', not '+siteScanState.plan.id+'. Nothing was applied.');return;}const pn=pageNoFromText(full),lines=Array.isArray(data?.lines)?data.lines:[],ds=(siteScanState.plan.descriptors||[]);ds.forEach(d=>{const x=extractOcrValue(d,lines,data),row={...d,value:x.value,confidence:x.confidence,accepted:x.confidence==='high',page:pn||d.page||null},old=siteScanState.results.find(r=>r.code===d.code);if(old){if(old.confidence!=='high'||row.confidence==='high')Object.assign(old,row);}else siteScanState.results.push(row);});siteScanState.results.sort((a,b)=>(a.page||0)-(b.page||0)||String(a.code).localeCompare(String(b.code)));}
  function applyScanResults(){if(!siteScanState)return;let applied=0,skipped=0;siteScanState.results.forEach(r=>{const v=String(r.value||'').trim();if(!v||(r.confidence!=='high'&&!r.accepted)){skipped++;return;}if(setSiteValue(siteScanState.cert,r,v))applied++;else skipped++;});saveNow();const id=siteScanState.cert.id;document.querySelector('.sheet-scan-backdrop')?.remove();siteScanState=null;openCertificate(id);toast(applied+' scanned values applied; '+skipped+' left for review');}

  function warningForCircuit(cert,index,key){
    const row=cert.tables?.circuits?.[index]||{},test=cert.tables?.tests?.[index]||{},out=[],add=(keys,title,note,source)=>{if(keys.includes(key))out.push({title,note,source});};
    const z=parseFloat(test.zs),max=parseFloat(row.maxZs);if(Number.isFinite(z)&&Number.isFinite(max)&&z>max)add(['zs','maxZs'],'Zs exceeds configured maximum','Measured Zs '+z+' Ω is greater than the current maximum '+max+' Ω for the recorded protective-device data. Check the measurement and device details; the app will not alter the result.','BS 7671 ADS / maximum Zs check');
    for(const k of ['irLL','irLE']){const v=parseFloat(test[k]),volts=parseFloat(test.irVoltage);if(Number.isFinite(v)&&Number.isFinite(volts)){const limit=volts>=500?1:(volts===250?1:null);if(limit!==null&&v<limit)add([k,'irVoltage'],'Insulation resistance needs checking',v+' MΩ is below 1 MΩ at '+volts+' V. At 250 V, 0.5 MΩ is the Table 64 minimum for SELV/PELV, while a reduced 250 V test used because connected equipment cannot be disconnected still requires at least 1 MΩ. Confirm which test condition applies.','BS 7671 Table 64 / IET inspection & testing guidance');}}
    const rt=parseFloat(test.rcdTime);if(Number.isFinite(rt)&&rt>300)add(['rcdTime'],'RCD operating time needs checking',rt+' ms exceeds the 300 ms maximum used for the general non-delay RCD check. Verify whether a time-delayed device and different criteria apply.','BS 7671 Regs 643.7.1 / 643.8 guidance');if(['Fail','No','✕'].includes(String(test.polarity||'')))add(['polarity'],'Polarity test failed','Polarity is recorded as Fail. Check and rectify the circuit before issue.','BS 7671 verification of polarity');
    if(['Fail','No','✕'].includes(String(test.rcdButton||'')))add(['rcdButton'],'RCD functional test failed','The RCD test-button result is recorded as Fail. Check the protective device before issue.','BS 7671 RCD functional testing');
    if(['Fail','No','✕'].includes(String(test.afddButton||'')))add(['afddButton'],'AFDD functional test failed','The AFDD manual test result is recorded as Fail. Check the device before issue.','BS 7671 AFDD functional testing');
    if(/twin\s*(?:&|and)\s*earth/i.test(row.wiringType||'')){const expected=tneCpc(row.liveCsa);if(expected&&row.cpcCsa&&String(row.cpcCsa)!==String(expected))add(['liveCsa','cpcCsa','wiringType'],'Twin & earth conductor pairing needs checking','Configured standard T&E pairing for '+row.liveCsa+' mm² live conductors is '+expected+' mm² CPC; recorded CPC is '+row.cpcCsa+' mm². Confirm the actual cable construction.','Standard UK flat T&E conductor pairing');}
    const ref=inferRef(row.installMethod||'');if(ref.c==='high'&&row.refMethod&&row.refMethod!==ref.v)add(['installMethod','refMethod'],'Reference method mismatch','"'+row.installMethod+'" maps to Reference Method '+ref.v+' in the app’s high-confidence phrases, but '+row.refMethod+' is recorded. Confirm the actual installation conditions.','BS 7671 Appendix 4 reference-method logic');else if(ref.c==='check'&&!row.refMethod)add(['installMethod','refMethod'],'Reference method not safely determined',ref.why,'BS 7671 Appendix 4');
    return out;
  }
  function validationWarnings(cert){const list=[];(cert?.tables?.circuits||[]).forEach((r,i)=>{const seen=new Set();['zs','maxZs','irLL','irLE','irVoltage','rcdTime','polarity','rcdButton','afddButton','liveCsa','cpcCsa','wiringType','installMethod','refMethod'].forEach(k=>warningForCircuit(cert,i,k).forEach(w=>{const sig=i+'|'+w.title;if(!seen.has(sig)){seen.add(sig);list.push({...w,scope:'circuit',index:i,key:k,boardRef:r.boardRef||'DB1',circuitNo:r.circuitNo??String(i+1)});}}));});if(cert?.type==='eic')(cert.tables?.eicInspection||[]).forEach((r,i)=>{if(String(r.outcome||'')==='✕')list.push({scope:'table',index:i,key:'outcome',title:'EIC inspection item not satisfactory',note:'Inspection item '+(r.item||i+1)+' is marked not satisfactory. Review and rectify before issue.',source:'BS 7671 initial verification workflow'});});
    if(cert?.type==='eicr')(cert.tables?.eicrInspection||[]).forEach((r,i)=>{if(['C1','C2','FI'].includes(String(r.outcome||'')))list.push({scope:'table',index:i,key:'outcome',title:'EICR item requires attention',note:'Inspection item '+(r.item||i+1)+' is recorded '+r.outcome+'. Ensure the observation and classification are complete before issue.',source:'EICR classification workflow'});});return list;}
  // Review the stored model, including deferred fields inside closed/lazy sections.
  // Empty optional inputs are deliberately not treated as regulatory failures.
  function certificateReview(cert){
    const items=validationWarnings(cert).map(w=>({...w,key:w.scope==='circuit'?'circuit:'+(['zs','irLL','irLE','irVoltage','rcdTime','polarity','rcdButton','afddButton'].includes(w.key)?'tests':'details')+':'+w.index+':'+w.key:undefined,title:(w.scope==='circuit'?w.boardRef+' · Circuit '+w.circuitNo+' · ':'')+w.title}));
    const descriptors=rapidDescriptors(cert), byKey=new Map(descriptors.map(d=>[rapidDescriptorId(d),d]));
    for(const [key,later] of Object.entries(cert.voiceMeta?.later||{})){
      if(!later)continue;
      const d=byKey.get(key);
      items.push({title:'Deferred: '+(d?.label||key),note:d?.section||'Previously marked Review later',key,deferred:true,blocking:true});
    }
    const f=cert.fields||{},required=['installationAddress','premisesAddress'];
    if(cert.type==='minor'){const proxy={tables:{circuits:[f],tests:[f]}};const seen=new Set();for(const key of ['irLL','irLE','rcdTime','polarity','rcdButton','afddButton'])for(const w of warningForCircuit(proxy,0,key)){if(!seen.has(w.title)){seen.add(w.title);items.push({...w,key:'field:'+key});}}}
    if(cert.type==='eicr')required.push('overallAssessment','extentInspected');
    for(const key of required){
      const d=byKey.get('field:'+key);
      if(d&&!String(f[key]||'').trim())items.push({title:d.label+' is missing',note:'Needed to identify the installation or the report scope/result.',key:'field:'+key,blocking:true});
    }
    for(const d of descriptors){
      const raw=rapidGetValue(cert,d),v=String(raw??'').trim();
      if(!v||/^(N\/?A|N\/?V|LIM|not applicable|not tested|not verified)$/i.test(v)||!NUMERIC_INPUT_KEYS.has(d.key))continue;
      // Keep manual units, bounded instrument readings and supply-voltage pairs.
      if(!/^[<>≤≥]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*(?:MΩ|mohm|Ω|ohms?|ms|mA|A|V|Hz|kA|mm²|mm2|kVA)?$/i.test(v))
        items.push({title:d.label+' needs a value check',key:rapidDescriptorId(d),note:d.section+': “'+v+'”. Confirm the reading, units or an explicit limitation; this value was not assessed numerically.'});
    }
    if(cert.type==='eicr'&&f.overallAssessment==='Satisfactory'){
      const adverse=[...(cert.tables?.eicrInspection||[]),...(cert.tables?.observations||[])].some(r=>['C1','C2','FI'].includes(r.outcome||r.code||r.classification));
      if(adverse)items.push({title:'Overall assessment conflicts with findings',note:'C1, C2 or FI is recorded. Review the Satisfactory assessment and observation classifications.',blocking:true});
    }
    const circuits=cert.type==='minor'?[{row:f,test:f,label:'Minor works'}]:(cert.tables?.circuits||[]).map((row,i)=>({row,test:cert.tables?.tests?.[i]||{},label:(row.boardRef||'DB1')+' · Circuit '+(row.circuitNo||i+1)}));
    for(const {row,test,label} of circuits){
      if(String(test.zs||'').trim()&&!String(row.maxZs||'').trim())items.push({title:label+' · Zs comparison needs review',note:'A Zs reading is entered without a configured maximum. Check the protective measure, device data and applicable disconnection time; no numerical pass has been established.'});
      if((test.irLL||test.irLE)&&!test.irVoltage)items.push({title:label+' · Insulation test voltage missing',note:'Insulation resistance is entered. Record the test voltage or explain the limitation before assessing the result.'});
      if(['eic','minor'].includes(cert.type))for(const key of ['polarity','rcdButton','afddButton'])if(['Fail','No','✕'].includes(String(test[key]||'')))items.push({title:label+' · Failed '+key+' result',note:'Resolve the failed verification result before completing an installation certificate. You can download a draft record.',blocking:true});
    }
    if(cert.type==='eic'&&(cert.tables?.eicInspection||[]).some(r=>r.outcome==='✕'))items.push({title:'Unsatisfactory initial inspection',note:'Resolve the unsatisfactory inspection entries before completing the EIC.',blocking:true});
    return items;
  }
  function openReviewItem(key){
    const d=rapidDescriptors(getCurrent()).find(d=>rapidDescriptorId(d)===key);
    closeModal();if(!d){toast('Item has changed. Review its not-applicable status.');return;}
    view.circuitIndex=null;
    if(['circuits','tests'].includes(d.table)){view.circuitIndex=d.row;view.circuitStep=d.table==='tests'?'tests':'details';}
    render();
    requestAnimationFrame(()=>{
      const selector=d.kind==='field'?'[data-field="'+CSS.escape(d.key)+'"]':d.table==='circuits'||d.table==='tests'?'[data-circuit-input="'+(d.table==='tests'?'tests':'details')+'"][data-index="'+d.row+'"][data-col="'+CSS.escape(d.key)+'"]':'[data-table-input="'+CSS.escape(d.table)+'"][data-row="'+d.row+'"][data-col="'+CSS.escape(d.key)+'"]';
      const el=document.querySelector(selector);if(!el)return;
      for(let a=el.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;
      el.scrollIntoView({block:'center'});el.focus({preventScroll:true});
    });
  }
  function reviewFingerprint(cert){return JSON.stringify([cert.fields,cert.tables,cert.voiceMeta,cert.status]);}
  function openCertificateReview(finish=false){
    const cert=getCurrent();if(!cert)return;saveNow();
    document.querySelector('.certificate-review-backdrop')?.remove();
    const items=certificateReview(cert),blocked=items.some(x=>x.blocking);
    const m=document.createElement('div');m.className='modal-backdrop certificate-review-backdrop';m.dataset.fingerprint=reviewFingerprint(cert);
    m.innerHTML='<section class="card modal review-dialog" role="dialog" aria-modal="true" aria-label="Certificate review"><div class="review-heading"><h2>Certificate review</h2><button class="btn" data-action="close-modal">Back to certificate</button></div><p>Checks cover configured readings, recorded findings and deferred items. Empty optional boxes are allowed. Site inspection, applicable tests and professional judgement remain yours.</p><div class="review-items">'+(items.length?items.map(w=>'<article class="review-item"><strong>'+esc(w.title)+'</strong><p>'+esc(w.note)+'</p>'+(w.source?'<small>'+esc(w.source)+'</small>':'')+(w.key?'<button class="btn small" data-action="review-edit" data-key="'+esc(w.key)+'">Go to item</button>':'')+(w.deferred?'<button class="btn small" data-action="review-na" data-key="'+esc(w.key)+'" data-finish="'+finish+'">Not applicable · add reason</button>':'')+'</article>').join(''):'<article class="review-item"><strong>No configured issues found</strong><p>This is not a certificate of compliance or a complete standards audit.</p></article>')+'</div>'+ (finish?'<label class="review-confirm"><input type="checkbox" data-review-confirm> I have reviewed the applicable information, findings and limitations.</label><label>Review notes / reasons<textarea data-review-notes placeholder="Record any relevant explanation"></textarea></label><button class="btn primary" data-action="review-finish" '+(blocked?'disabled':'')+'>Complete and open PDF</button>':'')+'<p class="meta">'+(blocked?'Resolve missing essentials, contradictory findings and deferred items before completion. Draft PDF remains available.':'Checks do not cover every requirement of BS 7671, BS 5266 or BS 5839.')+'</p></section>';
    document.body.appendChild(m);
  }

  function warningButton(cert,index,key){return warningForCircuit(cert,index,key).length?'<button class="warning-button" type="button" data-action="warning-open" data-scope="circuit" data-index="'+index+'" data-key="'+esc(key)+'" aria-label="Review warning">⚠</button>':'';}
  function validationBanner(cert){const w=validationWarnings(cert);return w.length?'<button class="validation-banner warn" data-action="warnings-list"><span>⚠</span><div><strong>'+w.length+' item'+(w.length===1?'':'s')+' need checking</strong><small>Tap to see why. Recorded readings are never changed automatically.</small></div><em>›</em></button>':'<div class="validation-banner ok"><span>✓</span><div><strong>No configured technical warnings</strong><small>Still review the complete certificate before issue.</small></div></div>';}
  function openWarningModal(scope,index,key){const cert=getCurrent();if(!cert)return;const list=scope==='circuit'?warningForCircuit(cert,Number(index),key):validationWarnings(cert);const m=document.createElement('div');m.className='modal-backdrop warning-backdrop';m.innerHTML='<div class="card modal warning-modal" data-modal><div class="profile-head"><div><div class="eyebrow">⚠ TECHNICAL CHECK</div><h2>Review before issue</h2><p>Warnings never change your measured value.</p></div><button class="btn" data-action="close-modal">Close</button></div><div class="warning-list">'+list.map(w=>'<article><div class="warning-triangle">!</div><div><h3>'+esc(w.title)+'</h3><p>'+esc(w.note)+'</p><small>'+esc(w.source||'')+'</small></div></article>').join('')+'</div></div>';document.body.appendChild(m);}
  function siteWorkflowHome(){const plans=sitePlans();return '<section class="home-section site-workflow"><div class="home-section-head"><div><span class="eyebrow">FIELD WORKFLOW</span><h2>Paper, voice or camera — same certificate</h2></div><p>Generate the complete paper pack, fill it on site, then read it back or photograph it into the linked draft.</p></div><div class="workflow-actions"><button class="workflow-card" data-action="site-builder"><span>'+uiIcon('pdf')+'</span><div><strong>Blank Site Sheets</strong><small>Choose certificate, boards and circuit counts, then print.</small></div><em>›</em></button><button class="workflow-card" data-action="site-read"><span>'+uiIcon('mic')+'</span><div><strong>Read Completed Site Sheet</strong><small>Read printed headings and handwritten answers in the expected order.</small></div><em>›</em></button><button class="workflow-card" data-action="site-scan"><span>'+uiIcon('camera')+'</span><div><strong>Scan Completed Sheets</strong><small>Photograph clear block capitals/numbers and review uncertainty.</small></div><em>›</em></button></div>'+(plans.length?'<div class="recent-sheet-plans"><strong>Recent site packs</strong>'+plans.slice(0,3).map(p=>'<span>'+esc(p.name||SCHEMAS[p.type]?.code||p.type)+' · '+esc(p.id)+'</span>').join('')+'</div>':'')+'</section>';}

  let voiceSeq = 0;
  const voiceHandlers = new Map();
  let guidedVoiceState = null;

  let rapidState = null;

  function rapidDescriptors(cert) {
    if(!cert || !SCHEMAS[cert.type]) return [];
    const schema=SCHEMAS[cert.type];
    const result=[];
    schema.sections.forEach(part=>{
      if(part.type==='section'){
        part.fields.forEach(field=>{
          if(!fieldVisible(field,cert)) return;
          result.push({
            kind:'field',
            section:part.title,
            label:field.label,
            key:field.key,
            type:field.type||'text',
            options:field.options||[]
          });
        });
      } else if(part.type==='table'){
        const rows=Array.isArray(cert.tables?.[part.key]) ? cert.tables[part.key] : [];
        rows.forEach((row,ri)=>{
          part.columns.forEach(col=>{
            if(col.readonly) return;
            result.push({
              kind:'table',
              section:part.title,
              label:'Row '+(ri+1)+' · '+col.label,
              table:part.key,
              row:ri,
              key:col.key,
              type:col.type||'text',
              options:col.options||[]
            });
          });
        });
      }
    });
    return result.map((d,i)=>({...d,no:i+1}));
  }

  function rapidDescriptorId(d) {
    if(d.kind==='field') return 'field:'+d.key;
    if(d.table==='circuits') return 'circuit:details:'+d.row+':'+d.key;
    if(d.table==='tests') return 'circuit:tests:'+d.row+':'+d.key;
    return 'table:'+d.table+':'+d.row+':'+d.key;
  }

  function rapidGetValue(cert,d) {
    if(d.kind==='field') return cert.fields?.[d.key] ?? '';
    return cert.tables?.[d.table]?.[d.row]?.[d.key] ?? '';
  }

  function rapidSetValue(cert,d,value) {
    if(d.kind==='field'){
      cert.fields[d.key]=value;
      if(d.key==='certificateNo') cert.number=String(value||'');
      if(d.key==='nominalVoltage' && Array.isArray(cert.tables?.circuits)) cert.tables.circuits.forEach((_,i)=>recalculateCircuitZs(cert,i,true));
      if(d.key==='signatoryMode'||d.key.startsWith('singleSignatory')) syncSingleSignatory(cert);
    } else {
      cert.tables[d.table]=Array.isArray(cert.tables[d.table])?cert.tables[d.table]:[];
      while(cert.tables[d.table].length<=d.row) cert.tables[d.table].push({});
      if(!isRecord(cert.tables[d.table][d.row])) cert.tables[d.table][d.row]={};
      cert.tables[d.table][d.row][d.key]=value;
      if(d.table==='circuits'){
        syncCircuitRows(cert);
        if(d.key==='circuitNo') cert.tables.tests[d.row].circuitNo=String(value??'');
        if(['ocpdBs','ocpdType','ocpdRating'].includes(d.key)) recalculateCircuitZs(cert,d.row,true);
      }
    }
    const meta=ensureVoiceMeta(cert);
    const statusKey=rapidDescriptorId(d);
    delete meta.later[statusKey];
    delete meta.dismissed[statusKey];
    meta.completed[statusKey]=true;
  }

  function rapidCoerceValue(d,raw) {
    const text=String(raw||'').trim();
    if(!text) return {ok:false};
    const normalized=voiceNormalise(text);
    if(['later','come back later','skip','skip field'].includes(normalized)) return {ok:true,status:'later'};
    if(['dismiss','dismiss field','ignore','ignore field'].includes(normalized)) return {ok:true,status:'dismissed'};
    if(d.type==='checkbox'){
      if(/^(yes|true|on|tick|checked|pass)$/.test(normalized)) return {ok:true,value:true};
      if(/^(no|false|off|untick|unchecked|fail)$/.test(normalized)) return {ok:true,value:false};
      return {ok:false};
    }
    if(d.type==='date'){
      const date=parseSpokenDate(text);
      return date ? {ok:true,value:date} : {ok:false};
    }
    if(d.options?.length){
      const matched=matchVoiceOption(text,d.options);
      if(matched!==null) return {ok:true,value:matched};
      return {ok:false};
    }
    const numeric=/rating|amps?|voltage|zs|ohm|csa|mm²|milliamps?|breaking|capacity|time|points|resistance|r1|r2|rn|frequency|prospective|ka\b/i.test(d.label);
    const number=numeric ? spokenNumber(text) : null;
    return {ok:true,value:number!==null?number:text};
  }

  function rapidFirstUnfilled(cert,descs) {
    const meta=ensureVoiceMeta(cert);
    const found=descs.findIndex(d=>{
      const id=rapidDescriptorId(d);
      if(meta.completed[id]||meta.dismissed[id]) return false;
      const v=rapidGetValue(cert,d);
      return v===undefined||v===null||String(v).trim()==='';
    });
    return found<0 ? 0 : found;
  }

  function splitRapidTranscript(text) {
    return String(text||'')
      .split(/\b(?:next field|next question|next box|next item)\b/gi)
      .map(s=>s.replace(/^[,.;:\s]+|[,.;:\s]+$/g,'').trim())
      .filter(Boolean);
  }

  function processRapidTranscript(text) {
    const cert=getCurrent(); if(!cert||!rapidState) return {filled:0,failed:[]};
    const descs=rapidDescriptors(cert);
    const chunks=splitRapidTranscript(text);
    let filled=0;
    const failed=[];
    for(const chunk of chunks){
      if(rapidState.cursor>=descs.length) break;
      const d=descs[rapidState.cursor];
      const parsed=rapidCoerceValue(d,chunk);
      if(!parsed.ok){
        failed.push({no:d.no,label:d.label,text:chunk});
        break;
      }
      const id=rapidDescriptorId(d);
      if(parsed.status){
        setVoiceStatus(id,parsed.status);
      } else {
        rapidSetValue(cert,d,parsed.value);
        filled++;
      }
      rapidState.cursor++;
    }
    cert.rapidCursor=rapidState.cursor;
    saveNow();
    return {filled,failed};
  }

  function rapidCurrentSummary() {
    const cert=getCurrent(); if(!cert||!rapidState) return null;
    const descs=rapidDescriptors(cert);
    const current=descs[rapidState.cursor]||null;
    return {descs,current,total:descs.length};
  }

  function renderRapidEntry() {
    const cert=getCurrent(); if(!cert||!rapidState) return;
    let modal=document.querySelector('.rapid-backdrop');
    if(!modal){
      modal=document.createElement('div');
      modal.className='modal-backdrop rapid-backdrop';
      modal.innerHTML='<div class="card modal rapid-modal" data-modal><div data-rapid-body></div></div>';
      document.body.appendChild(modal);
    }
    const body=modal.querySelector('[data-rapid-body]');
    const info=rapidCurrentSummary();
    if(!info.current){
      body.innerHTML='<div class="rapid-head"><div><div class="eyebrow">Voice Fill</div><h2>Voice Fill complete</h2></div><button class="btn" data-action="rapid-close">Close</button></div><div class="note">You have reached the end of the current certificate fields. Review the certificate before completing it.</div><div class="toolbar" style="margin-top:14px"><button class="btn primary" data-action="rapid-start-top">Start again from top</button><button class="btn" data-action="rapid-sheet">Download site worksheet</button></div>';
      return;
    }
    const d=info.current;
    const upcoming=info.descs.slice(rapidState.cursor,rapidState.cursor+5);
    body.innerHTML='<div class="rapid-head"><div><div class="eyebrow">Voice Fill</div><h2>Speak answers into the certificate</h2><p>Say each answer, then say <strong>NEXT FIELD</strong>. Read several answers in one go.</p></div><button class="btn" data-action="rapid-close">Close</button></div>'+
      '<div class="rapid-progress"><strong>Field '+d.no+' of '+info.total+'</strong><span>'+esc(d.section)+'</span></div>'+
      '<div class="rapid-current"><div class="meta">Current field</div><strong>'+esc(d.label)+'</strong>'+(d.options?.length?'<div class="rapid-options">Choices: '+esc(d.options.join(' · '))+'</div>':'')+'</div>'+
      '<div class="rapid-upcoming"><div class="meta">Coming next</div>'+upcoming.map(x=>'<div><span>'+x.no+'</span> '+esc(x.label)+'</div>').join('')+'</div>'+
      '<textarea class="rapid-transcript" data-rapid-transcript placeholder="Your speech transcript appears here. You can also type or paste a read-back transcript."></textarea>'+
      '<div class="rapid-actions"><button class="voice-speak-big rapid-mic" data-action="rapid-listen">🎙 <span>Speak answers</span></button><button class="btn primary" data-action="rapid-process">Process transcript</button></div>'+
      '<div class="toolbar rapid-nav"><button class="btn" data-action="rapid-prev">← Previous field</button><button class="btn" data-action="rapid-later">Come back later</button><button class="btn danger" data-action="rapid-dismiss">Dismiss field</button></div>'+
      '<div class="toolbar rapid-secondary"><button class="btn" data-action="rapid-start-top">Start from top</button><button class="btn" data-action="rapid-sheet">Download site worksheet</button></div>'+
      '<div class="note">For a long read-back: speak “next field” between answers. If the phone stops listening, press Speak answers again and carry on from the field shown here.</div>';
  }

  function openRapidEntry(fromTop=false) {
    const cert=getCurrent(); if(!cert) return;
    const descs=rapidDescriptors(cert);
    const saved=Number(cert.rapidCursor);
    const cursor=fromTop ? 0 : (Number.isFinite(saved)&&saved>=0&&saved<descs.length ? saved : rapidFirstUnfilled(cert,descs));
    rapidState={cursor};
    renderRapidEntry();
  }

  function closeRapidEntry() {
    saveNow();
    rapidState=null;
    document.querySelector('.rapid-backdrop')?.remove();
    render();
  }

  function rapidListen() {
    if(!rapidState) return;
    if(!voiceSupported()){alert('Voice recognition is not available on this device. Allow microphone access and try again.');return;}
    const box=document.querySelector('[data-rapid-transcript]');
    if(box) box.value='Listening…';
    voiceAsk('Rapid dictation',function(text,error){
      if(!rapidState) return;
      const transcript=document.querySelector('[data-rapid-transcript]');
      if(error||!text){
        if(transcript) transcript.value='';
        toast(error||'Nothing heard');
        return;
      }
      if(transcript) transcript.value=text;
      const result=processRapidTranscript(text);
      toast(result.failed.length ? 'Stopped at a field that needs checking' : result.filled+' field'+(result.filled===1?'':'s')+' filled');
      renderRapidEntry();
    });
  }

  function downloadRapidSheet() {
    const cert=getCurrent(); if(!cert)return;
    try{
      if(!window.SperinIetForms?.build) throw new Error('Certificate form renderer unavailable');
      const doc=window.SperinIetForms.build({cert,schema:SCHEMAS[cert.type],settings,worksheet:true});
      const name='Sperin-Site-Worksheet-'+(cert.number||cert.type||'certificate').replace(/[^a-z0-9-_]+/gi,'-')+'.pdf';
      if(window.Android && typeof window.Android.savePdfBase64==='function'){
        window.Android.savePdfBase64(doc.output('datauristring'),name);
        toast('Site worksheet saved to Downloads');
      }else{
        doc.save(name);
        toast('Site worksheet created');
      }
    }catch(err){
      console.error(err);
      alert('Site worksheet generation failed: '+(err?.message||err));
    }
  }


  function voiceSupported() {
    return !!((window.Android && window.Android.speakAndListen) || window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function voiceNormalise(value) {
    return String(value || '').toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[–—-]/g, ' ')
      .replace(/[^a-z0-9.]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function spokenNumber(value) {
    const raw = voiceNormalise(value)
      .replace(/\b(amps?|amperes?|volts?|ohms?|milliohms?|megaohms?|megohms?|millimetres?|millimeters?|mm|kilowatts?|kw|milliamps?|ma|milliseconds?|ms|ka)\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
    if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
    const small={zero:0,oh:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19};
    const tens={twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
    const parts=raw.split(' ').filter(Boolean);
    if(!parts.length) return null;
    let total=0,current=0,decimal='',afterPoint=false,seen=false;
    for(const p of parts){
      if(p==='and') continue;
      if(p==='point'){afterPoint=true;seen=true;continue;}
      if(afterPoint){
        if(Object.prototype.hasOwnProperty.call(small,p) && small[p] < 10){decimal+=String(small[p]);seen=true;continue;}
        if(/^\d$/.test(p)){decimal+=p;seen=true;continue;}
        return null;
      }
      if(Object.prototype.hasOwnProperty.call(small,p)){current+=small[p];seen=true;continue;}
      if(Object.prototype.hasOwnProperty.call(tens,p)){current+=tens[p];seen=true;continue;}
      if(p==='hundred'){current=(current||1)*100;seen=true;continue;}
      if(p==='thousand'){total+=(current||1)*1000;current=0;seen=true;continue;}
      if(/^\d+$/.test(p)){current+=Number(p);seen=true;continue;}
      return null;
    }
    if(!seen) return null;
    const whole=total+current;
    return decimal ? String(whole)+'.'+decimal : String(whole);
  }

  function voiceOptions(el) {
    if(el.tagName==='SELECT') return Array.from(el.options).map(o=>o.value).filter(Boolean);
    const listId=el.getAttribute('list');
    if(listId){
      const list=document.getElementById(listId);
      if(list) return Array.from(list.querySelectorAll('option')).map(o=>o.value).filter(Boolean);
    }
    return [];
  }

  function matchVoiceOption(raw, options) {
    if(!options.length) return null;
    const n=voiceNormalise(raw);
    const aliases={
      'not applicable':'n a','na':'n a','n a':'n a',
      'pme':'tn c s pme','tncs':'tn c s','tn c s':'tn c s',
      'tns':'tn s','tn s':'tn s',
      'passed':'pass','failed':'fail','tick':'pass','correct':'pass'
    };
    const target=aliases[n]||n;
    const normalized=options.map(value=>({value:value,n:voiceNormalise(value)}));
    let hit=normalized.find(o=>o.n===target);
    if(hit) return hit.value;
    if(target.startsWith('type ')){
      const stripped=target.slice(5).trim();
      hit=normalized.find(o=>o.n===stripped || o.n.endsWith(' '+stripped));
      if(hit) return hit.value;
    }
    if(target==='yes'){
      hit=normalized.find(o=>o.n==='yes'||o.n==='pass'||o.value==='✓');
      if(hit) return hit.value;
    }
    if(target==='no'){
      hit=normalized.find(o=>o.n==='no'||o.n==='fail');
      if(hit) return hit.value;
    }
    if(target==='pass'){
      hit=normalized.find(o=>o.n==='pass'||o.value==='✓');
      if(hit) return hit.value;
    }
    if(target==='fail'){
      hit=normalized.find(o=>o.n==='fail');
      if(hit) return hit.value;
    }
    if(target==='n a'){
      hit=normalized.find(o=>o.n==='n a'||o.n==='na'||o.n==='not applicable');
      if(hit) return hit.value;
    }
    hit=normalized.find(o=>o.n.includes(target) || target.includes(o.n));
    return hit ? hit.value : null;
  }

  function voiceLabel(el) {
    const field=el.closest('.field');
    if(field){
      const labels=field.querySelectorAll('label');
      if(labels.length) return labels[0].textContent.trim();
    }
    const td=el.closest('td');
    const table=el.closest('table');
    if(td && table){
      const cells=Array.from(td.parentElement.children);
      const index=cells.indexOf(td);
      const th=table.querySelectorAll('thead th')[index];
      const section=table.closest('.form-section');
      const heading=section ? section.querySelector('h3') : null;
      return [heading && heading.textContent.trim(),th && th.textContent.trim()].filter(Boolean).join(', ');
    }
    return el.dataset.col || el.dataset.field || 'Field';
  }

  function voiceCurrentValue(el) {
    if(el.type==='checkbox') return el.checked ? 'Yes' : 'No';
    return String(el.value||'').trim();
  }

  function voiceQuestion(el) {
    const label=voiceLabel(el);
    const current=voiceCurrentValue(el);
    const opts=voiceOptions(el);
    let q=label+'?';
    if(current) q+=' Current answer is '+current+'. Say keep to leave it unchanged.';
    if(opts.length && opts.length<=7) q+=' Choices: '+opts.join(', ')+'.';
    q+=' You can also say skip, back, repeat, or stop.';
    return q;
  }

  function parseSpokenDate(raw) {
    const text=String(raw||'').trim();
    const slash=text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if(slash){
      const year=slash[3].length===2 ? '20'+slash[3] : slash[3];
      return year+'-'+String(slash[2]).padStart(2,'0')+'-'+String(slash[1]).padStart(2,'0');
    }
    const d=new Date(text);
    if(!Number.isNaN(d.getTime())) return d.toISOString().slice(0,10);
    return null;
  }

  function applyVoiceValue(el, raw, opts={}) {
    const text=String(raw||'').trim();
    const label=voiceLabel(el);
    if(el.type==='checkbox'){
      const n=voiceNormalise(text);
      if(/^(no|false|off|untick|unchecked)$/.test(n)) el.checked=false;
      else if(/^(yes|true|on|tick|checked|pass)$/.test(n)) el.checked=true;
      else return false;
    } else if(el.type==='date'){
      const parsed=parseSpokenDate(text);
      if(!parsed) return false;
      el.value=parsed;
    } else if(el.tagName==='SELECT'){
      const matched=matchVoiceOption(text,voiceOptions(el));
      if(!matched) return false;
      el.value=matched;
    } else {
      const opts=voiceOptions(el);
      const matched=matchVoiceOption(text,opts);
      if(matched) el.value=matched;
      else {
        const numeric=/rating|amps?|voltage|zs|ohm|csa|mm²|milliamps?|breaking|capacity|time|points|resistance|r1|r2|rn|frequency|prospective|ka\b/i.test(label);
        const number=numeric ? spokenNumber(text) : null;
        const isAddress=/address/i.test(label);
        const incoming=number!==null ? number : (isAddress ? formatSpokenAddress(text) : text);
        if(opts.appendLongText && el.tagName==='TEXTAREA' && String(el.value||'').trim()){
          const joiner=isAddress ? '\n' : ' ';
          el.value=String(el.value||'').trimEnd()+joiner+incoming;
        } else el.value=incoming;
      }
    }
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }

  function webListen(done) {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){done('','Speech recognition is not available on this device');return;}
    try{
      const r=new SR(); r.lang='en-GB'; r.interimResults=false; r.maxAlternatives=3;
      r.onresult=function(e){done((e.results&&e.results[0]&&e.results[0][0]&&e.results[0][0].transcript)||'','');};
      r.onerror=function(e){done('',e.error||'Speech recognition error');};
      r.start();
    }catch(err){done('',err.message||'Speech recognition error');}
  }

  function voiceAsk(prompt, done) {
    const token='voice-'+(++voiceSeq);
    voiceHandlers.set(token,done);
    if(window.Android && window.Android.listen){
      try{window.Android.listen(token);return;}catch(err){}
    }
    webListen(function(text,error){window.sperinVoiceResult(token,text,error);});
  }

  function voiceSay(text) {
    if(window.Android && window.Android.speak){ try{window.Android.speak(text);return;}catch(err){} }
    if('speechSynthesis' in window){
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.95;window.speechSynthesis.speak(u);
    }
  }

  window.sperinVoiceResult=function(token,text,error){
    const fn=voiceHandlers.get(String(token));
    if(!fn) return;
    voiceHandlers.delete(String(token));
    fn(String(text||''),String(error||''));
  };

  function guidedControls() {
    return Array.from(document.querySelectorAll('#app [data-field],#app [data-table-input],#app [data-circuit-input]'))
      .filter(el=>!el.disabled && !el.readOnly && el.type!=='hidden' && el.offsetParent!==null);
  }

  function ensureVoiceMeta(cert) {
    if(!cert) return {completed:{},later:{},dismissed:{}};
    cert.voiceMeta=cert.voiceMeta||{};
    cert.voiceMeta.completed=cert.voiceMeta.completed||{};
    cert.voiceMeta.later=cert.voiceMeta.later||{};
    cert.voiceMeta.dismissed=cert.voiceMeta.dismissed||{};
    return cert.voiceMeta;
  }

  function voiceControlKey(el) {
    if(!el) return '';
    if(el.dataset.field) return 'field:'+el.dataset.field;
    if(el.dataset.tableInput) return 'table:'+el.dataset.tableInput+':'+el.dataset.row+':'+el.dataset.col;
    if(el.dataset.circuitInput) return 'circuit:'+el.dataset.circuitInput+':'+el.dataset.index+':'+el.dataset.col;
    return '';
  }

  function controlByVoiceKey(key) {
    return guidedControls().find(el=>voiceControlKey(el)===key)||null;
  }

  function voiceStatusFor(key) {
    const meta=ensureVoiceMeta(getCurrent());
    if(meta.completed[key]) return 'done';
    if(meta.later[key]) return 'later';
    if(meta.dismissed[key]) return 'dismissed';
    return '';
  }

  function setVoiceStatus(key,status) {
    const cert=getCurrent(); if(!cert||!key) return;
    const meta=ensureVoiceMeta(cert);
    delete meta.completed[key]; delete meta.later[key]; delete meta.dismissed[key];
    if(status==='done') meta.completed[key]=true;
    if(status==='later') meta.later[key]=true;
    if(status==='dismissed') meta.dismissed[key]=true;
    persist();
    applyVoiceStatusClasses();
    refreshVoiceToolbar();
  }

  function markVoiceDone(el) {
    if(!el) return;
    const key=voiceControlKey(el); if(!key) return;
    if(el.type==='checkbox' || voiceCurrentValue(el)!=='') setVoiceStatus(key,'done');
    else {
      const meta=ensureVoiceMeta(getCurrent());
      delete meta.completed[key];
      persist();
      applyVoiceStatusClasses();
      refreshVoiceToolbar();
    }
  }

  function voiceSectionKey(el) {
    const section=el.closest('.form-section');
    if(section){
      const h=section.querySelector('h3');
      if(h) return h.textContent.trim();
    }
    return 'Current section';
  }

  function visibleLaterCount() {
    const meta=ensureVoiceMeta(getCurrent());
    return Object.keys(meta.later).filter(k=>meta.later[k]).length;
  }

  function applyVoiceStatusClasses() {
    const cert=getCurrent(); if(!cert) return;
    const meta=ensureVoiceMeta(cert);
    guidedControls().forEach(el=>{
      const key=voiceControlKey(el);
      const holder=el.closest('.field')||el.closest('td');
      if(!holder) return;
      holder.classList.remove('voice-done','voice-later','voice-dismissed');
      if(meta.completed[key]) holder.classList.add('voice-done');
      else if(meta.later[key]) holder.classList.add('voice-later');
      else if(meta.dismissed[key]) holder.classList.add('voice-dismissed');
    });
  }

  function refreshVoiceToolbar() {
    const count=visibleLaterCount();
    document.querySelectorAll('[data-action="voice-review-later"]').forEach(b=>{
      b.textContent='🟠 Review later ('+count+')';
      b.hidden=count===0;
    });
  }

  function assistantQueue(mode) {
    const meta=ensureVoiceMeta(getCurrent());
    return guidedControls()
      .map(el=>voiceControlKey(el))
      .filter(Boolean)
      .filter(key=>!meta.dismissed[key])
      .filter(key=>mode==='later' ? !!meta.later[key] : !meta.later[key] && !meta.completed[key]);
  }

  function assistantBatchFrom(queue,startIndex) {
    let firstIndex=-1, first=null;
    for(let i=Math.max(0,startIndex||0);i<queue.length;i++){
      const el=controlByVoiceKey(queue[i]);
      if(el){firstIndex=i;first=el;break;}
    }
    if(!first) return {keys:[],nextIndex:queue.length};
    const section=voiceSectionKey(first);
    const keys=[queue[firstIndex]];
    let i=firstIndex+1;
    for(;i<queue.length && keys.length<3;i++){
      const el=controlByVoiceKey(queue[i]);
      if(!el) continue;
      if(voiceSectionKey(el)!==section) break;
      keys.push(queue[i]);
    }
    return {keys,nextIndex:i,section};
  }

  function assistantControlHtml(el,key) {
    const label=voiceLabel(el);
    const options=voiceOptions(el);
    const value=voiceCurrentValue(el);
    const status=voiceStatusFor(key);
    const statusText=status==='done'?'Done':status==='later'?'Later':status==='dismissed'?'Dismissed':'To do';
    let input='';
    if(options.length){
      input='<select data-assist-value="'+esc(key)+'"><option value="">Select…</option>'+options.map(o=>'<option value="'+esc(o)+'" '+(String(o)===String(value)?'selected':'')+'>'+esc(o)+'</option>').join('')+'</select>';
    } else if(el.type==='checkbox') {
      input='<select data-assist-value="'+esc(key)+'"><option value="">Select…</option><option value="yes" '+(el.checked?'selected':'')+'>Yes</option><option value="no" '+(!el.checked&&status==='done'?'selected':'')+'>No</option></select>';
    } else {
      const type=el.type==='date'?'date':'text';
      input='<input data-assist-value="'+esc(key)+'" type="'+type+'" value="'+esc(value)+'" placeholder="Type or use Speak" />';
    }
    return '<div class="voice-assist-card '+(status?'status-'+status:'')+'" data-assist-card="'+esc(key)+'">'+
      '<div class="voice-assist-head"><div><div class="voice-assist-label">'+esc(label)+'</div><div class="meta">'+esc(voiceSectionKey(el))+'</div></div><span class="voice-status-chip">'+statusText+'</span></div>'+
      '<div class="voice-assist-entry">'+input+'<button class="voice-speak-big" type="button" data-action="voice-assist-speak" data-voice-key="'+esc(key)+'">🎙 <span>Speak</span></button></div>'+
      '<div class="voice-assist-actions"><button class="btn small" type="button" data-action="voice-later" data-voice-key="'+esc(key)+'">Come back later</button><button class="btn small danger" type="button" data-action="voice-dismiss" data-voice-key="'+esc(key)+'">Dismiss</button></div>'+
      '</div>';
  }

  function showVoicePanel() {
    let panel=document.querySelector('.voice-panel');
    if(panel) return panel;
    panel=document.createElement('div');
    panel.className='voice-panel voice-assistant';
    panel.innerHTML='<div class="voice-panel-top"><div><strong>🎙 Certificate assistant</strong><div class="meta" data-voice-progress></div></div><button class="btn small" data-action="voice-stop">Close</button></div><div data-voice-assistant-body></div>';
    document.body.appendChild(panel);
    return panel;
  }

  function stopGuidedVoice(message) {
    guidedVoiceState=null;
    if(window.Android && window.Android.stopVoice){try{window.Android.stopVoice();}catch(err){}}
    const panel=document.querySelector('.voice-panel');
    if(panel) panel.remove();
    persist();
    if(message) toast(message);
  }

  function renderAssistantPage() {
    if(!guidedVoiceState||!guidedVoiceState.active) return;
    const panel=showVoicePanel();
    const mode=guidedVoiceState.mode||'main';
    const queue=assistantQueue(mode);
    if(!guidedVoiceState.queue || guidedVoiceState.queueMode!==mode){
      guidedVoiceState.queue=queue.slice();
      guidedVoiceState.queueMode=mode;
      guidedVoiceState.cursor=0;
    } else {
      const meta=ensureVoiceMeta(getCurrent());
      guidedVoiceState.queue=guidedVoiceState.queue.filter(key=>{
        if(!controlByVoiceKey(key)) return false;
        if(mode==='later') return !!meta.later[key] && !meta.dismissed[key];
        return !meta.later[key] && !meta.completed[key] && !meta.dismissed[key];
      });
      guidedVoiceState.cursor=Math.min(guidedVoiceState.cursor||0,guidedVoiceState.queue.length);
    }
    const batch=assistantBatchFrom(guidedVoiceState.queue,guidedVoiceState.cursor||0);
    guidedVoiceState.currentKeys=batch.keys;
    guidedVoiceState.nextIndex=batch.nextIndex;
    const body=panel.querySelector('[data-voice-assistant-body]');
    const progress=panel.querySelector('[data-voice-progress]');
    if(!batch.keys.length){
      const later=visibleLaterCount();
      progress.textContent=mode==='later'?'Later items reviewed':'Main questions complete';
      body.innerHTML='<div class="voice-assist-summary"><strong>'+ (mode==='later'?'Review complete':'Main questions complete') +'</strong><p>'+ (later ? later+' item'+(later===1?'':'s')+' still flagged to fill in later.' : 'No items are waiting for later.') +'</p>'+
        (later && mode!=='later'?'<button class="btn primary" data-action="voice-review-later">Review later items now</button>':'')+
        '<button class="btn" data-action="voice-stop">Return to certificate</button></div>';
      return;
    }
    const section=batch.section||'Current section';
    const doneCount=Object.keys(ensureVoiceMeta(getCurrent()).completed).length;
    const laterCount=visibleLaterCount();
    progress.textContent=section+' · '+doneCount+' done · '+laterCount+' later';
    body.innerHTML='<div class="voice-assist-page"><div class="voice-assist-section">'+esc(section)+'</div>'+
      batch.keys.map(key=>{const el=controlByVoiceKey(key);return el?assistantControlHtml(el,key):'';}).join('')+
      '<div class="voice-page-nav"><button class="btn" data-action="voice-page-back">← Back</button><button class="btn primary voice-next-btn" data-action="voice-next">Next →</button></div></div>';
  }

  function assistantBack() {
    if(!guidedVoiceState||!guidedVoiceState.active) return;
    saveNow();
    guidedVoiceState.cursor=Math.max(0,(guidedVoiceState.cursor||0)-3);
    renderAssistantPage();
  }

  function assistantNext() {
    if(!guidedVoiceState||!guidedVoiceState.active) return;
    saveNow();
    const meta=ensureVoiceMeta(getCurrent());
    (guidedVoiceState.currentKeys||[]).forEach(key=>{
      const el=controlByVoiceKey(key);
      if(!el) return;
      if(!meta.completed[key]&&!meta.later[key]&&!meta.dismissed[key]){
        if(el.type==='checkbox' || voiceCurrentValue(el)!=='') setVoiceStatus(key,'done');
        else setVoiceStatus(key,'later');
      }
    });
    guidedVoiceState.cursor=guidedVoiceState.nextIndex||0;
    renderAssistantPage();
  }

  function startGuidedVoice(mode) {
    const controls=guidedControls();
    if(!controls.length){toast('No fillable fields on this page');return;}
    guidedVoiceState={active:true,mode:mode==='later'?'later':'main',cursor:0,queue:null,queueMode:null,currentKeys:[]};
    showVoicePanel();
    renderAssistantPage();
  }

  function startSingleVoice(el,after) {
    if(!el) return;
    if(!voiceSupported()){alert('Voice recognition is not available on this device. Allow microphone access and try again.');return;}
    const holder=el.closest('.field,td');
    if(holder && !document.querySelector('.voice-panel')) holder.scrollIntoView({behavior:'smooth',block:'center'});
    toast('Listening…');
    voiceAsk(voiceQuestion(el),function(text,error){
      if(error||!text){toast(error||'Nothing heard');return;}
      if(applyVoiceValue(el,text,{appendLongText:true})){
        markVoiceDone(el);
        const cert=getCurrent();
        if(cert && el.matches('[data-circuit-input="details"][data-col="circuitNo"]')){
          const oldIndex=Number(el.dataset.index);
          const activeCircuit=cert.tables?.circuits?.[oldIndex];
          const newIndex=activeCircuit ? sortCircuitsByNumber(cert,activeCircuit) : -1;
          if(view.circuitIndex!==null && newIndex>=0) view.circuitIndex=newIndex;
          saveNow(); render();
          toast('Circuit number saved and schedule sorted');
          if(typeof after==='function') after(text);
          return;
        }
        toast((el.tagName==='TEXTAREA' && String(el.value||'').trim()) ? voiceLabel(el)+' updated' : voiceLabel(el)+' completed');
        if(typeof after==='function') after(text);
      } else toast('Could not match that answer');
    });
  }

  function decorateVoiceUI() {
    const controls=document.querySelectorAll('#app [data-field],#app [data-table-input],#app [data-circuit-input]');
    controls.forEach(function(el){
      const key=voiceControlKey(el);
      if(key) el.dataset.voiceKey=key;
      if(el.dataset.voiceDecorated==='1') return;
      const holder=el.closest('.field,td');
      const existing=holder && holder.querySelector('.voice-mic');
      if(existing){el.dataset.voiceDecorated='1';return;}
      el.dataset.voiceDecorated='1';
      const mic=document.createElement('button');
      mic.type='button';mic.className='voice-mic';mic.dataset.action='voice-one';mic.innerHTML='<span>Speak</span>';mic.setAttribute('aria-label','Speak answer for '+voiceLabel(el));
      if(el.type==='checkbox'){
        const field=el.closest('.field');
        if(field) field.appendChild(mic);
      } else {
        const wrap=document.createElement('div');wrap.className='voice-control';
        el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);wrap.appendChild(mic);
      }
    });
    document.querySelectorAll('.form-head .actions').forEach(function(actions){
      if(!actions.querySelector('[data-action="voice-guide"]')){
        const b=document.createElement('button');b.type='button';b.className='btn voice-guide-btn';b.dataset.action='voice-guide';
        b.textContent=view.circuitIndex!==null ? 'Voice page' : 'Voice certificate';
        actions.insertBefore(b,actions.firstChild);
      }
      if(!actions.querySelector('[data-action="voice-review-later"]')){
        const later=document.createElement('button');later.type='button';later.className='btn voice-later-btn';later.dataset.action='voice-review-later';
        actions.insertBefore(later,actions.firstChild);
      }
    });
    applyVoiceStatusClasses();
    refreshVoiceToolbar();
  }

  window.sperinHandleBack=function(){
    if(window.SperinConsumerScan?.isOpen()){const diff=document.querySelector('.board-scan-diff');if(diff)diff.remove();else window.SperinConsumerScan.close();return true;}
    if(document.querySelector('.site-builder-backdrop')){closeSiteBuilder();return true;}
    if(document.querySelector('.sheet-read-backdrop')){if(siteReadState)siteReadState.listening=false;document.querySelector('.sheet-read-backdrop')?.remove();siteReadState=null;return true;}
    if(document.querySelector('.sheet-scan-backdrop')){document.querySelector('.sheet-scan-backdrop')?.remove();siteScanState=null;return true;}
    if(document.querySelector('.postcode-backdrop')){closeModal();return true;}
    if(document.querySelector('.rapid-backdrop')){closeRapidEntry();return true;}
    if(document.querySelector('.voice-panel')){stopGuidedVoice('');return true;}
    if(document.querySelector('.modal-backdrop')){closeModal();return true;}
    if(view.page==='form' && view.circuitIndex!==null){
      saveNow();
      if(view.circuitStep==='tests'){view.circuitStep='details';render();goTop();}
      else {view.circuitIndex=null;view.circuitStep='details';render();goCircuits();}
      return true;
    }
    if(view.page==='form'){saveNow();view={page:'home',currentId:null,circuitIndex:null,circuitStep:'details'};render();goTop();return true;}
    return false;
  };

  document.addEventListener('focusin',e=>{if(e.target.matches('[data-field],[data-board-input],[data-circuit-input],[data-table-input]')) pushEditHistory();});

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest('.combo-arrow,.combo-option')){e.preventDefault();document.activeElement?.blur();}
    if(!e.target.closest('.combo-field'))document.querySelectorAll('.combo-field').forEach(c=>{c.querySelector('.combo-menu').hidden=true;c.querySelectorAll('[aria-expanded]').forEach(el=>el.setAttribute('aria-expanded','false'));});
  });
  document.addEventListener('keydown',e=>{
    const combo=e.target.closest('.combo-field');if(!combo)return;
    const menu=combo.querySelector('.combo-menu');
    if(e.key==='Escape'){menu.hidden=true;combo.querySelectorAll('[aria-expanded]').forEach(el=>el.setAttribute('aria-expanded','false'));}
    if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();menu.hidden=false;combo.querySelectorAll('[aria-expanded]').forEach(el=>el.setAttribute('aria-expanded','true'));const options=[...menu.querySelectorAll('button')],i=options.indexOf(document.activeElement);options[(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus();}
  });

  document.addEventListener('input', e => {
    const cert = getCurrent();
    if (e.target.matches('[data-field]') && cert) {
      const key=e.target.dataset.field;
      const previousValue=cert.fields[key];
      cert.fields[key]=e.target.type==='checkbox' ? e.target.checked : e.target.value;
      if(key==='certificateNo') cert.number=e.target.value;
      if(key==='nominalVoltage' && previousValue!==cert.fields[key] && Array.isArray(cert.tables?.circuits)){
        cert.tables.circuits.forEach((_,i)=>{
          const row=cert.tables.circuits[i];
          recalculateCircuitZs(cert,i,true);
        });
      }
      if(key==='signatoryMode'||key.startsWith('singleSignatory')) syncSingleSignatory(cert);
      scheduleAutosave();
    }
    if (e.target.matches('[data-table-input]') && cert) {
      const { tableInput, row, col } = e.target.dataset; const ri = Number(row);
      if (!cert.tables[tableInput]) cert.tables[tableInput] = [];
      if (!cert.tables[tableInput][ri]) cert.tables[tableInput][ri] = {};
      cert.tables[tableInput][ri][col] = e.target.value; scheduleAutosave();
    }
    if(e.target.matches('[data-board-input]')&&cert){
      const bi=Number(e.target.dataset.boardIndex),key=e.target.dataset.boardInput;
      const board=cert.tables?.boards?.[bi];
      if(board && !['ref','feedSourceType','sourceBoardRef','sourceCircuitNo'].includes(key)){
        board[key]=e.target.value;
        if(bi===0) syncPrimaryBoardLegacyFields(cert);
        scheduleAutosave();
      }
    }
    if(e.target.matches('[data-circuit-input]')&&cert){
      const scope=e.target.dataset.circuitInput, i=Number(e.target.dataset.index), col=e.target.dataset.col;
      syncCircuitRows(cert);
      const target=scope==='details'?cert.tables.circuits[i]:cert.tables.tests[i];
      if(scope==='details' && col==='circuitNo'){
        const next=e.target.value;
        if(next!=='' && cert.tables.circuits.some((r,j)=>j!==i&&normaliseBoardKey(r.boardRef)===normaliseBoardKey(target.boardRef)&&String(r.circuitNo??'')===next)){e.target.setCustomValidity('Circuit number already exists on this board');return;}
        e.target.setCustomValidity('');
        if(target._incomingFeed){e.target.value='0';return;}
        cert.tables.boards.forEach(b=>{if(normaliseBoardKey(b.sourceBoardRef)===normaliseBoardKey(target.boardRef)&&String(b.sourceCircuitNo??'')===String(target.circuitNo??''))b.sourceCircuitNo=next;});
      }
      const previousValue=target[col];
      target[col]=e.target.value;
      if(scope==='details'){
        if(col==='maxZs'){
          target.maxZsManual=true;
        }
        if(['ocpdBs','ocpdType','ocpdRating'].includes(col) && previousValue!==target[col]){
          target.maxZsManual=false;
          recalculateCircuitZs(cert,i,true);
          const maxInput=document.querySelector('[data-circuit-input="details"][data-index="'+i+'"][data-col="maxZs"]');
          if(maxInput) maxInput.value=target.maxZs||'';
        }
        if(col==='deviceKind' && previousValue!==target[col]){
          const suggestions={MCB:{ocpdBs:'BS EN 60898-1'},RCBO:{ocpdBs:'BS EN 61009-1',rcdBs:'BS EN 61009-1'},
            RCD:{rcdBs:'BS EN 61008-1'},RCCB:{rcdBs:'BS EN 61008-1'}};
          for(const [key,value] of Object.entries(suggestions[target.deviceKind]||{})){
            if(!target[key]){
              target[key]=value;
              cert.autoMeta ||= {};
              cert.autoMeta['circuit:'+i+':'+key]={source:'device-type-suggestion',note:'Verify actual device marking'};
              const input=document.querySelector('[data-circuit-input="details"][data-index="'+i+'"][data-col="'+key+'"]');
              if(input)input.value=value;
            }
          }
        }
        if(col==='circuitNo') cert.tables.tests[i].circuitNo=e.target.value;
        if(col==='boardRef') cert.tables.tests[i].boardRef=e.target.value;
      }
      syncDependentBoardFeeds(cert,target.boardRef||cert.tables.circuits[i]?.boardRef,target.circuitNo??cert.tables.circuits[i]?.circuitNo);
      scheduleAutosave();
    }
    if (e.target.matches('[data-setting]')) { /* Profile changes commit only when Save profile is pressed. */ }
    if(e.target.matches('[data-site-builder]') && siteBuilderState){
      const key=e.target.dataset.siteBuilder;
      siteBuilderState[key]=e.target.value;
    }
    if(e.target.matches('[data-site-board]') && siteBuilderState){
      const i=Number(e.target.dataset.siteBoard),key=e.target.dataset.siteBoardKey;
      if(siteBuilderState.boards[i]) siteBuilderState.boards[i][key]=key==='circuits'?Math.max(1,Math.min(72,parseInt(e.target.value,10)||1)):e.target.value;
    }
    if(e.target.matches('[data-scan-value]') && siteScanState){
      const i=Number(e.target.dataset.scanValue),r=siteScanState.results[i];
      if(r){r.value=e.target.value;if(String(e.target.value).trim()){r.accepted=true;if(r.confidence==='missing')r.confidence='check';}}
    }
    if (e.target.matches('[data-field],[data-table-input],[data-circuit-input],[data-board-input]')) markVoiceDone(e.target);
  });


  // Certificate View edits the same objects and autosave queue as Quick Entry.
  // An approved photographed test-button appearance is not an RCD functional test.
  const cvAllowedScopes=new Set(['field','board','circuit','test','table']);
  function saveCertificateViewValue(el){
    if(!el.matches('[data-cv-scope]'))return;
    const cert=getCurrent();if(!cert)return;
    const scope=el.dataset.cvScope,key=el.dataset.cvKey,i=Number(el.dataset.cvIndex),table=el.dataset.cvTable||'';
    if(!cvAllowedScopes.has(scope)||!key)return;
    let dest=scope==='field'?cert.fields:
      scope==='board'?cert.tables?.boards?.[i]:
      scope==='circuit'?cert.tables?.circuits?.[i]:
      scope==='test'?cert.tables?.tests?.[i]:
      cert.tables?.[table]?.[i];
    if(!dest||!Object.prototype.hasOwnProperty.call(dest,key) &&
      scope==='table' && !SCHEMAS[cert.type]?.sections?.some(p=>p.key===table&&p.columns?.some(c=>c.key===key)))return;
    let value=el.type==='checkbox'?el.checked:el.value;
    if(scope==='circuit'&&key==='circuitNo'&&cert.tables.circuits.some((r,j)=>j!==i&&r.boardRef===dest.boardRef&&String(r.circuitNo)===String(value))){
      el.setCustomValidity('Circuit number already exists on this consumer unit');el.reportValidity();return;
    }
    el.setCustomValidity?.('');
    const old=dest[key];
    if(old===value)return;
    dest[key]=value;
    if(scope==='circuit'&&key==='circuitNo'&&cert.tables.tests[i])cert.tables.tests[i].circuitNo=value;
    if(scope==='circuit'&&key==='deviceKind'){
      const proposed={MCB:{ocpdBs:'BS EN 60898-1'},RCBO:{ocpdBs:'BS EN 61009-1',rcdBs:'BS EN 61009-1'},RCD:{rcdBs:'BS EN 61008-1'},RCCB:{rcdBs:'BS EN 61008-1'}};
      for(const [k,v] of Object.entries(proposed[value]||{})){
        if(!dest[k]){dest[k]=v;(cert.autoMeta||={})['circuit:'+i+':'+k]={source:'device-type-suggestion',note:'Verify actual marking before issue'};}
      }
    }
    if(scope==='board'&&i===0)syncPrimaryBoardLegacyFields(cert);
    scheduleAutosave();
    if(scope==='circuit'&&key==='refMethod'){const hint=el.closest('.cv-field')?.querySelector('small');if(hint)hint.textContent=refMethodDescription(value);}
  }
  document.addEventListener('focusin',e=>{
    if(e.target.matches?.('[data-cv-scope]'))pushEditHistory('Edit certificate field');
  });
  document.addEventListener('input',e=>saveCertificateViewValue(e.target));
  document.addEventListener('change',e=>{
    if(!e.target.matches?.('[data-cv-scope]'))return;
    saveCertificateViewValue(e.target);
    if(e.target.dataset.cvScope==='circuit'&&e.target.dataset.cvKey==='circuitNo'){
      const cert=getCurrent(),r=cert?.tables?.circuits?.[Number(e.target.dataset.cvIndex)];
      if(cert&&r)sortCircuitsByNumber(cert,r);
    }
    saveNow();
  });
  document.addEventListener('focusout',e=>{
    if(e.target.matches?.('[data-cv-scope]'))saveNow();
  });

  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches('[data-sign-pdf]')){
      const c=getCurrent();if(!c)return;
      if(el.checked){
        if(!settings.reportSignature){el.checked=false;alert('Upload your signature in Profile → Customer report branding first.');return;}
        if(!confirm('Confirm this is your own signature, you approve its use on this certificate and you have independently verified the information?')){el.checked=false;return;}
        c.signatureApprovedAt=new Date().toISOString();c.signatureApprovedBy=settings.engineerName||'Authorised electrician';
      }else{delete c.signatureApprovedAt;delete c.signatureApprovedBy;}
      saveNow();
    }
    if(el.matches('[data-report-image]')&&el.files?.[0]){
      const file=el.files[0],kind=el.dataset.reportImage;
      if(!['image/png','image/jpeg','image/webp','image/bmp'].includes(file.type)||file.size>8*1024*1024){
        alert('Choose PNG, JPEG, WebP or BMP up to 8 MB.');el.value='';return;
      }
      const url=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{
        try{
          if(img.width<1||img.height<1||img.width*img.height>50000000)throw Error('Unsupported image dimensions');
          let scale=Math.min(1,900/Math.max(img.width,img.height)),data='';
          for(let i=0;i<7;i++){
            const canvas=document.createElement('canvas');
            canvas.width=Math.max(1,Math.floor(img.width*scale));canvas.height=Math.max(1,Math.floor(img.height*scale));
            const ctx=canvas.getContext('2d');
            ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img,0,0,canvas.width,canvas.height);
            data=canvas.toDataURL('image/jpeg',0.82);
            if(data.length<=790000)break;
            scale*=0.75;
          }
          if(data.length>790000)throw Error('Cannot reduce image enough');
          settings[kind]=data;saveSettings();toast((kind==='reportLogo'?'Logo':'Signature')+' saved');
        }catch(err){alert('Image cannot be used: '+err.message);}
        finally{URL.revokeObjectURL(url);el.value='';}
      };
      img.onerror=()=>{URL.revokeObjectURL(url);el.value='';alert('Could not open image. Convert to JPEG or PNG first.');};
      img.src=url;
    }
  });
  document.addEventListener('change', e => {
    const cert=getCurrent();
    if(e.target.matches('[data-board-input]') && cert){changeBoardInput(cert,e.target);return;}
    if(e.target.matches('[data-site-builder="type"]') && siteBuilderState){
      if((siteBuilderState.type==='eic'||siteBuilderState.type==='eicr')&&!siteBuilderState.boards.length) siteBuilderState.boards=[{ref:'DB1',location:'',circuits:12}];
      renderSiteBuilder();
      return;
    }
    if(e.target.matches('[data-sheet-scan-files]') && siteScanState){
      queueScanFiles(Array.from(e.target.files||[]));
      e.target.value='';
      return;
    }
    if (e.target.matches('[data-field],[data-table-input],[data-circuit-input]')) {
      const circuitNumberEdit=e.target.matches('[data-circuit-input="details"][data-col="circuitNo"]');
      const oldIndex=circuitNumberEdit ? Number(e.target.dataset.index) : -1;
      const activeCircuit=circuitNumberEdit ? cert?.tables?.circuits?.[oldIndex] : null;
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
      if(circuitNumberEdit && cert && activeCircuit){
        const newIndex=sortCircuitsByNumber(cert,activeCircuit);
        if(view.circuitIndex!==null && newIndex>=0) view.circuitIndex=newIndex;
        saveNow();
        const y=window.scrollY; render(); requestAnimationFrame(()=>window.scrollTo(0,y));
        toast('Circuits sorted by circuit number');
        return;
      }
      saveNow();
      if(e.target.matches('[data-field="signatoryMode"]')){
        const y=window.scrollY; render(); requestAnimationFrame(()=>window.scrollTo(0,y));
      }
    }
  });

  document.addEventListener('focusout', e => {
    if(e.target.matches?.('[data-field],[data-table-input],[data-circuit-input],[data-setting]')) saveNow();
  });

  document.addEventListener('change', e => {
    if(!e.target.matches('[data-assist-value]')) return;
    const key=e.target.dataset.assistValue;
    const el=controlByVoiceKey(key); if(!el) return;
    if(el.type==='checkbox'){
      if(e.target.value==='yes') el.checked=true;
      else if(e.target.value==='no') el.checked=false;
      else return;
    } else {
      el.value=e.target.value;
    }
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    markVoiceDone(el);
    renderAssistantPage();
  });

  document.addEventListener('input',e=>{
    if(e.target.matches('[data-library-search]')){
      librarySearch=e.target.value;
      const cursor=e.target.selectionStart;
      render();
      const box=document.querySelector('[data-library-search]');box?.focus();
      try{box?.setSelectionRange(cursor,cursor);}catch{}
    }
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-library-status]')){libraryStatus=e.target.value;render();}
    if(e.target.matches('[data-library-sort]')){librarySort=e.target.value;render();}
  });
  document.addEventListener('toggle',e=>{
    const node=e.target;
    if(node instanceof HTMLElement&&node.matches('details.inline-circuit')&&node.open)populateInlineCircuit(node);
  },true);
  document.addEventListener('keydown', e => {
    const card=e.target.closest?.('.saved-cert-row[data-action="edit"]');
    if(!card || e.target.closest('button,input,select,textarea')) return;
    if(e.key==='Enter' || e.key===' '){e.preventDefault();openCertificate(card.dataset.id);}
  });

  // Update the plain-language hint immediately, without a rerender or data mutation.
  for(const eventName of ['input','change'])document.addEventListener(eventName,e=>{
    const input=e.target;
    if(!input.matches?.('[data-circuit-input][data-col="refMethod"],[data-field="referenceMethod"],[data-field="refMethod"],[data-table-input][data-col="refMethod"]'))return;
    const hint=input.closest('.field,.table-voice')?.querySelector('[data-ref-method-hint]');
    if(hint)hint.textContent=refMethodDescription(input.value);
  });
  document.addEventListener('click',e=>{
    const summary=e.target.closest('.cert-accordion-head,.cu-summary');
    if(!summary)return;
    const current=summary.closest('details[data-accordion-key]');
    if(!current||current.open)return;
    const group=summary.matches('.cu-summary')?'cu-accordion':'cert-accordion';
    document.querySelectorAll('#app details.'+group+'[open]').forEach(other=>{
      if(other!==current)other.open=false;
    });
  });
  document.addEventListener('click', e => {
    const button = e.target.closest('[data-action]'); if (!button) return;
    if(button.classList.contains('modal-backdrop') && e.target.closest('[data-modal]')) return;
    const action = button.dataset.action;
    const cert=getCurrent();
    if(cert && ['row-add','row-delete','inspection-outcome','inspection-bulk','bonding-toggle','signatory-mode','copy-client-installation','postcode-select'].includes(action))pushEditHistory();
    if(action==='cv-keyboard'){const input=button.closest('.cv-field')?.querySelector('input');if(input){input.inputMode=input.inputMode==='decimal'?'text':'decimal';button.textContent=input.inputMode==='decimal'?'ABC':'123';input.focus();}}
    else if(action==='choose-entry'){chooseEntry(button.dataset.mode);}
    else if(action==='switch-entry'){chooseEntry(editMode==='quick'?'certificate':'quick');}
    else if(action==='cv-pages'){window.SperinCertificateView?.togglePages();refreshCertificateView();}
    else if(action==='cv-select-page'){window.SperinCertificateView?.switchPage(button.dataset.cvPage);refreshCertificateView();}
    else if(action==='cv-page-next'){window.SperinCertificateView?.switchPage(window.SperinCertificateView.state.page+1);refreshCertificateView();}
    else if(action==='cv-page-prev'){window.SperinCertificateView?.switchPage(window.SperinCertificateView.state.page-1);refreshCertificateView();}
    else if(action==='cv-zoom-in'){window.SperinCertificateView?.setZoom(window.SperinCertificateView.state.zoom+.15);}
    else if(action==='cv-zoom-out'){window.SperinCertificateView?.setZoom(window.SperinCertificateView.state.zoom-.15);}
    else if(action==='cv-fit'){window.SperinCertificateView?.fit();}
    else if(action==='cv-reset'){const p=document.querySelector('.cv-viewport');if(p){p.scrollTop=0;p.scrollLeft=0;}window.SperinCertificateView?.setZoom(1);}
    else if(action==='cv-next-empty'){window.SperinCertificateView?.nextEmpty();}
    else if(action==='cv-circuit-list'&&cert){editMode='quick';view.circuitIndex=null;openBoardAccordion(button.dataset.boardRef);render();goCircuits();}
    else if(action==='open-new'){screen('new');}
    else if(action==='open-library'){screen('library');}
    else if(action==='open-tools') window.SperinSpeedSuite?.more?.();
    else if(action==='certificate-review') openCertificateReview(false);
    else if(action==='review-finish'){const m=document.querySelector('.certificate-review-backdrop');if(!m?.querySelector('[data-review-confirm]')?.checked)return toast('Confirm your review first');if(m.dataset.fingerprint!==reviewFingerprint(getCurrent())){openCertificateReview(true);toast('Certificate changed. Review the latest information.');return;}const issues=certificateReview(getCurrent());if(issues.some(x=>x.blocking))return openCertificateReview(true);getCurrent().reviewRecord={at:new Date().toISOString(),notes:m.querySelector('[data-review-notes]').value,items:issues};m.remove();completeAndCreatePdf(true);}
    else if(action==='review-edit') openReviewItem(button.dataset.key);
    else if(action==='review-na'){const key=button.dataset.key;const reason=prompt('Why is this deferred item not applicable?');if(reason?.trim()){const c=getCurrent();c.reviewNotApplicable=c.reviewNotApplicable||{};c.reviewNotApplicable[key]={reason:reason.trim(),at:new Date().toISOString()};setVoiceStatus(key,'dismissed');saveNow();openCertificateReview(button.dataset.finish==='true');}}
    else if(action==='speed-quick') window.SperinSpeedSuite?.quick?.();
    else if(action==='speed-bulk') window.SperinSpeedSuite?.bulk?.();
    else if(action==='speed-convert') window.SperinSpeedSuite?.convert?.();
    else if(action==='speed-bluetooth') window.SperinSpeedSuite?.bluetooth?.();
    else if(action==='job-evidence') window.SperinJobCentre?.showRef?.(({certificates:()=>state.certificates,current:()=>getCurrent(),schema:type=>SCHEMAS[type],settings:()=>settings,engineer:()=>settings.engineerName||'Unspecified engineer',attach:(id,jobId)=>{const c=state.certificates.find(x=>x.id===id);if(c){c.jobId=jobId;persist();render();}},navigate:id=>openCertificate(id)}),cert?.jobId||'',button.dataset.ref);
    else if(action==='jobs') window.SperinJobCentre?.open?.(({certificates:()=>state.certificates,current:()=>getCurrent(),schema:type=>SCHEMAS[type],settings:()=>settings,engineer:()=>settings.engineerName||'Unspecified engineer',attach:(id,jobId)=>{const c=state.certificates.find(x=>x.id===id);if(c){c.jobId=jobId;persist();render();}},navigate:id=>openCertificate(id)}),cert?.jobId||'');
    else if(action==='instrument-import' && cert) window.SperinInstrumentImport?.open?.({
      get:()=>getCurrent(),
      apply:rows=>{const current=getCurrent();if(!current)return;pushEditHistory('Import individually verified instrument results');const dest=current.type==='pat'?current.tables.appliances:current.tables.tests;for(const r of rows){if(dest[r.index])dest[r.index][r.field]=r.value;}persist();render();toast(rows.length+' approved instrument values imported');}
    });
    else if(action==='import-ai' || action==='ai-eicr') window.SperinAiAssistance?.open?.(action==='import-ai'?'pdf':'eicr',{
      get:()=>getCurrent(),
      schema:type=>SCHEMAS[type],
      create:(type,fields,tables)=>{const cert=makeCertificate(type);Object.assign(cert.fields,fields);for(const key of Object.keys(tables||{})){if(Array.isArray(tables[key])&&tables[key].length)cert.tables[key]=tables[key].filter(isRecord);}cert.status='Draft';if(fields.certificateNo)cert.number=fields.certificateNo;state.certificates.unshift(cert);view={page:'form',currentId:cert.id,circuitIndex:null,circuitStep:'details'};persist();render();toast('Historic certificate draft created — verify all imported evidence');},
      addEicrRows:rows=>{const cert=getCurrent();if(!cert||cert.type!=='eicr')return;pushEditHistory('Add unverified AI observations');cert.tables.observations.push(...rows);persist();render();toast('Review new observations and enter verified codes');}
    });
    else if(action==='workspace') window.SperinCloudWorkspace?.open?.({
      list:()=>state.certificates,
      add:doc=>{const valid=migrateCertificate(clone(doc));if(!valid)throw Error('Unrecognised certificate');state.certificates.unshift(valid);persist();render();},
      replace:doc=>{const valid=migrateCertificate(clone(doc));if(!valid)throw Error('Unrecognised certificate');const i=state.certificates.findIndex(x=>x.id===valid.id);if(i<0)throw Error('Missing certificate');state.certificates[i]=valid;persist();render();}
    });
    else if(action==='edit-undo') undoEdit();
    else if(action==='edit-redo') redoEdit();
    else if(action==='combo-toggle'){
      const combo=button.closest('.combo-field'),menu=combo.querySelector('.combo-menu'),open=menu.hidden;
      document.activeElement?.blur();
      document.querySelectorAll('.combo-menu').forEach(m=>m.hidden=true);
      combo.classList.toggle('open-up',window.innerHeight-combo.getBoundingClientRect().bottom<250 && combo.getBoundingClientRect().top>250);
      menu.hidden=!open;combo.querySelectorAll('[aria-expanded]').forEach(el=>el.setAttribute('aria-expanded',String(open)));
    }
    else if(action==='combo-option'){
      const combo=button.closest('.combo-field'),input=combo.querySelector('input');
      pushEditHistory();input.value=button.dataset.value;input.dispatchEvent(new Event('change',{bubbles:true}));
      combo.querySelector('.combo-menu').hidden=true;combo.querySelectorAll('[aria-expanded]').forEach(el=>el.setAttribute('aria-expanded','false'));
      document.activeElement?.blur();
    }
    else if(action==='board-add' && cert){addBoard(cert);}
    else if(action==='board-delete' && cert){deleteBoard(cert,Number(button.dataset.boardIndex));}
    else if(action==='template-save-board' && cert){saveDesignTemplate('board',cert,Number(button.dataset.boardIndex));}
    else if(action==='template-save-circuit' && cert){saveDesignTemplate('circuit',cert,button.dataset.index!==undefined?Number(button.dataset.index):view.circuitIndex);}
    else if(action==='template-open'){openTemplatePicker(button.dataset.kind,button.dataset.boardRef);}
    else if(action==='template-use' && cert){useDesignTemplate(button.dataset.id);}
    else if(action==='template-rename'){manageDesignTemplate(button.dataset.id,false);}
    else if(action==='template-delete'){manageDesignTemplate(button.dataset.id,true);}
    else if(action==='site-builder') openSiteSheetBuilder();
    else if(action==='site-builder-close') closeSiteBuilder();
    else if(action==='site-board-add' && siteBuilderState){
      siteBuilderState.boards.push({ref:'DB'+(siteBuilderState.boards.length+1),location:'',circuits:12});renderSiteBuilder();
    }
    else if(action==='site-board-remove' && siteBuilderState){
      const i=Number(button.dataset.index);if(siteBuilderState.boards.length>1)siteBuilderState.boards.splice(i,1);renderSiteBuilder();
    }
    else if(action==='site-template-save') saveCurrentSheetTemplate();
    else if(action==='site-template-load') loadSheetTemplate(button.dataset.templateId);
    else if(action==='site-generate') generateSiteSheetFromBuilder();
    else if(action==='site-read') planPicker('read');
    else if(action==='board-scan') openBoardScan(button.dataset.boardRef);
    else if(action==='site-scan') planPicker('scan');
    else if(action==='site-read-plan') openSheetRead(button.dataset.planId);
    else if(action==='site-scan-plan') openSheetScan(button.dataset.planId);
    else if(action==='sheet-read-close'){if(siteReadState)siteReadState.listening=false;document.querySelector('.sheet-read-backdrop')?.remove();siteReadState=null;}
    else if(action==='sheet-read-start' && siteReadState){siteReadState.listening=true;renderSheetRead();sheetReadLoop();}
    else if(action==='sheet-read-stop' && siteReadState){siteReadState.listening=false;renderSheetRead();}
    else if(action==='sheet-read-process' && siteReadState){const v=document.querySelector('[data-sheet-read-text]')?.value||'';parseSheetSpeech(v);renderSheetRead();}
    else if(action==='sheet-read-open-cert' && siteReadState){const id=siteReadState.cert.id;siteReadState.listening=false;document.querySelector('.sheet-read-backdrop')?.remove();siteReadState=null;openCertificate(id);}
    else if(action==='sheet-scan-close'){document.querySelector('.sheet-scan-backdrop')?.remove();siteScanState=null;}
    else if(action==='sheet-scan-camera' && siteScanState){
      if(window.Android&&typeof window.Android.captureAndScanSheet==='function'){const token=nextScanToken();siteScanState.pendingToken=token;window.Android.captureAndScanSheet(token);}
      else document.querySelector('[data-sheet-scan-files]')?.click();
    }
    else if(action==='scan-accept' && siteScanState){const r=siteScanState.results[Number(button.dataset.index)];if(r){r.accepted=!r.accepted;renderSheetScan();}}
    else if(action==='scan-speak' && siteScanState){const i=Number(button.dataset.index),r=siteScanState.results[i];if(r)voiceAsk(r.label,(text,error)=>{if(text){r.value=text;r.accepted=true;if(r.confidence==='missing')r.confidence='check';}if(error&&!text)toast(error);renderSheetScan();});}
    else if(action==='scan-apply') applyScanResults();
    else if(action==='warning-open') openWarningModal(button.dataset.scope,button.dataset.index,button.dataset.key);
    else if(action==='warnings-list') openWarningModal('all',0,'');
    else if(action==='auto-info' && cert){const meta=cert.autoMeta?.['circuit:'+button.dataset.index+':'+button.dataset.key];if(meta)alert('Auto-filled\n\n'+meta.reason+'\n\nYou can overwrite this value manually.');}
    else if (action === 'postcode-find') postcodeLookup(button.dataset.postcodeKey);
    else if (action === 'postcode-select') selectPostcodeAddress(button.dataset.postcodeKey,button.dataset.addressIndex);
    else if (action === 'copy-client-installation' && cert) {
      const address=String(cert.fields.clientAddress||'').trim();
      const postcode=String(cert.fields.clientPostcode||'').trim();
      if(!address && !postcode){toast('Enter the client address first');}
      else {
        cert.fields.installationAddress=address;
        cert.fields.installationPostcode=postcode;
        saveNow();
        const y=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo(0,y));
        toast('Installation details copied from client');
      }
    }
    else if (action === 'bonding-toggle' && cert) {
      const option=button.dataset.value;
      const key=button.dataset.bondingField||'bondingTo';
      const selected=bondingSelections(cert.fields[key]||'');
      if(selected.has(option)) selected.delete(option); else selected.add(option);
      cert.fields[key]=BONDING_OPTIONS.filter(x=>selected.has(x)).join(', ');
      saveNow();
      const y=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo(0,y));
    }
    else if (action === 'signatory-mode' && cert) {
      cert.fields.signatoryMode=button.dataset.value;
      syncSingleSignatory(cert);
      saveNow();
      const y=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo(0,y));
    }
    else if (action === 'inspection-outcome' && cert) {
      const ri=Number(button.dataset.row);
      if(cert.tables?.eicInspection?.[ri]){
        cert.tables.eicInspection[ri].outcome=button.dataset.value||'';
        saveNow();
        const y=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo(0,y));
      }
    }
    else if (action === 'inspection-bulk' && cert) {
      const value=button.dataset.value||'';
      (cert.tables?.eicInspection||[]).forEach(row=>row.outcome=value);
      saveNow();
      const y=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo(0,y));
      toast(value ? 'Inspection results applied to all' : 'Inspection results cleared');
    }
    else if (action === 'share-backup') shareBackup();
    else if (action === 'rapid-entry') openRapidEntry(false);
    else if (action === 'rapid-sheet') downloadRapidSheet();
    else if (action === 'rapid-listen') rapidListen();
    else if (action === 'rapid-process') {
      const box=document.querySelector('[data-rapid-transcript]');
      const result=processRapidTranscript(box?.value||'');
      toast(result.failed.length ? 'Stopped at a field that needs checking' : result.filled+' field'+(result.filled===1?'':'s')+' filled');
      renderRapidEntry();
    }
    else if (action === 'rapid-prev') { if(rapidState){saveNow();rapidState.cursor=Math.max(0,rapidState.cursor-1);getCurrent().rapidCursor=rapidState.cursor;renderRapidEntry();} }
    else if (action === 'rapid-later') { if(rapidState){const info=rapidCurrentSummary();if(info?.current){setVoiceStatus(rapidDescriptorId(info.current),'later');rapidState.cursor++;getCurrent().rapidCursor=rapidState.cursor;saveNow();renderRapidEntry();}} }
    else if (action === 'rapid-dismiss') { if(rapidState){const info=rapidCurrentSummary();if(info?.current){setVoiceStatus(rapidDescriptorId(info.current),'dismissed');rapidState.cursor++;getCurrent().rapidCursor=rapidState.cursor;saveNow();renderRapidEntry();}} }
    else if (action === 'rapid-start-top') { if(rapidState){rapidState.cursor=0;getCurrent().rapidCursor=0;saveNow();renderRapidEntry();} else openRapidEntry(true); }
    else if (action === 'rapid-close') closeRapidEntry();
    else if (action === 'voice-guide') startGuidedVoice('main');
    else if (action === 'voice-review-later') openCertificateReview(false);
    else if (action === 'voice-one') {
      const holder=button.closest('.voice-control') || button.closest('.field') || button.closest('td');
      startSingleVoice(holder && holder.querySelector('[data-field],[data-table-input],[data-circuit-input]'));
    }
    else if (action === 'voice-assist-speak') {
      const el=controlByVoiceKey(button.dataset.voiceKey);
      startSingleVoice(el,function(){renderAssistantPage();});
    }
    else if (action === 'voice-later') { setVoiceStatus(button.dataset.voiceKey,'later'); renderAssistantPage(); }
    else if (action === 'voice-dismiss') { setVoiceStatus(button.dataset.voiceKey,'dismissed'); renderAssistantPage(); }
    else if (action === 'voice-page-back') assistantBack();
    else if (action === 'voice-next') assistantNext();
    else if (action === 'voice-stop') stopGuidedVoice('Certificate assistant closed');
    else if (action === 'new') newCertificate(button.dataset.type);
    else if (action === 'edit') openCertificate(button.dataset.id)
    else if (action === 'duplicate') duplicateCertificate(button.dataset.id);
    else if (action === 'delete') deleteCertificate(button.dataset.id);
    else if (action === 'home') { saveNow();lastRequestedOrientation='';try{window.Android?.setCertificateOrientation?.('unspecified');}catch{} view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' }; render(); goTop(); }
    else if(action==='pdf-open'){
      if(window.Android?.openLatestPdf){if(window.Android.openLatestPdf()===false)alert('PDF unavailable. Re-download the file.');}
      else if(lastPdfPreviewUrl)window.open(lastPdfPreviewUrl,'_blank','noopener');
      document.querySelector('.pdf-download-backdrop')?.remove();
    }
    else if(action==='pdf-dismiss')document.querySelector('.pdf-download-backdrop')?.remove();
    else if (action === 'pdf') downloadPDF();
    else if (action === 'complete-pdf') completeAndCreatePdf();
    else if (action === 'print') printCertificate();
    else if (action === 'status') { if (cert) { if(cert.status==='Complete'){cert.status='Draft';persist();render();toast('Marked draft');}else openCertificateReview(true); } }
    else if(action==='circuit-open' && cert){view.circuitIndex=Number(button.dataset.index);view.circuitStep='details';persist();render();goTop();}
    else if(action==='circuit-add' && cert){
      syncCircuitRows(cert);
      pushEditHistory('Add circuit');
      const board=button.dataset.boardRef||cert.tables.boards[0]?.ref;
      if(!board) return;
      const no=nextCircuitNumber(cert,board);
      const newCircuit={boardRef:board,circuitNo:no};
      cert.tables.circuits.push(newCircuit);cert.tables.tests.push({boardRef:board,circuitNo:no});
      sortCircuitsByNumber(cert,newCircuit);
      view.circuitIndex=cert.tables.circuits.indexOf(newCircuit);view.circuitStep='details';saveNow();render();goTop();
    }
    else if(action==='circuit-move-up' && cert){moveCircuit(cert,Number(button.dataset.index),-1);}
    else if(action==='circuit-move-down' && cert){moveCircuit(cert,Number(button.dataset.index),1);}
    else if(action==='circuit-duplicate' && cert){
      syncCircuitRows(cert);const i=Number(button.dataset.index);
      const source=cert.tables.circuits[i]||{};
      const no=nextCircuitNumber(cert,source.boardRef||'DB1');
      pushEditHistory('Duplicate circuit');
      const c={...circuitDesign(source),id:uid(),boardRef:source.boardRef,circuitNo:no},t={boardRef:source.boardRef,circuitNo:no};
      cert.tables.circuits.push(c);cert.tables.tests.push(t);sortCircuitsByNumber(cert,c);view.circuitIndex=cert.tables.circuits.indexOf(c);view.circuitStep='details';persist();render();goTop();
    }
    else if(action==='circuit-delete' && cert){
      const i=Number(button.dataset.index),row=cert.tables.circuits[i];
      if(!row || row._incomingFeed) return;
      if((cert.tables.boards||[]).some(b=>normaliseBoardKey(b.sourceBoardRef)===normaliseBoardKey(row.boardRef)&&String(b.sourceCircuitNo??'')===String(row.circuitNo??''))){alert('Change the dependent consumer unit supply before deleting this source circuit.');return;}
      if(confirm('Delete this circuit and its test results?')){const y=window.scrollY;savePreRestoreSnapshot();pushEditHistory('Delete circuit');syncCircuitRows(cert);cert.tables.circuits.splice(i,1);cert.tables.tests.splice(i,1);renumberCircuits(cert);openBoardAccordion(row.boardRef);saveNow();render();keepCircuitAccordionVisible(cert,row.boardRef);restoreScroll(y);requestAnimationFrame(()=>{
        const rows=document.querySelectorAll('details.inline-circuit'),next=rows[Math.min(i,rows.length-1)];
        if(next){const rect=next.querySelector('summary').getBoundingClientRect();if(rect.top<100||rect.bottom>innerHeight-140)next.scrollIntoView({block:'center',behavior:'auto'});}
      });toast('Circuit deleted · circuits renumbered · recovery saved');}
    }
    else if(action==='circuit-next' && cert){saveNow();view.circuitStep='tests';render();goTop();}
    else if(action==='circuit-prev' && cert){saveNow();view.circuitStep='details';render();goTop();}
    else if(action==='circuit-list' && cert){saveNow();view.circuitIndex=null;view.circuitStep='details';openBoardAccordion(button.dataset.boardRef);render();goCircuitBottom(button.dataset.boardRef);}
    else if(action==='circuit-complete' && cert){saveNow();view.circuitIndex=null;view.circuitStep='details';openBoardAccordion(button.dataset.boardRef);render();goCircuitBottom(button.dataset.boardRef);}
    else if (action === 'row-add') { if (!cert) return; const key = button.dataset.table; cert.tables[key] = cert.tables[key] || []; cert.tables[key].push({}); persist(); render(); }
    else if (action === 'row-delete') { if (!cert) return; const key = button.dataset.table; const ri = Number(button.dataset.row); savePreRestoreSnapshot(); cert.tables[key].splice(ri, 1); saveNow(); render(); toast('Row deleted · recovery saved'); }
    else if(action==='clear-brand-images'){if(confirm('Remove saved report images from this device?')){settings.reportLogo='';settings.reportSignature='';saveSettings();closeModal();openSettings();}}
    else if (action === 'settings') openSettings();
    else if (action === 'save-settings') { saveSettingsFromModal(); closeModal(); toast('Profile saved'); }
    else if (action === 'close-modal') { if (e.target === button || button.tagName === 'BUTTON') closeModal(); }
    else if (action === 'backup') backup();
    else if (action === 'import-backup') importBackupFile();
    else if (action === 'restore') restore();
    else if (action === 'recovery-confirm-next') {
      if(pendingRecoveryAction) showRecoveryConfirmation(pendingRecoveryAction.kind,2);
    }
    else if (action === 'recovery-confirm-do') completeRecoveryConfirmation();
    else if (action === 'recovery-confirm-cancel') {
      pendingRecoveryAction=null;
      document.querySelector('.recovery-confirm-backdrop')?.remove();
    }
    else if (action === 'undo-restore') undoLastRestore();
  });

  setInterval(()=>{ if(state.certificates.length){persist();scheduleNativeAutoBackup();} },30000);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'){persist();flushNativeAutoBackup();} });
  window.addEventListener('pagehide',()=>{persist();flushNativeAutoBackup();});
  window.addEventListener('beforeunload',()=>{persist();flushNativeAutoBackup();});

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  window.SperinLiveEditing?.install?.({
    current:()=>getCurrent(),
    get:id=>state.certificates.find(x=>x.id===id),
    applyRemote:(id,path,value)=>{
      const c=state.certificates.find(x=>x.id===id);if(!c)return;
      let node=c;for(let i=0;i<path.length-1;i++){if(node==null)return;node=node[path[i]];}
      if(!node)return;node[path[path.length-1]]=value;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      scheduleNativeAutoBackup();
      if(view.currentId===id){
        const key=path[path.length-1];
        const selector=path[0]==='fields'?'[data-field="'+key+'"]':
          path[1]==='boards'?'[data-board-input="'+key+'"][data-board-index="'+path[2]+'"]':
          path[1]==='circuits'?'[data-circuit-input="details"][data-index="'+path[2]+'"][data-col="'+key+'"]':
          path[1]==='tests'?'[data-circuit-input="tests"][data-index="'+path[2]+'"][data-col="'+key+'"]':
          '[data-table-input="'+path[1]+'"][data-row="'+path[2]+'"][data-col="'+key+'"]';
        const control=document.querySelector(selector);
        if(control&&control!==document.activeElement)control.value=String(value??'');
      }
    }
  });

  window.SperinCloudWorkspace?.connect?.({
    list:()=>state.certificates,
    add:doc=>{const valid=migrateCertificate(clone(doc));if(!valid)throw Error('Invalid cloud record');state.certificates.unshift(valid);persist();render();},
    replace:doc=>{const valid=migrateCertificate(clone(doc));if(!valid)throw Error('Invalid cloud record');const index=state.certificates.findIndex(x=>x.id===valid.id);if(index<0)throw Error('Missing local record');state.certificates[index]=valid;persist();render();}
  });
  window.SperinJobCentre?.install?.(({certificates:()=>state.certificates,current:()=>getCurrent(),schema:type=>SCHEMAS[type],settings:()=>settings,engineer:()=>settings.engineerName||'Unspecified engineer',attach:(id,jobId)=>{const c=state.certificates.find(x=>x.id===id);if(c){c.jobId=jobId;persist();render();}},navigate:id=>openCertificate(id)}));
  if(location.hash.includes('asset='))window.addEventListener('load',()=>window.SperinJobCentre?.incomingAsset?.());

  window.SperinSpeedSuite?.install?.({
    current:()=>getCurrent(),
    home:()=>screen('home'),newCertificate:()=>screen('new'),library:()=>screen('library'),
    jobs:()=>window.SperinJobCentre?.open?.({certificates:()=>state.certificates,current:()=>getCurrent(),
      schema:type=>SCHEMAS[type],settings:()=>settings,engineer:()=>settings.engineerName||'Unspecified engineer',
      attach:(id,jobId)=>{const c=state.certificates.find(x=>x.id===id);if(c){c.jobId=jobId;persist();render();}},
      navigate:id=>openCertificate(id)},getCurrent()?.jobId||''),
    scan:()=>{
      const c=getCurrent();
      if(c&&['eic','eicr','minor'].includes(c.type))openBoardScan('');
      else{
        const a=state.certificates.find(x=>['eic','eicr','minor'].includes(x.type));
        if(a){openCertificate(a.id);openBoardScan('');}
        else if(confirm('Create a new EICR draft to scan a consumer unit?')){newCertificate('eicr');openBoardScan('');}
      }
    },
    siteBuilder:()=>openSiteSheetBuilder(),siteRead:()=>planPicker('read'),siteScan:()=>planPicker('scan'),
    settings:()=>openSettings(),
    workspace:()=>window.SperinCloudWorkspace?.open?.({list:()=>state.certificates,
      add:doc=>{const c=migrateCertificate(clone(doc));if(!c)throw Error('Invalid certificate');
        state.certificates.unshift(c);persist();render();},
      replace:doc=>{const c=migrateCertificate(clone(doc));if(!c)throw Error('Invalid certificate');
        const i=state.certificates.findIndex(x=>x.id===c.id);
        if(i<0)throw Error('Certificate not found');state.certificates[i]=c;persist();render();}}),
    tester:()=>{const cert=getCurrent();if(!cert)return toast('Open a certificate first');document.querySelector('[data-action="instrument-import"]')?.click();},
    mutate:(label,change)=>{
      const cert=getCurrent();if(!cert)throw Error('Open a certificate');
      pushEditHistory(label);const before=clone(cert);
      try{change(cert);saveNow();const y=scrollY;render();requestAnimationFrame(()=>scrollTo(0,y));}
      catch(err){Object.keys(cert).forEach(k=>delete cert[k]);Object.assign(cert,before);saveNow();render();throw err;}
    },
    quick:(board,description,curve,rating)=>{
      const cert=getCurrent();if(!cert||!['eic','eicr'].includes(cert.type))throw Error('Open EIC or EICR');
      if(!cert.tables.boards.some(b=>b.ref===board))throw Error('Board not found');
      if((cert.tables.circuits||[]).length>=150)throw Error('Limit reached; split the schedule');
      syncCircuitRows(cert);pushEditHistory('Quick-add circuit');
      const no=nextCircuitNumber(cert,board);
      const c={id:uid(),boardRef:board,circuitNo:no,description,ocpdType:curve,ocpdRating:rating};
      cert.tables.circuits.push(c);cert.tables.tests.push({boardRef:board,circuitNo:no});
      sortCircuitsByNumber(cert,c);saveNow();render();
    },
    convert:(type,copyCircuits)=>{
      const old=getCurrent();if(!old||!SCHEMAS[type]||!['eic','eicr','minor'].includes(type)||type===old.type)throw Error('Unsupported conversion');
      if(!['eic','eicr','minor'].includes(old.type))throw Error('Unsupported source');
      savePreRestoreSnapshot();
      const next=makeCertificate(type);
      const keep=['clientName','clientAddress','clientPostcode','installationAddress','installationPostcode','premisesAddress',
        'premisesPostcode','occupier','nominalVoltage','frequency','earthingArrangement','ze','ipf','supplyCharacteristics'];
      for(const k of keep)if(Object.hasOwn(next.fields,k)&&old.fields?.[k]!==undefined)next.fields[k]=clone(old.fields[k]);
      if(copyCircuits&&type!=='minor'&&Array.isArray(old.tables?.circuits)){
        next.tables.boards=clone(old.tables.boards||[]).map(b=>{const copy={...b};for(const k of ['zdb','ipf','rcdTime','spdOperational','polarity','phaseSequence'])delete copy[k];return copy;});
        next.tables.circuits=old.tables.circuits.filter(r=>!r._incomingFeed).map(r=>({
          id:uid(),boardRef:r.boardRef,circuitNo:r.circuitNo,description:r.description||'',points:r.points||'',
          cableType:r.cableType||'',cableCsa:r.cableCsa||'',cpcCsa:r.cpcCsa||'',ocpdBs:r.ocpdBs||'',
          ocpdType:r.ocpdType||'',ocpdRating:r.ocpdRating||''
        }));
        next.tables.tests=next.tables.circuits.map(r=>({boardRef:r.boardRef,circuitNo:r.circuitNo}));
        ensureBoardWorkflowData(next);syncCircuitRows(next);
      }
      if(copyCircuits&&type==='minor'&&old.tables?.circuits?.[0])next.fields.description=String(old.tables.circuits[0].description||'');
      next.status='Draft';next.sourceCertificateId=old.id;next.convertedUnverified=true;
      // Critical: no original signatures, previous inspection findings or previous test values can attest new work.
      next.fields.inspectorSignature='';next.fields.constructorSignature='';next.fields.designer1Signature='';
      next.fields.singleSignatoryName='';next.fields.singleSignatoryQualification='';
      state.certificates.unshift(next);view={page:'form',currentId:next.id,circuitIndex:null,circuitStep:'details'};
      resetEditHistory(next.id);saveNow();render();goTop();toast('New DRAFT — independently verify all copied details');
    }
  });
  render();
})();
