import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renderiza un botón sólido con tipo y callback configurables", () => {
    const onClick = vi.fn();
    render(<Button variant="solid" type="submit" size="lg" fullWidth onClick={onClick}>Guardar</Button>);
    const button = screen.getByRole("button", { name: "Guardar" });

    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveClass("w-full", "px-6", "py-3");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("deshabilita y cambia el texto al guardar", () => {
    render(<Button variant="solid" loading>Crear</Button>);
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  });

  it("respeta la propiedad disabled", () => {
    render(<Button variant="solid" disabled>Confirmar</Button>);
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });

  it("renderiza la variante de enlace con destino y target", () => {
    render(<Button variant="link" href="/products" target="_blank">Ver catálogo</Button>);
    const link = screen.getByRole("link", { name: "Ver catálogo" });
    expect(link).toHaveAttribute("href", "/products");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
