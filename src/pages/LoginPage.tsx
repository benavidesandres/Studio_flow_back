import { useState, type FormEvent, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { ArrowRight, CircleCheck, Clock, Moon, Route as RouteIcon, Sun, TriangleAlert } from 'lucide-react';
import type { UserRole } from '@/types';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Panel';
import { Wordmark } from '@/components/layout/Logo';
import { authService } from '@/services/authService';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

type Mode = 'login' | 'register';

const ROLES: UserRole[] = ['PRODUCER', 'DIRECTOR', 'CREW', 'ACTOR'];

// The login's visual is the product's own schedule language, not a stock film still.
const PREVIEW_STRIPS = 'dddddddddddddryprr'.split('');
const STRIP_CLASS: Record<string, string> = { d: 'bg-done/55', r: 'bg-ready', y: 'strip-hatched', p: 'bg-problem' };

function SchedulePreview() {
  const { t } = useT();
  const rows: { time: string; number: string; title: string; label: string; icon: typeof Clock; color: string }[] = [
    { time: '08:00', number: '24', title: t('login.previewScene1'), label: t('status.READY'), icon: CircleCheck, color: 'text-ready' },
    { time: '11:30', number: '25', title: t('login.previewScene2'), label: t('status.DELAYED'), icon: Clock, color: 'text-delayed' },
    { time: '15:00', number: '26', title: t('login.previewScene3'), label: t('status.PROBLEM'), icon: TriangleAlert, color: 'text-problem' },
  ];

  return (
    <div aria-hidden className="w-full max-w-[460px] select-none">
      <div className="rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-4 py-3 text-sm font-semibold">{t('scene.today')}</div>
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={row.number} className="flex items-center gap-4 px-4 py-3">
              <span className="tabular w-12 font-medium">{row.time}</span>
              <span className="min-w-0 flex-1 truncate">
                <span className="tabular mr-2 text-[13px] text-fg-2">{row.number}</span>
                <span className="font-medium">{row.title}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium">
                <row.icon className={cn('size-4', row.color)} />
                {row.label}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex h-14 gap-0.5 px-4 pt-3">
          {PREVIEW_STRIPS.map((strip, index) => (
            <span key={index} className={cn('flex-1 rounded-t-[4px]', STRIP_CLASS[strip])} />
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-3 ml-8 flex gap-3 rounded-lg border border-line-strong bg-raised p-4 shadow-[var(--shadow)]">
        <RouteIcon className="mt-0.5 size-4 shrink-0 text-delayed" />
        <div>
          <p className="font-medium">{t('login.previewConflictTitle')}</p>
          <p className="mt-0.5 text-[13px] text-fg-2">{t('login.previewConflictBody')}</p>
        </div>
      </div>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-line-strong bg-raised px-3 py-2.5 text-[13px]">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-problem" />
      <span>{children}</span>
    </p>
  );
}

export function LoginPage() {
  const { t, language } = useT();
  const { login, startDemo } = useAuthStore();
  const { theme, toggleTheme, setLanguage } = useAppStore();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('PRODUCER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const describeError = (err: unknown) => {
    const response = isAxiosError(err) ? err.response : undefined;
    if (response?.status === 401) return t('login.error');
    if (response?.status === 409) return t('login.emailTaken');
    // Only validation messages are meant for users; a 500 can carry raw SQL.
    if (response?.status === 400 && response.data?.message) return response.data.message;
    return t('login.serverDown');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === 'register'
          ? await authService.register({ name: name.trim(), email: email.trim(), password, role, phone: phone.trim() })
          : await authService.login(email.trim(), password);
      login(result.user, result.token);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const heading = mode === 'register' ? t('login.createAccount') : t('login.signIn');

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} aria-label={t('nav.switchLanguage')} className="tabular flex size-9 items-center justify-center rounded-md text-xs font-medium text-fg-2 uppercase transition-colors hover:bg-raised hover:text-fg">
              {language}
            </button>
            <IconButton icon={theme === 'dark' ? Sun : Moon} label={t('nav.switchTheme')} onClick={toggleTheme} />
          </div>
        </div>

        <main className="anim-rise mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-[28px] leading-9 font-semibold tracking-[-0.025em]">{heading}</h1>
          <p className="mt-1.5 text-fg-2">{t('login.tagline')}</p>

          <div className="mt-6">
            <Segmented
              label={heading}
              value={mode}
              onChange={switchMode}
              options={[
                { value: 'login', label: t('login.signIn') },
                { value: 'register', label: t('login.register') },
              ]}
            />
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {error && <Notice>{error}</Notice>}

            {mode === 'register' && (
              <Field label={t('login.name')} htmlFor="lg-name">
                <Input id="lg-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            )}

            <Field label={t('login.email')} htmlFor="lg-email">
              <Input id="lg-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>

            <Field label={t('login.password')} htmlFor="lg-password">
              <Input id="lg-password" type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>

            {mode === 'register' && (
              <>
                <Field label={t('login.phone')} htmlFor="lg-phone">
                  <Input id="lg-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <fieldset>
                  <legend className="mb-1.5 text-[13px] font-medium text-fg-2">{t('login.role')}</legend>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ROLES.map((option) => (
                      <button key={option} type="button" aria-pressed={role === option} onClick={() => setRole(option)} className={cn('h-9 rounded-md border text-[13px] font-medium transition-colors', role === option ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-fg-2 hover:bg-raised hover:text-fg')}>
                        {t(`role.${option}`)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              {heading}
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-5">
            <Button size="lg" className="w-full" onClick={() => startDemo()}>
              {t('login.tryDemo')}
              <ArrowRight className="size-4" />
            </Button>
            <p className="mt-2 text-center text-[13px] text-fg-3">{t('login.demoHint')}</p>
          </div>
        </main>
      </div>

      <aside className="hidden flex-col items-center justify-center border-l border-line bg-sunken p-12 lg:flex">
        <div className="w-full max-w-[460px]">
          <h2 className="mb-8 text-[26px] leading-[34px] font-semibold tracking-[-0.02em]">{t('login.headline')}</h2>
        </div>
        <SchedulePreview />
      </aside>
    </div>
  );
}
