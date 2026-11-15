import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { Mail, MessageSquare, Send, Save, LogOut, Zap, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { approveAndSend, getWorkspace, retryChannel, saveDraft, createLeadFromText, confirmManualChannel } from '@/lib/leads.functions';
import { ukMobile, smsComposeLink, gmailComposeLink } from '@/lib/leads/mobile';
import { withBusinessSignature } from '@/lib/server/channels';
import { statusLabel } from '@/lib/leads/status';
import type { Tables } from '@/integrations/supabase/types';

export type WorkspaceData = Awaited<ReturnType<typeof getWorkspace>>;
export function Header() {
  return <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5"><Link to="/" className="flex items-center gap-3"><Zap className="size-7 text-primary" /><div><p className="font-semibold">HaMuch Lead Assistant</p><p className="text-xs text-muted-foreground">SPERIN SERVICES · PRIVATE WORKSPACE</p></div></Link><Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => supabase.auth.signOut().then(() => window.location.assign('/'))}><LogOut /></Button></div></header>;
}
export function Nav() {
  return <nav className="flex gap-2 border-b border-border pb-4"><Button asChild variant="ghost"><Link to="/">Leads</Link></Button><Button asChild variant="ghost"><Link to="/sent">Sent history</Link></Button><Button asChild variant="ghost"><Link to="/setup">Setup</Link></Button></nav>;
}
export function Workspace({ view }: { view: 'leads' | 'sent' | 'setup' }) {
  const load = useServerFn(getWorkspace);
  const [data,setData] = useState<WorkspaceData | null>(null);
  const [error,setError] = useState('');
  const refresh = async () => { try { setData(await load()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to open workspace'); } };
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(),15000); return () => clearInterval(timer); }, []);
  return <><Header /><main className="mx-auto max-w-6xl px-5 pb-16 pt-6"><Nav />{error && <p role="alert" className="my-5 text-destructive">{error}</p>}{!data ? <p className="py-12 text-muted-foreground">Opening private workspace…</p> : view === 'setup' ? <Setup data={data} /> : view === 'sent' ? <History data={data} refresh={refresh} /> : <Leads data={data} refresh={refresh} />}</main></>;
}
function Leads({ data, refresh }: { data: WorkspaceData; refresh: () => Promise<void> }) {
  const [selected,setSelected] = useState<string | null>(null);
  const [filter,setFilter] = useState('all');
  const lead = data.leads.find(l => l.id === selected);
  return <><div className="flex flex-wrap items-end justify-between gap-4 py-7"><div><p className="text-sm text-muted-foreground">Your enquiries</p><h1 className="mt-1 text-3xl font-semibold">Review & reply</h1></div><select aria-label="Lead status" className="h-10 rounded-md border border-input bg-card px-3 text-sm" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All leads</option><option value="ready_for_review">Ready for review</option><option value="needs_info">Needs info</option><option value="approved_sent">Approved / Sent</option></select></div>{lead ? <Review key={lead.id} lead={lead} smsDefault={data.smsDrafts[lead.id] ?? ''} gmailMissing={data.gmailMissing} smsMissing={data.smsMissing} approved={data.sent.some(s => s.lead_id === lead.id)} close={() => setSelected(null)} refresh={refresh} /> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.leads.filter(l => filter === 'all' || l.status === filter).map(l => <article key={l.id} className="flex min-h-60 flex-col rounded-lg border border-border bg-card p-5"><div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{l.postcode || 'Location needed'}</span><span>{l.is_sample ? 'SAMPLE' : statusLabel(l.status)}</span></div><h2 className="mt-4 text-lg font-semibold">{l.job_title}</h2><p className="mt-2 text-sm text-muted-foreground">{l.customer_name || 'Customer'} · {new Date(l.created_at).toLocaleDateString('en-GB')}</p><p className="my-4 font-semibold text-primary">{String((l.estimate as Record<string,unknown>)?.['summary'] ?? 'Assessment needed')}</p><Button variant="outline" className="mt-auto w-full" onClick={() => setSelected(l.id)}>Review quote</Button></article>)}</div>}<Paste refresh={refresh} /></>;
}
function Review({ lead, smsDefault, gmailMissing, smsMissing, approved, close, refresh }: { lead: Tables<'leads'>; smsDefault: string; gmailMissing: string | null; smsMissing: string | null; approved: boolean; close: () => void; refresh: () => Promise<void> }) {
  const [to,setTo] = useState(lead.customer_email ?? '');
  const [phone,setPhone] = useState(lead.customer_phone ?? '');
  const [subject,setSubject] = useState(lead.reply_subject);
  const [body,setBody] = useState(lead.reply_body);
  const [sms,setSms] = useState(smsDefault);
  const [busy,setBusy] = useState(false);
  const [note,setNote] = useState('');
  const [saved,setSaved] = useState(true);
  const [prepared,setPrepared] = useState<{ outboundId: string; gmailStatus: string; smsStatus: string; emailCompose: {to:string;subject:string;body:string}; smsCompose: {to:string;body:string} | null } | null>(null);
  const save = useServerFn(saveDraft);
  const send = useServerFn(approveAndSend);
  const mobile = ukMobile(phone);
  const run = async (sending: boolean) => {
    if (busy) return;
    if (sending && !window.confirm(`Approve this email to ${to}${mobile ? ` and ${smsMissing ? 'prepare an SMS' : 'queue an automatic SMS'} to ${mobile} on your own phone` : ' (no valid UK mobile)'}?`)) return;
    setBusy(true); setNote('');
    try {
      if (!sending) { await save({ data: { id: lead.id, to, phone, subject, body } }); setSaved(true); setNote('Draft saved.'); }
      else {
        const result = await send({ data: { leadId: lead.id, to, subject, body, sms, confirmed: true } });
        if (!result.ok) throw new Error(result.reason);
        setPrepared(result);
        setNote(result.gmailStatus === 'sent' && ['sending','sent','delivered'].includes(result.smsStatus)
          ? 'Gmail sent your quote. SMS queued to your Samsung SIM through free SMSGate; Sent history tracks its status.'
          : result.gmailStatus === 'sent'
          ? 'Gmail sent your quote. SMS is prepared for manual sending on your Samsung.'
          : (result.warning ?? 'Approved. Check channel status under Sent history.'));
        // A desktop browser cannot access a Samsung SIM. On Android only,
        // open the native SMS composer after Gmail has actually reported sent.
        if (result.gmailStatus === 'sent' && result.smsCompose && /Android/i.test(navigator.userAgent)) {
          const link = smsComposeLink(result.smsCompose.to,result.smsCompose.body);
          if (link) window.location.href = link;
        }
      }
      await refresh();
    } catch (e) { setNote(e instanceof Error ? e.message : 'Action failed'); } finally { setBusy(false); }
  };
  return <section className="py-6"><Button variant="ghost" onClick={close}>← Back to leads</Button><h2 className="my-5 text-2xl font-semibold">{lead.job_title}</h2><p className="mb-6 whitespace-pre-wrap text-sm text-muted-foreground">{lead.scope}</p><div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]"><div className="space-y-4"><Field title="Email recipient"><Input aria-label="Email recipient" value={to} onChange={e => { setTo(e.target.value); setSaved(false); }} disabled={approved} /></Field><Field title="Subject"><Input aria-label="Subject" value={subject} onChange={e => { setSubject(e.target.value); setSaved(false); }} disabled={approved} /></Field><Field title="Email reply"><Textarea aria-label="Email reply" rows={15} value={body} onChange={e => { setBody(e.target.value); setSaved(false); }} disabled={approved} /></Field></div><div className="space-y-4"><Field title="Customer phone"><Input aria-label="Customer phone" value={phone} onChange={e => { setPhone(e.target.value); setSaved(false); }} disabled={approved} /></Field><p className="text-sm text-muted-foreground">{mobile ? `SMS recipient: ${mobile}` : 'SMS skipped — no valid UK mobile.'}</p><Field title="SMS message"><Textarea aria-label="SMS message" rows={7} maxLength={480} value={sms} onChange={e => setSms(e.target.value)} disabled={approved || !mobile} /></Field><p className="text-xs text-muted-foreground">{sms.length}/480 characters</p><div className="border-t border-border pt-5"><p className="mb-4 text-sm font-medium">{lead.is_sample ? 'Sample lead — sending disabled' : approved ? 'Already approved — open Sent history' : 'Owner approval required'}</p><Button className="mb-3 w-full" variant="outline" disabled={busy || approved} onClick={() => run(false)}><Save />Save draft</Button><Button className="w-full" disabled={busy || !saved || lead.is_sample || approved} onClick={() => run(true)}><Send />{busy ? 'Working…' : gmailMissing && smsMissing ? 'Approve & prepare Gmail + SMS' : gmailMissing ? 'Approve & queue SMS + prepare Gmail' : smsMissing ? 'Approve & send Gmail + prepare SMS' : 'Approve & Send (Gmail + Samsung SMS)'}</Button></div></div></div>
  {prepared && <div className="mt-5 space-y-3 rounded-lg border border-border bg-card p-4">
    <p className="font-semibold">Your free sending options</p>
    {['sending','sent','delivered'].includes(prepared.smsStatus) && <p className="text-sm">SMS is queued or sent automatically through your Samsung SIM. Do not send a second copy manually.</p>}
    {prepared.gmailStatus !== 'sent' && <a className="block underline text-primary" href={gmailComposeLink(prepared.emailCompose.to,prepared.emailCompose.subject,prepared.emailCompose.body)} target="_blank" rel="noreferrer">Open complete quotation in Gmail (press Send)</a>}
    {prepared.smsCompose && <a className="block underline text-primary" href={smsComposeLink(prepared.smsCompose.to,prepared.smsCompose.body) ?? '#'}>Open SMS on your Samsung (press Send)</a>}
    <p className="text-xs text-muted-foreground">Opening a draft does not send it. Confirm a manual send under Sent history. No Twilio charges.</p>
    <Button variant="outline" asChild><Link to="/sent">Open Sent history</Link></Button>
  </div>}
  {note && <p role="status" className="mt-5 border-l-2 border-primary pl-4 text-sm">{note}</p>}</section>;
}
function Field({ title,children }: { title: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-medium">{title}</span>{children}</label>; }
function History({ data,refresh }: { data: WorkspaceData; refresh: () => Promise<void> }) {
  const retry = useServerFn(retryChannel);
  const manual = useServerFn(confirmManualChannel);
  const [busy,setBusy] = useState(''); const [note,setNote] = useState('');
  const attempt = async (id: string, channel: 'gmail' | 'sms') => { if (busy || !window.confirm(`Retry only the failed ${channel === 'gmail' ? 'email' : 'SMS'} using the approved message?`)) return; setBusy(id+channel); try { await retry({ data: { outboundId: id, channel, confirmed: true } }); await refresh(); setNote('Retry recorded. Check the channel result below.'); } catch(e) { setNote(e instanceof Error ? e.message : 'Retry failed'); } finally { setBusy(''); } };
  const confirmed = async (outboundId: string, channel: 'gmail' | 'sms') => {
    if (busy || !window.confirm(`Have you actually pressed Send in ${channel === 'gmail' ? 'Gmail' : 'Samsung Messages'}? This records YOUR confirmation, not network delivery.`)) return;
    setBusy(outboundId+channel);
    try { await manual({data:{outboundId,channel,confirmed:true}}); await refresh(); setNote(channel.toUpperCase()+' marked sent on your confirmation (not delivery verified).'); }
    catch(e) {setNote(e instanceof Error?e.message:'Unable to record confirmation');}
    finally {setBusy('');}
  };
  return <><div className="py-7"><p className="text-sm text-muted-foreground">Approved messages · newest first</p><h1 className="mt-1 text-3xl font-semibold">Sent history</h1></div>{note && <p role="status" className="mb-4">{note}</p>}{!data.sent.length && <p className="text-muted-foreground">No approved messages yet.</p>}<div className="space-y-4">{data.sent.map(out => { const channels = data.channels.filter(c => c.outbound_id === out.id); return <article key={out.id} className="rounded-lg border border-border bg-card p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{out.subject}</h2><p className="mt-1 text-sm text-muted-foreground">{out.to_email}</p></div><time className="text-xs text-muted-foreground">{new Date(out.created_at).toLocaleString('en-GB')}</time></div><div className="mt-5 grid gap-4 md:grid-cols-2">{channels.length ? channels.map(c => <div key={c.id} className="border-t border-border pt-4"><p className="flex items-center gap-2 font-medium">{c.channel === 'gmail' ? <Mail className="size-4" /> : <MessageSquare className="size-4" />}{c.channel === 'gmail' ? 'Gmail' : 'SMS'}<span className={c.status === 'failed' ? 'ml-auto text-destructive' : 'ml-auto text-primary'}>{c.status}</span></p><p className="mt-2 break-all text-xs text-muted-foreground">{c.recipient || 'No UK mobile'}{c.provider_id ? ` · ID: ${c.provider_id}` : ''}</p>{c.error && <p className="mt-2 text-sm text-destructive">{c.error}</p>}{['unknown','sending'].includes(c.status) && <p className="mt-2 text-xs text-muted-foreground">Awaiting provider confirmation. Retry locked to prevent duplicates.</p>}{c.status === 'failed' && <div className="mt-3 space-y-2">
{c.channel === 'sms' && c.status === 'pending' && c.recipient && <a className="block text-sm font-medium text-primary underline" href={smsComposeLink(c.recipient,c.body) ?? '#'}>Open SMS on this phone</a>}
{c.channel === 'gmail' && ['pending','failed'].includes(c.status) && <a className="block text-sm font-medium text-primary underline" href={gmailComposeLink(out.to_email,out.subject,withBusinessSignature(out.body))} target="_blank" rel="noreferrer">Open Gmail quotation</a>}
{c.status === 'pending' && <Button variant="outline" size="sm" disabled={!!busy} onClick={() => confirmed(out.id,c.channel as 'gmail'|'sms')}>I've sent this {c.channel === 'gmail' ? 'email' : 'SMS'}</Button>}
{c.status === 'failed' && c.channel === 'sms' && !data.smsMissing && <Button variant="outline" size="sm" disabled={!!busy} onClick={() => attempt(out.id,'sms')}><RefreshCw />Retry failed SMS via Samsung</Button>}
{c.status === 'failed' && c.channel === 'gmail' && <Button variant="outline" className="mt-3" disabled={!!busy} onClick={() => attempt(out.id,'gmail')}><RefreshCw />Retry Gmail only</Button>}
{c.provider_id === 'manual-owner-confirmation' && <p className="text-xs text-muted-foreground">Owner-confirmed sent; provider delivery not verified.</p>}
</div>}</div>) : <><div className="border-t border-border pt-4"><p>Email · {out.email_channel || 'previous provider'} · {out.email_delivery_status || out.status}</p><p className="mt-2 break-all text-xs text-muted-foreground">ID: {out.gmail_message_id || out.provider_id || 'not recorded'}</p>{out.error && <p className="text-sm text-destructive">{out.error}</p>}</div><div className="border-t border-border pt-4"><p>SMS · {out.sms_status || 'not recorded'}</p><p className="mt-2 break-all text-xs text-muted-foreground">{out.sms_to} {out.sms_provider_id}</p>{out.sms_error && <p className="text-destructive">{out.sms_error}</p>}</div></>}</div><details className="mt-4 text-sm"><summary className="cursor-pointer text-muted-foreground">Approved messages</summary><p className="mt-3 whitespace-pre-wrap">{out.body}</p>{out.sms_body && <p className="mt-3 border-t border-border pt-3">SMS: {out.sms_body}</p>}</details></article>; })}</div></>;
}
function Setup({ data }: { data: WorkspaceData }) {
  return <section className="max-w-3xl py-7">
    <p className="text-sm text-muted-foreground">Free email and phone texting</p>
    <h1 className="mt-1 text-3xl font-semibold">Gmail + your Samsung SMS</h1>
    <div className="border-b border-border py-7">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Mail className="size-5" />Gmail</h2>
      <p className="my-3 text-sm">{data.gmailMissing || 'Gmail OAuth credentials are present; Gmail sender is verified when sending.'}</p>
      <p className="text-sm text-muted-foreground">Once Gmail OAuth is connected, approving a quotation sends directly through your Gmail Sent folder using your verified Sperin Services send-as alias. Until then, the app prepares the exact email for you to send manually.</p>
      <Button asChild variant="outline" className="mt-3"><a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">Connect Gmail OAuth</a></Button>
    </div>
    <div className="border-b border-border py-7">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="size-5" />Free Samsung SMS — no Twilio</h2>
      <p className="my-3 text-sm">{data.smsMissing || 'SMSGate credentials configured. Approved SMS is queued through your Samsung SIM and delivery statuses are checked automatically.'}</p>
      <p className="text-sm text-muted-foreground">For genuinely automatic one-button sending, install the free open-source SMS Gateway for Android (SMSGate) on your Samsung S23 Ultra. Activate Cloud Server mode and tap Start Service. The app will generate private gateway credentials.</p>
      <Button asChild variant="outline" className="mt-3"><a href="https://sms-gate.app" target="_blank" rel="noreferrer">Install free SMSGate on Samsung</a></Button>
      <p className="mt-3 text-sm text-muted-foreground">Keep those credentials secret. Add SMSGATE_USERNAME and SMSGATE_PASSWORD as encrypted Production environment variables in Vercel. Then deploy the app. Use the same SIM as your unlimited UK SMS allowance. A personal mobile plan may impose a business-use or fair-use limit.</p>
      <p className="mt-3 text-sm text-muted-foreground">Until SMSGate is connected, HaMuch can still open a prepared SMS in Samsung Messages for you to send manually. The app never assumes that opening the message means it was sent.</p>
    </div>
    <div className="py-7">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="size-5" />Safe delivery</h2>
      <p className="mt-3 text-sm text-muted-foreground">No quotations are sent without your approval. We prevent duplicate sends and distinguish prepared, queued, sent, provider-delivered and user-confirmed manual messages. Gmail and SMS require separate credentials; Twilio is never used. Existing customer enquiries and Sent history are retained.</p>
    </div>
  </section>;
}
function Paste({ refresh }: { refresh: () => Promise<void> }) {
  const create = useServerFn(createLeadFromText); const [text,setText] = useState(''); const [note,setNote] = useState(''); const [busy,setBusy] = useState(false);
  return <details className="mt-10 border-t border-border pt-5"><summary className="cursor-pointer font-medium">Add a pasted enquiry</summary><Textarea className="mt-4" aria-label="Pasted enquiry" rows={6} value={text} onChange={e => setText(e.target.value)} /><Button className="mt-3" disabled={busy || text.length < 10} onClick={async () => { setBusy(true); try { await create({ data: { text, subject: '', source: 'paste' } }); setText(''); await refresh(); setNote('Enquiry added.'); } catch(e) { setNote(e instanceof Error ? e.message : 'Unable to add enquiry'); } finally { setBusy(false); } }}>Add enquiry</Button><p role="status" className="mt-2 text-sm">{note}</p></details>;
}