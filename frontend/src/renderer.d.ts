export {};

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      setTheme: (mode: 'light' | 'dark') => void;
      getInitialTheme: () => Promise<boolean>;
    };
  }
}