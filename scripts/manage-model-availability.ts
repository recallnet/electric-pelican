/**
 * Admin script for managing model availability.
 *
 * Usage:
 *   pnpm tsx scripts/manage-model-availability.ts --list
 *   pnpm tsx scripts/manage-model-availability.ts --stats
 *   pnpm tsx scripts/manage-model-availability.ts --restore <model-id> [reason]
 *   pnpm tsx scripts/manage-model-availability.ts --restore-all [reason]
 */

import { db } from "../db";
import { models } from "../db/schema";
import { eq } from "drizzle-orm";

// Import functions directly to avoid module resolution issues
async function getUnavailableModels(): Promise<
  Array<{
    id: string;
    name: string;
    provider: string;
    failure_count: number;
    last_failure_at: Date | null;
    unavailable_reason: string | null;
    marked_unavailable_at: Date | null;
  }>
> {
  try {
    return await db
      .select({
        id: models.id,
        name: models.name,
        provider: models.provider,
        failure_count: models.failure_count,
        last_failure_at: models.last_failure_at,
        unavailable_reason: models.unavailable_reason,
        marked_unavailable_at: models.marked_unavailable_at,
      })
      .from(models)
      .where(eq(models.is_available, false))
      .orderBy(models.marked_unavailable_at);
  } catch (error) {
    console.error(`Database error getting unavailable models:`, error);
    return [];
  }
}

async function getModelFailureStats(): Promise<{
  total: number;
  available: number;
  unavailable: number;
  recentFailures: number;
  availabilityRate: number;
}> {
  try {
    // Get total count using raw SQL since count() might not be available
    const totalResult = await db.select().from(models);
    const total = totalResult.length;

    // Get unavailable count
    const unavailableResult = await db.select().from(models).where(eq(models.is_available, false));
    const unavailable = unavailableResult.length;

    // Get recent failures count (last 24 hours)
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFailuresResult = await db
      .select()
      .from(models)
      .where(eq(models.last_failure_at, recentDate)); // Simplified for now
    const recentFailures = recentFailuresResult.length;

    const available = total - unavailable;

    return {
      total,
      available,
      unavailable,
      recentFailures,
      availabilityRate: total > 0 ? (available / total) * 100 : 100,
    };
  } catch (error) {
    console.error(`Database error:`, error);
    return {
      total: 0,
      available: 0,
      unavailable: 0,
      recentFailures: 0,
      availabilityRate: 0,
    };
  }
}

async function markModelAvailable(modelId: string, reason?: string): Promise<void> {
  try {
    await db
      .update(models)
      .set({
        is_available: true,
        failure_count: 0,
        last_failure_at: null,
        unavailable_reason: reason ? `Manually restored: ${reason}` : null,
        marked_unavailable_at: null,
      })
      .where(eq(models.id, modelId));

    console.log(`[Model Recovery] Marked ${modelId} as available${reason ? `: ${reason}` : ""}`);
  } catch (error) {
    console.error(`[Model Recovery] Database error while restoring ${modelId}:`, error);
  }
}

async function listUnavailableModels() {
  console.log("🚫 Currently Unavailable Models:");
  console.log("=".repeat(80));

  const unavailableModels = await getUnavailableModels();

  if (unavailableModels.length === 0) {
    console.log("✅ All models are currently available!");
    return;
  }

  unavailableModels.forEach((model, index) => {
    console.log(`${index + 1}. ${model.id}`);
    console.log(`   Name: ${model.name}`);
    console.log(`   Provider: ${model.provider}`);
    console.log(`   Failures: ${model.failure_count}`);
    console.log(
      `   Last Failure: ${model.last_failure_at ? new Date(model.last_failure_at).toLocaleString() : "N/A"}`,
    );
    console.log(
      `   Marked Unavailable: ${model.marked_unavailable_at ? new Date(model.marked_unavailable_at).toLocaleString() : "N/A"}`,
    );
    console.log(`   Reason: ${model.unavailable_reason || "N/A"}`);
    console.log("");
  });

  console.log(`Total unavailable models: ${unavailableModels.length}`);
}

async function showFailureStats() {
  console.log("📊 Model Failure Statistics:");
  console.log("=".repeat(50));

  const stats = await getModelFailureStats();

  console.log(`Total Models: ${stats.total}`);
  console.log(`Available: ${stats.available} (${stats.availabilityRate.toFixed(1)}%)`);
  console.log(`Unavailable: ${stats.unavailable}`);
  console.log(`Recent Failures (24h): ${stats.recentFailures}`);

  if (stats.availabilityRate < 95) {
    console.log("\n⚠️  WARNING: Model availability is below 95%");
  } else if (stats.availabilityRate < 99) {
    console.log("\n⚠️  NOTICE: Model availability is below 99%");
  } else {
    console.log("\n✅ Model availability is healthy");
  }
}

async function restoreModel(modelId: string, reason?: string) {
  console.log(`🔄 Restoring model: ${modelId}`);

  try {
    await markModelAvailable(modelId, reason);
    console.log(`✅ Successfully restored ${modelId}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }
  } catch (error) {
    console.error(`❌ Failed to restore ${modelId}:`, error);
  }
}

async function restoreAllModels(reason?: string) {
  console.log("🔄 Restoring all unavailable models...");

  const unavailableModels = await getUnavailableModels();

  if (unavailableModels.length === 0) {
    console.log("✅ No models need restoration - all are already available!");
    return;
  }

  console.log(`Found ${unavailableModels.length} unavailable models to restore`);

  let restored = 0;
  let failed = 0;

  for (const model of unavailableModels) {
    try {
      await markModelAvailable(model.id, reason);
      console.log(`✅ Restored: ${model.id}`);
      restored++;
    } catch (error) {
      console.error(`❌ Failed to restore ${model.id}:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Restoration Summary:`);
  console.log(`   ✅ Restored: ${restored}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${restored + failed}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log("Model Availability Management Tool");
    console.log("");
    console.log("Usage:");
    console.log("  pnpm tsx scripts/manage-model-availability.ts --list");
    console.log("  pnpm tsx scripts/manage-model-availability.ts --stats");
    console.log("  pnpm tsx scripts/manage-model-availability.ts --restore <model-id> [reason]");
    console.log("  pnpm tsx scripts/manage-model-availability.ts --restore-all [reason]");
    console.log("");
    console.log("Examples:");
    console.log("  pnpm tsx scripts/manage-model-availability.ts --list");
    console.log(
      '  pnpm tsx scripts/manage-model-availability.ts --restore anthropic/claude-3-haiku "Added API key"',
    );
    console.log(
      '  pnpm tsx scripts/manage-model-availability.ts --restore-all "System maintenance completed"',
    );
    return;
  }

  try {
    if (args.includes("--list")) {
      await listUnavailableModels();
    } else if (args.includes("--stats")) {
      await showFailureStats();
    } else if (args.includes("--restore")) {
      const restoreIndex = args.indexOf("--restore");
      const modelId = args[restoreIndex + 1];
      const reason = args[restoreIndex + 2];

      if (!modelId) {
        console.error("❌ Error: Model ID is required for --restore");
        console.log(
          "Usage: pnpm tsx scripts/manage-model-availability.ts --restore <model-id> [reason]",
        );
        process.exit(1);
      }

      await restoreModel(modelId, reason);
    } else if (args.includes("--restore-all")) {
      const restoreAllIndex = args.indexOf("--restore-all");
      const reason = args[restoreAllIndex + 1];

      await restoreAllModels(reason);
    } else {
      console.error("❌ Error: Unknown command");
      console.log("Use --help to see available commands");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
