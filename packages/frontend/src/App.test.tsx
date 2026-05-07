import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App shell", () => {
  it("renders the Phase 0 app shell", () => {
    render(<App />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personal Expense Tracker" })).toBeInTheDocument();
    expect(screen.getByText("Project foundation")).toBeInTheDocument();
  });

  it("shows a loading-capable main area", () => {
    render(<App isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard");
  });

  it("toggles dark theme class on the app root", async () => {
    const user = userEvent.setup();
    render(<App />);

    const root = screen.getByTestId("app-root");
    expect(root).not.toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(root).toHaveClass("dark");
  });
});
