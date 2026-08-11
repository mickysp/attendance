"use client";

import { create } from "zustand";

type AuthStore = {
  username: string;
  password: string;
  remember: boolean;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setRemember: (remember: boolean) => void;
  clearPassword: () => void;
  loadRememberUser: () => void;
  saveRememberUser: () => void;
  clearRememberUser: () => void;
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  username: "",
  password: "",
  remember: false,
  setUsername: (username: string) => set({ username }),
  setPassword: (password: string) => set({ password }),
  setRemember: (remember: boolean) => set({ remember }),
  clearPassword: () => set({ password: "" }),
  loadRememberUser: () => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("rememberUser");

      if (!saved) return;

      const data = JSON.parse(saved);

      set({
        username: data.username ?? "",
        remember: true,
      });
    } catch {
      localStorage.removeItem("rememberUser");
    }
  },

  saveRememberUser: () => {
    if (typeof window === "undefined") return;

    const { username } = get();

    localStorage.setItem(
      "rememberUser",
      JSON.stringify({
        username,
      }),
    );
  },

  clearRememberUser: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("rememberUser");

    set({
      remember: false,
    });
  },
}));