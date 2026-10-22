import {ingredientPages,enhanceEditorial} from './search-content.mjs';
import {editorialPages,renderEditorial} from './editorial.mjs';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {SITE,escape,safeJson,createHead} from './seo.mjs';
const config=JSON.parse(await fs.readFile('config.json','utf8'));
async function read(table){const r=await fetch(config.url+'/rest/v1/'+table,{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('SEO data fetch HTTP '+r.status);return r.json()}
const [products,briefs,status]=await Promise.all([read('lw_products?select=payload&order=category.asc,name.asc&limit=1000'),read('lw_briefs?select=day,payload,updated_at&order=day.desc&limit=30'),read('lw_source_status?select=payload')]);
if(!briefs.length)throw Error('Cannot publish empty SEO brief');
const bundle=await build({entryPoints:['App.tsx'],bundle:true,write:false,format:'esm',platform:'node',packages:'external',define:{'import.meta.env.BASE_URL':JSON.stringify('/lunaya-wellness/')}});
const source=bundle.outputFiles[0].text.replace(/from "(react(?:\/jsx-runtime)?)"/g,(_,name)=>'from '+JSON.stringify(import.meta.resolve(name)));
const {default:App}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const catalogBundle=await build({entryPoints:['catalog.ts'],bundle:true,write:false,format:'esm',platform:'node'});const {guides}=await import('data:text/javascript;base64,'+Buffer.from(catalogBundle.outputFiles[0].text).toString('base64'));
const template=await fs.readFile('dist/index.html','utf8');
if(!template.includes('<!--SEO_HEAD-->')||!template.includes('<div id="root"></div>'))throw Error('Run a clean Vite build before prerendering');
const history=briefs.map(({day,updated_at})=>({day,updated_at}));const urls=[];
for(const page of [{path:'',view:'brief',row:briefs[0]},{path:'products.html',view:'products',row:briefs[0]},...briefs.map(row=>({path:'briefs/'+row.day+'.html',view:'brief',row}))]){const title=page.path==='products.html'?'나만의 건기식 | 영양제 가격·제조사 비교 · 루나야':page.path?'오늘의 건기식 브리프 '+page.row.day+' | '+page.row.payload.guide.title+' · 루나야':'오늘의 건기식 브리프 | 건강기능식품 뉴스·성분 가이드 · 루나야';const description=page.path==='products.html'?'비타민·유산균·오메가3·간영양제 등 수집된 상품의 가격, 제조사와 쇼핑몰 평점을 비교하고 나만의 영양제 리스트를 HTML로 저장하세요.':page.row.day+' 건강기능식품 뉴스와 '+page.row.payload.guide.category+' 성분 가이드. 기능·섭취 방법·주의사항과 쇼핑인사이트 주제 선정 근거를 출처와 함께 확인하세요.';const data={canRefresh:false,products:products.map(r=>r.payload),brief:page.row.payload,history,today:page.row.day,lastUpdated:page.row.updated_at,sourceStatus:status.map(r=>r.payload)};const html=renderToString(React.createElement(App,{initial:data,initialView:page.view}));const boot='<script id="lunaya-initial-data" type="application/json">'+safeJson(data)+'</script>';const output=template.replace('<!--SEO_HEAD-->',createHead({path:page.path,title,description,modified:page.row.updated_at,article:page.path.startsWith('briefs/')?{published:page.row.day+'T08:00:00+09:00',modified:page.row.updated_at,citations:[page.row.payload.guide.source.url],about:page.row.payload.guide.category}:undefined})).replace('<div id="root"></div>','<div id="root">'+html+'</div>'+boot);const target='dist/'+(page.path||'index.html');await fs.mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await fs.writeFile(target,output);urls.push({url:SITE+page.path,modified:page.row.updated_at})}
for(const page of [...editorialPages(),...ingredientPages(guides)].map(p=>enhanceEditorial(p,guides))){await fs.mkdir('dist/'+page.path.slice(0,page.path.lastIndexOf('/')+1),{recursive:true});await fs.writeFile('dist/'+page.path,renderEditorial(page));urls.push({url:SITE+page.path,modified:page.modified||'2026-10-18T00:00:00Z'})}
await fs.writeFile('dist/llms.txt','# 루나야 · 건강기능식품 정보\n\n> 뉴스 원문 링크, 출처를 밝힌 성분 가이드와 DB 기반 상품 비교를 제공합니다. 개인별 진단이나 처방을 제공하지 않습니다.\n\n## 주요 페이지\n'+urls.map(p=>'- ['+p.url.replace(SITE,'/')+']('+p.url+')').join('\n')+'\n\n## 정보 해석\n구매 별점은 효능 근거가 아닙니다. 가격은 수집 당시 표시가격입니다. 자료 확인일과 검토 상태는 각 본문을 우선하세요.\n');
await fs.writeFile('dist/ads.txt','google.com, pub-1486084747549283, DIRECT, f08c47fec0942fa0\n');
await fs.writeFile('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: '+SITE+'sitemap.xml\n');
await fs.writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(p=>'<url><loc>'+escape(p.url)+'</loc><lastmod>'+escape(p.modified)+'</lastmod></url>').join('')+'</urlset>');
await fs.writeFile('dist/404.html','<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>페이지를 찾을 수 없습니다 · 루나야</title></head><body><h1>페이지를 찾을 수 없습니다</h1><a href="'+SITE+'">루나야 홈으로</a></body></html>');
await fs.writeFile('dist/.nojekyll','');
console.log('SEO: '+urls.length+' pages rendered with DB content, canonical, metadata, schema and sitemap.');

await fs.copyFile('coupang-banner.html','dist/coupang-banner.html');

await fs.writeFile('dist/admin.html',template.replace('<!--SEO_HEAD-->','<title>접속 통계 관리자 · 루나야</title><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="same-origin">').replace(/<script async src="https:\/\/pagead2[^<]*<\/script>/,''));
await fs.copyFile('analytics-info.html','dist/analytics-info.html');

await fs.writeFile('dist/CNAME','ogoonshop.com\n');
