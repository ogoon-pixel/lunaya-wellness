import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/lunaya-wellness/',plugins:[react()],build:{outDir:'dist'},server:{host:'127.0.0.1',port:5180}});
