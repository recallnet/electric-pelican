import { NextRequest } from "next/server";

import { POST as originalPost } from "./route";

export async function POST(request: NextRequest) {
  console.log("---INCOMING /api/tournament/debug REQUEST---");
  console.log("Request Headers:", Object.fromEntries(request.headers.entries()));
  console.log("------------------------------------------");

  // Forward the request to the original handler
  return originalPost(request);
}
