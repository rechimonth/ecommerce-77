import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import {
  getMyProductReview,
  getProductReviewSummary,
  listProductReviews,
  saveProductReview,
} from "../../services/reviews.service";
import { ProductReviews } from "./ProductReviews";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../services/reviews.service", () => ({
  getMyProductReview: vi.fn(),
  getProductReviewSummary: vi.fn(),
  listProductReviews: vi.fn(),
  saveProductReview: vi.fn(),
}));

const customer = { uid: "customer-1", email: "customer@example.test", displayName: "Cliente" };
const existingReview = {
  id: "customer-1",
  userId: "customer-1",
  rating: 4,
  comment: "Muy buena calidad",
  createdAt: new Date("2026-03-10T00:00:00.000Z"),
};

function renderReviews() {
  return render(<MemoryRouter><ProductReviews productId="p1" /></MemoryRouter>);
}

describe("ProductReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null } as never);
    vi.mocked(getProductReviewSummary).mockResolvedValue({ averageRating: 4.5, reviewCount: 2 });
    vi.mocked(listProductReviews).mockResolvedValue([]);
    vi.mocked(getMyProductReview).mockResolvedValue(null);
    vi.mocked(saveProductReview).mockResolvedValue(undefined);
  });

  it("muestra el estado vacío y el acceso a login para invitados", async () => {
    vi.mocked(getProductReviewSummary).mockResolvedValue({ averageRating: 0, reviewCount: 0 });
    renderReviews();

    expect(await screen.findByText(/todavía no hay opiniones/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("muestra promedio, fecha, comentario y la etiqueta de la opinión propia", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: customer } as never);
    vi.mocked(listProductReviews).mockResolvedValue([existingReview]);
    vi.mocked(getMyProductReview).mockResolvedValue(existingReview);
    renderReviews();

    expect(await screen.findAllByText("Muy buena calidad")).toHaveLength(2);
    expect(screen.getByLabelText("Comentario")).toHaveValue("Muy buena calidad");
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("Tu opinión")).toBeInTheDocument();
    expect(screen.getByText("10 mar 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Actualizar tu opinión" })).toBeInTheDocument();
  });

  it("guarda una nueva puntuación y comentario y vuelve a consultar las reseñas", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: customer } as never);
    renderReviews();

    await screen.findByRole("heading", { name: "Calificar este producto" });
    fireEvent.click(screen.getByRole("button", { name: "5 estrellas" }));
    fireEvent.change(screen.getByLabelText("Comentario"), { target: { value: "Muy buen producto" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar opinión" }));

    await waitFor(() => expect(saveProductReview).toHaveBeenCalledWith("p1", 5, "Muy buen producto"));
    expect(await screen.findByRole("status")).toHaveTextContent("Tu opinión quedó guardada.");
    expect(listProductReviews).toHaveBeenCalled();
  });

  it("rechaza comentarios demasiado cortos y bloquea envío sin puntuación", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: customer } as never);
    renderReviews();
    await screen.findByRole("heading", { name: "Calificar este producto" });

    const submit = screen.getByRole("button", { name: /seleccioná una puntuación/i });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "3 estrellas" }));
    fireEvent.change(screen.getByLabelText("Comentario"), { target: { value: "ab" } });
    expect(screen.getByRole("button", { name: "Guardar opinión" })).toBeDisabled();
    expect(saveProductReview).not.toHaveBeenCalled();
  });

  it("informa si falla la lectura de reseñas sin confundirlo con una lista vacía", async () => {
    vi.mocked(getProductReviewSummary).mockRejectedValue(new Error("permission-denied"));
    renderReviews();

    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudimos cargar las opiniones/i);
    expect(screen.getByText("Las opiniones no están disponibles temporalmente.")).toBeInTheDocument();
    expect(screen.queryByText(/sé la primera persona/i)).not.toBeInTheDocument();
  });
});
