/// <reference types="vite/client" />

declare global {
  interface Window {
    seek?: (t: number) => void;
  }
}

export {};
