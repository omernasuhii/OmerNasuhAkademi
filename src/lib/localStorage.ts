export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  },
  getSessionItem: (key: string): string | null => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setSessionItem: (key: string, value: string): void => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {}
  },
  removeSessionItem: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {}
  }
};
