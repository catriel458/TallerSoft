import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { type Turno, type Costo } from "@shared/schema";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function ReportesPage() {
  const { data: turnos } = useQuery<Turno[]>({
    queryKey: ["/api/turnos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/turnos");
      return response.json();
    },
  });

  const { data: costos } = useQuery<Costo[]>({
    queryKey: ["/api/costos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/costos");
      return response.json();
    },
  });

  const turnosPorEstado = turnos?.reduce(
    (acc, turno) => {
      acc[turno.asistencia] = (acc[turno.asistencia] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const costosPorMes = costos?.reduce(
    (acc, costo) => {
      const mes = new Date(costo.fecha).toLocaleString('es-ES', { month: 'long' });
      acc[mes] = (acc[mes] || 0) + costo.costo;
      return acc;
    },
    {} as Record<string, number>
  );

  const turnosChartData = turnosPorEstado
    ? Object.entries(turnosPorEstado).map(([estado, cantidad]) => ({
        estado,
        cantidad,
      }))
    : [];

  const costosChartData = costosPorMes
    ? Object.entries(costosPorMes).map(([mes, total]) => ({
        mes,
        total,
      }))
    : [];

  const totalIngresos = costos?.reduce((sum, costo) => sum + costo.costo, 0) || 0;
  const totalTurnos = turnos?.length || 0;
  const turnosPendientes = turnos?.filter(t => t.asistencia === 'Pendiente').length || 0;

  return (
    <div className=\"container mx-auto px-4 py-8\">
      <div className=\"grid gap-4 md:grid-cols-3 mb-8\">
        <Card>
          <CardHeader>
            <CardTitle className=\"text-sm font-medium\">Total Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"text-2xl font-bold\">${totalIngresos.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className=\"text-sm font-medium\">Total Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"text-2xl font-bold\">{totalTurnos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className=\"text-sm font-medium\">Turnos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"text-2xl font-bold\">{turnosPendientes}</div>
          </CardContent>
        </Card>
      </div>

      <div className=\"grid gap-4 md:grid-cols-2\">
        <Card>
          <CardHeader>
            <CardTitle>Turnos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"h-[300px]\">
              <ResponsiveContainer width=\"100%\" height=\"100%\">
                <BarChart data={turnosChartData}>
                  <XAxis dataKey=\"estado\" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey=\"cantidad\" fill=\"#3b82f6\" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"h-[300px]\">
              <ResponsiveContainer width=\"100%\" height=\"100%\">
                <BarChart data={costosChartData}>
                  <XAxis dataKey=\"mes\" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey=\"total\" fill=\"#10b981\" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}