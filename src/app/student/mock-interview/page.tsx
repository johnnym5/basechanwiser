"use client";

import React from "react";
import AppShell from "@/components/layout/app-shell";
import MockInterviewSession from "@/components/mock-interview/MockInterviewSession";

export default function StudentMockInterviewPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-8">
        <MockInterviewSession />
      </div>
    </AppShell>
  );
}
