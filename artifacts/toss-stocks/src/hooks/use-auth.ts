import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const [userId, setUserIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("toss_userId");
    return stored ? parseInt(stored, 10) : null;
  });

  const queryClient = useQueryClient();

  const login = (id: number) => {
    localStorage.setItem("toss_userId", id.toString());
    setUserIdState(id);
  };

  const logout = () => {
    localStorage.removeItem("toss_userId");
    setUserIdState(null);
    queryClient.clear();
  };

  return { userId, login, logout };
}
