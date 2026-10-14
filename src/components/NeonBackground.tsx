import { useEffect, useRef, useState } from 'react';

// Port WebGL du fond des menus du jeu (front/shaders/menu_background.gdshader) :
// halos colorés, ligne d'horizon, grille néon en perspective qui défile, lignes de
// balayage et vignette. Mêmes couleurs et mêmes constantes que la version Godot.

const VERTEX = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;

uniform vec2 u_resolution; // taille du canvas en pixels physiques
uniform float u_dpr;
uniform float u_time;

const vec3 base_color = vec3(0.027, 0.035, 0.06);
const vec3 grid_color = vec3(0.18, 0.89, 0.92);
const vec3 glow_a = vec3(0.95, 0.27, 0.78);
const vec3 glow_b = vec3(0.18, 0.89, 0.92);
const float horizon = 0.58;
const float speed = 0.35;

void main() {
  // UV de Godot : origine en haut à gauche, y vers le bas.
  vec2 uv = vec2(gl_FragCoord.x / u_resolution.x, 1.0 - gl_FragCoord.y / u_resolution.y);
  vec3 col = base_color;

  // Halos lumineux.
  col += glow_a * 0.16 * smoothstep(0.85, 0.0, distance(uv, vec2(0.86, 0.12)));
  col += glow_b * 0.12 * smoothstep(0.9, 0.0, distance(uv, vec2(0.08, 0.95)));
  col += glow_a * 0.25 * smoothstep(0.012, 0.0, abs(uv.y - horizon));

  // Grille au sol en perspective.
  if (uv.y > horizon) {
    float depth = (uv.y - horizon) / (1.0 - horizon);
    float z = 1.0 / (depth + 0.04);
    vec2 g = vec2((uv.x - 0.5) * z * 2.2, z + u_time * speed * 4.0);
    vec2 f = abs(fract(g) - 0.5);
    float line = smoothstep(0.46, 0.5, max(f.x, f.y));
    col += grid_color * line * 0.28 * depth;
  }

  // Lignes de balayage (en pixels CSS, comme FRAGCOORD à l'échelle 1) et vignette.
  float y_css = (u_resolution.y - gl_FragCoord.y) / u_dpr;
  col *= 0.95 + 0.05 * sin(y_css * 1.4);
  col *= 1.0 - 0.35 * pow(distance(uv, vec2(0.5)), 2.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Ratio de pixels plafonné : au-delà de 2, la différence ne se voit pas et coûte cher. */
const MAX_DPR = 2;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Fond animé : erreur de compilation du shader', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface Renderer {
  draw: (time: number) => void;
  resize: () => void;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Fond animé : erreur de liaison du programme', gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  // Un triangle qui couvre tout l'écran.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uDpr = gl.getUniformLocation(program, 'u_dpr');
  const uTime = gl.getUniformLocation(program, 'u_time');
  let dpr = 1;

  return {
    resize() {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    },
    draw(time) {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

export function NeonBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer = createRenderer(canvas);
    if (!renderer) {
      setWebgl(false);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let elapsed = 0; // secondes d'animation, sans compter les pauses
    let last = 0;

    const tick = (now: number) => {
      elapsed += last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      renderer?.draw(elapsed);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };
    const start = () => {
      if (frame || !renderer) return;
      if (reducedMotion.matches || document.hidden) {
        renderer.draw(elapsed); // image figée
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    const restart = () => {
      stop();
      start();
    };
    const onResize = () => {
      renderer?.resize();
      if (!frame) renderer?.draw(elapsed);
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      stop();
      renderer = null;
      setWebgl(false);
    };
    const onRestored = () => {
      renderer = createRenderer(canvas);
      if (!renderer) return;
      setWebgl(true);
      renderer.resize();
      start();
    };

    renderer.resize();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', restart);
    reducedMotion.addEventListener('change', restart);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    // Le ratio de pixels change (zoom, fenêtre déplacée vers un autre écran) sans
    // toujours déclencher « resize » : on surveille la résolution actuelle.
    let dprQuery: MediaQueryList | null = null;
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDprChange);
    };
    function onDprChange() {
      onResize();
      watchDpr();
    }
    watchDpr();

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', restart);
      reducedMotion.removeEventListener('change', restart);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      dprQuery?.removeEventListener('change', onDprChange);
    };
  }, []);

  return (
    <div className="neon-bg" aria-hidden="true">
      {/* Dégradé CSS : visible avant la première image, et si WebGL est indisponible. */}
      <div className="neon-bg__fallback" />
      <canvas ref={canvasRef} className="neon-bg__canvas" hidden={!webgl} />
    </div>
  );
}
