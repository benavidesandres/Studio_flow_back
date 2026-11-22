import { CheckCheck, CircleCheck, Clock, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { Scene, ShootStatus } from '@/types';

export const STATUSES: ShootStatus[] = ['READY', 'DELAYED', 'PROBLEM', 'COMPLETED'];

export const STATUS_META: Record<ShootStatus, { icon: LucideIcon; color: string; dot: string }> = {
  READY: { icon: CircleCheck, color: 'text-ready', dot: 'bg-ready' },
  DELAYED: { icon: Clock, color: 'text-delayed', dot: 'bg-delayed' },
  PROBLEM: { icon: TriangleAlert, color: 'text-problem', dot: 'bg-problem' },
  COMPLETED: { icon: CheckCheck, color: 'text-done', dot: 'bg-done' },
};

export const byCallTime = (a: Scene, b: Scene) =>
  a.shootDate.localeCompare(b.shootDate) || a.startTime.localeCompare(b.startTime);

export const countByStatus = (scenes: Scene[]) => {
  const counts: Record<ShootStatus, number> = { READY: 0, DELAYED: 0, PROBLEM: 0, COMPLETED: 0 };
  scenes.forEach((scene) => {
    counts[scene.status] += 1;
  });
  return counts;
};
