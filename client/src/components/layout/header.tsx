import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, User, Settings, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logoutMutation.mutate(undefined);
  };

  const DesktopMenu = () => (
    <div className="flex items-center space-x-6">
      <Link href="/" className="flex items-center space-x-2">
        <img src="https://i.ibb.co/S7KSfMzV/logotallersoft.png" alt="TallerSoft Logo" className="h-24 w-auto filter brightness-0 invert" />
      </Link>

      <div className="flex-1" />

      <Link href="/calendario">
        <Button variant="ghost" className="gap-2 text-white dark:text-white hover:text-primary dark:hover:text-primary">
          <Calendar className="h-4 w-4" />
          Calendario
        </Button>
      </Link>

      <Link href="/reparaciones">
        <Button variant="ghost" className="gap-2 text-white dark:text-white hover:text-primary dark:hover:text-primary">
          <DollarSign className="h-4 w-4" />
          Reparaciones
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        className="text-white dark:text-white hover:text-primary dark:hover:text-primary"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? (
          <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        )}
        <span className="sr-only">Alternar tema</span>
      </Button>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-white hover:text-primary">
              <User className="h-4 w-4" />
              {user.username}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black border-gray-800">
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer text-white hover:text-primary">
                Mi Perfil
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem
              className="text-red-500 cursor-pointer hover:text-red-400"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/auth">
          <Button variant="ghost" className="gap-2 text-white hover:text-primary">
            <User className="h-4 w-4" />
            Iniciar Sesión
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto px-4 h-16 flex items-center">
        {isMobile ? <MobileMenu /> : <DesktopMenu />}
      </div>
    </header>
  );
}

const MobileMenu = () => {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate(undefined);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col space-y-4">
          <Link href="/calendario">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Calendar className="h-4 w-4" />
              Calendario
            </Button>
          </Link>


          <Link href="/reparaciones">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <DollarSign className="h-4 w-4" />
              Reparaciones
            </Button>
          </Link>

          <Separator />

          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="h-4 w-4" />
                  Mi Perfil
                </Button>
              </Link>
              {user.isAdmin && (
                <Link href="/configuracion">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <User className="h-4 w-4" />
                Iniciar Sesión
              </Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};