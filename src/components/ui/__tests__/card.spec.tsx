import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card";

describe("Card", () => {
  it("renderuje Card z zawartością", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Tytuł karty</CardTitle>
          <CardDescription>Opis karty</CardDescription>
        </CardHeader>
        <CardContent>Treść karty</CardContent>
        <CardFooter>Stopka karty</CardFooter>
      </Card>
    );

    expect(screen.getByText("Tytuł karty")).toBeInTheDocument();
    expect(screen.getByText("Opis karty")).toBeInTheDocument();
    expect(screen.getByText("Treść karty")).toBeInTheDocument();
    expect(screen.getByText("Stopka karty")).toBeInTheDocument();
  });

  it("Card ma odpowiedni data-slot", () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });

  it("CardHeader ma odpowiedni data-slot", () => {
    const { container } = render(<CardHeader>Test</CardHeader>);
    const header = container.querySelector('[data-slot="card-header"]');
    expect(header).toBeInTheDocument();
  });

  it("CardTitle ma odpowiedni data-slot", () => {
    const { container } = render(<CardTitle>Test</CardTitle>);
    const title = container.querySelector('[data-slot="card-title"]');
    expect(title).toBeInTheDocument();
  });

  it("CardDescription ma odpowiedni data-slot", () => {
    const { container } = render(<CardDescription>Test</CardDescription>);
    const desc = container.querySelector('[data-slot="card-description"]');
    expect(desc).toBeInTheDocument();
  });

  it("CardContent ma odpowiedni data-slot", () => {
    const { container } = render(<CardContent>Test</CardContent>);
    const content = container.querySelector('[data-slot="card-content"]');
    expect(content).toBeInTheDocument();
  });

  it("CardFooter ma odpowiedni data-slot", () => {
    const { container } = render(<CardFooter>Test</CardFooter>);
    const footer = container.querySelector('[data-slot="card-footer"]');
    expect(footer).toBeInTheDocument();
  });

  it("Card akceptuje custom className", () => {
    const { container } = render(<Card className="custom-class">Test</Card>);
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass("custom-class");
  });
});

