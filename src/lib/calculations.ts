import type { InspectionItem, ChecklistItemStatus } from '../types/index.ts';

/**
 * Calculates transparent infrastructure compliance percentage according to MSDE standards.
 * Formula: Compliant items / Total applicable inspected items * 100.
 * If 0 applicable items have been inspected, returns null ("Not assessed").
 */
export function calculateComplianceScore(items: (InspectionItem | { status: ChecklistItemStatus })[]): {
  percentage: number | null;
  formatted: string;
  totalItems: number;
  inspectedCount: number;
  compliantCount: number;
  nonCompliantCount: number;
  needsReviewCount: number;
  notInspectedCount: number;
} {
  const totalItems = items.length;
  let compliantCount = 0;
  let nonCompliantCount = 0;
  let needsReviewCount = 0;
  let notInspectedCount = 0;

  for (const item of items) {
    switch (item.status) {
      case 'compliant':
        compliantCount++;
        break;
      case 'non_compliant':
        nonCompliantCount++;
        break;
      case 'needs_review':
        needsReviewCount++;
        break;
      case 'not_inspected':
      default:
        notInspectedCount++;
        break;
    }
  }

  // Applicable inspected items exclude 'not_inspected'
  const inspectedCount = compliantCount + nonCompliantCount + needsReviewCount;

  if (inspectedCount === 0) {
    return {
      percentage: null,
      formatted: 'Not assessed',
      totalItems,
      inspectedCount: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      needsReviewCount: 0,
      notInspectedCount,
    };
  }

  const rawPercentage = (compliantCount / inspectedCount) * 100;
  const roundedPercentage = Math.round(rawPercentage * 10) / 10;

  return {
    percentage: roundedPercentage,
    formatted: `${roundedPercentage}%`,
    totalItems,
    inspectedCount,
    compliantCount,
    nonCompliantCount,
    needsReviewCount,
    notInspectedCount,
  };
}

/**
 * Calculates attendance rate for a session or daily batch
 */
export function calculateAttendanceRate(actualCount: number, enrolledCount: number): {
  rate: number;
  formatted: string;
  isDeficit: boolean;
} {
  if (!enrolledCount || enrolledCount <= 0) {
    return { rate: 0, formatted: '0%', isDeficit: false };
  }
  const rate = Math.min(100, Math.round((actualCount / enrolledCount) * 100));
  return {
    rate,
    formatted: `${rate}%`,
    isDeficit: rate < 70, // Flag if below 70% threshold
  };
}

/**
 * Format relative date/time cleanly without external heavyweight libraries
 */
export function formatTimeAgo(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
}

