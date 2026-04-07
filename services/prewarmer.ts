import { fieldCache } from '../utils/cache';
import OrbitalWorker from '../utils/orbitalWorker.ts?worker&inline';

export interface PreWarmProgress {
  current: number;
  total: number;
  isDone: boolean;
}

export const startPreWarming = (onProgress: (p: PreWarmProgress) => void) => {
  const combinations: { n: number; l: number; m: number }[] = [];
  const resolution = 100;

  for (let n = 1; n <= 7; n++) {
    for (let l = 0; l < n; l++) {
      for (let m = -l; m <= l; m++) {
        const key = `${n}-${l}-${m}-${resolution}`;
        if (!fieldCache.has(key)) {
          combinations.push({ n, l, m });
        }
      }
    }
  }

  const total = combinations.length;
  let processed = 0;

  if (total === 0) {
    onProgress({ current: 0, total: 0, isDone: true });
    return;
  }

  // Use multiple workers based on hardware cores (max 4 to avoid over-taxing)
  const concurrency = Math.min(navigator.hardwareConcurrency || 2, 4);
  let activeWorkers = 0;

  const spawnWorker = () => {
    if (combinations.length === 0) {
      if (activeWorkers === 0) {
        onProgress({ current: processed, total, isDone: true });
      }
      return;
    }

    activeWorkers++;
    const { n, l, m } = combinations.shift()!;
    const maxR = n * n * 3.0 + 15;
    const key = `${n}-${l}-${m}-${resolution}`;

    const worker = new OrbitalWorker();
    
    worker.onmessage = (e) => {
      const { fieldPos, fieldNeg, maxPsi } = e.data;
      fieldCache.set(key, { fieldPos, fieldNeg, maxPsi });
      
      processed++;
      onProgress({ current: processed, total, isDone: false });
      
      worker.terminate();
      activeWorkers--;
      spawnWorker();
    };

    worker.postMessage({ n, l, m, resolution, maxR });
  };

  // Start initial batch
  for (let i = 0; i < concurrency; i++) {
    spawnWorker();
  }
};
