import { useEffect, useRef, useState } from "react";
import type { OverallState } from "@ahm/contracts";
import "./water-sphere.css";

const vertex = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;
const fragment = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_tint;
uniform float u_surge;
void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution - .5) * 2.0;
  uv.y *= -1.0;
  float t = u_time * .19;
  float angle = atan(uv.y, uv.x);
  float radius = .795 + .009*sin(3.0*angle+t*.65) + .006*sin(5.0*angle-t*.5) + u_surge*.012*sin(4.0*angle-t*3.0);
  vec2 p = uv / radius;
  float r2 = dot(p,p);
  if(r2 > 1.0) { gl_FragColor = vec4(0.0); return; }
  float z = sqrt(max(0.0, 1.0-r2));
  vec3 n = normalize(vec3(p.x, -p.y, z));
  float fresnel = pow(1.0-z, 2.4);
  // Two slowly flowing refracted sheets inside a stationary volume.
  vec2 q = p;
  q += u_surge*.22*vec2(sin(p.y*5.0-t*4.0),cos(p.x*4.0+t*3.0));
  q.x += .16*sin(q.y*3.5+t) + .09*sin(z*5.0-t*.7);
  q.y += .13*sin(p.x*3.8-t*.6);
  float sheet = q.y + .47*sin(q.x*2.9+t*.42) + .20*cos(z*4.0-t*.38);
  float sheet2 = q.x + .42*sin(q.y*3.2-t*.3) - .22*cos(z*3.0+t*.4);
  float fold = smoothstep(-.20,.15,sheet);
  float fold2 = smoothstep(-.30,.18,sheet2);
  vec3 milk = vec3(.88,.95,.90);
  vec3 deep = u_tint;
  vec3 color = mix(milk, deep, .25 + .32*fold + .13*fold2);
  color += .09*sin(z*5.0+q.x*2.0-q.y*3.0+t*.3);
  // Fine bright boundaries between the fluid layers.
  float ribbon = exp(-abs(sheet)*32.0);
  float ribbon2 = exp(-abs(sheet2-.23)*44.0);
  color = mix(color, vec3(.97,1.0,.97), ribbon*.53 + ribbon2*.20);
  float diffuse = max(0.0,dot(n,normalize(vec3(-.5,.65,1.0))));
  color *= .84 + diffuse*.20;
  vec3 light = normalize(vec3(-.62,.72,1.25));
  float shine = pow(max(0.0,dot(n,light)), 44.0);
  float wideShine = pow(max(0.0,dot(n,normalize(vec3(-.8,.6,.7)))), 9.0);
  color = mix(color,vec3(1.0), shine*.67 + wideShine*.22);
  // Glass meniscus, brightest where the upper-left softbox meets the rim.
  float rim = exp(-abs(z-.15)*20.0);
  float edgeLight = .40 + .60*max(0.0, -p.x*.65-p.y*.5);
  color = mix(color, vec3(.95,1.0,.97), min(.8,rim*edgeLight*.8+fresnel*.25));
  color -= fresnel*.06;
  float alpha = 1.0 - smoothstep(.992,1.0,r2);
  gl_FragColor = vec4(clamp(color,0.0,1.0),alpha);
}
`;

const TINT: Record<OverallState, [number, number, number]> = {
  clear: [.51, .77, .60], check: [.88, .72, .39],
  assist: [.85, .48, .41], insufficient: [.62, .70, .75],
};

export function WaterSphere({ state }: { state: OverallState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    canvasRef.current?.dispatchEvent(new Event("sphere-redraw"));
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let frame = 0;
    let disposed = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const compile = (type: number, text: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader allocation failed");
      shaders.push(shader);
      gl.shaderSource(shader, text); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader compilation failed");
      return shader;
    };
    try {
      program = gl.createProgram();
      if (!program) throw new Error("Program allocation failed");
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program link failed");
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    } catch {
      shaders.forEach(shader => gl.deleteShader(shader));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      return;
    }
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const tint = gl.getUniformLocation(program, "u_tint");
    const surge = gl.getUniformLocation(program, "u_surge");
    const started = performance.now();
    let lastFrame = -Infinity;
    let elapsed = 0;
    let previousTime = started;
    let lastState = stateRef.current;
    let changedAt = -Infinity;
    const currentTint = [...TINT[lastState]];

    const draw = (now: number) => {
      if (disposed) return;
      if (now-lastFrame >= 1000/30) {
        const delta = Math.min(now-previousTime, 80)/1000;
        if (lastState !== stateRef.current) { lastState = stateRef.current; changedAt = now; }
        const age = (now - changedAt)/1000;
        const energy = motion.matches ? 0 : .22 * Math.sin(Math.min(age / 3.2, 1) * Math.PI) * Math.exp(-age*.35);
        if (!motion.matches) elapsed += delta * (1 + energy * 1.2);
        for (const i of [0, 1, 2] as const) currentTint[i] = currentTint[i]! + (TINT[stateRef.current][i] - currentTint[i]!) * (motion.matches ? 1 : 1 - Math.exp(-delta * 1.8));
        previousTime = now;
        lastFrame = now;
        const size = Math.min(720, Math.round(canvas.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 1.5)));
        if (size > 0) {
          if(canvas.width !== size || canvas.height !== size) { canvas.width = size; canvas.height = size; }
          gl.viewport(0,0,size,size);
          gl.uniform2f(resolution,size,size);
          gl.uniform1f(time,elapsed);
          gl.uniform3fv(tint,currentTint);
          gl.uniform1f(surge,energy);
          gl.drawArrays(gl.TRIANGLES,0,6);
        }
      }
      if (!document.hidden && !motion.matches) frame = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frame); previousTime = performance.now(); lastFrame = -Infinity; if (!document.hidden) draw(previousTime); };
    const lost = (event: Event) => { event.preventDefault(); disposed = true; cancelAnimationFrame(frame); setAvailable(false); };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("sphere-redraw", restart);
    document.addEventListener("visibilitychange", restart);
    motion.addEventListener("change", restart);
    const observer = new ResizeObserver(restart);
    observer.observe(canvas);
    setAvailable(true);
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true; cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("sphere-redraw", restart);
      document.removeEventListener("visibilitychange", restart);
      motion.removeEventListener("change", restart);
      observer.disconnect();
      if(buffer) gl.deleteBuffer(buffer);
      if(program) gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
    };
  }, []);

  return <span className="water-sphere" data-state={state} data-rendered={available} aria-hidden="true">
    <span className="water-sphere__halo" />
    <span className="water-sphere__shadow" />
    <span className="water-sphere__fallback" />
    <canvas ref={canvasRef} className="water-sphere__canvas" />
  </span>;
}
