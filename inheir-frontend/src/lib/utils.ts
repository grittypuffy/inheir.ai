import { redirect } from "next/navigation";

export const isSignedIn = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("status");
  return !!token;
}

export const isSignedOut = (): boolean => {
  return !isSignedIn();
}

export const redirectIfSignedIn = () => {
  if (isSignedIn()) {
    redirect("/dashboard");
  }
  return null;
}

export const redirectIfSignedOut = () => {
  if (isSignedOut()) {
    redirect("/");
  }
  return null;
}

export const signIn = () => {
  if (typeof window === "undefined") return;

  localStorage.setItem("status", "in");
  redirectIfSignedIn();
}

export const signOut = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("status");
  redirectIfSignedOut();
}

export const protect = (fn: Function) => {
  if (isSignedIn()) {
    return fn();
  }
  redirectIfSignedOut();
}
