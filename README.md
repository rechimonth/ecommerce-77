# Rural Edition — Ecommerce 77

Tienda SPA de moda de inspiración rural y ecuestre, construida como proyecto integrador de FullTime 77. Combina una experiencia editorial mobile-first con catálogo en Firestore, autenticación Firebase, checkout simulado, gestión de pedidos y panel administrativo.

**Demo pública verificada:** https://ecommerce-77-seven.vercel.app  
**Nota de dominio:** el alias `ecommerce-77.vercel.app` sigue ocupado y no aparece bajo el ámbito Vercel disponible en esta sesión. La URL de demo de arriba es la que se probó públicamente; no uses el alias canónico hasta reasignarlo desde la cuenta que lo posee.
**Repositorio:** https://github.com/rechimonth/ecommerce-77  
**Consola Firebase:** https://console.firebase.google.com/u/0/project/ecommerce--77

> El checkout es académico y no procesa pagos reales. Los precios se presentan en USD. La identidad visual es propia y se inspira en patrones editoriales de moda: fotografía protagonista, navegación por categorías, jerarquía tipográfica, espacio en blanco y microinteracciones accesibles.

## Funcionalidades

- **Autenticación:** registro/login por correo y contraseña, login con Google y persistencia de sesión con Firebase Auth.
- **Roles:** `customer` y `admin`. Los nuevos perfiles nacen como customer; la elevación a admin se realiza por un procedimiento manual confiable.
- **Catálogo:** Firestore, búsqueda por prefijo con debounce, categorías, paginación con cursor y detalle por producto.
- **Carrito:** Context API + `useReducer`, total derivado y persistencia en Firestore por UID. Los invitados conservan el carrito en localStorage y se combina al iniciar sesión.
- **Compra:** checkout de simulación, creación de orden `pending`, historial propio y detalle del pedido. La orden se crea a través de `POST /api/orders`, que verifica la sesión, vuelve a leer los productos en Firestore y calcula precios y total en el servidor.
- **Administración:** CRUD de productos, carga de imágenes en S3 mediante URL prefirmada, listado/filtro de pedidos y actualización del estado.
- **Seguridad:** reglas de Firestore por usuario/rol; las órdenes no se pueden crear directamente desde el navegador; los endpoints serverless validan el token Firebase antes de operar.
- **Testing:** Vitest, React Testing Library, wrapper de providers, pruebas del reducer, hooks y un flujo de carrito/checkout.
- **Deploy:** Vite SPA en Vercel y función backend en `api/s3/presign.ts`.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS 4 · React Router · Firebase Authentication · Cloud Firestore · AWS S3 · Vercel Functions · Vitest · React Testing Library.

## Arquitectura

```text
src/
├── components/      # UI reutilizable, estados, auth, catálogo, carrito y layout
├── pages/           # Pantallas del cliente y del administrador
├── layouts/         # Layout de tienda y layout admin
├── contexts/        # Providers independientes para auth, catálogo y carrito
├── hooks/           # useAuth, useCart y debounce
├── services/        # Acceso a Firestore y flujo de imágenes S3
├── types/           # Modelos de producto, usuario, carrito y orden
├── config/          # Configuración pública del SDK web de Firebase
└── test/            # Setup y wrapper para pruebas
api/s3/presign.ts    # Función serverless: autoriza subidas y firma URLs para objetos privados
api/orders.ts        # Función serverless: valida sesión, catálogo, stock y totales de las órdenes
scripts/seed.ts      # Seeder ejecutado con Firebase Admin SDK
firestore.rules      # Reglas de autorización de datos
firestore.indexes.json
```

**Separación de responsabilidades:** los componentes presentan datos, las páginas coordinan los flujos, hooks/Context comparten estado, y la capa `services/` es el único sitio donde la app cliente accede a Firestore. El reducer recibe acciones completas y es puro; el reloj se lee en el proveedor, no dentro del reducer.

## 1. Instalación local

Requisitos: Node.js 22.x y npm (la plataforma Vercel también debe estar configurada en Node.js 22.x).

```bash
git clone https://github.com/rechimonth/ecommerce-77.git
cd ecommerce-77
npm install
cp .env.example .env
```

En Windows PowerShell, para crear el archivo de entorno:

```powershell
Copy-Item .env.example .env
```

Completá las variables de Firebase para el cliente en `.env`. Nunca subas `.env` ni pegues claves privadas en GitHub, tickets o chats.

```bash
npm run dev
npm run typecheck
npm test
npm run build
```

- `npm run dev`: servidor local.
- `npm run typecheck`: compilación de tipos sin generar archivos.
- `npm test`: suite Vitest.
- `npm run build`: ejecuta la suite Vitest, después el typecheck y finalmente el build de producción; si falla un test, no se publica un build verde.
- `npm run seed`: carga los 20 productos iniciales usando credenciales privadas de Firebase Admin.

## 2. Configurar Firebase Authentication

1. Abrí [Firebase Authentication](https://console.firebase.google.com/u/0/project/ecommerce--77/authentication).
2. Entrá en **Get started / Comenzar**, si aparece ese botón.
3. En **Sign-in method / Método de acceso**, habilitá **Email/Password (Correo electrónico/Contraseña)** y **Google**.
4. En los ajustes de Authentication, revisá **Authorized domains / Dominios autorizados**. Agregá `ecommerce-77-seven.vercel.app` y `localhost` para desarrollo local. La respuesta HTTP pública no prueba por sí sola que Google Authentication esté configurado para ese dominio.
5. En **Firestore Database**, verificá que la base de datos esté creada. Si todavía no existe, creala en la región que prefieras (idealmente la misma para todos los recursos regionales).

La configuración web que pegaste se representa en el archivo de entorno con estos nombres:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=ecommerce--77
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Estos valores corresponden al **SDK web**. Los valores `VITE_*` pueden estar incluidos en el bundle del navegador: no pongas una clave privada, secreto de AWS ni service account bajo ese prefijo. La seguridad depende de reglas y configuración de la plataforma, no de ocultar la API key web.

**Importante:** antes de probar el registro de usuario, desplegá las reglas e índices de la sección 6. Desplegá estas reglas para crear perfiles `users/{uid}` y guardar el carrito privado `carts/{uid}`. Sin las reglas actualizadas, el registro y la sincronización del carrito no completarán su flujo.

### Crear las credenciales de servidor para Firebase Admin

El seeder y la función S3 usan Firebase Admin, que necesita credenciales privadas:

1. En Google Cloud Console, elegí el proyecto `ecommerce--77`.
2. En IAM & Admin → Service Accounts, creá/seleccioná una cuenta de servicio con los permisos mínimos necesarios para leer el perfil de usuario y para sembrar productos (para una práctica académica suele ser más fácil crear una cuenta específica y limitar su acceso, en lugar de reutilizar credenciales de una cuenta personal).
3. Generá una clave JSON en un lugar seguro. No la subas al repositorio ni la compartas en chat.
4. Copiá el email de la cuenta a `FIREBASE_CLIENT_EMAIL`, el ID del proyecto a `FIREBASE_PROJECT_ID` y el valor completo `private_key` a `FIREBASE_PRIVATE_KEY`. Conservá las líneas nuevas como `\n` si el panel de variables lo requiere.

## 3. Crear el perfil administrador

**No existe registro público de administradores.** Primero registrá una cuenta normal en la aplicación. Después:

1. Abrí Firestore → colección `users`.
2. Encontrá el documento cuyo ID sea el `uid` de esa cuenta (podés consultarlo en Authentication → Users).
3. Editá el campo `role` de `customer` a `admin`.
4. Cerrá e iniciá sesión nuevamente para volver a leer el perfil.

No permitas que un formulario del navegador asigne el rol `admin`. La función de subida y las reglas de Firestore comprueban el perfil guardado.

## 4. AWS S3: bucket privado y CORS

Bucket actual informado: `ecommerce77-593300580318-us-east-1-an`. Confirmá en su página de propiedades que la región real sea `us-east-1` antes de cargar `AWS_REGION`.

### Mantener el bucket privado

En S3 → bucket → **Permissions**:
- Mantené **Block all public access / Bloquear todo el acceso público** activado.
- No agregues permisos `Everyone`, no habilites ACL públicas y no publiques la política del bucket.
- Las imágenes se guardan bajo `products/`. El frontend solicita URLs de corta duración para verlas; una presigned URL autoriza solo la operación firmada y expira.

### Configurar CORS

En S3 → bucket → **Permissions → Cross-origin resource sharing (CORS)**, guardá esta configuración para la demo pública actual. Las pruebas realizadas confirmaron que Vercel sirve la app, pero no verificaron una subida real a S3; por eso hay que confirmar que este origen esté guardado en el bucket antes de dar el upload por validado.

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://ecommerce-77-seven.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### IAM de mínimo privilegio

Creá una política para una identidad de aplicación dedicada. Reemplazá el nombre del bucket si la región/nombre no coinciden con el real:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ProductImagesReadWrite",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::ecommerce77-593300580318-us-east-1-an/products/*"
    }
  ]
}
```

La política de ejemplo autoriza objetos de imágenes, no administrar el bucket ni cambiar CORS. No uses la clave root de AWS. Si podés utilizar una credencial temporal/rol en tu infraestructura, es preferible a una access key permanente.

## 5. Variables del backend y Vercel

Configurá en **Vercel → proyecto ecommerce-77 → Settings → Environment Variables** lo siguiente para **Development** y **Production** (y Preview solo si vas a probar esos despliegues):

| Variable | Uso |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | SDK web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | SDK web de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | SDK web de Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | SDK web de Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | SDK web de Firebase |
| `VITE_FIREBASE_APP_ID` | SDK web de Firebase |
| `FIREBASE_PROJECT_ID` | Firebase Admin (servidor) |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin (servidor) |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin (secreto) |
| `AWS_ACCESS_KEY_ID` | IAM de mínimo privilegio (secreto) |
| `AWS_SECRET_ACCESS_KEY` | IAM de mínimo privilegio (secreto) |
| `AWS_REGION` | región confirmada del bucket |
| `AWS_S3_BUCKET` | nombre de bucket actual |

Después de modificar variables, **volvé a desplegar** para que el build y las funciones las reciban. El archivo `vercel.json` dirige rutas de la SPA a `index.html`; `api/s3/presign.ts` se compila como función serverless.

### Variables para la ejecución local de `npm run seed`

Las variables privadas de Firebase Admin también deben existir en el `.env` local, pero solo en tu máquina. El SDK Admin omite las reglas de Firestore, así que no es necesario habilitar temporalmente escrituras públicas para cargar el catálogo.

```bash
npm run seed
```

## 6. Reglas e índices de Firestore

Los archivos fuente están en `firestore.rules` y `firestore.indexes.json`. Después de instalar Firebase CLI e iniciar sesión con una cuenta autorizada:

```bash
firebase login
firebase deploy --project ecommerce--77 --only firestore:rules,firestore:indexes
```

**Antes de desplegar**, verificá que el proyecto activo sea `ecommerce--77` y que tus cuentas de cliente no tengan rol admin. Las reglas bloquean por defecto las colecciones no declaradas; permiten leer el catálogo, guardar carritos únicamente bajo el UID autenticado, escribir productos solo a admin y que cada cliente lea solo sus pedidos. La creación de órdenes desde el SDK web está denegada: el checkout usa `POST /api/orders`, que valida el token Firebase, comprueba el perfil, vuelve a leer los productos y calcula el total confiable en el servidor. Admin puede gestionar todos los pedidos.

## 7. Flujo seguro de imagen (presigned URL)

1. El administrador selecciona una imagen y el navegador solicita `POST /api/s3/presign` con su Firebase ID token.
2. La Vercel Function valida el token, lee `users/{uid}` de Firestore y verifica `role === "admin"`.
3. La función firma una URL de S3 para un objeto nuevo bajo `products/{uid}/` y devuelve la clave y la URL de subida, con vencimiento corto.
4. El navegador hace `PUT` del archivo directamente a esa URL, enviando el encabezado `Content-Type` que fue firmado.
5. El producto guarda un identificador `s3://products/...`, no una URL temporal.
6. Para mostrar la imagen, el navegador solicita otra URL prefirmada de lectura. La URL de lectura expira y el objeto sigue privado.

Las credenciales de AWS existen solo en el servidor. Si la subida falla por CORS, revisá que el origen coincide exactamente con el dominio usado (incluido `https`) y que `Content-Type` coincida con el enviado a S3.

## 8. Creación segura de órdenes

El frontend envía a `POST /api/orders` únicamente el nombre de entrega, la dirección y pares `productId/quantity`. El endpoint exige un Firebase ID token, deriva el UID y el email de la identidad verificada, comprueba que exista un perfil permitido, lee cada producto directamente de Firestore y construye la fotografía de la orden con nombres, imágenes y precios canónicos. El total se calcula en centavos enteros, se rechazan productos inexistentes y cantidades fuera de stock, y finalmente se guarda el pedido como `pending`.

La regla `allow create: if false` en `firestore.rules` evita que un cliente eluda el endpoint e invente precios o un total. La función necesita `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` en el entorno de Vercel. Al cambiar las reglas, desplegalas con el comando de la sección 6 antes de probar checkout; hasta entonces el nuevo endpoint puede crear órdenes, pero las reglas deben reflejar el modelo de seguridad actualizado.

## 9. Testing

```bash
npm ci
npm run typecheck
npm test
npm run build
```

La suite cubre las acciones del reducer, tolerancia a datos corruptos en la persistencia del carrito, los hooks `useCart`/`useAuth`, el flujo de checkout con servicio mockeado, la validación de órdenes del lado del servidor y el servicio de imágenes S3 (token, URL prefirmada, rechazo de archivos grandes y lectura temporal). El comando `npm run build` empieza por `vitest run`, por lo que Vercel no puede marcar el build como exitoso si los tests fallan. La suite automatizada no sustituye las pruebas de integración contra Firebase/S3 reales.

## 10. Bitácora de uso de IA

Esta bitácora registra consultas técnicas, aprendizaje, decisión humana y evidencia verificable del resultado. Las preguntas están **reformuladas de manera fiel para describir las decisiones** y no se presentan como transcripciones literales de prompts que no quedaron guardados textualmente.

| Pregunta técnica revisada | Qué aprendí al evaluar alternativas | Decisión humana y evidencia en el proyecto |
| --- | --- | --- |
| ¿Qué necesita la entrega además de una tienda que solo lista productos? | La consigna exige dos roles, Auth, persistencia en Firestore, checkout simulado, panel admin, S3 seguro, pruebas y deploy accesible. | Priorizo requisitos obligatorios sobre los extras; las rutas están en `src/App.tsx` y la lista de requisitos/configuración en este README. |
| ¿Alcanza con ocultar las rutas admin en React para proteger los datos? | No: un usuario puede llamar a Firestore o a una función directamente, sin utilizar los botones ni la navegación de la UI. | Mantengo los guards en frontend, las reglas en `firestore.rules` y la verificación server-side de roles en las funciones. No permito que el registro público establezca `role: admin`. |
| ¿Cómo impido que el navegador invente un total o una identidad al confirmar un pedido? | Los importes, usuario y email enviados desde el navegador no son una fuente de verdad. Las pruebas deben incluir valores manipulados, stock insuficiente y productos inexistentes. | `api/orders.ts` verifica el Firebase ID token, lee los productos de Firestore y calcula el total en centavos. `src/services/orderValidation.test.ts` cubre estos casos y `firestore.rules` bloquea la creación directa desde el cliente. |
| ¿Cómo mantengo el carrito predecible y verifico sus acciones? | Un reducer puro permite calcular el total derivado y probar cada acción sin conexión a Firebase. | Conservo Context API + `useReducer`; los tests de reducer, persistencia, merge y hooks aíslan estas decisiones de la red. |
| ¿Cómo permite el administrador subir imágenes sin exponer credenciales AWS? | La firma de URL temporal debe ocurrir en el servidor después de validar sesión y rol. CORS no reemplaza la autorización IAM. | Mantengo AWS en `api/s3/presign.ts`, bucket privado y URL prefirmada; `src/services/upload.service.test.ts` verifica autorización, transferencia y errores. También se rechazan temprano formatos no admitidos y archivos vacíos. |
| ¿Qué causaba el HTTP 500 del endpoint de pedidos en producción? | Los logs identificaron `ERR_MODULE_NOT_FOUND`: el runtime ESM no encontraba el módulo TypeScript importado sin extensión. Un build verde por sí solo no demuestra que el endpoint cargue correctamente. | Cambié el import a `../src/services/orderValidation.ts` en el commit [1769444](https://github.com/rechimonth/ecommerce-77/commit/17694441d87c4eef541ae6a320add506aa6d375b), esperé el check Vercel `success` y repetí la llamada: GET devuelve `405` en vez de `500`. |
| ¿Cómo distinguir un deploy accesible de una integración real con Firebase/S3? | `200` para el HTML confirma hosting, no autenticación, permisos, escritura en Firestore ni carga a S3. | Probé la URL pública y la protección de los endpoints sin crear órdenes ni subir archivos. Dejé los flujos autenticados como pendientes explícitos hasta probarlos con cuentas y servicios reales. |

## Lista final de validación en producción

- [ ] Email/password y Google están habilitados en Firebase Auth.
- [ ] Dominio Vercel añadido a los dominios autorizados.
- [ ] Firestore rules e índices desplegados en el proyecto correcto.
- [ ] Perfil del administrador asignado de forma manual y segura.
- [ ] CORS está limitado a localhost y al dominio de producción real.
- [ ] Bucket privado; usuario IAM con permisos restringidos a `products/*`.
- [ ] Variables privadas presentes solo en entorno local/servidor de Vercel.
- [ ] La URL oficial de producción sirve el despliegue correcto sin 500/404 y es accesible sin login de Vercel.
- [ ] Se puede registrar cliente, agregar artículo, confirmar pedido y ver el historial.
- [ ] El backend calcula precios/totales de órdenes desde Firestore y las reglas niegan crearlas directamente desde el navegador.
- [ ] Admin puede crear/editar/eliminar producto con imagen y actualizar un pedido.
- [ ] `npm test`, `npm run typecheck` y `npm run build` pasan.
- [ ] Se recorrieron los flujos principales en la URL de producción y en móvil.

## Estado de entrega comprobado

Comprobaciones realizadas el 11 de octubre de 2026:

- La URL pública de demo `https://ecommerce-77-seven.vercel.app/` y la ruta `/products` responden HTTP 200 sin bypass; `/api/orders` responde HTTP 405 a GET.
- En el despliegue nuevo, `GET /api/orders` y `GET /api/s3/presign` responden HTTP 405. Un POST sin token devuelve el mensaje de autenticación y no crea una orden ni sube una imagen.
- El error ESM del import se corrigió en el commit [1769444](https://github.com/rechimonth/ecommerce-77/commit/17694441d87c4eef541ae6a320add506aa6d375b). Vercel reportó estado `success` para ese commit, y la prueba runtime posterior confirmó la corrección.
- Según la salida de Firebase CLI compartida durante el desarrollo, las reglas de Firestore e índices fueron desplegados correctamente a `ecommerce--77`.
- El alias `ecommerce-77.vercel.app` sigue sin estar disponible bajo el ámbito de Vercel usado para esta app. Para la demostración, usa la URL pública listada al inicio.

Queda una validación manual indispensable antes de declarar todos los flujos listos: confirmar las variables de entorno de producción (sin revelar sus valores), agregar `ecommerce-77-seven.vercel.app` a los dominios autorizados de Firebase Auth, verificar/guardar el CORS de S3 para ese origen y probar con cuentas reales ambos roles (registro/login, carrito, orden en Firestore, historial, CRUD admin, upload y cambio de estado). Las respuestas HTTP y el build no sustituyen esa prueba end-to-end autenticada.

El checkout es simulado por consigna y no cobra dinero. No se deben pegar claves privadas, tokens de bypass ni valores secretos en README, GitHub o chats.
