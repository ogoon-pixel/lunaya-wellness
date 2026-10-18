# Lunaya mail server source

Secrets are configured in provider dashboards and never included here. Public origins: https://ogoonshop.com, https://www.ogoonshop.com, and legacy GitHub origin. Google Workspace sender: ogoon@ogoonshop.com. Deployment uses the standalone bundle produced by esbuild.

## index.ts

```typescript
import {exportHtml,mailSubject} from '../export.ts';
declare const Deno:any;
const allowedOrigins=['https://ogoonshop.com','https://www.ogoonshop.com','https://ogoon-pixel.github.io'];
const origin='https://ogoonshop.com';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey,content-type,authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'};
export async function handleMail(req:Request){const requestOrigin=req.headers.get('origin')||'';const responseHeaders={...headers,'Access-Control-Allow-Origin':allowedOrigins.includes(requestOrigin)?requestOrigin:origin};const reply=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:responseHeaders});if(!allowedOrigins.includes(requestOrigin))return reply({error:'허용되지 않은 요청입니다.'},403);if(req.method==='OPTIONS')return new Response(null,{status:204,headers:responseHeaders});if(req.method!=='POST')return reply({error:'POST 요청이 필요합니다.'},405);if(Number(req.headers.get('content-length')||0)>12000)return reply({error:'요청이 너무 큽니다.'},413);
const base=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),relay=Deno.env.get('GOOGLE_MAIL_URL'),token=Deno.env.get('LUNAYA_MAIL_TOKEN');if(!base||!key||!relay||!token||!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(relay))return reply({error:'메일 서비스를 연결 중입니다. HTML 다운로드를 이용해 주세요.'},503);
try{const text=await req.text();if(text.length>12000)return reply({error:'요청이 너무 큽니다.'},413);const p=JSON.parse(text);if(p.check===true){const r=await fetch(relay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,action:'health'}),signal:AbortSignal.timeout(30000)});const health=await r.json();return reply({connected:!!health.ok,code:health.code||null})}if(typeof p.to!=='string'||p.to.length>254||!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(p.to)||!Array.isArray(p.items)||p.items.length<1||p.items.length>30||!p.items.every((x:any)=>/^[a-zA-Z0-9_-]{1,100}$/.test(x.id)&&Number.isInteger(x.qty)&&x.qty>=1&&x.qty<=99)||!/^\d{4}-\d{2}-\d{2}$/.test(p.day)||typeof p.title!=='string'||p.title.length>100||!/^[a-zA-Z0-9-]{36}$/.test(p.requestId))return reply({error:'이메일 주소와 선택 제품을 확인해 주세요.'},400);
const rest=async(path:string,options:any={})=>{const r=await fetch(base+'/rest/v1/'+path,{...options,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('DB');return r.json()};
const ids=[...new Set(p.items.map((x:any)=>x.id))];const rows=await rest('lw_products?select=id,payload&id=in.('+ids.join(',')+')');if(rows.length!==ids.length)return reply({error:'일부 상품이 변경되었습니다. 페이지를 새로고침해 주세요.'},400);const briefRows=await rest('lw_briefs?select=payload&day=eq.'+p.day+'&limit=1');if(!briefRows.length)return reply({error:'브리프를 찾을 수 없습니다.'},400);const products=p.items.map((x:any)=>({product:rows.find((r:any)=>r.id===x.id).payload,qty:x.qty}));
const hash=async(value:string)=>{const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(token),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('')};const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();const reserved=await rest('rpc/lw_reserve_mail',{method:'POST',body:JSON.stringify({p_recipient:await hash(p.to.toLowerCase()),p_ip:await hash(ip)})});if(!reserved)return reply({error:'잠시 후 다시 시도해 주세요. 같은 주소에는 하루 3회, 5분 간격으로 보낼 수 있습니다.'},429);
const html=exportHtml(briefRows[0].payload,products,p.title);const response=await fetch(relay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,to:p.to,html,requestId:p.requestId}),signal:AbortSignal.timeout(30000)});const result=await response.json();if(!response.ok||!result.ok)return reply({error:'Google 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.'},502);return reply({ok:true,subject:mailSubject()});}catch{return reply({error:'메일 발송을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.'},502)}}
Deno.serve(handleMail);

```

## Code.gs

```typescript
function doPost(e) {
  const json = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let stage = "request";
  try {
    const p = JSON.parse(e.postData.contents || '{}');
    const secret = (PropertiesService.getScriptProperties().getProperty('LUNAYA_MAIL_TOKEN')||'').trim();
    if (secret.length < 32) return json({ok:false,code:'token_missing_or_short'});
    if (String(p.token||'').trim() !== secret) return json({ok:false,code:'token_mismatch'});
    if (Session.getEffectiveUser().getEmail().toLowerCase() !== 'ogoon@ogoonshop.com') return json({ok:false,code:'sender_mismatch'});
    if (p.action === 'health') return json({ok:true});
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(p.to) || p.to.length > 254 || typeof p.html !== 'string' || p.html.length > 250000 || !/^[a-zA-Z0-9-]{36}$/.test(p.requestId)) return json({ok:false});
    stage = "lock";
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      const cache = CacheService.getScriptCache();
      if (cache.get(p.requestId)) return json({ok:true});
      const day = Utilities.formatDate(new Date(),'Asia/Seoul','yyMMdd');
      const props = PropertiesService.getScriptProperties();
      const count = Number(props.getProperty('count-'+day)||0);
      stage = "mail_quota";
      if (count>=50 || MailApp.getRemainingDailyQuota()<1) return json({ok:false,code:"quota_exceeded"});
      props.setProperty('count-'+day,String(count+1));
      stage = "mail_send";
      MailApp.sendEmail({to:p.to,subject:'[루나야의 웨니스 브리프] 건강한 한알 정보 '+day,body:'선택한 건강기능식품과 브리프는 HTML 첨부파일에서도 확인할 수 있습니다.',htmlBody:p.html,name:'루나야',replyTo:'ogoon@ogoonshop.com',attachments:[Utilities.newBlob(p.html,'text/html','lunaya-wellness-'+day+'.html')]});
      cache.put(p.requestId,'sent',21600);
      return json({ok:true});
    } finally { lock.releaseLock(); }
  } catch (_) { return json({ok:false,code:stage+"_failed"}); }
}
function doGet(){return ContentService.createTextOutput('Lunaya mail relay');}

```

## mail.sql

```sql
create table if not exists public.lw_mail_limits (key text primary key, count integer not null default 0, last_at timestamptz not null default now(), expires_at timestamptz not null);
alter table public.lw_mail_limits enable row level security;
revoke all on public.lw_mail_limits from public,anon,authenticated;
grant all on public.lw_mail_limits to service_role;
create or replace function public.lw_reserve_mail(p_recipient text,p_ip text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare k text; d text:=to_char(now() at time zone 'Asia/Seoul','YYYYMMDD'); n integer; recent timestamptz;
begin
 if p_recipient !~ '^[a-f0-9]{64}$' or p_ip !~ '^[a-f0-9]{64}$' then return false; end if;
 perform pg_advisory_xact_lock(879451231);
 delete from public.lw_mail_limits where expires_at < now();
 foreach k in array array['global:'||d,'recipient:'||p_recipient||':'||d,'ip:'||p_ip||':'||d] loop
  select count,last_at into n,recent from public.lw_mail_limits where key=k;
  if n is not null and (n >= case when k like 'global:%' then 50 when k like 'recipient:%' then 3 else 10 end or (k like 'recipient:%' and recent>now()-interval '5 minutes')) then return false; end if;
 end loop;
 foreach k in array array['global:'||d,'recipient:'||p_recipient||':'||d,'ip:'||p_ip||':'||d] loop
  insert into public.lw_mail_limits(key,count,last_at,expires_at) values(k,1,now(),now()+interval '2 days') on conflict(key) do update set count=lw_mail_limits.count+1,last_at=now();
 end loop;
 return true;
end;$$;
revoke all on function public.lw_reserve_mail(text,text) from public,anon,authenticated;
grant execute on function public.lw_reserve_mail(text,text) to service_role;

```
