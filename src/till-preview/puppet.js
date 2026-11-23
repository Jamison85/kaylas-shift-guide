// A small texture mesh flexes the approved painting in place. The bottom edge
// stays planted. All offsets are in fractions of that pose's own image.
const vertex = `
attribute vec2 point;
varying vec2 uv;
uniform float time, writing, wave, glance, gesture;
uniform vec2 head;
float weight(vec2 center, vec2 radius) {
  vec2 d = (point - center) / radius;
  return exp(-dot(d,d));
}
void main() {
  uv = point;
  vec2 p = point;
  float breath = sin(time * 2.15);
  p.y -= .0035 * breath * weight(vec2(.48,.41),vec2(.4,.35));
  float neck = weight(head, vec2(.31,.24));
  p.x += neck * (.0035 * sin(time * 1.34) + .018 * glance);
  p.y += neck * (.003 * breath + .028 * glance);
  float wrist = weight(vec2(.49,.55),vec2(.13,.09)) * writing;
  p += wrist * vec2(.009 * sin(time*6.), .0045 * sin(time*12.));
  // A cue leads with the gaze. The shoulder and badge hand follow it.
  p.y -= gesture * .009 * neck;
  p.x += gesture * .006 * weight(vec2(.43,.46),vec2(.23,.16));
  p.y -= gesture * .014 * weight(vec2(.28,.58),vec2(.17,.12));
  // The raised forearm in the farewell frames pivots around the left elbow.
  vec2 elbow = vec2(.34,.46);
  vec2 arm = p - elbow;
  float swing = wave * (1.-smoothstep(.25,.43,p.x)) * (.24 * sin(time*9.) - .05);
  p += mat2(cos(swing)-1., sin(swing), -sin(swing), cos(swing)-1.) * arm;
  gl_Position = vec4(p.x*2.-1., 1.-p.y*2., 0., 1.);
}`;
const fragment = `precision mediump float;
varying vec2 uv;
uniform sampler2D portrait, outgoing;
uniform vec4 oldEyes, newEyes;
uniform vec2 oldBadge, newBadge;
uniform float progress;
// Match eye centers, eye-line angle and scale during the short pose exchange.
// Farther down the body, hand the motion off to the torso and prop silhouettes.
vec2 registerPose(vec2 point, vec4 target, vec4 source, vec2 chest, vec2 sourceChest) {
  vec2 rel = point-target.xy;
  vec2 a = target.zw, b = source.zw;
  vec2 rotation = vec2(dot(a,b), a.x*b.y-a.y*b.x)/dot(a,a);
  vec2 aligned = source.xy + mat2(rotation.x,rotation.y,-rotation.y,rotation.x)*rel;
  vec2 d = (point-chest)/vec2(.39,.30);
  vec2 torso = point + (sourceChest-chest)*exp(-dot(d,d));
  return mix(aligned, torso, smoothstep(.15,.45,length(rel)));
}
void main() {
  if (progress >= 1.) { gl_FragColor = texture2D(portrait,uv); return; }
  vec4 eyes = mix(oldEyes,newEyes,progress);
  vec2 chest = mix(oldBadge,newBadge,progress);
  vec4 oldColor = texture2D(outgoing, registerPose(uv,eyes,oldEyes,chest,oldBadge));
  vec4 newColor = texture2D(portrait, registerPose(uv,eyes,newEyes,chest,newBadge));
  float exchange = smoothstep(.22,.78,progress + (uv.y-.5)*.34);
  gl_FragColor = mix(oldColor,newColor,exchange);
}`;

// Centers and eye-line vectors in the aligned 420×640 cutouts.
const eyes = {
  working: [.54,.294,.094,.013], notices: [.522,.236,.103,.025],
  shock: [.456,.239,.100,-.012], uneasy: [.565,.271,.095,.020],
  badge: [.523,.264,.102,.026], explain: [.510,.261,.097,.022],
  anticipation: [.463,.277,.087,-.018], dodge: [.294,.280,.083,-.018],
  recovery: [.475,.260,.107,-.022], wave: [.467,.244,.102,-.010],
};

const badges = {
  working:[.411,.444], notices:[.413,.459], shock:[.450,.474], uneasy:[.389,.453],
  badge:[.428,.468], explain:[.430,.470], anticipation:[.410,.453],
  dodge:[.307,.464], recovery:[.424,.429], wave:[.437,.436],
};
const exchangeTime = pose => pose === "shock" || pose === "dodge" ? .23 : .36;

function sizeSurface(canvas,image) {
  const width = Math.max(1,Math.min(image.naturalWidth,Math.ceil(canvas.clientWidth * devicePixelRatio * 1.25)));
  const height = Math.max(1,Math.round(width * image.naturalHeight/image.naturalWidth));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

// Local-file viewers can disable WebGL. Register both paintings to the same
// eyes on one 2D surface during the pose exchange in those browsers.
function planarRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let current, previous, started;
  return {
    draw(image,pose,beat,nervous,time) {
      if (pose !== current?.pose) {
        previous = current;
        current = { image,pose };
        started = time;
      }
      sizeSurface(canvas,image);
      const t = previous && beat !== "home" ? Math.min(1,(time-started)/exchangeTime(pose)) : 1;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);
      if (t >= 1) { ctx.drawImage(image,0,0,w,h); return; }
      const a = eyes[previous.pose], b = eyes[pose];
      const x = a[0]+(b[0]-a[0])*t, y = a[1]+(b[1]-a[1])*t;
      const blend = t*t*(3-2*t);
      for (const [layer,eye,alpha] of [[previous,a,1-blend],[current,b,blend]]) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha;
        ctx.drawImage(layer.image,(x-eye[0])*w,(y-eye[1])*h,w,h);
        ctx.restore();
      }
    },
    dispose() {},
  };
}

export function renderer(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, depth: false, antialias: true });
  if (!gl) return planarRenderer(canvas);
  const program = gl.createProgram();
  for (const [type, code] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }
  gl.useProgram(program);
  const coords = [];
  const grid = 30;
  for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) {
    for (const [dx, dy] of [[0,0],[0,1],[1,0],[1,0],[0,1],[1,1]]) coords.push((x+dx)/grid, (y+dy)/grid);
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
  const point = gl.getAttribLocation(program, "point");
  gl.enableVertexAttribArray(point);
  gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(["time","writing","wave","glance","head","progress","newEyes","oldEyes","newBadge","oldBadge","gesture"].map(k => [k, gl.getUniformLocation(program,k)]));
  const textures = [0,1].map(unit => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const key of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, key, gl.CLAMP_TO_EDGE);
    for (const key of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, key, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    return texture;
  });
  const portrait = gl.getUniformLocation(program,"portrait");
  const outgoing = gl.getUniformLocation(program,"outgoing");
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  let activePose, started = -1, unit = 0;
  return {
    draw(image, pose, beat, nervous, time, age) {
      sizeSurface(canvas,image);
      gl.viewport(0,0,canvas.width,canvas.height);
      if (activePose !== pose) {
        gl.uniform2fv(uniforms.oldBadge, badges[activePose || pose]);
        gl.uniform2fv(uniforms.newBadge, badges[pose]);
        gl.uniform4fv(uniforms.oldEyes, eyes[activePose || pose]);
        gl.uniform4fv(uniforms.newEyes, eyes[pose]);
        started = activePose ? time : -1;
        activePose = pose;
        unit = 1-unit;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.uniform1i(portrait,unit);
        gl.uniform1i(outgoing,1-unit);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      }
      gl.uniform1f(uniforms.progress, beat === "home" ? 1 : Math.min(1,(time-started)/exchangeTime(pose)));
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.writing, ["ready","routine"].includes(beat) ? 1 : 0);
      gl.uniform1f(uniforms.wave, beat === "wave" ? Math.sin(Math.PI*Math.min(1,age/1.45)) : 0);
      const gesturing = ["lookup","badge","helper","rent","dust"].includes(beat);
      const impulse = Math.sin(Math.PI*Math.min(1,age/1.05));
      gl.uniform1f(uniforms.gesture, gesturing ? impulse : 0);
      gl.uniform1f(uniforms.glance, nervous ? .65 + .35*Math.sin(time*2.1) : 0);
      gl.uniform2f(uniforms.head, eyes[pose][0], eyes[pose][1]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, coords.length/2);
    },
    dispose() { textures.forEach(texture => gl.deleteTexture(texture)); gl.deleteBuffer(buffer); gl.deleteProgram(program); },
  };
}
