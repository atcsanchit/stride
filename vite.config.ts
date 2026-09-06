import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pythonLab } from './python-lab.ts';
import { stridePersist } from './stride-persist.ts';

export default defineConfig({
	plugins: [react(), pythonLab(), stridePersist()],
	server: {
		port: 5174,
		strictPort: true,
	},
});
