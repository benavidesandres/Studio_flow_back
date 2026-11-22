import { useEffect, useState, type ReactNode } from 'react';
import { Bell, FlaskConical, Menu as MenuIcon, Moon, Search, Sun, Unplug } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Menu, MenuLabel } from '@/components/ui/Menu';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import type { Route } from '@/lib/router';
import { useT } from '@/i18n/useT';
import { AttentionList } from './AttentionList';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { useAttentionItems } from './useAttentionItems';

function Notifications({ route }: { route: Route }) {
  const { t } = useT();
  const items = useAttentionItems();
  const loadedId = useProductionStore((state) => state.production?.id);
  const relevant = route.name === 'production' && loadedId === route.id ? items : [];

  return (
    <Menu
      width={340}
      align="end"
      trigger={(props) => (
        <IconButton icon={Bell} label={t('notifications.title')} {...props}>
          {relevant.length > 0 && (
            <span className="tabular absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-on-primary">
              {relevant.length}
            </span>
          )}
        </IconButton>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>{t('notifications.title')}</MenuLabel>
          {relevant.length ? <AttentionList items={relevant} onPick={close} /> : <p className="px-3 py-6 text-center text-[13px] text-fg-2">{t('notifications.empty')}</p>}
        </>
      )}
    </Menu>
  );
}

function Banner({ icon: Icon, children }: { icon: typeof Unplug; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-raised/50 px-4 py-1.5 text-[13px] text-fg-2 sm:px-6 lg:px-8">
      <Icon className="size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const { t } = useT();
  const { theme, toggleTheme, language, setLanguage, usingSampleData } = useAppStore();
  const isDemoMode = useAuthStore((state) => state.isDemoMode);
  // Search and alerts cover whole productions; an actor only works from their own schedule.
  const hasProductionTools = useAuthStore((state) => state.user?.role !== 'ACTOR');
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!hasProductionTools) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasProductionTools]);

  return (
    <div className="min-h-dvh lg:pl-60">
      <Sidebar route={route} open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg px-4 sm:px-6 lg:px-8">
          <IconButton icon={MenuIcon} label={t('nav.openMenu')} onClick={() => setNavOpen(true)} className="-ml-2 lg:hidden" />

          {hasProductionTools && (
            <button type="button" onClick={() => setSearchOpen(true)} className="flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-line-strong bg-surface px-3 text-[13px] text-fg-3 transition-colors hover:text-fg-2 sm:max-w-xs">
              <Search className="size-4 shrink-0" />
              <span className="truncate">{t('search.trigger')}</span>
              <kbd className="tabular ml-auto hidden rounded border border-line-strong px-1.5 text-xs sm:block">Ctrl K</kbd>
            </button>
          )}

          <div className="ml-auto flex items-center gap-0.5">
            <button type="button" onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} title={t('nav.switchLanguage')} aria-label={t('nav.switchLanguage')} className="tabular flex size-9 items-center justify-center rounded-md text-xs font-medium text-fg-2 uppercase transition-colors hover:bg-raised hover:text-fg">
              {language}
            </button>
            <IconButton icon={theme === 'dark' ? Sun : Moon} label={t('nav.switchTheme')} onClick={toggleTheme} />
            {hasProductionTools && <Notifications route={route} />}
          </div>
        </header>

        {isDemoMode && <Banner icon={FlaskConical}>{t('banner.demo')}</Banner>}
        {usingSampleData && <Banner icon={Unplug}>{t('banner.sampleData')}</Banner>}

        <main className="anim-rise mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
