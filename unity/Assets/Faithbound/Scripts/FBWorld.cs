// Faithbound for Unity — world generation: heights, moisture, rivers and biomes, ported from sim.js genWorld().
using System;
using System.Collections.Generic;

namespace Faithbound
{
    public enum Biome : byte { DeepSea, Shallows, Ice, Beach, Grassland, Forest, Jungle, Desert, Savanna, Taiga, Tundra, Hills, Peaks }

    [Serializable]
    public class WorldOptions
    {
        public float land = .5f, frag = 1f, mtn = 1f, rain = .5f, rivers = 1f, temp = .5f;
    }

    public sealed class World
    {
        public struct Size { public int W, H; public double sc; public Size(int w, int h, double s) { W = w; H = h; sc = s; } }
        public static readonly Dictionary<string, Size> Sizes = new Dictionary<string, Size>
        {
            { "tiny", new Size(80, 60, 2.6) }, { "small", new Size(112, 84, 3) }, { "medium", new Size(144, 108, 3.4) }, { "large", new Size(192, 144, 3.8) },
        };
        static readonly int[] DX = { 1, -1, 0, 0 }, DY = { 0, 0, 1, -1 };

        public int W, H, N, Seed;
        public string SizeKey;
        public float[] h, baseMoist, moistD;
        public byte[] biome, river;
        public List<List<int>> rivers = new List<List<int>>();
        public double sea = .44;
        public WorldOptions opts;

        public bool IsWater(int i) => biome[i] == (byte)Biome.DeepSea || biome[i] == (byte)Biome.Shallows;
        /// <summary>Tile centre in world units, as wx()/wz() in core.js.</summary>
        public float WX(int x) => x - W / 2f + .5f;
        public float WZ(int y) => y - H / 2f + .5f;

        public static World Generate(int seed, string sizeKey, WorldOptions o)
        {
            var w = new World();
            w.Build(seed, sizeKey, o ?? new WorldOptions());
            return w;
        }

        void Build(int seed, string sizeKey, WorldOptions o)
        {
            opts = o; SizeKey = sizeKey; Seed = seed;
            var S = Sizes.ContainsKey(sizeKey) ? Sizes[sizeKey] : Sizes["medium"];
            W = S.W; H = S.H; N = W * H;
            FB.HSeed = (seed % 9973) / 7.0;
            var n1 = new Noise(seed); var n2 = new Noise(seed + 77); var n3 = new Noise(seed + 191);
            double sc = S.sc * o.frag;
            h = new float[N]; baseMoist = new float[N]; moistD = new float[N]; biome = new byte[N];
            double mn = 9, mx = -9, mm = 9, mM = -9;
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x++)
            {
                int i = y * W + x; double nx = (double)x / W, ny = (double)y / H;
                double e = n1.Sample(nx * sc, ny * sc * H / W * 1.35, 6);
                double ridge = 1 - Math.Abs(n3.Sample(nx * sc * 1.6, ny * sc * 1.6, 4) - .5) * 2;
                e += Math.Pow(ridge, 3) * .18 * (e > .5 ? 1 : .3);
                h[i] = (float)e; mn = Math.Min(mn, e); mx = Math.Max(mx, e);
                double m = n2.Sample(nx * sc * 1.4, ny * sc * 1.4, 4); baseMoist[i] = (float)m; mm = Math.Min(mm, m); mM = Math.Max(mM, m);
            }
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x++)
            {
                int i = y * W + x; double dx = ((double)x / (W - 1) - .5) * 2, dy = ((double)y / (H - 1) - .5) * 2, d = Math.Sqrt(dx * dx * .85 + dy * dy);
                h[i] = (float)FB.Clamp((h[i] - mn) / (mx - mn) * .95 + .12 - Math.Pow(d, 2.6) * .45, 0, 1);
                baseMoist[i] = (float)((baseMoist[i] - mm) / (mM - mm));
            }
            {   // the world sliders: share of land, and how rugged it is
                double L = FB.Clamp(o.land, .1, .9); var srt = (float[])h.Clone(); Array.Sort(srt);
                double q = srt[(int)Math.Floor((1 - L) * (N - 1))], sh = .44 - q, mt = o.mtn;
                double A = .01; for (int i = 0; i < N; i++) A = Math.Max(A, h[i] + sh - .44);
                double D = .01; for (int i = 0; i < N; i++) D = Math.Max(D, .44 - (h[i] + sh));
                for (int i = 0; i < N; i++) { double v = h[i] + sh; if (v > .44) v = .44 + .56 * mt * Math.Pow((v - .44) / A, 1.75); else v = .44 - .38 * Math.Pow((.44 - v) / D, .6); h[i] = (float)FB.Clamp(v, 0, 1); }
            }
            GenRivers(new Mulberry32(seed ^ 0x2545F491));
            ComputeTerrain();
        }

        /* rivers: least-cost paths from wet highlands to the sea, carved into the land (genRivers in sim.js) */
        void GenRivers(Mulberry32 rng)
        {
            river = new byte[N]; rivers.Clear();
            int baseCount = SizeKey == "tiny" ? 6 : SizeKey == "small" ? 9 : SizeKey == "medium" ? 13 : SizeKey == "large" ? 18 : 9;
            int want = (int)Math.Round(baseCount * opts.rivers);
            var src = new List<int>();
            for (int q = 0; q < 4000 && src.Count < want * 4; q++) { int i = (int)(rng.Next() * N); if (h[i] > sea + .16 && h[i] < sea + .42 && baseMoist[i] > .38) src.Add(i); }
            var used = new List<int>();
            var dist = new float[N]; var prev = new int[N];
            foreach (int s in src)
            {
                if (rivers.Count >= want) break;
                int sx = s % W, sy = s / W; bool near = false;
                foreach (int u in used) if (Math.Sqrt(Math.Pow(u % W - sx, 2) + Math.Pow(u / W - sy, 2)) < 7) { near = true; break; }
                if (near) continue;
                for (int i = 0; i < N; i++) { dist[i] = 1e9f; prev[i] = -1; }
                var open = new List<int> { s }; dist[s] = 0; int end = -1, it = 0;
                while (open.Count > 0 && it++ < 6000)
                {
                    int bi = 0; for (int q = 1; q < open.Count; q++) if (dist[open[q]] < dist[open[bi]]) bi = q;
                    int i = open[bi]; open[bi] = open[open.Count - 1]; open.RemoveAt(open.Count - 1);
                    if (h[i] < sea || (river[i] != 0 && i != s)) { end = i; break; }
                    int x = i % W, y = i / W;
                    for (int d = 0; d < 4; d++)
                    {
                        int X = x + DX[d], Y = y + DY[d]; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; int j = Y * W + X;
                        float c = (float)(dist[i] + 1 + Math.Max(0, h[j] - h[i]) * 80 + h[j] * 3);
                        if (c < dist[j]) { if (dist[j] >= 1e9f) open.Add(j); dist[j] = c; prev[j] = i; }
                    }
                }
                if (end < 0) continue;
                var path = new List<int>(); for (int k = end; k != -1; k = prev[k]) path.Add(k); path.Reverse();
                if (path.Count < 6) continue;
                double cur = h[path[0]]; var tiles = new List<int>();
                for (int k = 0; k < path.Count; k++)
                {
                    int t = path[k]; bool last = k == path.Count - 1;
                    if (!last || h[t] >= sea)
                    {
                        h[t] = (float)Math.Max(sea + (last ? -.01 : .004), Math.Min(h[t], cur - .0025) - .006); cur = h[t];
                        for (int d = 0; d < 4; d++)
                        {
                            int X = t % W + DX[d], Y = t / W + DY[d]; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; int j = Y * W + X;
                            if (river[j] == 0 && h[j] > h[t]) h[j] = (float)Math.Max(h[t] + .004, h[j] - .008);
                            baseMoist[j] = Math.Min(1f, baseMoist[j] + .12f);
                        }
                    }
                    river[t] = (byte)Math.Min(4, Math.Max(river[t], 1 + k / 7)); tiles.Add(t);
                }
                rivers.Add(tiles); used.Add(s);
            }
        }

        static double Vq(int a, int b, int k) => FB.Hash((a + k) * 157.31 + (b - k) * 311.7);
        static double Vn(int x, int y, int s, int k)
        {
            int X = (int)Math.Floor((double)x / s), Y = (int)Math.Floor((double)y / s); double fx = (double)x / s - X, fy = (double)y / s - Y;
            double u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
            return FB.Lerp(FB.Lerp(Vq(X, Y, k), Vq(X + 1, Y, k), u), FB.Lerp(Vq(X, Y + 1, k), Vq(X + 1, Y + 1, k), u), v);
        }

        bool NearSea(int x, int y)
        {
            for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++)
            { int X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) return true; if (h[Y * W + X] < sea) return true; }
            return false;
        }

        /* temperature from latitude, height and weather fronts, then biomes (computeTerrain in sim.js) */
        public void ComputeTerrain()
        {
            double temp = opts.temp;
            sea = .44 + (temp - .5) * .16;
            var TN = new float[N];
            int off = (int)Math.Floor(h[N / 3] * 9973.0) % 97;
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) TN[y * W + x] = (float)(Vn(x, y, 9, 3 + off) * .6 + Vn(x, y, 4, 11 + off) * .3 + Vn(x, y, 2, 29 + off) * .1 - .5);
            var TT = new float[N];
            for (int y = 0; y < H; y++)
            {
                double lat = 1 - Math.Abs((double)y / (H - 1) - .5) * 2;
                for (int x = 0; x < W; x++) { int i = y * W + x; double alt = h[i] - sea; TT[i] = (float)(lat * .85 + (temp - .5) * .75 + .08 - Math.Max(0, alt) * 1.25 + TN[i] * .22); }
            }
            for (int pass = 0; pass < 3; pass++)
            {
                var T2 = (float[])TT.Clone();
                for (int y = 1; y < H - 1; y++) for (int x = 1; x < W - 1; x++)
                { int i = y * W + x, ice = 0; for (int d = 0; d < 4; d++) if (TT[i + DX[d] + DY[d] * W] < .1) ice++; if (ice > 0) T2[i] -= ice * .012f; }
                TT = T2;
            }
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x++)
            {
                int i = y * W + x; double alt = h[i] - sea, t = TT[i], m = FB.Clamp(baseMoist[i] + (opts.rain - .5) * .7 + moistD[i], 0, 1);
                Biome b;
                if (alt < 0) b = t + TN[i] * .1 < .1 ? Biome.Ice : (alt > -.06 ? Biome.Shallows : Biome.DeepSea);
                else if (alt > .38) b = Biome.Peaks; else if (alt > .26) b = Biome.Hills; else if (t < .1) b = Biome.Tundra; else if (t < .22) b = Biome.Taiga;
                else if (alt < .012 && NearSea(x, y)) b = Biome.Beach; else if (t > .6 && m < .3) b = Biome.Desert; else if (t > .55 && m < .45) b = Biome.Savanna;
                else if (t > .62 && m > .62) b = Biome.Jungle; else if (m > .52) b = Biome.Forest; else b = Biome.Grassland;
                biome[i] = (byte)b;
            }
        }
    }
}
