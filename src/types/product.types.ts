// Lo ideal sería tener una Colección de Categorías en Firestore:
export type CategoryId = "accessories" | "clothing" | "shoes";

// Representa un producto para el Front: tiene "id" y maneja fechas como "Date".
export type Product = {
  id: string;
  name: string;
  nameLower: string;
  image: string;
  description: string;
  price: number;
  stock: number;
  categoryId: CategoryId;
  createdAt?: Date;
  updatedAt?: Date;
};
