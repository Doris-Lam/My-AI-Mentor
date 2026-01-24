/**
 * Application Entry Point
 * 
 * This is the main entry point for the React application.
 * It:
 * 1. Renders the root App component
 * 2. Enables React StrictMode for development warnings
 * 3. Mounts the app to the #root element in index.html
 * 
 * StrictMode helps catch potential problems during development:
 * - Identifies components with unsafe lifecycles
 * - Warns about legacy string ref API usage
 * - Detects unexpected side effects
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root and render the App component
// The ! operator tells TypeScript that getElementById will not return null
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

