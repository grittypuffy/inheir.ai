export const isSignedIn = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("status");
  return !!token;
}

export const isSignedOut = (): boolean => {
  return !isSignedIn();
}

export const setItems = (items?: Array<{ key: string, value: string }>) => {
  if (typeof window === "undefined") return;

  localStorage.setItem("status", "in");
  if (items && items.length > 0) {
    items.forEach(item => {
      localStorage.setItem(item.key, item.value);
    });
  }
}

export const clearItems = () => {
  if (typeof window === "undefined") return;

  localStorage.clear();
}

export const getItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(key);
}
