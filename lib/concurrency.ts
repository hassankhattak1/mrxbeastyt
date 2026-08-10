// Simple in-memory concurrency limiter to protect server under heavy download loads
const MAX_CONCURRENT_JOBS = 5;
let activeJobsCount = 0;

export function tryAcquireJob(): boolean {
  if (activeJobsCount >= MAX_CONCURRENT_JOBS) {
    return false;
  }
  activeJobsCount++;
  return true;
}

export function releaseJob(): void {
  if (activeJobsCount > 0) {
    activeJobsCount--;
  }
}

export function getActiveJobsCount(): number {
  return activeJobsCount;
}
