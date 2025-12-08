import React from 'react';
import ReactDOM from 'react-dom/client';
import { SammyWidget } from './SammyWidget';
import './widget.css';

// Configuration from script tag data attributes
interface WidgetConfig {
  serverUrl: string;
  primaryColor: string;
  position: 'left' | 'right';
  greeting: string;
  agentName: string;
}

// Get config from script tag
function getWidgetConfig(): WidgetConfig {
  const script = document.querySelector('script[data-sammy-widget]') as HTMLScriptElement;
  
  return {
    serverUrl: script?.dataset.serverUrl || 'http://localhost:3001',
    primaryColor: script?.dataset.primaryColor || '#6366f1',
    position: (script?.dataset.position as 'left' | 'right') || 'right',
    greeting: script?.dataset.greeting || "Hey there! 👋 I'm Sammy, your AI assistant. How can I help you today?",
    agentName: script?.dataset.agentName || 'Sammy',
  };
}

// Initialize widget
function initSammyWidget() {
  // Create container
  const container = document.createElement('div');
  container.id = 'sammy-widget-root';
  document.body.appendChild(container);

  // Get config
  const config = getWidgetConfig();

  // Render widget
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <SammyWidget config={config} />
    </React.StrictMode>
  );
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSammyWidget);
} else {
  initSammyWidget();
}

// Expose global API for controlling the widget
(window as any).SammyWidget = {
  open: () => {
    window.dispatchEvent(new CustomEvent('sammy:open'));
  },
  close: () => {
    window.dispatchEvent(new CustomEvent('sammy:close'));
  },
  toggle: () => {
    window.dispatchEvent(new CustomEvent('sammy:toggle'));
  },
};

