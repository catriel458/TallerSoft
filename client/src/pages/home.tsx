import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Carousel } from "@/components/ui/carousel";
import type { Turno, Costo } from "@shared/schema";

export default function Home() {
  const { data: turnos = [], isLoading: turnosLoading } = useQuery<Turno[]>({
    queryKey: ["/api/turnos"],
  });

  const { data: costos = [], isLoading: costosLoading } = useQuery<Costo[]>({
    queryKey: ["/api/costos"],
  });

  const carImages = [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1620223741726-7d39ff6e4e6c?q=80&w=1530&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-1">
        <section className="relative h-[80vh] overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-black/90" />
          <Carousel className="h-full w-full" opts={{ loop: true }}>
            {carImages.map((image, index) => (
              <div key={index} className="relative h-full w-full flex-[0_0_100%]">
                <img
                  src={image}
                  alt={`Car ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </Carousel>
          <div className="absolute inset-0 z-20 flex items-center justify-center text-center">
            <div className="max-w-4xl px-4">
              <h1 className="text-5xl font-bold mb-6 text-white animate-fade-in hover:scale-105 transition-transform">
                Sistema de gestión integrado
              </h1>
              <p className="text-xl text-gray-300 mb-8 animate-fade-in-delayed hover:text-white transition-colors">
                Organiza tus turnos, trabajos y muchos más, todo en una misma app
              </p>
              <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg">
                Agendar Turno
              </button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12 hover:text-primary transition-colors">
            Funcionalidades del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Gestión de Turnos",
                description: "Administra eficientemente los turnos y citas de tu taller",
              },
              {
                title: "Control de Trabajos",
                description: "Seguimiento detallado de reparaciones y mantenimientos en curso",
              },
              {
                title: "Gestión de Costos",
                description: "Control preciso de presupuestos y facturación",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-primary hover:scale-105 transition-all cursor-pointer shadow-md"
              >
                <h3 className="text-xl font-bold text-white mb-4 hover:text-primary transition-colors">{service.title}</h3>
                <p className="text-gray-400 hover:text-gray-300 transition-colors">{service.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
