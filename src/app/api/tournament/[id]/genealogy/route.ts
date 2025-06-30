import { NextRequest, NextResponse } from "next/server";

import { getTournamentGenealogy, tournamentExists } from "@/lib/tournament-db";

export const runtime = "nodejs";

/**
 * GET /api/tournament/[id]/genealogy
 * Returns tournament genealogy including parent and child tournaments.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tournament ID is required" },
        { status: 400 },
      );
    }

    // Check if tournament exists
    const exists = await tournamentExists(id);
    if (!exists) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    const genealogy = await getTournamentGenealogy(id);

    return NextResponse.json({
      success: true,
      data: {
        current: genealogy.current
          ? {
              id: genealogy.current.id,
              slug: genealogy.current.slug,
              title: genealogy.current.title,
              createdAt: genealogy.current.createdAt,
              parentId: genealogy.current.parentId,
              forkCount: genealogy.current.forkCount,
            }
          : null,
        parent: genealogy.parent
          ? {
              id: genealogy.parent.id,
              slug: genealogy.parent.slug,
              title: genealogy.parent.title,
              createdAt: genealogy.parent.createdAt,
              forkCount: genealogy.parent.forkCount,
            }
          : null,
        children: genealogy.children.map((child) => ({
          id: child.id,
          slug: child.slug,
          title: child.title,
          createdAt: child.createdAt,
          parentId: child.parentId,
          forkCount: child.forkCount,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching tournament genealogy:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
