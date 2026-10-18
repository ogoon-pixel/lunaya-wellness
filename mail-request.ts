import config from './config.json';
export async function requestMail(payload:unknown,timeoutMs=45000){
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>;
  const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{reject(new Error('발송 결과 확인 시간이 초과되었습니다. 메일이 도착했는지 받은편지함과 스팸함을 먼저 확인해 주세요.'));controller.abort()},timeoutMs)});
  try{return await Promise.race([(async()=>{
    const r=await fetch(config.url+'/functions/v1/lunaya-send-mail',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    const result=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(result.error||'메일을 발송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    if(result.ok!==true)throw Error('메일 서비스의 응답을 확인하지 못했습니다. 받은편지함을 확인해 주세요.');
    return result;
  })(),deadline])}finally{clearTimeout(timer!)}
}
