import { CircleDollarSign, OctagonAlert, Route as RouteIcon } from 'lucide-react';
import { navigate, productionPath } from '@/lib/router';
import { STATUS_META } from '@/lib/status';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useProductionStore } from '@/store/useProductionStore';
import { useT } from '@/i18n/useT';
import type { AttentionItem } from './useAttentionItems';

/** Shared by the Overview panel and the notifications menu, so both always agree. */
export function AttentionList({ items, onPick }: { items: AttentionItem[]; onPick?: () => void }) {
  const { t, language } = useT();
  const production = useProductionStore((state) => state.production);
  const openScene = useProductionStore((state) => state.openScene);

  const describe = (item: AttentionItem) => {
    if (item.kind === 'conflict') {
      const { pair } = item;
      const scenes = { a: pair.first.sceneNumber, b: pair.second.sceneNumber };
      return pair.type === 'ACTOR_OVERLAP'
        ? { icon: OctagonAlert, color: 'text-problem', title: pair.actorName, detail: t('attention.overlap', scenes) }
        : { icon: RouteIcon, color: 'text-delayed', title: pair.actorName, detail: t('attention.travel', { ...scenes, gap: pair.gapMinutes ?? 0 }) };
    }
    if (item.kind === 'scene') {
      const { icon, color } = STATUS_META[item.scene.status];
      return {
        icon,
        color,
        title: `${item.scene.sceneNumber} · ${item.scene.title}`,
        detail: `${t(`status.${item.scene.status}`)} · ${formatDate(item.scene.shootDate, language)} ${item.scene.startTime}`,
      };
    }
    return {
      icon: CircleDollarSign,
      color: item.critical ? 'text-problem' : 'text-delayed',
      title: t('attention.budgetTitle'),
      detail: t('attention.budgetDetail', { percent: item.percent }),
    };
  };

  const pick = (item: AttentionItem) => {
    onPick?.();
    if (item.kind === 'scene') openScene(item.scene.id);
    else if (production) navigate(productionPath(production.id, item.kind === 'conflict' ? 'conflicts' : 'budget'));
  };

  return (
    <ul>
      {items.map((item) => {
        const { icon: Icon, color, title, detail } = describe(item);
        return (
          <li key={item.key}>
            <button type="button" role={onPick ? 'menuitem' : undefined} onClick={() => pick(item)} className="flex w-full gap-3 rounded-md px-3 py-2 text-left outline-none transition-colors hover:bg-line focus-visible:bg-line">
              <Icon className={cn('mt-0.5 size-4 shrink-0', color)} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{title}</span>
                <span className="block text-[13px] text-fg-2">{detail}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
