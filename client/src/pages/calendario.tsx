import { useState, useMemo, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Configuración de API request
const apiRequest = async (method, url, data) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
};

// Configuración del localizador para el calendario
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { locale: es }),
    getDay,
    locales: { es }
});

// Estados de los turnos
const APPOINTMENT_STATES = {
    AVAILABLE: "sin_tomar",
    RESERVED: "reservado",
    COMPLETED: "finalizado"
};

// Esquema de validación para los turnos
const appointmentSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    start: z.string().min(1, "La fecha de inicio es requerida"),
    end: z.string().min(1, "La fecha de fin es requerida"),
    description: z.string().optional(),
    status: z.enum([APPOINTMENT_STATES.AVAILABLE, APPOINTMENT_STATES.RESERVED, APPOINTMENT_STATES.COMPLETED], {
        required_error: "El estado es requerido"
    })
});

// Componente principal
export default function CalendarioPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [view, setView] = useState("month");
    const [userType, setUserType] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Obtener el tipo de usuario
    useEffect(() => {
        const fetchUserType = async () => {
            try {
                const response = await apiRequest("GET", "/api/user/profile");
                const userData = await response.json();
                setUserType(userData.tipoUsuario);
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserType("cliente"); // Default to cliente for safety
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserType();
    }, []);

    // Configuración del formulario
    const form = useForm({
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
        queryKey: ["/api/appointments"],
        queryFn: async () => {
            try {
                const response = await apiRequest("GET", "/api/appointments");
                return response.json();
            } catch (error) {
                console.error("Error fetching appointments:", error);
                return [];
            }
        },
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
        mutationFn: async (data) => {
            try {
                const response = await apiRequest("POST", "/api/appointments", data);
                return response.json();
            } catch (error) {
                console.error("Error creating appointment:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            form.reset();
            setDialogOpen(false);
            toast({
                title: "Turno creado",
                description: "El turno ha sido creado exitosamente.",
            });
        },
        onError: (error) => {
            console.error("Mutation error:", error);
            toast({
                title: "Error",
                description: "Hubo un error al crear el turno. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        },
    });

    // Mutación para actualizar un turno existente
    const updateMutation = useMutation({
        mutationFn: async (data) => {
            try {
                const response = await apiRequest("PUT", `/api/appointments/${data.id}`, data);
                return response.json();
            } catch (error) {
                console.error("Error updating appointment:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            form.reset();
            setDialogOpen(false);
            setDetailsDialogOpen(false);
            setReservationDialogOpen(false);
            setIsEditing(false);
            toast({
                title: "Turno actualizado",
                description: "El turno ha sido actualizado exitosamente.",
            });
        },
        onError: (error) => {
            console.error("Update mutation error:", error);
            toast({
                title: "Error",
                description: "Hubo un error al actualizar el turno. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        },
    });

    // Mutación para reservar un turno 
    const reserveMutation = useMutation({
        mutationFn: async (appointmentId) => {
            try {
                const response = await apiRequest("PUT", `/api/appointments/reserve/${appointmentId}`);
                return response.json();
            } catch (error) {
                console.error("Error reserving appointment:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            setReservationDialogOpen(false);
            toast({
                title: "Turno reservado",
                description: "El turno ha sido reservado exitosamente.",
            });
        },
        onError: (error) => {
            console.error("Reserve mutation error:", error);
            toast({
                title: "Error",
                description: "Hubo un error al reservar el turno. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        },
    });

    // Manejador para seleccionar un slot en el calendario
    const handleSelectSlot = useCallback(
        ({ start, end }) => {
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
            }
        },
        [form, userType]
    );

    // Manejador para seleccionar un evento existente
    const handleSelectEvent = useCallback(
        (event) => {
            setSelectedAppointment(event);
            
            if (userType === "negocio") {
                // Negocios ven detalles y pueden editar
                setDetailsDialogOpen(true);
            } else if (userType === "cliente" && event.status === APPOINTMENT_STATES.AVAILABLE) {
                // Clientes solo pueden reservar turnos disponibles
                setReservationDialogOpen(true);
            } else if (userType === "cliente" && event.status !== APPOINTMENT_STATES.AVAILABLE) {
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
    const handleEditAppointment = () => {
        if (userType !== "negocio") return;
        
        setIsEditing(true);
        setDetailsDialogOpen(false);

        form.reset({
            title: selectedAppointment.title,
            start: format(new Date(selectedAppointment.start), "yyyy-MM-dd'T'HH:mm"),
            end: format(new Date(selectedAppointment.end), "yyyy-MM-dd'T'HH:mm"),
            description: selectedAppointment.description || "",
            status: selectedAppointment.status || APPOINTMENT_STATES.AVAILABLE
        });

        setDialogOpen(true);
    };

    // Manejador para reservar un turno
    const handleReserveAppointment = () => {
        if (!selectedAppointment || selectedAppointment.status !== APPOINTMENT_STATES.AVAILABLE) return;
        
        reserveMutation.mutate(selectedAppointment.id);
    };

    // Estilo para los eventos en el calendario basado en su estado
    const eventStyleGetter = useCallback(
        (event) => {
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
        eventTimeRangeFormat: ({ start, end }) => {
            return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        }
    };

    // Manejador para el envío del formulario
    const handleSubmit = useCallback(
        (data) => {
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
            }
        },
        [createMutation, updateMutation, isEditing, selectedAppointment]
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2">Cargando información de usuario...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            Calendario de Turnos {userType === "negocio" ? "(Administración)" : "(Reserva)"}
                        </CardTitle>
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
                                selectable={userType === "negocio"} // Solo negocio puede seleccionar slots
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                eventPropGetter={eventStyleGetter}
                                view={view}
                                formats={formats}
                                onView={(newView) => setView(newView)}
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

            {/* Diálogo de creación/edición de turno (solo para negocios) */}
            {userType === "negocio" && (
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
            )}

            {/* Diálogo de detalles del turno (solo para negocios) */}
            {userType === "negocio" && (
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
                                        onClick={handleEditAppointment}
                                    >
                                        Editar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            )}

            {/* Diálogo de reserva (solo para clientes) */}
            {userType === "cliente" && (
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
            )}
        </div>
    );
}