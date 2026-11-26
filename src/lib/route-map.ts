import type { RouteStop } from '../content';

export interface ProjectedPoint {
  x: number;
  y: number;
  stop: RouteStop;
  i: number;
}

const PAD = 28;

export function withCoordinates(stops: RouteStop[]): RouteStop[] {
  return stops.filter((s) => s.lat != null && s.lng != null);
}

export function projectStops(
  stops: RouteStop[],
  width: number,
  height: number,
  padding = PAD,
): { points: ProjectedPoint[]; pathD: string } {
  const plotted = withCoordinates(stops);
  if (plotted.length < 2) return { points: [], pathD: '' };

  const lats = plotted.map((s) => s.lat!);
  const lngs = plotted.map((s) => s.lng!);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const project = (lat: number, lng: number) => {
    const x = padding + ((lng - minLng) / (maxLng - minLng || 1)) * innerW;
    const y = height - padding - ((lat - minLat) / (maxLat - minLat || 1)) * innerH;
    return { x, y };
  };

  const points: ProjectedPoint[] = plotted.map((stop, i) => {
    const { x, y } = project(stop.lat!, stop.lng!);
    return { x, y, stop, i };
  });

  const pathD = points
    .map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  return { points, pathD };
}

/** Endpoints only — for compact list-card maps. */
export function labeledEndpoints(stops: RouteStop[]): RouteStop[] {
  const plotted = withCoordinates(stops);
  if (plotted.length < 2) return plotted;
  return [plotted[0], plotted[plotted.length - 1]];
}

export function shortStopLabel(name: string, max = 22): string {
  const n = name.trim();
  if (n.length <= max) return n;
  return `${n.slice(0, max - 1)}…`;
}
