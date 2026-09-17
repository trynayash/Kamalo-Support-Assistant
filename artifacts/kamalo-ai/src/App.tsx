import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { HomePage } from '@/pages/home';
import { KnowledgePage } from '@/pages/knowledge';
import { SupportPage } from '@/pages/support';
import { SupportTicketDetailPage } from '@/pages/support-ticket-detail';
import { AdminTicketsPage } from '@/pages/admin-tickets';
import { HistoryPage } from '@/pages/history';
import { useAuth, type AuthRole, type AuthUser } from '@/lib/auth';
import { AccessDeniedState, AuthLoadingState, SignInState } from '@/components/auth-state';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const auth = useAuth();
  if (auth.isLoading) return <AuthLoadingState />;
  if (auth.authFailure === "denied") return <AccessDeniedState user={auth.user} />;
  if (!auth.isAuthenticated) return <SignInState onSignIn={auth.login} sessionExpired={auth.authFailure === "required"} />;
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/admin/knowledge">{() => <RoleGuard user={auth.user} roles={['support', 'admin']}><KnowledgePage /></RoleGuard>}</Route>
        <Route path="/support" component={SupportPage} />
        <Route path="/support/:ticketId" component={SupportTicketDetailPage} />
        <Route path="/admin/tickets">{() => <RoleGuard user={auth.user} roles={['support', 'admin']}><AdminTicketsPage /></RoleGuard>}</Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoleGuard({ user, roles, children }: { user: AuthUser | null; roles: AuthRole[]; children: ReactNode }) {
  return user && roles.includes(user.role) ? <>{children}</> : <AccessDeniedState user={user} />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
