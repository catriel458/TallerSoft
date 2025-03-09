import { SiInstagram, SiFacebook, SiWhatsapp } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-black/95 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center">
          <div className="flex items-center space-x-3 hover:scale-105 transition-transform">
            <img src="/logo.png" alt="MecaSys Logo" className="h-10 w-auto" />
            <h2 className="text-2xl font-bold text-white hover:text-primary transition-colors">MecaSys</h2>
          </div>

          <div className="text-center">
            <p className="text-gray-400 hover:text-gray-300 transition-colors text-lg">
              Sistema de gestión integral para talleres mecánicos
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-all transform hover:scale-110"
              >
                <SiInstagram className="h-6 w-6" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-all transform hover:scale-110"
              >
                <SiFacebook className="h-6 w-6" />
              </a>
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-all transform hover:scale-110"
              >
                <SiWhatsapp className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            © {new Date().getFullYear()} MecaSys. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}