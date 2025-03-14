import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black">
      <header className="fixed w-full bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="TallerSoft Logo" className="h-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              TallerSoft
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Button
                variant="ghost"
                className="text-white hover:text-blue-400 transition-colors"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-white hover:text-blue-400 transition-colors"
                  onClick={() => navigate("/auth")}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
                  onClick={() => navigate("/auth")}
                >
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20">
        <section className="relative h-screen flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <img
              src="/car-bg.jpg"
              alt="Luxury Car"
              className="w-full h-full object-cover opacity-50"
            />
          </div>
          <div className="relative z-10 text-center space-y-8 px-4">
            <h1 className="text-6xl font-bold text-white">
              Sistema Profesional para
              <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Talleres Mecánicos
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Gestione sus turnos, clientes y costos de manera eficiente con nuestra
              solución digital integral.
            </p>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg px-8 py-6 rounded-lg hover:opacity-90 transition-opacity"
              onClick={() => navigate("/auth")}
            >
              Comenzar Ahora
            </Button>
          </div>
        </section>

        <section className="bg-gray-900 py-20 px-4">
          <div className="container mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-black/50 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-4">Gestión de Turnos</h3>
              <p className="text-gray-400">
                Organice y administre los turnos de su taller de manera eficiente
                con nuestro sistema de agenda digital.
              </p>
            </div>
            <div className="bg-black/50 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-4">Control de Costos</h3>
              <p className="text-gray-400">
                Mantenga un registro detallado de todos los trabajos y costos
                asociados para una mejor gestión financiera.
              </p>
            </div>
            <div className="bg-black/50 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-4">Reportes Detallados</h3>
              <p className="text-gray-400">
                Acceda a informes y estadísticas completas para tomar decisiones
                informadas sobre su negocio.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <img src="/logo.png" alt="TallerSoft Logo" className="h-8" />
              <span className="text-xl font-bold text-white">TallerSoft</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} TallerSoft. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}