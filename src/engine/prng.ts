// Mulberry32 deterministic Pseudo-Random Number Generator (PRNG)
// Seeded for 100% reproducible baseline and synthetic simulation data

export class Mulberry32 {
  private state: number;

  constructor(seed: number = 26255) {
    this.state = seed >>> 0;
  }

  // Returns pseudo-random float in [0, 1)
  next(): number {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns integer in [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Returns float in [min, max]
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Returns standard normal sample (Box-Muller)
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.max(1e-10, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

export const defaultPrng = new Mulberry32(26255);
