// Safeguard against environments where window.fetch has only a getter
try {
  let _currentFetch = window.fetch;
  const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (!desc || (desc.configurable && !desc.set)) {
    Object.defineProperty(window, 'fetch', {
      get: () => _currentFetch,
      set: (fn) => {
        _currentFetch = fn;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Ignore if already locked
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
