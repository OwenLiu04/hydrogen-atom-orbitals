// Unrestricted cache for maximum performance
export const fieldCache = new Map<string, { 
  fieldPos: Float32Array, 
  fieldNeg: Float32Array, 
  maxPsi: number 
}>();
