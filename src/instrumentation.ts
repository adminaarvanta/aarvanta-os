export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureDatastoreReady } = await import("@/lib/data/datastore");
    await ensureDatastoreReady();
    const { ensureProductionBootstrap } = await import(
      "@/lib/tenant/ensure-production-bootstrap"
    );
    await ensureProductionBootstrap();
    const { registerAutomationListeners } = await import(
      "@/lib/automation/register-listeners"
    );
    registerAutomationListeners();
  }
}
