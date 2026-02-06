import { useConvexAuth } from "convex/react";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

import type { LoginFormValues, SignupFormValues } from "../schemas";

export function useAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const signIn = useCallback(
    async (values: LoginFormValues) => {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to sign in");
      }

      return result;
    },
    [],
  );

  const signUp = useCallback(
    async (values: SignupFormValues) => {
      const result = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to create account");
      }

      return result;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authClient.signOut();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}
