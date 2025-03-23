import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect } from "react";
import type { Appointment, Reparacion, User } from "@shared/schema";

export default function Home() {
  // Consultas para obtener datos reales
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  const { data: reparaciones = [], isLoading: reparacionesLoading } = useQuery<Reparacion[]>({
    queryKey: ["/api/reparaciones"],
  });
  
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // Estado para las estadísticas y cálculos derivados
  const [activeTab, setActiveTab] = useState("estadisticas");
  const [stats, setStats] = useState({
    turnosHoy: 0,
    ingresosTotal: 0,
    trabajosCompletados: 0
  });
  
  // Calcular estadísticas basadas en datos reales
  useEffect(() => {
    if (!appointmentsLoading && !reparacionesLoading) {
      // Obtener la fecha de hoy en formato ISO
      const today = new Date().toISOString().split('T')[0];
      
      // Calcular turnos para hoy
      const turnosHoy = appointments.filter(app => 
        app.start.split('T')[0] === today
      ).length;
      
      // Ingresos totales (suma de todos los costos de reparaciones)
      const ingresosTotal = reparaciones.reduce((total, rep) => 
        total + (rep.costo || 0), 0
      );
      
      // Trabajos completados (todas las reparaciones registradas)
      const trabajosCompletados = reparaciones.length;
      
      setStats({
        turnosHoy,
        ingresosTotal,
        trabajosCompletados
      });
    }
  }, [appointments, reparaciones, appointmentsLoading, reparacionesLoading]);
  // Obtener próximos turnos
  const proximosTurnos = appointments
    .filter(app => {
      // Si el usuario es cliente, mostrar solo sus turnos
      if (currentUser?.tipoUsuario === "cliente") {
        return app.title.includes(currentUser.Apyn || "");
      }
      // Si es negocio, mostrar todos los turnos
      return true;
    })
    .filter(app => {
      // Filtrar turnos futuros
      const appDate = new Date(app.start);
      const now = new Date();
      return appDate >= now;
    })
    .sort((a, b) => {
      // Ordenar por fecha
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    })
    .slice(0, 3); // Mostrar solo los próximos 3

  // Formatear fecha y hora para mostrar
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  // Mapear status a texto legible
  const getStatusText = (status) => {
    const statusMap = {
      "sin_tomar": "Sin tomar",
      "tomado": "Reservado",
      "en_proceso": "En proceso",
      "completado": "Completado",
      "cancelado": "Cancelado"
    };
    return statusMap[status] || status;
  };

  // Determinar color según estado
  const getStatusColor = (status) => {
    const colorMap = {
      "sin_tomar": "bg-gray-500",
      "tomado": "bg-blue-500",
      "en_proceso": "bg-yellow-500",
      "completado": "bg-green-500",
      "cancelado": "bg-red-500"
    };
    return colorMap[status] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-1">
      <section className="relative h-[calc(100vh-64px)]">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/90 via-black/70 to-black/90" />
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1741904637198-aa3bf2c29113?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Background"
              className="h-full w-full object-fill object-center"
            />
          </div>
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="max-w-5xl w-full px-4">
              <h1 className="text-5xl font-bold mb-6 text-white animate-fade-in hover:scale-105 transition-transform">
                Sistema de gestión integrado
              </h1>
              <p className="text-xl text-gray-300 mb-8 animate-fade-in-delayed hover:text-white transition-colors">
                {currentUser?.tipoUsuario === "cliente" 
                  ? "Gestiona tus turnos y consulta tu historial de reparaciones" 
                  : "Organiza tus turnos, trabajos y muchos más, todo en una misma app"}
              </p>
              
              {/* Dashboard Tabs */}
              <div className="bg-gray-800/80 backdrop-blur-md rounded-lg p-6 mt-6 border border-gray-700 shadow-xl">
                <div className="flex mb-6 border-b border-gray-700">
                  <button 
                    onClick={() => setActiveTab("estadisticas")}
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "estadisticas" 
                      ? "text-white border-b-2 border-blue-500" 
                      : "text-gray-400 hover:text-white"}`}
                  >
                    Estadísticas
                  </button>
                  <button 
                    onClick={() => setActiveTab("proximosTurnos")}
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "proximosTurnos" 
                      ? "text-white border-b-2 border-blue-500" 
                      : "text-gray-400 hover:text-white"}`}
                  >
                    Próximos Turnos
                  </button>
                </div>
                
                {appointmentsLoading || reparacionesLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : activeTab === "estadisticas" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/60 p-4 rounded-lg flex flex-col items-center">
                      <div className="text-4xl font-bold text-white mb-2">{stats.turnosHoy}</div>
                      <div className="text-gray-300 text-sm">Turnos Hoy</div>
                    </div>
                    <div className="bg-gray-700/60 p-4 rounded-lg flex flex-col items-center">
                      <div className="text-4xl font-bold text-white mb-2">{stats.trabajosCompletados}</div>
                      <div className="text-gray-300 text-sm">Trabajos Completados</div>
                    </div>
                    <div className="bg-gray-700/60 p-4 rounded-lg flex flex-col items-center">
                      <div className="text-xl font-bold text-white mb-2">{formatCurrency(stats.ingresosTotal)}</div>
                      <div className="text-gray-300 text-sm">Ingresos Totales</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proximosTurnos.length > 0 ? (
                      proximosTurnos.map((turno, index) => (
                        <div key={index} className="bg-gray-700/60 p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`${getStatusColor(turno.status)} w-3 h-3 rounded-full mr-3`}></div>
                            <div>
                              <div className="text-white font-medium">{turno.title}</div>
                              <div className="text-gray-300 text-sm">{turno.description || "Sin descripción"}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-300 text-sm">{formatDate(turno.start)}</div>
                            <div className="text-white text-sm font-medium">{formatTime(turno.start)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        No hay turnos próximos programados
                      </div>
                    )}
                    <button 
                      onClick={() => window.location.href = '/calendario'}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors mt-2"
                    >
                      {currentUser?.tipoUsuario === "cliente" 
                        ? "Agendar un turno" 
                        : "Ver calendario"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        {/* Sección de lema con imagen */}
        <section className="py-20 bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="w-full md:w-1/2 mb-8 md:mb-0">
                <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Tu vehículo merece <span className="text-blue-500">el mejor cuidado</span></h2>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  Ofrecemos un servicio integral de mantenimiento y reparación con las últimas tecnologías y personal altamente capacitado.
                </p>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-2 rounded-full mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Diagnóstico computarizado preciso</p>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-2 rounded-full mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Técnicos certificados y experimentados</p>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-2 rounded-full mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Repuestos originales garantizados</p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/5">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="Servicio técnico" 
                    className="rounded-lg shadow-2xl z-10 relative"
                  />
                  <div className="absolute -bottom-4 -right-4 w-full h-full bg-blue-500 rounded-lg -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Sección de Iconos del Tablero */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-8">Símbolos e Indicadores del Vehículo</h2>
            <p className="text-gray-300 text-center max-w-3xl mx-auto mb-12">
              Conoce el significado de los principales símbolos que puedes encontrar en tu tablero. Identifica a tiempo posibles problemas y mantén tu vehículo en óptimas condiciones.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Nivel/Presión de Aceite",
                  icon: (
                    <svg className="w-16 h-16 text-yellow-500 mx-auto" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M491.2 399.9l-78.8-214.8c-2.6-7.1-9.3-11.7-16.8-11.7H298.2V143h14.5c6 0 10.9-4.9 10.9-10.9v-36.4c0-6-4.9-10.9-10.9-10.9h-14.5V74.3c0-6-4.9-10.9-10.9-10.9h-36.4c-6 0-10.9 4.9-10.9 10.9v10.5H116.3c-7.5 0-14.2 4.6-16.8 11.7L20.8 399.9c-2.6 7.1-1 14.9 4.2 20.7s12.8 8.1 20.2 6.4l177.9-40.2 177.9 40.2c1.5 0.3 3 0.5 4.5 0.5 6.7 0 13.1-3.3 16.9-9.2C427.4 411.9 428.4 404.6 424.5 398.7zM262.7 85.2h14.5v10.5h-14.5V85.2z M116.3 174.8h203.1l71.5 194.9-138.6-31.3c-3-0.7-6.1-0.7-9.1 0L104.6 369.7 176.1 174.8z" />
                      <circle cx="450" cy="260" r="30" />
                    </svg>
                  ),
                  description: "Indica baja presión o nivel de aceite. Si se enciende mientras conduces, detén el vehículo inmediatamente y apaga el motor. Revisar el nivel de aceite y reponerlo si es necesario. Conducir con esta luz encendida puede causar daños graves al motor.",
                  urgencia: "Alta"
                },
                {
                  name: "Check Engine / Motor",
                  icon: (
                    <svg className="w-16 h-16 text-yellow-500 mx-auto" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM19 14.9L14.9 19H9.1L5 14.9V9.1L9.1 5h5.8L19 9.1v5.8z"/>
                      <path d="M12 16c.83 0 1.5-.67 1.5-1.5S12.83 13 12 13s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM11 10h2v2h-2z"/>
                    </svg>
                  ),
                  description: "Indica un problema en el sistema de control del motor. Puede ser desde un sensor defectuoso hasta problemas graves. El vehículo debe ser diagnosticado con un escáner especial para identificar el código de error específico.",
                  urgencia: "Media"
                },
                {
                  name: "Sistema de Frenos / ABS",
                  icon: (
                    <svg className="w-16 h-16 text-red-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      <path fill="black" d="M12 6C8.69 6 6 8.69 6 12s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                      <text x="11" y="14" style={{font: 'bold 6px sans-serif', fill: 'white'}}>ABS</text>
                    </svg>
                  ),
                  description: "Alerta sobre problemas en el sistema de frenos o ABS. Podría indicar nivel bajo de líquido de frenos, freno de mano activado, o fallas en el sistema antibloqueo. Verificar inmediatamente el sistema de frenos.",
                  urgencia: "Alta"
                },
                {
                  name: "Batería/Sistema de Carga",
                  icon: (
                    <svg className="w-16 h-16 text-red-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                      <path fill="white" d="M10 20v-6h4v6h-4z"/>
                    </svg>
                  ),
                  description: "Problemas con el sistema eléctrico o de carga. Si se enciende durante la conducción, puede indicar fallas en el alternador, batería o conexiones. El vehículo podría detenerse pronto si el alternador no está cargando la batería.",
                  urgencia: "Alta"
                },
                {
                  name: "Temperatura del Motor",
                  icon: (
                    <svg className="w-16 h-16 text-red-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <path fill="white" d="M9.5 14.5l2.5-1.5V7h-1v5.3l-1.8 1.2.3 1zm4.7-1.5l-1.2-.8V7.5h1.2v5.5z"/>
                    </svg>
                  ),
                  description: "Indica sobrecalentamiento del motor. Detén el vehículo inmediatamente, apaga el motor y permite que se enfríe. Verifica el nivel de refrigerante cuando el motor esté frío. Nunca abras el radiador con el motor caliente.",
                  urgencia: "Alta"
                },
                {
                  name: "Airbag / SRS",
                  icon: (
                    <svg className="w-16 h-16 text-red-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14c0 1.66 1.34 3 3 3 .55 0 1-.45 1-1s-.45-1-1-1c-.55 0-1-.45-1-1v-1h9.63l-2.77-5H16V8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2s.9-2 2-2h9.5l1 1h.46L9.4 2.45c-.11-.17-.3-.29-.51-.29-.35 0-.64.29-.64.64v1.08c-2.27.47-4 2.47-4 4.87V10h2c.55 0 1 .45 1 1s-.45 1-1 1H4v2z"/>
                      <path d="M7 14c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3zm8 0c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z"/>
                    </svg>
                  ),
                  description: "Falla en el sistema de airbag. Indica un problema con los airbags o los sensores relacionados. El sistema podría no funcionar correctamente en caso de colisión. Requiere diagnóstico inmediato.",
                  urgencia: "Media"
                },
                {
                  name: "Presión de Neumáticos",
                  icon: (
                    <svg className="w-16 h-16 text-yellow-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <path fill="white" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                      <path fill="white" d="M12 2.5V4M12 20v1.5M4 12H2.5M21.5 12H20"/>
                    </svg>
                  ),
                  description: "Sistema de monitoreo de presión de neumáticos. Indica que uno o más neumáticos tienen presión baja. Revisa y ajusta la presión de todos los neumáticos, incluyendo el de repuesto si corresponde.",
                  urgencia: "Media"
                },
                {
                  name: "Sistema de Estabilidad",
                  icon: (
                    <svg className="w-16 h-16 text-yellow-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                      <path fill="white" d="M7 12l-2 2 2 2M17 12l2 2-2 2M10 17l2 2 2-2M10 7l2-2 2 2"/>
                    </svg>
                  ),
                  description: "Control de estabilidad/tracción. Si parpadea, el sistema está funcionando para mantener la estabilidad. Si permanece encendida, hay un problema en el sistema que requiere diagnóstico.",
                  urgencia: "Media"
                },
                {
                  name: "Filtro de Combustible/Agua",
                  icon: (
                    <svg className="w-16 h-16 text-yellow-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 20h14v-2H5v2zM5 10h4v6h6v-6h4l-7-7-7 7z"/>
                      <circle cx="17" cy="16" r="2"/>
                    </svg>
                  ),
                  description: "Indica presencia de agua en el filtro de combustible (común en vehículos diésel). El agua debe drenarse del filtro para evitar daños en el sistema de inyección de combustible.",
                  urgencia: "Media"
                },
                {
                  name: "Nivel Bajo de Combustible",
                  icon: (
                    <svg className="w-16 h-16 text-yellow-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 13.5V19H6v-7h6v1.5zm0-3.5H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                    </svg>
                  ),
                  description: "Indica nivel bajo de combustible. Generalmente se enciende cuando queda aproximadamente un 10-15% de combustible en el tanque. Recargar combustible lo antes posible para evitar quedarse sin él.",
                  urgencia: "Baja"
                },
                {
                  name: "Luces Altas",
                  icon: (
                    <svg className="w-16 h-16 text-blue-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      <path fill="white" d="M9 16h2V8H9v8zm4 0h2V8h-2v8z"/>
                    </svg>
                  ),
                  description: "Indica que las luces altas (largas) están activadas. Recuerda apagarlas cuando te cruces con otros vehículos para no deslumbrar a los conductores que vienen en sentido contrario.",
                  urgencia: "Informativa"
                },
                {
                  name: "Cinturón de Seguridad",
                  icon: (
                    <svg className="w-16 h-16 text-red-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25M7.5 20.25L16.5 3.75" strokeWidth="1.5" stroke="currentColor" fill="none"/>
                    </svg>
                  ),
                  description: "Recuerda abrochar el cinturón de seguridad. Esta luz y una alarma se activan cuando el vehículo está en movimiento y el conductor o pasajeros no tienen abrochado el cinturón.",
                  urgencia: "Media"
                }
              ].map((warning, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all shadow-lg transform hover:-translate-y-1">
                  <div className="mb-4">
                    {warning.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">{warning.name}</h3>
                  <div className={`text-xs font-semibold py-1 px-2 rounded-full mb-3 inline-block ${
                    warning.urgencia === "Alta" ? "bg-red-500/20 text-red-400" :
                    warning.urgencia === "Media" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    Urgencia: {warning.urgencia}
                  </div>
                  <p className="text-gray-300 text-sm">{warning.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => window.location.href = '/calendario'}
                      className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-2 rounded text-sm transition-colors"
                    >
                      Reservar diagnóstico
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <p className="text-gray-400 mb-4">
                Estos son solo algunos de los símbolos más comunes. Tu vehículo puede tener indicadores adicionales.
              </p>
              <p className="text-gray-400 italic">
                Recuerda: Las luces e indicadores están diseñados para proteger tu vehículo y a sus ocupantes. Nunca los ignores.
              </p>
            </div>
          </div>
        </section>
        {/* Sección de testimonios */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "María García",
                  role: "Cliente desde 2022",
                  testimonial: "El sistema de turnos me permite organizar mejor mi tiempo. Puedo ver fácilmente el historial de reparaciones de mi vehículo.",
                  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                },
                {
                  name: "Carlos Rodríguez",
                  role: "Cliente recurrente",
                  testimonial: "La transparencia en los costos y el seguimiento detallado de las reparaciones me da mucha confianza. Recomiendo ampliamente este taller.",
                  avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                },
                {
                  name: "Laura Martínez",
                  role: "Cliente desde 2023",
                  testimonial: "El sistema de gestión de turnos es muy eficiente. Siempre me avisan con anticipación y me recuerdan cuando tengo un servicio programado.",
                  avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                },
              ].map((testimonial, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="text-white font-medium">{testimonial.name}</h4>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">"{testimonial.testimonial}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Sección de servicios con íconos */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-16">Nuestros Servicios Especializados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  title: "Diagnóstico Computarizado",
                  icon: () => (
                    <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  title: "Cambio de Aceite y Filtros",
                  icon: () => (
                    <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  )
                },
                {
                  title: "Alineación y Balanceo",
                  icon: () => (
                    <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  )
                },
                {
                  title: "Frenos y Suspensión",
                  icon: () => (
                    <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )
                },
              ].map((service, index) => (
                <div key={index} className="text-center p-6 hover:scale-105 transition-transform">
                  {service.icon()}
                  <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12 hover:text-primary transition-colors">
            Funcionalidades del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Gestión de Turnos",
                description: "Administra eficientemente los turnos y citas con nuestro calendario integrado",
                icon: () => (
                  <svg className="w-10 h-10 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                title: "Control de Trabajos",
                description: "Seguimiento detallado de reparaciones y mantenimientos en curso",
                icon: () => (
                  <svg className="w-10 h-10 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )
              },
              {
                title: "Gestión de Usuarios",
                description: "Gestiona tu perfil, personalízalo y visualiza tu historial de servicios",
                icon: () => (
                  <svg className="w-10 h-10 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )
              },
            ].map((service, index) => (
              <div
                key={index}
                className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-primary hover:scale-105 transition-all shadow-md flex flex-col items-center text-center"
              >
                {service.icon()}
                <h3 className="text-xl font-bold text-white mb-4 hover:text-primary transition-colors">{service.title}</h3>
                <p className="text-gray-400 hover:text-gray-300 transition-colors">{service.description}</p>
              </div>
            ))}
          </div>
        </section>
        {/* FAQ Sección */}
        <section className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Preguntas Frecuentes</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  question: "¿Cómo puedo agendar un turno?",
                  answer: "Puedes agendar un turno fácilmente a través de nuestro calendario en línea. Simplemente inicia sesión, selecciona la fecha y hora que prefieras, y completa los detalles requeridos."
                },
                {
                  question: "¿Qué información necesito para registrar mi vehículo?",
                  answer: "Para registrar tu vehículo necesitarás la patente, marca, modelo, año y opcionalmente puedes subir una foto del mismo para facilitar su identificación."
                },
                {
                  question: "¿Cómo puedo ver mi historial de reparaciones?",
                  answer: "En la sección de 'Reparaciones' podrás ver todo tu historial de servicios, incluyendo fechas, costos y descripciones detalladas de los trabajos realizados."
                },
                {
                  question: "¿Puedo cambiar o cancelar un turno programado?",
                  answer: "Sí, puedes modificar o cancelar un turno hasta 24 horas antes de la hora programada. Simplemente dirígete a la sección de 'Calendario' y selecciona el turno que deseas modificar."
                },
                {
                  question: "¿Qué debo hacer si aparece una luz de advertencia en mi tablero?",
                  answer: "Si aparece una luz de advertencia, consulta nuestra guía de señales en la página principal. Para mayor seguridad, programa un diagnóstico a través de nuestro sistema de turnos para identificar y solucionar el problema."
                },
                {
                  question: "¿Cómo puedo saber cuándo mi vehículo necesita un mantenimiento preventivo?",
                  answer: "Recomendamos seguir el programa de mantenimiento del fabricante. En general, se recomienda un servicio cada 10,000 km o 6 meses, lo que ocurra primero. Nuestro sistema puede enviarte recordatorios automáticos si configuras esta opción en tu perfil."
                },
              ].map((faq, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <details className="group">
                    <summary className="bg-gray-700 p-4 flex justify-between items-center cursor-pointer list-none rounded-lg hover:bg-gray-600 transition-all">
                      <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                      <span className="text-blue-400 group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </span>
                    </summary>
                    <div className="bg-gray-700/60 p-4 text-gray-300">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Sección de estadísticas */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-4">
                <div className="text-4xl font-bold text-white mb-2">+500</div>
                <p className="text-blue-100">Clientes satisfechos</p>
              </div>
              <div className="p-4">
                <div className="text-4xl font-bold text-white mb-2">+2,000</div>
                <p className="text-blue-100">Reparaciones exitosas</p>
              </div>
              <div className="p-4">
                <div className="text-4xl font-bold text-white mb-2">15</div>
                <p className="text-blue-100">Años de experiencia</p>
              </div>
              <div className="p-4">
                <div className="text-4xl font-bold text-white mb-2">100%</div>
                <p className="text-blue-100">Garantía de servicio</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA final */}
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">¿Listo para probar nuestro sistema?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Empieza a gestionar tu taller mecánico o agenda tu próximo servicio de forma simple y eficiente.
            </p>
            <button
              onClick={() => window.location.href = '/reparaciones'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg"
            >
              Comenzar ahora
            </button>
          </div>
        </section>
        
        {/* Sección de contacto flotante */}
        <div className="fixed bottom-6 right-6 z-30">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-all hover:scale-105"
            onClick={() => alert('Función de contacto rápido')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

                      