import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins:[react()], base: '/glacier-atlas/', build: { sourcemap: true } });
