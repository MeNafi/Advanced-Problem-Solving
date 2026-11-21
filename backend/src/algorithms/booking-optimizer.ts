/**
 * Algorithm 2 - Minimum bundle booking.
 *
 * Classic minimum coin change solved with bottom-up dynamic programming:
 *   dp[i]     = fewest bundles that add up to exactly i seats
 *   choice[i] = the last bundle size used in an optimal solution for i
 * The bundle combination is rebuilt by walking choice[] back from the group size.
 * Implemented from scratch - no optimisation libraries.
 */

export const MIN_BUNDLE_SIZE = 1;
export const MAX_BUNDLE_SIZE = 500;
export const MAX_BUNDLES_PER_CINEMA = 10;
export const MIN_GROUP_SIZE = 1;
export const MAX_GROUP_SIZE = 10_000;

export interface BundleQuantity {
  size: number;
  quantity: number;
}

export interface BookingResult {
  possible: boolean;
  groupSize: number;
  totalBundles: number;
  bundles: BundleQuantity[];
  totalSeats: number;
}

export class BookingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingInputError';
  }
}

function assertValidInput(bundleSizes: number[], groupSize: number): void {
  if (!Number.isInteger(groupSize) || groupSize < MIN_GROUP_SIZE || groupSize > MAX_GROUP_SIZE) {
    throw new BookingInputError(`Group size must be an integer between ${MIN_GROUP_SIZE} and ${MAX_GROUP_SIZE}.`);
  }
  if (!Array.isArray(bundleSizes) || bundleSizes.length < 1 || bundleSizes.length > MAX_BUNDLES_PER_CINEMA) {
    throw new BookingInputError(`Bundle sizes must contain between 1 and ${MAX_BUNDLES_PER_CINEMA} values.`);
  }
  for (const size of bundleSizes) {
    if (!Number.isInteger(size) || size < MIN_BUNDLE_SIZE || size > MAX_BUNDLE_SIZE) {
      throw new BookingInputError(`Each bundle size must be an integer between ${MIN_BUNDLE_SIZE} and ${MAX_BUNDLE_SIZE}.`);
    }
  }
  if (new Set(bundleSizes).size !== bundleSizes.length) {
    throw new BookingInputError('Bundle sizes must be unique.');
  }
}

export function findMinimumBundles(bundleSizes: number[], groupSize: number): BookingResult {
  assertValidInput(bundleSizes, groupSize);

  const dp: number[] = new Array<number>(groupSize + 1).fill(Infinity);
  const choice: number[] = new Array<number>(groupSize + 1).fill(0);
  dp[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of bundleSizes) {
      if (size > seats) continue;
      const candidate = dp[seats - size] + 1;
      if (candidate < dp[seats]) {
        dp[seats] = candidate;
        choice[seats] = size;
      }
    }
  }

  if (!Number.isFinite(dp[groupSize])) {
    return { possible: false, groupSize, totalBundles: 0, bundles: [], totalSeats: 0 };
  }

  // Reconstruct the combination
  const counts = new Map<number, number>();
  let remaining = groupSize;
  while (remaining > 0) {
    const size = choice[remaining];
    counts.set(size, (counts.get(size) ?? 0) + 1);
    remaining -= size;
  }

  const bundles: BundleQuantity[] = [...counts.entries()]
    .map(([size, quantity]) => ({ size, quantity }))
    .sort((a, b) => b.size - a.size);

  return {
    possible: true,
    groupSize,
    totalBundles: dp[groupSize],
    bundles,
    totalSeats: bundles.reduce((sum, b) => sum + b.size * b.quantity, 0),
  };
}
