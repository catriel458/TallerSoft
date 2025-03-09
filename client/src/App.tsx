import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import VerifyEmail from "@/pages/verify-email";
import ProfilePage from "@/pages/profile";
import ResetPassword from "@/pages/reset-password";
import { ProtectedRoute } from "@/components/protected-route";
import { lazy, Suspense } from "react";

const TurnosPage = lazy(() => import("@/pages/turnos"));
const CostosPage = lazy(() => import("@/pages/costos"));

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/reset-password" component={ResetPassword} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/turnos" component={TurnosPage} />
        <ProtectedRoute path="/costos" component={CostosPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;