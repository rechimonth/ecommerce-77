# ecommerce-77

E-commerce SPA construida en paralelo con las clases de **FullTime 77 - Frontend AI Driven**. El objetivo final es el proyecto integrador descrito en [`Proyecto.md`](./Proyecto.md). Por ahora el repositorio contiene solo lo visto en las clases 00 a 05: arquitectura, contextos, catálogo con Firestore, seeder y carrito con `useReducer`, persistencia y tests.

## Stack

React 18+ · TypeScript · Vite · Tailwind CSS 4 (`@tailwindcss/vite`) · React Router · Firebase (Firestore) · Vitest

## Qué incluye hasta ahora

| Clase | Contenido en el repo |
| --- | --- |
| 00 Tailwind | Vite + React + TS con `@tailwindcss/vite` y `@import "tailwindcss"` en `src/index.css` |
| 01 Arquitectura | Estructura por capas, Context / Provider / hook separados, `AppProviders` |
| 02 Firestore | Capa de servicios (`products.service.ts`), tipos de dominio, conversión `Timestamp` → `Date` |
| 03 Componentes | `Button` (discriminated union), `Modal` con `children`, estados reutilizables, container/presentacionales |
| 04 Catálogo | Seeder, `ProductsProvider`, filtro por categoría, búsqueda por prefijo con debounce, paginación con cursor |
| 05 Carrito | `cartReducer` puro, `CartProvider` + `useCart`, persistencia en `localStorage` con inicialización lazy, `AddToCartButton`, `CartPage`, badge en el header y tests con Vitest |

## Estructura

```txt
src/
├── components/
│   ├── ui/            Button, Modal
│   ├── states/        LoadingState, EmptyState, ErrorState
│   ├── products/      ProductCard, ProductGrid, ProductFilters
│   ├── cart/          AddToCartButton, CartItemRow, CartSummary
│   └── layout/        Header
├── pages/
│   ├── products/      ProductsPage (container)
│   └── cart/          CartPage (container)
├── layouts/           MainLayout
├── contexts/
│   ├── products/      Context, Provider, useProducts, types
│   ├── cart/          cartReducer, cartStorage, CartContext, CartProvider (+ tests)
│   └── AppProviders.tsx
├── hooks/             useDebounce, useCart
├── services/          products.service.ts (único acceso a Firestore)
├── config/            firebase.ts
├── types/             product.types.ts, cart.types.ts
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
npm run dev        # servidor de desarrollo
npm run build      # chequeo de tipos + build de producción
npm test           # tests con Vitest
```

## Decisiones

- **Estructura por capas** (components / pages / contexts / hooks / services / types) en lugar de por features: más simple de ubicar mientras se aprende.
- **Nunca se invoca Firestore desde un componente:** siempre pasa por `services/`.
- **Búsqueda por prefijo sobre `nameLower`** (no existe `contains` en Firestore) con debounce de 400 ms.
- **Paginación con cursor** (`startAfter(lastDoc)`), no con offset.
- **`useReducer` para el carrito:** varias acciones sobre el mismo estado, lógica centralizada en una función pura fácil de testear.
- **El total se deriva, no se acumula:** `calculateTotal` lo recalcula siempre desde `items` y redondea a 2 decimales (`10.1 + 20.2` da `30.3`).
- **Cantidad 0 o negativa quita el item:** los componentes no deciden entre actualizar y eliminar.
- **La regla de stock vive en la UI** (`AddToCartButton`, `CartItemRow`), no en el reducer: una regla, una sola fuente de verdad.
- **Persistencia:** `localStorage` guarda una copia serializada y se restaura al montar con `useReducer(reducer, undefined, loader)`. Se revive `addedAt` como `Date`, se descartan items inválidos y se recalcula el total.
- **Estado global vs local:** el carrito vive en el context; el feedback "✓ Agregado" (1500 ms) es estado local del botón.
- **Rutas:** `/products` y `/cart` bajo un `MainLayout` con `Outlet`.
- **`ProductsProvider`:** respecto al ejemplo de la clase, se descartan las respuestas de consultas viejas (`lastRequestId`) para que un cambio rápido de filtro no pierda la consulta ni mezcle resultados.

## Commits

Formato `tipo: descripción` (`feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`).
