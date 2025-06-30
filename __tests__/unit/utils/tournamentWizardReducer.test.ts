import { WizardState, reducer } from "@/contexts/TournamentWizardContext";

test("SET_PROMPT", () => {
  const state: WizardState = { models: [] };
  const next = reducer(state, { type: "SET_PROMPT", prompt: "Hello" });
  expect(next.prompt).toBe("Hello");
});

test("SET_MODELS", () => {
  const state: WizardState = { models: [] };
  const next = reducer(state, { type: "SET_MODELS", models: ["gpt-4"], bracketSize: 2 });
  expect(next.models).toEqual(["gpt-4"]);
  expect(next.bracketSize).toBe(2);
});

test("RESET", () => {
  const state: WizardState = { prompt: "x", models: ["a"], bracketSize: 2 };
  const next = reducer(state, { type: "RESET" });
  expect(next.models).toEqual([]);
  expect(next.prompt).toBeUndefined();
});
