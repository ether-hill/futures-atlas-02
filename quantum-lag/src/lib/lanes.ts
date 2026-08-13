/*
  Label packing for the master timeline.

  A simple sweep: sort by x, place each label in the first lane whose right edge
  clears the new label's left edge minus 10px. Lane step is 52px, because the
  blocks are about 43px tall, so anything less collides.
*/

export const LANE_STEP = 52;
const CLEARANCE = 10;

export type Packable = {
  /** Left edge of the label, in px, measured from the container's left. */
  x: number;
  width: number;
};

export function packLanes<T extends Packable>(
  items: T[],
): (T & { lane: number })[] {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const laneRight: number[] = [];

  return sorted.map((item) => {
    let lane = 0;
    while (lane < laneRight.length && laneRight[lane]! > item.x - CLEARANCE) {
      lane += 1;
    }
    laneRight[lane] = item.x + item.width;
    return { ...item, lane };
  });
}

export function laneCount(packed: { lane: number }[]): number {
  return packed.reduce((max, item) => Math.max(max, item.lane + 1), 0);
}

/**
 * Label width, estimated from the text rather than measured. Good enough for
 * packing; the sweep only needs to know roughly how far each block runs.
 */
export function estimateWidth(yearText: string, title: string, reading: string) {
  // Saira Condensed 20px for the year, Archivo 14px for the title, and the
  // letterspaced 11px caption underneath. Rounded up rather than down: a label
  // packed too wide leaves a gap, one packed too narrow overlaps its neighbour.
  const line1 = yearText.length * 13 + 10 + title.length * 8.2;
  const line2 = reading.length * 8;
  return Math.max(line1, line2) + 14;
}
