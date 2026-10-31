import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no matchMedia; tests flip `matches` through window.__prefersDark.
window.__prefersDark = false;
window.matchMedia = vi.fn((query) => ({
  matches: query.includes('dark') && window.__prefersDark,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.className = '';
  window.__prefersDark = false;
});

// jsdom has no <dialog> methods; browsers do. Minimal stand-in: open/close and the close event.
HTMLDialogElement.prototype.showModal ??= function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function close() {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};
