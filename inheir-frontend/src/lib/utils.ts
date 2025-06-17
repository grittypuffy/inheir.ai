import { redirect } from "next/navigation";

export const isSignedIn = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("status");
  return !!token;
}

export const isSignedOut = (): boolean => {
  return !isSignedIn();
}

export const signIn = () => {
  if (typeof window === "undefined") return;

  localStorage.setItem("status", "in");
  redirect("/dashboard");
}

export const signOut = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("status");
  redirect("/");
}

export const protect = (fn: Function) => {
  if (isSignedIn()) {
    return fn();
  }
  redirect("/");
}
