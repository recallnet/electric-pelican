/**
 * @file Model executor for Router-3A
 * @description Handles actual AI model calls and integrates with OpenRouter system
 */

import { callOpenRouter } from "@/lib/openrouter-client";
import type {
  ExecutionOptions,
  ModelCallOptions,
  ModelExecutor,
  ModelInfo,
  ModelResponse,
  OptimizedWorkflowStep,
  StepResult,
} from "@/types/router";

/**
 * Implementation of ModelExecutor interface
 */
export class OpenRouterModelExecutor implements ModelExecutor {
  /**
   * Execute a workflow step with the assigned model
   */
  async executeStep(
    step: OptimizedWorkflowStep,
    context: string,
    options: ExecutionOptions,
  ): Promise<StepResult> {
    const startTime = Date.now();

    try {
      const modelOptions: ModelCallOptions = {
        temperature: 0.7,
        maxTokens: 10000,
        topP: 0.9,
        timeout: options.timeout || 30000,
        retries: options.maxRetries || 3,
      };

      // Call the model
      const response = await this.callModel(step.selectedModel.modelId, context, modelOptions);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Calculate cost
      const cost = await this.calculateCost(step.selectedModel.modelId, response.tokensUsed);

      return {
        stepId: step.id,
        stepDescription: step.description,
        content: response.content,
        modelUsed: step.selectedModel.modelId,
        tokensUsed: response.tokensUsed,
        cost,
        duration,
        attempt: 1, // Will be updated by retry logic
        success: true,
        ...(options.includeIntermediateResults && { context }),
        timestamp: endTime,
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        stepId: step.id,
        stepDescription: step.description,
        content: "",
        modelUsed: step.selectedModel.modelId,
        tokensUsed: 0,
        cost: 0,
        duration,
        attempt: 1,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ...(options.includeIntermediateResults && { context }),
        timestamp: endTime,
      };
    }
  }

  /**
   * Get information about a model
   */
  async getModelInfo(modelId: string): Promise<ModelInfo> {
    try {
      // In a real implementation, this would query the models API
      // For now, we'll use pattern-based estimation
      return {
        modelId,
        modelName: this.formatModelName(modelId),
        provider: this.extractProvider(modelId),
        available: true, // Assume available unless we know otherwise
        contextLimit: this.estimateContextLimit(modelId),
        costPer1kTokens: this.estimateCost(modelId),
        averageLatency: this.estimateLatency(modelId),
      };
    } catch (error) {
      throw new Error(`Failed to get model info for ${modelId}: ${error}`);
    }
  }

  /**
   * Check if a model is available
   */
  async checkAvailability(modelId: string): Promise<boolean> {
    try {
      // Simple availability check - try a minimal call
      await this.callModel(modelId, "Hello", { maxTokens: 1, timeout: 5000 });
      return true;
    } catch (error) {
      console.warn(`Model ${modelId} availability check failed:`, error);
      return false;
    }
  }

  /**
   * Call a model through OpenRouter
   */
  private async callModel(
    modelId: string,
    prompt: string,
    options: ModelCallOptions,
  ): Promise<ModelResponse> {
    try {
      const response = await callOpenRouter({
        model: modelId,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      });

      // Extract content from response
      const content = response.choices?.[0]?.message?.content || "";

      const modelResponse: ModelResponse = {
        content,
        tokensUsed: response.usage?.total_tokens || this.estimateTokens(content),
        finishReason: response.choices?.[0]?.finish_reason || "stop",
        model: response.model || modelId,
      };

      if (response.usage) {
        modelResponse.usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }

      return modelResponse;
    } catch (error) {
      throw new Error(`Model call failed for ${modelId}: ${error}`);
    }
  }

  /**
   * Calculate cost for model usage
   */
  private async calculateCost(modelId: string, tokensUsed: number): Promise<number> {
    const costPer1k = this.estimateCost(modelId);
    return (tokensUsed / 1000) * costPer1k;
  }

  /**
   * Estimate cost based on model patterns
   */
  private estimateCost(modelId: string): number {
    // Based on typical pricing patterns as of 2024
    if (modelId.includes("claude-3-opus")) return 0.015;
    if (modelId.includes("claude-3-sonnet")) return 0.003;
    if (modelId.includes("claude-3-haiku")) return 0.00025;
    if (modelId.includes("gpt-4-turbo")) return 0.01;
    if (modelId.includes("gpt-4o")) return 0.005;
    if (modelId.includes("gpt-4")) return 0.03;
    if (modelId.includes("gpt-3.5")) return 0.0005;
    if (modelId.includes("gemini-pro")) return 0.00025;
    if (modelId.includes("llama")) return 0.0002;

    // Conservative default
    return 0.001;
  }

  /**
   * Estimate latency based on model patterns
   */
  private estimateLatency(modelId: string): number {
    // Based on typical performance patterns
    if (modelId.includes("haiku")) return 800; // Fast models
    if (modelId.includes("gpt-4o")) return 1200; // Optimized models
    if (modelId.includes("gpt-3.5")) return 1000; // Fast models
    if (modelId.includes("claude-3-sonnet")) return 1800; // Balanced models
    if (modelId.includes("gpt-4")) return 2500; // Slower but high-quality
    if (modelId.includes("opus")) return 3000; // Highest quality, slower

    // Conservative default
    return 2000;
  }

  /**
   * Estimate context limit based on model patterns
   */
  private estimateContextLimit(modelId: string): number {
    if (modelId.includes("claude-3")) return 200000;
    if (modelId.includes("gpt-4")) return 128000;
    if (modelId.includes("gpt-3.5")) return 16000;
    if (modelId.includes("gemini")) return 32000;

    // Conservative default
    return 32000;
  }

  /**
   * Extract provider from model ID
   */
  private extractProvider(modelId: string): string {
    if (modelId.includes("claude")) return "Anthropic";
    if (modelId.includes("gpt")) return "OpenAI";
    if (modelId.includes("gemini")) return "Google";
    if (modelId.includes("llama")) return "Meta";
    if (modelId.includes("mistral")) return "Mistral AI";
    return "Unknown";
  }

  /**
   * Format model name for display
   */
  private formatModelName(modelId: string): string {
    const nameMap: Record<string, string> = {
      "claude-3-sonnet": "Claude 3 Sonnet",
      "claude-3-haiku": "Claude 3 Haiku",
      "claude-3-opus": "Claude 3 Opus",
      "gpt-4": "GPT-4",
      "gpt-4o": "GPT-4o",
      "gpt-4-turbo": "GPT-4 Turbo",
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
    };

    return nameMap[modelId] || modelId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Estimate tokens from content (rough approximation)
   */
  private estimateTokens(content: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(content.length / 4);
  }
}

/**
 * Create a model executor instance
 */
export function createModelExecutor(): ModelExecutor {
  return new OpenRouterModelExecutor();
}

/**
 * Validate model response
 */
export function validateModelResponse(response: ModelResponse): boolean {
  return !!(
    response.content &&
    typeof response.content === "string" &&
    response.content.trim().length > 0 &&
    response.tokensUsed > 0
  );
}

/**
 * Sanitize model response content
 */
export function sanitizeModelResponse(content: string): string {
  // Remove any potential harmful content or formatting issues
  return content
    .trim()
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n"); // Limit consecutive newlines
}

/**
 * Calculate model performance score
 */
export function calculateModelPerformance(result: StepResult, expectedDuration: number): number {
  if (!result.success) return 0;

  // Score based on success, speed, and content quality
  const speedScore = Math.max(0, 1 - result.duration / expectedDuration);
  const contentScore = Math.min(1, result.content.length / 100); // Basic content quality

  return speedScore * 0.3 + contentScore * 0.7;
}
