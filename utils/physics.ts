/**
 * Physics Utility for Hydrogen Wavefunctions
 * Implements Rejection Sampling to generate probability clouds for orbitals.
 */

// Pre-calculate factorials for performance
const FACTORIALS = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000];

const factorial = (n: number): number => {
  if (n < 0) return 1;
  if (n < FACTORIALS.length) return FACTORIALS[n];
  let res = FACTORIALS[FACTORIALS.length - 1];
  for (let i = FACTORIALS.length; i <= n; i++) res *= i;
  return res;
};

// Generalized Laguerre Polynomial L_n^alpha(x)
const generalizedLaguerre = (n: number, alpha: number, x: number): number => {
  if (n === 0) return 1;
  if (n === 1) return 1 + alpha - x;
  
  let L_k_minus_2 = 1; // L_0
  let L_k_minus_1 = 1 + alpha - x; // L_1
  let L_k = 0;

  for (let k = 2; k <= n; k++) {
    L_k = ((2 * k - 1 + alpha - x) * L_k_minus_1 - (k - 1 + alpha) * L_k_minus_2) / k;
    L_k_minus_2 = L_k_minus_1;
    L_k_minus_1 = L_k;
  }
  return L_k;
};

// Associated Legendre Polynomial P_l^m(x)
const associatedLegendre = (l: number, m: number, x: number): number => {
  const amm = Math.abs(m);
  if (amm > l) return 0;

  let pmm = 1.0;
  if (amm > 0) {
    const somx2 = Math.sqrt((1.0 - x) * (1.0 + x));
    let fact = 1.0;
    for (let i = 1; i <= amm; i++) {
      pmm *= -fact * somx2;
      fact += 2.0;
    }
  }
  if (l === amm) return pmm;

  let pmmp1 = x * (2.0 * amm + 1.0) * pmm;
  if (l === amm + 1) return pmmp1;

  let pll = 0;
  for (let ll = amm + 2; ll <= l; ll++) {
    pll = ((2.0 * ll - 1.0) * x * pmmp1 - (ll + amm - 1.0) * pmm) / (ll - amm);
    pmm = pmmp1;
    pmmp1 = pll;
  }
  return pll;
};

// Full Wavefunction Psi(r, theta, phi)
// Optimized to pre-calculate constants that don't change during a single orbital generation
let currentPrefactors = { radial: 1, angular: 1 };

export const setupOrbitalConstants = (n: number, l: number, m: number) => {
  const n_l_1_fact = factorial(n - l - 1);
  const n_l_fact = factorial(n + l);
  const radialPrefactor = Math.sqrt(
    Math.pow(2.0 / n, 3) * (n_l_1_fact / (2.0 * n * n_l_fact))
  );
  
  const l_abs_m_fact = factorial(l - Math.abs(m));
  const l_plus_abs_m_fact = factorial(l + Math.abs(m));
  const angularPrefactor = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (l_abs_m_fact / l_plus_abs_m_fact));
  
  currentPrefactors = { radial: radialPrefactor, angular: angularPrefactor };
};

const radialWavefunction = (n: number, l: number, r: number): number => {
  const rho = (2.0 * r) / n;
  const laguerre = generalizedLaguerre(n - l - 1, 2 * l + 1, rho);
  return currentPrefactors.radial * Math.exp(-rho / 2.0) * Math.pow(rho, l) * laguerre;
};

const angularWavefunction = (l: number, m: number, theta: number, phi: number): number => {
  const P = associatedLegendre(l, m, Math.cos(theta));
  
  if (m > 0) return currentPrefactors.angular * P * Math.cos(m * phi) * Math.sqrt(2);
  if (m < 0) return currentPrefactors.angular * P * Math.sin(Math.abs(m) * phi) * Math.sqrt(2);
  return currentPrefactors.angular * P;
};

export const psi = (n: number, l: number, m: number, r: number, theta: number, phi: number): number => {
  return radialWavefunction(n, l, r) * angularWavefunction(l, m, theta, phi);
};


// Helper to get wavefunction value from Cartesian coordinates
export const getWavefunctionValue = (n: number, l: number, m: number, x: number, y: number, z: number): number => {
  const r = Math.sqrt(x*x + y*y + z*z);
  // Avoid division by zero at origin
  if (r < 1e-6) return 0; 
  
  // Clamp cos(theta) to [-1, 1] to avoid NaN due to floating point errors
  const cosTheta = Math.max(-1, Math.min(1, z / r));
  const theta = Math.acos(cosTheta);
  const phi = Math.atan2(y, x);
  return psi(n, l, m, r, theta, phi);
};

// Generate Point Cloud via Rejection Sampling
export const generateOrbitalPoints = (n: number, l: number, m: number, count: number): { positions: Float32Array, colors: Float32Array } => {
  setupOrbitalConstants(n, l, m);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  let accepted = 0;
  // Dynamic boundary based on n. n=1 -> ~12.5, n=7 -> ~130
  const maxR = n * n * 2.5 + 10; 
  
  // Heuristic for max probability density to optimize rejection sampling.
  // Density roughly scales inversely with n^3 (volume increase).
  // Lowering this for higher n prevents the loop from spinning infinitely finding rare points.
  const maxProbEst = 0.25 / (n * n * n * 0.1); 

  let attempts = 0;
  // Scale max attempts with n to ensure we find points for diffuse high-n orbitals
  const MAX_ATTEMPTS = count * 2000 * Math.sqrt(n); 

  while (accepted < count && attempts < MAX_ATTEMPTS) {
    attempts++;
    
    // Random point in spherical coordinates
    // We sample r linearly to cover the volume, but we must weight the rejection 
    // by the volume element r^2 sin(theta) to represent uniform 3D space correctly.
    const r = Math.random() * maxR;
    const theta = Math.random() * Math.PI;
    const phi = Math.random() * 2 * Math.PI;

    const wavefunctionVal = psi(n, l, m, r, theta, phi);
    const probabilityDensity = wavefunctionVal * wavefunctionVal;
    
    // Weight by volume element for visual correctness in 3D uniform space
    const targetP = probabilityDensity * r * r * Math.sin(theta);

    // Rejection check
    if (Math.random() < targetP / maxProbEst) {
      // Convert to Cartesian
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      // Store Position
      positions[accepted * 3] = x;
      positions[accepted * 3 + 1] = y;
      positions[accepted * 3 + 2] = z;

      // Color based on phase (sign of wavefunction)
      if (wavefunctionVal > 0) {
        // Cyan (#0ea5e9)
        colors[accepted * 3] = 0.05;     
        colors[accepted * 3 + 1] = 0.65; 
        colors[accepted * 3 + 2] = 0.91; 
      } else {
        // Orange (#f97316)
        colors[accepted * 3] = 0.98;     
        colors[accepted * 3 + 1] = 0.45; 
        colors[accepted * 3 + 2] = 0.09; 
      }

      accepted++;
    }
  }

  // If we timed out, fill the rest with the last point (or 0) to avoid glitches
  while (accepted < count) {
    positions[accepted * 3] = 0;
    positions[accepted * 3 + 1] = 0;
    positions[accepted * 3 + 2] = 0;
    accepted++;
  }

  return { positions, colors };
};