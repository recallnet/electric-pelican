/**
 * @file Router AI model prompts for workflow analysis and decomposition.
 * @description Contains sophisticated prompts that guide AI models to analyze user prompts
 * and break them down into capability-tagged workflow steps.
 */

import { getTagLineage, getTagsByLevel } from "../tag-taxonomy";

/**
 * The model used for router analysis (Claude 3 Sonnet for best reasoning)
 */
export const ROUTER_MODEL = "anthropic/claude-3-sonnet";

/**
 * Generate the complete taxonomy section for the router prompt
 */
function generateTaxonomySection(): string {
  const leafTags = getTagsByLevel(3); // Get all L3 leaf tags

  // Group tags by their L1 pillar for better organization
  const tagsByPillar = new Map<
    string,
    Array<{ id: string; name: string; description: string; pillar: string; family: string }>
  >();

  leafTags.forEach((tag) => {
    const lineage = getTagLineage(tag.id);
    if (lineage.length >= 3) {
      const pillar = lineage[0];
      const family = lineage[1];

      if (pillar && family) {
        if (!tagsByPillar.has(pillar.id)) {
          tagsByPillar.set(pillar.id, []);
        }

        tagsByPillar.get(pillar.id)!.push({
          id: tag.id,
          name: tag.name,
          description: tag.description,
          pillar: pillar.name,
          family: family.name,
        });
      }
    }
  });

  let taxonomyText = "EXACT CAPABILITY TAG IDs (use these exact strings):\n\n";

  for (const [pillarId, tags] of tagsByPillar) {
    const pillarName = tags[0]?.pillar || pillarId;
    taxonomyText += `## ${pillarName}\n`;

    // Group by family within pillar
    const tagsByFamily = new Map<string, typeof tags>();
    tags.forEach((tag) => {
      if (!tagsByFamily.has(tag.family)) {
        tagsByFamily.set(tag.family, []);
      }
      tagsByFamily.get(tag.family)!.push(tag);
    });

    for (const [familyName, familyTags] of tagsByFamily) {
      taxonomyText += `### ${familyName}\n`;
      familyTags.forEach((tag) => {
        taxonomyText += `- "${tag.id}" (${tag.name}): ${tag.description}\n`;
      });
      taxonomyText += "\n";
    }
  }

  taxonomyText +=
    "\n⚠️  CRITICAL: Use the exact tag IDs in quotes above (e.g., 'creative-writing'), NOT the display names (e.g., 'Creative Writing').\n";

  return taxonomyText;
}

/**
 * Generate the main router analysis prompt
 */
export function generateRouterPrompt(userPrompt: string): string {
  const taxonomySection = generateTaxonomySection();

  return `You are an expert AI workflow analyzer. Your task is to break down user prompts into capability-tagged subtasks that can be optimally assigned to different AI models.

${taxonomySection}

ANALYSIS FRAMEWORK:

1. **Parse Intent**: Understand the user's core request and identify all sub-goals
2. **Decompose Tasks**: Break complex prompts into logical, sequential steps (1-8 steps maximum)
3. **Map Capabilities**: For each step, identify the PRIMARY capability tag from the exact IDs listed above
4. **Determine Dependencies**: Identify which steps depend on outputs from previous steps
5. **Estimate Complexity**: Assess token requirements and difficulty for each step
6. **Identify Dominant Capability**: Choose the single most important capability for single-model fallback

DECOMPOSITION RULES:

- Keep steps focused and atomic (each should test specific AI capabilities)
- Ensure dependencies are logical (step B needs output from step A)
- Estimate tokens realistically (50-2000 per step, based on expected output length)
- Choose capability tags that precisely match what the AI must excel at
- Consider what skills are truly required vs. what would just be helpful
- For simple prompts, often 1 step is sufficient
- For complex prompts, break into logical phases but stay under 8 steps

CAPABILITY SELECTION GUIDE:

- **What must the model understand?** (e.g., "scene-understanding", "semantic-understanding")
- **What must the model produce?** (e.g., "creative-writing", "algorithm-implementation", "structured-output")
- **What reasoning is required?** (e.g., "logical-reasoning", "causal-reasoning")
- **What knowledge is needed?** (e.g., "scientific-knowledge", "technical-specialization")

Be precise like a benchmark designer - focus on core capabilities being tested.

USER PROMPT: "${userPrompt}"

Analyze this prompt and return a JSON response with the following structure:

{
  "workflow": [
    {
      "description": "Clear description of what this step accomplishes",
      "capabilities": ["exact-tag-id-from-list-above"],
      "dependencies": ["step-id-1", "step-id-2"],
      "tokens": 150
    }
  ],
  "dominantCapability": "exact-tag-id-from-list-above",
  "complexity": "simple|moderate|complex"
}

CRITICAL REQUIREMENTS:
- Use ONLY the exact tag IDs from the list above (e.g., "creative-writing", not "Creative Writing")
- Each capability must be a single string from the taxonomy
- Ensure all dependency IDs reference valid previous steps
- Provide realistic token estimates
- Choose the dominant capability that best represents the overall task
- Complexity: simple (1-2 steps, <500 tokens), moderate (3-5 steps, 500-1500 tokens), complex (6-8 steps, >1500 tokens)

EXAMPLE GOOD RESPONSE:
{
  "workflow": [
    {
      "description": "Write a creative poem about the night sky",
      "capabilities": ["creative-writing"],
      "dependencies": [],
      "tokens": 300
    },
    {
      "description": "Create SVG code to visualize the poem's themes",
      "capabilities": ["algorithm-implementation"],
      "dependencies": ["step-1"],
      "tokens": 500
    }
  ],
  "dominantCapability": "creative-writing",
  "complexity": "moderate"
}

Return only the JSON response, no additional text.`;
}

/**
 * Generate a fallback prompt when the main router analysis fails
 */
export function generateFallbackPrompt(userPrompt: string): string {
  return `You are an AI assistant. The user has submitted the following request:

"${userPrompt}"

Please respond to this request directly using your general capabilities. Since the advanced workflow analysis is unavailable, provide a comprehensive response that addresses all aspects of the user's request to the best of your ability.

Focus on:
- Understanding the user's intent
- Providing a complete and helpful response
- Using clear, well-structured output
- Being thorough but concise

USER REQUEST: ${userPrompt}`;
}
