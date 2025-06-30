import { _createLogEntry } from "../src/lib/dev-logger";

describe("dev-logger", () => {
  it("should create a well-formed log entry", () => {
    const entry = _createLogEntry({
      level: "info",
      type: "component_render",
      component: "TestComponent",
      message: "render",
    });

    expect(entry).toMatchObject({
      level: "info",
      type: "component_render",
      component: "TestComponent",
      message: "render",
    });

    // ISO timestamp sanity check (length 24 with 'Z')
    expect(entry.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
