(() => {
  'use strict';

  const STORAGE_KEY = 'sperin-certificates-data-v1';
  const SETTINGS_KEY = 'sperin-certificates-settings-v1';
  const VERSION = '1.5.0';
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
    testerFunction: ['Multifunction', 'Low resistance ohmmeter', 'Insulation resistance', 'Earth fault loop impedance (Zs)', 'RCD', 'Earth electrode resistance', 'Voltage indicator', 'Other'],
    nominalVoltage: ['230', '230/400', '400/230', '400', 'Other'],
    frequency: ['50', '60', 'Other'],
    breakingCapacity: ['3', '4.5', '6', '10', '16', '25', '36', '50', 'Other'],
    conductorCsa: ['1', '1.5', '2.5', '4', '6', '10', '16', '25', '35', '50', '70', '95', '120', '150', '185', '240', 'Other'],
    conductorMaterial: ['Copper', 'Aluminium', 'Other'],
    poles: ['1', '2', '3', '4'],
    rcdIdn: ['10', '30', '100', '300', '500', 'Other'],
    earthElectrodeType: ['Rod', 'Tape', 'Plate', 'Foundation earth electrode', 'Mesh', 'Other'],
    supplyDeviceBs: ['BS 88-2', 'BS 1361', 'BS EN 60898-1', 'BS EN 60947-2', 'BS EN 61009-1', 'Other'],
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
    { key: 'ocpdBs', label: 'OCPD BS (EN)', type: 'select', options: OPTIONS.ocpdBs },
    { key: 'ocpdType', label: 'OCPD type', type: 'select', options: OPTIONS.ocpdType },
    { key: 'ocpdRating', label: 'Rating A', type: 'select', options: OPTIONS.ocpdRating },
    { key: 'breakingCapacity', label: 'Breaking kA', type: 'select', options: OPTIONS.breakingCapacity },
    { key: 'maxZs', label: 'Max Zs Ω' },
    { key: 'rcdBs', label: 'RCD BS (EN)', type: 'select', options: ['BS EN 61008-1','BS EN 61009-1','Other'] },
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
      { key:'circuitNo', label:'Circuit number' },
      { key:'description', label:'Circuit description', span:'full' },
      { key:'wiringType', label:'Type of wiring', options:OPTIONS.wiringType },
      { key:'refMethod', label:'Reference method', options:OPTIONS.refMethod },
      { key:'points', label:'Number of points served' },
      { key:'liveCsa', label:'Live conductor csa (mm²)', options:OPTIONS.conductorCsa },
      { key:'cpcCsa', label:'CPC csa (mm²)', options:OPTIONS.conductorCsa }
    ]},
    { title: 'Overcurrent protective device', fields: [
      { key:'ocpdBs', label:'BS (EN)', options:OPTIONS.ocpdBs },
      { key:'ocpdType', label:'Type / curve', options:OPTIONS.ocpdType },
      { key:'ocpdRating', label:'Rating (A)', options:OPTIONS.ocpdRating },
      { key:'breakingCapacity', label:'Breaking capacity (kA)', options:OPTIONS.breakingCapacity },
      { key:'maxZs', label:'Maximum permitted Zs (Ω)', suffix:'zs' }
    ]},
    { title: 'RCD', fields: [
      { key:'rcdBs', label:'BS (EN)', options:['BS EN 61008-1','BS EN 61009-1','Other'] },
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
    cert.tables.circuits=cert.tables.circuits.map(row=>isRecord(row)?row:{});
    cert.tables.tests=cert.tables.tests.map(row=>isRecord(row)?row:{});
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
          if(!(field.key in cert.fields)) cert.fields[field.key]=defaultFor(field);
        });
      } else if(part.type==='table'){
        let rows=Array.isArray(cert.tables[part.key]) ? cert.tables[part.key] : [];
        rows=rows.filter(isRecord).map(row=>({...row}));
        if(!rows.length && Array.isArray(part.defaultRows) && part.defaultRows.length) rows=clone(part.defaultRows);
        cert.tables[part.key]=rows;
      }
    });

    if(!cert.number) cert.number=cert.fields.certificateNo || '';
    if(!cert.fields.certificateNo && cert.number) cert.fields.certificateNo=cert.number;
    return cert;
  }

  function migrateCertificate(cert) {
    cert = normaliseCertificateShape(cert);
    if(!cert) return null;
    cert.fields = isRecord(cert.fields) ? cert.fields : {};
    cert.tables = isRecord(cert.tables) ? cert.tables : {};
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

  function goCircuits() {
    requestAnimationFrame(()=>{
      const target=document.querySelector('.circuit-list');
      if(target) target.scrollIntoView({behavior:'auto',block:'start'});
    });
  }

  const eicInspectionRows = [
    ['1.1', 'Incoming supply equipment visually checked; no obvious damage or overheating'],
    ['1.2', 'Earthing arrangement identified and recorded'],
    ['1.3', 'Meter tails / consumer conductors correctly sized, routed and terminated'],
    ['1.4', 'Other or alternative sources of supply identified and safely integrated where applicable'],
    ['2.1', 'Main earthing conductor present, correctly sized and securely connected'],
    ['2.2', 'Main protective bonding provided where required and correctly sized'],
    ['2.3', 'Main earthing terminal accessible and connections secure'],
    ['2.4', 'Earthing / bonding identification and labels provided where required'],
    ['3.1', 'Consumer unit / distribution board securely fixed and suitably located'],
    ['3.2', 'Enclosure provides suitable IP protection and appropriate fire performance'],
    ['3.3', 'Main switch / linked isolation provided and operates correctly'],
    ['3.4', 'Protective devices compatible with the board and correctly rated for the circuits'],
    ['3.5', 'Circuit identification / schedule is complete, legible and matches installed circuits'],
    ['3.6', 'RCD / RCBO protection provided where required and devices operate correctly'],
    ['3.7', 'SPD provided where required / selected risk assessment recorded, and status indication satisfactory'],
    ['3.8', 'AFDDs provided where required or selected, and manual status/test indication satisfactory'],
    ['3.9', 'Required warning, test and identification labels are fitted and legible'],
    ['3.10', 'Internal conductors correctly located in terminals; connections secure with no exposed copper'],
    ['4.1', 'Circuit conductors are correctly identified throughout the installation'],
    ['4.2', 'Cable type, conductor size and installation method are suitable for load and external influences'],
    ['4.3', 'Cables are adequately supported and protected against mechanical damage'],
    ['4.4', 'Concealed cables are in permitted zones or otherwise suitably protected'],
    ['4.5', 'Protective conductor / CPC provided and continuous throughout each circuit'],
    ['4.6', 'Overcurrent protection is correctly coordinated with conductor current-carrying capacity'],
    ['4.7', '30 mA additional RCD protection is provided where required'],
    ['4.8', 'Fire stopping / sealing is maintained where wiring passes through fire-resisting construction'],
    ['4.9', 'Segregation from other voltage bands, communications and non-electrical services is adequate'],
    ['4.10', 'Cable entries, glands, bushes and terminations provide suitable mechanical and IP protection'],
    ['5.1', 'Accessories and enclosures are securely fixed and suitable for the environment'],
    ['5.2', 'Switches / protective devices interrupt the line conductor as required'],
    ['5.3', 'Socket-outlets, switches and connection units show no damage or exposed live parts'],
    ['5.4', 'Permanently connected equipment has suitable local isolation where required'],
    ['5.5', 'Equipment ratings, connection methods and manufacturer requirements are satisfied'],
    ['6.1', 'Polarity verified throughout the installation'],
    ['6.2', 'Continuity of protective conductors and bonding verified'],
    ['6.3', 'Insulation resistance testing completed with satisfactory results'],
    ['6.4', 'Earth fault loop impedance results are within permitted values'],
    ['6.5', 'RCD operating times / functional tests completed where applicable'],
    ['6.6', 'Prospective fault current and protective-device breaking capacity are compatible'],
    ['6.7', 'Phase sequence verified where applicable'],
    ['7.1', 'Bath / shower locations comply with zoning, IP and additional-protection requirements where applicable'],
    ['7.2', 'Other special installations / locations have been checked against the applicable Part 7 requirements'],
    ['8.1', 'Required drawings, schedules, circuit information and user instructions are complete / handed over'],
    ['8.2', 'Any permitted departures, exceptions or design risk assessments are recorded on the certificate'],
    ['8.3', 'Installation is suitable to be energised and the completed work has been inspected and tested']
  ].map(([item, description]) => ({ item, description, outcome: '', comment: '' }));

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
        section('G · Installation particulars', [select('meansOfEarthing', 'Means of earthing', ['Distributor’s facility', 'Installation earth electrode', 'Both', 'Other']), f('maximumDemand', 'Maximum demand'), select('maximumDemandUnit', 'Maximum demand unit', ['A', 'kVA']), select('earthElectrodeType', 'Earth electrode type', OPTIONS.earthElectrodeType), f('earthElectrodeLocation', 'Earth electrode location'), f('earthElectrodeResistance', 'Electrode resistance/impedance (Ω)'), select('earthingConductorMaterial', 'Earthing conductor material', OPTIONS.conductorMaterial), select('earthingConductorCsa', 'Earthing conductor csa (mm²)', OPTIONS.conductorCsa), select('earthingContinuity', 'Earthing conductor continuity verified', OPTIONS.yesNoNA), select('bondingMaterial', 'Main bonding conductor material', OPTIONS.conductorMaterial), select('bondingCsa', 'Main bonding conductor csa (mm²)', OPTIONS.conductorCsa), select('bondingContinuity', 'Bonding continuity verified', OPTIONS.yesNoNA), f('bondingTo', 'Main bonding to (water/gas/oil/steel/LPS/other)', 'text', { span: 'full' }), f('mainSwitchLocation', 'Main switch location'), f('mainSwitchBs', 'Main switch BS (EN)'), select('mainSwitchPoles', 'No. of poles', OPTIONS.poles), select('mainSwitchCurrent', 'Current rating (A)', OPTIONS.ocpdRating), select('mainSwitchVoltage', 'Voltage rating (V)', OPTIONS.nominalVoltage), select('mainSwitchDeviceType', 'Overcurrent device type / setting', OPTIONS.ocpdType), select('mainSwitchBreaking', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), select('mainRcdType', 'RCD main switch type', OPTIONS.rcdType), select('mainRcdIdn', 'RCD IΔn (mA)', OPTIONS.rcdIdn), f('mainRcdDelay', 'RCD time delay (ms)'), f('mainRcdTime', 'Measured operating time (ms)')]),
        table('eicInspection', 'H · Installation inspection checklist', [
          { key: 'item', label: 'Item', readonly: true },
          { key: 'description', label: 'Check', readonly: true },
          { key: 'outcome', label: 'Result', type: 'select', options: OPTIONS.passNA },
          { key: 'comment', label: 'Comment / N/A reason' }
        ], eicInspectionRows),
        section('I · Existing installation comments', [f('existingComments', 'Comments on existing installation (for additions/alterations)', 'textarea', { span: 'full' })]),
        section('J · Schedule details', [f('dbReference', 'DB/CU reference'), f('dbLocation', 'DB/CU location'), f('suppliedFrom', 'Supplied from'), f('distributionOcpd', 'Distribution circuit OCPD'), f('dbRcd', 'DB RCD details'), select('dbSpd', 'SPD details / type(s)', OPTIONS.spdType), f('zdb', 'Zdb (Ω)'), f('dbIpf', 'DB Ipf (kA)'), select('dbPolarity', 'Correct polarity confirmed', OPTIONS.yesNoNA), select('phaseSequence', 'Phase sequence confirmed', OPTIONS.yesNoNA), select('spdOperational', 'SPD operational status confirmed', OPTIONS.yesNoNA)]),
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
        section('A · Person ordering the report', [f('clientName', 'Name', 'text', { span: 'full' }), f('clientPostcode', 'Postcode'), f('clientAddress', 'Address', 'textarea', { span: 'full' }), f('certificateNo', 'Report number'), f('issueDate', 'Report issue date', 'date')]),
        section('B · Reason for producing this report', [f('reason', 'Reason for report', 'textarea', { span: 'full' }), f('inspectionDates', 'Date(s) inspection and testing carried out', 'text', { span: 'full' })]),
        section('C · Installation details', [f('occupier', 'Occupier'), f('installationPostcode', 'Installation postcode'), f('installationAddress', 'Installation address', 'textarea', { span: 'full' }), select('premisesType', 'Description of premises', OPTIONS.premises), f('premisesOther', 'Other description'), f('age', 'Estimated age of wiring system (years)'), select('additionsEvidence', 'Evidence of additions/alterations', ['Yes', 'Not apparent']), f('additionsAge', 'If yes, estimated age (years)'), select('recordsAvailable', 'Installation records available', OPTIONS.yesNo), f('lastInspection', 'Date of last inspection', 'date')]),
        section('D · Extent & limitations', [f('extentInspected', 'Parts of installation inspected and tested', 'textarea', { span: 'full' }), f('agreedLimitations', 'Agreed limitations including reasons', 'textarea', { span: 'full' }), f('agreedWith', 'Agreed with'), f('operationalLimitations', 'Operational limitations and reasons', 'textarea', { span: 'full' }), f('standardAmendedTo', 'Inspection carried out to BS 7671 amended to', 'text', { placeholder: 'A4:2026' })]),
        section('E · Summary of condition', [select('overallAssessment', 'Overall assessment', OPTIONS.overall), f('generalCondition', 'General condition of the installation (electrical safety)', 'textarea', { span: 'full' })]),
        section('F · Recommendation for next inspection', [f('nextInspectionDate', 'Further inspection recommended before', 'date'), f('nextInspectionReason', 'Reason for recommended interval', 'textarea', { span: 'full' })]),
        section('G · Declaration', [f('inspectedBy', 'Inspected and tested by'), f('inspectorPosition', 'Position'), f('inspectorCompany', 'For/on behalf of'), f('inspectorAddress', 'Inspector address', 'textarea'), f('inspectorSignature', 'Inspector signature / typed name'), f('inspectorDate', 'Inspector date', 'date'), f('authorisedBy', 'Report authorised for issue by'), f('authoriserPosition', 'Authoriser position'), f('authoriserCompany', 'For/on behalf of'), f('authoriserAddress', 'Authoriser address', 'textarea'), f('authoriserSignature', 'Authoriser signature / typed name'), f('authoriserDate', 'Authoriser date', 'date')]),
        section('H · Schedules attached', [f('continuationSheets', 'Continuation sheets / sections'), f('inspectionSchedules', 'No. of inspection schedules'), f('circuitSchedules', 'No. of circuit/test schedules')]),
        section('I · Supply characteristics & earthing', [select('earthingArrangement', 'Earthing arrangement', OPTIONS.earthing), select('liveConductors', 'Number/type of live conductors', OPTIONS.liveConductors), select('supplyACDC', 'Supply', OPTIONS.acdc), select('nominalVoltage', 'Nominal voltage U/U0 (V)', OPTIONS.nominalVoltage), select('frequency', 'Nominal frequency (Hz)', OPTIONS.frequency), f('ipf', 'Prospective fault current Ipf (kA)'), f('ze', 'External earth fault loop impedance Ze (Ω)'), select('supplyDeviceBs', 'Supply protective device BS (EN)', OPTIONS.supplyDeviceBs), select('supplyDeviceType', 'Supply protective device type', OPTIONS.ocpdType), select('supplyDeviceRating', 'Rated current (A)', OPTIONS.ocpdRating), select('supplyBreakingCapacity', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), select('supplyPolarity', 'Supply polarity confirmed', OPTIONS.yesNoNA), select('otherSources', 'Other sources of supply present', OPTIONS.yesNo)]),
        section('J · Installation particulars', [select('meansOfEarthing', 'Means of earthing', ['Distributor’s facility', 'Installation earth electrode', 'Both', 'Other']), f('maximumDemand', 'Maximum demand'), f('maximumDemandUnit', 'Unit', 'select', { options: ['A', 'kVA'] }), select('earthElectrodeType', 'Earth electrode type', OPTIONS.earthElectrodeType), f('earthElectrodeLocation', 'Earth electrode location'), f('earthElectrodeResistance', 'Electrode resistance/impedance (Ω)'), select('earthingConductorMaterial', 'Earthing conductor material', OPTIONS.conductorMaterial), select('earthingConductorCsa', 'Earthing conductor csa (mm²)', OPTIONS.conductorCsa), select('earthingContinuity', 'Earthing conductor continuity verified', OPTIONS.yesNoNA), select('bondingMaterial', 'Main bonding conductor material', OPTIONS.conductorMaterial), select('bondingCsa', 'Main bonding conductor csa (mm²)', OPTIONS.conductorCsa), select('bondingContinuity', 'Bonding continuity verified', OPTIONS.yesNoNA), f('bondingTo', 'Main protective bonding to', 'text', { span: 'full' }), f('mainSwitchLocation', 'Main switch location'), f('mainSwitchBs', 'Main switch BS (EN)'), select('mainSwitchPoles', 'No. of poles', OPTIONS.poles), select('mainSwitchCurrent', 'Current rating (A)', OPTIONS.ocpdRating), select('mainSwitchVoltage', 'Voltage rating (V)', OPTIONS.nominalVoltage), select('mainSwitchDeviceType', 'Overcurrent device type / setting', OPTIONS.ocpdType), select('mainSwitchBreaking', 'Breaking capacity (kA)', OPTIONS.breakingCapacity), select('mainRcdType', 'RCD main switch type', OPTIONS.rcdType), select('mainRcdIdn', 'RCD IΔn (mA)', OPTIONS.rcdIdn), f('mainRcdDelay', 'RCD time delay (ms)'), f('mainRcdTime', 'Measured operating time (ms)')]),
        table('observations', 'K · Observations', [
          { key: 'item', label: 'Item' }, { key: 'observation', label: 'Observation / defect' }, { key: 'code', label: 'Code', type: 'select', options: OPTIONS.observationCode }, { key: 'scheduleRef', label: 'Schedule ref.' }
        ], [{ item: '1' }]),
        table('eicrInspection', 'Condition report schedule of inspection', [
          { key: 'item', label: 'Item', readonly: true }, { key: 'description', label: 'Description', readonly: true }, { key: 'outcome', label: 'Outcome', type: 'select', options: OPTIONS.eicrOutcome }, { key: 'comment', label: 'Comment' }
        ], eicrInspectionRows),
        section('Circuit schedule header', [f('dbReference', 'DB/CU reference'), f('dbLocation', 'DB/CU location'), f('suppliedFrom', 'Supplied from'), f('distributionOcpd', 'Distribution circuit OCPD'), f('dbRcd', 'DB RCD details'), select('dbSpd', 'SPD details / type(s)', OPTIONS.spdType), f('zdb', 'Zdb (Ω)'), f('dbIpf', 'DB Ipf (kA)'), select('dbPolarity', 'Correct polarity confirmed', OPTIONS.yesNoNA), select('phaseSequence', 'Phase sequence confirmed', OPTIONS.yesNoNA), select('spdOperational', 'SPD operational status confirmed', OPTIONS.yesNoNA)]),
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
        section('A · Description of the minor works', [f('certificateNo', 'Certificate number'), f('clientName', 'Client details', 'text', { span: 'full' }), f('completionDate', 'Date minor works completed', 'date'), f('installationPostcode', 'Installation postcode'), f('installationAddress', 'Installation location/address', 'textarea', { span: 'full' }), f('description', 'Description of minor works', 'textarea', { span: 'full' }), f('departures', 'Departures from BS 7671', 'textarea', { span: 'full' }), f('permittedExceptions', 'Permitted exceptions / risk assessment details', 'textarea', { span: 'full' }), select('riskAssessmentAttached', 'Risk assessment attached', OPTIONS.yesNoNA), f('existingDefects', 'Comments / defects observed in existing installation', 'textarea', { span: 'full' })]),
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

  let settings = loadSettings();
  let state = loadState();
  let view = { page: 'home', currentId: null, circuitIndex: null, circuitStep: 'details' };
  let autosaveTimer = null;

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

  function loadSettings() {
    const defaults = {
      companyName: 'Sperin Services', engineerName: '', engineerPosition: 'Electrician / Inspector',
      address: '', postcode: '', phone: '', email: '', registration: '',
      qualification: 'C&G 2391 / 18th Edition', defaultStandard: 'BS 7671:2018+A4:2026',
      testerMake: '', testerModel: '', testerSerial: '', testerCalibrationDue: '',
      postcodeApiKey: ''
    };
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

  function saveNow() {
    clearTimeout(autosaveTimer);
    persist();
    updateSaveState('Saved');
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

  function openCertificate(id) {
    const cert=state.certificates.find(c=>c.id===id);
    if(!cert){toast('Certificate not found');return;}
    try {
      const migrated=migrateCertificate(cert);
      if(!migrated) throw new Error('Unsupported certificate format');
      view = { page: 'form', currentId: migrated.id, circuitIndex:null, circuitStep:'details' };
      persist();
      render();
      goTop();
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
    persist();
    render(); goTop();
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
    const root = document.getElementById('app');
    try {
      root.innerHTML = `<div class="shell">${topbar()}${view.page === 'home' ? homeView() : formView()}</div>`;
      requestAnimationFrame(()=>{ try { decorateVoiceUI(); } catch(err) { console.error('Voice UI decoration failed',err); } });
    } catch(err) {
      console.error('Certificate render failed',err);
      view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' };
      root.innerHTML = `<div class="shell">${topbar()}<div class="card app-error"><h2>Certificate could not be opened</h2><p>A saved item contained older or damaged data. Your certificates have not been deleted.</p><button class="btn primary" data-action="home">Return to saved certificates</button></div></div>`;
    }
  }

  function uiIcon(name) {
    const icons={
      home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
      user:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>',
      mic:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></svg>',
      pdf:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M8 15h8M8 18h6"/></svg>',
      shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.8 3 8.2 7.5 9.5 4.5-1.3 7.5-4.7 7.5-9.5V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
      backup:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 14v6h14v-6"/></svg>',
      chevron:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
    };
    return icons[name]||icons.chevron;
  }

  function topbar() {
    return `<div class="topbar"><div class="toprow"><button class="brand brand-home" data-action="home" aria-label="Sperin Certificates home"><div class="brand-mark"><span class="bolt"></span></div><div><h1>Sperin Certificates</h1><p>Survey · certify · save · issue</p></div></button><div class="spacer"></div><button class="btn small ghost top-action" data-action="backup">${uiIcon('backup')}<span>Backup</span></button><button class="btn small ghost top-action" data-action="restore"><span>↻</span><span>Restore</span></button><button class="btn small top-action" data-action="settings">${uiIcon('user')}<span>Profile</span></button></div></div>`;
  }

  function homeView() {
    const completed = state.certificates.filter(c => c.status === 'Complete').length;
    const drafts = state.certificates.filter(c => c.status !== 'Complete').length;
    const typeIcons={eic:'⚡',eicr:'⌕',minor:'✓',emergency:'↗',smoke:'◉'};
    const cards = Object.entries(SCHEMAS).map(([key, s]) => `<button class="cert-launch" data-action="new" data-type="${key}"><span class="cert-launch-icon">${typeIcons[key]||s.icon}</span><span><strong>${esc(s.name)}</strong><small>${esc(s.description)}</small></span><span class="cert-launch-arrow">›</span></button>`).join('');
    const rows = state.certificates.length ? state.certificates.map(c => {
      const sch = SCHEMAS[c.type] || {icon:'📄',name:'Certificate'};
      const fields=isRecord(c.fields)?c.fields:{};
      const customer=fields.clientName || fields.customerName || fields.personOrdering || fields.occupier || fields.responsiblePerson || fields.premisesName || 'Customer name not entered';
      const address=fields.installationAddress || fields.premisesAddress || fields.clientAddress || fields.siteAddress || fields.address || 'Address not entered';
      const date=fields.issueDate || fields.completionDate || fields.inspectorDate || fields.declarationDate || String(c.updatedAt||'').slice(0,10);
      return `<div class="saved-cert-row" data-action="edit" data-id="${esc(c.id)}" role="button" tabindex="0" aria-label="Open ${esc(customer)} certificate">
        <div class="saved-cert-accent">${sch.icon}</div>
        <div class="saved-cert-copy"><strong>${esc(customer)}</strong><span>${esc(String(address).replace(/\n/g, ', '))}</span><small>${esc(sch.name)} · ${esc(c.number || '')}</small></div>
        <div class="saved-cert-date"><strong>${esc(fmtDate(date))}</strong><span class="pill"><span class="status-dot"></span>${esc(c.status)}</span></div>
        <div class="saved-cert-actions"><button class="btn" data-action="duplicate" data-id="${esc(c.id)}">Duplicate</button><button class="btn danger" data-action="delete" data-id="${esc(c.id)}">Delete</button></div>
      </div>`;
    }).join('') : `<div class="home-empty"><span>＋</span><strong>No certificates yet</strong><p>Choose a certificate type above to start your first record.</p></div>`;
    const recent=state.certificates[0];
    const recentName=recent ? (recent.fields?.clientName||recent.fields?.occupier||recent.fields?.premisesName||'Recent certificate') : '';
    return `<main class="home-page">
      <section class="home-hero">
        <div class="home-hero-copy"><div class="eyebrow">SPERIN CERTIFICATES</div><h2>Professional electrical certification, built for work on site.</h2><p>Complete certificates, dictate answers, test circuits, autosave every change and issue a finished PDF from one app.</p>
          <div class="home-hero-actions">${recent?`<button class="btn primary hero-cta" data-action="edit" data-id="${esc(recent.id)}">Continue ${esc(recentName)} ${uiIcon('chevron')}</button>`:''}<button class="btn hero-cta" data-action="settings">${uiIcon('user')} Engineer profile</button></div>
        </div>
        <div class="home-visual" aria-hidden="true">
          <div class="visual-sheet"><div class="visual-line wide"></div><div class="visual-line"></div><div class="visual-row"><span>✓</span><div></div></div><div class="visual-row"><span>✓</span><div></div></div><div class="visual-row"><span>⚡</span><div></div></div></div>
          <div class="visual-badge visual-badge-mic">${uiIcon('mic')} Voice Fill</div><div class="visual-badge visual-badge-pdf">${uiIcon('pdf')} PDF</div>
        </div>
      </section>
      <section class="home-stats"><div><strong>${state.certificates.length}</strong><span>Stored on this device</span></div><div><strong>${drafts}</strong><span>Drafts</span></div><div><strong>${completed}</strong><span>Completed</span></div><div><span class="shield-icon">${uiIcon('shield')}</span><span>Autosaved locally</span></div></section>
      <section class="home-section"><div class="home-section-head"><div><span class="eyebrow">START NEW</span><h2>Choose a certificate</h2></div><p>Pick the record you need. Your engineer and tester defaults are filled automatically.</p></div><div class="cert-launch-list">${cards}</div></section>
      <section class="home-section"><div class="home-section-head"><div><span class="eyebrow">SAVED WORK</span><h2>Your certificates</h2></div><p>Tap anywhere on a row to open it.</p></div><div class="saved-cert-list">${rows}</div></section>
    </main>`;
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
    return `<div class="form-head"><button class="btn back" data-action="home">← Home</button><div class="form-title"><div class="eyebrow">${esc(schema.standard)}</div><h2>${schema.icon} ${esc(schema.name)}</h2><p>${esc(cert.number)} · ${esc(cert.status)}</p></div><div class="actions"><button class="btn rapid-entry-btn" data-action="rapid-entry">🎙 Voice Fill</button><button class="btn" data-action="rapid-sheet">📝 Printable Site Worksheet</button><button class="btn" data-action="status">${cert.status === 'Complete' ? 'Mark draft' : 'Mark complete'}</button><button class="btn" data-action="print">Print</button><button class="btn primary" data-action="pdf">PDF</button></div></div><div class="entry-tools-explainer"><div><strong>🎙 Voice Fill</strong><span>Speak answers in field order. Say “next field” between answers and the app fills them for you.</span></div><div><strong>📝 Printable Site Worksheet</strong><span>A paper-friendly question list to take around site, write on, then enter or dictate back into the certificate later.</span></div></div><div class="note warning">Independent certificate layout. Complete only where you are competent and authorised to certify the work.</div>${sections}${finish}<div class="savebar"><div class="savebar-inner"><div class="meta"><span data-save-state>Saved</span> · local device storage</div><button class="btn small" data-action="home">Home</button></div></div>`;
  }

  function fieldVisible(field,cert){
    if(!field.showWhen) return true;
    return String(cert.fields[field.showWhen.key]||'')===String(field.showWhen.value);
  }

  function renderSection(part, cert) {
    const fields = part.fields.filter(field=>fieldVisible(field,cert)).map(field => renderField(field, cert.fields[field.key] ?? '',cert)).join('');
    return `<section class="card form-section"><h3>${esc(part.title)}</h3>${part.note ? `<div class="note">${esc(part.note)}</div>` : ''}<div class="fields">${fields}</div></section>`;
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

  function renderField(field, value, cert) {
    const span = field.span === 'full' ? 'full' : field.span === 'third' ? 'third' : field.span === 'quarter' ? 'quarter' : '';
    const attrs = `data-field="${esc(field.key)}"`;
    let control = '';
    if(field.type==='checkbox') control=`<label class="checkline compact-check"><input ${attrs} type="checkbox" ${value?'checked':''}/><span>Yes</span></label>`;
    else if (field.type === 'textarea') control = `<textarea ${attrs} placeholder="${esc(field.placeholder || '')}">${esc(value)}</textarea>`;
    else if (field.type === 'select') control = `<select ${attrs}><option value="">Select…</option>${(field.options || []).map(o => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    else control = `<input ${attrs} type="${field.type || 'text'}" value="${esc(value)}" placeholder="${esc(field.placeholder || '')}" />`;
    const postcodeButton=POSTCODE_TARGETS[field.key] ? `<button class="btn postcode-find" type="button" data-action="postcode-find" data-postcode-key="${esc(field.key)}">Find address</button>` : '';
    return `<div class="field ${span}"><label>${esc(field.label)}</label><div class="voice-control">${control}<button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(field.label)}">🎙 <span>Speak</span></button>${postcodeButton}</div></div>`;
  }

  function renderCircuitList(cert){
    syncCircuitRows(cert);
    const rows=cert.tables.circuits;
    const cards=rows.map((row,i)=>{
      const test=cert.tables.tests[i]||{};
      const title=row.circuitNo ? `Circuit ${esc(row.circuitNo)}` : `Circuit ${i+1}`;
      const details=[row.description,row.ocpdType&&row.ocpdRating?`${row.ocpdType}${row.ocpdRating} A`:row.ocpdRating?`${row.ocpdRating} A`:'',test.zs?`Zs ${test.zs} Ω`:''].filter(Boolean).join(' · ');
      return `<div class="circuit-card"><button class="circuit-main" data-action="circuit-open" data-index="${i}"><strong>${title}</strong><span>${esc(details||'Tap to enter circuit details')}</span></button><div class="circuit-actions"><button class="btn small move-btn" data-action="circuit-move-up" data-index="${i}" ${i===0?'disabled':''}>↑ Up</button><button class="btn small move-btn" data-action="circuit-move-down" data-index="${i}" ${i===rows.length-1?'disabled':''}>↓ Down</button><button class="btn small" data-action="circuit-duplicate" data-index="${i}">Duplicate</button><button class="btn small danger" data-action="circuit-delete" data-index="${i}">Delete</button></div></div>`;
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
    return `<div class="field ${field.span==='full'?'full':''}"><label>${esc(field.label)}</label><div class="voice-control">${control}<button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(field.label)}">🎙 <span>Speak</span></button></div>${extra}</div>`;
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
    if (col.type === 'select') return `<div class="voice-control table-voice"><select ${attrs}><option value=""></option>${(col.options || []).map(o => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select><button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(col.label)}">🎙 <span>Speak</span></button></div>`;
    return `<div class="voice-control table-voice"><input ${attrs} value="${esc(value)}" /><button class="voice-mic" type="button" data-action="voice-one" aria-label="Speak answer for ${esc(col.label)}">🎙 <span>Speak</span></button></div>`;
  }

  function openSettings() {
    const textField=(k,l,wide=false,type='text')=>`<div class="field ${wide?'full':''}"><label>${l}</label><input data-setting="${k}" type="${type}" value="${esc(settings[k]||'')}" /></div>`;
    const html=`<div class="modal-backdrop" data-action="close-modal"><div class="card modal profile-modal" data-modal>
      <div class="profile-head"><div><div class="eyebrow">ENGINEER PROFILE</div><h2>Details used on new certificates</h2><p>Fill these once. New certificates start with your details already entered, and you can still edit or remove them on any individual certificate.</p></div><button class="btn" data-action="close-modal">Close</button></div>
      <section class="profile-section"><h3>Engineer & business</h3><div class="settings-grid">
        ${textField('engineerName','Engineer name')}${textField('engineerPosition','Position / role')}${textField('companyName','Company name')}${textField('registration','Registration / scheme number')}
        <div class="field full"><label>Business address</label><textarea data-setting="address">${esc(settings.address||'')}</textarea></div>
        ${textField('postcode','Business postcode')}${textField('phone','Phone')}${textField('email','Email')}${textField('qualification','Qualifications / competence',true)}
      </div></section>
      <section class="profile-section"><h3>Default test instrument</h3><p class="profile-help">Used to pre-fill the Test Instrument section. Clear any field on a certificate when a different tester was used.</p><div class="settings-grid">
        ${textField('testerMake','Tester make')}${textField('testerModel','Tester model')}${textField('testerSerial','Serial number')}${textField('testerCalibrationDue','Calibration due','', 'date')}
      </div></section>
      <section class="profile-section"><h3>UK postcode address lookup</h3><p class="profile-help">Optional. Add an Ideal Postcodes API key to enable postcode-first address selection. The key stays in this app’s local settings on your device.</p><div class="settings-grid">${textField('postcodeApiKey','Ideal Postcodes API key',true)}</div></section>
      <section class="profile-section"><h3>Data & recovery</h3><p class="profile-help">Backup saves a latest recovery copy inside the app and a dated copy in Downloads. Restore automatically finds the latest backup. Share Backup lets you send a copy elsewhere.</p><div class="toolbar"><button class="btn" data-action="backup">Back up now</button><button class="btn" data-action="restore">Restore latest</button><button class="btn" data-action="share-backup">Share backup</button></div></section>
      <div class="profile-footer"><button class="btn primary" data-action="save-settings">Save profile</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  }

  function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }

  function backupPayload() {
    return JSON.stringify({ version: VERSION, exportedAt: new Date().toISOString(), settings, certificates: state.certificates }, null, 2);
  }

  function applyBackupJson(json) {
    const data=typeof json==='string'?JSON.parse(json):json;
    if(!Array.isArray(data.certificates)) throw new Error('Not a Sperin Certificates backup');
    state={certificates:data.certificates};
    if(data.settings) settings={...settings,...data.settings};
    state.certificates=state.certificates.map(c=>{try{return migrateCertificate(c)||c;}catch{return c;}});
    persist(); saveSettings(); render();
  }

  window.sperinRestoreBackup=function(json,error){
    if(error){alert('Restore failed: '+error);return;}
    try{applyBackupJson(json);toast('Latest backup restored');}
    catch(err){alert('Could not restore backup: '+err.message);}
  };

  function backup() {
    const content=backupPayload();
    const filename=`sperin-certificates-backup-${TODAY}.json`;
    if(window.Android && typeof window.Android.saveBackup==='function'){
      try { window.Android.saveBackup(content,filename); toast('Backup saved automatically'); return; } catch(err){console.warn(err);}
    }
    downloadBlob(content,filename,'application/json');
    toast('Backup downloaded');
  }

  function restore() {
    if(window.Android && typeof window.Android.restoreLatestBackup==='function'){
      try { window.Android.restoreLatestBackup(); return; } catch(err){console.warn(err);}
    }
    const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json';
    input.onchange=()=>{
      const file=input.files?.[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=()=>{try{applyBackupJson(reader.result);toast('Backup restored');}catch(err){alert('Could not restore backup: '+err.message);}};
      reader.readAsText(file);
    };
    input.click();
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
      const doc = new jsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      let orientation='landscape', y=30;
      pdfHeader(doc, schema, cert);
      const newPage=(o=orientation)=>{doc.addPage('a4',o);orientation=o;pdfHeader(doc,schema,cert);y=30;};
      const ensureSpace=(need=25)=>{const h=doc.internal.pageSize.getHeight();if(y+need>h-18)newPage(orientation);};
      const addSectionTitle=title=>{ensureSpace(12);const w=doc.internal.pageSize.getWidth();doc.setFillColor(235,242,250);doc.rect(12,y-5,w-24,8,'F');doc.setFont('helvetica','bold');doc.setTextColor(20,40,62);doc.setFontSize(9);doc.text(title,14,y);doc.setTextColor(20,28,38);y+=6;};
      const backToPortrait=()=>{if(orientation!=='landscape')newPage('landscape');};

      schema.sections.forEach(part => {
        if (part.type === 'section') {
          backToPortrait();
          const visible=part.fields.filter(field=>fieldVisible(field,cert)).filter(field=>hasPdfValue(field,cert.fields[field.key]));
          if(!visible.length) return;
          addSectionTitle(part.title);
          const body=visible.map(field=>[field.label,formatPdfValue(field,cert.fields[field.key])]);
          doc.autoTable({ startY:y, head:[], body, margin:{left:12,right:12,top:30,bottom:16}, theme:'grid', styles:{fontSize:7.7,cellPadding:1.8,textColor:[25,33,43],lineColor:[205,214,225],lineWidth:.12}, columnStyles:{0:{cellWidth:78,fontStyle:'bold',fillColor:[248,250,252]},1:{cellWidth:195}}, didDrawPage:()=>pdfHeader(doc,schema,cert) });
          y=doc.lastAutoTable.finalY+6;
        } else if(part.type==='table') {
          const rows=(cert.tables[part.key]||[]).filter(row=>Object.values(row).some(v=>v!==undefined&&v!==null&&String(v).trim()!==''));
          if(!rows.length) return;
          const schedule=part.key==='circuits'||part.key==='tests';
          if(orientation!=='landscape') newPage('landscape');
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
      const pdfName = `${pdfSafeName(cert)}.pdf`;
      if (window.Android && typeof window.Android.savePdfBase64 === 'function') {
        window.Android.savePdfBase64(doc.output('datauristring'), pdfName);
        toast('PDF saved to Downloads');
      } else {
        doc.save(pdfName);
        toast('PDF created');
      }
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
      if(d.key==='nominalVoltage' && Array.isArray(cert.tables?.circuits)) cert.tables.circuits.forEach((_,i)=>recalculateCircuitZs(cert,i));
      if(d.key==='signatoryMode'||d.key.startsWith('singleSignatory')) syncSingleSignatory(cert);
    } else {
      cert.tables[d.table]=Array.isArray(cert.tables[d.table])?cert.tables[d.table]:[];
      while(cert.tables[d.table].length<=d.row) cert.tables[d.table].push({});
      if(!isRecord(cert.tables[d.table][d.row])) cert.tables[d.table][d.row]={};
      cert.tables[d.table][d.row][d.key]=value;
      if(d.table==='circuits'){
        syncCircuitRows(cert);
        if(d.key==='circuitNo') cert.tables.tests[d.row].circuitNo=String(value||'');
        if(['ocpdBs','ocpdType','ocpdRating'].includes(d.key)) recalculateCircuitZs(cert,d.row);
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
    const cert=getCurrent(); if(!cert) return;
    const descs=rapidDescriptors(cert);
    const jsPDFCtor=window.jspdf?.jsPDF;
    if(!jsPDFCtor || typeof (new jsPDFCtor()).autoTable!=='function'){
      alert('The PDF engine is not available. Reopen the app and try again.');
      return;
    }
    const doc=new jsPDFCtor({unit:'mm',format:'a4',orientation:'landscape'});
    pdfHeader(doc,SCHEMAS[cert.type],cert);
    doc.setTextColor(25,33,43);
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('PRINTABLE SITE WORKSHEET',14,32);
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.text('Write answers on site. Later use Voice Fill and read them in number order. Say “NEXT FIELD” between each answer.',14,38,{maxWidth:180});
    const rows=descs.map(d=>{
      const value=rapidGetValue(cert,d);
      const choices=d.options?.length ? d.options.join(' / ') : '';
      return [String(d.no),d.section,d.label,String(value??''),choices];
    });
    doc.autoTable({
      startY:44,
      head:[['No.','Section','Field','Handwritten / current value','Quick choices']],
      body:rows,
      margin:{left:8,right:8,top:28,bottom:14},
      styles:{fontSize:6.5,cellPadding:1.4,overflow:'linebreak'},
      headStyles:{fillColor:[20,55,92],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:12},1:{cellWidth:50},2:{cellWidth:74},3:{cellWidth:65},4:{cellWidth:65}}
    });
    pdfFooter(doc);
    const name='Sperin-Site-Worksheet-'+(cert.number||cert.type||'certificate').replace(/[^a-z0-9-_]+/gi,'-')+'.pdf';
    if(window.Android && typeof window.Android.savePdfBase64==='function'){
      window.Android.savePdfBase64(doc.output('datauristring'),name);
      toast('Site worksheet saved to Downloads');
    } else {
      doc.save(name);
      toast('Site worksheet created');
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

  function applyVoiceValue(el, raw) {
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
        el.value=number!==null ? number : (isAddress ? formatSpokenAddress(text) : text);
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
    return guidedControls().filter(el=>meta.later[voiceControlKey(el)]).length;
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
      if(applyVoiceValue(el,text)){
        markVoiceDone(el);
        toast(voiceLabel(el)+' completed');
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
      const existing=el.parentElement && el.parentElement.querySelector(':scope > .voice-mic');
      if(existing){el.dataset.voiceDecorated='1';return;}
      el.dataset.voiceDecorated='1';
      const mic=document.createElement('button');
      mic.type='button';mic.className='voice-mic';mic.dataset.action='voice-one';mic.innerHTML='🎙 <span>Speak</span>';mic.setAttribute('aria-label','Speak answer for '+voiceLabel(el));
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
        b.textContent=view.circuitIndex!==null ? '🎙 Fill this page' : '🎙 Fill certificate';
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

  document.addEventListener('input', e => {
    const cert = getCurrent();
    if (e.target.matches('[data-field]') && cert) {
      const key=e.target.dataset.field;
      cert.fields[key]=e.target.type==='checkbox' ? e.target.checked : e.target.value;
      if(key==='certificateNo') cert.number=e.target.value;
      if(key==='nominalVoltage' && Array.isArray(cert.tables?.circuits)) cert.tables.circuits.forEach((_,i)=>recalculateCircuitZs(cert,i));
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
    if (e.target.matches('[data-field],[data-table-input],[data-circuit-input]')) markVoiceDone(e.target);
  });

  document.addEventListener('change', e => {
    if (e.target.matches('[data-field],[data-table-input],[data-circuit-input]')) {
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
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

  document.addEventListener('keydown', e => {
    const card=e.target.closest?.('.saved-cert-card[data-action="edit"]');
    if(!card || e.target.closest('button,input,select,textarea')) return;
    if(e.key==='Enter' || e.key===' '){e.preventDefault();openCertificate(card.dataset.id);}
  });

  document.addEventListener('click', e => {
    const button = e.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    const cert=getCurrent();
    if (action === 'postcode-find') postcodeLookup(button.dataset.postcodeKey);
    else if (action === 'postcode-select') selectPostcodeAddress(button.dataset.postcodeKey,button.dataset.addressIndex);
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
    else if (action === 'voice-review-later') startGuidedVoice('later');
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
    else if (action === 'home') { saveNow(); view = { page: 'home', currentId: null, circuitIndex:null, circuitStep:'details' }; render(); goTop(); }
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
    else if(action==='circuit-move-up' && cert){moveCircuit(cert,Number(button.dataset.index),-1);}
    else if(action==='circuit-move-down' && cert){moveCircuit(cert,Number(button.dataset.index),1);}
    else if(action==='circuit-duplicate' && cert){
      syncCircuitRows(cert);const i=Number(button.dataset.index),no=nextCircuitNumber(cert);
      const c=clone(cert.tables.circuits[i]||{}),t=clone(cert.tables.tests[i]||{});c.circuitNo=no;t.circuitNo=no;
      cert.tables.circuits.push(c);cert.tables.tests.push(t);renumberCircuits(cert);view.circuitIndex=cert.tables.circuits.length-1;view.circuitStep='details';persist();render();goTop();
    }
    else if(action==='circuit-delete' && cert){
      const i=Number(button.dataset.index);if(confirm('Delete this circuit and its test results?')){syncCircuitRows(cert);cert.tables.circuits.splice(i,1);cert.tables.tests.splice(i,1);persist();render();}
    }
    else if(action==='circuit-next' && cert){saveNow();view.circuitStep='tests';render();goTop();}
    else if(action==='circuit-prev' && cert){saveNow();view.circuitStep='details';render();goTop();}
    else if(action==='circuit-list' && cert){saveNow();view.circuitIndex=null;view.circuitStep='details';render();goCircuits();}
    else if(action==='circuit-recalc' && cert){const i=Number(button.dataset.index);recalculateCircuitZs(cert,i,true);persist();render();}
    else if (action === 'row-add') { if (!cert) return; const key = button.dataset.table; cert.tables[key] = cert.tables[key] || []; cert.tables[key].push({}); persist(); render(); }
    else if (action === 'row-delete') { if (!cert) return; const key = button.dataset.table; const ri = Number(button.dataset.row); cert.tables[key].splice(ri, 1); persist(); render(); }
    else if (action === 'settings') openSettings();
    else if (action === 'save-settings') { saveSettings(); closeModal(); toast('Profile saved'); }
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
