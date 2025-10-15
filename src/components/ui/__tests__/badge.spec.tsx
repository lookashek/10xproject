import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renderuje badge z tekstem", () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText("Test Badge")).toBeInTheDocument();
  });

  it("ma data-slot='badge'", () => {
    const { container } = render(<Badge>Test</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).toBeInTheDocument();
  });

  it("renderuje wariant default", () => {
    const { container } = render(<Badge variant="default">Default</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).toHaveClass("bg-primary");
  });

  it("renderuje wariant secondary", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).toHaveClass("bg-secondary");
  });

  it("renderuje wariant destructive", () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).toHaveClass("bg-destructive");
  });

  it("renderuje wariant outline", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).toHaveClass("text-foreground");
  });

  it("akceptuje custom className", () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).toHaveClass("custom-class");
  });

  it("renderuje jako span domyślnie", () => {
    const { container } = render(<Badge>Test</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toBeInTheDocument();
  });
});
