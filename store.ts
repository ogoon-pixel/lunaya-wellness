import {CONTENT_REVIEW,reviewedNews} from './content-review';
import {SOURCES,guides,kstDay,type Product} from './catalog';
const variables=process.env;
const base=()=>{const u=variables.SUPABASE_URL;if(!u)throw Error('SUPABASE_URL is required');return u.replace(/\/$/,'')};
export async function rest(table:string,options:RequestInit={}){const key=variables.SUPABASE_SECRET_KEY||variables.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw Error('Supabase server secret is required');const response=await fetch(base()+'/rest/v1/'+table,{...options,headers:{apikey:key,...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{}),'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal',...options.headers},signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Supabase '+table.split('?')[0]+' HTTP '+response.status);const text=await response.text();return text?JSON.parse(text):null}
export function uniqueProducts(products:Product[]){return [...new Map(products.map(p=>[p.id,p])).values()]}
export async function saveProducts(products:Product[]){products=uniqueProducts(products);if(!products.length)return;await rest('lw_products?on_conflict=id',{method:'POST',body:JSON.stringify(products.map(p=>({id:p.id,name:p.name,category:p.category,shop:p.shop,payload:p,updated_at:new Date().toISOString()})))})}
export async function readProducts(){const rows=await rest('lw_products?select=payload&limit=1000',{method:'GET'});return rows.map((r:any)=>r.payload) as Product[]}
export async function saveBrief(payload:any){payload={...payload,contentReview:CONTENT_REVIEW,reviewedNews};await rest('lw_briefs?on_conflict=day',{method:'POST',body:JSON.stringify({day:payload.day,payload,updated_at:new Date().toISOString()})})}
export async function saveStatus(payload:any){await rest('lw_source_status?on_conflict=id',{method:'POST',body:JSON.stringify({id:payload.id,payload,updated_at:new Date().toISOString()})})}
export async function saveRun(payload:any){await rest('lw_crawl_runs',{method:'POST',body:JSON.stringify({id:payload.id,payload})})}
