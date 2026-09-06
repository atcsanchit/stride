import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { preloadGoogleAuth } from './lib/google-auth';
import { StrideProvider } from './store/StrideState';
import './index.css';

preloadGoogleAuth();

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<StrideProvider>
			<App />
		</StrideProvider>
	</StrictMode>,
);
