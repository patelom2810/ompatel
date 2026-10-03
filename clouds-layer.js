/*!
 * clouds-layer.js — drifting, moonlit (or daylight) clouds as a transparent overlay.
 *
 * Usage:
 *   const clouds = CloudsLayer.mount(document.querySelector('#hero'), { mode: 'night' });
 *   clouds.setMode('day');                    // hook this to your theme toggle
 *   clouds.setOptions({ opacity: .8, speed: 1.5, cover: .6 });
 *   clouds.destroy();
 *
 * Layering inside the container (container must be position: relative):
 *   stars / background   z-index: 0
 *   clouds canvas        z-index: 1   (set with the zIndex option)
 *   trees, train, ground z-index: 5 or higher, so clouds drift behind them
 *   headline, nav        z-index: 10
 */
(function (global) {
  'use strict';

  var VS = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }';

  var FS = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime; uniform float uOpacity; uniform float uCover;',
    'uniform vec3 uShadow; uniform vec3 uLit;',

    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',

    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
    '}',
    'float fbm(vec2 p){',
    '  float a = 0.5, s = 0.0, w = 0.0; mat2 r = mat2(0.8, -0.6, 0.6, 0.8);',
    '  for (int i = 0; i < 5; i++){ s += a * noise(p); w += a; p = r * p * 2.02 + vec2(3.1, 1.7); a *= 0.5; }',
    '  return s / w;',
    '}',

    // returns (coverage*mask, light)
    'vec2 layer(vec2 uv, float asp, float scale, float stretch, float speed, float seed, float cover, vec4 band){',
    '  vec2 p = vec2(uv.x * asp * scale / stretch + uTime * speed, uv.y * scale) + seed;',
    '  float w  = fbm(p * 0.6 + vec2(0.0, uTime * 0.01));',
    '  float n  = fbm(p + w * 1.1);',
    '  float nl = fbm(p + vec2(-0.10, 0.14) + w * 1.1);',      // sample toward the light
    '  float c  = 1.0 - cover;',
    '  float d  = smoothstep(c, c + 0.26, n);',
    '  float dl = smoothstep(c, c + 0.26, nl);',
    '  float m  = smoothstep(band.x, band.y, uv.y) * (1.0 - smoothstep(band.z, band.w, uv.y));',
    '  float light = clamp(0.40 + (d - dl) * 2.6 + d * (1.0 - d) * 0.9, 0.0, 1.0);',
    '  return vec2(d * m, light);',
    '}',

    'void over(inout vec4 o, vec3 col, float a){ o.rgb = o.rgb * (1.0 - a) + col * a; o.a = o.a + a * (1.0 - o.a); }',

    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y;',
    '  vec4 o = vec4(0.0); vec2 L;',

    // low mist behind the trees
    '  L = layer(uv, asp, 1.2, 3.0, 0.003, 4.0, uCover * 0.9, vec4(0.16, 0.30, 0.42, 0.55));',
    '  over(o, mix(uShadow, uLit, L.y * 0.45) * 0.9, L.x * 0.38);',

    // far band
    '  L = layer(uv, asp, 1.7, 2.4, 0.006, 10.0, uCover * 0.95, vec4(0.30, 0.48, 0.70, 0.92));',
    '  over(o, mix(uShadow, uLit, L.y * 0.75) * 0.85, L.x * 0.55);',

    // mid band, long and stretched
    '  L = layer(uv, asp, 2.4, 3.2, 0.010, 23.0, uCover, vec4(0.38, 0.55, 0.78, 0.98));',
    '  over(o, mix(uShadow, uLit, L.y * 0.9), L.x * 0.72);',

    // near long streaks, fastest
    '  L = layer(uv, asp, 3.3, 5.0, 0.016, 41.0, uCover * 0.85, vec4(0.52, 0.68, 0.88, 1.02));',
    '  over(o, mix(uShadow, uLit, L.y), L.x * 0.85);',

    '  o *= uOpacity;',
    '  o.rgb += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * (1.5 / 255.0) * o.a;',
    '  gl_FragColor = o;',
    '}'
  ].join('\n');

  var PALETTE = {
    night: { shadow: [0.06, 0.08, 0.19], lit: [0.58, 0.68, 0.95] },
    day:   { shadow: [0.60, 0.69, 0.84], lit: [1.00, 1.00, 1.00] }
  };

  function mount(container, userOpts) {
    var opts = {
      mode: 'night', opacity: 1, speed: 1, cover: 0.55, scale: 0.5, zIndex: 1
    };
    for (var k in userOpts) opts[k] = userOpts[k];

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;z-index:' + opts.zIndex;
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) {
      canvas.remove();
      return { setMode: function () {}, setOptions: function () {}, destroy: function () {} };
    }

    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uRes', 'uTime', 'uOpacity', 'uCover', 'uShadow', 'uLit'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = { shadow: PALETTE[opts.mode].shadow.slice(), lit: PALETTE[opts.mode].lit.slice() };
    var target = PALETTE[opts.mode];
    var t = 60, last = performance.now(), visible = true, raf = 0, dirty = true;

    function resize() {
      var r = canvas.getBoundingClientRect();
      var s = opts.scale * Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(2, Math.floor(r.width * s));
      var h = Math.max(2, Math.floor(r.height * s));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
      }
      dirty = true;
    }

    function draw() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t);
      gl.uniform1f(U.uOpacity, opts.opacity);
      gl.uniform1f(U.uCover, opts.cover);
      gl.uniform3fv(U.uShadow, cur.shadow);
      gl.uniform3fv(U.uLit, cur.lit);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      dirty = false;
    }

    function tick(now) {
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      var k = 1 - Math.exp(-dt * 3), moved = false, i;
      for (i = 0; i < 3; i++) {
        var ds = target.shadow[i] - cur.shadow[i], dl = target.lit[i] - cur.lit[i];
        if (Math.abs(ds) > 0.001 || Math.abs(dl) > 0.001) {
          cur.shadow[i] += ds * k; cur.lit[i] += dl * k; moved = true;
        }
      }
      if (!reduced) t += dt * opts.speed;
      if (visible && (!reduced || moved || dirty)) draw();
      raf = requestAnimationFrame(tick);
    }

    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container); else window.addEventListener('resize', resize);

    var io = window.IntersectionObserver ? new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      last = performance.now();
    }) : null;
    if (io) io.observe(container);

    resize();
    raf = requestAnimationFrame(tick);

    return {
      setMode: function (m) { if (PALETTE[m]) { target = PALETTE[m]; dirty = true; } },
      setOptions: function (o) { for (var k in o) opts[k] = o[k]; dirty = true; if (o && o.scale) resize(); },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        if (io) io.disconnect();
        canvas.remove();
      }
    };
  }

  global.CloudsLayer = { mount: mount };
})(window);
