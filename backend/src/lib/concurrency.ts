// In-memory job slot acquire/release manager capped at 5 concurrent jobs
const MAX_CONCURRENT_JOBS = 5;
let activeJobCount = 0;

export function tryAcquireJob(): boolean {
  if (activeJobCount < MAX_CONCURRENT_JOBS) {
    activeJobCount++;
    return true;
  }
  return false;
}

export function releaseJob(): void {
  if (activeJobCount > 0) {
    activeJobCount--;
  }
}

export function getActiveJobCount(): number {
  return activeJobCount;
}
