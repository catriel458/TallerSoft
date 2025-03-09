import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
};

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          );
        }

        if (!user) {
          setLocation("/auth");
          return null;
        }

        // Solo permitir acceso a /add-product si el usuario es administrador
        if (path === "/add-product" && !user.isAdmin) {
          setLocation("/");
          return null;
        }

        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>}>
            <Component />
          </Suspense>
        );
      }}
    </Route>
  );
}
