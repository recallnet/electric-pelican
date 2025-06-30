export async function register() {
  // Runs in *both* Edge and Node – branch early
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Use full relative path for turbopack compatibility
      const modPath = "./src/lib/background-jobs";
      const { startBackgroundJobs } = await import(modPath);
      startBackgroundJobs();
      console.info("Background job processor started");
    } catch (error) {
      console.error("Failed to start background jobs:", error);
    }
  }

  console.info({ event: "instrumentation" }, "Instrumentation registered");
}
