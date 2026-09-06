import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StrideProvider } from './store/StrideState';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<StrideProvider>
			<App />
		</StrideProvider>
	</StrictMode>,
);
