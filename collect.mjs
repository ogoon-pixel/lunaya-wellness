import {build} from 'esbuild';
const output=await build({entryPoints:['collector.ts'],bundle:true,write:false,format:'esm',platform:'node'});const {refreshAll}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));const result=await refreshAll();console.log(JSON.stringify(result,null,2));
