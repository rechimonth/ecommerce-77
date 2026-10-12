import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveProductImage } from "../../services/upload.service";
import { ProductImage } from "./ProductImage";

vi.mock("../../services/upload.service", () => ({
  resolveProductImage: vi.fn(),
}));

describe("ProductImage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("muestra directamente una URL externa sin pedir una URL de S3", () => {
    render(<ProductImage source="https://example.test/item.jpg" alt="Producto" className="product-photo" />);
    expect(screen.getByRole("img", { name: "Producto" })).toHaveAttribute("src", "https://example.test/item.jpg");
    expect(screen.getByRole("img")).toHaveClass("product-photo");
    expect(resolveProductImage).not.toHaveBeenCalled();
  });

  it("resuelve una clave privada S3 a una URL temporal", async () => {
    vi.mocked(resolveProductImage).mockResolvedValue("https://signed.example.test/item.jpg");
    render(<ProductImage source="s3://products/item.jpg" alt="Abrigo" />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Abrigo" })).toHaveAttribute("src", "https://signed.example.test/item.jpg");
    });
    expect(resolveProductImage).toHaveBeenCalledWith("s3://products/item.jpg");
  });

  it("muestra un placeholder accesible mientras se resuelve S3", () => {
    vi.mocked(resolveProductImage).mockReturnValue(new Promise(() => undefined));
    render(<ProductImage source="s3://products/pending.jpg" alt="Pendiente" className="photo" />);
    expect(screen.getByLabelText("Pendiente")).toHaveClass("photo");
  });

  it("muestra una alternativa si falla la resolución de S3", async () => {
    vi.mocked(resolveProductImage).mockRejectedValue(new Error("network"));
    render(<ProductImage source="s3://products/broken.jpg" alt="Imagen rota" />);

    expect(await screen.findByText("Imagen no disponible")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Imagen rota" })).toBeInTheDocument();
  });

  it("reemplaza una imagen externa que dispara error por el estado alternativo", () => {
    render(<ProductImage source="https://example.test/broken.jpg" alt="Foto fallida" />);
    fireEvent.error(screen.getByRole("img", { name: "Foto fallida" }));

    expect(screen.getByText("Imagen no disponible")).toBeInTheDocument();
  });

  it("no actualiza el estado después de desmontarse una resolución pendiente", async () => {
    let resolve!: (value: string) => void;
    vi.mocked(resolveProductImage).mockReturnValue(new Promise((done) => { resolve = done; }));
    const { unmount } = render(<ProductImage source="s3://products/unmount.jpg" alt="Desmontada" />);
    unmount();
    resolve("https://signed.example.test/unmount.jpg");
    await Promise.resolve();
    expect(resolveProductImage).toHaveBeenCalledTimes(1);
  });
});
