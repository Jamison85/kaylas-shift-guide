// Till's approved Step 4.5 weighted mesh rig and motion authoring.
// Sourced from Till_Production_Assets_V2.zip. The app owns scheduling and scene layout.
let TillRig, TillValidationClips, TillMotion, TillPosePlayer, TillV2;

/* Till's front-view mesh player. The renderer has no external runtime dependencies. */
(function exposeTillRig(global) {
  "use strict";

  const RAD = Math.PI / 180;
  const identity = [1, 0, 0, 1, 0, 0];
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const rotation = m => Math.atan2(m[1], m[0]);
  const point = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const angle = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const mix = (a, b, t) => a + (b - a) * t;

  function multiply(a, b) {
    return [
      a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  }

  function around(pivot, degrees = 0, scale = [1, 1], offset = [0, 0]) {
    const c = Math.cos(degrees * RAD), s = Math.sin(degrees * RAD);
    const [x, y] = pivot;
    const a = c * scale[0], b = s * scale[0], d = c * scale[1], e = -s * scale[1];
    return [a, b, e, d, x - a * x - e * y + offset[0], y - b * x - d * y + offset[1]];
  }

  function createSkeleton(rig) {
    const bones = Object.fromEntries(rig.bones.map(bone => [bone.id, bone]));
    let state = {};
    let matrices = {};

    function calculate() {
      for (const bone of rig.bones) {
        const control = state[bone.id] || {};
        const degrees = clamp(control.angle || 0, bone.limits[0], bone.limits[1]);
        matrices[bone.id] = multiply(matrices[bone.parent] || identity,
          around(bone.pivot, degrees, control.scale, control.offset));
      }
    }

    function solve(chain, control) {
      const [upper, lower, effector] = chain.map(id => bones[id]);
      const parent = matrices[upper.parent] || identity;
      const base = point(parent, ...upper.pivot);
      const lengths = [
        distance(point(parent, ...lower.pivot), base),
        distance(point(parent, ...effector.pivot), point(parent, ...lower.pivot))
      ];
      const [a, b] = lengths;
      const dst = clamp(distance(base, control.target), Math.abs(a - b) + 0.02, a + b - 0.005);
      const sign = control.bend < 0 ? -1 : 1;
      const direction = angle(base, control.target);
      const elbow = sign * Math.acos(clamp((dst * dst - a * a - b * b) / (2 * a * b), -1, 1));
      const upperWorld = direction - Math.atan2(b * Math.sin(elbow), a + b * Math.cos(elbow));
      const bindUpper = angle(upper.pivot, lower.pivot);
      const bindLower = angle(lower.pivot, effector.pivot);
      const upperLocal = wrap(upperWorld - rotation(parent) - bindUpper) / RAD;
      const lowerLocal = wrap(elbow - (bindLower - bindUpper)) / RAD;
      const goalWeight = clamp(control.weight ?? 1, 0, 1);
      state[upper.id] = { ...state[upper.id], angle: mix(state[upper.id]?.angle || 0, upperLocal, goalWeight) };
      state[lower.id] = { ...state[lower.id], angle: mix(state[lower.id]?.angle || 0, lowerLocal, goalWeight) };
      calculate();
      if (Number.isFinite(control.angle)) {
        const local = wrap(control.angle * RAD - rotation(matrices[lower.id])) / RAD;
        state[effector.id] = { ...state[effector.id], angle: mix(state[effector.id]?.angle || 0, local, goalWeight) };
        calculate();
      }
    }

    return {
      set(pose = {}) {
        state = { ...pose.bones };
        matrices = {};
        calculate();
        for (const [name, control] of Object.entries(pose.ik || {})) {
          if (rig.chains[name] && control.target) solve(rig.chains[name], control);
        }
        return matrices;
      }
    };
  }

  const vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aUv;
    attribute float aOpacity;
    attribute vec4 aClip;
    uniform vec4 uView;
    varying vec2 vUv;
    varying float vOpacity;
    varying vec4 vClip;
    void main() {
      vec2 uv = (aPosition - uView.xy) / uView.zw;
      gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
      vUv = aUv; vOpacity = aOpacity; vClip = aClip;
    }`;
  const fragmentShader = `
    precision mediump float;
    uniform sampler2D uAtlas;
    varying vec2 vUv;
    varying float vOpacity;
    varying vec4 vClip;
    void main() {
      float clip = 1.0;
      if (vClip.z > -9.0) {
        clip = step(0.0,vClip.z) * step(vClip.z,1.0) * step(0.0,vClip.w) * step(vClip.w,1.0);
        clip *= texture2D(uAtlas,vClip.xy).a;
      }
      gl_FragColor = texture2D(uAtlas,vUv) * (vOpacity * clip);
    }`;

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const boundPlayers = new WeakMap();

  function createGpu(gl, atlasImage) {
    const program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);

    const vertices = gl.createBuffer(), indices = gl.createBuffer(), texture = gl.createTexture();
    const attributes = [["aPosition", 2, 0], ["aUv", 2, 2], ["aOpacity", 1, 4], ["aClip", 4, 5]]
      .map(([name, count, offset]) => [gl.getAttribLocation(program, name), count, offset]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "uAtlas"), 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasImage);
    for (const [name, value] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) {
      gl.texParameteri(gl.TEXTURE_2D, name, value);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    const gpu = {
      gl, view: gl.getUniformLocation(program, "uView"),
      bind() {
        if (boundPlayers.get(gl) === gpu) return;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
        for (const [location, count, offset] of attributes) {
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, count, gl.FLOAT, false, 36, 4 * offset);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        boundPlayers.set(gl, gpu);
      },
      dispose() {
        if (boundPlayers.get(gl) === gpu) boundPlayers.delete(gl);
        gl.deleteBuffer(vertices); gl.deleteBuffer(indices); gl.deleteTexture(texture); gl.deleteProgram(program);
      }
    };
    return gpu;
  }

  function generateMesh(region, skin, atlasSize) {
    const [left, top] = region.origin;
    const [w, h] = region.sourceSize;
    const [u, v, uw, vh] = region.uv;
    const nx = skin ? Math.ceil(w / skin.step) : 1, ny = skin ? Math.ceil(h / skin.step) : 1;
    const vertices = [];
    for (let y = 0; y <= ny; y++) {
      const stageY = top + h * y / ny;
      for (let x = 0; x <= nx; x++) {
        let bone = 0, weight = 0;
        if (skin) {
          for (const [start, end] of skin.bands) {
            if (stageY < end) {
              weight = smooth(start, end, stageY);
              break;
            }
            bone++;
          }
        }
        vertices.push([left + w * x / nx, stageY, (u + uw * x / nx) / atlasSize[0],
          (v + vh * y / ny) / atlasSize[1], skin?.bones[bone], skin?.bones[bone + 1], weight]);
      }
    }
    const indices = [];
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const a = y * (nx + 1) + x, b = a + nx + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    return { vertices, indices };
  }

  class MeshPlayer {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.definition = options.rig;
      this.atlas = options.atlas;
      this.assetManifest = options.manifest;
      this.anchors = options.anchors.anchors;
      this.view = [...(options.viewBox || this.definition.viewBox)];
      this.skeleton = createSkeleton(this.definition);
      this.pose = {};
      this.matrices = this.skeleton.set();
      this.meshes = Object.fromEntries(Object.entries(this.atlas.regions).map(([name, region]) =>
        [name, generateMesh(region, this.definition.meshes[name], this.atlas.size)]));
      this.bones = Object.fromEntries(this.definition.bones.map(bone => [bone.id, bone]));
      this.vertexData = new Float32Array(9 * Object.values(this.meshes).reduce((n, m) => n + m.vertices.length, 0));
      this.indexData = new Uint16Array(Object.values(this.meshes).reduce((n, m) => n + m.indices.length, 0));
      this.dprCap = options.dprCap ?? 2;
      this.atlasImage = options.image;
      const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false,
        premultipliedAlpha: true, powerPreference: "low-power" });
      if (!gl) throw new Error("WebGL unavailable");
      this.gpu = createGpu(gl, this.atlasImage);
      this.contextLost = event => { event.preventDefault(); this.lost = true; };
      this.contextRestored = () => { this.gpu = createGpu(gl, this.atlasImage); this.lost = false; this.draw(); };
      canvas.addEventListener("webglcontextlost", this.contextLost);
      canvas.addEventListener("webglcontextrestored", this.contextRestored);
      if (options.observeResize !== false) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);
      }
      this.resize();
    }

    resize() {
      const dpr = Math.min(global.devicePixelRatio || 1, this.dprCap);
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
      if (w === this.canvas.width && h === this.canvas.height && this.stats) return;
      this.canvas.width = w; this.canvas.height = h;
      this.draw();
    }

    setViewBox(view) {
      this.view = [...view];
      this.draw();
    }

    setPose(pose = {}) {
      this.pose = pose;
      this.matrices = this.skeleton.set(pose);
      this.draw();
    }

    handKey(side) {
      const key = `hand_${side}_${this.pose.hands?.[side] || "relaxed"}`;
      return this.meshes[key] ? key : `hand_${side}_relaxed`;
    }

    getAnchor(id, space = "rig") {
      const anchor = this.anchors[id];
      if (!anchor) return null;
      const side = id.endsWith("R") ? "right" : "left";
      const variant = this.assetManifest.handVariants[this.handKey(side)];
      const source = anchor.variantPoint && variant?.[anchor.variantPoint] || anchor.point;
      const gaze = id === "gazeR" || id === "gazeL" ? this.gaze(side) : [0, 0];
      const bone = this.matrices[anchor.bone];
      const matrix = anchor.transform === "glasses" ? multiply(bone,
        around(this.definition.face.glassesPivot, clamp(this.pose.face?.glasses || 0,-8,8))) : bone;
      const position = point(matrix, source[0] + gaze[0], source[1] + gaze[1]);
      if (space === "rig") return position;
      const rect = this.canvas.getBoundingClientRect();
      const pos = this.rigToCanvas(position);
      return space === "client" ? [rect.left + pos[0], rect.top + pos[1]] : pos;
    }

    viewport() {
      const [x, y, w, h] = this.view;
      const aspect = this.canvas.width / this.canvas.height;
      const ww = Math.max(w, h * aspect), hh = Math.max(h, w / aspect);
      return [x - (ww - w) / 2, y - (hh - h) / 2, ww, hh];
    }

    rigToCanvas(position) {
      const [x, y, w, h] = this.viewport();
      const rect = this.canvas.getBoundingClientRect();
      return [(position[0]-x)*rect.width/w, (position[1]-y)*rect.height/h];
    }

    clientToRig(position) {
      const [x, y, w, h] = this.viewport();
      const rect = this.canvas.getBoundingClientRect();
      return [x + (position[0]-rect.left)*w/rect.width, y + (position[1]-rect.top)*h/rect.height];
    }

    gaze(side) {
      const face = this.pose.face || {};
      const value = face.gazeByEye?.[side] || face.gaze || [0,0];
      return value.map((v, i) => clamp(v || 0, -this.definition.face.gazeRange[i], this.definition.face.gazeRange[i]));
    }

    layers() {
      const layers = [];
      const add = (key, bone, opacity = 1, transform, clip, delta) => {
        if (this.meshes[key] && opacity > 0.001) layers.push({key, bone, opacity, transform, clip, delta});
      };
      const p = this.pose, f = p.face || {};
      const armFront = p.armFront || [];
      for (const key of this.definition.drawOrder) {
        if (key.startsWith("hand_")) {
          const side = key.slice(5);
          if (!armFront.includes(side)) {
            const hand = this.handKey(side);
            add(hand, side === "right" ? "handR" : "handL");
            if (!hand.endsWith("_relaxed")) add(side==="right"?"bracelet":"watch",side==="right"?"forearmR":"forearmL");
          }
        } else if (!armFront.some(side => key === `arm_${side}_mesh`)) add(key);
        if (key !== "head_neck_mesh") continue;
        const glasses = clamp(f.glasses || 0, -8, 8);
        const glassWeight = smooth(0, 1, Math.abs(glasses));
        add("glasses_underpaint","head",glassWeight);
        for (const side of ["right","left"]) {
          const gaze = this.gaze(side);
          const eyeWeight = smooth(0, 0.8, Math.hypot(...gaze));
          add(`sclera_${side}`, "head", eyeWeight);
          add(`iris_${side}`, "head", eyeWeight, around([0,0], 0, [1,1], gaze), `sclera_${side}`, gaze);

          const blink = clamp(f.blinkByEye?.[side] ?? f.blink ?? 0,0,1);
          add(`lid_${side}_half`, "head", Math.min(1,2*blink));
          add(`lid_${side}_closed`, "head", Math.max(0,2*blink-1));
          const brow = clamp(f.browByEye?.[side] ?? f.brow ?? 0,-3,5);
          const browWeight = smooth(0, 0.7, Math.abs(brow));
          add(`brow_${side}_underpaint`, "head", browWeight);
          add(`brow_${side}`, "head", browWeight, around([0,0], 0, [1,1], [0,-brow]));
        }
        if (f.mouth && f.mouth !== "smile") add(`mouth_${f.mouth}`,"head",f.mouthWeight ?? 1);
        add("glasses_frame","head",glassWeight,around(this.definition.face.glassesPivot,glasses));
      }
      for (const side of armFront) {
        add(`arm_${side}_mesh`);
        const hand = this.handKey(side);
        add(hand,side==="right"?"handR":"handL");
        if (!hand.endsWith("_relaxed")) add(side==="right"?"bracelet":"watch",side==="right"?"forearmR":"forearmL");
      }
      return layers;
    }

    draw() {
      if (this.lost || !this.gpu) return;
      this.gpu.bind();
      const { gl, view } = this.gpu;
      const vdata = this.vertexData, idata = this.indexData;
      let vcount = 0, icount = 0;
      const matrices = this.matrices;
      const rotations = Object.fromEntries(Object.entries(matrices).map(([b,m]) => [b,rotation(m)]));
      const pivots = Object.fromEntries(this.definition.bones.map(b => [b.id, point(matrices[b.id], ...b.pivot)]));
      for (const layer of this.layers()) {
        const mesh = this.meshes[layer.key];
        const fixed = matrices[layer.bone] || identity;
        const mx = layer.transform ? multiply(fixed, layer.transform) : fixed;
        const clip = this.atlas.regions[layer.clip];
        const first = vcount;
        for (const [x,y,u,v,a,b,w] of mesh.vertices) {
          let [px,py] = point(matrices[a] || mx, x,y);
          if (w && b) {
            const [qx,qy] = point(matrices[b], x,y);
            px = mix(px,qx,w); py = mix(py,qy,w);
            // Compensate for shrinking at elbows and knees as two rotation matrices mix.
            const child = this.bones[a].parent === b ? a : b;
            const [jx,jy] = pivots[child];
            const norm = Math.sqrt(1 - 2*w*(1-w)*(1 - Math.cos(rotations[a]-rotations[b])));
            const volume = 1 / Math.max(0.79,norm);
            px = jx + (px-jx)*volume; py = jy + (py-jy)*volume;
          }
          const idx = vcount++ * 9;
          vdata[idx] = px; vdata[idx+1] = py; vdata[idx+2] = u; vdata[idx+3] = v;
          vdata[idx+4] = layer.opacity;
          if (clip) {
            const s = (x + layer.delta[0] - clip.origin[0]) / clip.sourceSize[0];
            const t = (y + layer.delta[1] - clip.origin[1]) / clip.sourceSize[1];
            vdata[idx+5] = (clip.uv[0]+s*clip.uv[2])/this.atlas.size[0];
            vdata[idx+6] = (clip.uv[1]+t*clip.uv[3])/this.atlas.size[1];
            vdata[idx+7] = s; vdata[idx+8] = t;
          } else {
            vdata[idx+5] = 0; vdata[idx+6] = 0; vdata[idx+7] = -10; vdata[idx+8] = 0;
          }
        }
        for (const i of mesh.indices) idata[icount++] = i + first;
      }
      gl.viewport(0,0,this.canvas.width,this.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform4fv(view, this.viewport());
      gl.bufferData(gl.ARRAY_BUFFER, vdata.subarray(0,vcount*9), gl.DYNAMIC_DRAW);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idata.subarray(0,icount), gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES,icount,gl.UNSIGNED_SHORT,0);
      this.stats = {vertices:vcount, triangles:icount/3, drawCalls:1};
    }

    dispose() {
      this.resizeObserver?.disconnect();
      this.canvas.removeEventListener("webglcontextlost",this.contextLost);
      this.canvas.removeEventListener("webglcontextrestored",this.contextRestored);
      this.gpu?.dispose();
      this.gpu = null;
    }
  }

  TillRig = { Player: MeshPlayer };
})(globalThis);

(function exposeValidationClips(global) {
  "use strict";

  const ease = t => {
    const v = Math.max(0,Math.min(1,t));
    return v*v*(3-2*v);
  };
  const pulse = (t,inStart,inEnd,outStart,outEnd) =>
    ease((t-inStart)/(inEnd-inStart)) * (1-ease((t-outStart)/(outEnd-outStart)));
  const blend = (a,b,t) => a+(b-a)*t;
  const shift = (t,at) => pulse(t,at-0.08,at,at+0.018,at+0.158);
  const offsets = (right,left,pelvis,bend = [-1,1]) => ({
    bones:{pelvis:{offset:pelvis}},
    ik:{
      footR:{target:[413+right[0],1333+right[1]],angle:0,bend:bend[0]},
      footL:{target:[592+left[0],1331+left[1]],angle:0,bend:bend[1]}
    }
  });

  const clips = {
    neutral: {label:"Bind pose",seconds:1, detail:"Master artwork split across the weighted meshes.",
      sample: () => ({}) },
    idle: {label:"Idle and blink",seconds:7.4, detail:"Chest and shoulder motion with a soft, occasional blink.",
      sample(t) {
        const breath = (1-Math.cos(t*Math.PI*4/7.4))/2;
        return {bones:{
          chest:{scale:[1+0.006*breath,1+0.005*breath],offset:[0,-1.8*breath]},
          neck:{angle:0.65*breath}, head:{angle:-0.74*breath}
        },face:{blink:shift(t,3.5)}};
      }},
    gaze: {label:"Eye tracking",seconds:6, detail:"Left, right, then up. Each iris moves inside its own eye opening.",
      sample(t) {
        const h = -pulse(t,0.3,0.65,1.45,1.95)+pulse(t,1.75,2.12,2.98,3.42);
        const v = pulse(t,3.35,3.8,4.8,5.6);
        return {bones:{neck:{angle:1.1*h-1.0*v},head:{angle:1.1*h-1.25*v,offset:[0,-1.2*v]}},
          face:{gazeByEye:{right:[5.2*h,-4.25*v],left:[4.7*h,-3.8*v]},
            blink:shift(t,1.66)+shift(t,3.29),brow:1.7*v}};
      }},
    arm: {label:"Arm raise and wrist",seconds:5.6, detail:"Sequential shoulder, elbow, and wrist rotation.",
      sample(t) {
        const lift = pulse(t,0.35,1.2,4.3,5.3), elbow = pulse(t,0.92,1.83,3.89,4.9);
        const wrist = pulse(t,1.9,2.24,2.55,2.94)-pulse(t,2.93,3.2,3.46,3.81);
        return {bones:{upperArmR:{angle:64*lift},forearmR:{angle:28*elbow},handR:{angle:24*wrist}},
          face:{blink:shift(t,1.88)}};
      }},
    knee: {label:"Knee bend",seconds:5.6, detail:"Support shoe stays fixed while the opposite knee flexes.",
      sample(t) {
        const q = pulse(t,0.4,1.65,3.8,5.25);
        return {...offsets([0,0],[39*q,-94*q],[-20*q,9*q],[-1,1]),
          face:{blink:shift(t,2.9)}};
      }},
    weight: {label:"Weight shift",seconds:6.6, detail:"Pelvis shifts above two fixed sole anchors.",
      sample(t) {
        const left = pulse(t,0.35,1.35,2.45,3.3);
        const right = pulse(t,3.26,4.35,5.24,6.19);
        const q = left-right, down = (left+right)*12;
        const p = offsets([0,0],[0,0],[-25*q,down],[-1,1]);
        p.bones.pelvis.angle = 2.1*q;
        p.bones.abdomen = {angle:-3.3*q};
        p.bones.chest = {angle:-1.5*q};
        return p;
      }},
    glasses: {label:"Glasses adjustment",seconds:5.5, detail:"Hand reaches the temple. Glasses move on their own pivot near contact.",
      sample(t) {
        const lift = pulse(t,0.3,1.73,3.52,5.15);
        const near = pulse(t,1.3,1.98,3.13,3.75);
        const glasses = 5.8*pulse(t,1.74,2.14,2.78,3.35);
        return {
          ik:{handL:{target:[blend(691,717,lift),blend(755,195,lift)],bend:-1,angle:80*near}},
          hands:{left:"pinch"},
          bones:{head:{angle:1.8*near}},
          face:{glasses,blink:shift(t,2.22)}};
      }},
    face: {label:"Expression and mouth",seconds:7, detail:"Local eye, brow, blink, and mouth texture changes.",
      sample(t) {
        const modes=["subtle_smile","relaxed","closed","open","rounded","viseme_ee","viseme_ah","viseme_oo","viseme_mbp","viseme_fv","viseme_l"];
        const phase=Math.floor(t/0.58);
        return {face:{gaze:[-2,0],blink:shift(t,3.62),brow:1.15,
          mouth:modes[phase] || "smile",mouthWeight:pulse(t,0.08,0.36,6.15,6.85)}};
      }}
  };

  TillValidationClips = clips;
})(globalThis);

/* Shared authoring helpers and registry. Load this before the clip modules. */
(function registry(global) {
  "use strict";
  const clips = new Map();
  const clamp = (x, lo=0, hi=1) => Math.max(lo,Math.min(hi,x));
  const lerp = (a,b,t) => a+(b-a)*t;
  const ease = x => {const t=clamp(x);return t*t*(3-2*t);};
  const between = (t,a,b) => ease((t-a)/(b-a));
  const pulse = (t,a,b,c,d) => between(t,a,b)*(1-between(t,c,d));
  const hold = (t,enter=.28,exit=.26) => pulse(t,0,enter,1-exit,1);
  const radians = d => d*Math.PI/180;
  const TAU = Math.PI*2;
  const v = (a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
  const blink = (t,at,close=.066,open=.121) => pulse(t,at-close,at,at+.024,at+.024+open);
  const rest = {
    footR:[413,1333],footL:[592,1331],handR:[350,757],handL:[691,755]
  };

  function define(category, records) {
    const directory=category;
    for (const record of records) {
      const [id,title,duration,sample,meta={}] = record;
      if (clips.has(id)) throw Error("Duplicate animation "+id);
      clips.set(id,Object.freeze({id,title,category,duration,sample,priority:30,loop:false,
        entry:["neutral","idle"],exit:"neutral",interruptibility:"blend",view:"front",
        facial:"independent",anchors:[],contact:[],limitation:"",
        status:"geometry sampled",recommendedSpeed:1,file:`animations/${directory}/clips.js`,...meta}));
    }
  }
  const angle = (bones,id,a) => {bones[id]={...bones[id],angle:a};};
  const shift = (bones,id,x,y) => {bones[id]={...bones[id],offset:[x,y]};};
  const axis = (ctx) => ctx.direction==="left"?-1:1;
  const tilt = (x,y) => [x*5,-y*4.15];

  function stance({x=0,y=0,lean=0,spread=0,liftR=0,liftL=0}={}) {
    return {
      bones:{pelvis:{offset:[x,y],angle:lean}},
      ik:{
        footR:{target:[rest.footR[0]-spread,rest.footR[1]-liftR],angle:0,bend:-1},
        footL:{target:[rest.footL[0]+spread,rest.footL[1]-liftL],angle:0,bend:1}
      }
    };
  }

  function arm(p,s,aim,weight,orient,hand,bend) {
    const key="hand"+s;
    p.ik ||= {};
    p.ik[key]={target:aim,weight,angle:orient,bend:bend??(s==="R"?1:-1)};
    if(hand) {
      p.hands ||= {};
      p.hands[s==="R"?"right":"left"]=hand;
      p.handWeights ||= {};
      p.handWeights[s==="R"?"right":"left"]=between(weight,.18,.75);
    }
    return p;
  }

  function face(gaze=null,mouth=null,weight=1,extra={}) {
    return {...(gaze&&{gaze}),...(mouth&&{mouth,mouthWeight:weight}),...extra};
  }

  function knots(t, list) {
    if(t<=list[0][0]) return list[0][1];
    for(let i=1;i<list.length;i++){
      const b=list[i],a=list[i-1];
      if(t<=b[0]) return lerp(a[1],b[1],between(t,a[0],b[0]));
    }
    return list.at(-1)[1];
  }
  TillMotion={clips,define,clamp,lerp,ease,between,pulse,hold,blink,radians,TAU,v,rest,stance,angle,shift,axis,tilt,arm,face,knots};
})(globalThis);

(function(){
  "use strict";
  const {define,TAU,pulse,blink,hold,stance,arm,angle,shift,face,tilt}=TillMotion;
  function breath(t,ctx,duration=6) {
    const inhale=.5-.5*Math.cos(t/duration*TAU);
    return {bones:{chest:{scale:[1+.006*inhale,1+.004*inhale],offset:[0,-1.8*inhale]},
      head:{angle:-.36*inhale}},face:{blink:0}};
  }
  const eye=(x,y)=>(t)=>{const q=hold(t,.25,.32);return {bones:{head:{angle:(x*1.2-y*.7)*q,offset:[.9*x*q,-2.2*y*q]}},
    face:face(tilt(x*q,y*q),null,1,{brow:y>.1?y*q*.9:0,blink:blink(t,.175,.028,.054)})};};
  const feet={anchors:["pelvis","soleR","soleL"],contact:["soleR","soleL"]};
  define("idle",[
    ["idle_neutral","Quiet neutral",4,()=>({}),{loop:true,priority:0,intendedUse:"Still, attentive waiting or reduced motion."}],
    ["idle_breathe","Natural breathing",6,breath,{loop:true,priority:0,intendedUse:"Subtle chest expansion while waiting."}],
    ["idle_blink","Natural blink",.75,(t)=>({face:{blink:blink(t,.34,.085,.16)}}),{layer:"face",priority:7,intendedUse:"Single natural blink."}],
    ["idle_double_blink","Double blink",1.04,(t)=>({face:{blink:Math.max(blink(t,.31,.072,.13),blink(t,.58,.073,.14))}}),{layer:"face",priority:7,intendedUse:"Occasional double blink during a pause."}],
    ["look_user","Look up at user",2.65,eye(.05,1),{anchors:["gazeR","gazeL"],intendedUse:"Acknowledge the user while remaining still."}],
    ["look_left","Look left",2.35,eye(-1,.05)],
    ["look_right","Look right",2.35,eye(1,.03)],
    ["look_down","Look down",2.5,eye(-.15,-.92)],
    ["idle_scan","Examine surroundings",4.8,(t)=>{
      const l=pulse(t,.03,.17,.35,.47),r=pulse(t,.38,.56,.74,.93);
      return {bones:{head:{angle:r*1.45-l*1.65}},face:{gaze:[5*(r-l),.9*l],blink:blink(t,.42,.017,.032)}};
    }],
    ["idle_shift","Shift weight",4.3,(t,ctx)=>{
      const q=hold(t,.34,.34),d=ctx.direction==="left"?-1:1;
      const p=stance({x:22*d*q,y:8*q,lean:2.2*d*q});
      angle(p.bones,"chest",-2.8*d*q);angle(p.bones,"head",1.1*d*q);return p;
    },feet],
    ["idle_posture","Readjust posture",3.8,(t)=>{
      const q=hold(t,.36,.32);const p=stance({x:7*q,y:4*q,lean:-1.1*q});
      shift(p.bones,"chest",-2*q,-4*q);angle(p.bones,"neck",1.6*q);return p;
    },feet],
    ["idle_stretch","Small shoulder stretch",3.35,(t)=>{
      const q=hold(t,.4,.32);const p=stance({y:3*q});shift(p.bones,"chest",0,-11*q);
      angle(p.bones,"upperArmR",12*q);angle(p.bones,"upperArmL",-13*q);angle(p.bones,"head",-2*q);
      p.face={blink:blink(t,.52,.045,.09),mouth:"relaxed",mouthWeight:q*.38};return p;
    },feet],
    ["return_neutral","Settle to neutral",.55,()=>({}),{priority:10,intendedUse:"Controller blends the live starting pose into the bind stance."}]
  ]);
})();

(function(){
  "use strict";
  const {define,TAU,between,pulse,hold,clamp,lerp,radians,stance,angle,shift}=TillMotion;
  function stage(ctx){
    const view=ctx.direction==="left"?"left":"right",d=view==="left"?-1:1;
    const data=ctx.views[view];
    const joint=Object.fromEntries(data.rig.bones.map(x=>[x.id,x.pivot]));
    const ref=id=>data.anchors.anchors[id].point;
    return {view,d,joint,ref};
  }
  function rotate([x,y],deg){
    const v=radians(deg),c=Math.cos(v),s=Math.sin(v);
    return [x*c-y*s,x*s+y*c];
  }
  // Translate a fixed, authored heel/ball or midsole pivot into an ankle target.
  function roll(s,g,key,dx,dy,pitch){
    const a=g.joint["foot"+s],p=Array.isArray(key)?key:g.ref(key+s);
    const r=rotate([a[0]-p[0],a[1]-p[1]],pitch);
    return {target:[p[0]+dx+r[0],p[1]+dy+r[1]],angle:pitch,bend:g.d};
  }
  function walk(t,ctx,opts={}){
    const g=stage(ctx), {view,d}=g;
    const length=opts.stride||342, running=!!opts.running, backwards=!!opts.backwards;
    const sign=d*(backwards?-1:1);
    const bob=(1-Math.cos(TAU*2*t))*.5;
    const root = sign*t*length+d*(ctx.distance||0);
    const p={view,bones:{root:{offset:[root,running?-21*bob:0]},
      pelvis:{offset:[-d*4*Math.sin(TAU*t),31+(running?14:10)*(1-bob)],angle:d*Math.sin(TAU*t)*2.1},
      abdomen:{angle:-d*Math.sin(TAU*t)*1.6},chest:{angle:-d*Math.sin(TAU*t)*2.6+d*(running?5:.9)},
      neck:{angle:-d*(running?3:1)},head:{angle:Math.sin(TAU*t+.27)*.85}},ik:{},contacts:{}};
    const stanceEnd=running?.43:.61;
    for(const s of ["R","L"]){
      const offset=s==="R"?0:.5,phase=t+offset,base=Math.floor(phase),u=phase-base;
      const x0=d*(ctx.distance||0) + sign*(base-offset+stanceEnd/2)*length;
      const swing=u>=stanceEnd;
      const q=clamp((u-stanceEnd)/(1-stanceEnd));
      const travelFoot=swing?sign*length*between(q,0,1):0;
      const lift=swing?Math.pow(Math.sin(Math.PI*q),1.35)*(opts.lift||66):0;
      const firstPad=backwards?"ball":"heel", lastPad=backwards?"heel":"ball";
      const firstPitch=d*(backwards?9:-12),lastPitch=d*(backwards?-10:running?23:17);
      const entry=firstPitch*(1-between(u,0,.14));
      const exit=lastPitch*between(u,stanceEnd-.2,stanceEnd);
      const pitch=swing?lerp(lastPitch,firstPitch,between(q,0,1)):entry+exit;
      const pad=u<.14?firstPad:u>stanceEnd-.2?lastPad:"sole";
      const transition=swing?TillMotion.v(g.ref(lastPad+s),g.ref(firstPad+s),between(q,.15,.85)):pad;
      p.ik["foot"+s]=roll(s,g,transition,x0+travelFoot,-lift,pitch);
      if(!swing)p.contacts[pad+s]=[g.ref(pad+s)[0]+x0,g.ref(pad+s)[1]];
      const a=Math.cos(TAU*(phase-.16));
      angle(p.bones,"upperArm"+s,-sign*a*(running?29:17));
      angle(p.bones,"forearm"+s,-d*((running?24:4)+(running?15:7)*(.5+a*.5)));
      angle(p.bones,"hand"+s,d*(1.5*a));
    }
    return p;
  }
  function walkingTransition(t,ctx,stop=false){
    const g=stage(ctx),d=g.d, lead=stop?"L":"R",trail=lead==="R"?"L":"R";
    const base=ctx.distance||0, size=stop?116:139;
    const root=base+size*(stop?(1-(1-clamp(t))**2):clamp(t)**2);
    const p={view:g.view,bones:{root:{offset:[d*root,0]},
      pelvis:{offset:[0,10+24*hold(t,.34,.33)],angle:d*2.6*hold(t,.32,.25)},
      chest:{angle:d*(stop?-2:3)*hold(t,.30,.3)},head:{angle:-d*1.2*hold(t)}},ik:{},contacts:{}};
    for (const [s,a,b] of [[lead,.07,.55],[trail,.51,.94]]) {
      const q=clamp((t-a)/(b-a)),swing=q>0&&q<1;
      const ground=d*(base+size*between(q,0,1));
      const up=swing?(s===lead?48:37)*Math.pow(Math.sin(Math.PI*q),1.4):0;
      p.ik["foot"+s]=roll(s,g,"sole",ground,-up,6*d*Math.sin(TAU*q));
      if(!swing)p.contacts["sole"+s]=[g.ref("sole"+s)[0]+ground,g.ref("sole"+s)[1]];
      angle(p.bones,"upperArm"+s,d*(s===lead?-12:10)*hold(t,.25,.36));
    }
    return p;
  }
  function frontStep(t,ctx,{obstacle=false,depth=false}={}){
    const d=ctx.direction==="left"?-1:1;
    const lead=d===1?"L":"R";
    const q1=clamp((t-.13)/.40),q2=clamp((t-.56)/.38),p=stance({x:0,y:(depth?29:13)+(depth?33:14)*hold(t,.2,.2)});
    const overall=depth?82:obstacle?125:111;
    angle(p.bones,"chest",d*1.9*pulse(t,0,.27,.70,1));
    const root=d*overall*between(t,.13,.94);
    p.bones.root={offset:depth?[0,overall*between(t,.1,.94)]:[root,0]};
    p.contacts={};
    for(const s of ["R","L"]){
      const q=s===lead?q1:q2, isMoving=q>0&&q<1;
      const step=overall*between(q,0,1);
      const up=isMoving?(obstacle?102:depth?55:39)*Math.pow(Math.sin(Math.PI*q),1.55):0;
      const a=p.ik["foot"+s].target;
      if(depth)a[1]+=step;else a[0]+=d*step;
      a[1]-=up;
      if(!isMoving){const point=s==="R"?[397,1433]:[657,1430];p.contacts["sole"+s]=depth?[point[0],point[1]+step]:[point[0]+d*step,point[1]];}
      angle(p.bones,"upperArm"+s,(s==="R"?1:-1)*7*hold(t,.22,.23));
    }
    return p;
  }
  const contacts=["heelR","ballR","soleR","heelL","ballL","soleL"];
  const profile={view:"directional",anchors:["pelvis","root",...contacts],contact:contacts,priority:45,interruptibility:"contact",
                entry:["profile_neutral","locomotion"],exit:"profile_neutral",
                limitation:"Approved profile is a separate view. Hidden far leg uses a reconstructed denim and shoe plate."};
  define("locomotion",[
    ["profile_neutral","Profile neutral",2,(_t,c)=>{const g=stage(c),p={view:g.view,bones:{root:{offset:[g.d*(c.distance||0),0]}},ik:{},contacts:{}};for(const s of ["R","L"]){p.ik["foot"+s]=roll(s,g,"sole",g.d*(c.distance||0),0,0);p.contacts["sole"+s]=[g.ref("sole"+s)[0]+g.d*(c.distance||0),g.ref("sole"+s)[1]];}return p;},{...profile,loop:true,priority:0,interruptibility:"blend"}],
    ["walk_left","Walk left",1.36,(t,c)=>walk(t,{...c,direction:"left"}),{...profile,loop:true,travel:342,direction:"left",intendedUse:"Left-facing planted two-step gait."}],
    ["walk_right","Walk right",1.36,(t,c)=>walk(t,{...c,direction:"right"}),{...profile,loop:true,travel:342,direction:"right",intendedUse:"Right-facing planted two-step gait."}],
    ["walk_slow","Slow walk",1.72,(t,c)=>walk(t,c,{stride:272,lift:56}),{...profile,loop:true,travel:272}],
    ["walk_brisk","Purposeful brisk walk",1.05,(t,c)=>walk(t,c,{stride:377,lift:71}),{...profile,loop:true,travel:377}],
    ["walk_start","Start walking",1.16,(t,c)=>walkingTransition(t,c),{...profile,travel:139,intendedUse:"Short two-foot advance from a supported profile stance."}],
    ["walk_stop","Stop walking",1.05,(t,c)=>walkingTransition(t,c,true),{...profile,travel:116,intendedUse:"Decelerating recovery to an even supported profile stance."}],
    ["step_backward","Walk backward",1.82,(t,c)=>walk(t,c,{stride:205,lift:51,backwards:true}),{...profile,loop:true,travel:-205}],
    ["step_side","Side step",1.62,frontStep,{anchors:["soleR","soleL","root"],contact:["soleR","soleL"],travel:111,priority:42}],
    ["walk_toward","Step closer",1.60,(t,c)=>frontStep(t,c,{depth:true}),{anchors:["soleR","soleL","root"],contact:["soleR","soleL"],priority:42,
      limitation:"Short front-view approach on a projected depth axis. Extend with a calibrated far/near perspective gait for large travel."}],
    ["step_over","Step over a low obstacle",2.35,(t,c)=>frontStep(t,c,{obstacle:true}),{contact:["soleR","soleL"],priority:60,
      interruptibility:"contact",anchors:["soleR","soleL","root"],travel:125}],
    ["run","Short run",.91,(t,c)=>walk(t,c,{stride:392,lift:98,running:true}),{...profile,loop:true,travel:392,interruptibility:"contact",
      limitation:"Compact profile run with a visible suspension interval. Long camera-follow runs need device review."}],
  ]);
  Object.assign(TillMotion,{profileStage:stage,profileRoll:roll});
})();

(function(){
  "use strict";
  const {define,hold,stance,arm,angle,shift,face,clamp,TAU,pulse,blink,lerp,v,radians}=TillMotion;
  const meta={anchors:["wristR","wristL","fingertipR","fingertipL","gazeR","gazeL"]};
  function wave(t,ctx,goodbye=false){
    const q=hold(t,.33,.3),a=ctx.direction==="left"?"L":"R",d=a==="R"?-1:1;
    const p=stance({x:-12*d*q,y:4*q,lean:-1.3*d*q});
    const swing=Math.sin(TAU*(goodbye?1.85:2.35)*t)*12;
    angle(p.bones,"head",d*(2.5*q));
    p.face=face(tilt(0,.42*q),"subtle_smile",.25*q,{blink:blink(t,.21,.018,.045)});
    function tilt(x,y){return [x*5,-y*4];}
    return arm(p,a,[525+d*(249+(goodbye?7:27)*q),goodbye?347:300],q,-d*(145+swing),"wave",-d);
  }
  const pointPreset={left:[82,468],right:[955,465],up:[397,120],down:[389,930]};
  function makePoint(which){
    return (t,ctx) => {
      const q=hold(t,.29,.32), aim=ctx.target||pointPreset[which];
      const s=which==="left"?"R":which==="right"?"L":aim[0]<520?"R":"L";
      const shoulder=s==="R"?[391,392]:[648,390];
      const dx=aim[0]-shoulder[0],dy=aim[1]-shoulder[1],length=Math.max(1,Math.hypot(dx,dy));
      const x=dx/length, y=dy/length;
      const reach=clamp(length-104,150,325);
      const p=stance({x:x*6*q,y:4*q,lean:x*1.2*q});
      const rotation=Math.atan2(-x,y)/radians(1);
      angle(p.bones,"head",x*1.3*q);
      p.face={gaze:[q*x*4.8,q*y*3.8]};
      return arm(p,s,[shoulder[0]+x*reach,shoulder[1]+y*reach],q,rotation,"point",s==="R"?1:-1);
    };
  }
  function offer(t,ctx,theme){
    const q=hold(t,.32,.33),s=ctx.direction==="left"?"R":"L",d=s==="R"?-1:1;
    const p=stance({x:-d*9*q,y:4*q});
    const rocks=theme==="explain"?Math.sin(t*3.1*TAU)*q:0;
    const beckon=theme==="beckon"?Math.max(0,Math.sin(t*3.5*TAU))*q:0;
    p.face=face([d*q*2,-q*1.15],"subtle_smile",q*.44,{brow:1.4*q,blink:blink(t,.72,.025,.06)});
    const aim=[525+d*(theme==="wait"?252:304)+rocks*8,theme==="wait"?396:theme==="beckon"?468:520-rocks*25];
    const kind=theme==="wait"?"open_palm":theme==="beckon"?"grip":"open_palm";
    return arm(p,s,aim,q,-d*(theme==="wait"?154:theme==="beckon"?122+30*beckon:112+rocks*6),kind,-d);
  }
  function nod(t,ctx){
    const q=hold(t,.12,.25);
    const n=pulse(t,.09,.36,.42,.65)-.25*pulse(t,.55,.71,.75,.94);
    return {bones:{head:{angle:.9*n,offset:[1*n,8*n]},neck:{angle:1.1*n,offset:[0,3*n]}},
      face:{gaze:[0,1.6*n],blink:blink(t,.33,.045,.1),mouth:"subtle_smile",mouthWeight:q*.45}};
  }
  function thumbs(t,ctx){
    const q=hold(t,.34,.3),s=ctx.direction==="left"?"R":"L",d=s==="R"?-1:1;
    const p=stance({x:-d*8*q,y:5*q});
    p.face={mouth:"subtle_smile",mouthWeight:q*.48,gaze:[0,-1.6*q]};
    angle(p.bones,"head",-d*1.7*q);
    return arm(p,s,[525+d*250,441],q,-d*159,"thumbs_up",-d);
  }
  Object.assign(TillMotion,{nod,thumbs,makePoint});
  define("communication",[
    ["wave_hello","Wave hello",2.65,wave,{...meta,intendedUse:"A brief, deliberate greeting."}],
    ["wave_goodbye","Wave goodbye",2.35,(t,c)=>wave(t,c,true),meta],
    ...Object.keys(pointPreset).map(which=>["point_"+which,"Point "+which,2.65,makePoint(which),{...meta,targetable:true,priority:50,intendedUse:"Direct attention toward a layout target.",limitation:"A projected reach. Check the actual fingertip aim tolerance."}]),
    ["present_open_palm","Present with open palm",3.2,(t,c)=>offer(t,c,"present"),meta],
    ["beckon","Small beckoning gesture",2.5,(t,c)=>offer(t,c,"beckon"),{...meta,limitation:"Forearm and wrist cue. Fingers use a fixed curl."}],
    ["explain","Explain a procedure",4.2,(t,c)=>offer(t,c,"explain"),meta],
    ["signal_wait","Ask user to wait",2.8,(t,c)=>offer(t,c,"wait"),{...meta,priority:48}],
    ["signal_attention","Call attention to a task",2.25,(t,c)=>makePoint("up")(t,c),{...meta,priority:55,targetable:true}],
    ["one_important_detail","Emphasize one detail",2.5,(t,c)=>makePoint("up")(t,c),{...meta,targetable:true,limitation:"Uses the approved index-point hand pose."}],
    ["small_nod","Nod once",1.14,nod,{anchors:["head","gazeR","gazeL"]}],
    ["shake_head","Small head shake",1.65,(t)=>{
      const q=hold(t,.23,.29),swing=Math.sin(t*TAU*1.65)*q;
      return {bones:{head:{angle:3.1*swing,offset:[5*swing,0]},neck:{angle:1.25*swing}},
        face:{gaze:[3.3*swing,0],mouth:"relaxed",mouthWeight:q*.58}};
    },{limitation:"Frontal projection approximates a modest yaw."}],
    ["shrug","Small shrug",2.0,(t)=>{
      const q=hold(t,.34,.31);const p=stance({y:4*q});
      shift(p.bones,"chest",0,-15*q);angle(p.bones,"upperArmR",14*q);angle(p.bones,"upperArmL",-14*q);
      angle(p.bones,"head",2*q);p.face={brow:2.4*q,mouth:"relaxed",mouthWeight:q*.54};return p;
    }],
    ["thumbs_up","Encouraging thumbs-up",2.35,thumbs,meta],
    ["reassure","Settle and reassure",2.95,(t,c)=>{
      const p=offer(t,c,"present"), q=hold(t,.31,.37);
      p.face={mouth:"subtle_smile",mouthWeight:.68*q,brow:1.2*q,gaze:[0,-1.1*q]};
      angle(p.bones,"head",-1.3*q);return p;
    },meta]
  ]);
})();

(function(){
  "use strict";
  const {define,hold,blink,TAU}=TillMotion;
  // Chin and torso remain on their own tracks. Expressions reuse the approved face plates.
  const expressions = {
    neutral:{},
    friendly:{mouth:"subtle_smile",mouthWeight:.48,brow:.65,gaze:[0,-.6]},
    happy:{mouth:"smile",brow:2,gaze:[.35,-1.5]},
    amused:{mouth:"subtle_smile",mouthWeight:.64,browByEye:{right:.2,left:2.45}},
    proud:{mouth:"subtle_smile",mouthWeight:.53,brow:.6,gaze:[0,-1.6]},
    thoughtful:{mouth:"closed",mouthWeight:.89,gaze:[1.1,-3.5],browByEye:{right:0,left:2.62}},
    curious:{mouth:"relaxed",mouthWeight:.61,gaze:[-1.5,-1.3],browByEye:{right:3.2,left:1.2}},
    confused:{mouth:"relaxed",mouthWeight:.84,gaze:[2,.7],browByEye:{right:3.15,left:-1.8}},
    concerned:{mouth:"relaxed",mouthWeight:.94,gaze:[0,1.2],browByEye:{right:1.1,left:2.45}},
    surprised:{mouth:"rounded",mouthWeight:.78,brow:3.9,gaze:[0,-.7]},
    shocked:{mouth:"rounded",mouthWeight:.94,brow:4.9,gaze:[0,-.1]},
    skeptical:{mouth:"closed",mouthWeight:.88,browByEye:{right:3.85,left:-.9},gaze:[-2.4,-.1]},
    determined:{mouth:"closed",mouthWeight:.93,brow:-1.4,gaze:[.75,-.3]},
    irritated:{mouth:"closed",mouthWeight:.95,browByEye:{right:-1.6,left:.25},gaze:[-1.6,.3]},
    disappointed:{mouth:"relaxed",mouthWeight:.92,browByEye:{right:1.7,left:.35},gaze:[0,2.8]},
    embarrassed:{mouth:"subtle_smile",mouthWeight:.85,browByEye:{right:-.6,left:1.9},gaze:[-3,1.9]},
    exhausted:{mouth:"relaxed",mouthWeight:.92,brow:-.8,gaze:[0,1.45],blink:.22},
    mischievous:{mouth:"subtle_smile",mouthWeight:.6,browByEye:{right:2.6,left:-.45},gaze:[2.65,-1.05]},
    reassuring:{mouth:"subtle_smile",mouthWeight:.68,brow:1.4,gaze:[0,-1]},
    focused:{mouth:"closed",mouthWeight:.91,brow:-.85,gaze:[1,1.2]},
    deadpan:{mouth:"closed",mouthWeight:.9,browByEye:{right:.26,left:.8},gaze:[0,.55],blink:.09}
  };
  const labels={irritated:"Mildly irritated"};
  function scaled(f,q){
    const out={};
    for(const [key,value] of Object.entries(f)){
      if(key==="mouth") out[key]=value;
      else if(typeof value==="number") out[key]=q*value;
      else if(Array.isArray(value)) out[key]=value.map(x=>x*q);
      else out[key]=Object.fromEntries(Object.entries(value).map(([k,x])=>[k,x*q]));
    }
    return out;
  }
  TillMotion.expressions=expressions;
  TillMotion.expressionScale=scaled;
  define("expressions",Object.entries(expressions).map(([id,values])=>[
    "face_"+id,labels[id]||id[0].toUpperCase()+id.slice(1),2.3,t=>({face:scaled(values,hold(t,.27,.3))}),
    {layer:"face",priority:23,anchors:["head","gazeR","gazeL"],intendedUse:"Independent expression for a body or idle animation.",
      limitation:"Close-up acting uses a frontal face plate. Emotion is driven by gaze, brow, lid and mouth cues."}
  ]));
})();

(function(){
  "use strict";
  const {define,stance,angle,shift,face,arm,hold,pulse,blink,clamp,lerp,TAU,between,expressionScale,expressions}=TillMotion;
  function glance(t, key, {tilt=1.5,down=0,breathe=0}={}){
    const q=hold(t,.29,.33);
    const p=stance({x:4*q,y:4*q,lean:.7*q});
    angle(p.bones,"head",tilt*q);shift(p.bones,"head",1.5*q,down*q);
    shift(p.bones,"chest",0,breathe*q);
    p.face=expressionScale(expressions[key],q);
    p.face.blink=Math.max(p.face.blink||0,blink(t,.77,.024,.071));return p;
  }
  function think(t,ctx){
    const q=hold(t,.38,.31),p=glance(t,"thoughtful",{tilt:-2});
    p.face.gaze=[q*1.2,-q*3.85];
    const reach=arm(p,"L",[615,218],q,85,"fist",-1);
    return reach;
  }
  function folds(t,ctx,annoyed=false){
    const q=hold(t,.32,.33),q2=pulse(t,.14,.38,.68,.96);
    const p=stance({x:8*q,y:4*q,lean:1.0*q});
    angle(p.bones,"head",(-1.3+(annoyed?-1:0))*q);
    p.face=expressionScale(annoyed?expressions.irritated:expressions.focused,q*.8);
    p.armFront=["right","left"];
    arm(p,"R",[553,584],q,-98,"relaxed",-1);
    arm(p,"L",[490,543],q2,97,"relaxed",1);return p;
  }
  function glasses(t,ctx){
    const p=TillValidationClips.glasses.sample(t*5.5);
    const near=hold(t,.29,.33);
    p.handWeights={left:between(near,.18,.64)};
    return p;
  }
  const upper={anchors:["head","wristL","wristR","gazeL","gazeR"]};
  const glassesMeta={anchors:["glasses","glassesTempleL","gripL","wristL"],contact:["glassesTempleL"],priority:38,
    limitation:"Hand and glasses are independently posed. The restoring skin plate is intended for light movement."};
  define("personality",[
    ["think_chin","Think with hand at chin",4.2,think,{...upper,contact:["gripL"],limitation:"Frontal reach uses a curled hand and a shallow chin-contact pose."}],
    ["think_up","Think, then look up",3.2,t=>glance(t,"thoughtful",{tilt:-1.7,down:-5}),upper],
    ["raise_eyebrow","Raise an eyebrow",2.0,t=>({face:{browByEye:{right:3.9*hold(t,.23,.33),left:0}}}),{layer:"face"}],
    ["skeptical_exam","Examine skeptically",3.25,t=>glance(t,"skeptical",{tilt:-2.2,down:1.8}),upper],
    ["deadpan","Hold a deadpan stare",3.15,t=>glance(t,"deadpan",{tilt:.1}),{...upper,intendedUse:"A dry, held reaction after an interruption."}],
    ["fold_arms","Fold arms quietly",4.1,folds,{...upper,limitation:"Projected arm crossing. Best at normal character size."}],
    ["fold_arms_irritated","Fold arms, mildly irritated",4.15,(t,c)=>folds(t,c,true),{...upper,limitation:"Projected arm crossing. Best at normal character size."}],
    ["adjust_glasses","Adjust crooked glasses",4.55,glasses,glassesMeta],
    ["knock_glasses","Knock glasses crooked",2.24,t=>{
      const q=hold(t,.27,.35),jolt=pulse(t,.27,.40,.61,.88);
      return {bones:{head:{angle:2.3*jolt,offset:[2.5*jolt,-2*jolt]},neck:{angle:-1.45*jolt}},
        face:{glasses:-7*jolt,brow:1.8*q,blink:blink(t,.43,.035,.082),mouth:"relaxed",mouthWeight:.65*q}};
    },{...glassesMeta,limitation:"Uses a head jolt and a separate frame pivot. There is no external bump surface."}],
    ["recover_glasses","Correct glasses and compose",4.25,(t,c)=>{
      const p=glasses(t,c);p.face.glasses+=-5.6*pulse(t,0,.12,.24,.53);
      p.face.mouth="subtle_smile";p.face.mouthWeight=.48*hold(t,.5,.19);return p;
    },glassesMeta],
    ["distracted","Momentary distraction",3.6,(t)=>{
      const q=pulse(t,.07,.28,.59,.9),look=pulse(t,.18,.35,.53,.82);
      return {bones:{head:{angle:-3*look,offset:[-3*look,0]}},face:{gaze:[-4.8*q,1.1*q],brow:.9*q,blink:blink(t,.73,.024,.07)}};
    },upper],
    ["sigh","Quiet sigh",3.2,t=>{
      const q=pulse(t,.05,.28,.37,.8),p=glance(t,"exhausted",{tilt:1.3,down:8});
      shift(p.bones,"chest",0,-5*q+7*hold(t,.52,.17));return p;
    },upper],
    ["quiet_laugh","Quiet laugh",3.15,t=>{
      const q=hold(t,.22,.32),p=glance(t,"amused",{tilt:-1.6});
      const chuckle=(1-Math.cos(TAU*4.7*t))*.5*q;
      shift(p.bones,"chest",0,-2.9*chuckle);shift(p.bones,"head",0,-1.3*chuckle);
      p.face.blink=Math.max(p.face.blink||0, .38*pulse(t,.27,.44,.62,.76));
      return p;
    },upper],
    ["suppress_laugh","Suppress a laugh",2.68,t=>{
      const p=glance(t,"amused",{tilt:1.2,down:2});const q=hold(t,.33,.27);
      p.face.mouth="closed";p.face.mouthWeight=.68*q;
      shift(p.bones,"chest",0,Math.sin(TAU*3.3*t)*1.4*q);
      return p;
    },upper],
    ["mischievous_look","Mischievous glance",2.75,t=>glance(t,"mischievous",{tilt:-1.9}),upper],
    ["hands_in_pockets","Rest hands at pockets",3.75,(t)=>{
      const q=hold(t,.39,.37),p=stance({x:6*q,y:6*q,lean:1*q});
      angle(p.bones,"chest",-.8*q);
      arm(p,"R",[434,749],q,-14,"fist",1);
      arm(p,"L",[613,750],q,16,"fist",-1);
      p.pocketOcclusion=between(q,.64,.96);
      return p;
    },{...upper,limitation:"Near-pocket pose uses occlusion and an approximate front-plane hand path."}]
  ]);
  TillMotion.reactionGlance=glance;
})();

(function(){
  "use strict";
  const {define,hold,reactionGlance:glance}=TillMotion;
  const upper={anchors:["head","wristL","wristR","gazeL","gazeR"]};
  define("reactions",[
    ["react_confused","Brief confusion",2.65,t=>glance(t,"confused",{tilt:3.5,down:1.8}),upper],
    ["react_realize","Realization",2.1,t=>{
      const p=glance(t,"surprised",{tilt:-1.6,down:-5});p.face.gaze=[1.5*hold(t,.19,.3),-3*hold(t,.19,.3)];
      return p;
    },upper],
    ["react_embarrassed","Recover after a mistake",3.25,t=>glance(t,"embarrassed",{tilt:-1.6,down:4.1}),upper],
    ["react_frustrated","Restrained frustration",3.0,t=>glance(t,"irritated",{tilt:-1.8,down:3,breathe:3}),upper],
    ["react_exhausted","Exhausted pause",3.9,t=>glance(t,"exhausted",{tilt:2.3,down:9,breathe:6}),upper],
    ["react_reenergize","Recover enthusiasm",2.75,t=>glance(t,"friendly",{tilt:-2.3,down:-3.5,breathe:-6}),upper]
  ]);
})();

(function(){
  "use strict";
  const {define,stance,profileStage,profileRoll,arm,angle,shift,hold,pulse,face,TAU,between,clamp,lerp}=TillMotion;
  const soles=["soleR","soleL"],grips=["gripR","gripL"];
  const contact={anchors:["root","pelvis","seat",...soles,...grips],contact:soles,priority:60};
  const planted=(p)=>{p.contacts={soleR:[397,1433],soleL:[657,1430]};return p;};
  function sitAt(depth,ctx,dangle=0){
    const g=profileStage(ctx),{d,view}=g,near=d>0?"R":"L";
    const far=near==="R"?"L":"R";
    const p={view,bones:{pelvis:{offset:[-d*49*depth,249*depth],angle:d*2.2*depth},
        abdomen:{angle:-d*4.5*depth},chest:{angle:d*7*depth},neck:{angle:-d*4.3*depth},
        head:{angle:d*.8*depth}},ik:{},contacts:{}};
    for (const s of [near,far]){
      const isNear=s===near, swing=depth*dangle*(isNear?1:-1);
      const step=(isNear?132:102)*depth+swing*17;
      const up=30*depth*Math.abs(dangle);
      const origin=g.ref("sole"+s);
      p.ik["foot"+s]=profileRoll(s,g,"sole",d*step,-up,-d*2.5*swing);
      if(!dangle)p.contacts["sole"+s]=[origin[0]+d*step,origin[1]];
      angle(p.bones,"upperArm"+s,-d*29*depth);
      angle(p.bones,"forearm"+s,-d*18*depth);
    }
    return p;
  }
  function sit(t,c,up=false){
    const move=(up?1-between(t,.11,.86):between(t,.08,.82));
    const p=sitAt(move,c);
    const g=profileStage(c), d=g.d;
    // A front foot repositions before the descent. Standing reverses the order.
    const slide=up?1-between(t,.70,.98):between(t,.06,.36);
    const u=up?clamp((t-.69)/.3):clamp((t-.05)/.31);
    for (const s of ["R","L"]){
      const offset=(s===(d>0?"R":"L")?132:102)*slide;
      const lift=24*(Math.sin(Math.PI*u)**2);
      p.ik["foot"+s]=profileRoll(s,g,"sole",d*offset,-lift,0);
      if(lift<.05)p.contacts["sole"+s]=[g.ref("sole"+s)[0]+d*offset,g.ref("sole"+s)[1]];
      else delete p.contacts["sole"+s];
    }
    return p;
  }
  function reaches(t,c,kind) {
    const q=hold(t,.36,.33),d=c.direction==="left"?-1:1,side=d>0?"L":"R";
    const p=planted(stance({x:d*12*q,y:kind==="down"?36*q:6*q,lean:d*1.7*q}));
    const target=c.target||{
      overhead:[525+d*237,125],down:[525+d*242,929],side:[525+d*437,567],
      grasp:[525+d*305,496],push:[525+d*(272+110*q),519],pull:[525+d*(355-90*q),526]
    }[kind];
    const wristColor=kind==="overhead"?-d*148:kind==="down"?0:-d*86;
    const grab=kind==="pull"||kind==="grasp";
    angle(p.bones,"chest",d*(kind==="pull"?-4.3:3.1)*q);
    angle(p.bones,"head",-d*1.7*q);
    p.face={gaze:[d*4*q,(kind==="overhead"?-3.9:kind==="down"?3.8:.5)*q]};
    return arm(p,side,target,q,wristColor,grab?"grip":"open_palm",-d);
  }
  function jump(t,c,landOnly=false) {
    const anticip=landOnly?0:pulse(t,.01,.16,.2,.32);
    const flight=landOnly?0:Math.sin(Math.PI*clamp((t-.25)/.39))**1.18;
    const landing=pulse(t,landOnly?0:.59,landOnly?.21:.73,landOnly?.31:.76,landOnly?.82:.98);
    const p=stance({y:51*anticip+61*landing+7*flight,lean:1.25*landing});
    const rise=128*flight;
    p.bones.root={offset:[0,-rise]};
    p.ik.footR.target[1]-=rise+23*flight;
    p.ik.footL.target[1]-=rise+30*flight;
    angle(p.bones,"chest",(4.1*anticip-2.2*flight+3.4*landing));
    angle(p.bones,"upperArmR",19*flight+10*landing);
    angle(p.bones,"upperArmL",-15*flight-9*landing);
    p.face={brow:1.25*flight,gaze:[0,2.3*landing]};
    if(flight<.001)planted(p);
    return p;
  }
  function support(t,c,kind){
    const q=hold(t,.30,.3), d=c.direction==="left"?-1:1;
    const loss=kind==="slip"?Math.sin(TAU*2.2*t)*q:kind==="recover"?Math.sin(TAU*1.65*t)*q:0;
    const p=planted(stance({x:(21*q+18*loss)*d,y:15*q,lean:(3.6*q+4.4*loss)*d}));
    angle(p.bones,"chest",(-7.5*q-4.1*loss)*d);
    angle(p.bones,"head",2.1*d*q);
    const armQ=kind==="lean"?8:27;
    angle(p.bones,"upperArmR",(armQ*q+15*loss));
    angle(p.bones,"upperArmL",(-armQ*q-5*loss));
    p.face={gaze:[2.8*d*q,kind==="lean"?1.4:2.1*q],brow:1.2*q};return p;
  }
  function hang(t,c,pull=false){
    const q=hold(t,.34,.32), haul=pull?pulse(t,.33,.54,.64,.81):0;
    const p=stance({y:10*q,liftR:14*q,liftL:22*q});
    const rise=90*q+107*haul;
    p.bones.root={offset:[0,-rise]};
    p.ik.footR.target[1]-=rise;
    p.ik.footL.target[1]-=rise;
    angle(p.bones,"chest",3.2*haul);angle(p.bones,"head",-1.9*q);
    arm(p,"R",[320,180],q,147,"ledge",1);
    arm(p,"L",[728,180],q,-147,"ledge",-1);
    p.face={mouth:"closed",mouthWeight:.68*q,brow:-.8*q,gaze:[0,-2.6*q]};
    if(q<.001)planted(p);
    return p;
  }
  const profile={...contact,view:"directional",entry:["profile_neutral","seated"],exit:"seated",
    limitation:"Profile seat on an inferred horizontal surface. Pelvis seat anchor is the mounting point."};
  const reach={...contact,targetable:true,anchors:["wristR","wristL",...grips,"head",...soles]};
  define("physical",[
    ["sit_down","Sit down",2.4,(t,c)=>sit(t,c),{...profile,interruptibility:"contact",intendedUse:"Controlled descent to a profile seat anchor."}],
    ["seated_hold","Seated hold",3.6,(_t,c)=>sitAt(1,c),{...profile,loop:true,priority:12,entry:["seated"],exit:"seated"}],
    ["stand_up","Stand up",2.32,(t,c)=>sit(t,c,true),{...profile,entry:["seated"],exit:"profile_neutral",interruptibility:"contact"}],
    ["seated_dangle","Seated with legs dangling",3.65,(t,c)=>sitAt(1,c,Math.sin(TAU*t)*.72),
      {...profile,contact:["seat"],entry:["seated"],exit:"seated",loop:true}],
    ["crouch","Crouch and rise",3.2,(t,c)=>{
      const q=hold(t,.36,.34), p=planted(stance({x:-5*q,y:68*q,spread:0,lean:-2.1*q}));
      angle(p.bones,"chest",4.2*q);angle(p.bones,"head",-2.1*q);
      angle(p.bones,"upperArmR",13*q);angle(p.bones,"upperArmL",-12*q);
      p.face={gaze:[0,2.3*q]};return p;
    },{...contact,interruptibility:"contact"}],
    ...["overhead","down","side","grasp","pull","push"].map(kind=>[
      ({down:"reach_down",side:"reach_sideways",overhead:"reach_overhead"})[kind]||kind,
      ({down:"Reach down",side:"Reach sideways",overhead:"Reach overhead",grasp:"Grasp",pull:"Pull",push:"Push"})[kind],
      3.2,(t,c)=>reaches(t,c,kind),reach]),
    ["jump","Small jump and land",1.54,jump,{...contact,interruptibility:"locked",priority:72}],
    ["land","Absorb a landing",1.1,(t,c)=>jump(t,c,true),{...contact,interruptibility:"locked",priority:72}],
    ["hang_both","Hang by both hands",3.85,(t,c)=>hang(t,c,false),{...contact,contact:grips,interruptibility:"contact",
      limitation:"Front projection. Inspect both ledge sockets before assigning a supporting real interface surface."}],
    ["pull_up","Hanging pull-up",4.15,(t,c)=>hang(t,c,true),{...contact,contact:grips,interruptibility:"contact",
      limitation:"Vertical hauling motion. Full ledge climb and rollover need a separate depth pose."}],
    ["balance","Hold balance",3.4,(t,c)=>support(t,c,"balance"),contact],
    ["lose_balance","Brief wobble",2.55,(t,c)=>support(t,c,"slip"),{...contact,interruptibility:"contact"}],
    ["recover_balance","Recover balance",2.45,(t,c)=>support(t,c,"recover"),contact],
    ["lean","Lean to look",2.8,(t,c)=>support(t,c,"lean"),contact],
    ["elbows_rest","Rest elbows at a surface",3.65,(t,c)=>{
      const q=hold(t,.37,.34),p=planted(stance({x:0,y:29*q}));
      angle(p.bones,"chest",4*q);shift(p.bones,"chest",-5*q,12*q);
      arm(p,"R",[439,597],q,-107,"relaxed",-1);
      arm(p,"L",[611,600],q,103,"relaxed",1);
      return p;
    },{...contact,anchors:["elbowR","elbowL",...soles],limitation:"Projected elbow brace. Confirm surface height in Step 5."}]
  ]);
})();

(function(){
  "use strict";
  const {define,nod,thumbs,pulse,hold,stance,angle,shift,arm,TAU}=TillMotion;
  function win(t,c,size){
    const q=hold(t,.27,.3),s=c.direction==="left"?"R":"L",d=s==="R"?-1:1;
    const p=stance({x:-d*11*q,y:7*q,lean:d*1.8*q});
    const accent=pulse(t,.27,.43,.52,.77);
    shift(p.bones,"chest",0,-size*2.8*accent);
    angle(p.bones,"head",-d*size*.8*accent);
    p.face={gaze:[0,-1.2*q],brow:size*.8*q,mouth:"subtle_smile",mouthWeight:.36*q};
    arm(p,s,[525+d*(size>1?270:240),491-(27+size*23)*accent],q,-d*147,"fist",-d);
    if(size>2)arm(p,s==="L"?"R":"L",[525-d*272,405-42*accent],q*.91,d*147,"fist",d);
    return p;
  }
  define("celebrations",[
    ["approve_nod","Small approving nod",1.3,nod,{priority:35,intendedUse:"Routine checkbox or acknowledgement."}],
    ["satisfied_smile","Satisfied smile",2.35,t=>({face:{mouth:"subtle_smile",mouthWeight:.66*hold(t,.30,.33),brow:.8*hold(t)}}),
      {layer:"face",priority:32,intendedUse:"A quiet result confirmation."}],
    ["celebrate_thumbs","Approved with thumbs-up",2.4,thumbs,{priority:39,intendedUse:"Milestone or task group."}],
    ["fist_pump","Subtle fist pump",2.1,(t,c)=>win(t,c,1),{priority:42,intendedUse:"A meaningful completed task."}],
    ["proud_stance","Proud stance",2.75,t=>{
      const q=hold(t,.35,.34),p=stance({x:4*q,y:4*q});
      shift(p.bones,"chest",0,-8*q);angle(p.bones,"upperArmR",6*q);angle(p.bones,"upperArmL",-6*q);
      p.face={gaze:[0,-1.4*q],brow:1.02*q,mouth:"subtle_smile",mouthWeight:.42*q};return p;
    },{priority:38}],
    ["celebrate_milestone","Brief celebration",2.55,(t,c)=>win(t,c,2),{priority:46,intendedUse:"Finishing a set of responsibilities."}],
    ["celebrate_shift","Shift complete",3.3,(t,c)=>win(t,c,3),{priority:49,intendedUse:"End of shift. Two-arm release and settle."}]
  ]);
})();

/* Uses the Step 3 renderer with additive blend layers and a selected view atlas. */
(function expose(global){
  "use strict";
  class PosePlayer extends TillRig.Player {
    handKey(side){
      const commanded=super.handKey(side),prefix="hand_"+side+"_";
      const candidate=commanded.slice(prefix.length);
      const weight=this.pose.handWeights?.[side]??1;
      const mixed=this.pose.handMix?.[side]??(candidate==="relaxed"?[["relaxed",1]]:[["relaxed",1-weight],[candidate,weight]]);
      const totals=new Map();
      for(const [key,w] of mixed)totals.set(key,(totals.get(key)||0)+w);
      // One continuously opaque sprite keeps fingers legible during the wrist turn.
      const active=[...totals].filter(([key,w])=>w>.002&&this.meshes[prefix+key])
        .sort((a,b)=>b[1]-a[1])[0];
      return active?prefix+active[0]:commanded;
    }
    layers(){
      const pose=this.pose, face=pose.face, result=super.layers();
      if(face?.mouthMix?.length){
        let i=result.findIndex(x=>x.key==="glasses_frame");
        if(i<0)i=result.findIndex(x=>x.key==="torso_mesh");
        if(i>=0)for(const [shape,opacity] of face.mouthMix){
          const key="mouth_"+shape;
          if(this.meshes[key]&&opacity>.001&&shape!=="smile")result.splice(i++,0,{key,bone:"head",opacity});
        }
      }
      const cover=pose.pocketOcclusion||0;
      for(const side of ["right","left"]){
        const visibility=pose.handVisibility?.[side]??1;
        if(cover<=.002&&visibility>=1)continue;
        const index=result.findIndex(x=>x.key===this.handKey(side));
        if(index<0)continue;
        const layer=result[index];
        const opacity=visibility*(1-cover);
        result.splice(index,1,...(opacity>.001?[{...layer,opacity}]:[]));
        const hip=result.findIndex(x=>x.key==="pelvis_mesh");
        if(hip>=0&&cover>.002)result.splice(hip,0,{...layer,opacity:visibility*cover});
      }
      return result;
    }
  }
  class Views {
    constructor(canvas,views,options={}){
      this.canvas=canvas;this.views=views;this.options=options;this.current=null;this.player=null;this.pose=null;
    }
    apply(pose){
      const view=pose.view||"front";
      if(view!==this.current){
        this.player?.dispose();
        const data=this.views[view];
        this.player=new PosePlayer(this.canvas,{...data,...this.options});
        this.current=view;
        this.lastSubmission=null;
      }
      this.pose=pose;
      const signature=JSON.stringify(pose);
      if(signature!==this.lastSubmission){
        this.player.setPose(pose);
        this.lastSubmission=signature;
      }
      return this.player;
    }
    dispose(){this.player?.dispose();this.player=null;this.current=null;}
  }
  TillPosePlayer={PosePlayer,Views};
})(globalThis);

/* A bounded, deterministic 2D socket solver on the existing weighted skeleton. */
(function contactRuntime(global){
  "use strict";
  const M=TillMotion, D=Math.PI/180, I=[1,0,0,1,0,0];
  const transform=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const wrap=x=>Math.atan2(Math.sin(D*x),Math.cos(D*x))/D;
  const turn=(p,x)=>[p[0]*Math.cos(D*x)-p[1]*Math.sin(D*x),p[0]*Math.sin(D*x)+p[1]*Math.cos(D*x)];
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const anatomical=s=>s==="R"?"right":"left";
  const angle=m=>Math.atan2(m[1],m[0])/D;

  function anatomicalAnchor(player,matrices,pose,key){
    const entity=player.anchors[key];
    if(!entity)return undefined;
    let p=entity.point;
    if(entity.transform==="glasses"){
      const c=player.definition.face.glassesPivot;
      p=add(c,turn(sub(p,c),M.clamp(pose.face?.glasses||0,-8,8)));
    }
    return transform(matrices[entity.bone]||I,p);
  }

  function solveHand(player,p,task,checks){
    const side=task.side,hand="hand"+side,key="hand_"+anatomical(side)+"_"+task.hand;
    const v=player.assetManifest.handVariants[key];
    const socket=v?.[task.socket];
    if(!socket||task.weight<.003)return;
    const existing=player.skeleton.set(p);
    const target=Array.isArray(task.target)?task.target:anatomicalAnchor(player,existing,p,task.target);
    if(!target)return;
    const pivot=player.bones[hand].pivot;
    const delta=sub(socket,pivot);
    const bend=task.bend??(side==="R"?1:-1);
    const width=task.range??19;
    const preferred=task.angle??0;
    const ik=p.ik;
    const initial=ik[hand];
    const w=M.between(task.weight,0,.973);
    // Treat the desired wrist axis as a soft preference. Evaluate the exact
    // skeleton at a few bounded angles, including the previous optimum range.
    function score(orientation,arc){
      const aim=sub(target,turn(delta,orientation));
      const candidate={target:aim,angle:orientation,bend:arc,weight:1};
      ik[hand]=candidate;
      const result=player.skeleton.set(p);
      const contact=transform(result[hand],socket);
      const e=dist(contact,target);
      const a=angle(result[hand]);
      const loss=e+.044*Math.abs(wrap(orientation-preferred))+.018*Math.abs(wrap(a-orientation))
        +(arc===bend?0:2.25);
      return {candidate,orientation,contact,loss};
    }
    let best;
    const evaluate=(x,b)=>{
      const sample=score(x,b);
      if(!best||sample.loss<best.loss)best=sample;
    };
    for(const offset of [0,-width/3,width/3,-2*width/3,2*width/3,-width,width])evaluate(preferred+offset,bend);
    if(best.loss>6&&task.allowAlternate)for(const offset of [0,-width/2,width/2,-width,width])evaluate(preferred+offset,-bend);
    const steer=best.orientation,arc=best.candidate.bend;
    for(const d of [-2,2])evaluate(steer+d,arc);
    ik[hand]={...best.candidate,weight:w};
    if(initial&&w<.02)ik[hand]=initial;
    p.hands[anatomical(side)]=task.hand;
    p.handWeights[anatomical(side)]=M.between(w,.2,.55);
    checks.push({id:task.id||task.socket+side,kind:"hand",side,point:socket,target,
      held:task.weight>.985,orientation:angle(existing[hand]),weight:w});
  }

  function supportElbows(player,p,checks){
    const {plane,weight}=p.elbowSupport;
    if(weight<.004)return;
    const neutral=player.skeleton.set(p);
    for(const side of ["R","L"]){
      const upper="upperArm"+side,lower="forearm"+side;
      const bone=player.bones[upper],base=player.bones[lower].pivot,parent=neutral[bone.parent];
      const shoulder=transform(parent,bone.pivot),down=plane-shoulder[1];
      const end=transform(parent,base),length=dist(end,shoulder);
      if(Math.abs(down)>length-2)continue;
      const sign=side==="R"?-1:1;
      const reach=[shoulder[0]+sign*Math.sqrt(length*length-down*down),plane];
      const desired=Math.atan2(down,reach[0]-shoulder[0])/D;
      const bind=Math.atan2(base[1]-bone.pivot[1],base[0]-bone.pivot[0])/D;
      const upperAngle=wrap(desired-angle(parent)-bind);
      p.bones[upper]={angle:upperAngle*weight};
      const wrist=player.bones["hand"+side].pivot;
      const forearmBind=Math.atan2(wrist[1]-base[1],wrist[0]-base[0])/D;
      const supportedAngle=side==="R"?8:172;
      p.bones[lower]={angle:wrap(supportedAngle-angle(parent)-upperAngle-forearmBind)*weight};
      checks.push({id:"elbow"+side,kind:"anchor",target:reach,held:weight>.985,weight});
    }
  }

  function mountSeat(player,p,checks){
    const {target,clearance}=p.seatMount;
    const m=player.skeleton.set(p),seat=anatomicalAnchor(player,m,p,"seat");
    if(!seat)return;
    const delta=sub(target,seat);
    const root=p.bones.root||{};
    p.bones.root={...root,offset:add(root.offset||[0,0],delta)};
    for(const control of Object.values(p.ik))control.target=add(control.target,delta);
    for(const [id,value] of Object.entries(p.contacts||{}))p.contacts[id]=add(value,delta);
    checks.push({id:"seat",kind:"anchor",target,held:true,weight:1,clearance});
  }

  function resolve(player,pose){
    if(!pose.socketContacts&&!pose.elbowSupport&&!pose.seatMount)return {...pose,contactReport:[]};
    const p={...pose,bones:{...pose.bones},ik:Object.fromEntries(Object.entries(pose.ik||{}).map(([k,v])=>[k,{...v}])),
      hands:{...pose.hands},handWeights:{...pose.handWeights},contacts:{...pose.contacts}};
    const checks=[];
    if(p.seatMount)mountSeat(player,p,checks);
    if(p.elbowSupport)supportElbows(player,p,checks);
    for(const task of p.socketContacts||[])solveHand(player,p,task,checks);
    const m=player.skeleton.set(p);
    p.contactReport=checks.map(check=>{
      const actual=check.kind==="hand"?transform(m["hand"+check.side],check.point):anatomicalAnchor(player,m,p,check.id);
      return {...check,actual,error:dist(actual,check.target)};
    });
    return p;
  }

  function propTransform(prop){
    const a=(prop.angle||0)*D,c=Math.cos(a),s=Math.sin(a);
    return [c,s,-s,c,prop.origin[0],prop.origin[1]];
  }

  function visemeBlend(from,to,fraction){
    const q=M.ease(fraction);
    return {mouthMix:from===to?[[to,1]]:[[from,1-q],[to,q]]};
  }

  const Original=TillPosePlayer;
  class Player extends Original.PosePlayer{
    setPose(pose={}){
      const output=resolve(this,pose);
      if(output.face?.mouthMix?.length)output.face={...output.face,mouth:undefined};
      this.lastSource=pose;
      super.setPose(output);
    }
    layers(){
      const layers=super.layers();
      if(this.pose.face?.mouthMix?.length){
        let remaining=1;
        for(const layer of [...layers].reverse()){
          if(!layer.key.startsWith("mouth_"))continue;
          const contribution=layer.opacity;
          layer.opacity=Math.min(1,contribution/Math.max(.001,remaining));
          remaining=Math.max(0,remaining-contribution);
        }
      }
      const prop=this.pose.board;
      if(prop&&this.meshes.prop_clipboard_side&&prop.opacity>.015){
        const i=layers.findIndex(x=>x.key.startsWith("hand_"));
        layers.splice(i<0?layers.length:i,0,{key:"prop_clipboard_side",opacity:prop.opacity,transform:propTransform(prop)});
      }
      return layers;
    }
  }

  TillV2 = { Player, resolve };
})(globalThis);

/* Repaired performances and new workplace gestures. V1 remains available for comparison. */
(function repairs(global){
  "use strict";
  const M=TillMotion,{hold,pulse,between,clamp,TAU,stance,angle,shift,blink,face,lerp}=M;
  const original=new Map(M.clips);
  const edit=(id,fn,changes={})=>M.clips.set(id,Object.freeze({...original.get(id),...changes,sample:fn}));
  const base=(id,t,c)=>original.get(id).sample(t,c);
  const polar=(key,target,weight,deg,hand,socket,range=26,bend)=>
    ({id:key,side:key.endsWith("R")?"R":"L",target,weight,angle:deg,hand,socket,range,bend});
  const grounded=p=>(p.contacts={soleR:[397,1433],soleL:[657,1430]},p);

  edit("adjust_glasses",(t,c)=>{
    const grasp=hold(t,.39,.28),turn=pulse(t,.42,.51,.64,.73);
    const p=grounded(stance({x:2*grasp,y:4*grasp}));
    angle(p.bones,"head",1.5*grasp);p.face={glasses:3.6*turn,brow:.65*grasp,
      blink:blink(t,.61,.023,.067),gaze:[.65*grasp,.15*grasp]};
    p.socketContacts=[polar("pinchL","glassesTempleL",grasp,87,"pinch","grip",22,-1)];
    return p;
  });
  edit("recover_glasses",(t,c)=>{
    const p=M.clips.get("adjust_glasses").sample(t,c);
    const recover=pulse(t,0,.10,.33,.54);
    p.face.glasses-=3.5*recover;
    p.face.mouth="subtle_smile";p.face.mouthWeight=.38*pulse(t,.63,.74,.83,1);
    return p;
  });
  edit("reach_down",(t,c)=>{
    const q=hold(t,.36,.34),d=c.direction==="left"?-1:1,s=d>0?"L":"R";
    const p=grounded(stance({x:11*d*q,y:47*q,lean:2.2*d*q}));
    angle(p.bones,"chest",5.8*d*q);angle(p.bones,"head",-2.9*d*q);
    p.face={gaze:[2.1*d*q,3.2*q],brow:-.65*q};
    const target=c.target||[525+221*d,914];
    p.socketContacts=[polar("fingertip"+s,target,q,-7*d,"point","fingertip",29,-d)];
    p.surfaces=[{kind:"target",points:[target],opacity:q}];
    return p;
  });

  function hang(t,c,haul){
    const q=hold(t,.36,.32);
    const lift=haul?pulse(t,.39,.52,.58,.67):0;
    // Ledge is fixed. Raise the body after the fingers reach it, with a small leg fold.
    const drop=-80*pulse(t,.30,.43,.66,.87)-33*lift;
    const p=stance({y:5*q,liftR:9*q,liftL:17*q});
    p.bones.root={offset:[0,drop]};
    p.ik.footR.target[1]+=drop;p.ik.footL.target[1]+=drop;
    angle(p.bones,"chest",.55*lift);angle(p.bones,"head",-1.65*q);
    p.face={mouth:"closed",mouthWeight:.48*q,brow:-.53*q,gaze:[.1,-2.25*q]};
    const [a,b]=c.ledge||[[210,91],[842,91]];
    p.socketContacts=[
      polar("ledgeR",a,q,146,"ledge","ledge",22,1),
      polar("ledgeL",b,q,-146,"ledge","ledge",22,-1)
    ];
    p.surfaces=[{kind:"ledge",points:[a,b],opacity:q}];
    return p;
  }
  edit("hang_both",(t,c)=>hang(t,c,false));
  edit("pull_up",(t,c)=>hang(t,c,true));

  edit("seated_dangle",(t,c)=>{
    const p=base("seated_hold",0,c),stage=M.profileStage(c),d=stage.d;
    const keys=["R","L"];
    delete p.contacts;
    for(let i=0;i<keys.length;i++){
      const key=keys[i],x=Math.sin(TAU*t+(i?Math.PI:0));
      p.ik["foot"+key].target[0]+=d*(43+x*19);
      p.ik["foot"+key].target[1]-=67+7*Math.cos(TAU*t+(i?Math.PI:0));
      p.ik["foot"+key].angle=d*x*6;
    }
    const side=d>0?1:-1,seat=c.seat||[525-72*side,970];
    p.seatMount={target:seat,clearance:40};
    p.surfaces=[{kind:"seat",points:[[seat[0]-145,seat[1]],[seat[0]+112,seat[1]]],opacity:1}];
    return p;
  });

  edit("elbows_rest",(t,c)=>{
    const q=hold(t,.38,.35),p=grounded(stance({y:9*q}));
    angle(p.bones,"head",1.3*q);shift(p.bones,"chest",0,7*q);
    const y=c.surfaceY??545;
    p.elbowSupport={plane:y,weight:q};
    p.armFront=q>.42?["right","left"]:[];
    p.surfaces=[{kind:"elbow",points:[[245,y],[800,y]],opacity:q}];
    return p;
  });

  edit("think_chin",(t,c)=>{
    const q=hold(t,.36,.31),p=grounded(stance({x:7*q,y:4*q}));
    angle(p.bones,"head",-2.1*q);p.face={mouth:"closed",mouthWeight:.72*q,browByEye:{left:.8*q,right:.17*q},gaze:[1.25*q,-1.9*q]};
    p.socketContacts=[polar("chinL","chin",q,82,"fist","grip",25,-1)];
    return p;
  });

  function workplace(t,c,write){
    const q=hold(t,.34,.30),p=grounded(stance({x:6*q,y:4*q,lean:.8*q}));
    const origin=c.boardOrigin||[452,614],paper=write?Math.sin(TAU*3.2*t)*17:0;
    p.board={origin,opacity:q,angle:0};
    p.armFront=["right","left"];
    p.face={gaze:[-.65*q,2.7*q],mouth:"closed",mouthWeight:.54*q,brow:.4*q};
    p.socketContacts=[polar("clipboardGripL",[origin[0]+121,origin[1]+103],q,88,"grip","grip",28,1)];
    if(write) p.socketContacts.push(polar("penTipR",[origin[0]+73+paper,origin[1]+75+13*pulse(t,.52,.6,.68,.72)],
      q,-77,"pen","propTip",27,-1));
    return p;
  }
  M.define("physical",[
    ["clipboard_carry_top","Carry clipboard by top clip",3.4,(t,c)=>{
      const q=hold(t,.31,.32),p=grounded(stance({x:6*q,y:5*q}));
      M.arm(p,"L",[680,695],q,-2,"clipboard",-1);
      p.face={gaze:[.9*q,1.1*q]};return p;
    },{intendedUse:"Carry the prop by its top clip with a near-vertical board.",anchors:["gripL","wristL"]}],
    ["clipboard_hold_side","Hold the clipboard at its side",3.8,(t,c)=>workplace(t,c,false),
      {intendedUse:"Support a portrait-oriented clipboard by its side edge.",anchors:["gripL","wristL"],contact:["gripL"]}],
    ["write_on_clipboard","Write a short note",4.1,(t,c)=>workplace(t,c,true),
      {intendedUse:"Support the board while writing with the opposite hand.",anchors:["gripL","propTipR","wristR"],contact:["gripL","propTipR"]}]
  ]);

  const tuning={
    neutral:{},friendly:{mouth:"subtle_smile",mouthWeight:.45,brow:.62,gaze:[0,-.52]},
    amused:{mouth:"subtle_smile",mouthWeight:.57,browByEye:{right:.3,left:1.5}},
    confused:{mouth:"relaxed",mouthWeight:.66,gaze:[1.25,.3],browByEye:{right:2.1,left:-.45}},
    surprised:{mouth:"rounded",mouthWeight:.53,brow:2.5,gaze:[0,-.65]},
    shocked:{mouth:"rounded",mouthWeight:.64,brow:3,gaze:[0,-.25]},
    skeptical:{mouth:"closed",mouthWeight:.73,browByEye:{right:2.5,left:-.45},gaze:[-1.7,.1]},
    irritated:{mouth:"closed",mouthWeight:.73,browByEye:{right:-.8,left:.2},gaze:[-1.4,.3]},
    embarrassed:{mouth:"subtle_smile",mouthWeight:.63,browByEye:{right:-.45,left:1.2},gaze:[-2,1.4]},
    exhausted:{mouth:"relaxed",mouthWeight:.74,brow:-.5,gaze:[0,1.35],blink:.14},
    deadpan:{mouth:"closed",mouthWeight:.75,browByEye:{right:.25,left:.63},gaze:[0,.47],blink:.05}
  };
  Object.assign(M.expressions,tuning);
  for(const [name,style] of Object.entries(M.expressions)){
    edit("face_"+name,t=>({face:M.expressionScale(style,hold(t,.31,.37))}));
  }
  edit("idle_blink",(t)=>({face:{blink:blink(t,.34,.069,.14)}}));
  edit("idle_double_blink",(t)=>({face:{blink:Math.max(blink(t,.31,.056,.104),blink(t,.57,.061,.131))}}));
  // Ease the small guide and reward beats without replacing the approved body curves.
  for(const id of ["wave_hello","wave_goodbye","thumbs_up","fist_pump","celebrate_shift","signal_wait","approve_nod"]){
    edit(id,(t,c)=>{
      const p=base(id,t,c);
      const q=hold(t,.28,.32);
      if(p.face?.brow)p.face.brow*=.84;
      if(p.face?.mouthWeight)p.face.mouthWeight*=.92;
      if(p.bones?.head?.angle)p.bones.head.angle*=.86;
      if(p.ik?.handR?.angle!=null&&id==="signal_wait")p.ik.handR.angle+=3*q;
      return p;
    });
  }

})(globalThis);

export const Motion = TillMotion;
export const RigPlayer = TillV2.Player;
