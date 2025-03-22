import { useState, useMemo, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit, Trash2, ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definir tipos para las peticiones API
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Configuración de API request
const apiRequest = async (method: ApiMethod, url: string, data?: any): Promise<Response> => {
    try {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error(`API request error (${method} ${url}):`, error);
        throw error;
    }
};

// Configuración del localizador para el calendario
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { locale: es }),
    getDay,
    locales: { es }
});

// Estados de los turnos
const APPOINTMENT_STATES = {
    AVAILABLE: "sin_tomar",
    RESERVED: "reservado",
    COMPLETED: "finalizado"
} as const;

// Tipo para estado de turnos
type AppointmentStatus = typeof APPOINTMENT_STATES[keyof typeof APPOINTMENT_STATES];

// Tipo para un turno
interface Appointment {
    id: number;
    title: string;
    start: Date | string;
    end: Date | string;
    description?: string;
    status: AppointmentStatus;
}

// Tipos de usuario
type UserType = "cliente" | "negocio";

// Esquema de validación para los turnos
const appointmentSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    start: z.string().min(1, "La fecha de inicio es requerida"),
    end: z.string().min(1, "La fecha de fin es requerida"),
    description: z.string().optional(),
    status: z.enum([APPOINTMENT_STATES.AVAILABLE, APPOINTMENT_STATES.RESERVED, APPOINTMENT_STATES.COMPLETED], {
        required_error: "El estado es requerido"
    })
}).refine(data => {
    const start = new Date(data.start);
    const end = new Date(data.end);
    return start < end;
}, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["end"]
});

// Esquema de validación para la contraseña de negocio
const businessPasswordSchema = z.object({
    password: z.string().min(1, "La contraseña es requerida")
});

// Tipo para el esquema
type AppointmentFormValues = z.infer<typeof appointmentSchema>;
type BusinessPasswordFormValues = z.infer<typeof businessPasswordSchema>;
// Componente principal
export default function CalendarioPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Estados para modales y datos
    const [dialogOpen, setDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
    const [isLoading, setIsLoading] = useState(false);

    // Estados para la selección de tipo de usuario
    const [userTypeDialogOpen, setUserTypeDialogOpen] = useState(true);
    const [userType, setUserType] = useState<UserType | null>(null);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    // Formulario para la contraseña
    const passwordForm = useForm<BusinessPasswordFormValues>({
        resolver: zodResolver(businessPasswordSchema),
        defaultValues: {
            password: ""
        }
    });

    // Contraseña correcta para acceso de negocio
    const BUSINESS_PASSWORD = "admin1234";

    // Manejador para la selección de tipo de usuario
    const handleUserTypeSelect = (type: UserType) => {
        if (type === "negocio") {
            setPasswordDialogOpen(true);
        } else {
            setUserType(type);
            setUserTypeDialogOpen(false);
        }
    };

    // Manejador para la verificación de contraseña
    const handlePasswordSubmit = (data: BusinessPasswordFormValues) => {
        if (data.password === BUSINESS_PASSWORD) {
            setUserType("negocio");
            setPasswordDialogOpen(false);
            setUserTypeDialogOpen(false);
            toast({
                title: "Acceso concedido",
                description: "Ha ingresado como administrador de negocio.",
            });
        } else {
            toast({
                title: "Contraseña incorrecta",
                description: "La contraseña ingresada no es válida.",
                variant: "destructive",
            });
            passwordForm.reset();
        }
    };

    // Configuración del formulario para turnos
    const form = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            title: "",
            start: "",
            end: "",
            description: "",
            status: APPOINTMENT_STATES.AVAILABLE
        },
    });

    // Consulta para obtener los turnos
    const { data: appointmentsData = [], isLoading: isLoadingAppointments } = useQuery({
        queryKey: ["appointments"],
        queryFn: async () => {
            try {
                const response = await apiRequest('GET', "/api/appointments");
                const data = await response.json();
                console.log("Appointments loaded:", data);
                return data as Appointment[];
            } catch (error) {
                console.error("Error fetching appointments:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los turnos. Intente nuevamente más tarde.",
                    variant: "destructive",
                });
                return [] as Appointment[];
            }
        },
        retry: 1,
        refetchOnWindowFocus: false
    });

    // Formatear las fechas de los turnos
    const appointments = useMemo(() => {
        return appointmentsData.map(appointment => ({
            ...appointment,
            start: new Date(appointment.start),
            end: new Date(appointment.end),
            status: appointment.status || APPOINTMENT_STATES.AVAILABLE
        }));
    }, [appointmentsData]);
    // Mutación para crear un nuevo turno
    const createMutation = useMutation({
        mutationFn: async (data: AppointmentFormValues) => {
            try {
                // Asegúrate de que las fechas estén en el formato correcto para la API
                const formattedData = {
                    ...data,
                    start: new Date(data.start).toISOString(),
                    end: new Date(data.end).toISOString(),
                };

                console.log("Creating appointment with data:", formattedData);
                const response = await apiRequest('POST', "/api/appointments", formattedData);
                return response.json();
            } catch (error) {
                console.error("Error creating appointment:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            form.reset();
            setDialogOpen(false);
            toast({
                title: "Turno creado",
                description: "El turno ha sido creado exitosamente.",
            });
        },
        onError: (error: Error) => {
            console.error("Mutation error:", error);
            toast({
                title: "Error",
                description: error.message || "Hubo un error al crear el turno. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        },
    });

    // Mutación para actualizar un turno existente
    const updateMutation = useMutation({
        mutationFn: async (data: AppointmentFormValues & { id: number }) => {
            try {
                // Asegúrate de que las fechas estén en el formato correcto para la API
                const formattedData = {
                    ...data,
                    start: new Date(data.start).toISOString(),
                    end: new Date(data.end).toISOString(),
                };

                console.log("Updating appointment with data:", formattedData);
                const response = await apiRequest('PUT', `/api/appointments/${data.id}`, formattedData);
                return response.json();
            } catch (error) {
                console.error("Error updating appointment:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            form.reset();
            setDialogOpen(false);
            setDetailsDialogOpen(false);
            setIsEditing(false);
            toast({
                title: "Turno actualizado",
                description: "El turno ha sido actualizado exitosamente.",
            });
        },
        onError: (error: Error) => {
            console.error("Update mutation error:", error);
            toast({
                title: "Error",
                description: error.message || "Hubo un error al actualizar el turno. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        },
    });

    // Mutación para eliminar un turno
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            try {
                console.log("Deleting appointment:", id);
                await apiRequest('DELETE', `/api/appointments/${id}`);
            } catch (error) {
                console.error("Error deleting appointment:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            setDeleteConfirmDialogOpen(false);
            setSelectedAppointment(null);
            toast({
                title: "Turno eliminado",
                description: "El turno ha sido eliminado exitosamente.",
            });
        },
        onError: (error: Error) => {
            console.error("Delete mutation error:", error);
            toast({
                title: "Error",
                description: error.message || "Hubo un error al eliminar el turno. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        },
    });
    // Mutación para reservar un turno 
    const reserveMutation = useMutation({
        mutationFn: async (appointmentId: number) => {
            try {
                console.log("Reserving appointment:", appointmentId);
                const response = await apiRequest('PUT', `/api/appointments/reserve/${appointmentId}`);
                return response.json();
            } catch (error) {
                console.error("Error reserving appointment:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            setReservationDialogOpen(false);
            toast({
                title: "Turno reservado",
                description: "El turno ha sido reservado exitosamente.",
            });
        },
        onError: (error: Error) => {
            console.error("Reserve mutation error:", error);
            toast({
                title: "Error",
                description: error.message || "Hubo un error al reservar el turno. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        },
    });

    // Manejador para seleccionar un slot en el calendario
    const handleSelectSlot = useCallback(
        (slotInfo: { start: Date; end: Date; }) => {
            const { start, end } = slotInfo;
            if (!start || !end || userType !== "negocio") return;

            try {
                setIsEditing(false);
                form.reset({
                    title: "",
                    start: format(start, "yyyy-MM-dd'T'HH:mm"),
                    end: format(end, "yyyy-MM-dd'T'HH:mm"),
                    description: "",
                    status: APPOINTMENT_STATES.AVAILABLE
                });
                setDialogOpen(true);
            } catch (error) {
                console.error("Error handling slot selection:", error);
                toast({
                    title: "Error",
                    description: "No se pudo seleccionar el horario. Intente nuevamente.",
                    variant: "destructive",
                });
            }
        },
        [form, userType, toast]
    );

    // Manejador para seleccionar un evento existente en el calendario
    const handleSelectEvent = useCallback(
        (event: Appointment) => {
            console.log("Selected event:", event);
            setSelectedAppointment(event);

            if (userType === "negocio") {
                // Administradores ven detalles y pueden editar
                setDetailsDialogOpen(true);
            } else if (event.status === APPOINTMENT_STATES.AVAILABLE) {
                // Usuarios normales solo pueden reservar turnos disponibles
                setReservationDialogOpen(true);
            } else {
                // Para turnos ya reservados, mostrar un mensaje
                toast({
                    title: "Turno no disponible",
                    description: "Este turno ya no está disponible para reserva.",
                    variant: "destructive",
                });
            }
        },
        [userType, toast]
    );

    // Iniciar edición de un turno
    const handleEditAppointment = (appointment: Appointment) => {
        if (userType !== "negocio") return;

        try {
            setSelectedAppointment(appointment);
            setIsEditing(true);
            setDetailsDialogOpen(false);

            form.reset({
                title: appointment.title,
                start: format(new Date(appointment.start), "yyyy-MM-dd'T'HH:mm"),
                end: format(new Date(appointment.end), "yyyy-MM-dd'T'HH:mm"),
                description: appointment.description || "",
                status: appointment.status || APPOINTMENT_STATES.AVAILABLE
            });

            setDialogOpen(true);
        } catch (error) {
            console.error("Error editing appointment:", error);
            toast({
                title: "Error",
                description: "No se pudo editar el turno. Intente nuevamente.",
                variant: "destructive",
            });
        }
    };
    // Manejador para eliminar un turno
    const handleDeleteAppointment = (appointment: Appointment) => {
        if (userType !== "negocio") return;

        setSelectedAppointment(appointment);
        setDeleteConfirmDialogOpen(true);
    };

    // Confirmar eliminación de un turno
    const confirmDeleteAppointment = () => {
        if (!selectedAppointment) return;

        deleteMutation.mutate(selectedAppointment.id);
    };

    // Manejador para reservar un turno
    const handleReserveAppointment = () => {
        if (!selectedAppointment) return;

        // Verificar si el turno está disponible
        if (selectedAppointment.status !== APPOINTMENT_STATES.AVAILABLE) {
            toast({
                title: "Error",
                description: "Este turno no está disponible para reservar.",
                variant: "destructive",
            });
            return;
        }

        reserveMutation.mutate(selectedAppointment.id);
    };

    // Estilo para los eventos en el calendario basado en su estado
    const eventStyleGetter = useCallback(
        (event: Appointment) => {
            let backgroundColor = "#3b82f6"; // Azul por defecto

            switch (event.status) {
                case APPOINTMENT_STATES.AVAILABLE:
                    backgroundColor = "#22c55e"; // Verde
                    break;
                case APPOINTMENT_STATES.RESERVED:
                    backgroundColor = "#f97316"; // Naranja
                    break;
                case APPOINTMENT_STATES.COMPLETED:
                    backgroundColor = "#ef4444"; // Rojo
                    break;
            }

            return {
                style: {
                    backgroundColor,
                    cursor: 'pointer'
                }
            };
        },
        []
    );

    // Formatear título del evento para el calendario
    const formats = {
        eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
            return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        }
    };

    // Manejador para el envío del formulario
    const handleSubmit = useCallback(
        (data: AppointmentFormValues) => {
            try {
                if (isEditing && selectedAppointment) {
                    updateMutation.mutate({
                        ...data,
                        id: selectedAppointment.id
                    });
                } else {
                    createMutation.mutate(data);
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                toast({
                    title: "Error",
                    description: "Hubo un error al procesar el formulario. Por favor, intente nuevamente.",
                    variant: "destructive",
                });
            }
        },
        [createMutation, updateMutation, isEditing, selectedAppointment, toast]
    );

    // Crear un nuevo turno (botón de acción rápida)
    const handleNewAppointment = () => {
        if (userType !== "negocio") return;

        setIsEditing(false);
        form.reset({
            title: "",
            start: "",
            end: "",
            description: "",
            status: APPOINTMENT_STATES.AVAILABLE
        });
        setDialogOpen(true);
    };

    // Cambiar el tipo de usuario (utilidad para pruebas)
    const changeUserType = () => {
        setUserTypeDialogOpen(true);
    };
    // Si no hay tipo de usuario seleccionado, mostrar la pantalla de carga
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2">Cargando información...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            {/* Diálogo de selección de tipo de usuario */}
            <Dialog open={userTypeDialogOpen} onOpenChange={setUserTypeDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl mb-2">Seleccionar Tipo de Usuario</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-center text-gray-600 mb-6">
                            Seleccione el tipo de usuario para ver el calendario.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button
                                className="flex-1 py-6 px-4"
                                variant="outline"
                                onClick={() => handleUserTypeSelect("cliente")}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-semibold">Cliente</span>
                                    <span className="text-xs text-gray-500 mt-1">Ver y reservar turnos</span>
                                </div>
                            </Button>
                            <Button
                                className="flex-1 py-6 px-4"
                                variant="outline"
                                onClick={() => handleUserTypeSelect("negocio")}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-semibold">Negocio</span>
                                    <span className="text-xs text-gray-500 mt-1">Administrar turnos</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Diálogo de contraseña para negocio */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Autenticación de Administrador</DialogTitle>
                    </DialogHeader>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                            <FormField
                                control={passwordForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña de Administrador</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <p className="text-sm text-gray-500">
                                <ShieldAlert className="h-4 w-4 inline mr-1" />
                                Para acceso como negocio, ingrese la contraseña.
                            </p>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setPasswordDialogOpen(false);
                                        setUserTypeDialogOpen(true);
                                    }}
                                >
                                    Volver
                                </Button>
                                <Button type="submit">Ingresar</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Si no hay tipo de usuario seleccionado, no mostrar nada más */}
            {!userType && (
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500">Seleccione un tipo de usuario para continuar.</p>
                </div>
            )}

            {/* Contenido principal - solo se muestra si hay tipo de usuario seleccionado */}
            {userType && (
                <>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>
                                    Calendario de Turnos {userType === "negocio" ? "(Administración)" : "(Reserva)"}
                                </CardTitle>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-500">
                                        Modo: <span className="font-semibold">{userType === "negocio" ? "Negocio" : "Cliente"}</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={changeUserType}>
                                        Cambiar Modo
                                    </Button>
                                    {userType === "negocio" && (
                                        <Button onClick={handleNewAppointment}>
                                            Nuevo Turno
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div style={{ height: '600px' }}>
                                {isLoadingAppointments ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                        <span className="ml-2">Cargando calendario...</span>
                                    </div>
                                ) : (
                                    <Calendar
                                        localizer={localizer}
                                        events={appointments}
                                        startAccessor="start"
                                        endAccessor="end"
                                        style={{ height: '100%' }}
                                        selectable={userType === "negocio"} // Solo admin puede seleccionar slots
                                        onSelectSlot={handleSelectSlot}
                                        onSelectEvent={handleSelectEvent}
                                        eventPropGetter={eventStyleGetter}
                                        view={view}
                                        formats={formats}
                                        onView={(newView) => setView(newView as 'month' | 'week' | 'day' | 'agenda')}
                                        messages={{
                                            next: "Siguiente",
                                            previous: "Anterior",
                                            today: "Hoy",
                                            month: "Mes",
                                            week: "Semana",
                                            day: "Día",
                                            agenda: "Agenda",
                                            date: "Fecha",
                                            time: "Hora",
                                            event: "Evento",
                                        }}
                                    />
                                )}
                            </div>

                            <div className="mt-4 flex items-center text-sm">
                                <span className="flex items-center mr-4">
                                    <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                                    Sin tomar
                                </span>
                                <span className="flex items-center mr-4">
                                    <span className="inline-block w-4 h-4 bg-orange-500 rounded-full mr-2"></span>
                                    Reservado
                                </span>
                                <span className="flex items-center">
                                    <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                                    Finalizado
                                </span>
                            </div>

                            {userType === "cliente" && (
                                <div className="mt-2 text-sm text-gray-500">
                                    <p>Haga clic en un turno <span className="font-bold text-green-500">verde</span> para reservarlo.</p>
                                </div>
                            )}

                            {userType === "negocio" && (
                                <div className="mt-2 text-sm text-gray-500">
                                    <p>Haga clic en una fecha para crear un nuevo turno o seleccione un turno existente para ver sus detalles.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lista de turnos (solo para negocio) */}
                    {userType === "negocio" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Listado de Turnos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingAppointments ? (
                                    <div className="flex items-center justify-center h-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                        <span className="ml-2">Cargando turnos...</span>
                                    </div>
                                ) : appointments.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">
                                        No hay turnos registrados.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Título</TableHead>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Horario</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead>Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {appointments
                                                    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                                                    .map((appointment) => (
                                                        <TableRow key={appointment.id}>
                                                            <TableCell>{appointment.title}</TableCell>
                                                            <TableCell>
                                                                {format(new Date(appointment.start), "dd/MM/yyyy")}
                                                            </TableCell>
                                                            <TableCell>
                                                                {format(new Date(appointment.start), "HH:mm")} - {format(new Date(appointment.end), "HH:mm")}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center">
                                                                    <span
                                                                        className={`inline-block w-3 h-3 rounded-full mr-2 ${appointment.status === APPOINTMENT_STATES.AVAILABLE
                                                                                ? "bg-green-500"
                                                                                : appointment.status === APPOINTMENT_STATES.RESERVED
                                                                                    ? "bg-orange-500"
                                                                                    : "bg-red-500"
                                                                            }`}
                                                                    ></span>
                                                                    <span>
                                                                        {appointment.status === APPOINTMENT_STATES.AVAILABLE
                                                                            ? "Sin tomar"
                                                                            : appointment.status === APPOINTMENT_STATES.RESERVED
                                                                                ? "Reservado"
                                                                                : "Finalizado"
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => handleEditAppointment(appointment)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="text-red-500 hover:text-red-600"
                                                                        onClick={() => handleDeleteAppointment(appointment)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    {/* Diálogo de creación/edición de turno */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(handleSubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Título</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="start"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha y hora de inicio</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha y hora de fin</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descripción</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione un estado" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={APPOINTMENT_STATES.AVAILABLE}>
                                                            Sin tomar
                                                        </SelectItem>
                                                        <SelectItem value={APPOINTMENT_STATES.RESERVED}>
                                                            Reservado
                                                        </SelectItem>
                                                        <SelectItem value={APPOINTMENT_STATES.COMPLETED}>
                                                            Finalizado
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setDialogOpen(false);
                                                form.reset();
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            {isEditing
                                                ? (updateMutation.isPending ? "Actualizando..." : "Actualizar")
                                                : (createMutation.isPending ? "Creando..." : "Crear")
                                            }
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    {/* Diálogo de detalles del turno (solo para admin) */}
                    <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Detalles del Turno</DialogTitle>
                            </DialogHeader>
                            {selectedAppointment && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium text-sm text-gray-500">Título</h3>
                                        <p>{selectedAppointment.title}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm text-gray-500">Fecha y hora</h3>
                                        <p>
                                            {format(new Date(selectedAppointment.start), "dd/MM/yyyy")} -&nbsp;
                                            {format(new Date(selectedAppointment.start), "HH:mm")} a&nbsp;
                                            {format(new Date(selectedAppointment.end), "HH:mm")}
                                        </p>
                                    </div>
                                    {selectedAppointment.description && (
                                        <div>
                                            <h3 className="font-medium text-sm text-gray-500">Descripción</h3>
                                            <p>{selectedAppointment.description}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-medium text-sm text-gray-500">Estado</h3>
                                        <div className="flex items-center">
                                            <span
                                                className={`inline-block w-3 h-3 rounded-full mr-2 ${selectedAppointment.status === APPOINTMENT_STATES.AVAILABLE
                                                        ? "bg-green-500"
                                                        : selectedAppointment.status === APPOINTMENT_STATES.RESERVED
                                                            ? "bg-orange-500"
                                                            : "bg-red-500"
                                                    }`}
                                            ></span>
                                            <span>
                                                {selectedAppointment.status === APPOINTMENT_STATES.AVAILABLE
                                                    ? "Sin tomar"
                                                    : selectedAppointment.status === APPOINTMENT_STATES.RESERVED
                                                        ? "Reservado"
                                                        : "Finalizado"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setDetailsDialogOpen(false)}
                                        >
                                            Cerrar
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleEditAppointment(selectedAppointment)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => {
                                                setDetailsDialogOpen(false);
                                                handleDeleteAppointment(selectedAppointment);
                                            }}
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Diálogo de reserva (solo para clientes) */}
                    <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Reservar Turno</DialogTitle>
                            </DialogHeader>
                            {selectedAppointment && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium text-sm text-gray-500">Título</h3>
                                        <p>{selectedAppointment.title}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm text-gray-500">Fecha y hora</h3>
                                        <p>
                                            {format(new Date(selectedAppointment.start), "dd/MM/yyyy")} -&nbsp;
                                            {format(new Date(selectedAppointment.start), "HH:mm")} a&nbsp;
                                            {format(new Date(selectedAppointment.end), "HH:mm")}
                                        </p>
                                    </div>
                                    {selectedAppointment.description && (
                                        <div>
                                            <h3 className="font-medium text-sm text-gray-500">Descripción</h3>
                                            <p>{selectedAppointment.description}</p>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <p className="text-sm text-gray-600">
                                            ¿Desea reservar este turno? Una vez reservado, no podrá cancelarlo directamente.
                                        </p>
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setReservationDialogOpen(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleReserveAppointment}
                                            disabled={reserveMutation.isPending}
                                        >
                                            {reserveMutation.isPending ? "Reservando..." : "Reservar"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                    {/* Diálogo de confirmación de eliminación */}
                    <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Confirmar Eliminación</DialogTitle>
                            </DialogHeader>
                            {selectedAppointment && (
                                <div className="space-y-4">
                                    <p>¿Está seguro que desea eliminar el turno <strong>{selectedAppointment.title}</strong>?</p>
                                    <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>

                                    <div className="flex justify-end space-x-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setDeleteConfirmDialogOpen(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={confirmDeleteAppointment}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
}