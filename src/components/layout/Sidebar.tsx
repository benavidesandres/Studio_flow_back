import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CalendarDays,
  ChevronsUpDown,
  Clapperboard,
  Film,
  LayoutDashboard,
  LogOut,
  MapPin,
  TriangleAlert,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Production, UserRole } from '@/types';
import { Menu, MenuItem, MenuLabel } from '@/components/ui/Menu';
import { Avatar } from '@/components/ui/Avatar';
import { productionService } from '@/services/productionService';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { useConflictPairs, usePermissions } from '@/components/scenes/useScenePermissions';
import { navigate, type ProductionView, productionPath, type Route } from '@/lib/router';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';
import { Wordmark } from './Logo';

const ROLES: UserRole[] = ['PRODUCER', 'DIRECTOR', 'CREW', 'ACTOR'];

function NavLink({ href, icon: Icon, label, active, count, onClick }: { href: string; icon: LucideIcon; label: string; active: boolean; count?: number; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
        active ? 'bg-raised font-medium text-fg' : 'text-fg-2 hover:bg-raised/60 hover:text-fg'
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {!!count && <span className="tabular ml-auto text-xs text-fg-2">{count}</span>}
    </a>
  );
}

function ProductionSwitcher({ current }: { current: Production }) {
  const { t } = useT();
  const [productions, setProductions] = useState<Production[]>([]);

  useEffect(() => {
    productionService.getProductions().then(setProductions, () => setProductions([]));
  }, [current.id]);

  return (
    <Menu
      width={224}
      trigger={(props) => (
        <button type="button" {...props} aria-label={t('nav.switchProduction')} className="flex w-full items-center gap-2 rounded-md border border-line-strong px-2.5 py-1.5 text-left transition-colors hover:bg-raised/60">
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-fg-3">{t('nav.production')}</span>
            <span className="block truncate text-sm font-medium">{current.title}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-fg-3" />
        </button>
      )}
    >
      {(close) =>
        productions.map((production) => (
          <MenuItem
            key={production.id}
            selected={production.id === current.id}
            onSelect={() => {
              close();
              navigate(productionPath(production.id));
            }}
          >
            <span className="block truncate">{production.title}</span>
          </MenuItem>
        ))
      }
    </Menu>
  );
}

function UserMenu() {
  const { t } = useT();
  const { user, isDemoMode, setDemoRole, logout } = useAuthStore();
  if (!user) return null;

  return (
    <Menu
      width={224}
      trigger={(props) => (
        <button type="button" {...props} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-raised/60">
          <Avatar person={user} size={30} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{user.name}</span>
            <span className="block truncate text-xs text-fg-3">{t(`role.${user.role}`)}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-fg-3" />
        </button>
      )}
    >
      {(close) => (
        <>
          {isDemoMode && (
            <>
              <MenuLabel>{t('nav.viewAsRole')}</MenuLabel>
              {ROLES.map((role) => (
                <MenuItem
                  key={role}
                  selected={role === user.role}
                  onSelect={() => {
                    close();
                    setDemoRole(role);
                  }}
                >
                  {t(`role.${role}`)}
                </MenuItem>
              ))}
              <div className="my-1 h-px bg-line" />
            </>
          )}
          <MenuItem icon={LogOut} onSelect={() => logout()}>
            {isDemoMode ? t('nav.exitDemo') : t('nav.logout')}
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

export function Sidebar({ route, open, onClose }: { route: Route; open: boolean; onClose: () => void }) {
  const { t } = useT();
  const role = useAuthStore((state) => state.user?.role);
  const production = useProductionStore((state) => state.production);
  const pairs = useConflictPairs();
  const { viewBudget, viewConflicts } = usePermissions();

  const isActor = role === 'ACTOR';
  const showProduction = !isActor && route.name === 'production' && production?.id === route.id;

  const views: { view: ProductionView; icon: LucideIcon; hidden?: boolean; count?: number }[] = [
    { view: 'overview', icon: LayoutDashboard },
    { view: 'calendar', icon: CalendarDays },
    { view: 'scenes', icon: Clapperboard },
    { view: 'cast', icon: Users },
    { view: 'locations', icon: MapPin },
    { view: 'budget', icon: Wallet, hidden: !viewBudget },
    { view: 'conflicts', icon: TriangleAlert, hidden: !viewConflicts, count: pairs.length },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-[var(--overlay)] lg:hidden" onClick={onClose} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-sunken transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <a href="#/productions" onClick={onClose} className="flex h-14 shrink-0 items-center px-4">
          <Wordmark />
        </a>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pt-1 pb-3">
          <div className="space-y-0.5">
            {isActor ? (
              <NavLink href="#/my-schedule" icon={CalendarCheck} label={t('nav.mySchedule')} active onClick={onClose} />
            ) : (
              <NavLink href="#/productions" icon={Film} label={t('nav.productions')} active={route.name === 'productions'} onClick={onClose} />
            )}
          </div>

          {showProduction && production && route.name === 'production' && (
            <div className="space-y-2">
              <ProductionSwitcher current={production} />
              <div className="space-y-0.5">
                {views
                  .filter((item) => !item.hidden)
                  .map((item) => (
                    <NavLink key={item.view} href={productionPath(production.id, item.view)} icon={item.icon} label={t(`view.${item.view}`)} active={route.view === item.view} count={item.count} onClick={onClose} />
                  ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-line p-2">
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
