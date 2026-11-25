"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_USERS } from "@/lib/mock-data";
import { ApiSimulationError, useQueuepass } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useQueuepass();
  const [email, setEmail] = useState("aria@queuepass.live");
  const [password, setPassword] = useState("nightlife2026");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiSimulationError) {
        setError(`HTTP ${err.status}: ${err.message}`);
      } else {
        setError("Unable to sign in");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-8 py-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <Card className="border-white/12 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-[11px] text-primary">
              POST /api/v1/auth/login
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              OAuth2PasswordRequestForm
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign in to Queuepass
          </CardTitle>
          <CardDescription>
            Authenticate with your organizer or attendee email to issue an HS256
            access token with a unique <code className="text-foreground">jti</code>.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Authentication failed</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">
                <Mail className="size-3.5 text-primary" />
                Email Address (OAuth2 form username field)
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aria@queuepass.live"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">
                <Lock className="size-3.5 text-primary" />
                Password (min 8 characters)
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-2 w-full justify-between font-semibold"
            >
              <span>{submitting ? "Issuing JWT..." : "Issue Bearer Token & Sign In"}</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Need an account?</span>
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Create an account (POST /auth/register) →
          </Link>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-emerald-400" />
              Seeded Organizer Accounts
            </CardTitle>
            <CardDescription className="text-xs">
              Click any fixture below to autofill credentials and test organizer
              workflows immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {MOCK_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.password_plain);
                  setError(null);
                }}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-background/70 p-3 text-left text-xs transition hover:border-primary/50 hover:bg-background"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {u.first_name} {u.last_name} (@{u.username})
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    Age {u.age}
                  </Badge>
                </div>
                <span className="font-mono text-[11px] text-primary">
                  {u.email}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Password: {u.password_plain}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-white/10 bg-background/60 p-4 font-mono text-xs text-muted-foreground">
          <div className="mb-1.5 flex items-center gap-1.5 text-foreground">
            <Terminal className="size-3.5 text-primary" />
            <span>Wire Contract Notes</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Matches modules/auth/router.py: returns 401 Unauthorized with uniform
            detail &quot;Incorrect email or password&quot; to prevent account enumeration.
          </p>
        </div>
      </div>
    </div>
  );
}
