import { calculateExpectedScore, calculateNewEloRating } from "@/lib/elo";

describe("ELO Calculation Functions", () => {
  describe("calculateExpectedScore", () => {
    it("should calculate expected score correctly for equal ratings", () => {
      const expected = calculateExpectedScore(1200, 1200);
      expect(expected).toBe(0.5);
    });

    it("should calculate expected score correctly for higher rated player", () => {
      const expected = calculateExpectedScore(1400, 1200);
      expect(expected).toBeGreaterThan(0.5);
      expect(expected).toBeCloseTo(0.76, 1);
    });

    it("should calculate expected score correctly for lower rated player", () => {
      const expected = calculateExpectedScore(1200, 1400);
      expect(expected).toBeLessThan(0.5);
      expect(expected).toBeCloseTo(0.24, 1);
    });

    it("should handle extreme rating differences", () => {
      const expected = calculateExpectedScore(800, 1600);
      expect(expected).toBeCloseTo(0.009, 2);
    });

    it("should handle very large rating differences", () => {
      const expected = calculateExpectedScore(400, 2000);
      expect(expected).toBeCloseTo(0.0001, 3);
    });
  });

  describe("calculateNewEloRating", () => {
    it("should increase rating when lower rated player wins", () => {
      const newRating = calculateNewEloRating(1200, 1400, 1); // Win
      expect(newRating).toBeGreaterThan(1200);
      expect(newRating).toBe(1224); // 1200 + 32 * (1 - 0.24)
    });

    it("should decrease rating when higher rated player loses", () => {
      const newRating = calculateNewEloRating(1400, 1200, 0); // Loss
      expect(newRating).toBeLessThan(1400);
      expect(newRating).toBe(1376); // 1400 + 32 * (0 - 0.76)
    });

    it("should have minimal change when expected result occurs", () => {
      const newRating = calculateNewEloRating(1400, 1200, 1); // Higher rated wins
      expect(newRating).toBe(1408); // Small increase
    });

    it("should handle draws correctly", () => {
      const newRating = calculateNewEloRating(1200, 1200, 0.5); // Draw
      expect(newRating).toBe(1200); // No change for equal ratings
    });

    it("should handle very large rating differences", () => {
      const newRating = calculateNewEloRating(800, 2000, 1);
      expect(newRating).toBeGreaterThan(800);
      expect(newRating).toBeLessThan(850); // Should be close to max possible gain
    });

    it("should handle minimum scores gracefully", () => {
      const newRating = calculateNewEloRating(0, 1200, 0);
      expect(newRating).toBeGreaterThanOrEqual(0);
      expect(newRating).toBeLessThan(50); // Should be a small loss
    });

    it("should handle very high scores", () => {
      const newRating = calculateNewEloRating(3000, 1200, 1);
      expect(newRating).toBeGreaterThanOrEqual(3000);
      expect(newRating).toBeLessThan(3010); // Minimal gain for expected win
    });

    it("should be symmetric for equal rating matches", () => {
      const winnerRating = calculateNewEloRating(1200, 1200, 1);
      const loserRating = calculateNewEloRating(1200, 1200, 0);

      expect(winnerRating - 1200).toBe(-(loserRating - 1200));
      expect(winnerRating + loserRating).toBe(2400); // Total rating preserved
    });

    it("should handle upset victories correctly", () => {
      // Weak player (1000) beats strong player (1600)
      const weakPlayerNewRating = calculateNewEloRating(1000, 1600, 1);
      const strongPlayerNewRating = calculateNewEloRating(1600, 1000, 0);

      // Weak player should gain significantly more than strong player loses
      expect(weakPlayerNewRating - 1000).toBeGreaterThan(25);
      expect(1600 - strongPlayerNewRating).toBeGreaterThan(25);

      // But the changes should be roughly equal in magnitude
      const weakGain = weakPlayerNewRating - 1000;
      const strongLoss = 1600 - strongPlayerNewRating;
      expect(Math.abs(weakGain - strongLoss)).toBeLessThan(2);
    });

    it("should have consistent K-factor behavior", () => {
      // Test that the K-factor (32) is applied correctly
      const rating1 = calculateNewEloRating(1200, 1200, 1);
      const rating2 = calculateNewEloRating(1200, 1200, 0);

      // For equal ratings, winner gains 16, loser loses 16 (K/2)
      expect(rating1).toBe(1216);
      expect(rating2).toBe(1184);
    });
  });

  describe("ELO Algorithm Properties", () => {
    it("should maintain rating conservation in equal matches", () => {
      const initialTotal = 1200 + 1200;
      const winnerRating = calculateNewEloRating(1200, 1200, 1);
      const loserRating = calculateNewEloRating(1200, 1200, 0);
      const finalTotal = winnerRating + loserRating;

      expect(finalTotal).toBe(initialTotal);
    });

    it("should have diminishing returns for extreme ratings", () => {
      // Very high rated player beating very low rated player should gain minimal points
      const highVsLowGain = calculateNewEloRating(2000, 800, 1) - 2000;
      expect(highVsLowGain).toBeLessThan(5);

      // Very low rated player losing to very high rated player should lose minimal points
      const lowVsHighLoss = 800 - calculateNewEloRating(800, 2000, 0);
      expect(lowVsHighLoss).toBeLessThan(5);
    });

    it("should have maximum possible rating changes", () => {
      // Maximum gain occurs when 0-rated player beats infinitely rated player
      // This should approach K-factor (32)
      const maxGain = calculateNewEloRating(0, 3000, 1) - 0;
      expect(maxGain).toBeCloseTo(32, 0);

      // Maximum loss occurs when infinitely rated player loses to 0-rated player
      const maxLoss = 3000 - calculateNewEloRating(3000, 0, 0);
      expect(maxLoss).toBeCloseTo(32, 0);
    });
  });
});
