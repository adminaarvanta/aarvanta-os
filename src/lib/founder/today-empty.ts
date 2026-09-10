export function todayListsAreEmpty(snapshot: {
  attention: unknown[];
  approvals: unknown[];
  recommended: unknown[];
  recentEvents: unknown[];
}): boolean {
  return (
    snapshot.attention.length === 0 &&
    snapshot.approvals.length === 0 &&
    snapshot.recommended.length === 0 &&
    snapshot.recentEvents.length === 0
  );
}
