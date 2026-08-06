import AppShell from "@/components/layout/app-shell";
import InterviewPackForm from "@/components/student/InterviewPackForm";

export default function InterviewPackPage() {
  return (
    <AppShell>
      <div className="py-10">
        <InterviewPackForm />
      </div>
    </AppShell>
  );
}
