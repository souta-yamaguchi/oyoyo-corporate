// 3D地球モジュール (earth_globe から流用、Hero用にスリム化)
import * as THREE from 'three';

export function createEarth(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  resize();
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, aspect(), 0.01, 100);
  camera.position.set(0, 0, 3.2);

  // 星空
  (function () {
    const N = 1800, g = new THREE.BufferGeometry();
    const p = new Float32Array(N * 3), col = new Float32Array(N * 3), sz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 40 + Math.random() * 40, t = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
      p[i * 3] = r * Math.sin(ph) * Math.cos(t);
      p[i * 3 + 1] = r * Math.cos(ph);
      p[i * 3 + 2] = r * Math.sin(ph) * Math.sin(t);
      const w = Math.random();
      col[i * 3] = 0.8 + w * 0.2;
      col[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      col[i * 3 + 2] = 1.0 - w * 0.25;
      sz[i] = 0.04 + Math.pow(Math.random(), 6) * 0.32;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `attribute float aSize; varying vec3 vC;
        void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0);
          gl_PointSize=aSize*300.0/(-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c);
        if(d>0.5)discard; gl_FragColor=vec4(vC, smoothstep(0.5,0.0,d)); }`,
      vertexColors: true,
    });
    scene.add(new THREE.Points(g, m));
  })();

  // 太陽光
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(5, 2, 3);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x223355, 0.6));

  const R = 1;
  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.z = 23.4 * Math.PI / 180;
  scene.add(tiltGroup);
  const earthGroup = new THREE.Group();
  tiltGroup.add(earthGroup);

  // 大陸ポリゴン
  const CONTINENTS = [
    [[-168,65],[-160,71],[-140,70],[-128,70],[-95,72],[-82,73],[-78,68],[-95,60],[-80,52],[-64,60],[-55,52],[-66,48],[-70,42],[-75,35],[-81,25],[-90,29],[-97,26],[-105,22],[-110,30],[-117,33],[-124,40],[-124,48],[-135,57],[-150,59],[-165,60]],
    [[-80,9],[-72,11],[-62,10],[-50,0],[-44,-3],[-35,-6],[-38,-13],[-48,-25],[-58,-34],[-66,-42],[-69,-52],[-75,-52],[-73,-44],[-71,-30],[-76,-14],[-81,-5],[-80,4]],
    [[-17,15],[-10,28],[0,36],[11,37],[24,32],[33,31],[35,24],[43,12],[51,12],[44,2],[41,-4],[40,-15],[34,-26],[26,-34],[18,-34],[12,-17],[9,4],[-8,5],[-16,12]],
    [[-9,37],[-2,43],[2,50],[-4,58],[8,63],[18,69],[33,71],[55,70],[75,73],[105,77],[140,73],[160,70],[170,68],[160,60],[145,58],[135,53],[140,46],[132,43],[122,40],[121,31],[110,21],[103,5],[97,16],[88,22],[80,9],[73,18],[66,25],[57,25],[48,30],[40,37],[33,42],[28,41],[20,44],[10,46],[2,43],[-5,40]],
    [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[145,-17],[150,-23],[153,-28],[150,-38],[143,-39],[135,-35],[129,-32],[120,-34],[114,-30],[113,-26]],
    [[-45,60],[-30,68],[-20,70],[-18,76],[-30,83],[-50,82],[-58,76],[-54,68],[-50,62]],
    [[130,31],[133,34],[137,35],[140,38],[142,40],[141,43],[145,44],[141,45],[139,40],[136,36],[133,34],[131,31]],
    [[-6,50],[-2,53],[-4,58],[-8,58],[-10,53],[-6,51]],
    [[-180,-70],[-120,-72],[-60,-71],[0,-70],[60,-69],[120,-72],[180,-71],[180,-90],[-180,-90]],
    [[43,-13],[50,-15],[50,-25],[45,-25],[43,-18]],
    [[166,-35],[178,-38],[174,-46],[167,-45],[166,-40]],
    [[95,2],[105,1],[118,-3],[120,-8],[105,-7],[98,-2],[95,5]],
  ];
  const CITY_HINTS = [
    { lat:35.68, lon:139.69 }, { lat:39.90, lon:116.40 }, { lat:28.61, lon:77.21 },
    { lat:38.90, lon:-77.04 }, { lat:-6.21, lon:106.85 }, { lat:-15.79, lon:-47.88 },
    { lat:55.75, lon:37.62 }, { lat:9.08, lon:7.49 }, { lat:33.69, lon:73.06 },
    { lat:19.43, lon:-99.13 }, { lat:52.52, lon:13.40 }, { lat:51.51, lon:-0.13 },
    { lat:48.85, lon:2.35 }, { lat:45.42, lon:-75.70 }, { lat:-35.28, lon:149.13 },
    { lat:37.57, lon:126.98 }, { lat:30.04, lon:31.24 }, { lat:24.71, lon:46.68 },
    { lat:-34.60, lon:-58.38 }, { lat:40.42, lon:-3.70 }, { lat:13.76, lon:100.50 },
    { lat:-1.29, lon:36.82 },
  ];

  function ll2xy(lon, lat, W, H) { return [(lon + 180) / 360 * W, (90 - lat) / 180 * H]; }

  // 地球テクスチャ生成
  const W = 1536, H = 768;
  const dayC = document.createElement('canvas'); dayC.width = W; dayC.height = H;
  const d = dayC.getContext('2d');
  const og = d.createLinearGradient(0, 0, 0, H);
  og.addColorStop(0, '#0a2a55'); og.addColorStop(0.5, '#0d3a72'); og.addColorStop(1, '#0a2a55');
  d.fillStyle = og; d.fillRect(0, 0, W, H);
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 10 + Math.random() * 60;
    d.fillStyle = 'rgba(' + (10 + Math.random() * 20 | 0) + ',' + (50 + Math.random() * 40 | 0) + ',' + (110 + Math.random() * 50 | 0) + ',0.10)';
    d.beginPath(); d.arc(x, y, r, 0, 6.283); d.fill();
  }
  const specC = document.createElement('canvas'); specC.width = W; specC.height = H;
  const s = specC.getContext('2d'); s.fillStyle = '#000'; s.fillRect(0, 0, W, H);
  CONTINENTS.forEach(poly => {
    d.beginPath(); s.beginPath();
    poly.forEach((p, i) => {
      const [x, y] = ll2xy(p[0], p[1], W, H);
      if (i === 0) { d.moveTo(x, y); s.moveTo(x, y); }
      else { d.lineTo(x, y); s.lineTo(x, y); }
    });
    d.closePath(); s.closePath();
    d.fillStyle = '#2f6b34'; d.fill();
    s.fillStyle = '#fff'; s.fill();
  });
  const dim = d.getImageData(0, 0, W, H), sm = s.getImageData(0, 0, W, H);
  const dp = dim.data, sp = sm.data;
  for (let y = 0; y < H; y++) {
    const lat = 90 - y / H * 180;
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      if (sp[idx] > 128) {
        let r = 47, g = 107, b = 52;
        const a = Math.abs(lat);
        if (a > 62) { const t = Math.min(1, (a - 62) / 22); r = 47 + (225 - 47) * t; g = 107 + (232 - 107) * t; b = 52 + (235 - 52) * t; }
        else if (a > 18 && a < 33) { const t = 1 - Math.abs(a - 25) / 8; r = 47 + (150 - 47) * t; g = 107 + (120 - 107) * t; b = 52 + (60 - 52) * t; }
        const n = (Math.random() - 0.5) * 22;
        dp[idx] = Math.max(0, Math.min(255, r + n));
        dp[idx + 1] = Math.max(0, Math.min(255, g + n));
        dp[idx + 2] = Math.max(0, Math.min(255, b + n * 0.5));
      }
    }
  }
  d.putImageData(dim, 0, 0);

  // 夜マップ
  const nightC = document.createElement('canvas'); nightC.width = W; nightC.height = H;
  const ng = nightC.getContext('2d'); ng.fillStyle = '#02040a'; ng.fillRect(0, 0, W, H);
  ng.drawImage(specC, 0, 0);
  ng.globalCompositeOperation = 'source-in';
  ng.fillStyle = '#0a1426'; ng.fillRect(0, 0, W, H);
  ng.globalCompositeOperation = 'source-over';
  CITY_HINTS.forEach(c => {
    const [x, y] = ll2xy(c.lon, c.lat, W, H);
    for (let k = 0; k < 10; k++) {
      const ox = x + (Math.random() - 0.5) * 60, oy = y + (Math.random() - 0.5) * 40;
      const rr = 1 + Math.random() * 2.5;
      const gg = ng.createRadialGradient(ox, oy, 0, ox, oy, rr * 3);
      gg.addColorStop(0, 'rgba(255,220,140,0.95)');
      gg.addColorStop(1, 'rgba(255,180,80,0)');
      ng.fillStyle = gg; ng.beginPath(); ng.arc(ox, oy, rr * 3, 0, 6.283); ng.fill();
    }
  });

  // 雲マップ
  const cloudC = document.createElement('canvas'); cloudC.width = W; cloudC.height = H;
  const cc = cloudC.getContext('2d');
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 20 + Math.random() * 90;
    const band = 1 - Math.abs((y / H) - 0.5) * 1.2;
    const gg = cc.createRadialGradient(x, y, 0, x, y, r);
    const al = 0.04 + Math.random() * 0.16 * band;
    gg.addColorStop(0, 'rgba(255,255,255,' + al + ')');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    cc.fillStyle = gg; cc.beginPath(); cc.arc(x, y, r, 0, 6.283); cc.fill();
  }

  const mk = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const dayT = mk(dayC), specT = mk(specC), nightT = mk(nightC), cloudT = mk(cloudC);

  // 地球シェーダー
  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: dayT }, nightMap: { value: nightT },
      specMap: { value: specT },
      sunDir: { value: new THREE.Vector3().copy(sun.position).normalize() },
    },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vWpos;
      void main(){ vUv=uv;
        vN=normalize(mat3(modelMatrix)*normal);
        vWpos=(modelMatrix*vec4(position,1.0)).xyz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D dayMap, nightMap, specMap;
      uniform vec3 sunDir;
      varying vec2 vUv; varying vec3 vN; varying vec3 vWpos;
      void main(){
        vec3 n=normalize(vN);
        vec3 L=normalize(sunDir);
        float geoD=dot(normalize(vN), L);
        float dayAmt=smoothstep(-0.12,0.22,geoD);
        vec3 day=texture2D(dayMap,vUv).rgb;
        float lum=dot(day,vec3(0.299,0.587,0.114));
        day=mix(vec3(lum), day, 1.25);
        float diff=max(dot(n,L),0.0);
        day *= (0.42 + 1.05*diff);
        float ocean=texture2D(specMap,vUv).r;
        vec3 V=normalize(cameraPosition-vWpos);
        vec3 Hh=normalize(L+V);
        float spec=pow(max(dot(normalize(vN),Hh),0.0), 800.0) * ocean * dayAmt;
        vec3 lights=texture2D(nightMap,vUv).rgb;
        vec3 nightBase=mix(vec3(0.012,0.02,0.045), vec3(0.02,0.035,0.03), ocean);
        vec3 night=nightBase + lights*2.2;
        night *= (1.0-dayAmt);
        vec3 col=mix(night, day, dayAmt);
        col += vec3(1.0,0.97,0.9)*spec*0.5;
        float fres=pow(1.0-max(dot(normalize(vN),V),0.0), 2.5);
        float term=smoothstep(0.0,0.3,geoD)*(1.0-smoothstep(0.25,0.6,geoD));
        col += vec3(0.35,0.55,1.0)*fres*0.6*dayAmt;
        col += vec3(1.0,0.5,0.25)*fres*term*0.5;
        gl_FragColor=vec4(col,1.0);
      }`,
  });
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 120, 120), earthMat);
  earthGroup.add(earthMesh);

  // 雲
  const cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.012, 64, 64),
    new THREE.MeshLambertMaterial({ map: cloudT, transparent: true, opacity: 0.45, depthWrite: false })
  );
  earthGroup.add(cloudMesh);

  // 大気グロー
  const atmoMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.18, 64, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { sunDir: { value: new THREE.Vector3().copy(sun.position).normalize() } },
      vertexShader: `varying vec3 vN; varying vec3 vWpos;
        void main(){ vN=normalize(mat3(modelMatrix)*normal);
          vWpos=(modelMatrix*vec4(position,1.0)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 sunDir; varying vec3 vN; varying vec3 vWpos;
        void main(){
          vec3 V=normalize(cameraPosition-vWpos);
          float i=pow(1.0-max(dot(normalize(vN),V),0.0), 3.2);
          float lit=max(dot(normalize(vN), normalize(sunDir)),0.0);
          float a=clamp(i,0.0,1.0)*(0.25+0.95*lit);
          vec3 c=mix(vec3(0.2,0.45,0.95), vec3(0.6,0.8,1.0), lit);
          gl_FragColor=vec4(c, a*0.85); }`,
    })
  );
  scene.add(atmoMesh);

  // 入場演出: 初期 scale 0.6 → 1.0、opacity 0 → 1
  earthGroup.scale.setScalar(0.6);
  earthGroup.visible = false;
  atmoMesh.visible = false;

  function aspect() {
    const r = container.getBoundingClientRect();
    return r.width / r.height;
  }
  function resize() {
    const r = container.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
  }
  window.addEventListener('resize', () => {
    resize();
    camera.aspect = aspect();
    camera.updateProjectionMatrix();
  });

  // 入場アニメーションフラグ
  let entered = false;
  let enterStart = 0;
  function enter() {
    entered = true;
    enterStart = performance.now();
    earthGroup.visible = true;
    atmoMesh.visible = true;
  }

  let rotY = 0;
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    rotY += 0.05 * dt;
    earthGroup.rotation.y = rotY;
    if (cloudMesh) cloudMesh.rotation.y += 0.006 * dt;

    if (entered) {
      const t = Math.min(1, (performance.now() - enterStart) / 1400);
      const ease = 1 - Math.pow(1 - t, 3);
      const s = 0.6 + 0.4 * ease;
      earthGroup.scale.setScalar(s);
      atmoMesh.scale.setScalar(s);
      earthMat.opacity = ease;
    }

    renderer.render(scene, camera);
  }
  tick();

  return { enter };
}
