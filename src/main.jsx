import React from 'react';
import ReactDOM from 'react-dom/client';
import Dhamma from './Dhamma.jsx';
import './theme.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Dhamma />
  </React.StrictMode>
);
