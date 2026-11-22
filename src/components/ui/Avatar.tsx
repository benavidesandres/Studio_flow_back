import { cn } from '@/lib/cn';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

interface Person {
  id?: number;
  name: string;
  avatarUrl?: string;
}

export function Avatar({ person, size = 28, className }: { person: Person; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  const base = 'inline-flex shrink-0 items-center justify-center rounded-full';

  if (person.avatarUrl) {
    return <img src={person.avatarUrl} alt={person.name} title={person.name} style={style} className={cn(base, 'object-cover', className)} />;
  }
  return (
    <span style={style} title={person.name} aria-label={person.name} className={cn(base, 'bg-line-strong font-medium text-fg select-none', className)}>
      {initials(person.name)}
    </span>
  );
}

export function AvatarStack({ people, max = 3, size = 26 }: { people: Person[]; max?: number; size?: number }) {
  const shown = people.slice(0, max);
  const hidden = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((person, index) => (
        <Avatar key={person.id ?? person.name} person={person} size={size} className={index > 0 ? 'ml-0.5' : undefined} />
      ))}
      {hidden > 0 && <span className="tabular ml-1.5 text-xs text-fg-3">+{hidden}</span>}
    </div>
  );
}
