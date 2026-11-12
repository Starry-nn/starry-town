/* 3D view for Starry Town: builds the island out of simple shapes and draws it with three.js.
   Game rules live in game.js; this file only turns game state into a picture. Units: 1 tile = 1. */
import * as THREE from './vendor/three.module.min.js';

export function createView(world, canvas) {
  const { MW, MH, hash, reduceMotion } = world;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 900);

  /* ---------- the gentle "small planet" curve: far things sink toward the horizon ---------- */
  const bendU = { k: { value: 0.0085 }, z0: { value: 18 } };
  function bend(m) {
    m.onBeforeCompile = sh => {
      sh.uniforms.uBendK = bendU.k; sh.uniforms.uBendZ = bendU.z0;
      sh.vertexShader = 'uniform float uBendK;\nuniform float uBendZ;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n mvPosition.y -= uBendK * (mvPosition.z * mvPosition.z - uBendZ * uBendZ);\n gl_Position = projectionMatrix * mvPosition;');
    };
    m.customProgramCacheKey = () => 'bend';
    return m;
  }
  const M = {
    main: bend(new THREE.MeshLambertMaterial({ vertexColors: true })),
    glass: bend(new THREE.MeshBasicMaterial({ color: '#c7ecfa' })),
    lamp: bend(new THREE.MeshBasicMaterial({ color: '#fff6cf' })),
    net: bend(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, side: THREE.DoubleSide })),
    shallow: bend(new THREE.MeshBasicMaterial({ color: '#c4f1f4', transparent: true, opacity: 0.3, depthWrite: false })),
  };
  const matCache = {};
  const mat = (color, basic) => matCache[color + (basic ? 'b' : '')] || (matCache[color + (basic ? 'b' : '')] = bend(basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color })));

  /* ---------- geometry helpers ---------- */
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const cone = (r, h, seg = 12) => new THREE.ConeGeometry(r, h, seg);
  const sph = r => new THREE.SphereGeometry(r, 18, 12);
  const sm = r => new THREE.SphereGeometry(r, 30, 22);      // smooth, for characters
  const WL = -0.55;                                          // water level: the land stands this far above the sea
  const sphS = r => new THREE.SphereGeometry(r, 8, 6);
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10);
  function rbox(w, h, d, r) {
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3), p = g.attributes.position, n = g.attributes.normal;
    const half = [w / 2, h / 2, d / 2], v = [0, 0, 0], c = [0, 0, 0];
    for (let i = 0; i < p.count; i++) {
      v[0] = p.getX(i); v[1] = p.getY(i); v[2] = p.getZ(i);
      let len = 0;
      for (let a = 0; a < 3; a++) {
        const inner = half[a] - r, s = Math.sign(v[a]);
        if (Math.abs(v[a]) < half[a] - 1e-6) v[a] = s * inner;          // pull the inner grid lines out to where the bevel starts
        c[a] = Math.max(-inner, Math.min(inner, v[a]));
        len += (v[a] - c[a]) ** 2;
      }
      len = Math.sqrt(len);
      if (len > 1e-8) { const nx = (v[0] - c[0]) / len, ny = (v[1] - c[1]) / len, nz = (v[2] - c[2]) / len; p.setXYZ(i, c[0] + nx * r, c[1] + ny * r, c[2] + nz * r); n.setXYZ(i, nx, ny, nz); }
      else p.setXYZ(i, v[0], v[1], v[2]);
    }
    return g;
  }
  function frustum(wb, db, wt, dt, h) {
    const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const up = p.getY(i) > 0; p.setXYZ(i, p.getX(i) * (up ? wt : wb), p.getY(i) * h, p.getZ(i) * (up ? dt : db)); }
    g.computeVertexNormals();
    return g;
  }
  function extrude(pts, depth, bevel) {
    const s = new THREE.Shape(); pts.forEach((q, i) => i ? s.lineTo(q[0], q[1]) : s.moveTo(q[0], q[1])); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, bevel ? { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2 } : { depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return g;
  }
  const starPts = (R, r) => Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return [Math.cos(a) * q, Math.sin(a) * q]; });

  function bake(parts) {
    let n = 0;
    const gs = parts.map(p => { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return g; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
    let o = 0;
    gs.forEach((g, i) => {
      const cnt = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      c.set(parts[i].color);
      for (let k = 0; k < cnt; k++) { col[(o + k) * 3] = c.r; col[(o + k) * 3 + 1] = c.g; col[(o + k) * 3 + 2] = c.b; }
      o += cnt; g.dispose();
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return out;
  }
  function builder() {
    const lists = { main: [], glass: [], lamp: [], net: [], shallow: [] };
    const e = new THREE.Euler(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const add = (g, color, x, y, z, o = {}) => {
      e.set(o.rx || 0, o.ry || 0, o.rz || 0); q.setFromEuler(e); s.set(o.sx || 1, o.sy || 1, o.sz || 1); p.set(x, y, z);
      lists[o.to || 'main'].push({ g, color, m: new THREE.Matrix4().compose(p, q, s) });
    };
    const group = () => {
      const grp = new THREE.Group();
      for (const k in lists) if (lists[k].length) {
        const mesh = new THREE.Mesh(bake(lists[k]), M[k]);
        mesh.castShadow = k === 'main'; mesh.receiveShadow = k === 'main'; mesh.frustumCulled = false;
        grp.add(mesh);
      }
      return grp;
    };
    return { add, group };
  }

  /* ---------- ground + water ---------- */
  const gtex = new THREE.CanvasTexture(world.ground);
  gtex.colorSpace = THREE.SRGBColorSpace; gtex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH, MW, MH), bend(new THREE.MeshLambertMaterial({ map: gtex, transparent: true })));
  groundMesh.rotation.x = -Math.PI / 2; groundMesh.position.set(MW / 2, 0, MH / 2); groundMesh.receiveShadow = true; groundMesh.renderOrder = 1; groundMesh.frustumCulled = false;
  scene.add(groundMesh);
  const wcv = document.createElement('canvas'); wcv.width = wcv.height = 256;
  (() => {
    const c = wcv.getContext('2d');
    c.fillStyle = '#7ccfe0'; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 5; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = hash(i, 1, 201) * 200, y = 14 + hash(i, 2, 202) * 228;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 12, y - 9, x + 24, y); c.quadraticCurveTo(x + 36, y + 9, x + 48, y); c.stroke();
    }
  })();
  const wtex = new THREE.CanvasTexture(wcv);
  wtex.colorSpace = THREE.SRGBColorSpace; wtex.wrapS = wtex.wrapT = THREE.RepeatWrapping; wtex.repeat.set(70, 70);
  const waterMat = bend(new THREE.MeshBasicMaterial({ map: wtex }));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(560, 560, 110, 110), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(MW / 2, WL, MH / 2); water.frustumCulled = false;
  scene.add(water);
  const wtex2 = wtex.clone(); wtex2.needsUpdate = true; wtex2.repeat.set(41, 41);
  const water2 = new THREE.Mesh(new THREE.PlaneGeometry(560, 560, 110, 110), bend(new THREE.MeshBasicMaterial({ map: wtex2, transparent: true, opacity: 0.35, depthWrite: false })));
  water2.rotation.x = -Math.PI / 2; water2.position.set(MW / 2, WL + 0.01, MH / 2); water2.frustumCulled = false; water2.renderOrder = 0; scene.add(water2);

  /* ---------- static world ---------- */
  const S = builder();
  const WOOD = '#b98654', WOODL = '#d9a873', STONE = '#e8d5b5', WHITE = '#ffffff', POLE = '#8c7a6a';
  function windowAt(b, x, y, z, ry = 0) {
    const dx = Math.sin(ry), dz = Math.cos(ry);
    b.add(rbox(0.64, 0.64, 0.08, 0.06), WHITE, x, y, z, { ry });
    b.add(rbox(0.5, 0.5, 0.08, 0.04), WHITE, x + dx * 0.03, y, z + dz * 0.03, { ry, to: 'glass' });
    b.add(box(0.05, 0.5, 0.05), WHITE, x + dx * 0.06, y, z + dz * 0.06, { ry });
    b.add(box(0.5, 0.05, 0.05), WHITE, x + dx * 0.06, y, z + dz * 0.06, { ry });
  }
  function doorAt(b, x, y0, z, color) {
    b.add(rbox(0.92, 1.25, 0.1, 0.05), WHITE, x, y0 + 0.62, z + 0.02);
    b.add(cyl(0.46, 0.46, 0.1, 22), WHITE, x, y0 + 1.25, z + 0.02, { rx: Math.PI / 2 });
    b.add(rbox(0.74, 1.2, 0.1, 0.05), color, x, y0 + 0.6, z + 0.07);
    b.add(cyl(0.37, 0.37, 0.1, 22), color, x, y0 + 1.2, z + 0.07, { rx: Math.PI / 2 });
    b.add(cyl(0.14, 0.14, 0.1, 16), WHITE, x, y0 + 1.22, z + 0.09, { rx: Math.PI / 2, to: 'glass' });
    b.add(sphS(0.05), '#ffe27a', x + 0.24, y0 + 0.6, z + 0.14);
    b.add(rbox(1.25, 0.14, 0.55, 0.05), STONE, x, 0.07, z + 0.3);
  }
  function planter(b, x, y, z) {
    b.add(rbox(0.68, 0.15, 0.22, 0.05), WOOD, x, y, z);
    [-0.2, 0, 0.2].forEach((o, k) => b.add(sphS(0.085), k % 2 ? '#7ccf7c' : '#ff9db8', x + o, y + 0.1, z + 0.02));
  }
  function house(bd, B = S) {
    const W = bd.w, cx = bd.x + W / 2, front = bd.y + bd.h - 0.15, Dp = bd.kind === 'campus' ? 2.5 : Math.min(3, Math.max(2.3, bd.h - 1.5)), cz = front - Dp / 2;
    const tall = bd.h >= 5, wallH = tall ? 2.5 : 2.2, y0 = 0.18, wf = cz + (Dp - 0.3) / 2, roofH = tall ? 1.5 : 1.3;
    B.add(rbox(W - 0.1, 0.2, Dp + 0.1, 0.06), STONE, cx, 0.1, cz);
    B.add(rbox(W - 0.5, wallH, Dp - 0.3, 0.15), bd.wall, cx, y0 + wallH / 2, cz);
    B.add(rbox(W + 0.15, 0.17, Dp + 0.4, 0.07), bd.roofL, cx, y0 + wallH + 0.03, cz);
    B.add(frustum(W + 0.3, Dp + 0.55, W * 0.5, 0.3, roofH), bd.roof, cx, y0 + wallH + 0.1 + roofH / 2, cz);
    B.add(rbox(W * 0.5 + 0.14, 0.14, 0.42, 0.06), bd.roofL, cx, y0 + wallH + 0.1 + roofH, cz);
    const run = (Dp + 0.55) / 2 - 0.15, slope = Math.atan2(roofH, run);
    for (let k = 1; k <= 3; k++) { const u = k / 4; B.add(rbox((W + 0.3) * (1 - u) + W * 0.5 * u - 0.12, 0.05, 0.09, 0.02), bd.roofL, cx, y0 + wallH + 0.1 + roofH * u + 0.02, cz + (Dp + 0.55) / 2 - run * u, { rx: -slope }); }
    if (W >= 5) { B.add(rbox(0.42, 1.1, 0.42, 0.05), '#f0d6b4', cx + W * 0.3, y0 + wallH + 0.95, cz - 0.15); B.add(rbox(0.54, 0.14, 0.54, 0.05), '#c99a72', cx + W * 0.3, y0 + wallH + 1.52, cz - 0.15); }
    const dxc = bd.x + bd.door + 0.5;
    for (let i = 0; i < W; i++) {
      const wx = bd.x + i + 0.5;
      if (i !== bd.door) { windowAt(B, wx, y0 + (tall ? 0.95 : 1.1), wf + 0.03); planter(B, wx, y0 + (tall ? 0.5 : 0.65), wf + 0.13); }
      if (tall && i !== bd.door) windowAt(B, wx, y0 + 1.85, wf + 0.03);
    }
    doorAt(B, dxc, y0, wf, bd.doorC);
    // emblem on the roof slope above the door
    const ez = cz + (Dp + 0.55) / 2 - 0.42, ey = y0 + wallH + 0.62;
    B.add(cyl(0.4, 0.4, 0.08, 22), WHITE, dxc, ey, ez, { rx: Math.PI / 2 - 0.55 });
    B.add(cyl(0.32, 0.32, 0.1, 22), bd.sign, dxc, ey, ez + 0.015, { rx: Math.PI / 2 - 0.55 });
    if (bd.id === 'agent') ['#5fbf7f', '#ffc94d', '#f0766a'].forEach((c, k) => B.add(sphS(0.075), c, dxc - 0.17 + k * 0.17, ey + 0.02, ez + 0.07));
    else B.add(sphS(0.11), bd.doorC, dxc, ey + 0.02, ez + 0.06, { sz: 0.5 });
    if (bd.id === 'wavo') ['#ffd166', '#7fd1c0', '#ffffff', '#b79cf5'].forEach((c, k, a) => { for (let i = k; i < W * 2; i += a.length) B.add(cone(0.13, 0.26, 4), c, bd.x + 0.3 + i * 0.49, y0 + wallH - 0.2, wf + 0.12, { rx: Math.PI, sz: 0.3 }); });
    if (bd.id === 'agent') { B.add(cyl(0.07, 0.07, 0.9, 8), WHITE, bd.x + W + 0.15, 0.45, wf + 0.2); for (let i = 0; i < 5; i++) B.add(rbox(0.28, 0.14, 0.1, 0.03), i % 2 ? WHITE : '#f590b2', bd.x + W + 0.36 + i * 0.28, 0.72, wf + 0.2); }
    if (bd.id === 'sync') { B.add(cyl(0.04, 0.04, 0.6, 6), WHITE, cx - W * 0.28, y0 + wallH + 1.3, cz); B.add(new THREE.SphereGeometry(0.34, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), WHITE, cx - W * 0.28, y0 + wallH + 1.55, cz, { rx: Math.PI - 0.5 }); B.add(sphS(0.07), '#f0766a', cx - W * 0.28, y0 + wallH + 1.72, cz + 0.12); }
    if (bd.id === 'waves') for (let i = 0; i < 5; i++) B.add(rbox(0.3, 0.07, 0.75, 0.03), i % 2 ? WHITE : '#4fa8dc', dxc - 0.6 + i * 0.3, y0 + 1.82, wf + 0.42, { rx: 0.35 });
    // details that make each house feel lived in: a plinth line, shutters, a door canopy with a lamp, shrubs at the corners
    B.add(rbox(W - 0.42, 0.16, Dp - 0.22, 0.05), bd.roofL, cx, y0 + 0.1, cz);
    for (let i = 0; i < W; i++) if (i !== bd.door) [-1, 1].forEach(sd => B.add(rbox(0.09, tall ? 0.5 : 0.52, 0.04, 0.015), bd.roof, bd.x + i + 0.5 + sd * 0.37, y0 + (tall ? 0.95 : 1.1), wf + 0.05));
    B.add(rbox(0.95, 0.08, 0.5, 0.03), bd.roof, dxc, y0 + 1.72, wf + 0.26, { rx: 0.22 }); B.add(sphS(0.07), '#fff6cf', dxc + 0.52, y0 + 1.45, wf + 0.1, { to: 'lamp' });
    [-1, 1].forEach(sd => { const bx = cx + sd * (W / 2 - 0.12); B.add(sph(0.3), '#5fb86e', bx, 0.3, wf + 0.32, { sy: 0.85 }); B.add(sph(0.2), '#74c97f', bx - sd * 0.25, 0.22, wf + 0.42); B.add(sphS(0.06), bd.sign === '#ffffff' ? '#ffd166' : bd.sign, bx - sd * 0.05, 0.52, wf + 0.5); });
    if (bd.id === 'showcase') {            // the gallery: a portico with columns, banners and a gilded star
      const pz = wf + 0.55;
      B.add(rbox(3.4, 0.14, 1.0, 0.04), STONE, dxc, 0.25, pz); B.add(rbox(3.0, 0.12, 0.8, 0.04), '#fff6e6', dxc, 0.36, pz + 0.12);
      [-1.4, -0.55, 0.55, 1.4].forEach(o => { B.add(cyl(0.11, 0.13, wallH - 0.25, 14), WHITE, dxc + o, y0 + (wallH - 0.25) / 2 + 0.2, pz + 0.3); B.add(rbox(0.32, 0.08, 0.32, 0.02), '#fff6e6', dxc + o, y0 + wallH + 0.02, pz + 0.3); });
      B.add(frustum(3.5, 1.1, 0.4, 0.9, 0.7), bd.roofL, dxc, y0 + wallH + 0.42, pz + 0.05); B.add(rbox(3.6, 0.1, 1.2, 0.03), '#fff6e6', dxc, y0 + wallH + 0.08, pz + 0.05);
      B.add(extrude(starPts(0.26, 0.12), 0.06, 0.02), '#fff3a8', dxc, y0 + wallH + 0.42, pz + 0.52, { to: 'lamp' });
      [-1, 1].forEach(sd => { const fx = cx + sd * (W / 2 - 0.5); B.add(cyl(0.025, 0.025, 1.5, 6), WHITE, fx, y0 + wallH + 1.0, wf - 0.3); B.add(rbox(0.5, 0.7, 0.03, 0.02), sd < 0 ? '#f590b2' : '#7fd1c0', fx + 0.28, y0 + wallH + 1.3, wf - 0.3); });
    }
    if (bd.id === 'crossing') for (let i = 0; i < 8; i++) B.add(rbox(0.5, 0.07, 0.7, 0.02), i % 2 ? WHITE : '#f0766a', bd.x + 0.5 + i * 0.5 + 0.25 - (i > 3 ? 0 : 0), y0 + 1.95, wf + 0.36, { rx: 0.4 });
    if (bd.id === 'linear') { B.add(cyl(0.03, 0.03, 1.4, 6), WHITE, bd.x + 0.5, y0 + wallH + 1.2, cz); B.add(rbox(0.6, 0.36, 0.03, 0.02), '#6f8fd8', bd.x + 0.82, y0 + wallH + 1.65, cz); B.add(rbox(0.6, 0.06, 0.035, 0.01), WHITE, bd.x + 0.82, y0 + wallH + 1.65, cz); }
    if (bd.id === 'skills') { B.add(rbox(0.9, 0.5, 0.06, 0.05), '#7fd1c0', dxc + 1.3, y0 + 1.75, wf + 0.08); B.add(new THREE.TorusGeometry(0.13, 0.045, 6, 10), WHITE, dxc + 1.3, y0 + 1.75, wf + 0.13); }
    return { cx, cz, wf, y0, wallH, W, Dp, roofH };
  }
  function campus(bd) {
    const g = house(bd);
    for (let i = 0; i <= bd.w; i++) S.add(cyl(0.13, 0.15, g.wallH - 0.1, 10), WHITE, bd.x + 0.3 + i * (bd.w - 0.6) / bd.w, g.y0 + g.wallH / 2 - 0.05, g.wf + 0.36);
    S.add(rbox(bd.w - 0.3, 0.2, 0.55, 0.05), WHITE, g.cx, g.y0 + g.wallH - 0.12, g.wf + 0.36);
    const ty = g.y0 + g.wallH;
    S.add(rbox(1.45, 2.3, 1.45, 0.1), bd.wall, g.cx, ty + 0.85, g.cz);
    S.add(rbox(1.7, 0.16, 1.7, 0.06), bd.roofL, g.cx, ty + 2.02, g.cz);
    S.add(cone(1.2, 1.1, 4), bd.roof, g.cx, ty + 2.62, g.cz, { ry: Math.PI / 4 });
    S.add(cyl(0.46, 0.46, 0.08, 22), WHITE, g.cx, ty + 1.4, g.cz + 0.74, { rx: Math.PI / 2 });
    S.add(cyl(0.38, 0.38, 0.1, 22), '#fffaf0', g.cx, ty + 1.4, g.cz + 0.75, { rx: Math.PI / 2 });
    S.add(box(0.04, 0.26, 0.03), '#6b4f3a', g.cx, ty + 1.51, g.cz + 0.81); S.add(box(0.2, 0.04, 0.03), '#6b4f3a', g.cx + 0.08, ty + 1.4, g.cz + 0.81);
    [-1, 1].forEach(s => { const fx = g.cx + s * (bd.w / 2 - 0.9); S.add(cyl(0.03, 0.03, 1.3, 6), WHITE, fx, ty + 1.4, g.cz); S.add(rbox(0.55, 0.34, 0.04, 0.015), '#9a6fd6', fx + 0.3, ty + 1.85, g.cz); });
  }
  function tower(bd) {
    const cx = bd.x + bd.w / 2, front = bd.y + bd.h - 0.15, sf = front - 0.45;
    S.add(rbox(5.2, 1.6, 2.6, 0.18), '#5d5b8a', cx, 0.8, front - 1.3);
    S.add(rbox(5.3, 0.16, 2.7, 0.07), '#7573a6', cx, 1.6, front - 1.3);
    S.add(rbox(3.4, 8.6, 2.0, 0.25), '#4a4870', cx, 1.6 + 4.3, sf - 1.0);
    S.add(rbox(3.5, 0.16, 2.1, 0.07), '#7573a6', cx, 10.2, sf - 1.0);
    for (let j = 0; j < 13; j++) for (let i = 0; i < 6; i++) {
      if (i === 2 || i === 3) continue;
      const h = hash(i, j, 11), lit = h < 0.6;
      S.add(rbox(0.3, 0.36, 0.06, 0.02), '#63618f', cx + (i - 2.5) * 0.52, 2.35 + j * 0.58, sf + 0.01, lit ? { to: h < 0.14 ? 'glass' : 'lamp' } : {});
    }
    S.add(rbox(0.62, 7.8, 0.08, 0.04), WHITE, cx, 2.0 + 3.9, sf + 0.02, { to: 'glass' });
    S.add(rbox(1.75, 1.35, 0.1, 0.06), WHITE, cx, 0.68, front + 0.01);
    [-1, 1].forEach(s => { S.add(rbox(0.76, 1.2, 0.1, 0.05), WHITE, cx + s * 0.4, 0.62, front + 0.04, { to: 'lamp' }); windowAt(S, cx + s * 1.85, 0.95, front + 0.01); planter(S, cx + s * 1.85, 0.5, front + 0.12); });
    S.add(rbox(2.2, 0.14, 0.6, 0.05), STONE, cx, 0.07, front + 0.32);
    S.add(cyl(0.04, 0.05, 1.3, 6), '#b9b6d8', cx, 10.9, sf - 1.0); S.add(sphS(0.12), '#ff8a80', cx, 11.6, sf - 1.0);
  }
  let orbitC = null;
  function dome(bd) {
    const cx = bd.x + bd.w / 2, front = bd.y + bd.h - 0.15, cz = front - 1.8;
    S.add(cyl(1.85, 1.9, 0.2, 28), STONE, cx, 0.1, cz);
    S.add(cyl(1.75, 1.8, 1.9, 28), '#fbf7ee', cx, 1.1, cz);
    S.add(cyl(1.9, 1.9, 0.2, 28), '#dfe5fb', cx, 2.1, cz);
    S.add(new THREE.SphereGeometry(1.75, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), '#8fa4f0', cx, 2.15, cz);
    S.add(rbox(0.6, 1.9, 0.16, 0.07), '#4a4870', cx, 2.15 + 1.21, cz + 1.21, { rx: -0.785 });
    S.add(cyl(0.2, 0.26, 1.3, 12), WHITE, cx, 2.15 + 1.5, cz + 1.5, { rx: 0.785 });
    S.add(sphS(0.2), WHITE, cx, 2.15 + 1.96, cz + 1.96, { to: 'glass' });
    doorAt(S, cx, 0.18, cz + 1.74, '#6f8fd8');
    [-1, 1].forEach(s => windowAt(S, cx + s * 1.05, 1.25, cz + 1.44, s * 0.63));
    S.add(new THREE.TorusGeometry(2.45, 0.025, 6, 60), '#ffffff', cx, 4.5, cz, { rx: Math.PI / 2 - 0.3 });
    orbitC = { x: cx, y: 4.5, z: cz };
  }
  world.BUILDINGS.forEach(bd => (bd.kind === 'tower' ? tower : bd.kind === 'dome' ? dome : bd.kind === 'campus' ? campus : house)(bd));

  // the island has real thickness: every shore tile gets a grass lip, an earth bank and a strip of sand and foam at the waterline
  const isLand = (x, y) => world.at(x, y) !== world.W && world.at(x, y) !== world.D;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!isLand(x, y)) {
      if (world.at(x, y) === world.D) [[0.1, 0.15], [0.9, 0.85]].forEach(([ox, oz]) => S.add(cyl(0.08, 0.08, 0.75, 8), WOOD, x + ox, WL + 0.3, y + oz));
      continue;
    }
    let shore = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!isLand(x + dx, y + dy)) shore = true;
    if (!shore) continue;
    const cx = x + 0.5, cz = y + 0.5;
    if (world.at(x, y) === world.SAND) { S.add(rbox(1.04, 0.56, 1.04, 0.16), '#f1dfae', cx, -0.3, cz); }        // the beach slopes into the water instead of ending in a bank
    else {
      S.add(box(1, 0.03, 1), '#8ed68a', cx, -0.02, cz);
      S.add(box(1.05, 0.17, 1.05), '#62b868', cx, -0.115, cz);
      S.add(box(1, 0.5, 1), '#dcb98a', cx, -0.4, cz);
      S.add(box(1.03, 0.06, 1.03), '#c9a274', cx, -0.36, cz);
    }
    S.add(box(1.75, 0.12, 1.75), '#f8e9b8', cx, WL, cz);
    S.add(box(2.15, 0.05, 2.15), '#eefbff', cx, WL - 0.005, cz);
    S.add(box(3.1, 0.02, 3.1), '#c4f1f4', cx, WL + 0.012, cz, { to: 'shallow' });
  }
  // the shore: palms leaning over the sand, rocks on the beach and out in the shallows, shells and starfish
  world.PALMS.forEach(pm => {
    const x = pm.tx + 0.5, z = pm.ty + 0.5, lean = (pm.v - 0.5) * 0.9, hgt = 2.5 + pm.v * 0.7;
    for (let k = 0; k < 6; k++) { const u = k / 5; S.add(cyl(0.11 - u * 0.03, 0.13 - u * 0.03, hgt / 6 + 0.04, 8), k % 2 ? '#b98f66' : '#a9805a', x + lean * u * u, 0.2 + u * hgt * 0.84, z, { rz: -lean * u * 0.7 }); }
    const tx = x + lean, ty = hgt + 0.05;
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + pm.v * 3; S.add(sph(0.5), k % 2 ? '#4fae6a' : '#5fbd74', tx + Math.cos(a) * 0.62, ty - 0.12, z + Math.sin(a) * 0.62, { sx: 1.5, sy: 0.14, sz: 0.5, ry: -a, rz: -0.42 }); }
    S.add(sph(0.2), '#57b46a', tx, ty + 0.02, z, { sy: 0.7 }); [0, 2.2, 4.3].forEach(a => S.add(sphS(0.11), '#8a6248', tx + Math.cos(a) * 0.17, ty - 0.2, z + Math.sin(a) * 0.17));
  });
  world.ROCKS.forEach(rk => {
    const y0 = rk.sea ? WL - 0.1 : -0.05, c1 = rk.v < 0.5 ? '#b9b6c6' : '#aeb3bf', c2 = rk.v < 0.5 ? '#a5a1b4' : '#9ea4b2';
    S.add(new THREE.IcosahedronGeometry(0.62 * rk.s, 1), c1, rk.x, y0 + 0.3 * rk.s, rk.y, { sy: 0.78, ry: rk.v * 6 });
    S.add(new THREE.IcosahedronGeometry(0.4 * rk.s, 1), c2, rk.x + 0.5 * rk.s, y0 + 0.18 * rk.s, rk.y + 0.25 * rk.s, { sy: 0.7, ry: rk.v * 3 });
    if (rk.v > 0.6) S.add(new THREE.IcosahedronGeometry(0.28 * rk.s, 1), c1, rk.x - 0.45 * rk.s, y0 + 0.12 * rk.s, rk.y + 0.3 * rk.s, { sy: 0.7 });
    if (rk.sea) S.add(cyl(0.95 * rk.s, 0.95 * rk.s, 0.02, 14), '#eefbff', rk.x + 0.1, WL + 0.02, rk.y + 0.05);
  });
  world.SHELLS.forEach(sh => {
    if (sh.k === 0) S.add(extrude(starPts(0.13, 0.06), 0.04, 0.01), '#ff9f7a', sh.x, 0.03, sh.y, { rx: -Math.PI / 2, rz: sh.x * 7 });
    else if (sh.k === 1) { S.add(sphS(0.09), '#ffd9e6', sh.x, 0.03, sh.y, { sy: 0.5, sz: 0.8 }); S.add(sphS(0.05), '#fff6ee', sh.x + 0.05, 0.05, sh.y, { sy: 0.5 }); }
    else S.add(cone(0.07, 0.16, 8), '#fff1cf', sh.x, 0.05, sh.y, { rz: 1.3, ry: sh.y * 5 });
  });
  // residents' houses: each in its own group, shown when its owner has moved in; the lot always has a little sign
  const homes = world.HOMES.map(hm => {
    const b = builder(); house(hm, b); const g = b.group(); g.visible = false; scene.add(g);
    S.add(cyl(0.04, 0.04, 0.8, 6), '#a9785a', hm.x + 0.3, 0.4, hm.y + hm.h + 0.25); S.add(rbox(0.5, 0.3, 0.05, 0.03), '#e9c48e', hm.x + 0.3, 0.78, hm.y + hm.h + 0.27); S.add(sphS(0.07), hm.roof, hm.x + 0.3, 0.8, hm.y + hm.h + 0.31, { sz: 0.4 });
    return { g, id: hm.id };
  });
  world.LILIES.forEach(([x, z], i) => {
    S.add(cyl(0.24, 0.24, 0.02, 12), i % 2 ? '#63bf72' : '#7ccf7c', x, WL + 0.03, z); S.add(cyl(0.13, 0.13, 0.02, 10), '#8bdc8a', x + 0.3, WL + 0.03, z + 0.22);
    if (i % 3 !== 1) { S.add(sphS(0.08), '#ff9db8', x, WL + 0.1, z, { sy: 0.7 }); S.add(sphS(0.04), '#ffd166', x, WL + 0.15, z); }
  });
  /* objects: cx, cz = centre of the footprint */
  const dyn = { fires: [], lights: [], stars: [] };
  const OBJ = {
    lamp(x, z) {
      S.add(cyl(0.15, 0.2, 0.14, 10), POLE, x, 0.07, z); S.add(cyl(0.05, 0.065, 1.85, 8), POLE, x, 0.98, z);
      S.add(sph(0.24), WHITE, x, 2.05, z, { to: 'lamp' }); S.add(cone(0.22, 0.16, 10), POLE, x, 2.33, z); S.add(cyl(0.12, 0.14, 0.08, 10), POLE, x, 1.86, z);
    },
    sign(x, z) {
      [-0.38, 0.38].forEach(o => S.add(cyl(0.05, 0.05, 1.0, 6), '#a9785a', x + o, 0.5, z));
      S.add(rbox(1.25, 0.8, 0.1, 0.07), '#c9925e', x, 1.05, z + 0.02, { rx: -0.12 }); S.add(rbox(1.08, 0.63, 0.1, 0.05), '#e9c48e', x, 1.05, z + 0.05, { rx: -0.12 });
      S.add(extrude(starPts(0.17, 0.08), 0.04), '#ffc94d', x - 0.3, 1.08, z + 0.12, { rx: -0.12 });
      S.add(rbox(0.5, 0.06, 0.03, 0.01), '#7a5a44', x + 0.18, 1.16, z + 0.11, { rx: -0.12 }); S.add(rbox(0.36, 0.06, 0.03, 0.01), '#7a5a44', x + 0.11, 0.98, z + 0.13, { rx: -0.12 });
    },
    scope(x, z) {
      [[0, 0.3], [-0.26, -0.15], [0.26, -0.15]].forEach(([ox, oz]) => S.add(cyl(0.03, 0.03, 1.0, 6), '#7a5a44', x + ox * 0.6, 0.48, z + oz * 0.6, { rz: -ox * 0.5, rx: oz * 0.9 }));
      S.add(cyl(0.13, 0.17, 0.95, 12), '#f590b2', x + 0.05, 1.12, z, { rz: -0.95 }); S.add(cyl(0.19, 0.19, 0.12, 12), WHITE, x + 0.46, 1.4, z, { rz: -0.95 });
      S.add(sphS(0.15), WHITE, x + 0.5, 1.43, z, { to: 'glass' }); S.add(cyl(0.08, 0.08, 0.16, 8), '#ffd166', x - 0.4, 0.8, z, { rz: -0.95 });
    },
    statue(x, z) {
      S.add(rbox(1.8, 0.4, 0.95, 0.1), '#d9c3a8', x, 0.2, z); S.add(rbox(1.2, 0.5, 0.65, 0.08), '#e6d2ba', x, 0.6, z);
      const st = new THREE.Mesh(extrude(starPts(0.5, 0.24), 0.18, 0.05), bend(new THREE.MeshLambertMaterial({ color: '#ffcf4d', emissive: '#ff9d00', emissiveIntensity: 0.25 })));
      st.castShadow = true; st.position.set(x, 1.75, z); scene.add(st); dyn.statue = st;
    },
    booth(x, z) {
      S.add(rbox(1.9, 0.8, 0.7, 0.08), '#fffaf0', x, 0.4, z); S.add(rbox(2.0, 0.1, 0.8, 0.04), '#e9dcc4', x, 0.82, z);
      S.add(rbox(0.7, 0.36, 0.06, 0.08), '#4a4458', x, 0.42, z + 0.34); [-0.13, 0.13].forEach(o => S.add(rbox(0.07, 0.14, 0.04, 0.02), WHITE, x + o, 0.43, z + 0.37));
      [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]].forEach(([ox, oz]) => S.add(cyl(0.04, 0.04, 1.9, 6), WHITE, x + ox, 0.95, z + oz));
      for (let i = 0; i < 6; i++) { S.add(rbox(0.35, 0.08, 1.1, 0.03), i % 2 ? '#4a4458' : '#fffaf0', x - 0.875 + i * 0.35, 1.98, z + 0.05, { rx: 0.32 }); S.add(rbox(0.35, 0.2, 0.06, 0.03), i % 2 ? '#fffaf0' : '#4a4458', x - 0.875 + i * 0.35, 1.72, z + 0.6); }
    },
    tent(x, z) {
      S.add(cone(1.55, 1.9, 4), '#f5a25a', x, 0.95, z, { ry: Math.PI / 4, sz: 0.85 });
      S.add(cone(0.62, 1.15, 3), '#7a5a44', x, 0.57, z + 0.72, { ry: Math.PI, sz: 0.2 });
      S.add(cyl(0.025, 0.025, 0.5, 6), WHITE, x, 2.1, z); S.add(rbox(0.36, 0.2, 0.03, 0.01), '#f590b2', x + 0.19, 2.24, z);
    },
    fire(x, z) {
      for (let k = 0; k < 7; k++) S.add(sphS(0.1), '#b9b3c4', x + Math.cos(k * 0.9) * 0.36, 0.05, z + Math.sin(k * 0.9) * 0.36, { sy: 0.7 });
      S.add(cyl(0.06, 0.06, 0.6, 6), '#a9785a', x, 0.1, z, { rz: Math.PI / 2, ry: 0.5 }); S.add(cyl(0.06, 0.06, 0.6, 6), '#8f6248', x, 0.14, z, { rz: Math.PI / 2, ry: -0.6 });
      const f = new THREE.Group(); f.position.set(x, 0.14, z);
      const a = new THREE.Mesh(cone(0.2, 0.6, 8), mat('#ff9a4a', true)); a.position.y = 0.3; const b2 = new THREE.Mesh(cone(0.12, 0.38, 8), mat('#ffe27a', true)); b2.position.set(0, 0.2, 0.06);
      f.add(a, b2); scene.add(f); dyn.fires.push(f);
    },
    doghouse(x, z) {
      S.add(rbox(1.35, 0.95, 1.0, 0.08), '#fff3d6', x, 0.47, z);
      S.add(frustum(1.65, 1.25, 1.65, 0.06, 0.65), '#f590b2', x, 1.22, z); S.add(rbox(1.7, 0.1, 0.16, 0.04), '#fab0c8', x, 1.55, z);
      S.add(rbox(0.56, 0.6, 0.08, 0.05), '#7a5a44', x, 0.3, z + 0.48); S.add(cyl(0.28, 0.28, 0.08, 16), '#7a5a44', x, 0.6, z + 0.48, { rx: Math.PI / 2 });
      S.add(rbox(0.4, 0.1, 0.05, 0.04), WHITE, x, 1.12, z + 0.56, { rx: -0.45 }); [-0.2, 0.2].forEach(o => S.add(sphS(0.08), WHITE, x + o, 1.12, z + 0.56));
      S.add(cyl(0.2, 0.16, 0.12, 12), '#7fd1c0', x + 0.85, 0.06, z + 0.4);
    },
    boulder(x, z) {
      S.add(new THREE.IcosahedronGeometry(1, 1), '#b9b3c4', x, 0.75, z, { sx: 0.98, sy: 1.15, sz: 0.85, ry: 0.4 });
      [['#f590b2', -0.4, 0.5, 0.74], ['#ffd166', 0, 1.0, 0.72], ['#7fd1c0', 0.42, 0.62, 0.7], ['#6f8fd8', -0.25, 1.4, 0.52], ['#f5a25a', 0.38, 1.3, 0.5], [WHITE, 0.05, 0.3, 0.8]].forEach(([c, ox, oy, oz]) => S.add(sphS(0.09), c, x + ox, oy, z + oz, { sy: 0.8 }));
    },
    net(x, z) {
      [-1.4, 1.4].forEach(o => S.add(cyl(0.05, 0.05, 0.95, 8), WHITE, x + o, 0.47, z));
      S.add(box(2.8, 0.55, 0.02), WHITE, x, 0.58, z, { to: 'net' }); S.add(rbox(2.84, 0.07, 0.05, 0.02), WHITE, x, 0.88, z); S.add(sphS(0.1), '#d8f25a', x + 0.7, 0.1, z + 0.5);
    },
    mailbox(x, z) {
      S.add(cyl(0.06, 0.06, 0.9, 8), WHITE, x, 0.45, z);
      S.add(rbox(0.62, 0.5, 0.85, 0.2), '#f0766a', x, 1.1, z); S.add(rbox(0.36, 0.06, 0.03, 0.01), '#fffaf0', x, 1.14, z + 0.43);
      S.add(box(0.04, 0.4, 0.04), WHITE, x + 0.33, 1.3, z + 0.1); S.add(rbox(0.05, 0.18, 0.26, 0.02), '#ffd166', x + 0.34, 1.45, z + 0.02);
    },
    oracle(x, z) {
      S.add(cyl(0.42, 0.5, 0.22, 8), '#d9c3a8', x, 0.11, z); S.add(cyl(0.3, 0.36, 0.7, 8), '#8f7ad6', x, 0.55, z); S.add(cyl(0.4, 0.32, 0.14, 8), '#ffd166', x, 0.95, z);
      [0, 1, 2, 3].forEach(k => S.add(extrude(starPts(0.07, 0.035), 0.03), '#ffd166', x + Math.cos(k * 1.57 + 0.78) * 0.34, 0.55, z + Math.sin(k * 1.57 + 0.78) * 0.34));
      const ball = new THREE.Mesh(sph(0.36), bend(new THREE.MeshLambertMaterial({ color: '#d9c8ff', emissive: '#8a5cf0', emissiveIntensity: 0.45 })));
      ball.castShadow = true; ball.position.set(x, 1.34, z); scene.add(ball); dyn.oracle = ball;
    },
    board(x, z) {       // the guest board: cork, pinned notes and a pencil
      [-0.5, 0.5].forEach(o => S.add(cyl(0.05, 0.06, 1.5, 8), '#a9785a', x + o, 0.75, z));
      S.add(rbox(1.5, 1.0, 0.1, 0.06), '#b9825a', x, 1.2, z + 0.02); S.add(rbox(1.34, 0.84, 0.1, 0.04), '#e9c48e', x, 1.2, z + 0.05);
      S.add(frustum(1.7, 0.3, 1.5, 0.2, 0.16), '#f590b2', x, 1.8, z + 0.02);
      [[-0.42, 1.38, '#fffaf0'], [0.0, 1.42, '#ffd9e6'], [0.42, 1.36, '#d6f5cf'], [-0.25, 1.02, '#fff1b8'], [0.22, 1.0, '#dff1fb']].forEach(([ox, y, c], k) => { S.add(rbox(0.3, 0.3, 0.02, 0.01), c, x + ox, y, z + 0.11, { rz: (k % 2 ? 1 : -1) * 0.08 }); S.add(sphS(0.03), '#f0766a', x + ox, y + 0.11, z + 0.13); });
    },
    xmas(x, z) {        // a Christmas tree with baubles, a star and presents
      S.add(cyl(0.16, 0.2, 0.5, 10), '#8f6248', x, 0.25, z); S.add(cyl(0.5, 0.42, 0.22, 14), '#f0766a', x, 0.11, z);
      [[1.25, 1.5, 0.85, '#2f9a6a'], [1.0, 1.35, 1.75, '#36a873'], [0.75, 1.2, 2.55, '#3fb57d'], [0.5, 1.0, 3.25, '#49c088']].forEach(([r, h, y, c]) => S.add(cone(r, h, 16), c, x, y, z));
      const cols = ['#ff6b6b', '#ffd166', '#7fd1ff', '#ff9ad5', '#ffffff'];
      dyn.xmas = [];
      for (let k = 0; k < 26; k++) {
        const u = k / 26, y = 0.55 + u * 2.9, r = 1.12 * (1 - u * 0.78) + 0.04, a = k * 2.4;
        const m = new THREE.Mesh(sphS(0.085), bend(new THREE.MeshBasicMaterial({ color: cols[k % cols.length] }))); m.position.set(x + Math.cos(a) * r, y, z + Math.sin(a) * r); scene.add(m); dyn.xmas.push(m);
      }
      const st = new THREE.Mesh(extrude(starPts(0.3, 0.14), 0.1, 0.03), bend(new THREE.MeshBasicMaterial({ color: '#ffe066' }))); st.position.set(x, 3.95, z); scene.add(st); dyn.xmasStar = st;
      [[-0.75, 0.45, '#ffd166', '#f590b2'], [0.7, 0.5, '#7fd1c0', '#ffffff'], [0.15, 0.85, '#f590b2', '#ffd166']].forEach(([ox, oz, c, rb]) => { S.add(rbox(0.36, 0.3, 0.36, 0.05), c, x + ox, 0.15, z + oz); S.add(rbox(0.38, 0.07, 0.1, 0.02), rb, x + ox, 0.2, z + oz); S.add(rbox(0.1, 0.07, 0.38, 0.02), rb, x + ox, 0.2, z + oz); });
    },
    fountain(x, z) {
      S.add(cyl(1.0, 1.05, 0.3, 24), '#e8d5b5', x, 0.15, z); S.add(cyl(0.86, 0.86, 0.08, 24), '#8fd8ee', x, 0.3, z);
      S.add(cyl(0.16, 0.2, 0.8, 12), '#e8d5b5', x, 0.6, z); S.add(cyl(0.5, 0.2, 0.14, 20), '#f3e6cd', x, 1.0, z); S.add(cyl(0.44, 0.44, 0.05, 20), '#8fd8ee', x, 1.07, z);
      S.add(cyl(0.07, 0.09, 0.4, 10), '#e8d5b5', x, 1.25, z); S.add(sphS(0.12), '#ffffff', x, 1.5, z);
      dyn.jets = [0, 1, 2, 3, 4, 5].map(k => { const m = new THREE.Mesh(sphS(0.06), bend(new THREE.MeshBasicMaterial({ color: '#e9fbff' }))); m.userData = { a: k / 6 * Math.PI * 2, x, z }; scene.add(m); return m; });
    },
    windmill(x, z) {
      S.add(frustum(1.5, 1.5, 0.95, 0.95, 2.9), '#fff6e6', x, 1.45, z); S.add(cone(0.95, 0.9, 4), '#f0766a', x, 3.35, z, { ry: Math.PI / 4 });
      S.add(rbox(0.5, 0.8, 0.06, 0.1), '#b9825a', x, 0.4, z + 0.74); S.add(rbox(0.4, 0.4, 0.05, 0.08), '#bfe9f7', x, 1.9, z + 0.6, { to: 'glass' });
      const hub = new THREE.Group(); hub.position.set(x, 2.75, z + 0.62);
      [0, 1, 2, 3].forEach(k => { const b = new THREE.Group(); b.rotation.z = k * Math.PI / 2; const arm = new THREE.Mesh(box(0.08, 1.7, 0.05), mat('#a9785a')); arm.position.y = 0.85; const sail = new THREE.Mesh(box(0.42, 1.2, 0.03), mat('#fffaf0')); sail.position.set(0.24, 1.05, 0); b.add(arm, sail); hub.add(b); });
      const cap = new THREE.Mesh(sphS(0.13), mat('#f0766a')); hub.add(cap); hub.traverse(o => { o.castShadow = true; }); scene.add(hub); dyn.mill = hub;
    },
    crossSign(x, z) {
      S.add(cyl(0.05, 0.06, 1.7, 8), '#a9785a', x, 0.85, z);
      S.add(rbox(0.9, 0.3, 0.08, 0.05), '#ffd166', x - 0.25, 1.5, z + 0.04); S.add(rbox(0.9, 0.3, 0.08, 0.05), '#f590b2', x + 0.25, 1.1, z + 0.04);
    },
    light(x, z) {
      S.add(cyl(0.05, 0.06, 1.2, 8), POLE, x, 0.6, z); S.add(rbox(0.4, 1.0, 0.3, 0.1), '#5d5b8a', x, 1.6, z);
      const balls = [0, 1, 2].map(k => { const m = new THREE.Mesh(sphS(0.11), bend(new THREE.MeshBasicMaterial())); m.position.set(x, 1.9 - k * 0.3, z + 0.13); scene.add(m); return m; });
      dyn.lights.push(balls);
    },
    crates(x, z) {
      S.add(rbox(0.85, 0.7, 0.75, 0.05), WOODL, x, 0.35, z); S.add(rbox(0.55, 0.5, 0.5, 0.05), '#e9c48e', x - 0.05, 0.95, z, { ry: 0.3 });
      S.add(cyl(0.03, 0.03, 1.3, 6), '#a9785a', x + 0.5, 0.65, z + 0.1, { rz: -0.25 }); S.add(rbox(0.26, 0.3, 0.05, 0.03), '#b9c2cc', x + 0.66, 1.3, z + 0.1, { rz: -0.25 });
    },
    bench(x, z) {
      S.add(rbox(1.85, 0.1, 0.5, 0.04), WOODL, x, 0.42, z + 0.05); S.add(rbox(1.85, 0.4, 0.09, 0.04), '#e9c48e', x, 0.75, z - 0.2, { rx: -0.15 });
      [-0.75, 0.75].forEach(o => { S.add(box(0.09, 0.4, 0.09), '#7a5a44', x + o, 0.2, z + 0.2); S.add(box(0.09, 0.9, 0.09), '#7a5a44', x + o, 0.45, z - 0.2); });
    },
    ship(x, z) {
      const b = builder();
      b.add(rbox(4.2, 0.95, 1.5, 0.42), '#c98a5e', 0, 0.2, 0); b.add(rbox(4.3, 0.14, 1.6, 0.07), '#fffaf0', 0, 0.68, 0);
      b.add(rbox(1.1, 0.5, 0.8, 0.1), '#fdeccf', -1.1, 0.98, 0); b.add(cyl(0.07, 0.08, 3.9, 8), WHITE, 0.15, 2.6, 0);
      b.add(extrude([[0, 0], [0, 2.9], [-1.9, 0.2]], 0.04), '#fffaf0', 0.02, 1.15, 0); b.add(extrude([[0, 0], [0, 2.4], [1.5, 0.2]], 0.04), '#fdeccf', 0.28, 1.15, 0);
      b.add(rbox(0.5, 0.26, 0.03, 0.01), '#f590b2', 0.42, 4.4, 0);
      [-0.5, 0.3].forEach(o => b.add(new THREE.TorusGeometry(0.16, 0.035, 6, 12, Math.PI), '#4fa8dc', -0.75 + o, 2.0, 0.04));
      const g = b.group(); g.position.set(x, WL + 0.12, z); scene.add(g); dyn.ship = g;
    },
  };
  world.OBJECTS.forEach(o => OBJ[o.kind](o.tx + o.fw / 2, o.ty + o.fh / 2));
  // pier
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (world.at(x, y) === world.D) {
    S.add(rbox(1.02, 0.14, 1.02, 0.03), WOODL, x + 0.5, 0.03, y + 0.5);
    for (let k = 0; k < 4; k++) S.add(box(1.0, 0.02, 0.03), WOOD, x + 0.5, 0.105, y + 0.12 + k * 0.25);
    if (world.at(x - 1, y) !== world.D) S.add(cyl(0.09, 0.09, 0.7, 8), WOOD, x + 0.02, 0.1, y + 0.85);
    if (world.at(x + 1, y) !== world.D) S.add(cyl(0.09, 0.09, 0.7, 8), WOOD, x + 0.98, 0.1, y + 0.85);
    if (!(x >= world.PIER[0] && x < world.PIER[2] && y >= world.PIER[1] && y < world.PIER[3])) [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {        // bridges get a handrail on every side that faces water
      if (world.at(x + dx, y + dy) !== world.W) return;
      const rx = x + 0.5 + dx * 0.46, rz = y + 0.5 + dy * 0.46;
      S.add(dx ? box(0.07, 0.07, 1.0) : box(1.0, 0.07, 0.07), WOODL, rx, 0.52, rz);
      S.add(cyl(0.05, 0.05, 0.52, 6), WOOD, rx - (dx ? 0 : 0.5), 0.3, rz - (dx ? 0.5 : 0)); S.add(cyl(0.05, 0.05, 0.52, 6), WOOD, rx + (dx ? 0 : 0.5), 0.3, rz + (dx ? 0.5 : 0));
    });
  }
  scene.add(S.group());

  /* ---------- trees + flowers (instanced) ---------- */
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  const mergeKeep = grp => grp.children[0].geometry;   // the baked 'main' mesh of a builder
  const kinds = { pine: ['pine', null], round: ['round', null], peach: ['round', '#ff9a8a'], orange: ['round', '#ffb347'] };
  Object.entries(kinds).forEach(([key, [type, fruit]]) => {
    const list = world.TREES.filter(tr => (tr.type === 'pine' ? 'pine' : tr.type === 'fruit' ? (tr.v < 0.5 ? 'peach' : 'orange') : 'round') === key);
    if (!list.length) return;
    const b = builder();
    b.add(cyl(0.13, 0.2, 0.95, 8), '#a9785a', 0, 0.47, 0);
    if (type === 'pine') { b.add(cone(0.85, 1.05, 10), '#49a67e', 0, 1.15, 0); b.add(cone(0.66, 0.95, 10), '#56b38a', 0, 1.75, 0); b.add(cone(0.44, 0.85, 10), '#62c096', 0, 2.3, 0); }
    else {
      b.add(sph(0.6), '#4da862', -0.45, 1.3, 0); b.add(sph(0.6), '#4da862', 0.45, 1.35, -0.05); b.add(sph(0.55), '#57b46a', 0, 1.25, 0.42);
      b.add(sph(0.8), '#63bf72', 0, 1.7, 0); b.add(sph(0.45), '#84d684', -0.22, 2.12, 0.18);
      if (fruit) [[-0.5, 1.25, 0.5], [0.45, 1.6, 0.55], [0.1, 1.1, 0.78], [-0.15, 1.85, 0.7]].forEach(([fx, fy, fz]) => b.add(sphS(0.13), fruit, fx, fy, fz));
    }
    const im = new THREE.InstancedMesh(mergeKeep(b.group()), M.main, list.length);
    list.forEach((tr, i) => {
      const sc = 0.88 + tr.v * 0.3;
      e4.set(0, type === 'pine' ? tr.v * 6 : (tr.v - 0.5) * 0.8, 0); q4.setFromEuler(e4); s4.set(sc, sc, sc); p4.set(tr.tx + 0.5, 0, tr.ty + 0.6);
      im.setMatrixAt(i, m4.compose(p4, q4, s4));
      tr._im = im; tr._i = i; tr._m = m4.clone();
    });
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
  });
  (() => {
    const FC = ['#ff9db8', '#ffd45e', '#ffffff', '#b79cf5'], spots = [];
    world.FLOWERS.forEach(f => { const n = 1 + Math.floor(hash(f.x, f.y, 80) * 2.6); for (let k = 0; k < n; k++) spots.push({ x: f.x + 0.2 + hash(f.x, f.y, 81 + k) * 0.6, z: f.y + 0.2 + hash(f.x, f.y, 85 + k) * 0.6, c: FC[f.t - 1], s: 0.8 + hash(f.x, f.y, 88 + k) * 0.5 }); });
    if (!spots.length) return;
    const b = builder();
    b.add(cyl(0.018, 0.018, 0.24, 5), '#4da862', 0, 0.12, 0);
    for (let k = 0; k < 5; k++) b.add(sphS(0.06), '#ffffff', Math.cos(k * 1.257) * 0.07, 0.26, Math.sin(k * 1.257) * 0.07, { sy: 0.6 });
    b.add(sphS(0.05), '#ffe27a', 0, 0.28, 0);
    const im = new THREE.InstancedMesh(mergeKeep(b.group()), M.main, spots.length), col = new THREE.Color();
    spots.forEach((f, i) => { q4.identity(); s4.set(f.s, f.s, f.s); p4.set(f.x, 0, f.z); im.setMatrixAt(i, m4.compose(p4, q4, s4)); im.setColorAt(i, col.set(f.c)); });
    im.castShadow = true; im.frustumCulled = false; scene.add(im);
  })();

  /* ---------- characters ---------- */
  const part = (geo, m, x, y, z, parent) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };
  // Characters use soft materials: a little self-light evens out the shading, so overlapping shapes read as one smooth form.
  const softCache = {};
  const soft = (color, k = 0.3) => softCache[color + k] || (softCache[color + k] = bend(new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: k })));
  const tube = (pts, r, seg = 24) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(q[0], q[1], q[2]))), seg, r, 14, false);
  const lathe = pts => new THREE.LatheGeometry(pts.slice().reverse().map(q => new THREE.Vector2(q[0], q[1])), 36);   // bottom-up, so the outside faces out
  function makePerson() {     // Nan: ash-blonde hair with a parting and one long braid over the shoulder, grey hoodie, dark backpack
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const skin = soft('#ffe1cc', 0.34), hair = soft('#dcc394', 0.2), hairD = soft('#c4a878', 0.2), hood = soft('#e3e6ee', 0.26), hoodD = soft('#cfd4df', 0.26), skirt = soft('#f590b2', 0.22),
      sock = soft('#ffffff', 0.3), shoe = soft('#f4f1ea', 0.26), sole = soft('#8f7a6a', 0.2), bag = soft('#5a566b', 0.2), dark = mat('#3f2d2a', true), white = mat('#ffffff', true);
    const legs = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.1, 0.38, 0); body.add(pv);
      part(new THREE.CapsuleGeometry(0.062, 0.14, 6, 14), skin, 0, -0.12, 0, pv); part(cyl(0.064, 0.064, 0.09, 16), sock, 0, -0.235, 0, pv);
      part(sm(0.1), shoe, 0, -0.305, 0.04, pv).scale.set(1, 0.6, 1.5); part(sm(0.1), sole, 0, -0.335, 0.04, pv).scale.set(1.02, 0.28, 1.52);
      return pv;
    });
    part(lathe([[0, 0.6], [0.2, 0.6], [0.31, 0.37], [0.3, 0.34], [0, 0.34]]), skirt, 0, 0, 0, body);
    part(lathe([[0, 0.94], [0.1, 0.94], [0.17, 0.88], [0.205, 0.74], [0.215, 0.6], [0.2, 0.54], [0, 0.54]]), hood, 0, 0, 0, body).scale.set(1, 1, 0.88);
    part(cyl(0.213, 0.213, 0.05, 30), hoodD, 0, 0.565, 0, body).scale.set(1, 1, 0.88);
    part(rbox(0.012, 0.3, 0.012, 0.005), hoodD, 0, 0.74, 0.186, body); part(rbox(0.16, 0.07, 0.02, 0.01), hoodD, 0, 0.63, 0.183, body);
    part(sm(0.17), hood, 0, 0.9, -0.13, body).scale.set(1.15, 0.7, 0.8);                                        // the hood, folded down at the back
    [-1, 1].forEach(s => part(new THREE.CapsuleGeometry(0.008, 0.12, 3, 6), white, s * 0.045, 0.8, 0.172, body));   // drawstrings
    part(cyl(0.068, 0.076, 0.08, 16), skin, 0, 0.95, 0, body);
    const arms = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.215, 0.83, 0); pv.rotation.z = s * 0.2; body.add(pv);
      part(new THREE.CapsuleGeometry(0.066, 0.2, 6, 14), hood, 0, -0.13, 0, pv); part(cyl(0.067, 0.067, 0.04, 16), hoodD, 0, -0.265, 0, pv); part(sm(0.058), skin, 0, -0.32, 0, pv);
      return pv;
    });
    const head = new THREE.Group(); head.position.set(0, 1.22, 0); body.add(head); const eyes = [];
    part(sm(0.37), skin, 0, 0, 0, head).scale.set(1.03, 0.95, 0.97);
    // hair: one smooth shell around the head, open at the face, with a parting and two curtain bangs
    part(new THREE.SphereGeometry(0.405, 44, 30, Math.PI / 2 + 1.0, Math.PI * 2 - 2.0, 0, Math.PI * 0.74), hair, 0, 0.0, -0.01, head).scale.set(1.03, 0.97, 1);
    part(new THREE.SphereGeometry(0.405, 44, 16, 0, Math.PI * 2, 0, Math.PI * 0.3), hair, 0, 0.0, -0.01, head).scale.set(1.03, 0.97, 1);
    [-1, 1].forEach(s => {
      const bang = part(sm(0.2), hair, s * 0.2, 0.19, 0.24, head); bang.scale.set(1.0, 0.5, 0.42); bang.rotation.z = -s * 0.75;
      part(new THREE.CapsuleGeometry(0.05, 0.16, 6, 12), hair, s * 0.35, -0.07, 0.12, head).rotation.z = s * 0.1;
      const eye = part(sm(0.048), dark, s * 0.135, -0.04, 0.33, head); eye.scale.set(0.95, 1.38, 0.5); eyes.push(eye);
      part(sphS(0.017), white, s * 0.135 + 0.016, -0.005, 0.356, head); part(sphS(0.009), white, s * 0.135 - 0.014, -0.065, 0.354, head);
      part(new THREE.CapsuleGeometry(0.01, 0.07, 3, 6), hairD, s * 0.135, 0.07, 0.342, head).rotation.z = Math.PI / 2 + s * 0.16;
      part(sm(0.06), mat('#ffb9c6', true), s * 0.235, -0.13, 0.28, head).scale.set(1, 0.52, 0.3);
    });
    const braid = [[0.3, -0.2, 0.08], [0.34, -0.36, 0.16], [0.3, -0.54, 0.24], [0.25, -0.72, 0.27], [0.22, -0.86, 0.27]];
    part(tube(braid, 0.07), hair, 0, 0, 0, head);
    braid.slice(1, 4).forEach((q, i) => { const r = part(new THREE.TorusGeometry(0.066, 0.016, 6, 16), hairD, q[0], q[1], q[2], head); r.rotation.set(Math.PI / 2 - 0.35, 0, 0.25); });
    part(sm(0.04), skirt, 0.22, -0.88, 0.27, head); part(sm(0.062), hair, 0.21, -0.95, 0.27, head).scale.set(0.8, 1.25, 0.8);
    const smile = part(new THREE.TorusGeometry(0.04, 0.011, 6, 14, Math.PI), mat('#d9685e', true), 0, -0.135, 0.353, head); smile.rotation.z = Math.PI;
    const shovel = new THREE.Group(); shovel.position.set(0, -0.3, 0.05); shovel.rotation.x = 1.3; arms[1].add(shovel);
    part(cyl(0.022, 0.022, 0.7, 8), mat('#a9785a'), 0, 0.2, 0, shovel); part(rbox(0.2, 0.24, 0.04, 0.02), mat('#b9c2cc'), 0, 0.62, 0, shovel); part(rbox(0.12, 0.04, 0.05, 0.015), mat('#f0766a'), 0, -0.15, 0, shovel);
    const rod = new THREE.Group(); rod.position.set(0.24, 0.62, 0.14); rod.rotation.x = 0.85; g.add(rod);
    part(cyl(0.012, 0.028, 1.6, 8), mat('#a9785a'), 0, 0.8, 0, rod); part(cyl(0.035, 0.035, 0.16, 10), mat('#f0766a'), 0, 0.1, 0, rod);
    return { g, body, legs, arms, head, shovel, rod, eyes, smile, ang: 0 };
  }
  function makeDog() {      // 苹果 / Bingo, a Samoyed: one soft white shape, round face, small ears, tail curled over the back
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const w = soft('#fbfbfe', 0.42), w2 = soft('#eef0f7', 0.42), dk = mat('#33303c', true), pink = soft('#ffc4d0', 0.3), red = soft('#f0766a', 0.2);
    part(sm(0.3), w, 0, 0.44, -0.02, body).scale.set(1.04, 0.98, 1.5);
    part(sm(0.28), w, 0, 0.43, -0.3, body).scale.set(1.02, 1.0, 1.0);
    part(sm(0.3), w, 0, 0.54, 0.28, body).scale.set(1.08, 1.12, 0.95);                                            // deep chest and mane as one piece
    const collar = part(new THREE.TorusGeometry(0.215, 0.026, 8, 28), red, 0, 0.7, 0.4, body); collar.rotation.x = 1.2;
    part(sm(0.048), red, 0, 0.5, 0.56, body); part(cone(0.018, 0.05, 6), soft('#63bf72', 0.2), 0.014, 0.555, 0.56, body).rotation.z = -0.5;
    const head = new THREE.Group(); head.position.set(0, 0.86, 0.48); body.add(head); const eyes = [];
    part(sm(0.27), w, 0, 0, 0, head).scale.set(1.24, 1.0, 1.0);                                                   // wide, fluffy face
    part(sm(0.2), w, 0, -0.1, 0.04, head).scale.set(1.35, 0.8, 0.95);
    part(sm(0.12), w, 0, -0.07, 0.21, head).scale.set(1.08, 0.8, 1.1);
    [-1, 1].forEach(s => {
      const eye = part(sm(0.036), dk, s * 0.108, 0.035, 0.236, head); eye.scale.set(1.12, 1.0, 0.6); eyes.push(eye); part(sphS(0.012), mat('#ffffff', true), s * 0.108 + 0.012, 0.05, 0.257, head);
      const ear = part(cone(0.085, 0.17, 18), w, s * 0.19, 0.25, -0.03, head); ear.rotation.z = -s * 0.3;
      part(cone(0.045, 0.1, 12), pink, s * 0.19, 0.238, 0.008, head).rotation.z = -s * 0.3;
    });
    part(sm(0.045), dk, 0, -0.035, 0.335, head).scale.set(1.25, 0.9, 0.9);
    const grin = part(new THREE.TorusGeometry(0.052, 0.01, 6, 14, Math.PI), dk, 0, -0.09, 0.303, head); grin.rotation.set(0.35, 0, Math.PI);
    const tongue = part(rbox(0.066, 0.028, 0.1, 0.012), mat('#ff8fab', true), 0, -0.147, 0.277, head); tongue.rotation.x = 0.6;
    const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.5); body.add(tail);
    part(tube([[0, -0.06, 0.06], [0, 0.14, -0.06], [0, 0.34, 0.0], [0, 0.4, 0.18], [0, 0.3, 0.3]], 0.115, 28), w, 0, 0, 0, tail);
    part(sm(0.125), w, 0, 0.3, 0.3, tail); part(sm(0.12), w, 0, -0.06, 0.06, tail);
    const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const pv = new THREE.Group(); pv.position.set(sx * 0.155, 0.3, sz * 0.28 - 0.02); body.add(pv);
      part(new THREE.CapsuleGeometry(0.076, 0.12, 6, 14), w, 0, -0.12, 0, pv); part(sm(0.095), w2, 0, -0.25, 0.03, pv).scale.set(1.05, 0.58, 1.3);
      return pv;
    });
    return { g, body, head, tail, legs, tongue, eyes, ang: 0 };
  }
  function makeCritter(def) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const sp = def.species, base = sp === 'panda' ? 'bear' : sp;
    const fur = soft(def.color, 0.26), light = soft(def.belly || '#fff6e6', 0.3), shirt = soft(def.accent, 0.22), dk = mat('#3d3848', true), ink = soft('#4a4458', 0.15);
    const limb = sp === 'panda' ? ink : fur;
    part(sm(0.27), shirt, 0, 0.38, 0, body).scale.set(1, 1.1, 0.9);
    part(new THREE.TorusGeometry(0.2, 0.035, 8, 22), light, 0, 0.6, 0, body).rotation.x = Math.PI / 2;                // collar
    [-1, 1].forEach(s => { part(sm(0.09), limb, s * 0.28, 0.44, 0.05, body); part(sm(0.11), limb, s * 0.12, 0.07, 0.05, body).scale.set(1, 0.6, 1.3); });
    const head = new THREE.Group(); head.position.set(0, 0.86, 0); body.add(head);
    part(sm(0.34), fur, 0, 0, 0, head).scale.set(1.06, 0.92, 0.95);
    part(sm(0.14), light, 0, -0.08, 0.26, head).scale.set(1.15, 0.8, 0.7);
    part(sphS(0.04), dk, 0, -0.04, 0.37, head);
    const smile = part(new THREE.TorusGeometry(0.035, 0.009, 6, 12, Math.PI), dk, 0, -0.095, 0.345, head); smile.rotation.z = Math.PI;
    const eyeY = base === 'frog' ? 0.27 : 0.03, eyeZ = base === 'frog' ? 0.2 : 0.3, eyeX = base === 'frog' ? 0.17 : 0.14;
    if (base === 'frog') [-1, 1].forEach(s => part(sm(0.12), fur, s * 0.17, 0.24, 0.1, head));
    if (sp === 'panda') [-1, 1].forEach(s => { const pt = part(sm(0.085), ink, s * 0.14, 0.02, 0.265, head); pt.scale.set(0.9, 1.15, 0.5); pt.rotation.z = s * 0.3; });
    [-1, 1].forEach(s => {
      part(sphS(0.042), sp === 'panda' ? mat('#ffffff', true) : dk, s * eyeX, eyeY, eyeZ + (sp === 'panda' ? 0.02 : 0), head).scale.set(1, 1.3, 0.6);
      part(sphS(0.014), sp === 'panda' ? dk : mat('#ffffff', true), s * eyeX + 0.012, eyeY + 0.02, eyeZ + 0.026, head);
      part(sm(0.055), mat('#ffb3c4', true), s * 0.23, -0.1, 0.25, head).scale.set(1, 0.6, 0.3);
    });
    if (base === 'cat') [-1, 1].forEach(s => { part(cone(0.12, 0.22, 12), fur, s * 0.2, 0.3, 0, head).rotation.z = -s * 0.25; part(cone(0.06, 0.12, 10), soft('#ffc9d6', 0.3), s * 0.2, 0.28, 0.04, head).rotation.z = -s * 0.25; });
    if (base === 'bear') [-1, 1].forEach(s => { part(sm(0.12), sp === 'panda' ? ink : fur, s * 0.26, 0.24, 0, head); if (sp !== 'panda') part(sm(0.06), light, s * 0.26, 0.24, 0.08, head); });
    if (base === 'bunny') [-1, 1].forEach(s => { part(cap(0.075, 0.34), fur, s * 0.13, 0.5, -0.02, head).rotation.z = -s * 0.12; part(cap(0.035, 0.26), soft('#ffc9d6', 0.3), s * 0.13, 0.5, 0.04, head).rotation.z = -s * 0.12; });
    if (base === 'dog') { [-1, 1].forEach(s => { const e = part(cap(0.085, 0.2), soft('#' + new THREE.Color(def.color).multiplyScalar(0.72).getHexString(), 0.22), s * 0.33, 0.0, -0.02, head); e.rotation.z = s * 0.28; }); part(sm(0.1), fur, 0.1, 0.4, -0.3, body); }
    if (base === 'fox') {
      [-1, 1].forEach(s => { part(cone(0.13, 0.3, 12), fur, s * 0.2, 0.33, 0, head).rotation.z = -s * 0.2; part(cone(0.07, 0.17, 10), ink, s * 0.2, 0.33, 0.045, head).rotation.z = -s * 0.2; });
      const tl = part(cap(0.1, 0.3), fur, 0.14, 0.4, -0.34, body); tl.rotation.set(-0.7, 0, -0.4); part(sm(0.1), light, 0.2, 0.55, -0.47, body);
    }
    if (base === 'cat') { const tl = part(cap(0.045, 0.34), fur, 0.12, 0.42, -0.3, body); tl.rotation.set(-0.5, 0, -0.4); }
    if (base === 'bunny' || base === 'bear') part(sm(0.09), sp === 'panda' ? ink : light, 0, 0.28, -0.26, body);
    // something to wear
    const acc = def.acc, top = base === 'bunny' ? 0.3 : 0.3;
    if (acc === 'cap') { part(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), shirt, 0, 0.13, 0, head).scale.set(1.08, 0.75, 1); part(rbox(0.36, 0.035, 0.26, 0.015), shirt, 0, 0.15, 0.33, head); part(sphS(0.035), light, 0, 0.36, 0, head); }
    if (acc === 'bow') { [-1, 1].forEach(s => part(sm(0.085), soft('#f590b2', 0.25), 0.17 + s * 0.085, top, 0.12, head).scale.set(1, 0.8, 0.5)); part(sphS(0.04), soft('#e27aa0', 0.25), 0.17, top, 0.14, head); }
    if (acc === 'crown') { part(cyl(0.17, 0.15, 0.1, 16), soft('#ffd166', 0.3), 0, 0.33, 0, head); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; part(cone(0.045, 0.1, 6), soft('#ffd166', 0.3), Math.cos(a) * 0.14, 0.42, Math.sin(a) * 0.14, head); } part(sphS(0.03), soft('#f0766a', 0.3), 0, 0.33, 0.165, head); }
    if (acc === 'flower') { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; part(sm(0.05), soft('#ff9db8', 0.3), 0.2 + Math.cos(a) * 0.06, top - 0.03 + Math.sin(a) * 0.06, 0.16, head).scale.z = 0.5; } part(sphS(0.035), soft('#ffd166', 0.3), 0.2, top - 0.03, 0.19, head); }
    if (acc === 'glasses') { [-1, 1].forEach(s => part(new THREE.TorusGeometry(0.075, 0.012, 6, 18), ink, s * eyeX, eyeY, eyeZ + 0.045, head)); part(rbox(eyeX * 2 - 0.14, 0.014, 0.014, 0.005), ink, 0, eyeY, eyeZ + 0.05, head); }
    if (acc === 'scarf') { part(new THREE.TorusGeometry(0.21, 0.06, 8, 22), soft('#f0766a', 0.22), 0, 0.62, 0, body).rotation.x = Math.PI / 2; part(rbox(0.1, 0.24, 0.05, 0.02), soft('#f0766a', 0.22), 0.14, 0.48, 0.2, body); }
    g.visible = false;
    return { g, body, head, ang: 0, shown: 0 };
  }
  const person = makePerson(), dogM = makeDog();
  scene.add(person.g, dogM.g);
  // When the player or the dog walks behind a house or a tree, a pale silhouette shows through so they are never lost.
  const ghostMat = bend(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthFunc: THREE.GreaterDepth, depthWrite: false,
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc }));
  [person.g, dogM.g].forEach(root => {
    const solids = []; root.traverse(o => { if (o.isMesh) solids.push(o); });
    solids.forEach(o => {
      o.material = bend(o.material.clone());
      Object.assign(o.material, { stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp });
      const g = new THREE.Mesh(o.geometry, ghostMat); g.renderOrder = 10; o.add(g);
    });
  });
  const critters = world.RESIDENTS.map(def => { const c = makeCritter(def); scene.add(c.g); return c; });
  function setCritter(i, def) { if (!critters[i]) return; scene.remove(critters[i].g); critters[i] = makeCritter(def); scene.add(critters[i].g); }      // a guest changed their look

  /* ---------- small moving things ---------- */
  const digs = world.DIGS.map(dg => {
    const mound = new THREE.Mesh(sph(0.34), mat('#c9a57a')); mound.scale.set(1, 0.42, 0.85); mound.position.set(dg.tx + 0.5, 0.03, dg.ty + 0.55); mound.receiveShadow = true; scene.add(mound);
    const sp = new THREE.Mesh(extrude(starPts(0.16, 0.07), 0.04), mat('#fff3a8', true)); sp.position.set(dg.tx + 0.62, 0.62, dg.ty + 0.55); scene.add(sp);
    const sp2 = new THREE.Mesh(extrude(starPts(0.09, 0.04), 0.03), mat('#ffffff', true)); sp2.position.set(dg.tx + 0.28, 0.4, dg.ty + 0.62); scene.add(sp2);
    return { mound, sp, sp2, i: dg.i };
  });
  const fishMat = bend(new THREE.MeshBasicMaterial({ color: '#2a6f93', transparent: true, opacity: 0.4, depthWrite: false }));
  const fishes = world.FISHES.map(() => { const g = new THREE.Group(); const a = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), fishMat); a.scale.set(1.9, 1, 1); const b2 = new THREE.Mesh(new THREE.CircleGeometry(0.13, 3), fishMat); b2.position.x = -0.42; g.add(a, b2); g.rotation.x = -Math.PI / 2; g.position.y = WL + 0.02; scene.add(g); return g; });
  const dropFruit = new THREE.Mesh(sph(0.14), mat('#ff9a8a')); dropFruit.castShadow = true; dropFruit.visible = false; scene.add(dropFruit);
  let shakeTree = null; const mRot = new THREE.Matrix4(), mOut = new THREE.Matrix4();
  const planet = new THREE.Mesh(sph(0.24), mat('#ffd166')); planet.castShadow = true; scene.add(planet);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.36, 28), bend(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false }))); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 2; scene.add(ring);
  const arrow = new THREE.Group();
  (() => { const pts = [[0.34, 0], [-0.16, 0.26], [-0.06, 0], [-0.16, -0.26]]; const a = new THREE.Mesh(extrude(pts, 0.05), mat('#ffffff', true)); a.scale.set(1.3, 1.3, 1); const b2 = new THREE.Mesh(extrude(pts, 0.07), mat('#46a368', true)); a.position.x = -0.02; arrow.add(a, b2); a.rotation.x = b2.rotation.x = -Math.PI / 2; arrow.position.y = 0.07; scene.add(arrow); })();
  const bobber = new THREE.Group();
  (() => { const a = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffffff', true)); const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#f0766a', true)); bobber.add(a, b2); scene.add(bobber); })();
  const catchFish = new THREE.Group();
  (() => {
    const a = new THREE.Mesh(sph(0.2), mat('#6fb8e8')); a.scale.set(1.5, 1, 0.7); const bl = new THREE.Mesh(sph(0.15), mat('#eaf6ff')); bl.scale.set(1.4, 0.7, 0.6); bl.position.y = -0.07;
    const tl = new THREE.Mesh(cone(0.17, 0.26, 4), mat('#4f98d0')); tl.rotation.z = -Math.PI / 2; tl.position.x = -0.38; tl.scale.z = 0.4;
    const ey = new THREE.Mesh(sphS(0.04), mat('#3d3848', true)); ey.position.set(0.17, 0.05, 0.12);
    catchFish.add(a, bl, tl, ey); catchFish.visible = false; scene.add(catchFish);
  })();
  const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
  const fishLine = new THREE.Line(lineGeo, bend(new THREE.LineBasicMaterial({ color: '#ffffff' }))); fishLine.frustumCulled = false; scene.add(fishLine);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 24), bend(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false }))); ripple.rotation.x = -Math.PI / 2; scene.add(ripple);

  // warm halos and pools of light around the street lamps; they fade in at dusk and glow at night
  const glowMat = bend(new THREE.MeshBasicMaterial({ color: '#ffe6a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const poolMat = bend(new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  (() => {
    const lamps = world.OBJECTS.filter(o => o.kind === 'lamp'); if (!lamps.length) return;
    const halo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.46, 14, 10), glowMat, lamps.length), pool = new THREE.InstancedMesh(new THREE.CircleGeometry(1.5, 28), poolMat, lamps.length);
    const m = new THREE.Matrix4(), flat = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    lamps.forEach((o, i) => { halo.setMatrixAt(i, m.makeTranslation(o.tx + 0.5, 2.05, o.ty + 0.5)); pool.setMatrixAt(i, m.makeTranslation(o.tx + 0.5, 0.05, o.ty + 0.5).multiply(flat)); });
    halo.frustumCulled = pool.frustumCulled = false; halo.renderOrder = pool.renderOrder = 3; scene.add(halo, pool);
  })();
  scene.fog = new THREE.Fog('#dff4fb', 60, 150);

  /* ---------- light + time of day ---------- */
  const hemi = new THREE.HemisphereLight('#ffffff', '#b9e0b0', 1.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.4); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3.5; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 });
  scene.add(sun, sun.target);
  const MODES = {
    day: { sky: '#fdfbf4', gnd: '#a9dba6', hi: 1.72, sun: '#fff0d0', si: 2.55, glass: '#c7ecfa', lamp: '#fff6cf', water: '#ffffff', fog: '#e3f5fb', glow: 0, pool: 0 },
    dusk: { sky: '#ffd2b4', gnd: '#b99bc4', hi: 1.5, sun: '#ff9d5c', si: 2.6, glass: '#ffe9a6', lamp: '#fff0b0', water: '#ffd3c2', fog: '#ffe2c6', glow: 0.26, pool: 0.07 },
    night: { sky: '#9fb0ff', gnd: '#5262b4', hi: 1.36, sun: '#c9d2ff', si: 1.2, glass: '#ffe08a', lamp: '#fff3b8', water: '#6f88d0', fog: '#3f4f9c', glow: 0.42, pool: 0.13 },
  };
  function setMode(name) {
    const m = MODES[name] || MODES.day;
    hemi.color.set(m.sky); hemi.groundColor.set(m.gnd); hemi.intensity = m.hi; sun.color.set(m.sun); sun.intensity = m.si;
    M.glass.color.set(m.glass); M.lamp.color.set(m.lamp); waterMat.color.set(m.water); water2.material.color.set(m.water);
    scene.fog.color.set(m.fog); glowMat.opacity = m.glow; poolMat.opacity = m.pool; M.shallow.opacity = name === 'night' ? 0.14 : 0.3;
  }

  /* ---------- camera, projection, picking ---------- */
  let cw = 1, ch = 1, snap = true;
  const camG = { pitch: 0.94, zoom: 1 }, camS = { pitch: 0.94, zoom: 1 };   // goal and smoothed camera tilt (radians above the horizon) and distance factor
  function setCam(pitch, zoom, now) { camG.pitch = pitch; camG.zoom = zoom; if (now) { camS.pitch = pitch; camS.zoom = zoom; } }
  const camT = new THREE.Vector3(), v = new THREE.Vector3();
  function resize() {
    cw = window.innerWidth; ch = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch; camera.updateProjectionMatrix();
  }
  function ndc(X, Y, Z, out) {
    v.set(X, Y, Z).applyMatrix4(camera.matrixWorldInverse);
    v.y -= bendU.k.value * (v.z * v.z - bendU.z0.value * bendU.z0.value);
    const behind = v.z > -0.2;
    v.applyMatrix4(camera.projectionMatrix);
    out.x = v.x; out.y = v.y; out.ok = !behind;
    return out;
  }
  const tmpA = {}, tmpB = {}, tmpC = {};
  function project(px, py, h, raw) {
    ndc(px / 16, h || 0, py / 16, tmpA);
    if (raw) return { x: (tmpA.x * 0.5 + 0.5) * cw, y: (-tmpA.y * 0.5 + 0.5) * ch, ok: tmpA.ok };
    return { x: (tmpA.x * 0.5 + 0.5) * cw, y: (-tmpA.y * 0.5 + 0.5) * ch, ok: tmpA.ok && Math.abs(tmpA.x) < 1.15 && Math.abs(tmpA.y) < 1.2 };
  }
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function pick(clientX, clientY) {
    const tx = clientX / cw * 2 - 1, ty = -(clientY / ch * 2 - 1);
    ray.setFromCamera({ x: tx, y: ty }, camera);
    if (!ray.ray.intersectPlane(plane, hit)) hit.set(camT.x, 0, camT.z);
    let X = hit.x, Z = hit.z;
    for (let it = 0; it < 12; it++) {                 // undo the curve: nudge the guess until it lands under the pointer
      ndc(X, 0, Z, tmpA); ndc(X + 0.5, 0, Z, tmpB); ndc(X, 0, Z + 0.5, tmpC);
      const a = (tmpB.x - tmpA.x) * 2, b = (tmpC.x - tmpA.x) * 2, c = (tmpB.y - tmpA.y) * 2, d2 = (tmpC.y - tmpA.y) * 2, det = a * d2 - b * c;
      if (Math.abs(det) < 1e-9) break;
      const ex = tx - tmpA.x, ey = ty - tmpA.y;
      X += Math.max(-6, Math.min(6, (ex * d2 - b * ey) / det)); Z += Math.max(-6, Math.min(6, (a * ey - ex * c) / det));
    }
    return { x: X * 16, y: Z * 16 };
  }

  // trees standing between the camera and a conversation are tucked away until it ends
  let cleared = [], clearKey = '';
  const mZero = new THREE.Matrix4().makeScale(0, 0, 0);
  function setClear(cx, cz) {
    const key = cx == null ? '' : Math.round(cx) + ',' + Math.round(cz);
    if (key === clearKey) return;
    clearKey = key;
    cleared.forEach(tr => { tr._im.setMatrixAt(tr._i, tr._m); tr._im.instanceMatrix.needsUpdate = true; });
    cleared = cx == null ? [] : world.TREES.filter(tr => tr._im && tr.ty + 0.5 > cz - 0.4 && tr.ty + 0.5 < cz + 12 && Math.abs(tr.tx + 0.5 - cx) < 5.5 && tr !== shakeTree);
    cleared.forEach(tr => { tr._im.setMatrixAt(tr._i, mZero); tr._im.instanceMatrix.needsUpdate = true; });
  }
  // a balloon carrying a present, and a tennis ball for the dog
  const balloon = new THREE.Group();
  (() => {
    const b1 = new THREE.Mesh(sm(0.42), soft('#f0766a', 0.25)); b1.scale.set(1, 1.15, 1); b1.position.y = 1.25; const knot = new THREE.Mesh(cone(0.07, 0.1, 8), soft('#d9584e', 0.25)); knot.position.y = 0.76;
    const str = new THREE.Mesh(cyl(0.008, 0.008, 0.62, 4), mat('#ffffff', true)); str.position.y = 0.42;
    const gift = new THREE.Mesh(rbox(0.36, 0.3, 0.36, 0.05), soft('#ffd166', 0.2)); const rib = new THREE.Mesh(rbox(0.38, 0.08, 0.38, 0.03), soft('#f590b2', 0.2)); const rib2 = new THREE.Mesh(rbox(0.08, 0.32, 0.38, 0.03), soft('#f590b2', 0.2));
    balloon.add(b1, knot, str, gift, rib, rib2); balloon.traverse(o => { o.castShadow = true; }); balloon.visible = false; scene.add(balloon);
  })();
  const snow = (() => {
    const n = 420, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (hash(i, 1, 301) - 0.5) * 34; pos[i * 3 + 1] = hash(i, 2, 302) * 11; pos[i * 3 + 2] = (hash(i, 3, 303) - 0.5) * 26; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, bend(new THREE.PointsMaterial({ color: '#ffffff', size: 0.16, transparent: true, opacity: 0.95, depthWrite: false }))); pts.frustumCulled = false; pts.visible = false; scene.add(pts); return pts;
  })();
  const ball = new THREE.Mesh(sm(0.1), soft('#d8f25a', 0.3)); ball.castShadow = true; ball.visible = false; scene.add(ball);

  /* ---------- per-frame ---------- */
  const turn = (cur, target, k) => { let dlt = target - cur; while (dlt > Math.PI) dlt -= Math.PI * 2; while (dlt < -Math.PI) dlt += Math.PI * 2; return cur + dlt * k; };
  const DIRANG = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };
  let walkAmt = 0;
  function render(st) {
    const t = st.time, dt = st.dt, P = st.player, k = 1 - Math.exp(-dt * 12);
    const px = P.x / 16, pz = P.y / 16;
    // camera
    const f = Math.max(1, Math.min(1.95, 1.3 / camera.aspect));
    const tk = st.talk, fx0 = tk ? tk.x / 16 : px, fz0 = tk ? tk.y / 16 : pz;      // while talking, the camera moves in on the two speakers
    if (snap) { camT.set(fx0, 0, fz0); snap = false; } else camT.lerp(v.set(fx0, 0, fz0), 1 - Math.exp(-dt * (tk ? 4 : 7)));
    setClear(tk ? fx0 : null, fz0);
    const kc = reduceMotion ? 1 : 1 - Math.exp(-dt * 4.5); camS.pitch += ((tk ? 0.6 : camG.pitch) - camS.pitch) * kc; camS.zoom += ((tk ? 0.4 : camG.zoom) - camS.zoom) * kc;
    const cd = 28.2 * f * camS.zoom;
    camera.position.set(camT.x, 0.8 + Math.sin(camS.pitch) * cd, camT.z - 0.6 + Math.cos(camS.pitch) * cd); camera.lookAt(camT.x, 0.8, camT.z - 0.6);
    camera.updateMatrixWorld(); bendU.z0.value = camera.position.distanceTo(v.set(camT.x, 0.8, camT.z - 0.6));
    bendU.k.value = 0.002 / (f * Math.max(0.75, camS.zoom));
    scene.fog.near = cd * 1.9; scene.fog.far = cd * (4.2 + (1.38 - camS.pitch) * 2.2);        // distance haze: the far sea melts into the sky
    sun.position.set(camT.x - 9, 17, camT.z + 9); sun.target.position.set(camT.x, 0, camT.z - 2); sun.target.updateMatrixWorld();
    if (!reduceMotion) { wtex.offset.set(t * 0.012, t * 0.007); wtex2.offset.set(-t * 0.008, t * 0.011); }

    // player
    const idle = reduceMotion ? 0 : Math.sin(t * 2.2);
    walkAmt += ((P.moving ? 1 : 0) - walkAmt) * (1 - Math.exp(-dt * 14));                      // eases in and out of the walk, so stopping never snaps
    const ph = P.anim * 13.5, sw = Math.sin(ph) * walkAmt, bounce = Math.abs(Math.cos(ph)) * walkAmt;
    person.ang = turn(person.ang, P.face != null ? P.face : DIRANG[P.dir], k); person.g.position.set(px, 0, pz); person.g.rotation.y = person.ang;
    person.legs[0].rotation.x = sw * 0.8; person.legs[1].rotation.x = -sw * 0.8;
    person.arms[0].rotation.x = -sw * 0.75; person.arms[1].rotation.x = sw * 0.75;
    person.arms[0].rotation.z = -0.2 - walkAmt * 0.08 - idle * 0.015 * (1 - walkAmt); person.arms[1].rotation.z = 0.2 + walkAmt * 0.08 + idle * 0.015 * (1 - walkAmt);
    person.body.position.y = bounce * 0.055; person.body.scale.y = 1 + idle * 0.012 * (1 - walkAmt);
    person.body.rotation.z = sw * 0.035; person.body.rotation.y = sw * 0.06;
    person.head.rotation.z = -sw * 0.03 + (reduceMotion ? 0 : Math.sin(t * 0.9) * 0.03 * (1 - walkAmt));
    person.head.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.47) * 0.16 * (1 - walkAmt);       // looks around a little when standing
    person.head.position.y = 1.22 + bounce * 0.012;
    const cheerK = st.cheer != null && t - st.cheer < 0.9 && t >= st.cheer ? Math.sin((t - st.cheer) / 0.9 * Math.PI) : 0;        // a small happy hop with both arms up
    const blink = reduceMotion ? 1 : ((t * 0.31) % 1 > 0.965 || ((t * 0.31 + 0.42) % 1 > 0.985) ? 0.12 : 1);
    person.eyes.forEach(e => { e.scale.y = 1.38 * blink * (cheerK > 0 ? 0.55 : 1); });
    dogM.eyes.forEach(e => { e.scale.y = (reduceMotion ? 1 : ((t * 0.27 + 0.6) % 1 > 0.965 ? 0.12 : 1)); });
    if (cheerK > 0) { person.body.position.y += cheerK * 0.22; person.arms[0].rotation.x = person.arms[1].rotation.x = Math.PI * cheerK * 0.92; person.arms[0].rotation.z = -0.2 - cheerK * 0.3; person.arms[1].rotation.z = 0.2 + cheerK * 0.3; person.head.rotation.z = Math.sin(t * 18) * 0.06 * cheerK; }
    person.smile.scale.setScalar(1 + cheerK * 0.6);
    if (st.dancing) {
      const dt2 = st.dancing.t;
      person.ang = dt2 * 7.5; person.g.rotation.y = person.ang;
      person.body.position.y = Math.abs(Math.sin(dt2 * 9)) * 0.14;
      person.arms[0].rotation.x = Math.PI + Math.sin(dt2 * 9) * 0.5; person.arms[1].rotation.x = Math.PI - Math.sin(dt2 * 9) * 0.5; person.arms[0].rotation.z = -0.5; person.arms[1].rotation.z = 0.5; person.body.rotation.z = Math.sin(dt2 * 9) * 0.12; person.head.rotation.y = 0;
      person.legs[0].rotation.x = Math.sin(dt2 * 9) * 0.5; person.legs[1].rotation.x = -Math.sin(dt2 * 9) * 0.5;
      person.head.rotation.z = Math.sin(dt2 * 9) * 0.12;
    }
    person.shovel.visible = !!st.digging; person.rod.visible = !!st.fishing;
    if (st.digging) { const dgp = Math.sin(Math.min(1, st.digging.t / 0.75) * Math.PI * 3); person.arms[1].rotation.x = -1.0 + dgp * 0.6; person.arms[0].rotation.x = -0.5 + dgp * 0.3; person.body.rotation.x = 0.12 + dgp * 0.08; }
    else person.body.rotation.x = 0;
    if (st.shaking) { const sk = Math.sin(st.shaking.t * 30) * 0.25; person.arms[0].rotation.x = person.arms[1].rotation.x = -1.5 + sk; }
    if (st.fishing) { const ph = st.fishing.phase; person.arms[1].rotation.x = ph === 'land' ? -2.2 : -1.1; person.rod.rotation.x = (ph === 'land' ? 0.2 : ph === 'reel' ? 0.6 : 0.85) + (ph === 'bite' || ph === 'reel' ? Math.sin(t * 40) * 0.06 : 0); }

    // dog
    const Dg = st.dog, dsw = Dg.moving ? Math.sin(Dg.anim * 18) : 0;
    dogM.ang = turn(dogM.ang, Math.atan2(Dg.hx, Dg.hy), k); dogM.g.position.set(Dg.x / 16, 0, Dg.y / 16); dogM.g.rotation.y = dogM.ang;
    dogM.legs[0].rotation.x = dsw * 0.7; dogM.legs[3].rotation.x = dsw * 0.7; dogM.legs[1].rotation.x = -dsw * 0.7; dogM.legs[2].rotation.x = -dsw * 0.7;
    const hop = Dg.pet > 0 ? Math.abs(Math.sin(Dg.pet * 12)) * 0.22 : 0;
    dogM.body.position.y = hop + (Dg.moving ? Math.abs(dsw) * 0.03 : 0);
    dogM.tail.rotation.z = reduceMotion ? 0 : Math.sin(t * (Dg.moving || Dg.pet > 0 ? 16 : 7)) * 0.45;
    dogM.head.rotation.z = Dg.pet > 0 ? Math.sin(Dg.pet * 10) * 0.2 : 0; dogM.head.rotation.x = Dg.moving ? 0 : idle * 0.04;
    dogM.tongue.visible = !Dg.moving;

    // residents
    st.residents.forEach((r, i) => {
      const c = critters[i];
      if (!r.here) { c.g.visible = false; c.shown = 0; return; }
      c.shown = Math.min(1, c.shown + dt * 2.2);
      const e = c.shown, pop = e < 1 ? 1 + Math.sin(e * Math.PI) * 0.25 : 1;
      c.g.visible = true; c.g.scale.setScalar(e * pop);
      c.ang = r.dance > 0 ? c.ang + dt * 7.5 : turn(c.ang, Math.atan2(r.hx, r.hy), k); c.g.position.set(r.x / 16, 0, r.y / 16); c.g.rotation.y = c.ang;
      c.body.position.y = r.dance > 0 ? Math.abs(Math.sin(t * 9 + i)) * 0.16 : r.moving ? Math.abs(Math.sin(t * 9 + i)) * 0.07 : 0;
      c.body.rotation.z = r.moving ? Math.sin(t * 9 + i) * 0.07 : 0; c.head.rotation.z = r.moving || reduceMotion ? 0 : Math.sin(t * 1.6 + i * 2) * 0.07;
    });

    // world bits
    if (dyn.xmas) { dyn.xmas.forEach((m, i) => { m.scale.setScalar(reduceMotion ? 1 : 0.75 + 0.45 * Math.max(0, Math.sin(t * (st.snow ? 7 : 2.4) + i * 1.7))); }); dyn.xmasStar.rotation.y = reduceMotion ? 0 : t * 1.2; }
    if (dyn.mill && !reduceMotion) dyn.mill.rotation.z = -t * 0.9;
    if (dyn.jets) dyn.jets.forEach((m, i) => { const u = reduceMotion ? 0.5 : (t * 0.9 + i * 0.37) % 1, r = 0.12 + u * 0.55; m.position.set(m.userData.x + Math.cos(m.userData.a) * r, 1.5 + Math.sin(u * Math.PI) * 0.35 - u * 0.75, m.userData.z + Math.sin(m.userData.a) * r); });
    snow.visible = !!st.snow;
    if (st.snow) {
      const arr = snow.geometry.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) { arr[i + 1] -= dt * (1.1 + (i % 7) * 0.12); arr[i] += Math.sin(t * 1.3 + i) * dt * 0.25; if (arr[i + 1] < 0) arr[i + 1] += 11; }
      snow.geometry.attributes.position.needsUpdate = true; snow.position.set(camT.x, 0, camT.z);
    }
    if (dyn.oracle) dyn.oracle.material.emissiveIntensity = reduceMotion ? 0.45 : 0.4 + Math.sin(t * 2.4) * 0.22;
    if (dyn.statue) { dyn.statue.rotation.y = reduceMotion ? 0.3 : t * 0.8; dyn.statue.position.y = 1.75 + (reduceMotion ? 0 : Math.sin(t * 2) * 0.08); dyn.statue.material.emissiveIntensity = 0.15 + st.foundRatio * 0.75; }
    if (orbitC) { const a = reduceMotion ? 0.8 : t * 1.1; planet.position.set(orbitC.x + Math.cos(a) * 2.45, orbitC.y + Math.sin(a) * 0.73, orbitC.z + Math.sin(a) * 2.34); }
    if (dyn.ship && !reduceMotion) { dyn.ship.position.y = WL + 0.12 + Math.sin(t * 1.6) * 0.06; dyn.ship.rotation.z = Math.sin(t * 1.1) * 0.035; }
    dyn.fires.forEach(fg => { const s = reduceMotion ? 1 : 1 + Math.sin(t * 13) * 0.12; fg.scale.set(1, s, 1); fg.rotation.y = t * 2; });
    const on = reduceMotion ? 0 : Math.floor(t / 1.6) % 3;
    dyn.lights.forEach(b3 => { b3[0].material.color.set(on === 2 ? '#ff8a80' : '#7d6a80'); b3[1].material.color.set(on === 1 ? '#ffd166' : '#7d7570'); b3[2].material.color.set(on === 0 ? '#8be39a' : '#62807a'); });
    digs.forEach(dg => {
      const gone = st.dug.has(dg.i), active = st.digging && st.digging.g.i === dg.i;
      dg.sp.visible = dg.sp2.visible = !gone && !active;
      dg.mound.scale.set(gone ? 0.8 : 1, gone ? 0.12 : active ? 0.3 : 0.42, gone ? 0.7 : 0.85); dg.mound.material = mat(gone ? '#a98560' : '#c9a57a');
      if (!gone && !reduceMotion) { dg.sp.rotation.y = t * 2 + dg.i; dg.sp.position.y = 0.62 + Math.sin(t * 3 + dg.i) * 0.07; dg.sp2.rotation.y = -t * 2.4; dg.sp2.scale.setScalar(0.7 + 0.3 * Math.sin(t * 5 + dg.i)); }
    });
    world.FISHES.forEach((fz, i) => {
      const s = reduceMotion ? 0 : Math.sin(t * 0.45 + fz.p), c = reduceMotion ? 1 : Math.cos(t * 0.45 + fz.p);
      fishes[i].position.x = (fz.x + (fz.vert ? 0 : s * fz.span)) / 16; fishes[i].position.z = (fz.y + (fz.vert ? s * 40 : 0)) / 16;
      fishes[i].rotation.z = fz.vert ? (c >= 0 ? -Math.PI / 2 : Math.PI / 2) : (c >= 0 ? 0 : Math.PI);
    });
    const sh = st.shaking;
    if (shakeTree && (!sh || sh.tree !== shakeTree)) { shakeTree._im.setMatrixAt(shakeTree._i, shakeTree._m); shakeTree._im.instanceMatrix.needsUpdate = true; shakeTree = null; }
    dropFruit.visible = false;
    if (sh && sh.tree._im) {
      shakeTree = sh.tree;
      mRot.makeRotationZ(Math.sin(sh.t * 38) * 0.07 * Math.max(0, 1 - sh.t / 0.8));
      shakeTree._im.setMatrixAt(shakeTree._i, mOut.multiplyMatrices(shakeTree._m, mRot)); shakeTree._im.instanceMatrix.needsUpdate = true;
      if (sh.t > 0.15 && sh.t < 0.75) {
        const u = (sh.t - 0.15) / 0.3, bx = sh.tree.tx + 0.5, bz = sh.tree.ty + 0.6;
        dropFruit.visible = true; dropFruit.material = mat(sh.tree.v < 0.5 ? '#ff9a8a' : '#ffb347');
        dropFruit.position.set(bx + (px - bx) * 0.55, Math.max(0.14, 1.5 - u * u * 1.36), bz + (pz - bz) * 0.55);
      }
    }
    ring.visible = !!st.target;
    if (st.target) { ring.position.set(st.target.x / 16, 0.04, st.target.y / 16); ring.scale.setScalar(1 + (reduceMotion ? 0 : Math.sin(t * 8) * 0.12)); }
    arrow.visible = !!st.next;
    if (st.next) { const a = Math.atan2(st.next.y - P.y, st.next.x - P.x), r = 0.95 + (reduceMotion ? 0 : Math.sin(t * 5) * 0.08); arrow.position.set(px + Math.cos(a) * r, 0.07, pz + Math.sin(a) * r); arrow.rotation.y = -a; }
    balloon.visible = !!st.balloon;
    if (st.balloon) { balloon.position.set(st.balloon.x / 16, st.balloon.h + Math.sin(t * 1.7) * 0.12, st.balloon.y / 16); balloon.rotation.z = Math.sin(t * 1.1) * 0.08; }
    ball.visible = !!st.ball;
    if (st.ball) ball.position.set(st.ball.x / 16, 0.1 + st.ball.h, st.ball.y / 16);
    if (st.sit) { person.body.position.y = 0.08; person.legs[0].rotation.x = person.legs[1].rotation.x = -1.45; }
    homes.forEach(hm => { const r = st.residents.find(q => q.def.id === hm.id); hm.g.visible = !!(r && r.here); });
    const F = st.fishing;
    bobber.visible = fishLine.visible = ripple.visible = !!F; catchFish.visible = false;
    if (F) {
      let bx = F.bx / 16, bz = F.by / 16, by = WL + 0.08, dip = F.phase === 'bite' ? -0.09 + Math.sin(t * 30) * 0.04 : Math.sin(t * 3) * 0.02;
      if (F.phase === 'reel') { const u = Math.min(1, F.p) * 0.45; bx += (px - bx) * u; bz += (pz - bz) * u; dip = -0.08 + Math.sin(t * 45) * 0.05; }
      if (F.phase === 'land') {                       // the catch leaves the water in an arc and lands in the visitor's hands
        const u = Math.min(1, F.t / 0.7), w = 0.45 + u * 0.5; bx += (px - bx) * w; bz += (pz - bz) * w; by = WL + 0.1 + Math.sin(u * Math.PI) * 1.5 + u * (1.25 - WL); dip = 0;
        catchFish.visible = true; catchFish.position.set(bx, by, bz); catchFish.rotation.set(0, t * 9, Math.sin(t * 28) * 0.5); bobber.visible = false; ripple.visible = u < 0.6;
      }
      bobber.position.set(bx, by + dip, bz);
      const rp = reduceMotion ? 0.5 : (t * (F.phase === 'wait' ? 0.9 : 2.2)) % 1; ripple.position.set(bx, WL + 0.03, bz); ripple.scale.setScalar(1 + rp * 2.2); ripple.material.opacity = 0.7 * (1 - rp);
      person.g.updateMatrixWorld(true); v.set(0, 1.6, 0).applyMatrix4(person.rod.matrixWorld);
      const arr = lineGeo.attributes.position.array, tx = v.x, ty = v.y, tz = v.z, sag = F.phase === 'wait' ? 0.25 : 0.05;
      for (let i = 0; i < 14; i++) { const u = i / 13; arr[i * 3] = tx + (bx - tx) * u; arr[i * 3 + 1] = ty + (by + 0.07 + dip - ty) * u - Math.sin(u * Math.PI) * sag; arr[i * 3 + 2] = tz + (bz - tz) * u; }
      lineGeo.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  resize();
  return { render, resize, project, pick, setMode, setCam, setCritter };
}
