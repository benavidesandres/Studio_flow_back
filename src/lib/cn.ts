import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const merge = extendTailwindMerge({ extend: { classGroups: { 'font-family': ['tabular'] } } });

export const cn = (...inputs: ClassValue[]) => merge(clsx(inputs));
