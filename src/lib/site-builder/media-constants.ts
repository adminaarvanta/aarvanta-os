/** Per-job cap — keeps listings snappy and Firestore job docs small. */
export const SITE_MEDIA_MAX_PER_JOB = 24;
/** Raw upload cap (client compresses first). Base64 must still fit a 1MB Firestore doc. */
export const SITE_MEDIA_MAX_BYTES = 700_000;
