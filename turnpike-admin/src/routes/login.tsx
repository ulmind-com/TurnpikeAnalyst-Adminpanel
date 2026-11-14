import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Hexagon, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AuroraBackground } from "@turnpike/shared/components/effects/aurora-background";
import { GlassCard } from "@turnpike/shared/components/premium/glass-card";
import { MagneticButton } from "@turnpike/shared/components/premium/magnetic-button";
import { Input } from "@turnpike/shared/components/ui/input";
import { Label } from "@turnpike/shared/components/ui/label";
import { describeError, useLogin, useSession } from "@turnpike/shared/hooks/use-auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Turnpike Analyst Enterprise Console" },
      {
        name: "description",
        content:
          "Secure sign-in for the Turnpike Analyst enterprise administration console.",
      },
      { property: "og:title", content: "Sign in — Turnpike Analyst Enterprise Console" },
      {
        property: "og:description",
        content: "Secure sign-in for the Turnpike Analyst enterprise administration console.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const { isAuthenticated, hydrated } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && isAuthenticated) void navigate({ to: "/admin", replace: true });
  }, [hydrated, isAuthenticated, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await login(email.trim(), password);
      toast.success(`Welcome back, ${data.user?.full_name ?? "operator"}`);
      void navigate({ to: "/admin", replace: true });
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-glow">
              <Hexagon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Turnpike Analyst</p>
              <p className="text-xs text-muted-foreground">Enterprise Console</p>
            </div>
          </div>

          <h1 className="mt-7 text-2xl font-semibold tracking-tight">
            Sign in to your <span className="gradient-text">workspace</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Authenticate against the live Turnpike Analyst platform API.
          </p>

          <div className="mt-7">
            <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-11 bg-background/60 backdrop-blur"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-11 bg-background/60 pr-11 backdrop-blur"
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-inset ring-destructive/25"
              >
                {error}
              </motion.p>
            )}

            <MagneticButton type="submit" disabled={pending} className="h-11 w-full text-sm">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Authenticating…
                </>
              ) : (
                "Sign in"
              )}
            </MagneticButton>
          </form>
          </div>


          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Tokens are refreshed automatically and never leave
            this browser.
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
