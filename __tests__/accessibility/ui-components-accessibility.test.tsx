import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Ensure jest-axe uses a11y testing

describe("Accessibility – core UI components", () => {
  it("Button has no accessibility violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Badge has no accessibility violations", async () => {
    const { container } = render(<Badge>New</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
