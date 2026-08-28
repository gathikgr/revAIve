"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "merchant" | "customer" | "admin";

interface RoleContextProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("merchant");

  useEffect(() => {
    const saved = localStorage.getItem("revaive_active_role") as UserRole;
    if (saved && ["merchant", "customer", "admin"].includes(saved)) {
      setRoleState(saved);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("revaive_active_role", newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
