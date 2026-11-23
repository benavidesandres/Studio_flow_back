import { useMemo, useState, type ChangeEvent } from 'react';
import { ArrowLeft, CircleAlert, FileUp, Sparkles } from 'lucide-react';
import type { Actor, CreateScenePayload } from '@/types';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { toast } from '@/components/ui/toastStore';
import { aiService, apiErrorMessage, MAX_SCRIPT_CHARS, type BreakdownScene, type ScriptBreakdown } from '@/services/aiService';
import { sceneService, type ApiConflictError } from '@/services/sceneService';
import { isDemo } from '@/services/api';
import { useProductionStore } from '@/store/useProductionStore';
import { layoutScenes, SCENE_GAP_MINUTES } from '@/lib/scheduleImport';
import { formatDate, formatDuration, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

interface Failure {
  sceneNumber: string;
  reason: string;
}

const key = (value: string) => value.trim().toLowerCase();

/** The actor already cast as this character, or whose name starts with it ("Ana" → "Ana Ruiz"). */
const guessActor = (character: string, actors: Actor[]) =>
  actors.find((actor) => actor.characterName && key(actor.characterName) === key(character)) ??
  actors.find((actor) => key(actor.name) === key(character) || key(actor.name).startsWith(`${key(character)} `));

/** Scene numbers already used in the production get the next free number instead. */
const uniqueNumbers = (scenes: BreakdownScene[], taken: Set<string>) => {
  const used = new Set([...taken].map(key));
  let next = Math.max(0, ...[...taken].map((value) => parseInt(value, 10)).filter(Number.isFinite)) + 1;
  return scenes.map((scene) => {
    if (!used.has(key(scene.sceneNumber))) {
      used.add(key(scene.sceneNumber));
      return scene.sceneNumber;
    }
    while (used.has(String(next))) next++;
    used.add(String(next));
    return String(next);
  });
};

export function ScriptImportModal({ onClose }: { onClose: () => void }) {
  const { t, language } = useT();
  const production = useProductionStore((state) => state.production);
  const existing = useProductionStore((state) => state.scenes);
  const actors = useProductionStore((state) => state.actors);
  const refresh = useProductionStore((state) => state.refresh);

  const [script, setScript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<ScriptBreakdown | null>(null);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cast, setCast] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState(() => {
    const today = todayISO();
    return production?.startDate && production.startDate > today ? production.startDate : today;
  });
  const [dayStart, setDayStart] = useState('08:00');
  const [dayEnd, setDayEnd] = useState('20:00');

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<Failure[] | null>(null);

  const tooLong = script.length > MAX_SCRIPT_CHARS;
  const invalidDay = dayEnd <= dayStart;

  const analyze = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const result = await aiService.breakdownScript(script);
      if (!result.scenes.length) {
        setError(t('import.noScenes'));
        return;
      }
      setBreakdown(result);
      setSelected(new Set(result.scenes.map((_, index) => index)));
      setCast(Object.fromEntries(result.characters.map((name) => [name, String(guessActor(name, actors)?.id ?? '')])));
    } catch (failure) {
      setError(apiErrorMessage(failure) ?? t('import.failed'));
    } finally {
      setAnalyzing(false);
    }
  };

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) setScript(await file.text());
  };

  const chosen = useMemo(() => (breakdown?.scenes ?? []).filter((_, index) => selected.has(index)), [breakdown, selected]);
  const slots = useMemo(
    () => (invalidDay ? [] : layoutScenes(chosen.map((scene) => scene.estimatedMinutes), startDate, dayStart, dayEnd)),
    [chosen, startDate, dayStart, dayEnd, invalidDay]
  );
  const slotFor = useMemo(() => new Map(chosen.map((scene, index) => [scene, slots[index]])), [chosen, slots]);

  const toggle = (index: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const create = async () => {
    if (!production || !chosen.length || invalidDay) return;
    const numbers = uniqueNumbers(chosen, new Set(existing.map((scene) => scene.sceneNumber)));
    const failed: Failure[] = [];
    setProgress({ done: 0, total: chosen.length });

    for (const [index, scene] of chosen.entries()) {
      const actorIds = [...new Set(scene.characters.map((name) => Number(cast[name])).filter(Boolean))];
      const uncast = scene.characters.filter((name) => !cast[name]);
      const notes = [
        `${scene.setting}. ${scene.timeOfDay}`,
        scene.summary,
        uncast.length ? t('import.uncastNote', { names: uncast.join(', ') }) : null,
      ].filter(Boolean).join('\n');

      const payload: CreateScenePayload = {
        productionId: production.id,
        sceneNumber: numbers[index],
        title: scene.title,
        location: scene.location,
        ...slots[index],
        cost: 0,
        actorIds,
        // Travel warnings are the producer's call after import; only real overlaps are refused.
        allowWarnings: true,
        notes,
      };
      try {
        await sceneService.createScene(payload);
      } catch (failure) {
        const { response } = failure as ApiConflictError;
        failed.push({ sceneNumber: numbers[index], reason: response?.status === 409 ? t('import.conflict') : (apiErrorMessage(failure) ?? t('import.saveError')) });
      }
      setProgress({ done: index + 1, total: chosen.length });
    }

    await refresh();
    setProgress(null);
    const created = chosen.length - failed.length;
    if (!failed.length) {
      toast(t('import.created', { count: created }));
      onClose();
      return;
    }
    if (created) toast(t('import.created', { count: created }));
    setFailures(failed);
  };

  // --- Result: some scenes could not be saved ---
  if (failures) {
    return (
      <Modal title={t('import.title')} onClose={onClose} width="max-w-lg" footer={<Button variant="primary" onClick={onClose}>{t('common.close')}</Button>}>
        <p className="text-sm">{t('import.partial', { created: chosen.length - failures.length, total: chosen.length })}</p>
        <p className="mt-3 text-[13px] text-fg-2">{t('import.failedScenes')}</p>
        <ul className="mt-2 space-y-1.5">
          {failures.map((failure) => (
            <li key={failure.sceneNumber} className="flex gap-2 text-[13px]">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-problem" />
              <span>
                <span className="tabular font-medium">{t('import.sceneLabel', { number: failure.sceneNumber })}</span>
                <span className="text-fg-2"> · {failure.reason}</span>
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    );
  }

  // --- Step 1: paste the script ---
  if (!breakdown) {
    return (
      <Modal
        title={t('import.title')}
        subtitle={t('import.subtitle')}
        onClose={onClose}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="primary" icon={Sparkles} loading={analyzing} disabled={!script.trim() || tooLong} onClick={analyze}>
              {t('import.analyze')}
            </Button>
          </>
        }
      >
        <Field
          label={t('import.scriptLabel')}
          htmlFor="si-script"
          hint={
            <span className={cn('text-xs tabular-nums', tooLong ? 'text-problem' : 'text-fg-3')}>
              {t('import.chars', { count: script.length.toLocaleString(), max: MAX_SCRIPT_CHARS.toLocaleString() })}
            </span>
          }
          error={tooLong ? t('import.tooLong') : undefined}
        >
          <Textarea
            id="si-script"
            autoFocus
            rows={14}
            value={script}
            onChange={(event) => setScript(event.target.value)}
            placeholder={t('import.placeholder')}
            className="font-mono text-[13px] leading-relaxed"
            disabled={analyzing}
          />
        </Field>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] hover:bg-raised">
            <FileUp className="size-4" />
            {t('import.loadFile')}
            <input type="file" accept=".txt,.fountain,text/plain" className="sr-only" onChange={loadFile} disabled={analyzing} />
          </label>
          {isDemo() && <p className="text-xs text-fg-3">{t('import.demoNote')}</p>}
        </div>
        {analyzing && <p className="mt-3 text-[13px] text-fg-2" aria-live="polite">{t('import.analyzing')}</p>}
        {error && <p role="alert" className="mt-3 text-[13px] text-problem">{error}</p>}
      </Modal>
    );
  }

  // --- Step 2: review, cast and schedule ---
  return (
    <Modal
      title={t('import.reviewTitle')}
      subtitle={t('import.summary', { scenes: breakdown.scenes.length, characters: breakdown.characters.length, locations: breakdown.locations.length })}
      onClose={progress ? () => undefined : onClose}
      width="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setBreakdown(null)} disabled={!!progress} className="mr-auto">
            {t('import.back')}
          </Button>
          <Button variant="primary" loading={!!progress} disabled={!chosen.length || invalidDay} onClick={create}>
            {progress ? t('import.creating', { done: progress.done, total: progress.total }) : t('import.create', { count: chosen.length })}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="text-[13px] font-semibold">{t('import.schedule')}</h3>
          <p className="mt-0.5 mb-3 text-[13px] text-fg-2">{t('import.scheduleHint', { gap: SCENE_GAP_MINUTES })}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_150px_150px]">
            <Field label={t('import.startDate')} htmlFor="si-date" className="col-span-2 sm:col-span-1">
              <Input id="si-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="tabular" />
            </Field>
            <Field label={t('import.dayStart')} htmlFor="si-open">
              <Input id="si-open" type="time" value={dayStart} onChange={(event) => setDayStart(event.target.value)} className="tabular" />
            </Field>
            <Field label={t('import.dayEnd')} htmlFor="si-close">
              <Input id="si-close" type="time" value={dayEnd} onChange={(event) => setDayEnd(event.target.value)} className="tabular" aria-invalid={invalidDay} />
            </Field>
          </div>
          {invalidDay && <p className="mt-1.5 text-[13px] text-problem">{t('import.invalidDay')}</p>}
        </section>

        {breakdown.characters.length > 0 && (
          <section>
            <h3 className="text-[13px] font-semibold">{t('import.cast')}</h3>
            <p className="mt-0.5 mb-3 text-[13px] text-fg-2">{actors.length ? t('import.castHint') : t('import.noActors')}</p>
            {actors.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {breakdown.characters.map((name) => (
                  <label key={name} className="flex items-center gap-3 text-[13px]">
                    <span className="w-28 shrink-0 truncate font-medium" title={name}>{name}</span>
                    <Select value={cast[name] ?? ''} onChange={(event) => setCast((current) => ({ ...current, [name]: event.target.value }))} className="h-8">
                      <option value="">{t('import.unassigned')}</option>
                      {actors.map((actor) => (
                        <option key={actor.id} value={actor.id}>
                          {actor.characterName ? `${actor.name} (${actor.characterName})` : actor.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="text-[13px] font-semibold">{t('import.scenes')}</h3>
            <button
              type="button"
              className="text-[13px] text-fg-2 underline-offset-2 hover:text-fg hover:underline"
              onClick={() => setSelected(selected.size === breakdown.scenes.length ? new Set() : new Set(breakdown.scenes.map((_, index) => index)))}
            >
              {selected.size === breakdown.scenes.length ? t('import.selectNone') : t('import.selectAll')}
            </button>
          </div>
          <ul className="divide-y divide-line rounded-md border border-line">
            {breakdown.scenes.map((scene, index) => {
              const slot = slotFor.get(scene);
              const on = selected.has(index);
              return (
                <li key={index}>
                  <label className={cn('flex cursor-pointer gap-3 px-3 py-2.5 transition-colors hover:bg-raised', !on && 'opacity-55')}>
                    <input type="checkbox" checked={on} onChange={() => toggle(index)} className="mt-1 size-4 shrink-0 accent-[var(--fg)]" />
                    <span className="tabular w-8 shrink-0 pt-px text-[13px] font-semibold">{scene.sceneNumber}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium">{scene.title}</span>
                      <span className="block text-xs text-fg-2">
                        {scene.setting}. {scene.location} · {scene.timeOfDay}
                      </span>
                      {scene.characters.length > 0 && <span className="mt-0.5 block text-xs text-fg-3">{scene.characters.join(', ')}</span>}
                    </span>
                    <span className="shrink-0 text-right text-xs text-fg-2">
                      {slot ? (
                        <>
                          <span className="block">{formatDate(slot.shootDate, language)}</span>
                          <span className="tabular block">{slot.startTime}–{slot.endTime}</span>
                        </>
                      ) : (
                        <span className="block">{formatDuration(scene.estimatedMinutes)}</span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
