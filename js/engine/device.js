export function isMobileLike({ coarse, hover, width }) {
  return (coarse && !hover) || width < 700;
}

// Dev URL parameters (?floor, ?skipboot, ?x, ?armed, ?hell, ?heaven) work only on a local preview server; on the
// published site they are ignored completely.
export const DEV_HOSTS = ['localhost', '127.0.0.1'];
export const isDevHost = hostname => DEV_HOSTS.includes(String(hostname ?? '').toLowerCase());

// The dev parameters actually in effect for this page: empty everywhere but a dev host.
export const devParams = (search, hostname) => (isDevHost(hostname) ? new URLSearchParams(search) : new URLSearchParams());

export function detectMobile() {
  if (typeof matchMedia === 'undefined') return false;
  return isMobileLike({
    coarse: matchMedia('(pointer: coarse)').matches,
    hover: matchMedia('(hover: hover)').matches,
    width: innerWidth,
  });
}
