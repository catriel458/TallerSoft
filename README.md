# TallerSoft - Sistema de Gestión para Talleres Mecánicos


TallerSoft es una aplicación web completa para la gestión de talleres mecánicos que integra reservas de turnos, historiales de reparaciones, perfiles de clientes y vehículos, y un panel administrativo intuitivo.

## Características principales

🔧 **Gestión de Turnos**
- Calendario interactivo para visualizar y asignar turnos
- Sistema de reservas en línea para clientes
- Notificaciones y recordatorios

🚗 **Historial de Vehículos**
- Registro detallado de todas las reparaciones
- Seguimiento de kilometraje y mantenimientos
- Historial completo de patentes por cliente

👤 **Perfiles de Usuario**
- Perfiles diferenciados para clientes y talleres
- Gestión de datos personales y de contacto
- Upload de imágenes de perfil y vehículos

📊 **Dashboard Administrativo**
- Estadísticas en tiempo real
- Indicadores de rendimiento clave
- Vista general del negocio

## Tecnologías utilizadas

- **Frontend**: React.js, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Node.js, Express
- **Base de Datos**: SQLite con Drizzle ORM
- **Autenticación**: JWT, bcrypt para seguridad de contraseñas
- **API**: RESTful con manejo de sesiones

## Estructura del Proyecto

```
/
├── client/               # Frontend React
│   ├── components/       # Componentes reutilizables
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Páginas principales
│   └── public/           # Archivos estáticos
│
├── server/               # Backend Express
│   ├── routes/           # Rutas de la API
│   ├── controllers/      # Controladores de la lógica de negocio
│   ├── middleware/       # Middleware personalizado
│   └── storage/          # Configuración de base de datos
│
└── shared/               # Código compartido
    └── schema/           # Esquemas y tipos compartidos
```

## Instalación

### Requisitos previos

- Node.js (v16 o superior)
- npm o yarn

### Pasos para instalación

1. Clonar el repositorio
```bash
git clone https://github.com/catriel458/tallersoft.git
cd tallersoft
```

2. Instalar dependencias del servidor
```bash
cd server
npm install
```

3. Instalar dependencias del cliente
```bash
cd ../client
npm install
```

4. Ejecutar migraciones de la base de datos
```bash
cd ../server
npm run migrate
```

## Ejecutar el proyecto

### Desarrollo


2. Iniciar el cliente (desde la carpeta client)
```bash
npm run dev
```

La aplicación estará disponible en http://localhost:5000

### Producción

https://tallersoft.com.ar/

## Uso

### Clientes

Los usuarios registrados como clientes pueden:
- Reservar turnos a través del calendario interactivo
- Ver y gestionar su historial de reparaciones
- Actualizar información de su perfil y vehículos
- Recibir notificaciones sobre el estado de su vehículo

### Talleres/Administradores

Los usuarios registrados como talleres pueden:
- Gestionar turnos y disponibilidad
- Registrar reparaciones y mantenimientos
- Ver estadísticas e informes de desempeño
- Administrar clientes y vehículos


## Contacto

Para preguntas o sugerencias, contacta a:
- Nombre: Catriel Cabrera
- Email: catrielcabrera97@gmail.com

---

Desarrollado con ❤️ para talleres mecánicos que buscan modernizar su gestión.
