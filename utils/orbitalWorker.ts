import { psi, setupOrbitalConstants } from './physics';

const ctx: DedicatedWorkerGlobalScope = self as any;

ctx.onmessage = (e) => {
  const { n, l, m, resolution, maxR } = e.data;
  
  setupOrbitalConstants(n, l, m);
  
  const fieldPos = new Float32Array(resolution * resolution * resolution);
  const fieldNeg = new Float32Array(resolution * resolution * resolution);
  let maxPsi = 0;

  // Pre-calculate X and Y related values to save time in the innermost loop
  const xValues = new Float32Array(resolution);
  const yValues = new Float32Array(resolution);
  const zValues = new Float32Array(resolution);
  
  for (let i = 0; i < resolution; i++) {
    const val = ((i / resolution) - 0.5) * 2 * maxR;
    xValues[i] = val;
    yValues[i] = val;
    zValues[i] = val;
  }

  // Pre-calculate XY plane data
  const xyR2 = new Float32Array(resolution * resolution);
  const xyPhi = new Float32Array(resolution * resolution);
  for (let j = 0; j < resolution; j++) {
    const y = yValues[j];
    const y2 = y * y;
    for (let i = 0; i < resolution; i++) {
      const x = xValues[i];
      const idx = j * resolution + i;
      xyR2[idx] = x * x + y2;
      xyPhi[idx] = Math.atan2(y, x);
    }
  }

  for (let k = 0; k < resolution; k++) {
    const z = zValues[k];
    const z2 = z * z;
    const kOffset = k * resolution * resolution;

    for (let j = 0; j < resolution; j++) {
      const jOffset = j * resolution;
      for (let i = 0; i < resolution; i++) {
        const xyIdx = jOffset + i;
        const r2 = xyR2[xyIdx] + z2;
        const r = Math.sqrt(r2);
        
        if (r < 1e-6) continue;

        const theta = Math.acos(Math.max(-1, Math.min(1, z / r)));
        const phi = xyPhi[xyIdx];
        
        const psiVal = psi(n, l, m, r, theta, phi);
        const absPsi = Math.abs(psiVal);
        if (absPsi > maxPsi) maxPsi = absPsi;
        
        const idx = kOffset + xyIdx;
        fieldPos[idx] = psiVal;
        fieldNeg[idx] = -psiVal;
      }
    }
  }

  ctx.postMessage({ fieldPos, fieldNeg, maxPsi }, [fieldPos.buffer, fieldNeg.buffer]);
};
