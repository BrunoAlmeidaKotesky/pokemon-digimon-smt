import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { init } from './state/app';
import { autoJoin } from './online/runtime';

init();
autoJoin();
createRoot(document.getElementById('root')!).render(<App />);
