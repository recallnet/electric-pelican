/**
 * @file Judge response parsing utilities
 * @description Functions for parsing winner declarations from judge model responses
 */

/**
 * Parse winner from judge model response.
 * Looks for "WINNER: A" or "WINNER: B" pattern.
 */
export function parseWinner(judgeResponse: string): "A" | "B" | null {
  const winnerMatch = judgeResponse.match(/WINNER:\s*([AB])/i);
  if (!winnerMatch) return null;
  const letter = winnerMatch[1]?.toUpperCase();
  return (letter as "A" | "B") ?? null;
}

/**
 * Fallback winner selection when parsing fails
 */
export function selectFallbackWinner(
  judgeResponse: string,
  modelA: string,
  modelB: string,
): { winner: string; explanation: string } {
  // Fallback: if the response mentions one model more positively, pick that one
  const responseA_mentions = judgeResponse.toLowerCase().includes(modelA.toLowerCase());
  const responseB_mentions = judgeResponse.toLowerCase().includes(modelB.toLowerCase());

  if (responseA_mentions && !responseB_mentions) {
    console.log(`Fallback: choosing ${modelA} based on content analysis`);
    return {
      winner: modelA,
      explanation: judgeResponse + "\n\n[Winner determined by fallback analysis]",
    };
  } else if (responseB_mentions && !responseA_mentions) {
    console.log(`Fallback: choosing ${modelB} based on content analysis`);
    return {
      winner: modelB,
      explanation: judgeResponse + "\n\n[Winner determined by fallback analysis]",
    };
  } else {
    // Random fallback
    const randomWinner = Math.random() < 0.5 ? modelA : modelB;
    console.log(`Random fallback: choosing ${randomWinner}`);
    return {
      winner: randomWinner,
      explanation: judgeResponse + "\n\n[Winner determined randomly due to parsing failure]",
    };
  }
}
