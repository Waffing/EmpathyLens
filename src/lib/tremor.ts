export interface Point { x: number; y: number }
export interface SpringState extends Point { vx: number; vy: number }
export interface TargetRect { id: string; left: number; top: number; width: number; height: number }
export function tremorTarget(seconds: number, level: number): Point {
  if (level <= 0) return { x: 0, y: 0 };
  const amplitude = Math.max(0, Math.min(10, level)) * 3.6;
  return { x: amplitude * (Math.sin(2 * Math.PI * 4.7 * seconds) * 0.72 + Math.sin(2 * Math.PI * 5.9 * seconds + 1.2) * 0.28), y: amplitude * (Math.sin(2 * Math.PI * 5.2 * seconds + 0.7) * 0.7 + Math.sin(2 * Math.PI * 4.1 * seconds + 2) * 0.3) };
}
export function stepTremor(state: SpringState, seconds: number, dt: number, level: number): SpringState {
  if (level <= 0) return { x: 0, y: 0, vx: 0, vy: 0 };
  const target = tremorTarget(seconds, level);
  const step = Math.min(0.025, Math.max(0.001, dt));
  const vx = state.vx + ((target.x - state.x) * 2600 - state.vx * 60) * step;
  const vy = state.vy + ((target.y - state.y) * 2600 - state.vy * 60) * step;
  return { x: state.x + vx * step, y: state.y + vy * step, vx, vy };
}
export function hitTarget(point: Point, targets: TargetRect[], buffer = 0): string | null {
  const direct = targets.find(r => point.x >= r.left && point.x <= r.left + r.width && point.y >= r.top && point.y <= r.top + r.height);
  if (direct) return direct.id;
  if (!buffer) return null;
  const nearby = targets.map(r => ({ id: r.id, distance: Math.hypot(Math.max(r.left - point.x, 0, point.x - r.left - r.width), Math.max(r.top - point.y, 0, point.y - r.top - r.height)) })).filter(r => r.distance <= buffer).sort((a, b) => a.distance - b.distance);
  return nearby[0]?.id ?? null;
}
