import dotenv from "dotenv";

// Load environment variables from .env.development.local
dotenv.config({ path: ".env.development.local" });

import { db } from "../db";
import { models } from "../db/schema";
import { fetchOpenRouterModels } from "../src/lib/openrouter";
import { eq } from "drizzle-orm";

/**
 * Sync OpenRouter models to our local SQLite database.
 * This script should be run periodically (e.g., daily) to keep our model data fresh.
 */
async function syncModels() {
  try {
    console.log("Fetching models from OpenRouter...");
    const openRouterModels = await fetchOpenRouterModels({ limit: 1000 });
    console.log(`Fetched ${openRouterModels.length} models from OpenRouter`);

    let successCount = 0;
    let errorCount = 0;

    // Process each model with retry logic
    for (const model of openRouterModels) {
      // Skip the auto-chooser model
      if (model.id === "openrouter/auto") {
        console.log("Skipping OpenRouter auto-chooser model");
        continue;
      }

      const now = new Date();
      const provider = model.id.split("/")[0];

      try {
        await retryWithBackoff(async () => {
          // Check if model already exists
          const existing = await db
            .select()
            .from(models)
            .where(eq(models.id, model.id))
            .then((rows) => rows[0]);

          // Extract data from new API structure
          const capabilities = model.capabilities ||
            model.architecture?.input_modalities || ["text"];
          const input_modalities = model.input_modalities ||
            model.architecture?.input_modalities || ["text"];
          const output_modalities = model.output_modalities ||
            model.architecture?.output_modalities || ["text"];
          const tokens_served = model.tokens_served || 0; // New API doesn't provide this
          const is_new = model.created > Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // New if created in last 30 days

          if (existing) {
            // Update existing model
            await db
              .update(models)
              .set({
                name: model.name,
                description: model.description,
                provider,
                tokens_served,
                is_new,
                capabilities,
                input_modalities,
                output_modalities,
                context_length: model.context_length,
                created: new Date(model.created * 1000), // Convert Unix timestamp to Date
                last_updated: now,
                raw_data: model,
              })
              .where(eq(models.id, model.id));
          } else {
            // Insert new model
            await db.insert(models).values({
              id: model.id,
              name: model.name,
              description: model.description,
              provider,
              tokens_served,
              is_new,
              capabilities,
              input_modalities,
              output_modalities,
              context_length: model.context_length,
              created: new Date(model.created * 1000), // Convert Unix timestamp to Date
              last_updated: now,
              raw_data: model,
            });
          }
        });

        successCount++;
        if (successCount % 50 === 0) {
          console.log(`Processed ${successCount} models...`);
        }
      } catch (error) {
        console.error(`Failed to sync model ${model.id}:`, error);
        errorCount++;

        // Continue with other models rather than failing completely
        if (errorCount > 10) {
          console.error("Too many errors, stopping sync");
          break;
        }
      }
    }

    console.log(`Successfully synced ${successCount} models to database`);
    if (errorCount > 0) {
      console.log(`Failed to sync ${errorCount} models due to errors`);
    }
  } catch (error) {
    console.error("Error syncing models:", error);
    process.exit(1);
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Retry logic failed");
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncModels().then(() => process.exit(0));
}

export { syncModels };
