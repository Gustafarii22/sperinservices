(() => {
  'use strict';

  const STORAGE_KEY = 'sperin-certificates-data-v1';
  const SETTINGS_KEY = 'sperin-certificates-settings-v1';
  const VERSION = '1.1.0';
  const TODAY = new Date().toISOString().slice(0, 10);

  const OPTIONS = {
    yesNo: ['Yes', 'No'],
    yesNoNA: ['Yes', 'No', 'N/A'],
    passNA: ['✓', 'N/A'],
    eicrOutcome: ['✓', 'C1', 'C2', 'C3', 'FI', 'N/V', 'LIM', 'N/A'],
    earthing: ['TN-C', 'TN-S', 'TN-C-S (PME)', 'TN-C-S (PNB)', 'TT', 'IT', 'Other'],
    liveConductors: ['1-phase, 2-wire', '2-phase, 3-wire', '3-phase, 3-wire', '3-phase, 4-wire', 'DC 2-wire', 'DC 3-wire', 'Other'],
    acdc: ['AC', 'DC'],
    rcdType: ['AC', 'A', 'F', 'B', 'Other', 'N/A'],
    ocpdType: ['B', 'C', 'D', 'gG', 'gL', 'BS 88 fuse', 'MCCB', 'ACB', 'Other'],
    wiringType: ['A - Thermoplastic insulated/sheathed', 'B - Thermoplastic in metallic conduit', 'C - Thermoplastic in non-metallic conduit', 'D - Thermoplastic in metallic trunking', 'E - Thermoplastic in non-metallic trunking', 'F - Thermoplastic SWA', 'G - Thermosetting SWA', 'H - Mineral insulated', 'O - Other'],
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
    ocpdBs: ['BS EN 60898-1', 'BS EN 61009-1', 'BS 88-2', 'BS 3036', 'BS 1361', 'Other'],
    ocpdRating: ['2', '4', '6', '10', '16', '20', '25', '32', '40', '50', '63', '80', '100', '125'],
    testerFunction: ['Multifunction', 'Low resistance ohmmeter', 'Insulation resistance', 'Earth fault loop impedance (Zs)', 'RCD', 'Earth electrode resistance', 'Voltage indicator', 'Other']
  };

  const f = (key, label, type = 'text', opts = {}) => ({ key, label, type, ...opts });
  const table = (key, title, columns, defaultRows = []) => ({ type: 'table', key, title, columns, defaultRows });
  const section = (title, fields = [], opts = {}) => ({ type: 'section', title, fields, ...opts });
  const select = (key, label, options, opts = {}) => f(key, label, 'select', { options, ...opts });

  const circuitColumns = [
    { key: 'circuitNo', label: 'Circuit no.' },
    { key: 'description', label: 'Circuit description' },
    { key: 'wiringType', label: 'Wiring type', type: 'select', options: OPTIONS.wiringType },
    { key: 'refMethod', label: 'Reference method', type: 'select', options: OPTIONS.refMethod },
    { key: 'points', label: 'Points' },
    { key: 'liveCsa', label: 'Live mm²' },
    { key: 'cpcCsa', label: 'CPC mm²' },
    { key: 'ocpdBs', label: 'OCPD BS (EN)' },
    { key: 'ocpdType', label: 'OCPD type', type: 'select', options: OPTIONS.ocpdType },
    { key: 'ocpdRating', label: 'Rating A' },
    { key: 'breakingCapacity', label: 'Breaking kA' },
    { key: 'maxZs', label: 'Max Zs Ω' },
    { key: 'rcdBs', label: 'RCD BS (EN)' },
    { key: 'rcdType', label: 'RCD type', type: 'select', options: OPTIONS.rcdType },
    { key: 'rcdIdn', label: 'IΔn mA' },
    { key: 'rcdRating', label: 'RCD A' }
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
      { key:'circuitNo', label:'Circuit number' },
      { key:'description', label:'Circuit description', span:'full' },
      { key:'wiringType', label:'Type of wiring', options:OPTIONS.wiringType },
      { key:'refMethod', label:'Reference method', options:OPTIONS.refMethod },
      { key:'points', label:'Number of points served' },
      { key:'liveCsa', label:'Live conductor csa (mm²)' },
      { key:'cpcCsa', label:'CPC csa (mm²)' }
    ]},
    { title: 'Overcurrent protective device', fields: [
      { key:'ocpdBs', label:'BS (EN)', options:OPTIONS.ocpdBs },
      { key:'ocpdType', label:'Type / curve', options:OPTIONS.ocpdType },
      { key:'ocpdRating', label:'Rating (A)', options:OPTIONS.ocpdRating },
      { key:'breakingCapacity', label:'Breaking capacity (kA)' },
      { key:'maxZs', label:'Maximum permitted Zs (Ω)', suffix:'zs' }
    ]},
    { title: 'RCD', fields: [
      { key:'rcdBs', label:'BS (EN)', options:['BS EN 61008-1','BS EN 61009-1','Other'] },
      { key:'rcdType', label:'Type', options:OPTIONS.rcdType },
      { key:'rcdIdn', label:'IΔn (mA)', options:['10','30','100','300','500'] },
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

  function nextCircuitNumber(cert) {
    const nums=(cert.tables?.circuits||[]).map(r=>parseInt(r.circuitNo,10)).filter(Number.isFinite);
    return String((nums.length ? Math.max(...nums) : 0)+1);
  }

  function syncCircuitRows(cert) {
    if (!cert?.tables) return;
    cert.tables.circuits = Array.isArray(cert.tables.circuits) ? cert.tables.circuits : [];
    cert.tables.tests = Array.isArray(cert.tables.tests) ? cert.tables.tests : [];
    const total=Math.max(cert.tables.circuits.length,cert.tables.tests.length);
    while(cert.tables.circuits.length<total) cert.tables.circuits.push({});
    while(cert.tables.tests.length<total) cert.tables.tests.push({});
    cert.tables.circuits.forEach((row,i)=>{
      row.circuitNo = row.circuitNo || cert.tables.tests[i]?.circuitNo || String(i+1);
      cert.tables.tests[i].circuitNo = row.circuitNo;
    });
  }

  function calculateMaxZs(row, cert) {
    const curve=String(row?.ocpdType||'').trim().toUpperCase();
    const factor={B:5,C:10,D:20}[curve];
    const rating=parseFloat(row?.ocpdRating);
    const standard=String(row?.ocpdBs||'');
    if(!factor || !Number.isFinite(rating) || rating<=0 || !/60898|61009/.test(standard)) return '';
    const rawU=String(cert?.fields?.nominalVoltage||'230').match(/\d+(?:\.\d+)?/g)||['230'];
    let u0=Math.min(...rawU.map(Number).filter(Number.isFinite));
    if(!Number.isFinite(u0) || u0>300) u0=230;
    const zs=(0.95*u0)/(factor*rating);
    return zs>=10 ? zs.toFixed(1) : zs.toFixed(2);
  }

  function recalculateCircuitZs(cert,index,force=false) {
    const row=cert?.tables?.circuits?.[index]; if(!row) return;
    if(force) row.maxZsManual=false;
    if(row.maxZsManual) return;
    const calc=calculateMaxZs(row,cert);
    if(calc) row.maxZs=calc;
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
    const signature=f.singleSignatorySignature||'';
    const date=f.singleSignatoryDate||'';
    f.designer1=name; f.constructor=name; f.inspector=name;
    f.designerCompany=company; f.constructorCompany=company; f.inspectorCompany=company;
    f.designerAddress=address; f.constructorAddress=address; f.inspectorAddress=address;
    f.designer1Signature=signature; f.constructorSignature=signature; f.inspectorSignature=signature;
    f.designer1Date=date; f.constructorDate=date; f.inspectionDate=date;
  }

  function migrateCertificate(cert) {
    cert.fields = cert.fields || {};
    cert.tables = cert.tables || {};
    if(cert.type==='eic'){
      const f=cert.fields;
      if(!f.signatoryMode){
        const names=[f.designer1,f.constructor,f.inspector].filter(Boolean);
        const same=names.length<=1 || names.every(n=>n===names[0]);
        f.signatoryMode=same ? 'One person — design, construction & inspection' : 'Separate people';
      }
      if(f.signatoryMode==='One person — design, construction & inspection'){
        f.singleSignatoryName=f.singleSignatoryName||f.designer1||f.constructor||f.inspector||settings.engineerName||'';
        f.singleSignatoryCompany=f.singleSignatoryCompany||f.designerCompany||f.constructorCompany||f.inspectorCompany||settings.companyName||'';
        f.singleSignatoryAddress=f.singleSignatoryAddress||f.designerAddress||f.constructorAddress||f.inspectorAddress||[settings.address,settings.postcode].filter(Boolean).join('\n');
        f.singleSignatorySignature=f.singleSignatorySignature||f.designer1Signature||f.constructorSignature||f.inspectorSignature||'';
        f.singleSignatoryDate=f.singleSignatoryDate||f.designer1Date||f.constructorDate||f.inspectionDate||'';
        syncSingleSignatory(cert);
      }
    }
    if(cert.type==='eic'||cert.type==='eicr'){
      syncCircuitRows(cert);
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

  const eicInspectionRows = [
    ['1.0', 'Condition of consumer’s intake equipment (visual inspection only)'],
    ['2.0', 'Parallel or switched alternative sources of supply'],
    ['3.0', 'Protective measure: Automatic Disconnection of Supply (ADS)'],
    ['4.0', 'Basic protection'],
    ['5.0', 'Protective measures other than ADS'],
    ['6.0', 'Additional protection'],
    ['7.0', 'Distribution equipment'],
    ['8.0', 'Circuits (distribution and final)'],
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
        section('A · Client details', [f('clientName', 'Client / person ordering the work', 'text', { span: 'full' }), f('certificateNo', 'Certificate number'), f('issueDate', 'Issue date', 'date')]),
        section('B · Installation details', [f('installationAddress', 'Installation address', 'textarea', { span: 'full' }), f('description', 'Description of installation', 'textarea', { span: 'full' }), select('workType', 'Type of work', OPTIONS.workType), f('extent', 'Extent of installation covered by this certificate', 'textarea', { span: 'full' })]),
        section('C · Certification & signatories', [
          select('signatoryMode', 'Responsibility', ['One person — design, construction & inspection', 'Separate people']),
          f('singleSignatoryName', 'Name', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryCompany', 'For/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryAddress', 'Address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatorySignature', 'Signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('singleSignatoryDate', 'Date', 'date', { showWhen:{key:'signatoryMode',value:'One person — design, construction & inspection'} }),
          f('designer1', 'Designer name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designerCompany', 'Designer — for/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designerAddress', 'Designer address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer1Signature', 'Designer signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designer1Date', 'Designer date', 'date', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructor', 'Constructor name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorCompany', 'Constructor — for/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorAddress', 'Constructor address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorSignature', 'Constructor signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('constructorDate', 'Construction date', 'date', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspector', 'Inspector name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorCompany', 'Inspector — for/on behalf of', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorAddress', 'Inspector address', 'textarea', { span:'full', showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectorSignature', 'Inspector signature / typed name', 'text', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('inspectionDate', 'Inspection & testing date', 'date', { showWhen:{key:'signatoryMode',value:'Separate people'} }),
          f('designDepartures', 'Design departures from BS 7671', 'textarea', { span:'full' }),
          f('constructionDepartures', 'Construction departures from BS 7671', 'textarea', { span:'full' }),
          f('inspectionDepartures', 'Inspection & testing departures from BS 7671', 'textarea', { span:'full' }),
          f('permittedExceptions', 'Permitted exceptions / risk assessment details', 'textarea', { span:'full' }),
          select('riskAssessmentAttached', 'Risk assessment attached', OPTIONS.yesNoNA)
        ]),
        section('D · Next inspection', [f('nextInspectionInterval', 'Recommended interval before next inspection (years/months)', 'text', { span: 'full' })]),
        section('F · Supply characteristics & earthing', [select('earthingArrangement', 'Earthing arrangement', OPTIONS.earthing), select('liveConductors', 'Number/type of live conductors', OPTIONS.liveConductors), select('supplyACDC', 'Supply', OPTIONS.acdc), f('nominalVoltage', 'Nominal voltage U/U0 (V)'), f('frequency', 'Nominal frequency (Hz)'), f('ipf', 'Prospective fault current Ipf (kA)'), f('ze', 'External earth fault loop impedance Ze (Ω)'), f('supplyDeviceBs', 'Supply protective device BS (EN)'), f('supplyDeviceType', 'Supply protective device type'), f('supplyDeviceRating', 'Rated current (A)'), f('supplyBreakingCapacity', 'Breaking capacity (kA)'), select('supplyPolarity', 'Supply polarity confirmed', OPTIONS.yesNoNA), select('otherSources', 'Other sources of supply present', OPTIONS.yesNo)]),
        section('G · Installation particulars', [select('meansOfEarthing', 'Means of earthing', ['Distributor’s facility', 'Installation earth electrode', 'Both', 'Other']), f('maximumDemand', 'Maximum demand'), f('maximumDemandUnit', 'Maximum demand unit', 'select', { options: ['A', 'kVA'] }), f('earthElectrodeType', 'Earth electrode type'), f('earthElectrodeLocation', 'Earth electrode location'), f('earthElectrodeResistance', 'Electrode resistance/impedance (Ω)'), f('earthingConductorMaterial', 'Earthing conductor material'), f('earthingConductorCsa', 'Earthing conductor csa (mm²)'), select('earthingContinuity', 'Earthing conductor continuity verified', OPTIONS.yesNoNA), f('bondingMaterial', 'Main bonding conductor material'), f('bondingCsa', 'Main bonding conductor csa (mm²)'), select('bondingContinuity', 'Bonding continuity verified', OPTIONS.yesNoNA), f('bondingTo', 'Main bonding to (water/gas/oil/steel/LPS/other)', 'text', { span: 'full' }), f('mainSwitchLocation', 'Main switch location'), f('mainSwitchBs', 'Main switch BS (EN)'), f('mainSwitchPoles', 'No. of poles'), f('mainSwitchCurrent', 'Current rating (A)'), f('mainSwitchVoltage', 'Voltage rating (V)'), f('mainSwitchDeviceType', 'Overcurrent device type / setting'), f('mainSwitchBreaking', 'Breaking capacity (kA)'), select('mainRcdType', 'RCD main switch type', OPTIONS.rcdType), f('mainRcdIdn', 'RCD IΔn (mA)'), f('mainRcdDelay', 'RCD time delay (ms)'), f('mainRcdTime', 'Measured operating time (ms)')]),
        table('eicInspection', 'H · Schedule of inspections', [
          { key: 'item', label: 'Item', readonly: true }, { key: 'description', label: 'Description', readonly: true }, { key: 'outcome', label: 'Outcome', type: 'select', options: OPTIONS.passNA }
        ], eicInspectionRows),
        section('I · Existing installation comments', [f('existingComments', 'Comments on existing installation (for additions/alterations)', 'textarea', { span: 'full' })]),
        section('J · Schedule details', [f('dbReference', 'DB/CU reference'), f('dbLocation', 'DB/CU location'), f('suppliedFrom', 'Supplied from'), f('distributionOcpd', 'Distribution circuit OCPD'), f('dbRcd', 'DB RCD details'), f('dbSpd', 'SPD details / type(s)'), f('zdb', 'Zdb (Ω)'), f('dbIpf', 'DB Ipf (kA)'), select('dbPolarity', 'Correct polarity confirmed', OPTIONS.yesNoNA), select('phaseSequence', 'Phase sequence confirmed', OPTIONS.yesNoNA), select('spdOperational', 'SPD operational status confirmed', OPTIONS.yesNoNA)]),
        table('circuits', 'Schedule of circuit details', circuitColumns, [{ circuitNo: '1' }]),
        table('tests', 'Schedule of test results', testColumns, [{ circuitNo: '1' }]),
        section('Test instrument', [
          f('testerMake', 'Make'), f('testerModel', 'Model'), f('testerSerial', 'Serial number'),
          f('testerMft', 'Multifunction tester', 'checkbox', { span:'third' }),
          f('testerLowOhm', 'Low resistance ohmmeter', 'checkbox', { span:'third' }),
          f('testerInsulation', 'Insulation resistance', 'checkbox', { span:'third' }),
          f('testerLoop', 'Earth fault loop impedance / Zs', 'checkbox', { span:'third' }),
          f('testerRcd', 'RCD', 'checkbox', { span:'third' }),
          f('testerEarth', 'Earth electrode resistance', 'checkbox', { span:'third' }),
          f('testerVoltage', 'Voltage indicator', 'checkbox', { span:'third' }),
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
        section('A · Person ordering the report', [f('clientName', 'Name', 'text', { span: 'full' }), f('clientAddress', 'Address', 'textarea', { span: 'full' }), f('certificateNo', 'Report number'), f('issueDate', 'Report issue date', 'date')]),
        section('B · Reason for producing this report', [f('reason', 'Reason for report', 'textarea', { span: 'full' }), f('inspectionDates', 'Date(s) inspection and testing carried out', 'text', { span: 'full' })]),
        section('C · Installation details', [f('occupier', 'Occupier'), f('installationAddress', 'Installation address', 'textarea', { span: 'full' }), select('premisesType', 'Description of premises', OPTIONS.premises), f('premisesOther', 'Other description'), f('age', 'Estimated age of wiring system (years)'), select('additionsEvidence', 'Evidence of additions/alterations', ['Yes', 'Not apparent']), f('additionsAge', 'If yes, estimated age (years)'), select('recordsAvailable', 'Installation records available', OPTIONS.yesNo), f('lastInspection', 'Date of last inspection', 'date')]),
        section('D · Extent & limitations', [f('extentInspected', 'Parts of installation inspected and tested', 'textarea', { span: 'full' }), f('agreedLimitations', 'Agreed limitations including reasons', 'textarea', { span: 'full' }), f('agreedWith', 'Agreed with'), f('operationalLimitations', 'Operational limitations and reasons', 'textarea', { span: 'full' }), f('standardAmendedTo', 'Inspection carried out to BS 7671 amended to', 'text', { placeholder: 'A4:2026' })]),
        section('E · Summary of condition', [select('overallAssessment', 'Overall assessment', OPTIONS.overall), f('generalCondition', 'General condition of the installation (electrical safety)', 'textarea', { span: 'full' })]),
        section('F · Recommendation for next inspection', [f('nextInspectionDate', 'Further inspection recommended before', 'date'), f('nextInspectionReason', 'Reason for recommended interval', 'textarea', { span: 'full' })]),
        section('G · Declaration', [f('inspectedBy', 'Inspected and tested by'), f('inspectorPosition', 'Position'), f('inspectorCompany', 'For/on behalf of'), f('inspectorAddress', 'Inspector address', 'textarea'), f('inspectorSignature', 'Inspector signature / typed name'), f('inspectorDate', 'Inspector date', 'date'), f('authorisedBy', 'Report authorised for issue by'), f('authoriserPosition', 'Authoriser position'), f('authoriserCompany', 'For/on behalf of'), f('authoriserAddress', 'Authoriser address', 'textarea'), f('authoriserSignature', 'Authoriser signature / typed name'), f('authoriserDate', 'Authoriser date', 'date')]),
        section('H · Schedules attached', [f('continuationSheets', 'Continuation sheets / sections'), f('inspectionSchedules', 'No. of inspection schedules'), f('circuitSchedules', 'No. of circuit/test schedules')]),
        section('I · Supply characteristics & earthing', [select('earthingArrangement', 'Earthing arrangement', OPTIONS.earthing), select('liveConductors', 'Number/type of live conductors', OPTIONS.liveConductors), select('supplyACDC', 'Supply', OPTIONS.acdc), f('nominalVoltage', 'Nominal voltage U/U0 (V)'), f('frequency', 'Nominal frequency (Hz)'), f('ipf', 'Prospective fault current Ipf (kA)'), f('ze', 'External earth fault loop impedance Ze (Ω)'), f('supplyDeviceBs', 'Supply protective device BS (EN)'), f('supplyDeviceType', 'Supply protective device type'), f('supplyDeviceRating', 'Rated current (A)'), f('supplyBreakingCapacity', 'Breaking capacity (kA)'), select('supplyPolarity', 'Supply polarity confirmed', OPTIONS.yesNoNA), select('otherSources', 'Other sources of supply present', OPTIONS.yesNo)]),
        section('J · Installation particulars', [select('meansOfEarthing', 'Means of earthing', ['Distributor’s facility', 'Installation earth electrode', 'Both', 'Other']), f('maximumDemand', 'Maximum demand'), f('maximumDemandUnit', 'Unit', 'select', { options: ['A', 'kVA'] }), f('earthElectrodeType', 'Earth electrode type'), f('earthElectrodeLocation', 'Earth electrode location'), f('earthElectrodeResistance', 'Electrode resistance/impedance (Ω)'), f('earthingConductorMaterial', 'Earthing conductor material'), f('earthingConductorCsa', 'Earthing conductor csa (mm²)'), select('earthingContinuity', 'Earthing conductor continuity verified', OPTIONS.yesNoNA), f('bondingMaterial', 'Main bonding conductor material'), f('bondingCsa', 'Main bonding conductor csa (mm²)'), select('bondingContinuity', 'Bonding continuity verified', OPTIONS.yesNoNA), f('bondingTo', 'Main protective bonding to', 'text', { span: 'full' }), f('mainSwitchLocation', 'Main switch location'), f('mainSwitchBs', 'Main switch BS (EN)'), f('mainSwitchPoles', 'No. of poles'), f('mainSwitchCurrent', 'Current rating (A)'), f('mainSwitchVoltage', 'Voltage rating (V)'), f('mainSwitchDeviceType', 'Overcurrent device type / setting'), f('mainSwitchBreaking', 'Breaking capacity (kA)'), select('mainRcdType', 'RCD main switch type', OPTIONS.rcdType), f('mainRcdIdn', 'RCD IΔn (mA)'), f('mainRcdDelay', 'RCD time delay (ms)'), f('mainRcdTime', 'Measured operating time (ms)')]),
        table('observations', 'K · Observations', [
          { key: 'item', label: 'Item' }, { key: 'observation', label: 'Observation / defect' }, { key: 'code', label: 'Code', type: 'select', options: OPTIONS.observationCode }, { key: 'scheduleRef', label: 'Schedule ref.' }
        ], [{ item: '1' }]),
        table('eicrInspection', 'Condition report schedule of inspection', [
          { key: 'item', label: 'Item', readonly: true }, { key: 'description', label: 'Description', readonly: true }, { key: 'outcome', label: 'Outcome', type: 'select', options: OPTIONS.eicrOutcome }, { key: 'comment', label: 'Comment' }
        ], eicrInspectionRows),
        section('Circuit schedule header', [f('dbReference', 'DB/CU reference'), f('dbLocation', 'DB/CU location'), f('suppliedFrom', 'Supplied from'), f('distributionOcpd', 'Distribution circuit OCPD'), f('dbRcd', 'DB RCD details'), f('dbSpd', 'SPD details / type(s)'), f('zdb', 'Zdb (Ω)'), f('dbIpf', 'DB Ipf (kA)'), select('dbPolarity', 'Correct polarity confirmed', OPTIONS.yesNoNA), select('phaseSequence', 'Phase sequence confirmed', OPTIONS.yesNoNA), select('spdOperational', 'SPD operational status confirmed', OPTIONS.yesNoNA)]),
        table('circuits', 'Schedule of circuit details', circuitColumns, [{ circuitNo: '1' }]),
        table('tests', 'Schedule of test results', testColumns, [{ circuitNo: '1' }]),
        section('Test instrument', [
          f('testerMake', 'Make'), f('testerModel', 'Model'), f('testerSerial', 'Serial number'),
          f('testerMft', 'Multifunction tester', 'checkbox', { span:'third' }),
          f('testerLowOhm', 'Low resistance ohmmeter', 'checkbox', { span:'third' }),
          f('testerInsulation', 'Insulation resistance', 'checkbox', { span:'third' }),
          f('testerLoop', 'Earth fault loop impedance / Zs', 'checkbox', { span:'third' }),
          f('testerRcd', 'RCD', 'checkbox', { span:'third' }),
          f('testerEarth', 'Earth electrode resistance', 'checkbox', { span:'third' }),
          f('testerVoltage', 'Voltage indicator', 'checkbox', { span:'third' }),
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
        section('A · Description of the minor works', [f('certificateNo', 'Certificate number'), f('clientName', 'Client details', 'text', { span: 'full' }), f('completionDate', 'Date minor works completed', 'date'), f('installationAddress', 'Installation location/address', 'textarea', { span: 'full' }), f('description', 'Description of minor works', 'textarea', { span: 'full' }), f('departures', 'Departures from BS 7671', 'textarea', { span: 'full' }), f('permittedExceptions', 'Permitted exceptions / risk assessment details', 'textarea', { span: 'full' }), select('riskAssessmentAttached', 'Risk assessment attached', OPTIONS.yesNoNA), f('existingDefects', 'Comments / defects observed in existing installation', 'textarea', { span: 'full' })]),
        section('B · Earthing & bonding adequacy', [select('earthingArrangement', 'System earthing arrangement', OPTIONS.earthing), f('zdb', 'Earth fault loop impedance at DB Zdb (Ω)'), select('earthingConductorAdequate', 'Adequate earthing conductor present', OPTIONS.yesNoNA), f('bondingPresent', 'Main protective bonding to', 'text', { span: 'full' })]),
        section('C · Circuit details', [f('dbReference', 'DB reference no.'), f('dbLocationType', 'DB location and type'), f('circuitNo', 'Circuit no.'), f('circuitDescription', 'Circuit description'), select('referenceMethod', 'Reference method', OPTIONS.refMethod), f('liveCsa', 'Live conductor csa (mm²)'), f('cpcCsa', 'CPC csa (mm²)'), f('ocpdBs', 'OCPD BS (EN)'), select('ocpdType', 'OCPD type', OPTIONS.ocpdType), f('ocpdRating', 'OCPD rating (A)'), f('breakingCapacity', 'Breaking capacity (kA)'), f('rcdBs', 'RCD BS (EN)'), select('rcdType', 'RCD type', OPTIONS.rcdType), f('rcdRating', 'RCD rating (A)'), f('rcdIdn', 'RCD IΔn (mA)'), f('rcdDelay', 'RCD time delay (ms)'), f('afddBs', 'AFDD BS (EN)'), f('afddRating', 'AFDD rating (A)'), f('spdBs', 'SPD BS (EN)'), f('spdType', 'SPD type')]),
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
        section('Certificate & premises', [select('certificateType', 'Certificate type', OPTIONS.emergencyType), f('certificateNo', 'Certificate number'), f('issueDate', 'Issue date', 'date'), f('clientName', 'Client / responsible person'), f('premisesName', 'Premises name'), f('premisesAddress', 'Premises address', 'textarea', { span: 'full' }), select('premisesType', 'Premises type', OPTIONS.premises), f('systemRef', 'System / drawing reference')]),
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
        section('Certificate & premises', [f('certificateNo', 'Certificate number'), f('issueDate', 'Issue date', 'date'), f('clientName', 'Client / occupier'), f('premisesAddress', 'Premises address', 'textarea', { span: 'full' }), f('premisesDescription', 'Premises description', 'textarea', { span: 'full' })]),
        section('System classification & design', [f('standard', 'Standard', 'text', { defaultValue: 'BS 5839-6:2019+A1:2020' }), select('grade', 'System grade', OPTIONS.smokeGrade), select('category', 'System category', OPTIONS.smokeCategory), select('interlink', 'Interconnection method', OPTIONS.interlink), f('systemDescription', 'System description / extent', 'textarea', { span: 'full' }), f('riskBasis', 'Risk assessment / category basis / special risks', 'textarea', { span: 'full' }), f('variations', 'Variations from recommendations', 'textarea', { span: 'full' }), f('designerName', 'Designer / responsible person'), f('designerSignature', 'Design signature / typed name'), f('designDate', 'Design date', 'date')]),
        table('alarms', 'Alarm / detector schedule', [
          { key: 'ref', label: 'Ref.' }, { key: 'location', label: 'Location' }, { key: 'type', label: 'Device type', type: 'select', options: OPTIONS.alarmType }, { key: 'makeModel', label: 'Make / model' }, { key: 'power', label: 'Power source / battery' }, { key: 'interlink', label: 'Interlink', type: 'select', options: OPTIONS.interlink }, { key: 'test', label: 'Test', type: 'select', options: OPTIONS.testResult }, { key: 'remarks', label: 'Remarks' }
        ], [{ ref: 'A1' }]),
        section('Installation checks', [select('sitingCompliant', 'Detector siting / coverage satisfactory', OPTIONS.yesNoNA), select('powerCompliant', 'Power supplies / standby provision satisfactory', OPTIONS.yesNoNA), select('interlinkTest', 'Interconnection / radio link tested satisfactory', OPTIONS.yesNoNA), select('soundersTest', 'Audibility / alarm operation satisfactory', OPTIONS.yesNoNA), select('visualWarning', 'Visual/tactile warning provision satisfactory where required', OPTIONS.yesNoNA), select('labels', 'Labelling / circuit identification satisfactory', OPTIONS.yesNoNA), f('installationNotes', 'Installation notes / defects / departures', 'textarea', { span: 'full' }), f('installerName', 'Installer'), f('installerCompany', 'For/on behalf of'), f('installerSignature', 'Installation signature / typed name'), f('installationDate', 'Installation date', 'date')]),
        section('Commissioning & handover', [f('commissioningDate', 'Commissioning date', 'date'), select('allDevicesTested', 'All detectors / alarms function tested', OPTIONS.yesNoNA), select('interconnectionConfirmed', 'All interconnected alarms activate as intended', OPTIONS.yesNoNA), select('mainsFailure', 'Standby supply / mains failure operation checked', OPTIONS.yesNoNA), select('faultIndicators', 'Fault / low-battery indicators checked where applicable', OPTIONS.yesNoNA), select('instructionsGiven', 'User instructions and test/maintenance guidance given', OPTIONS.yesNoNA), f('commissioningNotes', 'Commissioning notes', 'textarea', { span: 'full' }), f('commissionerName', 'Commissioner'), f('commissionerCompany', 'For/on behalf of'), f('commissionerSignature', 'Commissioning signature / typed name'), f('commissionerDate', 'Commissioning declaration date', 'date'), f('nextServiceDate', 'Next service / inspection recommended', 'date')])
      ]
    }
  };

  let settings = loadSettings();
  let state = loadState();
  let view = { page: 'home', currentId: null, circuitIndex: null, circuitStep: 'details' };
  let autosaveTimer = null;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const certificates = Array.isArray(parsed.certificates) ? parsed.certificates : [];
      return { certificates: certificates.map(migrateCertificate) };
    } catch { return { certificates: [] }; }
  }

  function loadSettings() {
    const defaults = { companyName: 'Sperin Services', engineerName: '', address: '', postcode: '', phone: '', email: '', registration: '', qualification: 'C&G 2391 / 18th Edition', defaultStandard: 'BS 7671:2018+A4:2026' };
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) }; } catch { return defaults; }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (view.currentId) {
      const c = getCurrent();
      if (c) c.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }

  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
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
      fields.singleSignatoryAddress = [settings.address, settings.postcode].filter(Boolean).join('\n');
    }
    if ('testerMft' in fields) fields.testerMft = true;
    const cert = { id: uid(), type, number: no, status: 'Draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), fields, tables };
    migrateCertificate(cert);
    syncSingleSignatory(cert);
    return cert;
  }

  function newCertificate(type) {
    const cert = makeCertificate(type);
    state.certificates.unshift(cert);
    view = { page: 'form', currentId: cert.id, circuitIndex: null, circuitStep: 'details' };
    persist();
    render(); goTop();
    toast('New certificate created');
  }

  function duplicateCertificate(id) {
    const original = state.certificates.find(c => c.id === id); if (!original) return;
    const copy = clone(original); copy.id = uid(); copy.number = certificateNumber(copy.type); copy.fields.certificateNo = copy.number; copy.status = 'Draft'; copy.createdAt = copy.updatedAt = new Date().toISOString();
    state.certificates.unshift(copy); persist(); render(); toast('Certificate duplicated');
  }

  function deleteCertificate(id) {
    const c = state.certificates.find(x => x.id === id); if (!c) return;
    if (!confirm(`Delete ${c.number || displayType(c.type)}? This cannot be undone.`)) return;
    state.certificates = state.certificates.filter(x => x.id !== id); persist();
    if (view.currentId === id) view = { page: 'home', currentId: null };
    render(); toast('Certificate deleted');
  }

  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => { persist(); updateSaveState('Saved'); }, 300);
    updateSaveState('Saving…');
  }

  function updateSaveState(text) { const el = document.querySelector('[data-save-state]'); if (el) el.textContent = text; }

  function render() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="shell">${topbar()}${view.page === 'home' ? homeView() : formView()}</div>`;
  }

  function topbar() {
    return `<div class="topbar"><div class="toprow"><div class="brand"><div class="bolt"></div><div><h1>Sperin Certificates</h1><p>Electrical · emergency lighting · domestic alarms</p></div></div><div class="spacer"></div><button class="btn small ghost" data-action="backup">Backup</button><button class="btn small ghost" data-action="restore">Restore</button><button class="btn small" data-action="settings">Settings</button></div></div>`;
  }

  function homeView() {
    const completed = state.certificates.filter(c => c.status === 'Complete').length;
    const drafts = state.certificates.filter(c => c.status !== 'Complete').length;
    const cards = Object.entries(SCHEMAS).map(([key, s]) => `<div class="card cert-card"><div class="cert-icon">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><span class="pill">${esc(s.standard)}</span><button class="btn primary" data-action="new" data-type="${key}">Start certificate</button></div>`).join('');
    const rows = state.certificates.length ? state.certificates.map(c => {
      const sch = SCHEMAS[c.type];
      const addr = c.fields.installationAddress || c.fields.premisesAddress || c.fields.clientName || c.fields.premisesName || 'No address entered';
      return `<div class="card draft"><div><div class="draft-title">${sch.icon} ${esc(c.number || sch.name)}</div><div class="draft-sub">${esc(sch.name)} · ${esc(String(addr).replace(/\n/g, ', '))}</div></div><div><span class="pill"><span class="status-dot"></span>${esc(c.status)}</span><div class="draft-sub">Updated ${new Date(c.updatedAt).toLocaleString('en-GB')}</div></div><div class="toolbar"><button class="btn small primary" data-action="edit" data-id="${c.id}">Open</button><button class="btn small" data-action="duplicate" data-id="${c.id}">Duplicate</button><button class="btn small danger" data-action="delete" data-id="${c.id}">Delete</button></div></div>`;
    }).join('') : `<div class="card empty">No certificates yet. Choose a certificate type above to start.</div>`;
    return `<div class="hero"><div class="card hero-main"><div class="eyebrow">Field certification app</div><h2>Complete certificates on-site, save drafts and export PDFs.</h2><p>Entries stay on this device and are autosaved while you work.</p></div><div class="card hero-side"><div><div class="meta">Certificates stored on this device</div><strong>${state.certificates.length}</strong></div><div class="toolbar"><span class="pill">${drafts} draft</span><span class="pill">${completed} complete</span></div></div></div><div class="grid">${cards}</div><div class="section-head"><h2>Saved certificates</h2><div class="meta">Autosaved locally</div></div><div class="list">${rows}</div><div class="footer-note">Independent certificate software. Electrical workflows follow current BS 7671 model-form information; the person signing remains responsible for technical accuracy, inspection, testing and competence.</div>`;
  }

  function formView() {
    const cert = getCurrent(); if (!cert) { view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' }; return homeView(); }
    migrateCertificate(cert);
    if(view.circuitIndex!==null && (cert.type==='eic'||cert.type==='eicr')) return circuitEditorView(cert);
    const schema = SCHEMAS[cert.type];
    const sections = schema.sections.map(part => {
      if(part.type==='section') return renderSection(part,cert);
      if(part.key==='circuits') return renderCircuitList(cert);
      if(part.key==='tests') return '';
      return renderTable(part,cert);
    }).join('');
    const finish = `<section class="card form-section finish-panel"><h3>Finish certificate</h3><div class="finish-actions"><div><strong>Ready to issue?</strong><div class="meta">Saves first, marks complete and creates the PDF.</div></div><button class="btn primary" data-action="complete-pdf">Complete & Create PDF</button></div></section>`;
    return `<div class="form-head"><button class="btn back" data-action="home">← Home</button><div class="form-title"><div class="eyebrow">${esc(schema.standard)}</div><h2>${schema.icon} ${esc(schema.name)}</h2><p>${esc(cert.number)} · ${esc(cert.status)}</p></div><div class="actions"><button class="btn" data-action="status">${cert.status === 'Complete' ? 'Mark draft' : 'Mark complete'}</button><button class="btn" data-action="print">Print</button><button class="btn primary" data-action="pdf">PDF</button></div></div><div class="note warning">Independent certificate layout. Complete only where you are competent and authorised to certify the work.</div>${sections}${finish}<div class="savebar"><div class="savebar-inner"><div class="meta"><span data-save-state>Saved</span> · local device storage</div><button class="btn small" data-action="home">Home</button></div></div>`;
  }

  function fieldVisible(field,cert){
    if(!field.showWhen) return true;
    return String(cert.fields[field.showWhen.key]||'')===String(field.showWhen.value);
  }

  function renderSection(part, cert) {
    const fields = part.fields.filter(field=>fieldVisible(field,cert)).map(field => renderField(field, cert.fields[field.key] ?? '',cert)).join('');
    return `<section class="card form-section"><h3>${esc(part.title)}</h3>${part.note ? `<div class="note">${esc(part.note)}</div>` : ''}<div class="fields">${fields}</div></section>`;
  }

  function renderField(field, value, cert) {
    const span = field.span === 'full' ? 'full' : field.span === 'third' ? 'third' : field.span === 'quarter' ? 'quarter' : '';
    const attrs = `data-field="${esc(field.key)}"`;
    let control = '';
    if(field.type==='checkbox') control=`<label class="checkline compact-check"><input ${attrs} type="checkbox" ${value?'checked':''}/><span>Yes</span></label>`;
    else if (field.type === 'textarea') control = `<textarea ${attrs} placeholder="${esc(field.placeholder || '')}">${esc(value)}</textarea>`;
    else if (field.type === 'select') control = `<select ${attrs}><option value="">Select…</option>${(field.options || []).map(o => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    else control = `<input ${attrs} type="${field.type || 'text'}" value="${esc(value)}" placeholder="${esc(field.placeholder || '')}" />`;
    return `<div class="field ${span}"><label>${esc(field.label)}</label>${control}</div>`;
  }

  function renderCircuitList(cert){
    syncCircuitRows(cert);
    const rows=cert.tables.circuits;
    const cards=rows.map((row,i)=>{
      const test=cert.tables.tests[i]||{};
      const title=row.circuitNo ? `Circuit ${esc(row.circuitNo)}` : `Circuit ${i+1}`;
      const details=[row.description,row.ocpdType&&row.ocpdRating?`${row.ocpdType}${row.ocpdRating} A`:row.ocpdRating?`${row.ocpdRating} A`:'',test.zs?`Zs ${test.zs} Ω`:''].filter(Boolean).join(' · ');
      return `<div class="circuit-card"><button class="circuit-main" data-action="circuit-open" data-index="${i}"><strong>${title}</strong><span>${esc(details||'Tap to enter circuit details')}</span></button><div class="circuit-actions"><button class="btn small" data-action="circuit-duplicate" data-index="${i}">Duplicate</button><button class="btn small" data-action="circuit-copy" data-index="${i}">Copy details</button><button class="btn small danger" data-action="circuit-delete" data-index="${i}">Delete</button></div></div>`;
    }).join('');
    return `<section class="card form-section circuit-list"><h3>Schedule of circuits</h3><div class="circuit-list-body">${cards||'<div class="empty">No circuits added.</div>'}</div><div class="table-tools"><button class="btn primary" data-action="circuit-add">+ Add circuit</button></div></section>`;
  }

  function editorInput(scope,index,field,value){
    const id=`dl-${scope}-${index}-${field.key}`;
    const attrs=`data-circuit-input="${scope}" data-index="${index}" data-col="${field.key}"`;
    let control;
    if(field.textarea) control=`<textarea ${attrs}>${esc(value||'')}</textarea>`;
    else if(field.options) control=`<input ${attrs} list="${id}" value="${esc(value||'')}" autocomplete="off"/><datalist id="${id}">${field.options.map(o=>`<option value="${esc(o)}"></option>`).join('')}</datalist>`;
    else control=`<input ${attrs} value="${esc(value||'')}"/>`;
    const extra=field.suffix==='zs' ? `<button class="btn small" type="button" data-action="circuit-recalc" data-index="${index}">Recalculate</button><div class="meta">Auto for BS EN 60898-1 / 61009-1 B, C or D devices; manual entry remains available.</div>` : '';
    return `<div class="field ${field.span==='full'?'full':''}"><label>${esc(field.label)}</label>${control}${extra}</div>`;
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
      return `<section class="card form-section"><h3>${esc(g.title)}</h3><div class="fields">${g.fields.map(f=>editorInput(step,i,f,source[f.key]??'')).join('')}</div></section>`;
    }).join('');
    const title=`Circuit ${esc(circuit.circuitNo||String(i+1))}`;
    const nav=step==='details'
      ? `<button class="btn primary" data-action="circuit-next">Next · Test results →</button>`
      : `<button class="btn" data-action="circuit-prev">← Circuit details</button><button class="btn primary" data-action="circuit-list">Save circuit</button>`;
    return `<div class="form-head circuit-head"><button class="btn back" data-action="circuit-list">← Circuits</button><div class="form-title"><div class="eyebrow">${step==='details'?'1 of 2 · Circuit details':'2 of 2 · Test results'}</div><h2>${title}</h2><p>${esc(circuit.description||'')}</p></div><div class="actions"><span class="pill"><span data-save-state>Saved</span></span></div></div>${groups}<div class="circuit-page-nav">${nav}</div><div class="savebar"><div class="savebar-inner"><div class="meta"><span data-save-state>Saved</span> · circuit autosaved</div><button class="btn small" data-action="circuit-list">Circuits</button></div></div>`;
  }

  function renderTable(part, cert) {
    const rows = cert.tables[part.key] || [];
    const head = part.columns.map(c => `<th>${esc(c.label)}</th>`).join('') + `<th></th>`;
    const body = rows.map((row, ri) => `<tr>${part.columns.map(c => `<td>${renderTableControl(part.key, ri, c, row[c.key] ?? '')}</td>`).join('')}<td><button class="btn small danger" data-action="row-delete" data-table="${part.key}" data-row="${ri}">×</button></td></tr>`).join('');
    return `<section class="card form-section"><h3>${esc(part.title)}</h3><div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><div class="table-tools"><button class="btn small" data-action="row-add" data-table="${part.key}">+ Add row</button></div></section>`;
  }

  function renderTableControl(tableKey, rowIndex, col, value) {
    if (col.readonly) return `<span>${esc(value)}</span>`;
    const attrs = `data-table-input="${tableKey}" data-row="${rowIndex}" data-col="${col.key}"`;
    if (col.type === 'select') return `<select ${attrs}><option value=""></option>${(col.options || []).map(o => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    return `<input ${attrs} value="${esc(value)}" />`;
  }

  function openSettings() {
    const html = `<div class="modal-backdrop" data-action="close-modal"><div class="card modal" data-modal><h2>Company & engineer defaults</h2><div class="settings-grid">${Object.entries({companyName:'Company name',engineerName:'Default engineer name',address:'Business address',postcode:'Postcode',phone:'Phone',email:'Email',registration:'Registration / scheme no. (optional)',qualification:'Qualifications / role'}).map(([k,l]) => `<div class="field ${k==='address'?'full':''}"><label>${l}</label>${k==='address'?`<textarea data-setting="${k}">${esc(settings[k])}</textarea>`:`<input data-setting="${k}" value="${esc(settings[k])}" />`}</div>`).join('')}</div><div class="note">Leave scheme / registration details blank unless they are current and you are entitled to use them. These defaults are inserted only into new certificates.</div><div class="toolbar" style="margin-top:14px"><button class="btn primary" data-action="save-settings">Save settings</button><button class="btn" data-action="close-modal">Close</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }

  function backup() {
    const payload = { version: VERSION, exportedAt: new Date().toISOString(), settings, certificates: state.certificates };
    downloadBlob(JSON.stringify(payload, null, 2), `sperin-certificates-backup-${TODAY}.json`, 'application/json');
    toast('Backup downloaded');
  }

  function restore() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!Array.isArray(data.certificates)) throw new Error('Not a Sperin Certificates backup');
          state = { certificates: data.certificates };
          if (data.settings) settings = { ...settings, ...data.settings };
          persist(); saveSettings(); render(); toast('Backup restored');
        } catch (err) { alert(`Could not restore backup: ${err.message}`); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function printCertificate() { window.print(); }

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

  async function downloadPDF() {
    const cert = getCurrent(); if (!cert) return;
    syncSingleSignatory(cert); persist();
    const schema = SCHEMAS[cert.type];
    const jsPDFCtor = window.jspdf?.jsPDF;
    if (!jsPDFCtor || typeof (new jsPDFCtor()).autoTable !== 'function') {
      alert('The direct PDF library is not available right now. The print-to-PDF screen will open instead. Choose “Save as PDF”.');
      window.print(); return;
    }
    try {
      const doc = new jsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      let orientation='portrait', y=30;
      pdfHeader(doc, schema, cert);
      const newPage=(o=orientation)=>{doc.addPage('a4',o);orientation=o;pdfHeader(doc,schema,cert);y=30;};
      const ensureSpace=(need=25)=>{const h=doc.internal.pageSize.getHeight();if(y+need>h-18)newPage(orientation);};
      const addSectionTitle=title=>{ensureSpace(12);const w=doc.internal.pageSize.getWidth();doc.setFillColor(235,242,250);doc.rect(12,y-5,w-24,8,'F');doc.setFont('helvetica','bold');doc.setTextColor(20,40,62);doc.setFontSize(9);doc.text(title,14,y);doc.setTextColor(20,28,38);y+=6;};
      const backToPortrait=()=>{if(orientation!=='portrait')newPage('portrait');};

      schema.sections.forEach(part => {
        if (part.type === 'section') {
          backToPortrait();
          const visible=part.fields.filter(field=>fieldVisible(field,cert)).filter(field=>hasPdfValue(field,cert.fields[field.key]));
          if(!visible.length) return;
          addSectionTitle(part.title);
          const body=visible.map(field=>[field.label,formatPdfValue(field,cert.fields[field.key])]);
          doc.autoTable({ startY:y, head:[], body, margin:{left:12,right:12,top:30,bottom:16}, theme:'grid', styles:{fontSize:7.7,cellPadding:1.8,textColor:[25,33,43],lineColor:[205,214,225],lineWidth:.12}, columnStyles:{0:{cellWidth:62,fontStyle:'bold',fillColor:[248,250,252]},1:{cellWidth:124}}, didDrawPage:()=>pdfHeader(doc,schema,cert) });
          y=doc.lastAutoTable.finalY+6;
        } else if(part.type==='table') {
          const rows=(cert.tables[part.key]||[]).filter(row=>Object.values(row).some(v=>v!==undefined&&v!==null&&String(v).trim()!==''));
          if(!rows.length) return;
          const schedule=part.key==='circuits'||part.key==='tests';
          if(schedule){newPage('landscape');} else backToPortrait();
          addSectionTitle(part.title);
          const head=[part.columns.map(c=>c.label)], body=rows.map(row=>part.columns.map(c=>String(row[c.key]??'')));
          doc.autoTable({startY:y,head,body,margin:{left:8,right:8,top:30,bottom:16},theme:'grid',
            styles:{fontSize:schedule?6.5:(part.columns.length>8?5.7:7),cellPadding:schedule?1.5:1.3,overflow:'linebreak',lineColor:[195,205,216],lineWidth:.12},
            headStyles:{fillColor:[20,55,92],textColor:[255,255,255],fontStyle:'bold'},
            didDrawPage:()=>pdfHeader(doc,schema,cert)});
          y=doc.lastAutoTable.finalY+6;
        }
      });
      backToPortrait();
      ensureSpace(16);
      doc.setFontSize(7.2); doc.setTextColor(80);
      doc.text('Independent certificate record. Technical accuracy and competence remain the responsibility of the person(s) signing the certificate.',12,y,{maxWidth:186});
      pdfFooter(doc);
      doc.save(`${pdfSafeName(cert)}.pdf`);
      toast('PDF created');
    } catch (err) {
      console.error(err); alert('PDF generation hit an error. The print-to-PDF screen will open instead.'); window.print();
    }
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

  document.addEventListener('input', e => {
    const cert = getCurrent();
    if (e.target.matches('[data-field]') && cert) {
      const key=e.target.dataset.field;
      cert.fields[key]=e.target.type==='checkbox' ? e.target.checked : e.target.value;
      if(key==='certificateNo') cert.number=e.target.value;
      if(key==='signatoryMode'||key.startsWith('singleSignatory')) syncSingleSignatory(cert);
      scheduleAutosave();
    }
    if (e.target.matches('[data-table-input]') && cert) {
      const { tableInput, row, col } = e.target.dataset; const ri = Number(row);
      if (!cert.tables[tableInput]) cert.tables[tableInput] = [];
      if (!cert.tables[tableInput][ri]) cert.tables[tableInput][ri] = {};
      cert.tables[tableInput][ri][col] = e.target.value; scheduleAutosave();
    }
    if(e.target.matches('[data-circuit-input]')&&cert){
      const scope=e.target.dataset.circuitInput, i=Number(e.target.dataset.index), col=e.target.dataset.col;
      syncCircuitRows(cert);
      const target=scope==='details'?cert.tables.circuits[i]:cert.tables.tests[i];
      target[col]=e.target.value;
      if(scope==='details'){
        if(col==='maxZs') target.maxZsManual=true;
        if(['ocpdBs','ocpdType','ocpdRating'].includes(col)) recalculateCircuitZs(cert,i);
        if(col==='circuitNo') cert.tables.tests[i].circuitNo=e.target.value;
      }
      scheduleAutosave();
    }
    if (e.target.matches('[data-setting]')) settings[e.target.dataset.setting] = e.target.value;
  });

  document.addEventListener('change', e => {
    if (e.target.matches('[data-field],[data-table-input],[data-circuit-input]')) {
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
      if(e.target.matches('[data-field="signatoryMode"]')){
        const y=window.scrollY; render(); requestAnimationFrame(()=>window.scrollTo(0,y));
      }
    }
  });

  document.addEventListener('click', e => {
    const button = e.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    const cert=getCurrent();
    if (action === 'new') newCertificate(button.dataset.type);
    else if (action === 'edit') { view = { page: 'form', currentId: button.dataset.id, circuitIndex:null, circuitStep:'details' }; render(); goTop(); }
    else if (action === 'duplicate') duplicateCertificate(button.dataset.id);
    else if (action === 'delete') deleteCertificate(button.dataset.id);
    else if (action === 'home') { persist(); view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' }; render(); goTop(); }
    else if (action === 'pdf') downloadPDF();
    else if (action === 'complete-pdf') { if(cert){cert.status='Complete';syncSingleSignatory(cert);persist();render();downloadPDF();} }
    else if (action === 'print') printCertificate();
    else if (action === 'status') { if (cert) { cert.status = cert.status === 'Complete' ? 'Draft' : 'Complete'; persist(); render(); toast(`Marked ${cert.status.toLowerCase()}`); } }
    else if(action==='circuit-open' && cert){view.circuitIndex=Number(button.dataset.index);view.circuitStep='details';persist();render();goTop();}
    else if(action==='circuit-add' && cert){
      syncCircuitRows(cert);const no=nextCircuitNumber(cert);
      cert.tables.circuits.push({circuitNo:no});cert.tables.tests.push({circuitNo:no});
      view.circuitIndex=cert.tables.circuits.length-1;view.circuitStep='details';persist();render();goTop();
    }
    else if(action==='circuit-duplicate' && cert){
      syncCircuitRows(cert);const i=Number(button.dataset.index),no=nextCircuitNumber(cert);
      const c=clone(cert.tables.circuits[i]||{}),t=clone(cert.tables.tests[i]||{});c.circuitNo=no;t.circuitNo=no;
      cert.tables.circuits.push(c);cert.tables.tests.push(t);view.circuitIndex=cert.tables.circuits.length-1;view.circuitStep='details';persist();render();goTop();
    }
    else if(action==='circuit-copy' && cert){
      syncCircuitRows(cert);const i=Number(button.dataset.index),no=nextCircuitNumber(cert);
      const c=clone(cert.tables.circuits[i]||{});c.circuitNo=no;c.maxZsManual=false;cert.tables.circuits.push(c);cert.tables.tests.push({circuitNo:no});
      view.circuitIndex=cert.tables.circuits.length-1;view.circuitStep='details';persist();render();goTop();
    }
    else if(action==='circuit-delete' && cert){
      const i=Number(button.dataset.index);if(confirm('Delete this circuit and its test results?')){syncCircuitRows(cert);cert.tables.circuits.splice(i,1);cert.tables.tests.splice(i,1);persist();render();}
    }
    else if(action==='circuit-next' && cert){persist();view.circuitStep='tests';render();goTop();}
    else if(action==='circuit-prev' && cert){persist();view.circuitStep='details';render();goTop();}
    else if(action==='circuit-list' && cert){persist();view.circuitIndex=null;view.circuitStep='details';render();goTop();}
    else if(action==='circuit-recalc' && cert){const i=Number(button.dataset.index);recalculateCircuitZs(cert,i,true);persist();render();}
    else if (action === 'row-add') { if (!cert) return; const key = button.dataset.table; cert.tables[key] = cert.tables[key] || []; cert.tables[key].push({}); persist(); render(); }
    else if (action === 'row-delete') { if (!cert) return; const key = button.dataset.table; const ri = Number(button.dataset.row); cert.tables[key].splice(ri, 1); persist(); render(); }
    else if (action === 'settings') openSettings();
    else if (action === 'save-settings') { saveSettings(); closeModal(); toast('Settings saved'); }
    else if (action === 'close-modal') { if (e.target === button || button.tagName === 'BUTTON') closeModal(); }
    else if (action === 'backup') backup();
    else if (action === 'restore') restore();
  });

  setInterval(()=>{ if(state.certificates.length) persist(); },30000);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') persist(); });
  window.addEventListener('pagehide',persist);
  window.addEventListener('beforeunload',persist);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  render();
})();
