// Faithbound for Unity — the same random numbers and noise as the browser game, so a seed builds the same land.
using System;

namespace Faithbound
{
    /// <summary>mulberry32, bit for bit as in core.js.</summary>
    public sealed class Mulberry32
    {
        uint a;
        public Mulberry32(int seed) { a = unchecked((uint)seed); }
        public double Next()
        {
            unchecked
            {
                a += 0x6D2B79F5u;
                uint t = (a ^ (a >> 15)) * (1u | a);
                t = (t + ((t ^ (t >> 7)) * (61u | t))) ^ t;
                return (t ^ (t >> 14)) / 4294967296.0;
            }
        }
    }

    /// <summary>Value noise with octaves, as makeNoise() in core.js.</summary>
    public sealed class Noise
    {
        readonly ushort[] P = new ushort[512];
        readonly float[] G = new float[256];
        public Noise(int seed)
        {
            var r = new Mulberry32(seed);
            var p = new int[256];
            for (int i = 0; i < 256; i++) p[i] = i;
            for (int i = 255; i > 0; i--) { int j = (int)Math.Floor(r.Next() * (i + 1)); int t = p[i]; p[i] = p[j]; p[j] = t; }
            for (int i = 0; i < 512; i++) P[i] = (ushort)p[i & 255];
            for (int i = 0; i < 256; i++) G[i] = (float)r.Next();
        }
        static double Fade(double t) => t * t * (3 - 2 * t);
        double Gv(int x, int y) => G[P[(x & 255) + P[y & 255]]];
        double V(double x, double y)
        {
            int xi = (int)Math.Floor(x), yi = (int)Math.Floor(y);
            double xf = x - xi, yf = y - yi;
            double a = Gv(xi, yi), b = Gv(xi + 1, yi), c = Gv(xi, yi + 1), d = Gv(xi + 1, yi + 1);
            double u = Fade(xf), w = Fade(yf);
            return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
        }
        public double Sample(double x, double y, int oct)
        {
            double s = 0, amp = 1, f = 1, n = 0;
            for (int o = 0; o < oct; o++) { s += V(x * f + o * 17.3, y * f + o * 9.1) * amp; n += amp; amp *= .5; f *= 2; }
            return s / n;
        }
    }

    public static class FB
    {
        /// <summary>hseed in the browser: (seed % 9973) / 7.</summary>
        public static double HSeed = 1;
        public static double Hash(double i) { double s = Math.Sin(i * 12.9898 + HSeed * 78.233) * 43758.5453; return s - Math.Floor(s); }
        public static double Clamp(double v, double a, double b) => v < a ? a : v > b ? b : v;
        public static double Lerp(double a, double b, double t) => a + (b - a) * t;
        public static double Smooth(double a, double b, double t) { t = Clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
        /// <summary>JS "x|0": truncate towards zero into an int.</summary>
        public static int ToInt(double v) => unchecked((int)(long)Math.Truncate(v));
    }
}
