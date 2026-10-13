import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("conserva la portada editorial y dirige el CTA al catálogo", () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1, name: /tradición que marca el presente/i })).toBeInTheDocument();
    expect(screen.getByText(/the countryside, reimagined/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explorar colección/i })).toHaveAttribute("href", "/products");
  });

  it("presenta los tres pilares de la marca y el acceso a la colección", () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Materiales nobles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inspiración ecuestre" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Campo y ciudad" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /explorá|explorar|colección/i }).length).toBeGreaterThanOrEqual(1);
  });
});
