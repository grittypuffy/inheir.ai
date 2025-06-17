import { redirect } from "next/navigation";

export const isSignedIn = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("status");
  return !!token;
}

export const isSignedOut = (): boolean => {
  return !isSignedIn();
}

export const signIn = (items?: Array<{ key: string, value: string }>) => {
  if (typeof window === "undefined") return;

  localStorage.setItem("status", "in");
  if (items && items.length > 0) {
    items.forEach(item => {
      localStorage.setItem(item.key, item.value);
    });
  }

  redirect("/dashboard");
}

export const signOut = () => {
  if (typeof window === "undefined") return;

  localStorage.clear();
  redirect("/");
}

export const getItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(key);
}

export const protect = (fn: Function) => {
  if (isSignedIn()) {
    return fn();
  }
  redirect("/");
}
