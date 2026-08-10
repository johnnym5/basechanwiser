"use client";

import MockInterviewLive from "./MockInterviewLive";

/**
 * MockInterviewSession (Refactored)
 * This component now serves as a proxy to the new high-quality MockInterviewLive arena.
 * Migrated to use 'mock_interview_sets' taxonomy with 3-2-1 countdown, REC pulse, and mic visualizer.
 */
export default function MockInterviewSession() {
  return <MockInterviewLive />;
}
