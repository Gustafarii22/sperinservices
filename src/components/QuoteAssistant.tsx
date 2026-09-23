import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, MessageCircle, Phone, Sparkles, X } from "lucide-react";
import { SITE } from "@/lib/site";

const SERVICES = ["Full / part rewire","Consumer unit","EV charger","Testing / EICR","Smart home","Kitchen","Bathroom","Commercial electrical","Other"] as const;
type Service = typeof SERVICES[number];

const questions: Record<Service, { key:string; label:string; placeholder?:string }[]> = {
  "Full / part rewire":[{key:"property",label:"What type of property is it?",placeholder:"e.g. 3-bed semi"},{key:"scope",label:"Full or part rewire?",placeholder:"Tell us the rooms / scope"},{key:"occupancy",label:"Is the property occupied?",placeholder:"Occupied / vacant / being renovated"}],
  "Consumer unit":[{key:"reason",label:"What do you need help with?",placeholder:"Replacement, additional circuits, fault..."},{key:"age",label:"What is there now?",placeholder:"Approximate age/type if known"},{key:"circuits",label:"How many circuits roughly?",placeholder:"If known"}],
  "EV charger":[{key:"charger",label:"Have you chosen a charger?",placeholder:"Make/model or not chosen yet"},{key:"parking",label:"Where will the vehicle park?",placeholder:"Driveway, garage, allocated space..."},{key:"route",label:"What is the likely cable route?",placeholder:"Approx distance and route if known"}],
  "Testing / EICR":[{key:"property",label:"What property needs testing?",placeholder:"Home, rental, shop, office..."},{key:"reason",label:"What is the test for?",placeholder:"Landlord EICR, purchase, fault..."},{key:"date",label:"When do you need it?",placeholder:"Preferred date/timeframe"}],
  "Smart home":[{key:"scope",label:"What would you like to control?",placeholder:"Lighting, heating, blinds, security..."},{key:"property",label:"Tell us about the property",placeholder:"New build, renovation, existing home..."}],
  "Kitchen":[{key:"scope",label:"What work do you need?",placeholder:"Full installation, electrical only, alterations..."},{key:"stage",label:"What stage is the project at?",placeholder:"Planning, units ordered, strip-out..."}],
  "Bathroom":[{key:"scope",label:"What work do you need?",placeholder:"Full installation, lighting, fan, shower..."},{key:"stage",label:"What stage is the project at?",placeholder:"Planning, refurbishment underway..."}],
  "Commercial electrical":[{key:"premises",label:"What type of premises?",placeholder:"School, office, shop, warehouse..."},{key:"scope",label:"What work is required?",placeholder:"Testing, lighting, power, remedials..."},{key:"programme",label:"What is the required timeframe?",placeholder:"Dates / access restrictions"}],
  "Other":[{key:"scope",label:"Tell us what you need",placeholder:"A short description of the job"}],
};

export function QuoteAssistant() {
  const [open,setOpen]=useState(false); const [service,setService]=useState<Service|null>(null); const [answers,setAnswers]=useState<Record<string,string>>({}); const [contact,setContact]=useState({name:"",postcode:"",phone:""}); const [step,setStep]=useState(0);
  const qs=service?questions[service]:[];
  const summary=useMemo(()=> service ? [`Service: ${service}`,...qs.map(q=>`${q.label} ${answers[q.key]||"Not supplied"}`),`Name: ${contact.name||"Not supplied"}`,`Postcode/area: ${contact.postcode||"Not supplied"}`,`Phone: ${contact.phone||"Not supplied"}`].join("\n") : "",[service,answers,contact,qs]);
  const whatsapp=`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hi Sperin Services, I'd like a quote.\n\n"+summary)}`;
  const reset=()=>{setService(null);setAnswers({});setContact({name:"",postcode:"",phone:""});setStep(0)};
  return <>
    <button onClick={()=>setOpen(true)} className="fixed bottom-24 right-4 z-40 hidden items-center gap-2 rounded-xl border border-electric/30 bg-[#0b1119]/95 px-4 py-3 text-sm font-bold text-foreground shadow-[0_0_30px_rgba(22,114,255,.16)] backdrop-blur md:flex"><Sparkles className="h-4 w-4 text-electric"/> Quick quote</button>
    {open && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Quick quote assistant">
      <div className="surface-strong max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><span className="eyebrow">Sperin quick quote</span><h2 className="mt-2 text-2xl font-bold">Tell us about the job.</h2></div><button onClick={()=>setOpen(false)} className="rounded-lg p-2 hover:bg-white/5" aria-label="Close"><X/></button></div>
        {!service ? <div className="mt-6 grid grid-cols-2 gap-2">{SERVICES.map(s=><button key={s} onClick={()=>{setService(s);setStep(0)}} className="rounded-xl border border-white/10 bg-white/[.025] p-4 text-left text-sm font-semibold transition hover:border-electric/40 hover:bg-electric/[.06]">{s}</button>)}</div>
        : step < qs.length ? <div className="mt-6"><div className="text-xs text-muted-foreground">Question {step+1} of {qs.length}</div><label className="mt-3 block text-xl font-bold">{qs[step].label}</label><textarea autoFocus value={answers[qs[step].key]||""} onChange={e=>setAnswers({...answers,[qs[step].key]:e.target.value})} placeholder={qs[step].placeholder} className="mt-4 min-h-28 w-full rounded-xl border border-white/10 bg-black/20 p-4 outline-none focus:border-electric/50"/><div className="mt-4 flex justify-between"><button onClick={()=>step===0?reset():setStep(step-1)} className="button-secondary"><ArrowLeft className="h-4 w-4"/> Back</button><button onClick={()=>setStep(step+1)} className="button-primary">Continue <ArrowRight className="h-4 w-4"/></button></div></div>
        : step===qs.length ? <div className="mt-6 space-y-3"><p className="text-sm text-muted-foreground">Nearly done. Add the details we need to reply.</p>{(["name","postcode","phone"] as const).map(k=><input key={k} value={contact[k]} onChange={e=>setContact({...contact,[k]:e.target.value})} placeholder={k==="name"?"Your name":k==="postcode"?"Postcode / area":"Phone number"} className="w-full rounded-xl border border-white/10 bg-black/20 p-4 outline-none focus:border-electric/50"/>)}<div className="flex justify-between pt-2"><button onClick={()=>setStep(step-1)} className="button-secondary"><ArrowLeft className="h-4 w-4"/> Back</button><button onClick={()=>setStep(step+1)} className="button-primary">Review <ArrowRight className="h-4 w-4"/></button></div></div>
        : <div className="mt-6"><div className="rounded-xl border border-white/10 bg-black/20 p-4 whitespace-pre-wrap text-sm leading-6">{summary}</div><p className="mt-4 text-xs text-muted-foreground">This starts an enquiry, not a fixed quotation. Photos and a site visit can be arranged where needed.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><a href={whatsapp} target="_blank" rel="noreferrer" className="button-primary"><MessageCircle className="h-4 w-4"/> Send by WhatsApp</a><a href={`tel:${SITE.phone}`} className="button-secondary"><Phone className="h-4 w-4"/> Call instead</a></div><button onClick={reset} className="mt-4 text-sm font-bold text-electric">Start again</button></div>}
      </div>
    </div>}
  </>;
}
