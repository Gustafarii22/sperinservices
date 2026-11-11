import { useEffect,useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Zap, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { getWorkspace } from '@/lib/leads.functions';
import { Workspace } from './workspace';

export function OwnerPage({ view }: { view: 'leads' | 'sent' | 'setup' }) {
  const [ready,setReady] = useState(false); const [owner,setOwner] = useState(false); const [password,setPassword] = useState(''); const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  const load = useServerFn(getWorkspace);
  useEffect(() => { let live = true; const check = async () => { const { data } = await supabase.auth.getSession(); if (data.session) { try { await load(); if (live) setOwner(true); } catch { if (live) setError('Only the verified owner account can open this workspace.'); } } if (live) setReady(true); }; void check(); const { data: sub } = supabase.auth.onAuthStateChange(event => { if (event === 'SIGNED_IN') void check(); if (event === 'SIGNED_OUT') { setOwner(false); setReady(true); } }); return () => { live=false; sub.subscription.unsubscribe(); }; }, []);
  if (owner) return <Workspace view={view} />;
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><div className="w-full max-w-sm"><Zap className="mb-8 size-10 text-primary" /><p className="mb-3 text-xs font-medium text-muted-foreground">SPERIN SERVICES · PRIVATE</p><h1 className="text-3xl font-semibold">HaMuch Lead Assistant</h1><p className="mt-4 text-sm text-muted-foreground">Owner sign-in</p>{!ready ? <p className="mt-8">Checking access…</p> : <form className="mt-8 space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email: 'info@sperinservices.co.uk', password }); if(error) setError(error.message); setBusy(false); }}><label className="block text-sm">Email<Input className="mt-2" value="info@sperinservices.co.uk" readOnly autoComplete="username" /></label><label className="block text-sm">Password<Input className="mt-2" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label><Button className="w-full" disabled={busy}><LockKeyhole />{busy ? 'Signing in…' : 'Sign in'}</Button></form>}{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}</div></main>;
}