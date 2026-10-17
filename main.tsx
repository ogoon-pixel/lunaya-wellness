import {createRoot} from 'react-dom/client';
import {useEffect,useState} from 'react';
import App from './App';
import {loadData} from './client';
import {kstDay} from './catalog';
import './style.css';
function Root(){const [data,setData]=useState<any>(null),[error,setError]=useState('');useEffect(()=>{loadData().then(setData).catch(()=>setError('데이터 연결을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.'))},[]);if(!data)return <div className="loading"><h1>lunaya✳</h1><p>{error||'오늘의 브리프와 상품정보를 불러오는 중입니다.'}</p>{error&&<button onClick={()=>location.reload()}>다시 시도</button>}</div>;return <App initial={data} initialView={new URLSearchParams(location.search).get('view')==='products'?'products':'brief'}/>}
createRoot(document.getElementById('root')!).render(<Root/>);
