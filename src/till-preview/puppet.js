// A small texture mesh flexes the approved painting in place. The bottom edge
// stays planted. All offsets are in fractions of that pose's own image.
const vertex = `
attribute vec2 point;
varying vec2 uv;
uniform float time, writing, wave, glance;
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
  float wrist = weight(vec2(.53,.83),vec2(.16,.13)) * writing;
  p += wrist * vec2(.009 * sin(time*6.), .0045 * sin(time*12.));
  // The raised forearm in 05_explaining pivots around its own elbow.
  vec2 elbow = vec2(.653,.54);
  vec2 arm = p - elbow;
  float swing = wave * smoothstep(.64,.82,p.x) * (.21 * sin(time*8.5) - .13);
  p += mat2(cos(swing)-1., sin(swing), -sin(swing), cos(swing)-1.) * arm;
  gl_Position = vec4(p.x*2.-1., 1.-p.y*2., 0., 1.);
}`;
const fragment = `precision mediump float;
varying vec2 uv;
uniform sampler2D portrait, outgoing;
uniform vec4 oldEyes, newEyes;
uniform float progress;
// Match eye centers, eye-line angle and scale during the short pose exchange.
// Farther down the body, hand the motion off to the torso and prop silhouettes.
vec2 registerFace(vec2 point, vec4 target, vec4 source) {
  vec2 rel = point-target.xy;
  vec2 a = target.zw, b = source.zw;
  vec2 rotation = vec2(dot(a,b), a.x*b.y-a.y*b.x)/dot(a,a);
  vec2 aligned = source.xy + mat2(rotation.x,rotation.y,-rotation.y,rotation.x)*rel;
  return mix(aligned, point, smoothstep(.17,.62,length(rel)));
}
void main() {
  if (progress >= 1.) { gl_FragColor = texture2D(portrait,uv); return; }
  vec4 eyes = mix(oldEyes,newEyes,progress);
  vec4 oldColor = texture2D(outgoing, registerFace(uv,eyes,oldEyes));
  vec4 newColor = texture2D(portrait, registerFace(uv,eyes,newEyes));
  float exchange = smoothstep(.22,.78,progress + (uv.y-.5)*.22);
  gl_FragColor = mix(oldColor,newColor,exchange);
}`;

// Center between the pupils and vector along their axis, measured in each cutout.
const eyes = {
  working: [.549,.261,.089,.028], notices: [.505,.268,.114,.037],
  shock: [.379,.224,.096,-.020], badge: [.418,.201,.089,-.033],
  explain: [.403,.267,.092,-.037], dodge: [.406,.267,.088,-.037],
  recovery: [.405,.267,.092,-.037],
};

export function renderer(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, depth: false, antialias: true });
  if (!gl) return null;
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
  const uniforms = Object.fromEntries(["time","writing","wave","glance","head","progress","newEyes","oldEyes"].map(k => [k, gl.getUniformLocation(program,k)]));
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
    draw(image, pose, beat, nervous, time) {
      if (activePose !== pose) {
        gl.uniform4fv(uniforms.oldEyes, eyes[activePose || pose]);
        gl.uniform4fv(uniforms.newEyes, eyes[pose]);
        started = activePose ? time : -1;
        activePose = pose;
        unit = 1-unit;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.uniform1i(portrait,unit);
        gl.uniform1i(outgoing,1-unit);
        const width = Math.min(image.naturalWidth, Math.ceil(canvas.clientWidth * window.devicePixelRatio * 1.2));
        canvas.width = Math.max(1,width);
        canvas.height = Math.round(canvas.width * image.naturalHeight/image.naturalWidth);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      }
      gl.uniform1f(uniforms.progress, Math.min(1,(time-started)/.20));
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.writing, pose === "working" ? 1 : 0);
      gl.uniform1f(uniforms.wave, beat === "wave" || beat === "reveal" ? 1 : 0);
      gl.uniform1f(uniforms.glance, nervous ? .65 + .35*Math.sin(time*2.1) : 0);
      gl.uniform2f(uniforms.head, pose === "working" ? .54 : .38, .22);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, coords.length/2);
    },
    dispose() { textures.forEach(texture => gl.deleteTexture(texture)); gl.deleteBuffer(buffer); gl.deleteProgram(program); },
  };
}
