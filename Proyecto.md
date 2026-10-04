AI Driven E-Commerce
Contexto del proyecto y rol del estudiante: 
Patagonix Tech es una software factory especializada en desarrollar aplicaciones web para clientes del sector retail. Un cliente del sector ha solicitado una plataforma de ecommerce que permita a sus usuarios finales comprar productos de manera online, con una experiencia moderna y funcionalidades de administración robustas.

Requerimientos del cliente:
El cliente solicita una solución escalable, mantenible y basada en servicios administrados (BaaS) para reducir costos de infraestructura y acelerar el timetomarket. La aplicación debe soportar dos tipos de usuarios:

Clientes que navegan y compran productos.
Administradores que gestionan el catálogo y las órdenes de compra.
Stack técnico definido:
Para cumplir con estos requerimientos, se define el siguiente stack tecnológico:

Frontend: React 18 + TypeScript + Vite para una SPA moderna y typesafe
Backend as a Service: Firebase (Authentication + Firestore) para autenticación y base de datos en tiempo real
Almacenamiento de archivos: AWS S3 para imágenes de productos con uploads seguros mediante presigned URLs
Backend serverless: Vercel Serverless Functions para lógica de backend sin servidor
Testing: Vitest + React Testing Library para garantizar calidad del código
Deploy: Vercel para deployment continuo y hosting escalable
Tu rol como Desarrollador/a:
Serás responsable de diseñar, implementar, testear y documentar una aplicación SPA completamente funcional que permita:

Registro y autenticación de usuarios con roles diferenciados (customer/admin)
Gestión completa del catálogo de productos (CRUD) desde el panel de administración
Experiencia de compra fluida: navegación, filtrado, carrito y checkout (este último es simulado)
Persistencia de datos en la nube por usuario (carrito, órdenes, perfil)
Upload seguro de imágenes de productos a AWS S3
Gestión de órdenes con estados y seguimiento
Deploy público accesible vía URL con variables de entorno configuradas
Deberás aplicar buenas prácticas de arquitectura (separación de responsabilidades en capas), tipado estricto con TypeScript, testing de componentes y lógica de negocio, seguridad (manejo de credenciales, roles de usuario), y control de versiones profesional con commits descriptivos. Además, utilizarás AI como herramienta de desarrollo para validar decisiones técnicas, generar tests y obtener code reviews.

Objetivos del Proyecto Integrador
🎯Objetivos
Uso de AI como herramienta de desarrollo: mejora tu uso de AI (ChatGPT, Claude, Gemini) para acelerar el desarrollo. Aprende a formular prompts efectivos para planificar arquitectura de aplicaciones, solicitar code reviews detallados que identifiquen bugs y mejoras, validar decisiones técnicas antes de implementar, generar casos de test, explicar conceptos complejos (presigned URLs, CORS, IAM, Serverless Functions), validar flujos de negocio y descubrir patrones de diseño aplicables a tu código.
Arquitectura y organización: diseñar aplicaciones React priorizando la lógica de negocio, de modo que las funcionalidades sean fáciles de ubicar. Como opción, se puede aplicar Screaming Architecture o una organización por features. En ambos casos, mantener una separación clara con módulos como pages, components, contexts, services, types y hooks, de forma que la estructura permita entender el propósito del proyecto (por ejemplo, un e-commerce) sin revisar el código en detalle.
TypeScript avanzado: Definir interfaces completas para entidades del negocio, usar tipos genéricos y aprovechar type safety.
Context API y useReducer: Gestionar estado global complejo con múltiples acciones y lógica centralizada.
Firebase: Implementar autenticación (email/password, Google), queries de Firestore con filtros, y gestión de roles de usuario.
AWS S3 y Serverless: Integrar almacenamiento de imágenes con S3, usar presigned URLs para uploads seguros, y crear Vercel Serverless Functions.
Testing: Escribir tests unitarios y de integración con Vitest y React Testing Library, mockear servicios externos.
Componentes reutilizables: Aplica principios de responsabilidad única y crear componentes configurables con props avanzadas.
Diseño mobilefirst y estados de UI: Aplica un diseño responsivo desde el inicio priorizando mobile.



Consigna
Detalle
Tu tarea es diseñar, desarrollar, testear y desplegar una Single Page Application (SPA) funcional utilizando React 18 + TypeScript + Vite, con Firebase como backend de autenticación y base de datos, AWS S3 para el almacenamiento de imágenes, y Vercel para el deploy y las funciones serverless.

La aplicación debe soportar dos tipos de usuarios:

clientes, que navegan el catálogo, agregan productos al carrito y realizan compras; y
administradores, que gestionan productos y órdenes desde un panel protegido.
Durante el desarrollo, deberás utilizar herramientas de IA (Claude, ChatGPT, Gemini u otras) de forma estratégica para planificar la arquitectura, validar decisiones técnicas, solicitar code reviews, generar casos de test y resolver problemas.

Este proceso debe quedar documentado en una bitácora incluida en el README, con al menos 5 entradas que muestren evidencia real de cómo la IA te ayudó a aprender y tomar decisiones.

Requerimientos funcionales
🔐Autenticación de usuarios
Registro con email/password o Google
Login y logout
Diferenciación de roles: customer y admin
Persistencia de sesión
🗒️Catálogo de productos
Listar productos desde Firestore
Filtrar por categoría
Búsqueda por nombre (con debounce)
Ver detalle de producto
🛒Carrito de compras
Agregar productos al carrito
Eliminar productos del carrito
Actualizar cantidad de productos
Calcular total automáticamente
Persistir carrito en Context
👩🏽‍💻Checkout y órdenes
Flujo de checkout: revisar carrito y confirmar
Crear orden en Firestore con estados (pending, processing, completed, cancelled)
Checkout de pago (solo simulación de pago, No es requisito usar ninguna pasarela de pago)
Historial de órdenes del usuario
Ver detalle de órdenes pasadas
🈺Panel de administración
CRUD completo de productos
Upload de imágenes a AWS S3
Ver todas las órdenes
Filtrar órdenes por estado
Cambiar estado de órdenes
Layout diferenciado del panel de cliente
⚙️Componentes y UI
Diseño mobilefirst, UI responsiva trabajando con firstmobile.
Spinners o skeletons durante carga de datos
Mensajes cuando no hay productos, órdenes o items en carrito
Manejo visual de errores con mensajes claros
Componentes reutilizables con props tipadas y validación de formularios
✅Testing
 Crear wrapper de providers para testear componentes que dependen de múltiples contexts
Testear custom hooks (useCart, useAuth) con renderHook de forma aislada
Testear cartReducer verificando que cada action produce el estado correcto
Tests de integración simulando flujos completos de usuario (agregar al carrito, checkout)
Mockear Firebase y AWS SDK para que tests no dependan de servicios externos
Usar AI para generar casos de test y validar cobertura de casos edge
🚀Deploy
Deploy en Vercel con integración continua desde GitHub
URL pública funcional y accesible
Variables de entorno configuradas correctamente en Vercel
Build de producción optimizado
Verificación de todos los flujos en producción
🔏Seguridad
Crear .env para desarrollo local y .env.example sin valores reales
Las credenciales de Firebase (API keys, project ID) deben manejarse como variables de entorno
Las credenciales de AWS (Access Key ID, Secret Access Key) deben manejarse como variables de entorno en Vercel Functions
No exponer secretos en el frontend (las credenciales de AWS solo deben estar en el backend serverless)
Añadir .env en el archivo .gitignore
Commits realizados excluyendo variables de entorno
Validación de roles de usuario en el frontend y queries de Firestore con reglas de seguridad
Tech Stack necesario:
Frontend:
React 18
TypeScript
Vite (build tool)
React Router (navegación)
TailwindCSS (estilos)
Context API (estado global)
Backend/Servicios:
Firebase Authentication (autenticación de usuarios)
Firebase Firestore (base de datos NoSQL)
AWS S3 (almacenamiento de imágenes)
Vercel Serverless Functions (backend serverless)
Testing:
Vitest (test runner)
React Testing Library (testing de componentes)
Deployment:
Vercel (hosting y deployment)
GitHub (control de versiones)
😎Extra credit
Dashboard de Analytics: Puedes incluir un panel con métricas de ventas, productos más vendidos e ingresos usando gráficos. Explora librerías como Recharts o Chart.js para visualización de datos.
Paginación de Productos: Agregar paginación es ideal para mejorar la performance cuando hay muchos productos. Investiga limit() y startAfter() de Firestore para cargar datos en lotes.
Reviews y Ratings: Permite que usuarios califiquen y comenten productos. Considera cómo estructurar esta información en Firestore y calcular promedios de calificaciones.
Estos extras no son obligatorios, pero pueden ayudarte a demostrar iniciativa y profundidad técnica.



Entregable Final
Entregable
El entregable debe ser un repositorio en GitHub:

📁 Desarrollo

Código organizado por capas (components, pages, contexts, services, hooks, types, api)
Commits semánticos y descriptivos (ej: feat: add product filtering, fix: cart total calculation)
📁 Documentación
  📄 README profesional que incluya:

Descripción del proyecto y contexto del cliente
Decisiones arquitectónicas: por qué Context API + useReducer, por qué S3 para imágenes, estructura de carpetas
Instrucciones de instalación y configuración paso a paso
Variables de entorno necesarias (incluir .env.example en el repo)
URL de producción desplegada en Vercel
Flujo de upload de imágenes a S3 con presigned URLs
Bitácora de uso de IA. una sección en el README con una tabla que documente al menos 5 momentos clave donde usaste AI durante el desarrollo. Cada entrada debe mostrar evidencia real de cómo AI te ayudó a aprender y tomar decisiones. 
La bitácora debe evidenciar que usaste IA para estos temas planificación, code reviews, validación de decisiones técnicas, generación de tests, y resolución de problemas, no solo para copiar código, sino para aprender y tomar decisiones informadas.

📁 Aplicación desplegada en Vercel con:

Autenticación funcional con Firebase (registro, login, logout, persistencia de sesión)
CRUD completo de productos persistente en Firestore (crear, leer, actualizar, eliminar)
Upload de imágenes a AWS S3 mediante presigned URLs generadas por Vercel Serverless Functions
Gestión de carrito de compras con Context API y useReducer
Flujo de checkout completo que crea órdenes en Firestore
Panel de administración con rutas protegidas por rol
Variables de entorno configuradas correctamente (Firebase config, AWS credentials)
Presentación y defensa:
Preparar presentación que incluya:

Demostración en vivo del proyecto funcional.
Explicación de las partes del proyecto (Arquitectura, estructura de carpetas)
Walkthrough de las partes más desafiantes.
Aprendizajes obtenidos.
Uso de la IA como asistente para tomar decisiones
Desafíos en el desarrollo del proyecto y su resolución 
Rúbrica de corrección
En este archivo podrás ver las rúbricas de corrección para el Proyecto Integrador del Módulo

Guía para el desarrollo del PI
Ir a la guía de acompañamiento para el desarrollo del PI

GUÍA PARA EL DESARROLLO DEL PROYECTO INTEGRADOR 5, ESPECIALIZACIÓN FRONTEND

Propósito de esta guía

Esta guía tiene como objetivo acompañarte en el desarrollo técnico del Proyecto Integrador 5, especialización Frontend.

No reemplaza la consigna oficial ni define una única forma de resolver el proyecto. Su función es orientarte con recomendaciones y buenas prácticas para que puedas organizar tu desarrollo y evitar errores comunes.

Este es el proyecto más complejo de la carrera en términos de superficie: dos roles de usuario, múltiples flujos, integración con tres servicios externos y una bitácora de uso de IA que es parte de la evaluación. La clave es entender bien la arquitectura antes de empezar a construir funcionalidades.

Qué se espera del proyecto

Se espera una aplicación de e-commerce completamente funcional con dos experiencias diferenciadas: la del cliente que navega y compra, y la del administrador que gestiona el catálogo y las órdenes. Más allá de que todo funcione, se valorará especialmente:

Que la arquitectura esté organizada por capas o features con responsabilidades claras.
Que el estado global con Context API y useReducer sea predecible y fácil de seguir.
Que las credenciales de AWS nunca estén en el frontend.
Que las reglas de Firestore protejan los datos según el rol del usuario.
Que la bitácora de uso de IA muestre reflexión real, no solo que se usó.
Que la aplicación sea usable en dispositivos móviles desde el primer render.
El flujo del proyecto

El proyecto tiene más capas que los anteriores. Entender cómo se conectan antes de empezar ayuda a tomar mejores decisiones de arquitectura.
Firebase Auth  —  identidad del usuario y rol (customer / admin)

     ↓

Firestore  —  productos, órdenes, perfil de usuario

     ↓

Context API + useReducer  —  estado del carrito y sesión en el frontend

     ↓

Vercel Serverless Functions  —  generación de presigned URLs para S3

     ↓

AWS S3  —  almacenamiento de imágenes de productos

     ↓

Vercel  —  deploy, variables de entorno y build de producción
Una decisión tomada al inicio (cómo modelar el rol del usuario en Firestore, cómo estructurar los contextos, cómo separar las rutas por rol) va a impactar en todas las etapas siguientes. Vale la pena leer la consigna completa antes de escribir la primera línea de código.

Cómo organizar el proyecto
Etapa 1: Setup, arquitectura y roles

Estructura base, TypeScript, rutas y modelo de usuario

¿Qué tener en cuenta?

Las decisiones de esta etapa condicionan todo el proyecto. Antes de crear archivos, vale preguntarse: ¿cómo se organiza el código? La consigna menciona dos enfoques válidos: por capas técnicas (components, pages, services, hooks) o por features (auth, products, cart, orders, admin). ¿Cuál facilita más entender el propósito del proyecto con solo mirar la estructura de carpetas?

El manejo de roles es una decisión de diseño con implicaciones en múltiples capas: cómo se guarda el rol en Firestore, cómo se lee al iniciar sesión, cómo se propaga al resto de la aplicación y cómo se protegen las rutas de administración. Vale definir ese flujo en papel antes de implementarlo.

TypeScript agrega más valor cuanto más complejo es el dominio. ¿Qué interfaces son necesarias para representar un producto, un ítem del carrito, una orden con estados? Definirlas desde el inicio hace que el resto del código sea más predecible y fácil de refactorizar.

Una advertencia crítica

Las credenciales de Firebase y AWS nunca deben aparecer en el código que se sube al repositorio. Antes del primer commit, verificar que .env esté en .gitignore. El .env.example con los nombres de las variables (sin valores) sí debe estar en el repositorio.

✅  ¿Cómo lo verifico?

 La estructura de carpetas refleja una separación de responsabilidades que se puede explicar.
 Existen interfaces TypeScript para las entidades principales del negocio.
 El flujo de roles está pensado: cómo se asigna, dónde se guarda y cómo se lee.
 .env está en .gitignore y .env.example está en el repositorio sin valores reales.
Etapa 2: Autenticación y protección de rutas
Firebase Auth, roles y acceso diferenciado

¿Qué tener en cuenta?

Este proyecto tiene dos tipos de rutas protegidas: las que requieren sesión activa (cualquier usuario autenticado) y las que requieren rol de administrador. Son dos niveles de protección diferentes que conviene implementar como componentes separados. 

El rol del usuario no lo provee Firebase directamente: hay que guardarlo en Firestore al registrarse y leerlo al iniciar sesión. Eso crea una dependencia de timing: ¿qué pasa si el usuario está autenticado pero el rol todavía no se cargó? ¿Cómo se maneja ese estado intermedio para evitar que el componente tome una decisión equivocada? 

Otro aspecto a considerar: las reglas de seguridad de Firestore deben reflejar los roles también del lado del servidor. La validación de roles solo en el frontend se puede saltear manipulando el estado del navegador.

✅  ¿Cómo lo verifico?

 Registro, login con email/password y con Google, y logout funcionan correctamente.
 La sesión persiste al recargar la página.
 Las rutas de administración son inaccesibles para usuarios con rol customer.
 Las reglas de Firestore reflejan los permisos por rol.
 El estado intermedio de carga de rol no produce redireccionamientos prematuros.
Etapa 3: Catálogo de productos
Firestore, filtros, búsqueda y detalle

¿Qué tener en cuenta?

El catálogo es la experiencia central del cliente. Antes de implementar, vale pensar cómo están modelados los productos en Firestore: ¿qué campos tiene un producto? ¿cómo se guarda la categoría para que el filtro sea eficiente? La estructura del documento en Firestore define qué queries son posibles. 

La búsqueda por nombre con debounce es un patrón de UX importante: evita hacer una query por cada tecla que presiona el usuario. ¿Qué es el debounce y cómo se implementa con hooks? Entender el concepto antes de implementarlo hace que la solución sea más limpia. 

Los estados de carga (spinners o skeletons) y los mensajes cuando no hay productos no son detalles: son parte de la experiencia de usuario que se evalúa explícitamente. Un componente que carga sin ninguna indicación visual genera una experiencia de baja calidad.

✅  ¿Cómo lo verifico?

 Los productos se listan correctamente desde Firestore.
 El filtro por categoría funciona sin recargar la página.
 La búsqueda por nombre tiene debounce y no hace una query por cada tecla.
 Se muestra un mensaje claro cuando no hay productos que coincidan.
 Hay un estado de carga visible mientras se obtienen los datos
Etapa 4: Carrito de compras
Context API, useReducer y persistencia

¿Qué tener en cuenta?

El carrito es el componente de estado global más complejo del proyecto. La consigna pide implementarlo con Context API y useReducer, no con useState simple. Antes de empezar, vale preguntarse: ¿por qué useReducer en lugar de useState para el carrito? ¿Qué ventaja ofrece cuando el estado tiene múltiples acciones (agregar, eliminar, actualizar cantidad, limpiar)? 

El reducer del carrito es uno de los componentes más fáciles de testear del proyecto: recibe un estado y una acción, y devuelve un nuevo estado. Esa pureza hace que los tests sean directos. Vale escribir los tests del reducer en paralelo con la implementación. 

Una pregunta de diseño: ¿el contexto del carrito y el contexto de autenticación deben ser el mismo o separados? Mezclar responsabilidades en un solo contexto hace el código más difícil de mantener y testear.

Concepto clave a profundizar

¿Cuál es la diferencia entre useState y useReducer?

¿En qué situaciones useReducer hace el estado más predecible y fácil de seguir?

Entender esto bien es clave para poder justificarlo en la presentación.

✅  ¿Cómo lo verifico?

 Se puede agregar, eliminar y actualizar la cantidad de productos en el carrito.
 El total se calcula automáticamente y es correcto.
 El reducer del carrito está separado del contexto de autenticación.
 Se puede explicar por qué se usó useReducer y qué acciones maneja.
Etapa 5: Checkout y órdenes
Flujo de compra, estados y persistencia en Firestore

¿Qué tener en cuenta?

El checkout es un flujo con múltiples pasos: revisar el carrito, confirmar, crear la orden en Firestore y limpiar el carrito. Cada paso puede fallar. ¿Cómo se maneja un error al crear la orden? ¿Qué ve el usuario si algo sale mal?

Las órdenes tienen estados (pending, processing, completed, cancelled). Esa estructura debe estar bien definida en TypeScript y reflejada en Firestore. ¿Cómo se modela una transición de estado? ¿Quien puede cambiar el estado de una orden: solo el admin, o también el usuario?

El historial de órdenes del usuario requiere una query filtrada por userId. Vale verificar que esa query está cubierta por las reglas de seguridad de Firestore: un usuario no debe poder ver las órdenes de otro.

✅  ¿Cómo lo verifico?

 El flujo de checkout crea una orden en Firestore y limpia el carrito.
 Las órdenes tienen estados definidos en TypeScript.
 El historial de órdenes muestra solo las del usuario autenticado.
 Los errores en el proceso de checkout son visibles para el usuario.
 Un usuario no puede ver las órdenes de otro usuario.
Etapa 6: Panel de administración
Operaciones completas con sincronización en tiempo real

¿Qué tener en cuenta?

El panel de administración es una experiencia separada de la del cliente: tiene su propio layout, sus propias rutas protegidas y su propia lógica de negocio. Antes de implementarlo, vale pensar cómo se diferencia visualmente y en código de la experiencia del cliente. 

El upload de imágenes a S3 tiene una arquitectura particular que hay que entender antes de implementar: el frontend no llama a S3 directamente (eso expondría las credenciales de AWS). En cambio, solicita a una Vercel Serverless Function una presigned URL, y con esa URL sube el archivo directamente desde el navegador. ¿Por qué este flujo es más seguro que las alternativas? 

La gestión de órdenes desde el panel admin requiere queries diferentes a las del usuario: el admin ve todas las órdenes, puede filtrarlas por estado y puede cambiar su estado. ¿Cómo se protege esa funcionalidad en las reglas de Firestore?

AWS S3 y la capa gratuita

Este proyecto está diseñado para operar dentro de la capa gratuita de AWS.
S3 ofrece 5 GB de almacenamiento, 20.000 solicitudes GET y 2.000 solicitudes PUT gratuitas por mes durante el primer año. Para el volumen de pruebas de este proyecto, no debería generar ningún costo.
Vale tener en cuenta dos cosas: no dejar el bucket con acceso público innecesario, y evitar uploads masivos de archivos grandes durante las pruebas. Ambas situaciones pueden generar cargos inesperados o problemas de seguridad.
Sobre las presigned URLs

Una presigned URL es una URL temporal generada por AWS que autoriza una operación específica (como subir un archivo) sin exponer las credenciales.
El flujo es: el frontend pide la URL a la Vercel Function → la Function genera la URL con las credenciales del servidor → el frontend sube el archivo directamente a S3 usando esa URL.
Las credenciales de AWS solo existen en la Vercel Function, nunca llegan al navegador.
✅  ¿Cómo lo verifico?

 El CRUD de productos funciona correctamente desde el panel admin.
 El upload de imágenes usa presigned URLs: las credenciales de AWS no están en el frontend.
 El admin puede ver todas las órdenes, filtrarlas y cambiar su estado.
 Las rutas del panel admin son inaccesibles para usuarios con rol customer.
 Se puede explicar el flujo de presigned URLs y por qué es más seguro.
Etapa 7: Testing
Reducers, hooks, componentes y flujos de integración

¿Qué tener en cuenta?

Este proyecto tiene varios candidatos excelentes para testing: el reducer del carrito (pura función, muy fácil de testear), los custom hooks (useCart, useAuth), y los flujos de integración (agregar al carrito y hacer checkout). La pregunta que guía la estrategia de testing: ¿qué es lo que más le costaría romper a la aplicación?

Los tests de componentes que usan múltiples contextos requieren un wrapper de providers. Crear ese wrapper una sola vez y reutilizarlo en todos los tests es una práctica que simplifica mucho el código de testing. ¿Cómo se implementa ese wrapper con React Testing Library?

Los servicios externos (Firebase, AWS SDK) deben mockearse: los tests no deben depender de conexiones reales. Un test que falla porque la base de datos está caída no es un test confiable.

✅  ¿Cómo lo verifico?

 Los tests del reducer del carrito cubren cada acción (agregar, eliminar, actualizar, limpiar).
 Los tests de hooks usan renderHook de forma aislada.
 Firebase y AWS SDK están mockeados: los tests no hacen llamadas reales.
 Hay al menos un test de integración que simula un flujo completo de usuario.
 Todos los tests pasan de forma determinista con npm run test.
Etapa 8: Deploy y configuración en producción
Vercel, variables de entorno y verificación

¿Qué tener en cuenta?

El deploy no es el último paso del proyecto: es la validación final de que todo funciona junto en el entorno real. Conviene hacer un deploy temprano y verificar que las funcionalidades principales funcionan antes de construir las siguientes.

Las variables de entorno en Vercel tienen una convención importante: las del frontend deben empezar con VITE_ para ser accesibles desde el navegador. Las de las Vercel Functions no llevan ese prefijo. Confundir esas convenciones es uno de los errores más frecuentes en el deploy.

Antes de considerar el proyecto terminado, vale probar el flujo completo en producción con los dos roles: registro como customer, comprar un producto y ver la orden; y login como admin, crear un producto con imagen, cambiar el estado de una orden.

✅  ¿Cómo lo verifico?

 La aplicación está accesible desde una URL pública.
 Todos los flujos principales funcionan en producción (auth, catálogo, carrito, checkout, admin).
 Las variables de entorno están configuradas en Vercel, no en el código.
 No hay credenciales de Firebase ni AWS visibles en el frontend.
 La aplicación es usable en dispositivos móviles.
Etapa 9: Documentación y bitácora de uso de IA
README y reflexión sobre el proceso de desarrollo

¿Qué tener en cuenta?

La documentación de este proyecto tiene una exigencia especial: además del README técnico, se pide una bitácora de uso de IA con al menos 5 entradas. Esa bitácora no es un registro de prompts copiados: es evidencia de que la IA se usó para tomar decisiones, no solo para generar código. 

Las entradas de la bitácora que tienen más valor son las que muestran un proceso de decisión: se consultó a la IA sobre una opción de diseño, se entendieron las alternativas y se eligió una con criterio. Las que tienen menos valor son las que solo dicen “pedí el código y lo usé”. 

El README debe permitir que alguien instale y configure el proyecto desde cero: cómo obtener las credenciales de Firebase, cómo configurar el bucket de S3, cómo agregar las variables de entorno en Vercel. Incluir el flujo de presigned URLs es un requisito explícito.

¿Qué hace valiosa una entrada de la bitácora?

Muestra el prompt o la pregunta real que se le hizo a la IA.
Explica qué aprendió de la respuesta o cómo cambió la decisión técnica.
No es un resumen de lo que hizo la IA: es una reflexión de quien desarrolló el proyecto.
✅  ¿Cómo lo verifico?

 El README permite instalar y configurar el proyecto sin pedir ayuda.
 Está documentado el flujo de presigned URLs para uploads a S3.
 La bitácora tiene al menos 5 entradas con prompt, aprendizaje y decisión resultante.
 Las entradas de la bitácora muestran reflexión sobre las decisiones, no solo descripción.
Etapa 10: Presentación y defensa
Demo en vivo y explicación de decisiones técnicas

¿Qué tener en cuenta?

La presentación tiene componentes técnicos y de comunicación que se evalúan por separado. Para la parte técnica, la demo debe mostrar los dos roles funcionando: el flujo completo de compra como customer y la gestión del catálogo como admin.

Para la defensa, las preguntas suelen girar en torno a decisiones de arquitectura: ¿por qué Context API y useReducer en lugar de Zustand o Redux? ¿por qué presigned URLs y no subir la imagen desde el servidor? ¿por qué esta estructura de carpetas? No hay respuestas incorrectas si están bien justificadas. 

El uso de IA también puede aparecer en la defensa: ¿cómo se usó para tomar decisiones? ¿qué prompts fueron más útiles? ¿hay alguna decisión técnica que la IA ayudó a validar o cambiar? La bitácora es el insumo para responder esas preguntas.

¿Qué hace valiosa una entrada de la bitácora?

¿Por qué useReducer y no useState para el carrito?
¿Cómo funciona el flujo de presigned URLs y por qué las credenciales de AWS no deben estar en el frontend?
¿Cómo se implementa la protección de rutas por rol?
¿Qué son las reglas de seguridad de Firestore y por qué son necesarias aunque haya validación en el frontend?
✅  ¿Cómo lo verifico?

 Se puede hacer una demo fluida de los dos roles sin errores críticos.
 Se puede explicar la arquitectura del proyecto sin leer el código.
 Se pueden justificar al menos tres decisiones de diseño tomadas durante el proyecto.
 Se puede hablar sobre el uso de IA con ejemplos concretos de la bitácora.
 El entorno técnico para la presentación está probado y funciona correctamente.
Buenas prácticas recomendadas

Arquitectura y estado
Separar los contextos por responsabilidad: uno para autenticación, otro para el carrito.
El reducer del carrito debe ser una función pura: dado el mismo estado y la misma acción, siempre devuelve el mismo resultado.
Los componentes deben describir qué se muestra, no cómo se obtienen los datos.
Seguridad
Las credenciales de AWS solo en las Vercel Functions, nunca en el frontend.
Las reglas de Firestore deben validar roles del lado del servidor.
.env nunca se sube al repositorio bajo ninguna circunstancia.
Experiencia de usuario
Diseñar mobile-first: el layout móvil primero, luego adaptar para pantallas más grandes.
Cada operación asíncrona debe tener un estado de carga visible.
Los mensajes de error deben ser comprensibles para el usuario, no códigos técnicos.
Errores comunes a evitar

Mezclar la lógica del carrito y la autenticación en un mismo contexto.
Subir credenciales de AWS al repositorio, aunque sea en una rama o commit temporal.
No cubrir el estado intermedio de carga del rol de usuario, generando redireccionamientos prematuros.
Dejar las reglas de Firestore abiertas durante el desarrollo.
No probar la aplicación en producción con los dos roles antes de la presentación.
Escribir la bitácora de IA al final del proyecto en lugar de mantenerla durante el desarrollo.
No ensayar la demo antes de la presentación.
¿Qué se evalúa?

La evaluación tiene dos componentes: habilidades técnicas y habilidades de comunicación. Las dimensiones técnicas cubren la arquitectura, las funcionalidades, las integraciones, el testing y el uso de IA.

Hay créditos extras opcionales para quienes implementen un dashboard de analytics, paginación de productos o reviews y ratings.

Cierre

Esta guía está pensada para ayudarte a organizar tu desarrollo y tomar buenas decisiones técnicas.

El objetivo final es que puedas entender y defender lo que construyes.

🚀 Éxitos con el proyecto

