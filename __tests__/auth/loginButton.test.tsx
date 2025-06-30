import { render, screen } from "@testing-library/react";
import { LoginButton } from "@/components/auth/LoginButton";

// Mock the Privy React SDK
jest.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({ ready: true, authenticated: false }),
  useLogin: () => ({ login: jest.fn() }),
}));

describe("LoginButton", () => {
  it("renders login button when user is not authenticated", () => {
    render(<LoginButton />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });
});
