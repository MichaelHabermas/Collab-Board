import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Konva creates 2D contexts without willReadFrequently; patch so the browser can optimize readbacks and the console warning goes away.
const getContext = HTMLCanvasElement.prototype.getContext;
if (getContext) {
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    options?: CanvasRenderingContext2DSettings
  ): RenderingContext | null {
    const opts =
      contextId === '2d' ? { ...(options ?? {}), willReadFrequently: true as const } : options;
    return getContext.call(this, contextId, opts);
  } as typeof getContext;
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? '';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  );
}
