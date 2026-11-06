// Faithbound for Unity — forests and trees, placed by biome and drawn in instanced batches (one draw per kind and patch of land).
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace Faithbound
{
    public sealed class FBForest
    {
        enum Kind { Conifer, Broad, Acacia, Bush }
        const int PATCH = 12;   // tiles per side of one batch, so whole patches outside the view are skipped

        sealed class Batch { public Mesh mesh; public Material[] mats; public Matrix4x4[] m; public int n; public Bounds b; }
        readonly List<Batch> batches = new List<Batch>();
        readonly Dictionary<Kind, Mesh> meshes = new Dictionary<Kind, Mesh>();
        readonly Material trunk;
        readonly Dictionary<(Kind, int), Material> leaves = new Dictionary<(Kind, int), Material>();
        public int Count { get; private set; }

        public FBForest(Func<Color, float, Material> lit)
        {
            trunk = lit(new Color32(92, 66, 44, 255), .05f);
            Color[][] tints = {
                new Color[]{ new Color32(40,74,48,255), new Color32(48,86,52,255), new Color32(58,96,58,255) },     // conifer
                new Color[]{ new Color32(70,110,48,255), new Color32(84,124,54,255), new Color32(98,132,60,255) },   // broadleaf
                new Color[]{ new Color32(122,132,60,255), new Color32(132,140,66,255), new Color32(112,124,56,255) },// acacia
                new Color[]{ new Color32(78,104,50,255), new Color32(92,116,56,255), new Color32(70,96,46,255) } };  // bush
            foreach (Kind k in Enum.GetValues(typeof(Kind))) for (int t = 0; t < 3; t++) leaves[(k, t)] = lit(tints[(int)k][t], .08f);
            meshes[Kind.Conifer] = TreeMesh.Conifer(); meshes[Kind.Broad] = TreeMesh.Broad(); meshes[Kind.Acacia] = TreeMesh.Acacia(); meshes[Kind.Bush] = TreeMesh.Bush();
        }

        /* how many trees a tile of each biome carries, and of which kinds */
        static void Recipe(Biome b, out float count, out float conifer, out float acacia)
        {
            conifer = 0; acacia = 0; count = 0;
            switch (b)
            {
                case Biome.Forest: count = 9; conifer = .45f; break;
                case Biome.Jungle: count = 10; break;
                case Biome.Taiga: count = 7; conifer = .95f; break;
                case Biome.Grassland: count = .7f; conifer = .15f; break;
                case Biome.Savanna: count = 1.1f; acacia = .85f; break;
                case Biome.Hills: count = 1.6f; conifer = .8f; break;
                case Biome.Tundra: count = .25f; conifer = 1; break;
            }
        }

        public void Build(World w, FBTerrain t)
        {
            batches.Clear(); Count = 0;
            var lists = new Dictionary<(int, Kind, int), List<Matrix4x4>>();
            int px = (w.W + PATCH - 1) / PATCH;
            for (int y = 0; y < w.H; y++) for (int x = 0; x < w.W; x++)
            {
                int i = y * w.W + x; if (w.IsWater(i) || w.river[i] != 0) continue;
                Recipe((Biome)w.biome[i], out float cnt, out float con, out float aca);
                if (cnt <= 0) continue;
                int whole = (int)cnt; if (FB.Hash(i * 3.17) < cnt - whole) whole++;
                for (int k = 0; k < whole; k++)
                {
                    double s = i * 7.31 + k * 1.913;
                    float ox = (float)(FB.Hash(s) - .5) * .92f, oz = (float)(FB.Hash(s + 1) - .5) * .92f;
                    float X = w.WX(x) + ox, Z = -(w.WZ(y) + oz), Y = t.GroundY(X, Z);
                    if (Y < t.waterY + .035f || t.NormalAt(X, Z).y < .72f) continue;
                    double r = FB.Hash(s + 2);
                    Kind kind = r < con ? Kind.Conifer : r < con + aca ? Kind.Acacia : (FB.Hash(s + 5) < .18 ? Kind.Bush : Kind.Broad);
                    float size = (kind == Kind.Bush ? .12f : kind == Kind.Acacia ? .26f : .3f) * (float)(.75 + FB.Hash(s + 3) * .6);
                    int tint = (int)(FB.Hash(s + 4) * 3) % 3;
                    var mtx = Matrix4x4.TRS(new Vector3(X, Y - .01f, Z), Quaternion.Euler(0, (float)FB.Hash(s + 6) * 360f, 0), new Vector3(size, size * (kind == Kind.Acacia ? .9f : 1), size));
                    int patch = (y / PATCH) * px + x / PATCH;
                    var key = (patch, kind, tint);
                    if (!lists.TryGetValue(key, out var L)) lists[key] = L = new List<Matrix4x4>();
                    L.Add(mtx); Count++;
                }
            }
            foreach (var kv in lists)
            {
                var L = kv.Value; var (patch, kind, tint) = kv.Key;
                for (int s = 0; s < L.Count; s += 1023)
                {
                    int n = Math.Min(1023, L.Count - s); var arr = new Matrix4x4[n]; L.CopyTo(s, arr, 0, n);
                    var b = new Bounds(arr[0].GetColumn(3), Vector3.one);
                    for (int q = 1; q < n; q++) b.Encapsulate(arr[q].GetColumn(3));
                    b.Expand(new Vector3(.8f, 1.2f, .8f));
                    batches.Add(new Batch { mesh = meshes[kind], mats = new[] { trunk, leaves[(kind, tint)] }, m = arr, n = n, b = b });
                }
            }
        }

        public void Render(bool shadows)
        {
            foreach (var bt in batches)
                for (int sub = 0; sub < 2; sub++)
                {
                    var rp = new RenderParams(bt.mats[sub]) { worldBounds = bt.b, shadowCastingMode = shadows ? ShadowCastingMode.On : ShadowCastingMode.Off, receiveShadows = true };
                    Graphics.RenderMeshInstanced(rp, bt.mesh, sub, bt.m, bt.n);
                }
        }
    }

    /* low-poly tree shapes in unit size: submesh 0 is the trunk, submesh 1 the crown; normals point outward so crowns shade softly */
    static class TreeMesh
    {
        sealed class B
        {
            public readonly List<Vector3> v = new List<Vector3>(), n = new List<Vector3>(); public readonly List<int>[] t = { new List<int>(), new List<int>() };
            public void Tri(int sub, Vector3 a, Vector3 b, Vector3 c, Vector3 na, Vector3 nb, Vector3 nc) { int o = v.Count; v.Add(a); v.Add(b); v.Add(c); n.Add(na); n.Add(nb); n.Add(nc); t[sub].Add(o); t[sub].Add(o + 1); t[sub].Add(o + 2); }
            public Mesh Make(string name)
            {
                var m = new Mesh { name = name, subMeshCount = 2 }; m.SetVertices(v); m.SetNormals(n); m.SetTriangles(t[0], 0); m.SetTriangles(t[1], 1); m.RecalculateBounds(); return m;
            }
        }
        static void Cyl(B b, int sub, float r0, float r1, float y0, float y1, int seg)
        {
            for (int i = 0; i < seg; i++)
            {
                float a0 = i * Mathf.PI * 2 / seg, a1 = (i + 1) * Mathf.PI * 2 / seg;
                Vector3 d0 = new Vector3(Mathf.Cos(a0), 0, Mathf.Sin(a0)), d1 = new Vector3(Mathf.Cos(a1), 0, Mathf.Sin(a1));
                Vector3 p0 = d0 * r0 + Vector3.up * y0, p1 = d1 * r0 + Vector3.up * y0, q0 = d0 * r1 + Vector3.up * y1, q1 = d1 * r1 + Vector3.up * y1;
                Vector3 n0 = (d0 + Vector3.up * ((r0 - r1) / Mathf.Max(.001f, y1 - y0))).normalized, n1 = (d1 + Vector3.up * ((r0 - r1) / Mathf.Max(.001f, y1 - y0))).normalized;
                b.Tri(sub, p0, q0, p1, n0, n0, n1); b.Tri(sub, p1, q0, q1, n1, n0, n1);
            }
        }
        static Vector3 BlobN(Vector3 u, Vector3 r) => new Vector3(u.x / r.x, u.y / r.y, u.z / r.z).normalized;
        static void Blob(B b, int sub, Vector3 c, Vector3 r)
        {
            /* an icosphere subdivided once, squashed to the crown's size */
            float t = (1 + Mathf.Sqrt(5)) / 2;
            var P = new List<Vector3> { new Vector3(-1, t, 0), new Vector3(1, t, 0), new Vector3(-1, -t, 0), new Vector3(1, -t, 0), new Vector3(0, -1, t), new Vector3(0, 1, t), new Vector3(0, -1, -t), new Vector3(0, 1, -t), new Vector3(t, 0, -1), new Vector3(t, 0, 1), new Vector3(-t, 0, -1), new Vector3(-t, 0, 1) };
            int[] F = { 0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1 };
            for (int i = 0; i < F.Length; i += 3)
            {
                Vector3 a = P[F[i]].normalized, bb = P[F[i + 1]].normalized, cc = P[F[i + 2]].normalized, ab = ((a + bb) / 2).normalized, bc = ((bb + cc) / 2).normalized, ca = ((cc + a) / 2).normalized;
                foreach (var tri in new[] { (a, ab, ca), (ab, bb, bc), (ca, bc, cc), (ab, bc, ca) })
                {
                    b.Tri(sub, c + Vector3.Scale(tri.Item1, r), c + Vector3.Scale(tri.Item2, r), c + Vector3.Scale(tri.Item3, r), BlobN(tri.Item1, r), BlobN(tri.Item2, r), BlobN(tri.Item3, r));
                }
            }
        }
        public static Mesh Conifer()
        {
            var b = new B(); Cyl(b, 0, .05f, .035f, 0, .3f, 6);
            Cyl(b, 1, .34f, 0, .18f, .7f, 8); Cyl(b, 1, .27f, 0, .42f, .9f, 8); Cyl(b, 1, .19f, 0, .64f, 1.05f, 8);
            return b.Make("conifer");
        }
        public static Mesh Broad()
        {
            var b = new B(); Cyl(b, 0, .055f, .035f, 0, .5f, 6);
            Blob(b, 1, new Vector3(0, .66f, 0), new Vector3(.34f, .3f, .34f)); Blob(b, 1, new Vector3(.14f, .55f, .08f), new Vector3(.22f, .2f, .22f)); Blob(b, 1, new Vector3(-.12f, .58f, -.1f), new Vector3(.22f, .21f, .22f));
            return b.Make("broadleaf");
        }
        public static Mesh Acacia()
        {
            var b = new B(); Cyl(b, 0, .05f, .03f, 0, .62f, 6);
            Blob(b, 1, new Vector3(0, .72f, 0), new Vector3(.5f, .11f, .5f)); Blob(b, 1, new Vector3(.18f, .66f, -.1f), new Vector3(.26f, .08f, .26f));
            return b.Make("acacia");
        }
        public static Mesh Bush()
        {
            var b = new B(); Cyl(b, 0, .02f, .02f, 0, .05f, 4);
            Blob(b, 1, new Vector3(0, .32f, 0), new Vector3(.45f, .32f, .45f)); Blob(b, 1, new Vector3(.25f, .24f, .1f), new Vector3(.28f, .22f, .28f));
            return b.Make("bush");
        }
    }
}
