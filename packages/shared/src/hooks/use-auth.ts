import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import type { ApiErrorShape } from "@turnpike/shared/api/client";
import type { LoginResponse } from "@turnpike/shared/types/api";
import {
  getMe,
  login as loginRequest,
  loginWithGoogle,
  loginWithApple,
  register as registerRequest,
  sendRegisterCode,
  verifyRegister,
  updateMe,
  type RegisterVerifyPayload,
} from "@turnpike/shared/api/services/auth.api";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@turnpike/shared/lib/firebase";

type SocialProvider = "google" | "apple";

/** Remembers which provider started a full-page redirect sign-in. */
const OAUTH_PENDING_KEY = "turnpike.oauth.pending";

/**
 * Popup failures where a full-page redirect is the right recovery: a popup
 * blocker, a COOP header severing the popup channel, or a mobile / in-app
 * browser that cannot host the popup at all. These are the real-world reasons
 * "Sign in with Google" appears to do nothing.
 */
const FIREBASE_FALLBACK_CODES =
  /auth\/(popup-blocked|operation-not-supported-in-this-environment|web-storage-unsupported|internal-error|network-request-failed|timeout)/i;

/** The user deliberately closed or cancelled the popup — never auto-retry. */
const FIREBASE_CANCEL_CODES = /auth\/(popup-closed-by-user|cancelled-popup-request|user-cancelled)/i;

export const isSocialCancel = (error: unknown): boolean =>
  FIREBASE_CANCEL_CODES.test((error as { code?: string })?.code ?? "");

/** Human-readable text for the Firebase auth error codes users actually hit. */
export function firebaseAuthMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain is not authorised for Google sign-in. Add it under Firebase Console → Authentication → Settings → Authorized domains.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window — continuing with a redirect…";
    case "auth/account-exists-with-different-credential":
      return "An account already exists for this email with a different sign-in method.";
    case "auth/network-request-failed":
      return "Could not reach the sign-in service. Check your connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    default:
      return (error as { message?: string })?.message?.replace(/^Firebase:\s*/, "") ?? "Sign-in failed. Please try again.";
  }
}

const exchangeFirebaseToken = (which: SocialProvider, idToken: string): Promise<LoginResponse> =>
  which === "google" ? loginWithGoogle(idToken) : loginWithApple(idToken);

/**
 * Signs in with a social provider. Tries the popup first; if the popup path is
 * unusable (blocked, COOP, mobile/in-app browser) it falls back to a full-page
 * redirect, which `useCompleteSocialRedirect` finishes when the page returns.
 * When the redirect path is taken the returned promise never resolves because
 * the browser navigates away.
 */
async function startSocialSignIn(which: SocialProvider): Promise<LoginResponse> {
  const provider = which === "google" ? googleProvider : appleProvider;
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return await exchangeFirebaseToken(which, idToken);
  } catch (error) {
    const code = (error as { code?: string })?.code ?? "";
    if (FIREBASE_CANCEL_CODES.test(code)) throw error;
    if (FIREBASE_FALLBACK_CODES.test(code)) {
      try {
        sessionStorage.setItem(OAUTH_PENDING_KEY, which);
      } catch {
        /* storage may be unavailable; provider is re-derived from the result */
      }
      await signInWithRedirect(auth, provider);
      return await new Promise<never>(() => {});
    }
    throw error;
  }
}
import { queryKeys } from "@turnpike/shared/constants/query-keys";
import { useAuthStore } from "@turnpike/shared/store/auth-store";
import type { UserCreate, UserRole } from "@turnpike/shared/types/api";
import { usePrefs } from "./use-prefs";

export function useSession() {
  const { accessToken, user, hydrated } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const data = await getMe();
      if ((data as any).theme) {
        usePrefs.getState().setPref("dark", (data as any).theme === "dark");
      }
      return data;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    user: query.data ?? user,
    isAuthenticated: !!accessToken,
    isLoading: !hydrated || (!!accessToken && query.isLoading),
    hydrated,
  };
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useCallback(
    async (email: string, password: string) => {
      const data = await loginRequest(email, password);
      setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      });
      return data;
    },
    [setSession],
  );
}

export function useGoogleLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useCallback(async () => {
    const data = await startSocialSignIn("google");
    setSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    });
    return data;
  }, [setSession]);
}

export function useAppleLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useCallback(async () => {
    const data = await startSocialSignIn("apple");
    setSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    });
    return data;
  }, [setSession]);
}

/**
 * Completes a social sign-in that fell back to a full-page redirect. Mount once
 * near the app root: on return from the provider it reads the redirect result,
 * exchanges the Firebase ID token with the backend, and stores the session.
 * No-ops on a normal page load (no pending redirect).
 */
export function useCompleteSocialRedirect() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let active = true;
    void (async () => {
      let result;
      try {
        result = await getRedirectResult(auth);
      } catch (error) {
        const code = (error as { code?: string })?.code ?? "";
        if (active && code && code !== "auth/no-auth-event") toast.error(firebaseAuthMessage(error));
        return;
      }
      if (!result || !active) return;

      let which: SocialProvider = "google";
      try {
        const pending = sessionStorage.getItem(OAUTH_PENDING_KEY);
        if (pending === "apple") which = "apple";
        else if (!pending && result.user.providerData[0]?.providerId === "apple.com") which = "apple";
        sessionStorage.removeItem(OAUTH_PENDING_KEY);
      } catch {
        if (result.user.providerData[0]?.providerId === "apple.com") which = "apple";
      }

      try {
        const idToken = await result.user.getIdToken();
        const data = await exchangeFirebaseToken(which, idToken);
        if (!active) return;
        setSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
        });
        toast.success(`Welcome back, ${data.user?.full_name ?? "there"}`);
      } catch (error) {
        if (active) toast.error(firebaseAuthMessage(error));
      }
    })();
    return () => {
      active = false;
    };
  }, [setSession]);
}

export function useRegister() {
  const login = useLogin();

  return useCallback(
    async (payload: UserCreate) => {
      await registerRequest(payload);
      return await login(payload.email, payload.password);
    },
    [login],
  );
}

/** Email-verified sign-up, step 1: request a one-time code. */
export function useSendRegisterCode() {
  return useCallback(
    (email: string, fullName: string) => sendRegisterCode(email, fullName),
    [],
  );
}

/** Email-verified sign-up, step 2: verify the code, create account, sign in. */
export function useVerifyRegister() {
  const setSession = useAuthStore((s) => s.setSession);

  return useCallback(
    async (payload: RegisterVerifyPayload) => {
      const data = await verifyRegister(payload);
      setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      });
      return data;
    },
    [setSession],
  );
}

/**
 * Clears the session and sends the browser to `redirectTo`.
 *
 * The destination is a parameter, and navigation goes through `href` rather
 * than a typed `to`, because this package is consumed by two applications
 * with different route trees — a sign-in path that exists in one is a type
 * error in the other.
 */
export function useLogout(redirectTo = "/") {
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  return useCallback(() => {
    clear();
    toast.success("Signed out");
    void navigate({ href: redirectTo, replace: true });
  }, [clear, navigate, redirectTo]);
}

export function useHasRole(roles: UserRole[]) {
  const { user } = useSession();
  return !!user?.role && roles.includes(user.role);
}

export const describeError = (error: unknown) =>
  (error as ApiErrorShape)?.message ?? "Unexpected error";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const { accessToken, refreshToken, user } = useAuthStore.getState();

  return useMutation({
    mutationFn: updateMe,
    onSuccess: (updatedUser) => {
      if (accessToken && refreshToken) {
        setSession({
          accessToken,
          refreshToken,
          user: { ...user, ...updatedUser },
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

