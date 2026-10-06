/*
  Hands: the webcam as a second pointer.

  MediaPipe's hand landmarker finds up to two hands. Each one gets a cursor on
  the water at the midpoint of thumb tip and index tip (the midpoint, not the
  index tip, because a pinch pulls the index towards the thumb and the cursor
  would jump just as you "click"). Closing that gap is the click.

  The pinch has to be deliberate. A relaxed hand often has thumb and index
  overlapping in the camera's flat view, so the first version dropped all over
  the place on its own. Now:
  - closing needs a tight gap AND two frames in a row of it;
  - opening needs a much wider gap, so one pinch cannot chatter into two;
  - after a pinch lets go, the hand has a short rest before it can fire again.
  Gaps are measured against the hand's own size (wrist to middle knuckle), so
  it behaves the same near the camera and far from it.

  One pinch is one drop. Holding or dragging a pinch does nothing more: the
  hold-to-drip and drag-trail of the mouse were the other half of the stray
  drops.

  Nothing leaves the machine: the model runs in the browser, on the video the
  browser already has.
*/
const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1";
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/* Measured in 2D only. MediaPipe's z is noisy and puts thumb and index tips at
   different depths even when they touch, so a 3D gap (tried, with 0.17) almost
   never closed. Tips that touch sit about a finger's width apart, ~0.2 here. */
const CLOSE = 0.26, OPEN = 0.42;
const HOLD_FRAMES = 2;   /* frames the gap must stay closed before it counts */
const REST_MS = 250;    /* after a release, before the next pinch can fire */
/* The camera sees less than the screen shows, and the edges of its frame are
   where tracking is weakest, so the middle of the frame is stretched to cover
   the whole pond. */
const REACH = 1.35;

/* `cancelled()` is checked after every slow step. Loading the model takes a few
   seconds with the camera already on, and someone who presses Click (or
   leaves) in that window must not end up with the camera left running. */
function abort(stream) {
  stream?.getTracks().forEach((t) => t.stop());
  const e = new Error("cancelled"); e.name = "Cancelled"; throw e;
}

export async function startHands({ video, preview, cursors, onPress, onRelease, onStatus, onStream, cancelled }) {
  onStatus("Loading hand tracking");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false
  });
  onStream?.(stream);
  if (cancelled?.()) abort(stream);
  video.srcObject = stream;
  await video.play();

  const { FilesetResolver, HandLandmarker } = await import(VISION + "/vision_bundle.mjs");
  const files = await FilesetResolver.forVisionTasks(VISION + "/wasm");
  const make = (delegate) => HandLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5
  });
  let lm;
  try { lm = await make("GPU"); } catch (e) { lm = await make("CPU"); }
  if (cancelled?.()) { lm.close(); video.srcObject = null; abort(stream); }
  onStatus("Pinch thumb and finger to drop");

  const pctx = preview.getContext("2d");
  /* tracked hands, keyed by handedness so a cursor stays with its hand */
  const hands = new Map();
  let lastVideoTime = -1, running = true;

  function toScreen(nx, ny) {
    const mx = 1 - nx; /* mirrored, so moving your hand right moves the cursor right */
    const sx = Math.min(1, Math.max(0, (mx - 0.5) * REACH + 0.5));
    const sy = Math.min(1, Math.max(0, (ny - 0.5) * REACH + 0.5));
    return { x: sx * innerWidth, y: sy * innerHeight };
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const res = lm.detectForVideo(video, performance.now());
    const vw = video.videoWidth, vh = video.videoHeight;

    preview.width = preview.clientWidth * devicePixelRatio;
    preview.height = preview.clientHeight * devicePixelRatio;
    pctx.clearRect(0, 0, preview.width, preview.height);

    const seen = new Set();
    (res.landmarks || []).forEach((pts, i) => {
      const side = res.handedness?.[i]?.[0]?.categoryName || String(i);
      const key = seen.has(side) ? side + i : side;
      seen.add(key);

      const th = pts[4], ix = pts[8], wr = pts[0], mk = pts[9];
      const dist = (a, b) => Math.hypot((a.x - b.x) * vw, (a.y - b.y) * vh);
      const ratio = dist(th, ix) / Math.max(1, dist(wr, mk));
      const target = toScreen((th.x + ix.x) / 2, (th.y + ix.y) / 2);

      let h = hands.get(key);
      if (!h) {
        h = { x: target.x, y: target.y, pinched: false, closedFor: 0, releasedAt: 0, el: cursors.add() };
        hands.set(key, h);
      }
      /* light smoothing: enough to steady a hand, not enough to lag a flick */
      h.x += (target.x - h.x) * 0.55;
      h.y += (target.y - h.y) * 0.55;
      h.seen = performance.now();

      h.closedFor = ratio < CLOSE ? h.closedFor + 1 : 0;
      const rested = performance.now() - h.releasedAt > REST_MS;
      if (!h.pinched && h.closedFor >= HOLD_FRAMES && rested) { h.pinched = true; onPress(key, h.x, h.y); }
      else if (h.pinched && ratio > OPEN) { h.pinched = false; h.releasedAt = performance.now(); onRelease(key); }

      /* how close to a pinch, 0 open .. 1 closed, for the cursor ring */
      const close = Math.min(1, Math.max(0, (0.7 - ratio) / (0.7 - CLOSE)));
      cursors.place(h.el, h.x, h.y, close, h.pinched);

      /* the preview: thumb and index tips, mirrored like the video */
      pctx.fillStyle = h.pinched ? "#fff" : "rgba(255,255,255,0.7)";
      [th, ix].forEach((p) => {
        pctx.beginPath();
        pctx.arc((1 - p.x) * preview.width, p.y * preview.height, 3 * devicePixelRatio, 0, Math.PI * 2);
        pctx.fill();
      });
    });

    /* a hand that left the frame lets go */
    for (const [key, h] of hands) {
      if (performance.now() - h.seen > 250) {
        if (h.pinched) onRelease(key);
        h.el.remove();
        hands.delete(key);
      }
    }
  }
  loop();

  return function stop() {
    running = false;
    for (const [key, h] of hands) { if (h.pinched) onRelease(key); h.el.remove(); }
    hands.clear();
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
    lm.close();
  };
}
