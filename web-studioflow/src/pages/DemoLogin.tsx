import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Beaker, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getFunctionUrl } from "@/lib/supabaseFunctions";

interface DemoAccount {
  email: string;
  label: string;
  description: string;
  userId: string;
  name: string;
  role: string;
  studioId: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "demo.admin@studioflow.app",
    label: "Dance Studio Admin",
    description: "Aurora Dance Academy — full admin dashboard",
    userId: "demo_user_admin_dance",
    name: "Aurora Admin",
    role: "studio_admin",
    studioId: "demo_studio_aurora",
  },
  {
    email: "demo.parent@studioflow.app",
    label: "Dance Studio Parent",
    description: "Diane Walsh — parent/student portal with 2 children",
    userId: "demo_user_parent_dance",
    name: "Diane Walsh",
    role: "parent",
    studioId: "demo_studio_aurora",
  },
  {
    email: "demo.crossfit@studioflow.app",
    label: "CrossFit Box Admin",
    description: "Northside CrossFit — see terminology engine in action",
    userId: "demo_user_admin_crossfit",
    name: "Northside Admin",
    role: "studio_admin",
    studioId: "demo_studio_crossfit",
  },
];

const DEMO_PASSWORD = "StudioFlowDemo123!";

/** Create an unsigned JWT matching the demo-login edge function format.
 *  The frontend only decodes (does not verify signatures), so a
 *  client-side token is functionally identical. */
function createDemoJWT(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (s: string) =>
    btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const headerB64 = enc(JSON.stringify(header));
  const payloadB64 = enc(JSON.stringify(payload));
  const sigBytes = new Uint8Array(32);
  crypto.getRandomValues(sigBytes);
  const sig = enc(String.fromCharCode(...sigBytes));
  return `${headerB64}.${payloadB64}.${sig}`;
}

export default function DemoLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setIsLoading(true);

    // Validate credentials locally first
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!account || password !== DEMO_PASSWORD) {
      setError("Invalid demo credentials");
      setIsLoading(false);
      return;
    }

    // 1. Try the Supabase edge function (fails gracefully if not deployed)
    let token: string | null = null;
    const demoLoginUrl = getFunctionUrl("demo-login");
    if (demoLoginUrl) {
      try {
        const res = await fetch(demoLoginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (res.ok) {
          const data = await res.json();
          token = data.access_token;
        }
      } catch {
        // Edge function unreachable — fall through to client-side token
      }
    }

    // 2. Fall back to client-side JWT if edge function didn't return one
    if (!token) {
      const exp = Math.floor(Date.now() / 1000) + 86400;
      token = createDemoJWT({
        sub: account.userId,
        email: account.email,
        name: account.name,
        role: account.role,
        studio_id: account.studioId,
        is_demo: true,
        exp,
        iat: Math.floor(Date.now() / 1000),
      });
    }

    // Store tokens exactly as Rork Auth does
    localStorage.setItem("rork:access_token", token);
    localStorage.setItem("rork:refresh_token", token);

    // Determine redirect based on role
    const isParent = account.role === "parent" || account.role === "caregiver";
    // Force reload so useAuth picks up the new token fresh
    window.location.href = isParent ? "/parent" : "/dashboard";
  }, [email, password]);

  function quickLogin(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    // Auto-submit after a tick so React state updates
    setTimeout(() => {
      void handleLogin();
    }, 50);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-cream to-rose-50 px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-rose-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100">
            <Beaker className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Demo Environment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore StudioFlow with pre-seeded demo data. No sign-up required.
          </p>
        </div>

        {/* Quick-select demo accounts */}
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick login
          </p>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => quickLogin(account.email)}
              className={cn(
                "w-full rounded-xl border border-amber-200/60 bg-white/70 p-3 text-left transition-all hover:bg-amber-50 hover:shadow-sm",
                email === account.email && "border-amber-400 bg-amber-50 ring-1 ring-amber-200",
              )}
            >
              <p className="text-sm font-semibold">{account.label}</p>
              <p className="text-xs text-muted-foreground">{account.description}</p>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-200/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gradient-to-br from-amber-50 via-cream to-rose-50 px-3 text-muted-foreground">
              or enter credentials
            </span>
          </div>
        </div>

        {/* Login form */}
        <Card className="border-amber-200/60 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Demo sign-in</CardTitle>
            <CardDescription>
              Use <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">StudioFlowDemo123!</code> for all accounts
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleLogin(e as unknown as React.FormEvent)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="demo.admin@studioflow.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Demo password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Sign into demo
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/login" className="font-medium text-amber-700 hover:text-amber-800">
                  <ArrowRight className="-mt-0.5 mr-1 inline h-3 w-3" />
                  Go to production sign-in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Demo data resets automatically. Do not enter real personal information.
        </p>
      </div>
    </div>
  );
}
