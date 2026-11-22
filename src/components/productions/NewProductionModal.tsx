import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { toast } from '@/components/ui/toastStore';
import { productionService } from '@/services/productionService';
import { isoFromToday } from '@/lib/format';
import { useT } from '@/i18n/useT';

export function NewProductionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useT();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(isoFromToday(7));
  const [endDate, setEndDate] = useState(isoFromToday(45));
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidDates = endDate < startDate;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (invalidDates) return;
    setError(null);
    setSubmitting(true);
    try {
      await productionService.createProduction({
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        totalBudget: Number(budget) || 0,
      });
      toast(t('productions.created'));
      onCreated();
      onClose();
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('productions.new')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="production-form" loading={submitting} disabled={!title.trim() || invalidDates}>
            {t('productions.create')}
          </Button>
        </>
      }
    >
      <form id="production-form" onSubmit={submit} className="space-y-4">
        <Field label={t('productions.titleLabel')} htmlFor="pf-title">
          <Input id="pf-title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={t('productions.description')} htmlFor="pf-description">
          <Textarea id="pf-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('productions.start')} htmlFor="pf-start">
            <Input id="pf-start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="tabular" />
          </Field>
          <Field label={t('productions.end')} htmlFor="pf-end" error={invalidDates ? t('productions.invalidDates') : undefined}>
            <Input id="pf-end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="tabular" />
          </Field>
        </div>
        <Field label={t('productions.budgetUsd')} htmlFor="pf-budget">
          <Input id="pf-budget" type="number" min="0" step="1000" required value={budget} onChange={(e) => setBudget(e.target.value)} className="tabular" />
        </Field>
        {error && <p role="alert" className="text-[13px] text-problem">{error}</p>}
      </form>
    </Modal>
  );
}
