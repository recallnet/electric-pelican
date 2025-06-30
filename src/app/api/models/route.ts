import { and, eq, ilike, type SQL, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { ModelsResponse, ProcessedModel } from "@/types/models";

// Lazy import database to avoid build-time connection issues
// import { db } from "../../../../db";
// import { models } from "../../../../db/schema";

export const runtime = "nodejs";

/**
 * Search models by name, description, provider, or ID.
 * Uses PostgreSQL's ILIKE for case-insensitive search.
 */
async function searchModels(query: string) {
  // Lazy import database
  const { db } = await import("../../../../db");
  const { models } = await import("../../../../db/schema");

  const searchTerm = `%${query}%`;
  const conditions = [
    ilike(models.name, searchTerm),
    ilike(models.description, searchTerm),
    ilike(models.provider, searchTerm),
    ilike(models.id, searchTerm),
  ];
  return db
    .select()
    .from(models)
    .where(sql`(${sql.join(conditions, sql` OR `)})`);
}

export async function GET(request: NextRequest) {
  try {
    // Lazy import database
    const { db } = await import("../../../../db");
    const { models } = await import("../../../../db/schema");

    // Safely handle nextUrl which may be undefined in test environments
    const searchParams = request.nextUrl?.searchParams || new URLSearchParams();
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10);
    const capabilityParam = (searchParams.get("capability") || "all") as "text" | "images" | "all";
    const searchQuery = searchParams.get("q") || "";
    const inputModality = searchParams.get("input_modality") || "text";
    const outputModality = searchParams.get("output_modality") || "text";
    const includeUnavailable = searchParams.get("include_unavailable") === "true";

    // Use a more specific type for SQL conditions
    const conditions: SQL[] = [];

    // Exclude OpenRouter auto-chooser
    conditions.push(sql`${models.id} != 'openrouter/auto'`);

    // Filter out unavailable models unless explicitly requested
    if (!includeUnavailable) {
      conditions.push(eq(models.is_available, true));
    }

    // Apply capability filter if specified
    if (capabilityParam !== "all") {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(${models.capabilities}) AS capability
        WHERE capability = ${capabilityParam}
      )`);
    }

    // Always require text input/output modalities by default
    conditions.push(sql`EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(${models.input_modalities}) AS modality
      WHERE modality = 'text'
    )`);
    conditions.push(sql`EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(${models.output_modalities}) AS modality
      WHERE modality = 'text'
    )`);

    // Apply additional modality filters if specified
    if (inputModality !== "text") {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(${models.input_modalities}) AS modality
        WHERE modality = ${inputModality}
      )`);
    }
    if (outputModality !== "text") {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(${models.output_modalities}) AS modality
        WHERE modality = ${outputModality}
      )`);
    }

    // Apply search filter if query provided
    if (searchQuery) {
      const searchResults = await searchModels(searchQuery);
      const searchIds = searchResults.map((m: typeof models.$inferSelect) => m.id);
      if (searchIds.length > 0) {
        conditions.push(
          sql`${models.id} IN (${sql.join(
            searchIds.map((id) => sql`${id}`),
            sql`,`,
          )})`,
        );
      } else {
        // No search results found
        return NextResponse.json({
          models: [],
          cached: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Build and execute query
    const baseQuery = db.select().from(models);
    const query = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    // Order by tokens_served (popularity) and limit results
    const results = await query.orderBy(sql`${models.tokens_served} DESC`).limit(limit);

    const response: ModelsResponse = {
      models: results.map(
        (model: typeof models.$inferSelect, index: number): ProcessedModel => ({
          id: model.id,
          name: model.name,
          description: model.description || "",
          provider: model.provider,
          tokens_served: model.tokens_served || 0,
          isNew: Boolean(model.is_new),
          capabilities: model.capabilities as string[],
          input_modalities: model.input_modalities as string[],
          output_modalities: model.output_modalities as string[],
          context_length: model.context_length || 0,
          created:
            typeof model.created === "number" ? model.created : Math.floor(Date.now() / 1000),
          rank: index + 1, // Rank based on tokens_served order
          // Include availability info for debugging when requested
          ...(includeUnavailable && {
            is_available: Boolean(model.is_available),
            failure_count: model.failure_count || 0,
            unavailable_reason: model.unavailable_reason || null,
          }),
        }),
      ),
      cached: true,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json({
      models: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: "Failed to fetch models",
    });
  }
}
