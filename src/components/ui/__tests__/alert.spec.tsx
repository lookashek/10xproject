import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertTitle, AlertDescription } from "../alert";

describe("Alert", () => {
  it("renderuje Alert z tytułem i opisem", () => {
    render(
      <Alert>
        <AlertTitle>Tytuł alertu</AlertTitle>
        <AlertDescription>Opis alertu</AlertDescription>
      </Alert>
    );

    expect(screen.getByText("Tytuł alertu")).toBeInTheDocument();
    expect(screen.getByText("Opis alertu")).toBeInTheDocument();
  });

  it("ma role='alert'", () => {
    render(<Alert>Test</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("ma data-slot='alert'", () => {
    const { container } = render(<Alert>Test</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');
    expect(alert).toBeInTheDocument();
  });

  it("renderuje wariant default", () => {
    const { container } = render(<Alert variant="default">Default</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');
    expect(alert).toHaveClass("bg-card");
  });

  it("renderuje wariant destructive", () => {
    const { container } = render(<Alert variant="destructive">Destructive</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');
    expect(alert).toHaveClass("text-destructive");
  });

  it("AlertTitle ma data-slot='alert-title'", () => {
    const { container } = render(<AlertTitle>Test</AlertTitle>);
    const title = container.querySelector('[data-slot="alert-title"]');
    expect(title).toBeInTheDocument();
  });

  it("AlertDescription ma data-slot='alert-description'", () => {
    const { container } = render(<AlertDescription>Test</AlertDescription>);
    const desc = container.querySelector('[data-slot="alert-description"]');
    expect(desc).toBeInTheDocument();
  });

  it("akceptuje custom className", () => {
    const { container } = render(<Alert className="custom-class">Test</Alert>);
    const alert = container.querySelector('[data-slot="alert"]');
    expect(alert).toHaveClass("custom-class");
  });
});
