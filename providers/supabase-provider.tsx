"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import supabase from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// Create the context with the already-created singleton client
const SupabaseContext = createContext<SupabaseClient>(supabase);

/**
 * Provider component that just exposes the single Supabase instance.
 * It does NOT create a new client.
 */
export function SupabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

/**
 * Hook to access the Supabase client from any component
 */
export function useSupabase(): SupabaseClient {
  return useContext(SupabaseContext);
}
