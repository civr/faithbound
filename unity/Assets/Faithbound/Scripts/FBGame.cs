// Faithbound for Unity — milestone 1: builds the world from a seed, lights it, and gives a small panel to make new worlds.
// It starts itself in any scene (no setup needed): press Play.
using UnityEngine;
using UnityEngine.Rendering;

namespace Faithbound
{
    public sealed class FBGame : MonoBehaviour
    {
        public int seed = 1234;
        public string sizeKey = "medium";
        public WorldOptions options = new WorldOptions();
        public bool treeShadows = true;

        World world; FBTerrain terrain; FBForest forest; GameObject root;
        Material groundMat, waterMat, oceanMat, riverMat;
        FBCamera godCam; Light sun;
        string seedText; float fps = 60, buildMs; bool panelOpen = true;
        static readonly string[] SIZES = { "tiny", "small", "medium", "large" };
        static readonly Color SKY = new Color32(170, 200, 222, 255);

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            if (FindAnyObjectByType<FBGame>() == null) new GameObject("Faithbound").AddComponent<FBGame>();
        }

        static Shader litShader;
        static bool urp;
        /// <summary>A plain lit material: URP Lit when the project uses URP, otherwise the built-in Standard shader.</summary>
        public static Material Lit(Color c, float smooth, bool twoSided = false)
        {
            if (litShader == null)
            {
                litShader = Shader.Find("Universal Render Pipeline/Lit"); urp = litShader != null;
                if (!urp) litShader = Shader.Find("Standard");
            }
            var m = new Material(litShader) { enableInstancing = true, color = c };
            if (urp) { m.SetColor("_BaseColor", c); m.SetFloat("_Smoothness", smooth); m.SetFloat("_Metallic", 0); if (twoSided) m.SetFloat("_Cull", 0); }
            else m.SetFloat("_Glossiness", smooth);
            return m;
        }

        void Start()
        {
            Application.targetFrameRate = -1;
            QualitySettings.vSyncCount = 1;
            seed = Random.Range(1, 99999); seedText = seed.ToString();
            SetupLight();
            groundMat = Lit(Color.white, .05f);
            waterMat = Lit(Color.white, .86f);
            oceanMat = Lit(new Color32(14, 52, 86, 255), .8f);
            riverMat = Lit(new Color32(61, 143, 176, 255), .8f, true);
            forest = new FBForest((c, s) => Lit(c, s, true));
            SetupCamera();
            Rebuild();
        }

        void SetupLight()
        {
            foreach (var l in FindObjectsByType<Light>(FindObjectsSortMode.None)) if (l.type == LightType.Directional) { sun = l; break; }
            if (sun == null) { sun = new GameObject("Sun").AddComponent<Light>(); sun.type = LightType.Directional; }
            sun.transform.rotation = Quaternion.Euler(50, -35, 0);
            sun.color = new Color32(255, 241, 222, 255); sun.intensity = 1.25f;
            sun.shadows = LightShadows.Soft; sun.shadowStrength = .72f; sun.shadowBias = .04f; sun.shadowNormalBias = .3f;

            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color32(150, 176, 204, 255);
            RenderSettings.ambientEquatorColor = new Color32(128, 138, 132, 255);
            RenderSettings.ambientGroundColor = new Color32(70, 66, 58, 255);
            RenderSettings.fog = true; RenderSettings.fogMode = FogMode.Linear; RenderSettings.fogColor = SKY;

            /* the URP default only draws shadows within 50 units; the map is wider than that */
            var rp = GraphicsSettings.currentRenderPipeline;
            var p = rp != null ? rp.GetType().GetProperty("shadowDistance") : null;
            if (p != null && p.CanWrite) p.SetValue(rp, 160f);
        }

        void SetupCamera()
        {
            var cam = Camera.main;
            if (cam == null) { cam = new GameObject("Main Camera") { tag = "MainCamera" }.AddComponent<Camera>(); }
            cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = SKY;
            cam.farClipPlane = 2000; cam.fieldOfView = 45;
            if (!cam.TryGetComponent(out godCam)) godCam = cam.gameObject.AddComponent<FBCamera>();
        }

        void Rebuild()
        {
            var t0 = Time.realtimeSinceStartup;
            if (root != null) Destroy(root);
            if (terrain != null) { Destroy(terrain.groundTex); Destroy(terrain.waterTex); }
            root = new GameObject("World");
            world = World.Generate(seed, sizeKey, options);
            terrain = new FBTerrain(world);
            terrain.Build(root.transform, groundMat, waterMat, oceanMat, riverMat);
            forest.Build(world, terrain);
            var half = new Vector2(world.W / 2f, world.H / 2f);
            godCam.terrain = terrain;
            godCam.Frame(new Vector3(0, terrain.waterY, 0), Mathf.Max(world.W, world.H) * .55f, half);
            buildMs = (Time.realtimeSinceStartup - t0) * 1000;
            Resources.UnloadUnusedAssets();
        }

        void Update()
        {
            fps = Mathf.Lerp(fps, 1f / Mathf.Max(.0001f, Time.unscaledDeltaTime), .05f);
            forest?.Render(treeShadows);
            godCam.guiRect = panelOpen ? new Rect(8, 8, 270, 360) : new Rect(8, 8, 90, 26);
        }

        void OnGUI()
        {
            if (!panelOpen) { if (GUI.Button(new Rect(8, 8, 90, 24), "Faithbound")) panelOpen = true; return; }
            GUILayout.BeginArea(new Rect(8, 8, 270, 360), GUI.skin.box);
            GUILayout.BeginHorizontal();
            GUILayout.Label("<b>Faithbound</b> — Unity test", new GUIStyle(GUI.skin.label) { richText = true });
            if (GUILayout.Button("–", GUILayout.Width(24))) panelOpen = false;
            GUILayout.EndHorizontal();

            GUILayout.BeginHorizontal();
            GUILayout.Label("Seed", GUILayout.Width(40));
            seedText = GUILayout.TextField(seedText);
            if (GUILayout.Button("Random", GUILayout.Width(64))) { seed = Random.Range(1, 99999); seedText = seed.ToString(); Rebuild(); }
            GUILayout.EndHorizontal();

            int si = System.Array.IndexOf(SIZES, sizeKey);
            int ns = GUILayout.Toolbar(si, SIZES);
            if (ns != si) sizeKey = SIZES[ns];

            options.land = Slider("Land", options.land, .1f, .9f);
            options.mtn = Slider("Mountains", options.mtn, .3f, 1.8f);
            options.rain = Slider("Rain", options.rain, 0, 1);
            options.temp = Slider("Warmth", options.temp, 0, 1);
            options.rivers = Slider("Rivers", options.rivers, 0, 2);
            treeShadows = GUILayout.Toggle(treeShadows, " Tree shadows");

            if (GUILayout.Button("Build world")) { if (int.TryParse(seedText, out int s)) seed = s; Rebuild(); }
            GUILayout.Label($"{fps:0} fps · {forest?.Count ?? 0:N0} trees · built in {buildMs:0} ms");
            GUILayout.Label("Drag: move · Right-drag / Q E: turn\nScroll: zoom · WASD / arrows: move");
            GUILayout.EndArea();
        }

        static float Slider(string name, float v, float a, float b)
        {
            GUILayout.BeginHorizontal();
            GUILayout.Label(name, GUILayout.Width(74));
            v = GUILayout.HorizontalSlider(v, a, b);
            GUILayout.Label(v.ToString("0.00"), GUILayout.Width(34));
            GUILayout.EndHorizontal();
            return v;
        }
    }
}
