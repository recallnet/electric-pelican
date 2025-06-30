/**
 * @file Execution context management for Router-3A
 * @description Manages context passing and state between workflow steps
 */

import type { ExecutionContext, OptimizedWorkflowStep, StepResult } from "@/types/router";

/**
 * Implementation of ExecutionContext interface
 */
export class WorkflowExecutionContext implements ExecutionContext {
  public executionId: string;
  public originalPrompt: string;
  public stepResults: Map<string, StepResult>;
  public globalContext: string;

  constructor(executionId: string, originalPrompt: string) {
    this.executionId = executionId;
    this.originalPrompt = originalPrompt;
    this.stepResults = new Map();
    this.globalContext = "";
  }

  /**
   * Add a step result to the context
   */
  addResult(stepId: string, result: StepResult): void {
    this.stepResults.set(stepId, result);

    // Update global context with key insights
    this.updateGlobalContext(result);
  }

  /**
   * Get context for a specific step
   */
  getContext(stepId: string): string {
    const step = this.findStepById(stepId);
    if (!step) {
      return this.originalPrompt;
    }

    return this.buildStepContext(step);
  }

  /**
   * Build a prompt for a specific step
   */
  buildPrompt(step: OptimizedWorkflowStep): string {
    const dependentResults = this.getDependentResults(step.dependencies);

    if (dependentResults.length === 0) {
      // First step or independent step
      return this.buildInitialPrompt(step);
    }

    return this.buildDependentPrompt(step, dependentResults);
  }

  /**
   * Get all intermediate results
   */
  getIntermediateResults(): StepResult[] {
    return Array.from(this.stepResults.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Build context for a step based on its dependencies
   */
  private buildStepContext(step: OptimizedWorkflowStep): string {
    const dependentResults = this.getDependentResults(step.dependencies);

    let context = `Original Request: ${this.originalPrompt}\n\n`;

    if (this.globalContext) {
      context += `Context Summary: ${this.globalContext}\n\n`;
    }

    if (dependentResults.length > 0) {
      context += `Previous Results:\n`;
      dependentResults.forEach((result, index) => {
        context += `${index + 1}. ${result.stepDescription}:\n${result.content}\n\n`;
      });
    }

    context += `Your Task: ${step.description}\n`;
    context += `Required Capabilities: ${step.requiredCapabilities.join(", ")}\n`;

    return context.trim();
  }

  /**
   * Build prompt for initial/independent steps
   */
  private buildInitialPrompt(step: OptimizedWorkflowStep): string {
    return `
You are an AI assistant specialized in ${step.requiredCapabilities.join(", ")}.

User Request: ${this.originalPrompt}

Your specific task: ${step.description}

Please provide a comprehensive response that addresses this specific aspect of the user's request.
    `.trim();
  }

  /**
   * Build prompt for dependent steps
   */
  private buildDependentPrompt(
    step: OptimizedWorkflowStep,
    dependentResults: StepResult[],
  ): string {
    let prompt = `
You are an AI assistant specialized in ${step.requiredCapabilities.join(", ")}.

Original User Request: ${this.originalPrompt}

Previous work has been completed:
`;

    dependentResults.forEach((result, index) => {
      prompt += `\n${index + 1}. ${result.stepDescription}:\n${result.content}\n`;
    });

    prompt += `\nYour specific task: ${step.description}

Please build upon the previous work and provide a comprehensive response for your part of the workflow.`;

    // Add context optimization for long results
    if (prompt.length > 8000) {
      prompt = this.optimizeContextLength(prompt, step);
    }

    return prompt.trim();
  }

  /**
   * Get results for dependent steps
   */
  private getDependentResults(dependencies: string[]): StepResult[] {
    return dependencies
      .map((depId) => this.stepResults.get(depId))
      .filter((result): result is StepResult => result !== undefined)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Update global context with key insights from completed steps
   */
  private updateGlobalContext(result: StepResult): void {
    // Extract key insights for context (simplified implementation)
    const insights = this.extractKeyInsights(result.content);

    if (insights) {
      if (this.globalContext) {
        this.globalContext += ` | ${insights}`;
      } else {
        this.globalContext = insights;
      }
    }

    // Keep global context manageable
    if (this.globalContext.length > 500) {
      this.globalContext = this.globalContext.substring(0, 500) + "...";
    }
  }

  /**
   * Extract key insights from step content (simplified)
   */
  private extractKeyInsights(content: string): string {
    // Simple heuristic: take first sentence or first 100 characters
    const firstSentence = content.split(".")[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence.trim();
    }

    return content.substring(0, 100).trim() + "...";
  }

  /**
   * Optimize context length when it gets too long
   */
  private optimizeContextLength(prompt: string, _step: OptimizedWorkflowStep): string {
    // Strategy: Keep original request, summarize previous results, keep current task
    const lines = prompt.split("\n");
    const originalRequestIndex = lines.findIndex((line) => line.includes("Original User Request:"));
    const taskIndex = lines.findIndex((line) => line.includes("Your specific task:"));

    if (originalRequestIndex === -1 || taskIndex === -1) {
      // Fallback: truncate from middle
      return (
        prompt.substring(0, 4000) +
        "\n\n[... content summarized ...]\n\n" +
        prompt.substring(prompt.length - 2000)
      );
    }

    // Keep original request and current task, summarize middle
    const beforeTask = lines.slice(0, originalRequestIndex + 2).join("\n");
    const afterTask = lines.slice(taskIndex).join("\n");

    return `${beforeTask}\n\n[Previous results summarized for context]\n\n${afterTask}`;
  }

  /**
   * Find step by ID (helper method)
   */
  private findStepById(_stepId: string): OptimizedWorkflowStep | null {
    // This would need access to the workflow steps
    // For now, return null - this will be handled by the caller
    return null;
  }
}

/**
 * Create a new execution context
 */
export function createExecutionContext(
  executionId: string,
  originalPrompt: string,
): ExecutionContext {
  return new WorkflowExecutionContext(executionId, originalPrompt);
}

/**
 * Validate context size and optimize if needed
 */
export function validateContextSize(context: string, maxSize: number = 8000): string {
  if (context.length <= maxSize) {
    return context;
  }

  // Simple truncation strategy
  const halfSize = Math.floor(maxSize / 2);
  return (
    context.substring(0, halfSize) +
    "\n\n[... content truncated for length ...]\n\n" +
    context.substring(context.length - halfSize)
  );
}

/**
 * Build context summary for multiple steps
 */
export function buildContextSummary(results: StepResult[]): string {
  if (results.length === 0) {
    return "";
  }

  if (results.length === 1) {
    return `Previous step: ${results[0]!.stepDescription} - ${results[0]!.content.substring(0, 200)}...`;
  }

  let summary = "Previous steps:\n";
  results.forEach((result, index) => {
    const contentPreview = result.content.substring(0, 100);
    summary += `${index + 1}. ${result.stepDescription}: ${contentPreview}...\n`;
  });

  return summary.trim();
}

/**
 * Calculate context statistics
 */
export function calculateContextStats(context: string): {
  characterCount: number;
  estimatedTokens: number;
  lineCount: number;
} {
  return {
    characterCount: context.length,
    estimatedTokens: Math.ceil(context.length / 4), // Rough estimate
    lineCount: context.split("\n").length,
  };
}
