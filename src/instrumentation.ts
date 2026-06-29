export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureDatastoreReady } = await import("@/lib/data/datastore");
    await ensureDatastoreReady();
    const { registerAutomationListeners } = await import(
      "@/lib/automation/register-listeners"
    );
    registerAutomationListeners();
  }
}
