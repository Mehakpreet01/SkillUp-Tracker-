"use client";
import { useGlobalContext } from "./GlobalContext";

export function useUser() {
  const { user, loading } = useGlobalContext();
  return { user, loading };
}
