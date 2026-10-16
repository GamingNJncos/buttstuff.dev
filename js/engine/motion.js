export const reduced = typeof matchMedia !== 'undefined'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const mt = t => (reduced ? 0 : t);
