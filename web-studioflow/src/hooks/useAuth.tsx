import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { AuthError } from "@supabase/supabase-js";

const AUTH_URL = import.meta.env.EXPO_PUBLIC_RORK_AUTH_URL as string;
const APP_KEY = import.meta.env.EXPO_PUBLIC_RORK_APP_KEY as string;
const FUNCTIONS_URL = import.meta.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL as string;

/** Build the Supabase Functions URL only when the env var looks like a real URL. */
function getSupabaseFunctionsUrl(): string | null {
  const raw = import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string;
  if (!raw || (!raw.startsWith("http://") && !raw.startsWith("https://"))) {
    return null;
  }
  return `${raw}/functions/v1`;
}

const ACCESS_TOKEN_KEY = "rork:access_token";
const REFRESH_TOKEN_KEY = "rork:refresh_token";
const CODE_VERIFIER_KEY = "rork:pkce_verifier";
const USER_META_KEY = "rork:user_meta";

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  role?: string;
  studioId?: string;
  isDemo?: boolean;
}

/** Check whether a JWT payload carries the demo flag. */
function isDemoPayload(payload: Record<string, unknown>): boolean {
  return payload.is_demo === true || payload.is_demo === "true";
}

function userFromToken(token: string): User | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Rork Auth JWT format
    if (payload.sub && payload.email) {
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        role: payload.role,
        studioId: payload.studio_id,
        isDemo: payload.is_demo === true || payload.is_demo === "true",
      };
    }

    return null;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  /** OAuth sign-in (Google / Apple) via Rork Auth */
  signIn: (provider: "google" | "apple") => Promise<void>;
  /** Email/password sign-in via Supabase Auth */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Demo account sign-in via edge function — returns the User for routing */
  signInDemo: (email: string, password: string) => Promise<User>;
  /** Email/password sign-up via Supabase Auth */
  signUpWithEmail: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  exchangeCode: (code: string) => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Persist user metadata alongside token so we can restore on refresh
  const persistUserMeta = useCallback((u: User) => {
    localStorage.setItem(USER_META_KEY, JSON.stringify({
      id: u.id, email: u.email, name: u.name, picture: u.picture,
      role: u.role, studioId: u.studioId, isDemo: u.isDemo,
    }));
  }, []);

  // Restore session on mount
  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    return () => {
      if (messageListenerRef.current) {
        window.removeEventListener("message", messageListenerRef.current);
        messageListenerRef.current = null;
      }
    };
  }, []);

  async function checkAuth() {
    try {
      // 1. Try Rork Auth JWT from localStorage
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken) {
        const decoded = userFromToken(accessToken);
        if (decoded) {
          persistUserMeta(decoded);
          setUser(decoded);
          setIsLoading(false);
          return;
        }
      }

      // 2. Try Supabase session (for email/password users)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const su = session.user;
        const u: User = {
          id: su.id,
          email: su.email ?? "",
          name: su.user_metadata?.name as string,
          role: su.user_metadata?.role as string,
          studioId: su.user_metadata?.studio_id as string,
          isDemo: su.user_metadata?.is_demo as boolean | undefined,
        };
        localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
        persistUserMeta(u);
        setUser(u);
        setIsLoading(false);
        return;
      }

      // 3. Try restoring from stored user metadata (survives expired/unknown tokens)
      const storedMeta = localStorage.getItem(USER_META_KEY);
      if (storedMeta) {
        try {
          const meta = JSON.parse(storedMeta) as User;
          if (meta.isDemo) {
            // Demo user with expired/absent token — just restore from metadata.
            // No network call needed; the session was intentionally client-side.
            setUser(meta);
            setIsLoading(false);
            return;
          }
        } catch { /* corrupted meta — fall through */ }
      }

      // 4. Try Rork refresh token (real accounts only, not demo)
      const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshTokenValue) {
        // Decode the refresh token before attempting refresh.
        // Demo tokens will never be valid Rork refresh tokens — skip the network call.
        const rtPayload = userFromToken(refreshTokenValue);
        if (rtPayload?.isDemo) {
          // Demo token expired — restore user from saved metadata or sign out.
          if (storedMeta) {
            try {
              setUser(JSON.parse(storedMeta) as User);
            } catch {
              await signOut();
            }
          } else {
            await signOut();
          }
          setIsLoading(false);
          return;
        }
        await refreshToken();
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function exchangeCode(code: string) {
    const verifier = localStorage.getItem(CODE_VERIFIER_KEY);
    if (!verifier) {
      setError("Missing PKCE verifier — sign in again.");
      return;
    }
    localStorage.removeItem(CODE_VERIFIER_KEY);

    const response = await fetch(`${AUTH_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_key: APP_KEY, code, code_verifier: verifier }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? `Sign in failed (${response.status})`);
      return;
    }

    const { access_token, refresh_token, user: userData } = await response.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    const resolved = userData ?? userFromToken(access_token);
    if (resolved) {
      persistUserMeta(resolved);
      setUser(resolved);
    }
  }

  // ───── OAuth (Google / Apple) via Rork Auth ─────
  async function signIn(provider: "google" | "apple") {
    setIsSigningIn(true);
    setError(null);
    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      localStorage.setItem(CODE_VERIFIER_KEY, verifier);

      const isPreview = window.parent !== window;
      const body: Record<string, unknown> = {
        app_key: APP_KEY,
        provider,
        code_challenge: challenge,
        target: "web",
        env: isPreview ? "preview" : "production",
      };
      if (isPreview) body.app_path = "web";

      const response = await fetch(`${AUTH_URL}/oauth/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        localStorage.removeItem(CODE_VERIFIER_KEY);
        const errorBody = await response.json().catch(() => ({}));
        setError(errorBody.error ?? `Sign in failed (${response.status})`);
        return;
      }

      const { auth_url } = await response.json();

      if (isPreview) {
        const popup = window.open(auth_url, "_blank", "width=500,height=650");
        if (!popup) {
          setError("Popup blocked — please allow popups for this site.");
          localStorage.removeItem(CODE_VERIFIER_KEY);
          return;
        }

        await new Promise<void>((resolve) => {
          const onMessage = async (event: MessageEvent) => {
            if (event.data?.type !== "rork_auth_callback") return;
            window.removeEventListener("message", onMessage);
            messageListenerRef.current = null;
            clearInterval(pollTimer);
            const code = event.data.code;
            if (code) {
              await exchangeCode(code);
            }
            resolve();
          };
          messageListenerRef.current = onMessage;
          window.addEventListener("message", onMessage);

          const pollTimer = setInterval(() => {
            if (popup.closed) {
              clearInterval(pollTimer);
              window.removeEventListener("message", onMessage);
              messageListenerRef.current = null;
              localStorage.removeItem(CODE_VERIFIER_KEY);
              resolve();
            }
          }, 500);
        });
      } else {
        window.location.href = auth_url;
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      setError(err instanceof Error ? err.message : "Sign in failed");
      localStorage.removeItem(CODE_VERIFIER_KEY);
    } finally {
      setIsSigningIn(false);
    }
  }

  // ───── Demo account sign-in via edge function ─────
  async function signInDemo(email: string, password: string): Promise<User> {
    setIsSigningIn(true);
    setError(null);
    try {
      // Only call the edge function when we have a valid Supabase Functions URL.
      const functionsUrl = getSupabaseFunctionsUrl();
      if (functionsUrl) {
        try {
          const res = await fetch(`${functionsUrl}/demo-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password }),
          });

          if (res.ok) {
            const data = await res.json();
            // Store tokens identically to production auth flow
            localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

            // Decode user from token or response body
            const resolved = data.user ?? userFromToken(data.access_token);
            if (!resolved) {
              throw new Error("Failed to decode demo session");
            }
            persistUserMeta(resolved);
            setUser(resolved);
            return resolved;
          }
          // Non-ok response — fall through to client-side token
        } catch {
          // Edge function unreachable — fall through to client-side token
        }
      }

      // Client-side fallback: validate locally and issue a synthetic JWT.
      // This is intentionally NOT a real authentication — it's for demo evaluation only.
      throw new Error("CLIENT_SIDE_REQUIRED");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Demo sign-in failed";
      // "CLIENT_SIDE_REQUIRED" is our sentinel — not a real error, the caller
      // (DemoLogin page) handles client-side JWT creation.
      if (msg !== "CLIENT_SIDE_REQUIRED") {
        setError(msg);
      }
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  }

  // ───── Email/password via Supabase Auth ─────
  async function signInWithEmail(email: string, password: string) {
    setIsSigningIn(true);
    setError(null);
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) {
        setError(formatSupabaseError(authErr));
        return;
      }
      if (data.session) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.session.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.session.refresh_token);
        const su = data.session.user;
        const u: User = {
          id: su.id,
          email: su.email ?? email,
          name: su.user_metadata?.name as string,
          role: su.user_metadata?.role as string,
          studioId: su.user_metadata?.studio_id as string,
          isDemo: su.user_metadata?.is_demo as boolean | undefined,
        };
        persistUserMeta(u);
        setUser(u);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>) {
    setIsSigningIn(true);
    setError(null);
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (authErr) {
        setError(formatSupabaseError(authErr));
        return;
      }
      // If the session is immediately available (no email confirmation required)
      if (data.session) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.session.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.session.refresh_token);
        const su = data.session.user;
        const u: User = {
          id: su.id,
          email: su.email ?? email,
          name: metadata?.name as string,
          role: metadata?.role as string,
          studioId: metadata?.studio_id as string,
        };
        persistUserMeta(u);
        setUser(u);
      }
      // If email confirmation is required, data.session will be null
      // and the user needs to verify their email first
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function refreshToken() {
    const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!stored) {
      await signOut();
      return;
    }

    // Try Supabase session refresh first (it handles its own refresh)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
      const su = session.user;
      setUser({
        id: su.id,
        email: su.email ?? "",
        name: su.user_metadata?.name as string,
        role: su.user_metadata?.role as string,
        studioId: su.user_metadata?.studio_id as string,
      });
      return;
    }

    // Fall back to Rork Auth refresh
    const response = await fetch(`${AUTH_URL}/oauth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_key: APP_KEY, refresh_token: stored }),
    });

    if (!response.ok) {
      await signOut();
      return;
    }

    const { access_token } = await response.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    const decoded = userFromToken(access_token);
    if (decoded) {
      persistUserMeta(decoded);
      setUser(decoded);
    }
  }

  async function signOut() {
    // Sign out of Supabase Auth if there's a Supabase session
    try {
      await supabase.auth.signOut();
    } catch {
      // Supabase signOut may fail if no session — ignore
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CODE_VERIFIER_KEY);
    localStorage.removeItem(USER_META_KEY);
    setUser(null);
  }

  function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        user, isLoading, isSigningIn, error,
        signIn, signInWithEmail, signInDemo, signUpWithEmail,
        signOut, clearError, exchangeCode, getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/** Turn Supabase AuthError into a user-friendly string. */
function formatSupabaseError(err: AuthError): string {
  switch (err.message) {
    case "Invalid login credentials":
      return "Invalid email or password. Please try again.";
    case "Email not confirmed":
      return "Please verify your email address before signing in.";
    case "User already registered":
      return "An account with this email already exists.";
    default:
      return err.message;
  }
}
