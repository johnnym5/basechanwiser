"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import MockInterviewLive from "@/components/mock-interview/MockInterviewLive";

export default function StudentMockInterviewLivePage() {
  return (
    <AppShell>
      <div className="py-8">
        <MockInterviewLive />
      </div>
    </AppShell>
  );
}
