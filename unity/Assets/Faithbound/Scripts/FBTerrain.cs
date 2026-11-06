// Faithbound for Unity — the ground, sea and rivers, shaped and coloured as in render.js (layoutTerrain, colorTerrain).
// Coordinates: browser x stays x; browser z becomes -z, so the map is not mirrored when seen from the default camera.
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace Faithbound
{
    public sealed class FBTerrain
    {
        public const int R = 3;            // vertices per tile, as in the browser
        const double SEA0 = .44, HS = 6;
        const int CHUNK = 48;              // cells per terrain chunk (16 tiles)

        static readonly int[][] GROUND = {
            new[]{38,70,92}, new[]{150,140,110}, new[]{226,236,242}, new[]{140,136,88}, new[]{76,98,48}, new[]{48,68,38}, new[]{56,80,46},
            new[]{170,134,88}, new[]{150,134,82}, new[]{132,134,108}, new[]{236,240,244}, new[]{110,102,90}, new[]{140,134,124} };
        static readonly int[] ROCK = { 94, 90, 80 }, SNOW = { 238, 242, 247 }, SAND = { 184, 160, 116 }, SEABED = { 150, 138, 108 };

        public readonly World w;
        public int VW, VH;
        public float[] VY;
        public Vector3[] NRM;
        public float waterY;
        public GameObject root;
        public Texture2D groundTex, waterTex;

        public FBTerrain(World world) { w = world; }

        public static double ShapeH(double v) { double d = v - SEA0; return d >= 0 ? SEA0 * HS + d * HS * (.5 + d * 2.9 + Math.Max(0, d - .32) * 2.4) : SEA0 * HS + d * HS * 1.4; }

        double SampleH(double tx, double ty)
        {
            tx = FB.Clamp(tx, 0, w.W - 1); ty = FB.Clamp(ty, 0, w.H - 1);
            int x0 = (int)Math.Floor(tx), y0 = (int)Math.Floor(ty), x1 = Math.Min(x0 + 1, w.W - 1), y1 = Math.Min(y0 + 1, w.H - 1); double fx = tx - x0, fy = ty - y0;
            return FB.Lerp(FB.Lerp(w.h[y0 * w.W + x0], w.h[y0 * w.W + x1], fx), FB.Lerp(w.h[y1 * w.W + x0], w.h[y1 * w.W + x1], fx), fy);
        }

        /// <summary>Ground height at a Unity position (x, -browserZ).</summary>
        public float GroundY(float x, float zUnity)
        {
            float z = -zUnity; float u = (x + w.W / 2f) * R, v = (z + w.H / 2f) * R;
            u = Mathf.Clamp(u, 0, VW - 1.001f); v = Mathf.Clamp(v, 0, VH - 1.001f);
            int u0 = (int)u, v0 = (int)v; float fu = u - u0, fv = v - v0; int k = v0 * VW + u0;
            return Mathf.Lerp(Mathf.Lerp(VY[k], VY[k + 1], fu), Mathf.Lerp(VY[k + VW], VY[k + VW + 1], fu), fv);
        }
        public Vector3 NormalAt(float x, float zUnity)
        {
            float z = -zUnity; int u = Mathf.Clamp(Mathf.RoundToInt((x + w.W / 2f) * R), 0, VW - 1), v = Mathf.Clamp(Mathf.RoundToInt((z + w.H / 2f) * R), 0, VH - 1);
            return NRM[v * VW + u];
        }

        public void Build(Transform parent, Material groundMat, Material waterMat, Material oceanMat, Material riverMat)
        {
            root = new GameObject("Terrain"); root.transform.SetParent(parent, false);
            VW = w.W * R + 1; VH = w.H * R + 1; int nv = VW * VH;
            VY = new float[nv]; NRM = new Vector3[nv];
            waterY = (float)ShapeH(w.sea);
            /* heights: the tile heights smoothed between tiles, plus fine detail that grows with altitude */
            var dn = new Noise(FB.ToInt(FB.HSeed * 1000));
            for (int v = 0; v < VH; v++) for (int u = 0; u < VW; u++)
            {
                int k = v * VW + u; double tx = (double)u / R - .5, ty = (double)v / R - .5, hb = SampleH(tx, ty);
                double detail = (dn.Sample((double)u / R * .9, (double)v / R * .9, 3) - .5) * 2;
                double y = ShapeH(hb) + detail * (hb > SEA0 ? .16 * (.12 + FB.Clamp((hb - SEA0) * 3.4, 0, 1.5)) : .06);
                VY[k] = (float)y;
            }
            /* normals across the whole grid, so chunk edges match exactly */
            float s2 = 2f / R;
            for (int v = 0; v < VH; v++) for (int u = 0; u < VW; u++)
            {
                float hx = (VY[v * VW + Math.Min(u + 1, VW - 1)] - VY[v * VW + Math.Max(u - 1, 0)]) / s2;
                float hz = (VY[Math.Max(v - 1, 0) * VW + u] - VY[Math.Min(v + 1, VH - 1) * VW + u]) / s2;
                NRM[v * VW + u] = new Vector3(-hx, 1, -hz).normalized;
            }
            groundTex = BuildGroundTexture(); waterTex = BuildWaterTexture();
            groundMat.SetTexture("_BaseMap", groundTex); groundMat.mainTexture = groundTex;
            waterMat.SetTexture("_BaseMap", waterTex); waterMat.mainTexture = waterTex;

            /* the ground in chunks, so the camera only draws what it sees */
            for (int v0 = 0; v0 < VH - 1; v0 += CHUNK) for (int u0 = 0; u0 < VW - 1; u0 += CHUNK)
            {
                int nu = Math.Min(CHUNK, VW - 1 - u0), nvv = Math.Min(CHUNK, VH - 1 - v0);
                var go = new GameObject($"Ground {u0 / CHUNK},{v0 / CHUNK}"); go.transform.SetParent(root.transform, false);
                go.AddComponent<MeshFilter>().sharedMesh = ChunkMesh(u0, v0, nu, nvv);
                var mr = go.AddComponent<MeshRenderer>(); mr.sharedMaterial = groundMat; mr.shadowCastingMode = ShadowCastingMode.On; mr.receiveShadows = true;
            }
            /* the sea: one sheet over the map coloured by depth, and open ocean beyond the edge */
            var sea = Quad("Sea", new Vector3(-w.W / 2f, waterY, w.H / 2f), new Vector3(w.W / 2f, waterY, -w.H / 2f), new Vector2(.5f / VW, .5f / VH), new Vector2((VW - .5f) / VW, (VH - .5f) / VH));
            sea.transform.SetParent(root.transform, false); var smr = sea.GetComponent<MeshRenderer>(); smr.sharedMaterial = waterMat; smr.shadowCastingMode = ShadowCastingMode.Off;
            var ocean = Quad("Ocean", new Vector3(-1500, waterY - .004f, 1500), new Vector3(1500, waterY - .004f, -1500), Vector2.zero, Vector2.one);
            ocean.transform.SetParent(root.transform, false); var omr = ocean.GetComponent<MeshRenderer>(); omr.sharedMaterial = oceanMat; omr.shadowCastingMode = ShadowCastingMode.Off;
            BuildRivers(riverMat);
        }

        Mesh ChunkMesh(int u0, int v0, int nu, int nv)
        {
            int cw = nu + 1, ch = nv + 1; var P = new Vector3[cw * ch]; var Nn = new Vector3[cw * ch]; var UV = new Vector2[cw * ch];
            for (int v = 0; v < ch; v++) for (int u = 0; u < cw; u++)
            {
                int U = u0 + u, V = v0 + v, k = V * VW + U, i = v * cw + u;
                P[i] = new Vector3((float)U / R - w.W / 2f, VY[k], -((float)V / R - w.H / 2f)); Nn[i] = NRM[k]; UV[i] = new Vector2((U + .5f) / VW, (V + .5f) / VH);
            }
            var T = new int[nu * nv * 6]; int t = 0;
            for (int v = 0; v < nv; v++) for (int u = 0; u < nu; u++)
            {
                int a = v * cw + u, b = a + 1, c = a + cw, d = c + 1;
                T[t++] = a; T[t++] = b; T[t++] = c; T[t++] = b; T[t++] = d; T[t++] = c;
            }
            var m = new Mesh { name = "ground" }; m.indexFormat = P.Length > 65000 ? IndexFormat.UInt32 : IndexFormat.UInt16;
            m.vertices = P; m.normals = Nn; m.uv = UV; m.triangles = T; m.RecalculateBounds(); return m;
        }

        static GameObject Quad(string name, Vector3 a, Vector3 b, Vector2 uv0, Vector2 uv1)
        {
            var go = new GameObject(name); var m = new Mesh { name = name };
            m.vertices = new[] { new Vector3(a.x, a.y, a.z), new Vector3(b.x, a.y, a.z), new Vector3(a.x, a.y, b.z), new Vector3(b.x, a.y, b.z) };
            m.normals = new[] { Vector3.up, Vector3.up, Vector3.up, Vector3.up };
            m.uv = new[] { new Vector2(uv0.x, uv0.y), new Vector2(uv1.x, uv0.y), new Vector2(uv0.x, uv1.y), new Vector2(uv1.x, uv1.y) };
            m.triangles = new[] { 0, 1, 2, 1, 3, 2 }; m.RecalculateBounds();
            go.AddComponent<MeshFilter>().sharedMesh = m; go.AddComponent<MeshRenderer>(); return go;
        }

        /* land colours: biome tones blended between tiles, beaches by the water, rock on steep slopes, snow on high ground, seabed below */
        Texture2D BuildGroundTexture()
        {
            int W = w.W, H = w.H; var TC = new double[w.N * 3];
            for (int i = 0; i < w.N; i++) { var c = GROUND[w.biome[i]]; double v = 1 - .1 * FB.Hash(i * 1.7); TC[i * 3] = c[0] * v; TC[i * 3 + 1] = c[1] * v; TC[i * 3 + 2] = c[2] * v; }
            double snowY = ShapeH(.9 + (w.opts.temp - .5) * .3); bool cold = w.opts.temp < .3;
            var px = new Color32[VW * VH];
            for (int v = 0; v < VH; v++) for (int u = 0; u < VW; u++)
            {
                int k = v * VW + u;
                double tx = FB.Clamp((double)u / R - .5, 0, W - 1), ty = FB.Clamp((double)v / R - .5, 0, H - 1);
                int x0 = (int)Math.Floor(tx), y0 = (int)Math.Floor(ty), x1 = Math.Min(x0 + 1, W - 1), y1 = Math.Min(y0 + 1, H - 1); double fx = tx - x0, fy = ty - y0;
                double[] wq = { (1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy }; int[] ts = { y0 * W + x0, y0 * W + x1, y1 * W + x0, y1 * W + x1 };
                double r = 0, g = 0, b = 0; for (int q = 0; q < 4; q++) { r += TC[ts[q] * 3] * wq[q]; g += TC[ts[q] * 3 + 1] * wq[q]; b += TC[ts[q] * 3 + 2] * wq[q]; }
                double y = VY[k];
                if (y < waterY - .01) { double t = FB.Smooth(0, 1.6, waterY - y); r = FB.Lerp(SAND[0], SEABED[0] * .55, t); g = FB.Lerp(SAND[1], SEABED[1] * .55, t); b = FB.Lerp(SAND[2], SEABED[2] * .6, t); }
                else
                {
                    if (y < waterY + .045 && !cold) { double t = 1 - FB.Smooth(waterY + .012, waterY + .045, y); r = FB.Lerp(r, SAND[0], t); g = FB.Lerp(g, SAND[1], t); b = FB.Lerp(b, SAND[2], t); }
                    double sl = 1 - NRM[k].y; if (sl > .32) { double t = FB.Smooth(.32, .62, sl) * .75; r = FB.Lerp(r, ROCK[0], t); g = FB.Lerp(g, ROCK[1], t); b = FB.Lerp(b, ROCK[2], t); }
                    if (y > snowY) { double t = FB.Smooth(snowY, snowY + .45, y) * (sl > .5 ? .5 : 1); r = FB.Lerp(r, SNOW[0], t); g = FB.Lerp(g, SNOW[1], t); b = FB.Lerp(b, SNOW[2], t); }
                }
                px[k] = new Color32((byte)FB.Clamp(r, 0, 255), (byte)FB.Clamp(g, 0, 255), (byte)FB.Clamp(b, 0, 255), 255);
            }
            var tex = new Texture2D(VW, VH, TextureFormat.RGBA32, true) { name = "Faithbound ground", wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear, anisoLevel = 4 };
            tex.SetPixels32(px); tex.Apply(true); return tex;
        }

        /* water colour from depth: clear turquoise at the shore, deep blue offshore, a thin line of foam where it meets the land */
        Texture2D BuildWaterTexture()
        {
            Color shallow = new Color32(0x2f, 0x9b, 0xb0, 255), deep = new Color32(0x0f, 0x3f, 0x63, 255), foam = new Color(.92f, .96f, .97f);
            var px = new Color[VW * VH];
            for (int k = 0; k < px.Length; k++)
            {
                float d = waterY - VY[k], dd = Mathf.Clamp01(d / .8f);
                Color c = Color.Lerp(shallow * .95f, deep, Mathf.Pow(dd, .5f));
                if (d < .025f) c = Color.Lerp(c, foam, Mathf.Clamp01(1 - d / .025f) * .45f);
                c.a = 1; px[k] = c;
            }
            var tex = new Texture2D(VW, VH, TextureFormat.RGBA32, true) { name = "Faithbound water", wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            tex.SetPixels(px); tex.Apply(true); return tex;
        }

        /* rivers: a ribbon of water along each river's tiles, widening downstream */
        void BuildRivers(Material mat)
        {
            foreach (var tiles in w.rivers)
            {
                var pts = new List<Vector2>(); var wid = new List<float>();
                foreach (int t in tiles) { pts.Add(new Vector2(w.WX(t % w.W), -w.WZ(t / w.W))); wid.Add(.05f + .028f * w.river[t]); }
                for (int pass = 0; pass < 2; pass++)
                {
                    var np = new List<Vector2> { pts[0] }; var nw = new List<float> { wid[0] };
                    for (int i = 0; i < pts.Count - 1; i++) { np.Add(Vector2.Lerp(pts[i], pts[i + 1], .25f)); np.Add(Vector2.Lerp(pts[i], pts[i + 1], .75f)); nw.Add(Mathf.Lerp(wid[i], wid[i + 1], .25f)); nw.Add(Mathf.Lerp(wid[i], wid[i + 1], .75f)); }
                    np.Add(pts[pts.Count - 1]); nw.Add(wid[wid.Count - 1]); pts = np; wid = nw;
                }
                if (pts.Count < 2) continue;
                var V = new List<Vector3>(); var Nn = new List<Vector3>(); var T = new List<int>();
                for (int i = 0; i < pts.Count; i++)
                {
                    Vector2 a = pts[Math.Max(0, i - 1)], b = pts[Math.Min(pts.Count - 1, i + 1)], dir = (b - a).normalized, n = new Vector2(-dir.y, dir.x) * wid[i] * .5f;
                    Vector2 L = pts[i] + n, Rr = pts[i] - n;
                    float yL = Mathf.Max(GroundY(L.x, L.y), GroundY(pts[i].x, pts[i].y)) + .018f, yR = Mathf.Max(GroundY(Rr.x, Rr.y), GroundY(pts[i].x, pts[i].y)) + .018f;
                    V.Add(new Vector3(L.x, Mathf.Max(yL, waterY + .002f), L.y)); V.Add(new Vector3(Rr.x, Mathf.Max(yR, waterY + .002f), Rr.y)); Nn.Add(Vector3.up); Nn.Add(Vector3.up);
                    if (i > 0) { int q = V.Count - 4; T.AddRange(new[] { q, q + 2, q + 1, q + 1, q + 2, q + 3 }); }
                }
                var m = new Mesh { name = "river" }; m.SetVertices(V); m.SetNormals(Nn); m.SetTriangles(T, 0); m.RecalculateBounds();
                var go = new GameObject("River"); go.transform.SetParent(root.transform, false);
                go.AddComponent<MeshFilter>().sharedMesh = m; var mr = go.AddComponent<MeshRenderer>(); mr.sharedMaterial = mat; mr.shadowCastingMode = ShadowCastingMode.Off;
            }
        }
    }
}
