import type {
  CallCampaign,
  CallQueueItem,
  CallSession,
  MeetingBooking,
  ReminderJob,
} from "@/types/calling-agent";

export type CampaignDashboardMetrics = {
  progress: number;
  meetingsBooked: number;
  bookingRate: number;
  aiConfidence: number;
  today: {
    completed: number;
    pending: number;
    busy: number;
    failed: number;
    voicemail: number;
    callbacks: number;
    meetings: number;
  };
  liveActivity: { hour: string; calls: number }[];
  topHours: { hour: string; bookings: number }[];
  queued: number;
  inProgress: number;
  qualified: number;
  emailsPending: number;
};

export type FunnelMetrics = {
  leadsAdded: number;
  callsConnected: number;
  interested: number;
  qualified: number;
  calendarOpened: number;
  meetingsBooked: number;
  meetingsAttended: number;
  converted: number;
};

export type AgentPerformanceMetrics = {
  totalCalls: number;
  meetingsBooked: number;
  bookingRate: number;
  avgDurationSeconds: number;
  connectedRate: number;
  positiveSentiment: number;
  greetingSuccessRate: number;
  qualificationCompletionRate: number;
  calendarOfferRate: number;
  retrySuccessRate: number;
};

export function buildCampaignDashboardMetrics(input: {
  campaigns: CallCampaign[];
  queue: CallQueueItem[];
  sessions: CallSession[];
  meetings: MeetingBooking[];
  reminders?: ReminderJob[];
}): CampaignDashboardMetrics {
  const { queue, sessions, meetings, reminders = [] } = input;
  const target =
    input.campaigns.reduce((s, c) => s + (c.targetMeetings ?? 0), 0) ||
    Math.max(meetings.length, 1);
  const meetingsBooked = meetings.filter((m) => m.status !== "cancelled").length;
  const dialed = sessions.length || 1;
  const bookingRate = (meetingsBooked / dialed) * 100;

  const scores = sessions
    .map((s) => s.callScore)
    .filter((n): n is number => typeof n === "number");
  const confidences = sessions
    .map((s) => s.intentConfidence)
    .filter((n): n is number => typeof n === "number");
  const aiConfidence =
    confidences.length > 0
      ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100
      : scores.length
        ? (scores.reduce((a, b) => a + b, 0) / scores.length) * 20
        : 90;

  const countStatus = (status: CallQueueItem["status"]) =>
    queue.filter((q) => q.status === status).length;

  const hourBuckets = new Map<string, number>();
  for (const s of sessions) {
    const h = new Date(s.startedAt).getHours();
    const key = `${String(h).padStart(2, "0")}:00`;
    hourBuckets.set(key, (hourBuckets.get(key) ?? 0) + 1);
  }
  const liveActivity = Array.from({ length: 12 }, (_, i) => {
    const h = 8 + i;
    const key = `${String(h).padStart(2, "0")}:00`;
    return { hour: key, calls: hourBuckets.get(key) ?? 0 };
  });

  const bookingHours = new Map<string, number>();
  for (const m of meetings) {
    const h = new Date(m.meetingStart).getHours();
    const key = `${String(h).padStart(2, "0")}:00`;
    bookingHours.set(key, (bookingHours.get(key) ?? 0) + 1);
  }
  const topHours = [...bookingHours.entries()]
    .map(([hour, bookings]) => ({ hour, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 6);
  if (!topHours.length) {
    topHours.push(
      { hour: "10:00", bookings: Math.max(1, meetingsBooked) },
      { hour: "14:00", bookings: Math.max(0, meetingsBooked - 1) }
    );
  }

  return {
    progress: Math.min(100, Math.round((meetingsBooked / target) * 100)),
    meetingsBooked,
    bookingRate: Math.round(bookingRate * 10) / 10,
    aiConfidence: Math.round(aiConfidence),
    today: {
      completed: countStatus("completed") + countStatus("booked_meeting"),
      pending: countStatus("pending"),
      busy: countStatus("busy"),
      failed: countStatus("failed"),
      voicemail: countStatus("voicemail"),
      callbacks: countStatus("callback_requested"),
      meetings: meetingsBooked,
    },
    liveActivity,
    topHours,
    queued: queue.length,
    inProgress: countStatus("calling"),
    qualified: sessions.filter(
      (s) =>
        s.qualification?.interested ||
        s.qualification?.decisionMaker ||
        s.outcome === "meeting_booked"
    ).length,
    emailsPending: reminders.filter((r) => r.status === "pending").length,
  };
}

export function buildFunnelMetrics(input: {
  queue: CallQueueItem[];
  sessions: CallSession[];
  meetings: MeetingBooking[];
}): FunnelMetrics {
  const { queue, sessions, meetings } = input;
  const connected = sessions.filter(
    (s) => s.status === "completed" || s.status === "in_progress"
  ).length;
  const interested = sessions.filter(
    (s) => s.qualification?.interested || s.intent?.toLowerCase() === "interested"
  ).length;
  const qualified = sessions.filter(
    (s) =>
      s.qualification?.decisionMaker ||
      (s.qualification?.painPoint && s.qualification?.interested)
  ).length;
  const calendarOpened = sessions.filter(
    (s) =>
      s.currentStage === "day_select" ||
      s.currentStage === "slot_select" ||
      s.currentStage === "booking" ||
      s.outcome === "meeting_booked"
  ).length;
  const meetingsBooked = meetings.filter((m) => m.status !== "cancelled").length;
  const attended = meetings.filter((m) => m.status === "completed").length;

  return {
    leadsAdded: queue.length,
    callsConnected: connected,
    interested,
    qualified,
    calendarOpened,
    meetingsBooked,
    meetingsAttended: attended,
    converted: attended,
  };
}

export function buildAgentPerformance(input: {
  sessions: CallSession[];
  meetings: MeetingBooking[];
  queue: CallQueueItem[];
}): AgentPerformanceMetrics {
  const { sessions, meetings, queue } = input;
  const completed = sessions.filter((s) => s.status === "completed");
  const totalCalls = sessions.length;
  const meetingsBooked = meetings.filter((m) => m.status !== "cancelled").length;
  const durations = completed
    .map((s) => s.durationSeconds ?? 0)
    .filter((d) => d > 0);
  const avgDurationSeconds = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const positive = completed.filter((s) => s.sentiment === "positive").length;
  const greeted = sessions.filter((s) =>
    s.transcript.some((t) => t.stage === "greeting" || t.role === "user")
  ).length;
  const qualified = sessions.filter(
    (s) => s.qualification?.interested != null
  ).length;
  const calendarOffered = sessions.filter((s) =>
    ["meeting_proposal", "day_select", "slot_select", "booking"].includes(
      s.currentStage ?? ""
    ) || s.outcome === "meeting_booked"
  ).length;
  const retried = queue.filter((q) => q.attemptCount > 1);
  const retrySuccess = retried.filter(
    (q) => q.status === "booked_meeting" || q.status === "completed"
  ).length;

  return {
    totalCalls,
    meetingsBooked,
    bookingRate: totalCalls ? Math.round((meetingsBooked / totalCalls) * 1000) / 10 : 0,
    avgDurationSeconds,
    connectedRate: totalCalls
      ? Math.round((completed.length / totalCalls) * 1000) / 10
      : 0,
    positiveSentiment: completed.length
      ? Math.round((positive / completed.length) * 1000) / 10
      : 0,
    greetingSuccessRate: totalCalls
      ? Math.round((greeted / totalCalls) * 1000) / 10
      : 0,
    qualificationCompletionRate: totalCalls
      ? Math.round((qualified / totalCalls) * 1000) / 10
      : 0,
    calendarOfferRate: totalCalls
      ? Math.round((calendarOffered / totalCalls) * 1000) / 10
      : 0,
    retrySuccessRate: retried.length
      ? Math.round((retrySuccess / retried.length) * 1000) / 10
      : 0,
  };
}

export function buildInsightCards(input: {
  sessions: CallSession[];
  meetings: MeetingBooking[];
  performance: AgentPerformanceMetrics;
}): { title: string; body: string }[] {
  const { sessions, meetings, performance } = input;
  const cards: { title: string; body: string }[] = [];

  const hourHits = new Map<number, number>();
  for (const m of meetings) {
    const h = new Date(m.meetingStart).getHours();
    hourHits.set(h, (hourHits.get(h) ?? 0) + 1);
  }
  const bestHour = [...hourHits.entries()].sort((a, b) => b[1] - a[1])[0];
  if (bestHour) {
    cards.push({
      title: "Optimal call times",
      body: `${String(bestHour[0]).padStart(2, "0")}:00–${String(bestHour[0] + 2).padStart(2, "0")}:00 shows the strongest booking density.`,
    });
  } else {
    cards.push({
      title: "Optimal call times",
      body: "10:00 AM – 12:00 PM typically converts best for discovery outreach.",
    });
  }

  const competitor = sessions.filter(
    (s) =>
      s.outcome === "already_using_competitor" ||
      (s.summary ?? "").toLowerCase().includes("competitor")
  ).length;
  if (sessions.length) {
    const pct = Math.round((competitor / sessions.length) * 100);
    cards.push({
      title: "Common objections",
      body:
        pct > 0
          ? `"Already using competitor" appeared in ~${pct}% of calls.`
          : "No dominant competitor objection yet — keep qualification open-ended.",
    });
  }

  cards.push({
    title: "Booking rate trend",
    body: `Current booking rate is ${performance.bookingRate}%. Calendar offer rate is ${performance.calendarOfferRate}%.`,
  });

  cards.push({
    title: "Script recommendation",
    body:
      performance.greetingSuccessRate < 70
        ? "Tighten the greeting — ask for two minutes earlier and confirm identity before pitching."
        : "Greeting is performing well. Emphasize progressive meeting language after qualification.",
  });

  return cards;
}
