import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Clapperboard, CornerDownLeft, Film, Search, type LucideIcon } from 'lucide-react';
import type { Production } from '@/types';
import { productionService } from '@/services/productionService';
import { useProductionStore } from '@/store/useProductionStore';
import { navigate, PRODUCTION_VIEWS, productionPath } from '@/lib/router';
import { usePermissions } from '@/components/scenes/useScenePermissions';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

interface Result {
  key: string;
  icon: LucideIcon;
  title: string;
  detail?: string;
  run: () => void;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const production = useProductionStore((state) => state.production);
  const scenes = useProductionStore((state) => state.scenes);
  const openScene = useProductionStore((state) => state.openScene);
  const { viewBudget, viewConflicts } = usePermissions();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [productions, setProductions] = useState<Production[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    productionService.getProductions().then(setProductions, () => setProductions([]));
    return () => dialog?.close();
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = (...fields: (string | undefined)[]) => !needle || fields.some((field) => field?.toLowerCase().includes(needle));
    const list: Result[] = [];

    if (production) {
      PRODUCTION_VIEWS.filter((view) => (view !== 'budget' || viewBudget) && (view !== 'conflicts' || viewConflicts)).forEach((view) => {
        const title = t(`view.${view}`);
        if (matches(title)) list.push({ key: `view-${view}`, icon: Clapperboard, title, detail: production.title, run: () => navigate(productionPath(production.id, view)) });
      });
      scenes.forEach((scene) => {
        const actors = scene.actors?.map((actor) => actor.name).join(' ');
        if (needle && matches(scene.sceneNumber, scene.title, scene.location, actors)) {
          list.push({ key: `scene-${scene.id}`, icon: Clapperboard, title: `${scene.sceneNumber} · ${scene.title}`, detail: scene.location, run: () => openScene(scene.id) });
        }
      });
    }

    productions.forEach((item) => {
      if (matches(item.title, item.directorName)) list.push({ key: `production-${item.id}`, icon: Film, title: item.title, detail: t('nav.production'), run: () => navigate(productionPath(item.id)) });
    });

    return list.slice(0, 40);
  }, [query, production, scenes, productions, viewBudget, viewConflicts, openScene, t]);

  const execute = (result?: Result) => {
    if (!result) return;
    onClose();
    result.run();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setCursor((current) => (current + step + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      execute(results[cursor]);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={t('search.label')}
      className="size-full backdrop:bg-[var(--overlay)]"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex justify-center px-4 pt-[12dvh]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <div className="anim-pop w-full max-w-xl overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 shrink-0 text-fg-3" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCursor(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={t('search.placeholder')}
              aria-label={t('search.label')}
              className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-fg-3"
            />
          </div>
          <ul className="max-h-[50dvh] overflow-y-auto p-1.5">
            {results.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-fg-2">{t('search.empty')}</li>}
            {results.map((result, index) => (
              <li key={result.key}>
                <button
                  type="button"
                  onMouseMove={() => setCursor(index)}
                  onClick={() => execute(result)}
                  className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-left outline-none', index === cursor && 'bg-raised')}
                >
                  <result.icon className="size-4 shrink-0 text-fg-3" />
                  <span className="min-w-0 flex-1 truncate">{result.title}</span>
                  {result.detail && <span className="max-w-[40%] truncate text-[13px] text-fg-3">{result.detail}</span>}
                  {index === cursor && <CornerDownLeft className="size-3.5 shrink-0 text-fg-3" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
