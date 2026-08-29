"use client";

import { createContext, useContext } from "react";

export interface UserDto {
  id: string;
  username: string;
  bio: string;
  goals: string;
  diet: string;
  heightCm: number | null;
  weightKg: number | null;
  targetKcal: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  targetSugarG: number;
  targetSodiumMg: number;
  hasOwnApiKey: boolean;
}

const UserContext = createContext<UserDto | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserDto | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): UserDto | null {
  return useContext(UserContext);
}
