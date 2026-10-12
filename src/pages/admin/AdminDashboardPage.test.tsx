import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminAnalytics } from "../../services/analytics.service";
import { AdminDashboardPage } from "./AdminDashboardPage";

vi.mock("../../services/analytics.service", () => ({ getAdminAnalytics: vi.fn() }));

const metrics = {
  productCount: 20,
  completedOrderCount: 5,
  completedRevenue: 250,
  pendingOrderCount: 3,
  dailyRevenue: [
    { date: "2026-10-06", label: "mar", revenue: 0, orderCount: 0 },
    { date: "2026-10-07", label: "mié", revenue: 20, orderCount: 1 },
    { date: "2026-10-08", label: "jue", revenue: 30, orderCount: 1 },
    { date: "2026-10-09", label: "vie", revenue: 40, orderCount: 1 },
    { date: "2026-10-10", label: "sáb", revenue: 50, orderCount: 1 },
    { date: "2026-10-11", label: "dom", revenue: 60, orderCount: 1 },
    { date: "2026-10-12", label: "lun", revenue: 50, orderCount: 1 },
  ],
  topSellingProducts: [{ productId: "p1", name: "Botas Sierra", unitsSold: 7, revenue: 140 }],
};

function renderDashboard() {
  return render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
}

describe("AdminDashboardPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra métricas, el gráfico de ingresos y el ranking", async () => {
    vi.mocked(getAdminAnalytics).mockResolvedValue(metrics);
    renderDashboard();

    expect(await screen.findByText("Analytics de ventas")).toBeInTheDocument();
    expect(screen.getByText("$250")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /ingresos.*últimos siete días/i })).toBeInTheDocument();
    expect(screen.getByText("Botas Sierra")).toBeInTheDocument();
    expect(screen.getByText("7 u.")).toBeInTheDocument();
  });

  it("muestra estados vacíos cuando todavía no hay ingresos o productos vendidos", async () => {
    vi.mocked(getAdminAnalytics).mockResolvedValue({
      ...metrics,
      completedRevenue: 0,
      completedOrderCount: 0,
      topSellingProducts: [],
      dailyRevenue: metrics.dailyRevenue.map((point) => ({ ...point, revenue: 0, orderCount: 0 })),
    });
    renderDashboard();

    expect(await screen.findByText(/todavía no hay ingresos/i)).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay pedidos completados/i)).toBeInTheDocument();
  });

  it("muestra el error y permite reintentar la consulta", async () => {
    vi.mocked(getAdminAnalytics)
      .mockRejectedValueOnce(new Error("permission-denied"))
      .mockResolvedValueOnce(metrics);
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudimos cargar las métricas/i);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.getByText("Botas Sierra")).toBeInTheDocument());
    expect(getAdminAnalytics).toHaveBeenCalledTimes(2);
  });
});
