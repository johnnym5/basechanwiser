import ComplianceAnalyticsDashboard from "@/components/admin/ComplianceAnalyticsDashboard";
import RoleGuard from "@/components/layout/RoleGuard";

export default function AdminAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["Admin", "Super Admin", "Head of Compliance"]}>
      <ComplianceAnalyticsDashboard redirectPath="/counselor/dashboard" />
    </RoleGuard>
  );
}
