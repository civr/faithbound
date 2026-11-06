// Faithbound for Unity — the god camera: drag to pan, right-drag to turn, scroll to zoom, WASD/arrows and Q/E as in the browser.
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace Faithbound
{
    [RequireComponent(typeof(Camera))]
    public sealed class FBCamera : MonoBehaviour
    {
        public Vector3 target;
        public float yaw = 0, dist = 60, minDist = 3.5f, maxDist = 150;
        public Vector2 bounds = new Vector2(72, 54);   // half the world's width and depth
        public FBTerrain terrain;
        public Rect guiRect;                             // mouse over the panel does not move the camera
        float tDist, tYaw; Vector3 tTarget; Vector2 lastMouse; bool dragL, dragR;
        Camera cam;

        void Awake() { cam = GetComponent<Camera>(); tDist = dist; tYaw = yaw; tTarget = target; }

        public void Frame(Vector3 centre, float d, Vector2 halfSize)
        {
            target = tTarget = centre; dist = tDist = d; bounds = halfSize; maxDist = Mathf.Max(halfSize.x, halfSize.y) * 2.1f;
        }

        Vector2 MousePos()
        {
#if ENABLE_INPUT_SYSTEM
            return Mouse.current != null ? Mouse.current.position.ReadValue() : Vector2.zero;
#else
            return Input.mousePosition;
#endif
        }
        bool Btn(int b)
        {
#if ENABLE_INPUT_SYSTEM
            var m = Mouse.current; if (m == null) return false;
            return b == 0 ? m.leftButton.isPressed : b == 1 ? m.rightButton.isPressed : m.middleButton.isPressed;
#else
            return Input.GetMouseButton(b);
#endif
        }
        float Scroll()
        {
#if ENABLE_INPUT_SYSTEM
            float s = Mouse.current != null ? Mouse.current.scroll.ReadValue().y : 0;
            return Mathf.Abs(s) > 10 ? s / 120f : s;   // some setups report 120 per notch, others 1
#else
            return Input.mouseScrollDelta.y;
#endif
        }
        float Axis(bool neg, bool pos) => (pos ? 1 : 0) - (neg ? 1 : 0);
        Vector3 Keys()
        {
#if ENABLE_INPUT_SYSTEM
            var k = Keyboard.current; if (k == null) return Vector3.zero;
            return new Vector3(Axis(k.aKey.isPressed || k.leftArrowKey.isPressed, k.dKey.isPressed || k.rightArrowKey.isPressed),
                               Axis(k.qKey.isPressed, k.eKey.isPressed),
                               Axis(k.sKey.isPressed || k.downArrowKey.isPressed, k.wKey.isPressed || k.upArrowKey.isPressed));
#else
            return new Vector3(Axis(Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow), Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)),
                               Axis(Input.GetKey(KeyCode.Q), Input.GetKey(KeyCode.E)),
                               Axis(Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow), Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)));
#endif
        }

        void Update()
        {
            float dt = Mathf.Min(Time.unscaledDeltaTime, .05f);
            Vector2 mp = MousePos();
            bool overGui = guiRect.Contains(new Vector2(mp.x, Screen.height - mp.y));
            bool l = Btn(0) || Btn(2), r = Btn(1);
            Vector2 d = mp - lastMouse; lastMouse = mp;
            if (!l) dragL = false; else if (!dragL && !overGui) { dragL = true; d = Vector2.zero; }
            if (!r) dragR = false; else if (!dragR && !overGui) { dragR = true; d = Vector2.zero; }

            Vector3 fwd = Quaternion.Euler(0, tYaw, 0) * Vector3.forward, right = Quaternion.Euler(0, tYaw, 0) * Vector3.right;
            float panK = tDist * 1.6f / Mathf.Max(1, Screen.height);
            if (dragL) tTarget -= (right * d.x + fwd * d.y) * panK;
            if (dragR) tYaw += d.x * .25f;
            if (!overGui) { float s = Scroll(); if (s != 0) tDist *= Mathf.Pow(.88f, s); }
            Vector3 k = Keys();
            tTarget += (right * k.x + fwd * k.z) * tDist * .9f * dt;
            tYaw += k.y * 70 * dt;

            tDist = Mathf.Clamp(tDist, minDist, maxDist);
            tTarget.x = Mathf.Clamp(tTarget.x, -bounds.x, bounds.x); tTarget.z = Mathf.Clamp(tTarget.z, -bounds.y, bounds.y);
            if (terrain != null) tTarget.y = Mathf.Max(terrain.waterY, terrain.GroundY(tTarget.x, tTarget.z));

            float e = 1 - Mathf.Exp(-dt * 10);
            dist = Mathf.Lerp(dist, tDist, e); yaw = Mathf.LerpAngle(yaw, tYaw, e); target = Vector3.Lerp(target, tTarget, e);

            /* close in, the view tilts towards the horizon; far out it looks down on the map */
            float z = Mathf.InverseLerp(minDist, maxDist, dist);
            float pitch = Mathf.Lerp(35, 62, Mathf.Sqrt(z));
            Quaternion rot = Quaternion.Euler(pitch, yaw, 0);
            Vector3 pos = target - rot * Vector3.forward * dist;
            if (terrain != null) pos.y = Mathf.Max(pos.y, terrain.GroundY(pos.x, pos.z) + .6f);
            transform.SetPositionAndRotation(pos, Quaternion.LookRotation(target - pos, Vector3.up));

            cam.nearClipPlane = Mathf.Clamp(dist * .01f, .05f, 2);
            RenderSettings.fogStartDistance = dist * 1.1f;
            RenderSettings.fogEndDistance = dist * 3.2f + 30;
        }
    }
}
