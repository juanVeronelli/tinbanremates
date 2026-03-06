# Tinban Remates

Plataforma de subastas online on-demand. Mobile-first, tiempo real con Socket.io.

## Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Query, Zustand, Socket.io-client
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.io
- **Real-time**: Socket.io (pujas y countdown)

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- pnpm o npm

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (ver backend/.env.example y frontend/.env.example)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Crear base de datos y migrar
npm run db:push

# Desarrollo (backend + frontend)
npm run dev
```

- Backend: http://localhost:4000
- Frontend: http://localhost:5173

## Estructura

```
tinban/
├── backend/          # API REST + Socket.io + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── socket/
│   │   └── types/
│   └── prisma/
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── stores/
│       └── pages/
└── package.json
```

## Funcionalidades

- Usuarios: registro, login, perfil, solicitud de crédito (aprobación admin)
- Subastas: catálogo, detalle con fotos/atributos dinámicos, countdown en vivo
- Pujas: validación (precio + incremento, crédito aprobado), tiempo real
- Admin: CRUD subastas, gestión créditos, historial pujas, configurador de atributos
- Contacto: botón flotante WhatsApp
