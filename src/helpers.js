export const lerp = (start, end, t) => start + (end - start) * t;
export const roundToStep = (val, step) => Math.round(val / step) * step;
export const clamp = (val, min, max) => Math.max(min, Math.min(val, max));