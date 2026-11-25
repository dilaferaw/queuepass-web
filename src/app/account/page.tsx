"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQueuepass } from "@/lib/store";

export default function AccountPage() {
  const router = useRouter();
  const {
    currentUser,
    token,
    tokenPayload,
    revocationState,
    logout,
    logoutAll,
    quickDemoLogin,
  } = useQueuepass();

  if (!currentUser || !token || !tokenPayload) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-white/10 bg-card/70 p-10 text-center">
        <KeyRound className="size-10 text-primary" />
        <div className="space-y-1">
          <h1 className="text-xl font-bold">No Active Bearer Session (401)</h1>
          <p className="text-xs text-muted-foreground">
            Sign in or launch a demo organizer session to inspect GET
            /api/v1/auth/me and Redis JWT revocation state.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "default" })}>
            Sign in
          </Link>
          <Button
            variant="outline"
            onClick={() => void quickDemoLogin("aria@queuepass.live")}
          >
            <Sparkles className="size-3.5 text-primary" />
            Instant Demo Login (Aria Voss)
          </Button>
        </div>
      </div>
    );
  }

  const userCutoff = revocationState.userCutoffs[currentUser.id];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-emerald-400">
              GET /api/v1/auth/me · 200 OK
            </Badge>
            <Badge variant="secondary" className="font-mono">
              Active Session
            </Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Identity & JWT Revocation Telemetry
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
          >
            <LogOut className="size-3.5" />
            Logout Current Token (POST /auth/logout)
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await logoutAll();
              router.push("/login");
            }}
          >
            <ShieldAlert className="size-3.5" />
            Revoke All Sessions (POST /auth/logout-all)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/12 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              UserPublic Projection
            </CardTitle>
            <CardDescription>
              Returned by /api/v1/auth/me. Never exposes password_hash.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 font-mono text-xs">
            <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3.5 py-2.5">
              <span className="text-muted-foreground">id (UUIDv4)</span>
              <span className="text-foreground">{currentUser.id}</span>
            </div>
            <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3.5 py-2.5">
              <span className="text-muted-foreground">username</span>
              <span className="text-primary">@{currentUser.username}</span>
            </div>
            <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3.5 py-2.5">
              <span className="text-muted-foreground">email</span>
              <span className="text-foreground">{currentUser.email}</span>
            </div>
            <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3.5 py-2.5">
              <span className="text-muted-foreground">first_name / last_name</span>
              <span className="text-foreground">
                {currentUser.first_name} {currentUser.last_name}
              </span>
            </div>
            <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3.5 py-2.5">
              <span className="text-muted-foreground">birthdate → computed age</span>
              <span className="text-emerald-400">
                {currentUser.birthdate} ({currentUser.age} years old)
              </span>
            </div>
            <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3.5 py-2.5">
              <span className="text-muted-foreground">is_active</span>
              <span className="text-emerald-400">
                {String(currentUser.is_active)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/12 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              Decoded TokenPayload & Redis DB 0 State
            </CardTitle>
            <CardDescription>
              Mirrors TokenPayload and Increment 2 Redis JTI denylist + user
              cutoff semantics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 font-mono text-xs">
            <div className="rounded-xl border border-primary/30 bg-primary/8 p-3">
              <div className="mb-1 text-[10px] text-primary uppercase">
                Decoded Claims (HS256)
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-foreground">
                {JSON.stringify(tokenPayload, null, 2)}
              </pre>
            </div>

            <div className="rounded-xl border border-white/8 bg-background/60 p-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground uppercase">
                <span>Redis Revocation Store (DB 0)</span>
                <span className="text-emerald-400">
                  {revocationState.revokedJtis.length} revoked JTIs
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Last logout-all cutoff for user:{" "}
                <span className="text-foreground">
                  {userCutoff
                    ? new Date(userCutoff * 1000).toISOString()
                    : "None recorded"}
                </span>
              </p>
              {revocationState.revokedJtis.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {revocationState.revokedJtis.slice(0, 4).map((jti) => (
                    <span
                      key={jti}
                      className="rounded bg-destructive/15 px-2 py-0.5 text-[10px] text-destructive"
                    >
                      denylist:jti:{jti.slice(0, 8)}…
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="text-[11px] text-muted-foreground">
            Any token with a JTI on the denylist or an iat &lt;= user cutoff is
            rejected with 401 by get_current_user.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
