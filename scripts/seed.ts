import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Lo ideal sería tener una Colección de Categorías en Firestore:
type CategoryId = "accessories" | "clothing" | "shoes";

type SeedProduct = {
  name: string;
  categoryId: CategoryId;
  price: number;
  stock: number;
  description: string;
};

// El seeder usa el SDK Admin fuera del navegador; nunca habilites escrituras públicas
// en Firestore solo para poder cargar el catálogo.
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env");
}
const app = getApps().length ? getApps()[0]! : initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
  projectId,
});
const db = getFirestore(app);

// Colección de moda de campo / alta costura rural (20 productos).
const CATALOG: SeedProduct[] = [
  // ----- Ropa -----
  {
    name: "Chaqueta Encerada Highland",
    categoryId: "clothing",
    price: 489,
    stock: 12,
    description:
      "Chaqueta de algodón encerado con cuello de pana, bolsillos de fuelle y forro de cuadros. Resiste la lluvia y mejora con el uso.",
  },
  {
    name: "Chaqueta de Tweed Cotswold",
    categoryId: "clothing",
    price: 559,
    stock: 8,
    description:
      "Tweed de lana tejido en telar con coderas de ante. Corte estructurado inspirado en la cacería inglesa.",
  },
  {
    name: "Chaleco Acolchado Hunter",
    categoryId: "clothing",
    price: 289,
    stock: 20,
    description:
      "Chaleco acolchado con relleno ligero y cierre de presión de latón. Ideal para capas en media estación.",
  },
  {
    name: "Abrigo Largo de Lana Heritage",
    categoryId: "clothing",
    price: 749,
    stock: 6,
    description:
      "Abrigo de lana virgen con solapa ancha y botonadura doble. Silueta alargada de pasarela, pensada para el campo y la ciudad.",
  },
  {
    name: "Camisa Tattersall de Franela",
    categoryId: "clothing",
    price: 169,
    stock: 25,
    description:
      "Franela cepillada con el clásico estampado tattersall. Cuello abotonado y puños redondeados.",
  },
  {
    name: "Pantalón de Pana Wide-Leg Meadow",
    categoryId: "clothing",
    price: 219,
    stock: 18,
    description:
      "Pana de trama ancha con pierna amplia y tiro alto. Cintura con pinzas y bolsillos al bies.",
  },
  {
    name: "Blazer de Tweed Estate",
    categoryId: "clothing",
    price: 629,
    stock: 7,
    description:
      "Blazer entallado con forro de seda y botones de asta. Pieza central de un look de campo sofisticado.",
  },
  {
    name: "Vestido Camisero de Lino Prairie",
    categoryId: "clothing",
    price: 359,
    stock: 14,
    description:
      "Vestido midi de lino lavado con cinturón anudado y mangas voluminosas. Caída fluida y aire de pradera.",
  },
  {
    name: "Suéter Aran Artesanal Fisherman",
    categoryId: "clothing",
    price: 329,
    stock: 15,
    description:
      "Punto trenzado aran en lana merino, con cuello alto y detalle de trenzas en relieve. Tejido por artesanos.",
  },
  {
    name: "Falda Midi de Cuadros Glen Check",
    categoryId: "clothing",
    price: 249,
    stock: 16,
    description:
      "Falda midi de lana con estampado glen check, abertura lateral y cintura alta.",
  },
  // ----- Calzado -----
  {
    name: "Botas Chelsea de Ante Pasture",
    categoryId: "shoes",
    price: 395,
    stock: 10,
    description:
      "Botines Chelsea de ante con elásticos laterales y suela de goma de tracción. Cómodas desde el primer día.",
  },
  {
    name: "Botas de Montar Cuero Equestrian",
    categoryId: "shoes",
    price: 685,
    stock: 5,
    description:
      "Botas altas de cuero de ternera hechas a mano, con costuras reforzadas y caña ajustable.",
  },
  {
    name: "Botas Camperas Sierra",
    categoryId: "shoes",
    price: 520,
    stock: 9,
    description:
      "Botas camperas de cuero grabado con tacón cubano y punta redondeada. Reinterpretación de alta moda del western.",
  },
  {
    name: "Botines de Cuero Trenzado Dehesa",
    categoryId: "shoes",
    price: 340,
    stock: 11,
    description:
      "Botines de cuero con detalle trenzado a mano y cierre con cordones encerados.",
  },
  // ----- Accesorios -----
  {
    name: "Sombrero Fedora de Fieltro Ranch",
    categoryId: "accessories",
    price: 185,
    stock: 22,
    description:
      "Sombrero de fieltro de lana con cinta de grosgrain y ala moldeable.",
  },
  {
    name: "Cinturón de Cuero Bridle",
    categoryId: "accessories",
    price: 139,
    stock: 30,
    description:
      "Cinturón de cuero curtido al vegetal con hebilla de latón envejecido. Inspirado en los arreos de montar.",
  },
  {
    name: "Bolso Tote de Lona Encerada Shepherd",
    categoryId: "accessories",
    price: 275,
    stock: 13,
    description:
      "Tote amplio de lona encerada con asas de cuero y bolsillo interior con cremallera.",
  },
  {
    name: "Pañuelo de Seda Estampado Horse",
    categoryId: "accessories",
    price: 119,
    stock: 28,
    description:
      "Pañuelo de seda con estampado ecuestre y bordes enrollados a mano.",
  },
  {
    name: "Guantes de Cuero Forrados de Cashmere",
    categoryId: "accessories",
    price: 165,
    stock: 17,
    description:
      "Guantes de cuero de cordero con forro de cashmere y costuras a la vista.",
  },
  {
    name: "Gorra Plana Flat Cap de Tweed",
    categoryId: "accessories",
    price: 95,
    stock: 24,
    description:
      "Gorra plana de tweed de lana con visera estructurada y forro de algodón.",
  },
];

// "Chaqueta Encerada Highland" -> "chaqueta-encerada-highland"
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  console.log(`🌱 Sembrando ${CATALOG.length} productos...\n`);

  for (const item of CATALOG) {
    const id = slugify(item.name);
    // ID determinístico: volver a ejecutar el seed actualiza, no duplica.
    await db.collection("products").doc(id).set({
      ...item,
      nameLower: item.name.toLowerCase(),
      image: `https://picsum.photos/seed/${id}/600/800`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`✔ ${item.name}`);
  }

  console.log(`\n✅ ${CATALOG.length} productos creados correctamente.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error al ejecutar el seeder:");
  console.error(error);
  process.exit(1);
});
