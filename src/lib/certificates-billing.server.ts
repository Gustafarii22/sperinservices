import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

type SQL=ReturnType<typeof neon>;
type Member={email:string,orgId:string,role:string,name:string};
const answer=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store"}});
const secret=()=>process.env.SPERIN_CERT_STRIPE_SECRET_KEY||"";
const price=()=>process.env.SPERIN_CERT_STRIPE_PRICE_ID||"";
const webhookSecret=()=>process.env.SPERIN_CERT_STRIPE_WEBHOOK_SECRET||"";
function stripeReady(){return secret().startsWith("sk_")&&price().startsWith("price_");}
async function stripePost(route:string,params:URLSearchParams){
  const r=await fetch("https://api.stripe.com/v1/"+route,{method:"POST",
    signal:AbortSignal.timeout(12000),
    headers:{"Authorization":"Bearer "+secret(),"Content-Type":"application/x-www-form-urlencoded","Idempotency-Key":randomUUID()},
    body:params.toString()});
  if(!r.ok)throw Error("Stripe request failed");
  return r.json();
}
function origin(req:Request){
  const u=new URL(req.url);
  // Use the app's configured canonical hostname, not attacker-controlled forwarded headers.
  const host=process.env.SPERIN_CERT_CANONICAL_ORIGIN||"https://sperinservices.co.uk";
  const url=new URL(host);
  if(url.protocol!=="https:")throw Error("HTTPS required");
  return url.origin;
}
export async function certificateStripeWebhook(req:Request,sql:SQL):Promise<Response|null>{
  if(new URL(req.url).pathname!=="/api/certificates/billing/webhook")return null;
  if(req.method!=="POST")return answer({error:"Method not allowed"},405);
  const key=webhookSecret();
  if(!key.startsWith("whsec_")||key.length<25)return answer({error:"Billing not configured"},503);
  const header=req.headers.get("stripe-signature")||"";
  const ts=header.split(",").find(x=>x.startsWith("t="))?.slice(2)||"";
  const signatures=header.split(",").filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
  if(!/^\d{9,11}$/.test(ts)||Math.abs(Date.now()/1000-Number(ts))>300||!signatures.length)
    return answer({error:"Invalid Stripe signature"},400);
  const raw=await req.text();if(raw.length>300000)return answer({error:"Payload too large"},413);
  const mac=createHmac("sha256",key).update(ts+"."+raw).digest("hex");
  const verified=signatures.some(x=>{
    if(!/^[0-9a-f]{64}$/.test(x))return false;
    return timingSafeEqual(Buffer.from(mac,"hex"),Buffer.from(x,"hex"));
  });
  if(!verified)return answer({error:"Invalid Stripe signature"},400);
  let event:Record<string,any>;
  try{event=JSON.parse(raw);}catch{return answer({error:"Malformed event"},400);}
  if(typeof event.id!=="string"||typeof event.type!=="string"||!event.data?.object)return answer({error:"Invalid event"},400);
  const reserved=await sql.query("insert into cert_stripe_events(id,kind) values($1,$2) on conflict do nothing returning id",[event.id,event.type]);
  if(!reserved.length)return answer({received:true,duplicate:true});
  try{
    const obj=event.data.object;
    if(event.type==="checkout.session.completed" && obj.mode==="subscription" && obj.subscription){
      const org=String(obj.client_reference_id||obj.metadata?.org_id||"");
      if(/^[0-9a-f-]{36}$/i.test(org)){
        await sql.query("update cert_orgs set stripe_customer_id=$2,stripe_subscription_id=$3,subscription_status='pending' where id=$1",
          [org,String(obj.customer||""),String(obj.subscription)]);
      }
    }else if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){
      const status=String(obj.status||"incomplete");
      const accepted=["active","trialing","past_due","unpaid","canceled","incomplete","incomplete_expired","paused"];
      if(!accepted.includes(status))throw Error("Unknown Stripe status");
      const org=String(obj.metadata?.org_id||"");
      const params=[String(obj.customer||""),String(obj.id||""),status,
        Number.isInteger(obj.current_period_end)?new Date(obj.current_period_end*1000).toISOString():null,org];
      await sql.query("update cert_orgs set stripe_customer_id=$1,stripe_subscription_id=$2,subscription_status=$3,subscription_period_end=$4::timestamptz where (id::text=$5 and $5<>'') or (stripe_customer_id=$1 and $1<>'')",params);
    }
    return answer({received:true});
  }catch(e){
    await sql.query("delete from cert_stripe_events where id=$1",[event.id]);
    console.error("Subscription update failed",e instanceof Error?e.name:"unknown");
    return answer({error:"Retry webhook"},503);
  }
}
export async function certificateBillingApi(req:Request,sql:SQL,user:Member):Promise<Response|null>{
  const path=new URL(req.url).pathname;
  if(!path.startsWith("/api/certificates/billing/"))return null;
  if(path.endsWith("/webhook"))return answer({error:"Unauthorized"},401);
  const rows=await sql.query("select stripe_customer_id,subscription_status,subscription_period_end,trial_ends_at from cert_orgs where id=$1",[user.orgId]);
  if(!rows.length)return answer({error:"Account not found"},404);
  const org=rows[0];
  const trial=new Date(org.trial_ends_at).getTime()>Date.now();
  const paid=["active","trialing"].includes(org.subscription_status);
  if(path==="/api/certificates/billing/status"&&req.method==="GET")
    return answer({status:org.subscription_status,trialEnd:org.trial_ends_at,periodEnd:org.subscription_period_end,
      access:trial||paid,paymentsConfigured:stripeReady()});
  if(req.method!=="POST"||user.role!=="owner")return answer({error:"Business owner required"},403);
  if(!stripeReady())return answer({error:"Subscription checkout has not been configured"},503);
  try{
    if(path==="/api/certificates/billing/checkout"){
      const p=new URLSearchParams();
      p.set("mode","subscription");
      p.set("line_items[0][price]",price());
      p.set("line_items[0][quantity]","1");
      p.set("success_url",origin(req)+"/certificates/?billing=success");
      p.set("cancel_url",origin(req)+"/certificates/?billing=cancelled");
      p.set("client_reference_id",user.orgId);
      p.set("metadata[org_id]",user.orgId);
      p.set("subscription_data[metadata][org_id]",user.orgId);
      if(org.stripe_customer_id)p.set("customer",org.stripe_customer_id);
      else p.set("customer_email",user.email);
      const data=await stripePost("checkout/sessions",p);
      if(typeof data.url!=="string"||!data.url.startsWith("https://checkout.stripe.com/"))throw Error("No Stripe checkout URL");
      return answer({url:data.url});
    }
    if(path==="/api/certificates/billing/portal"){
      if(!org.stripe_customer_id)return answer({error:"No Stripe customer record yet"},409);
      const p=new URLSearchParams();
      p.set("customer",org.stripe_customer_id);p.set("return_url",origin(req)+"/certificates/");
      const data=await stripePost("billing_portal/sessions",p);
      if(typeof data.url!=="string"||!data.url.startsWith("https://billing.stripe.com/"))throw Error("No secure portal URL");
      return answer({url:data.url});
    }
    return answer({error:"Unknown billing route"},404);
  }catch(e){
    console.error("Stripe billing request failed",e instanceof Error?e.name:"unknown");
    return answer({error:"Could not open Stripe billing. No payment was taken."},503);
  }
}
