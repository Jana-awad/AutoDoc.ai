/**
 * Super Admin Dashboard – data layer (placeholder endpoints, no live API connection).
 * Replace with real fetch(process.env.REACT_APP_*) when backend is ready.
 */

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export async function fetchKeyMetrics() {
  await delay(500);
  return {
    totalDocuments: 0,
    successRate: 0,
    apiCallsToday: 0,
    activeUsers: 0,
    totalClients: 0,
    totalTemplates: 0,
    accuracyPercent: 0,
    failedDocs: 0,
    quotaRemaining: null,
    quotaUnlimited: true,
    changes: {
      totalDocuments: null,
      successRate: null,
      apiCallsToday: null,
      activeUsers: null,
    },
  };
}

export async function fetchTopActiveClients() {
  await delay(450);
  return [];
}

export async function fetchRecentActivity() {
  await delay(450);
  return [];
}

export async function fetchSystemHealth() {
  await delay(400);
  return {
    apiStatus: "operational",
    errorSpike: false,
    avgProcessingTimeMs: 0,
    trend: "neutral",
  };
}

export async function fetchAIProcessingAnalytics() {
  await delay(400);
  return {
    ocrAccuracyRate: 0,
    extractionConfidenceScore: 0,
    templatePerformance: [],
    latencyTrend: [],
  };
}

export async function fetchTemplateIntelligence() {
  await delay(400);
  return {
    activeCount: 0,
    inTrainingCount: 0,
    failedCount: 0,
    recentlyUpdated: [],
  };
}

export async function fetchLiveApiUsage() {
  await delay(350);
  return {
    requestsPerMinute: 0,
    successRate: 0,
    errorRate: 0,
    throttlingActive: false,
    unlimitedUsage: true,
  };
}

export async function fetchAuditLog() {
  await delay(450);
  return [];
}

export async function fetchSupportSLA() {
  await delay(350);
  return {
    prioritySupport24_7: true,
    accountManager: null,
    slaStatus: "met",
  };
}

export async function fetchSecurityAccess() {
  await delay(400);
  return {
    activeSessions: 0,
    roleDistribution: { admin: 0, editor: 0, viewer: 0 },
    securityAlerts: [],
  };
}

export async function fetchCurrentUser() {
  await delay(200);
  return { name: "Super Admin", email: "admin@autodoc.ai" };
}
