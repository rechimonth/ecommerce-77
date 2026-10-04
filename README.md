# ecommerce-77

E-commerce SPA construida en paralelo con las clases de **FullTime 77 - Frontend AI Driven**. El objetivo final es el proyecto integrador descrito en [`Proyecto.md`](./Proyecto.md). Por ahora el repositorio contiene solo lo visto en las clases 00 a 04: arquitectura, contextos, catálogo con Firestore, seeder y carrito.

## Stack

React 18+ · TypeScript · Vite · Tailwind CSS 4 (`@tailwindcss/vite`) · Firebase (Firestore)

## Qué incluye hasta ahora

| Clase | Contenido en el repo |
| --- | --- |
| 00 Tailwind | Vite + React + TS con `@tailwindcss/vite` y `@import "tailwindcss"` en `src/index.css` |
| 01 Arquitectura | Estructura por capas, Context / Provider / hook separados, `AppProviders` |
| 02 Firestore | Capa de servicios (`products.service.ts`), tipos de dominio, conversión `Timestamp` → `Date` |
| 03 Componentes | `Button` (discriminated union), `Modal` con `children`, estados reutilizables, container/presentacionales |
| 04 Catálogo | Seeder, `ProductsProvider`, filtro por categoría, búsqueda por prefijo con debounce, paginación con cursor |
| Carrito | `CartProvider` con `useReducer` (agregar, quitar, actualizar cantidad, vaciar) y total calculado |

## Estructura

```txt
src/
├── components/
│   ├── ui/            Button, Modal
│   ├── states/        LoadingState, EmptyState, ErrorState
│   ├── products/      ProductCard, ProductGrid, ProductFilters
│   ├── cart/          CartView
│   └── layout/        Header
├── pages/products/    ProductsPage (container)
├── layouts/           MainLayout
├── contexts/
│   ├── products/      Context, Provider, useProducts, types
│   ├── cart/          Context, Provider, cartReducer, useCart, types
│   └── AppProviders.tsx
├── hooks/             useDebounce
├── services/          products.service.ts (único acceso a Firestore)
├── config/            firebase.ts
├── types/             product.types.ts
└── utils/             formatPrice, categories
scripts/seed.ts        Seeder de 20 productos
```

## Instalación

```bash
git clone https://github.com/rechimonth/ecommerce-77.git
cd ecommerce-77
npm install
cp .env.example .env   # completar con las credenciales de Firebase
```

### Variables de entorno

Ver `.env.example`. El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

### Firebase

1. Crear el proyecto en la consola de Firebase y una base de datos Firestore (región `southamerica-east1`, São Paulo).
2. Para que el seeder pueda escribir sin autenticación, iniciar Firestore en modo de prueba.
3. Sembrar el catálogo: `npm run seed` (usa IDs determinísticos, así que volver a correrlo actualiza los productos en lugar de duplicarlos).
4. Publicar las reglas (lectura pública de `products`, escritura bloqueada) y el índice compuesto `categoryId + nameLower`:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Desarrollo

```bash
npm run dev
npm run build
```

## Decisiones

- **Estructura por capas** (components / pages / contexts / hooks / services / types) en lugar de por features: más simple de ubicar mientras se aprende.
- **Nunca se invoca Firestore desde un componente:** siempre pasa por `services/`.
- **Búsqueda por prefijo sobre `nameLower`** (no existe `contains` en Firestore) con debounce de 400 ms.
- **Paginación con cursor** (`startAfter(lastDoc)`), no con offset.
- **`useReducer` para el carrito:** varias acciones sobre el mismo estado, lógica centralizada en una función pura fácil de testear.
- **`ProductsProvider`:** respecto al ejemplo de la clase, se descartan las respuestas de consultas viejas (`lastRequestId`) para que un cambio rápido de filtro no pierda la consulta ni mezcle resultados.

## Commits

Formato `tipo: descripción` (`feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`).
