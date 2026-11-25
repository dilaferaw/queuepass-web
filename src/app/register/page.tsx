"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Lock,
  Mail,
  ShieldCheck,
  User,
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
import { computeAgeFromBirthdate } from "@/lib/format";
import { ApiSimulationError, useQueuepass } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const { register, hydrated } = useQueuepass();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("2000-05-15");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // computeAgeFromBirthdate reads the current time, which must not run during
  // prerender (blocking-prerender-current-time). Defer until after hydration.
  const previewAge =
    hydrated && birthdate ? computeAgeFromBirthdate(birthdate) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        birthdate,
        password,
      });
      router.push("/account");
    } catch (err) {
      if (err instanceof ApiSimulationError) {
        setError(`HTTP ${err.status}: ${err.message}`);
      } else {
        setError("Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Card className="border-white/12 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-[11px] text-emerald-400">
              POST /api/v1/auth/register · 201 Created
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              Schema: UserCreate → UserPublic
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create your Queuepass identity
          </CardTitle>
          <CardDescription>
            Register an organizer or attendee profile. Validates uniqueness of
            email and username (409 Conflict) and computes display age
            conservatively from your birthdate.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Registration rejected</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  required
                  maxLength={100}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Elena"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  required
                  maxLength={100}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rostova"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">
                  <Mail className="size-3.5 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@synth.io"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">
                  <User className="size-3.5 text-primary" />
                  Username (3–50 chars)
                </Label>
                <Input
                  id="username"
                  required
                  minLength={3}
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="elenarostova"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="birthdate">
                    <Calendar className="size-3.5 text-emerald-400" />
                    Birthdate
                  </Label>
                  {previewAge !== null ? (
                    <span className="font-mono text-[11px] text-emerald-400">
                      Computed age: {previewAge}
                    </span>
                  ) : null}
                </div>
                <Input
                  id="birthdate"
                  type="date"
                  required
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">
                  <Lock className="size-3.5 text-primary" />
                  Password (min 8 chars)
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/4 p-3 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Why birthdate instead of age?
              </span>
              <p className="mt-1">
                Stored as birthdate: date so age never drifts and future
                ticket-purchase gates can evaluate whether the attendee turns
                18+/21+ by the event starts_at timestamp.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-1 w-full justify-between font-semibold"
            >
              <span>{submitting ? "Registering..." : "Create Account & Sign In"}</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Already registered?</span>
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in with existing account →
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
