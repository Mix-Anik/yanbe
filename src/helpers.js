import { ANIMATION, BEZIER_STRENGTH } from './constants.js';

export const lerp = (start, end, t) => start + (end - start) * t;
export const roundToStep = (val, step) => Math.round(val / step) * step;
export const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

export function cubicBezierPath(x1, y1, x2, y2, strength = BEZIER_STRENGTH) {
    return `M ${x1} ${y1} C ${x1 + strength} ${y1}, ${x2 - strength} ${y2}, ${x2} ${y2}`;
}

export function animateToWishPos(node, onUpdate) {
    const step = () => {
        node.x = lerp(node.x, node.wishPos.x, ANIMATION.LERP_FACTOR);
        node.y = lerp(node.y, node.wishPos.y, ANIMATION.LERP_FACTOR);
        node.element.style.left = `${node.x}px`;
        node.element.style.top = `${node.y}px`;
        node.redrawConnections();
        onUpdate?.();

        if (Math.abs(node.x - node.wishPos.x) > ANIMATION.STOP_THRESHOLD ||
            Math.abs(node.y - node.wishPos.y) > ANIMATION.STOP_THRESHOLD)
            requestAnimationFrame(step);
        else
            node.animating = false;
    };
    requestAnimationFrame(step);
}
