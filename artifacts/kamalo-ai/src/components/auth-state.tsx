import { HiOutlineArrowLeft, HiOutlineLockClosed } from "react-icons/hi2";
import { Link } from "wouter";
import type { AuthUser } from "@/lib/auth";

export function AuthLoadingState() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6 text-sm text-muted-foreground" role="status">Checking your account…</div>;
}

export function SignInState({ onSignIn, sessionExpired = false }: { onSignIn: () => void; sessionExpired?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-sm)]" role="region" aria-labelledby="sign-in-title" data-testid="state-sign-in">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><HiOutlineLockClosed size={22} /></div>
        <h1 id="sign-in-title" className="mt-5 text-2xl font-extrabold tracking-[-.04em]">{sessionExpired ? 'Your session expired' : 'Sign in to continue'}</h1>
        <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{sessionExpired ? 'Sign in again to continue your conversation and manage support requests.' : 'Your conversations and support requests are private to your account.'}</p>
        <button onClick={onSignIn} className="mt-6 rounded-lg bg-primary px-5 py-3 text-[12px] font-bold text-primary-foreground" data-testid="button-sign-in">Sign in</button>
      </div>
    </div>
  );
}

export function AccessDeniedState({ user }: { user: AuthUser | null }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-sm)]" role="alert" aria-labelledby="access-denied-title" data-testid="state-access-denied">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive"><HiOutlineLockClosed size={22} /></div>
        <h1 id="access-denied-title" className="mt-5 text-2xl font-extrabold tracking-[-.04em]">You don’t have access</h1>
        <p className="mt-3 text-[13px] leading-6 text-muted-foreground">This workspace is limited to approved support staff. Sign in with an account that has access, or return to your conversations.</p>
        {user && <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-[12px] font-bold text-primary"><HiOutlineArrowLeft size={14} /> Back to conversations</Link>}
      </div>
    </div>
  );
}