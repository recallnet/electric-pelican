import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BracketSizeSelector } from "@/components/models";

describe("BracketSizeSelector", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders all bracket size options", () => {
    render(<BracketSizeSelector value={8} onChange={mockOnChange} />);

    expect(screen.getByRole("radio", { name: "4 model bracket" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "8 model bracket" })).toBeInTheDocument();
  });

  it("highlights the selected bracket size", () => {
    render(<BracketSizeSelector value={8} onChange={mockOnChange} />);

    const selected = screen.getByRole("radio", { name: "8 model bracket" });
    const notSelected = screen.getByRole("radio", { name: "4 model bracket" });

    expect(selected).toHaveAttribute("aria-checked", "true");
    expect(notSelected).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange when a different size is selected", () => {
    render(<BracketSizeSelector value={8} onChange={mockOnChange} />);

    fireEvent.click(screen.getByRole("radio", { name: "4 model bracket" }));

    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it("displays current selection in description", () => {
    render(<BracketSizeSelector value={4} onChange={mockOnChange} />);

    expect(
      screen.getByText("Selected: 4 models will compete in the evaluation"),
    ).toBeInTheDocument();
  });

  it("has proper ARIA attributes for screen readers", () => {
    render(<BracketSizeSelector value={8} onChange={mockOnChange} />);

    const radioGroup = screen.getByRole("radiogroup");
    expect(radioGroup).toHaveAttribute("aria-label", "Select evaluation bracket size");

    const legend = screen.getByText("Evaluation Bracket Size");
    expect(legend.tagName).toBe("LEGEND");
  });

  it("applies custom className", () => {
    const { container } = render(
      <BracketSizeSelector value={8} onChange={mockOnChange} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
