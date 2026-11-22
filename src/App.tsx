import { useEffect } from 'react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoute } from '@/lib/router';
import { AppShell } from '@/components/layout/AppShell';
import { Logo } from '@/components/layout/Logo';
import { Toaster } from '@/components/ui/Toast';
import { LoginPage } from '@/pages/LoginPage';
import { ProductionsPage } from '@/pages/ProductionsPage';
import { ActorSchedulePage } from '@/pages/ActorSchedulePage';
import { ProductionPage } from '@/pages/production/ProductionPage';

export default function App() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const route = useRoute();

  useEffect(() => {
    authService.restoreSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="animate-pulse">
          <Logo size={36} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  // The role decides what can be seen; a stale or hand-typed URL can't widen that.
  const content =
    user?.role === 'ACTOR' ? (
      <ActorSchedulePage />
    ) : route.name === 'production' ? (
      <ProductionPage key={route.id} id={route.id} view={route.view} />
    ) : (
      <ProductionsPage />
    );

  return (
    <>
      <AppShell route={route}>{content}</AppShell>
      <Toaster />
    </>
  );
}
