import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  AdminPage,
  ChannelPage,
  CharityPage,
  DashboardPage,
  LandingPage,
  LeadDatabasePage,
  LeadFinderPage,
  LegalPage,
  LoginPage,
  MessagesPage,
  NotificationsPage,
  OnboardingPage,
  RepDashboardPage,
  SettingsPage,
  SignupPage,
  StatementPage,
  TicketsPage,
} from "./pages";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <Toaster />
        <Routes>
          {/* Landing has its own header */}
          <Route path="/" element={<LandingPage />} />

          <Route element={<PublicLayout />}>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AppLayout />}>
              <Route path="/community" element={<DashboardPage />} />
              <Route path="/dashboard" element={<Navigate to="/community" replace />} />
              <Route path="/channel/:slug" element={<ChannelPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/charity" element={<CharityPage />} />
              <Route path="/statements" element={<StatementPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/rep-dashboard" element={<RepDashboardPage />} />
              <Route path="/leads" element={<LeadDatabasePage />} />
              <Route path="/lead-finder" element={<LeadFinderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="/legal" element={<LegalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
