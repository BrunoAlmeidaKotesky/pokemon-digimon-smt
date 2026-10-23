import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { init } from './state/app';

init();
createRoot(document.getElementById('root')!).render(<App />);
