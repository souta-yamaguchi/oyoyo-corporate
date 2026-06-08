import * as THREE from 'three';

const bootEl=document.getElementById('boot'), bootbar=document.getElementById('bootbar'), errEl=document.getElementById('err');
// 保険：何があっても3秒後にはローディングを消す
setTimeout(()=>bootEl.classList.add('gone'), 3000);
function fail(m,e){ console.error(e||m); errEl.style.display='flex';
  errEl.innerHTML='地球の生成に失敗しました。<br>'+m+'<br><br>file:// で画像取得がブロックされた可能性があります。Chrome で開いてみてください。';
  bootEl.classList.add('gone'); }

try {
  // ===== 国データ（首都・人口は2023年前後の定番概数。確信度の目安付き）=====
  // lat,lon は首都のおおよその座標
  const COUNTRIES = [
    {n:'日本', en:'Japan', flag:'🇯🇵', cap:'東京', lat:35.68, lon:139.69, pop:'1.24億', area:'37.8万km²'},
    {n:'中国', en:'China', flag:'🇨🇳', cap:'北京', lat:39.90, lon:116.40, pop:'14.1億', area:'960万km²'},
    {n:'インド', en:'India', flag:'🇮🇳', cap:'ニューデリー', lat:28.61, lon:77.21, pop:'14.3億', area:'329万km²'},
    {n:'アメリカ合衆国', en:'United States', flag:'🇺🇸', cap:'ワシントンD.C.', lat:38.90, lon:-77.04, pop:'3.35億', area:'983万km²'},
    {n:'インドネシア', en:'Indonesia', flag:'🇮🇩', cap:'ジャカルタ', lat:-6.21, lon:106.85, pop:'2.77億', area:'191万km²'},
    {n:'ブラジル', en:'Brazil', flag:'🇧🇷', cap:'ブラジリア', lat:-15.79, lon:-47.88, pop:'2.16億', area:'851万km²'},
    {n:'ロシア', en:'Russia', flag:'🇷🇺', cap:'モスクワ', lat:55.75, lon:37.62, pop:'1.44億', area:'1710万km²'},
    {n:'ナイジェリア', en:'Nigeria', flag:'🇳🇬', cap:'アブジャ', lat:9.08, lon:7.49, pop:'2.19億', area:'92.4万km²'},
    {n:'パキスタン', en:'Pakistan', flag:'🇵🇰', cap:'イスラマバード', lat:33.69, lon:73.06, pop:'2.40億', area:'79.6万km²'},
    {n:'バングラデシュ', en:'Bangladesh', flag:'🇧🇩', cap:'ダッカ', lat:23.81, lon:90.41, pop:'1.71億', area:'14.8万km²'},
    {n:'メキシコ', en:'Mexico', flag:'🇲🇽', cap:'メキシコシティ', lat:19.43, lon:-99.13, pop:'1.28億', area:'196万km²'},
    {n:'ドイツ', en:'Germany', flag:'🇩🇪', cap:'ベルリン', lat:52.52, lon:13.40, pop:'8400万', area:'35.7万km²'},
    {n:'イギリス', en:'United Kingdom', flag:'🇬🇧', cap:'ロンドン', lat:51.51, lon:-0.13, pop:'6700万', area:'24.3万km²'},
    {n:'フランス', en:'France', flag:'🇫🇷', cap:'パリ', lat:48.85, lon:2.35, pop:'6800万', area:'55.2万km²'},
    {n:'イタリア', en:'Italy', flag:'🇮🇹', cap:'ローマ', lat:41.90, lon:12.50, pop:'5900万', area:'30.1万km²'},
    {n:'カナダ', en:'Canada', flag:'🇨🇦', cap:'オタワ', lat:45.42, lon:-75.70, pop:'3900万', area:'998万km²'},
    {n:'オーストラリア', en:'Australia', flag:'🇦🇺', cap:'キャンベラ', lat:-35.28, lon:149.13, pop:'2600万', area:'769万km²'},
    {n:'韓国', en:'South Korea', flag:'🇰🇷', cap:'ソウル', lat:37.57, lon:126.98, pop:'5200万', area:'10.0万km²'},
    {n:'エジプト', en:'Egypt', flag:'🇪🇬', cap:'カイロ', lat:30.04, lon:31.24, pop:'1.11億', area:'100万km²'},
    {n:'南アフリカ', en:'South Africa', flag:'🇿🇦', cap:'プレトリア', lat:-25.75, lon:28.19, pop:'6000万', area:'122万km²'},
    {n:'サウジアラビア', en:'Saudi Arabia', flag:'🇸🇦', cap:'リヤド', lat:24.71, lon:46.68, pop:'3700万', area:'215万km²'},
    {n:'アルゼンチン', en:'Argentina', flag:'🇦🇷', cap:'ブエノスアイレス', lat:-34.60, lon:-58.38, pop:'4600万', area:'278万km²'},
    {n:'スペイン', en:'Spain', flag:'🇪🇸', cap:'マドリード', lat:40.42, lon:-3.70, pop:'4800万', area:'50.6万km²'},
    {n:'トルコ', en:'Turkey', flag:'🇹🇷', cap:'アンカラ', lat:39.93, lon:32.86, pop:'8500万', area:'78.4万km²'},
    {n:'タイ', en:'Thailand', flag:'🇹🇭', cap:'バンコク', lat:13.76, lon:100.50, pop:'7200万', area:'51.3万km²'},
    {n:'ベトナム', en:'Vietnam', flag:'🇻🇳', cap:'ハノイ', lat:21.03, lon:105.85, pop:'9800万', area:'33.1万km²'},
    {n:'ケニア', en:'Kenya', flag:'🇰🇪', cap:'ナイロビ', lat:-1.29, lon:36.82, pop:'5400万', area:'58.0万km²'},
    {n:'ノルウェー', en:'Norway', flag:'🇳🇴', cap:'オスロ', lat:59.91, lon:10.75, pop:'550万', area:'38.5万km²'},
    {n:'アイスランド', en:'Iceland', flag:'🇮🇸', cap:'レイキャビク', lat:64.15, lon:-21.94, pop:'37万', area:'10.3万km²'},
    {n:'ニュージーランド', en:'New Zealand', flag:'🇳🇿', cap:'ウェリントン', lat:-41.29, lon:174.78, pop:'520万', area:'26.8万km²'},
  ];

  // ===== Three セットアップ =====
  const app=document.getElementById('app');
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth,window.innerHeight);
  app.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 100);
  camera.position.set(0,0,3.2);

  // 星空背景（サイズ・色温度をばらつかせる）
  (function(){ const N=2600,g=new THREE.BufferGeometry(),p=new Float32Array(N*3),col=new Float32Array(N*3),sz=new Float32Array(N);
    for(let i=0;i<N;i++){const r=40+Math.random()*40,t=Math.random()*6.283,ph=Math.acos(2*Math.random()-1);
      p[i*3]=r*Math.sin(ph)*Math.cos(t);p[i*3+1]=r*Math.cos(ph);p[i*3+2]=r*Math.sin(ph)*Math.sin(t);
      const w=Math.random(); // 青白〜黄白〜赤の星
      col[i*3]=0.8+w*0.2; col[i*3+1]=0.85+Math.random()*0.15; col[i*3+2]=1.0-w*0.25;
      sz[i]=0.04+Math.pow(Math.random(),6)*0.32;}  // たまに大きい星
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    g.setAttribute('color',new THREE.BufferAttribute(col,3));
    g.setAttribute('aSize',new THREE.BufferAttribute(sz,1));
    const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      vertexShader:`attribute float aSize; varying vec3 vC;
        void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0);
          gl_PointSize=aSize*300.0/(-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader:`varying vec3 vC; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c);
        if(d>0.5)discard; gl_FragColor=vec4(vC, smoothstep(0.5,0.0,d)); }`,
      vertexColors:true});
    scene.add(new THREE.Points(g,m));})();

  // 太陽光（昼夜の境界を作る）
  const sun=new THREE.DirectionalLight(0xffffff,1.5); sun.position.set(5,2,3); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x223355,0.6));

  const R=1;
  // 地軸23.4°傾きの親 → その中で earthGroup を自転させる
  const tiltGroup=new THREE.Group(); tiltGroup.rotation.z=23.4*Math.PI/180; scene.add(tiltGroup);
  const earthGroup=new THREE.Group(); tiltGroup.add(earthGroup);

  // ===== 大陸を手続きで描いてテクスチャ化（CDN不要・file://で確実に動く）=====
  // 大陸の粗い輪郭ポリゴン（[経度,緯度] の配列）。地球儀として認識できる精度。
  const CONTINENTS = [
    // 北アメリカ
    [[-168,65],[-160,71],[-140,70],[-128,70],[-95,72],[-82,73],[-78,68],[-95,60],[-80,52],[-64,60],[-55,52],[-66,48],[-70,42],[-75,35],[-81,25],[-90,29],[-97,26],[-105,22],[-110,30],[-117,33],[-124,40],[-124,48],[-135,57],[-150,59],[-165,60]],
    // 南アメリカ
    [[-80,9],[-72,11],[-62,10],[-50,0],[-44,-3],[-35,-6],[-38,-13],[-48,-25],[-58,-34],[-66,-42],[-69,-52],[-75,-52],[-73,-44],[-71,-30],[-76,-14],[-81,-5],[-80,4]],
    // アフリカ＋アラビア
    [[-17,15],[-10,28],[0,36],[11,37],[24,32],[33,31],[35,24],[43,12],[51,12],[44,2],[41,-4],[40,-15],[34,-26],[26,-34],[18,-34],[12,-17],[9,4],[-8,5],[-16,12]],
    // ユーラシア（西欧〜シベリア〜中国〜インド）
    [[-9,37],[-2,43],[2,50],[-4,58],[8,63],[18,69],[33,71],[55,70],[75,73],[105,77],[140,73],[160,70],[170,68],[160,60],[145,58],[135,53],[140,46],[132,43],[122,40],[121,31],[110,21],[103,5],[97,16],[88,22],[80,9],[73,18],[66,25],[57,25],[48,30],[40,37],[33,42],[28,41],[20,44],[10,46],[2,43],[-5,40]],
    // オーストラリア
    [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[145,-17],[150,-23],[153,-28],[150,-38],[143,-39],[135,-35],[129,-32],[120,-34],[114,-30],[113,-26]],
    // グリーンランド
    [[-45,60],[-30,68],[-20,70],[-18,76],[-30,83],[-50,82],[-58,76],[-54,68],[-50,62]],
    // 日本
    [[130,31],[133,34],[137,35],[140,38],[142,40],[141,43],[145,44],[141,45],[139,40],[136,36],[133,34],[131,31]],
    // イギリス・アイルランド
    [[-6,50],[-2,53],[-4,58],[-8,58],[-10,53],[-6,51]],
    // 南極（下端の帯）
    [[-180,-70],[-120,-72],[-60,-71],[0,-70],[60,-69],[120,-72],[180,-71],[180,-90],[-180,-90]],
    // マダガスカル / ニュージーランド / 東南アジア島嶼（簡易）
    [[43,-13],[50,-15],[50,-25],[45,-25],[43,-18]],
    [[166,-35],[178,-38],[174,-46],[167,-45],[166,-40]],
    [[95,2],[105,1],[118,-3],[120,-8],[105,-7],[98,-2],[95,5]],
  ];

  let nightT=null;
  function ll2xy(lon,lat,W,H){ return [ (lon+180)/360*W, (90-lat)/180*H ]; }

  function makeEarthTextures(){
    const W=2048,H=1024;
    bootbar.style.width='30%';
    // --- 昼マップ（海＋大陸）---
    const day=document.createElement('canvas'); day.width=W; day.height=H;
    const d=day.getContext('2d');
    // 海：緯度方向グラデ（赤道=濃青、極=やや明）
    const og=d.createLinearGradient(0,0,0,H);
    og.addColorStop(0,'#0a2a55'); og.addColorStop(0.5,'#0d3a72'); og.addColorStop(1,'#0a2a55');
    d.fillStyle=og; d.fillRect(0,0,W,H);
    // 海の濃淡ノイズ
    for(let i=0;i<1600;i++){ const x=Math.random()*W,y=Math.random()*H,r=10+Math.random()*60;
      d.fillStyle='rgba('+(10+Math.random()*20|0)+','+(50+Math.random()*40|0)+','+(110+Math.random()*50|0)+',0.10)';
      d.beginPath(); d.arc(x,y,r,0,6.283); d.fill(); }
    // 海マスク用に陸を別Canvasにも描く
    const spec=document.createElement('canvas'); spec.width=W; spec.height=H;
    const s=spec.getContext('2d'); s.fillStyle='#000'; s.fillRect(0,0,W,H); // 海=黒
    // 大陸を塗る
    CONTINENTS.forEach(poly=>{
      d.beginPath(); s.beginPath();
      poly.forEach((p,i)=>{ const [x,y]=ll2xy(p[0],p[1],W,H);
        if(i===0){ d.moveTo(x,y); s.moveTo(x,y);} else { d.lineTo(x,y); s.lineTo(x,y);} });
      d.closePath(); s.closePath();
      d.fillStyle='#2f6b34'; d.fill();   // ベース緑
      s.fillStyle='#fff'; s.fill();      // 陸=白
    });
    // 陸に緯度で気候帯の色味（砂漠帯=茶、寒帯=白）＋粒状ノイズ。海マスクで陸内だけ着色
    const dim=d.getImageData(0,0,W,H), sm=s.getImageData(0,0,W,H);
    const dp=dim.data, sp=sm.data;
    for(let y=0;y<H;y++){ const lat=90-y/H*180;
      for(let x=0;x<W;x++){ const idx=(y*W+x)*4;
        if(sp[idx]>128){ // 陸
          let r=47,g=107,b=52;
          const a=Math.abs(lat);
          if(a>62){ const t=Math.min(1,(a-62)/22); r=47+(225-47)*t; g=107+(232-107)*t; b=52+(235-52)*t; } // 寒帯→雪
          else if(a>18 && a<33){ const t=1-Math.abs(a-25)/8; r=47+(150-47)*t; g=107+(120-107)*t; b=52+(60-52)*t; } // 砂漠帯
          const n=(Math.random()-0.5)*22;
          dp[idx]=Math.max(0,Math.min(255,r+n)); dp[idx+1]=Math.max(0,Math.min(255,g+n)); dp[idx+2]=Math.max(0,Math.min(255,b+n*0.5));
        }
      }
    }
    d.putImageData(dim,0,0);
    bootbar.style.width='60%';

    // --- 夜マップ（陸=暗い、都市＝黄色い光点）---
    const night=document.createElement('canvas'); night.width=W; night.height=H;
    const ng=night.getContext('2d'); ng.fillStyle='#02040a'; ng.fillRect(0,0,W,H);
    // 陸の暗いシルエット
    ng.drawImage(spec,0,0); ng.globalCompositeOperation='source-in';
    ng.fillStyle='#0a1426'; ng.fillRect(0,0,W,H); ng.globalCompositeOperation='source-over';
    // 都市光（国データの位置＋周囲にばらまき）
    COUNTRIES.forEach(c=>{ const [x,y]=ll2xy(c.lon,c.lat,W,H);
      for(let k=0;k<10;k++){ const ox=x+(Math.random()-0.5)*60, oy=y+(Math.random()-0.5)*40;
        const rr=1+Math.random()*2.5; const gg=ng.createRadialGradient(ox,oy,0,ox,oy,rr*3);
        gg.addColorStop(0,'rgba(255,220,140,0.95)'); gg.addColorStop(1,'rgba(255,180,80,0)');
        ng.fillStyle=gg; ng.beginPath(); ng.arc(ox,oy,rr*3,0,6.283); ng.fill(); } });
    bootbar.style.width='80%';

    // --- 雲マップ（透明＋白いまだら）---
    const cloud=document.createElement('canvas'); cloud.width=W; cloud.height=H;
    const cc=cloud.getContext('2d');
    for(let i=0;i<700;i++){ const x=Math.random()*W,y=Math.random()*H, r=20+Math.random()*90;
      const band=1-Math.abs((y/H)-0.5)*1.2;  // 赤道・中緯度に雲多め
      const gg=cc.createRadialGradient(x,y,0,x,y,r);
      const al=0.04+Math.random()*0.16*band;
      gg.addColorStop(0,'rgba(255,255,255,'+al+')'); gg.addColorStop(1,'rgba(255,255,255,0)');
      cc.fillStyle=gg; cc.beginPath(); cc.arc(x,y,r,0,6.283); cc.fill(); }

    const mk=(cv)=>{ const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; };
    nightT=mk(night);
    return { dayT:mk(day), specT:mk(spec), cloudT:mk(cloud) };
  }

  let earthMesh, earthMat, cloudMesh, atmoMesh;
  function buildEarth(dayT, normalT, specT, cloudT){
    // 昼夜ブレンド用カスタムシェーダ（lambert + 夜side で街明かり）
    earthMat=new THREE.ShaderMaterial({
      uniforms:{
        dayMap:{value:dayT}, nightMap:{value:nightT}, hasNight:{value: nightT?1:0},
        normalMap:{value:normalT}, specMap:{value:specT},
        sunDir:{value:new THREE.Vector3().copy(sun.position).normalize()},
        hasDay:{value: dayT?1:0}, hasReal:{value:0}, hasNormal:{value:0},
      },
      vertexShader:`
        varying vec2 vUv; varying vec3 vN; varying vec3 vWpos; varying vec3 vT; varying vec3 vB;
        void main(){ vUv=uv;
          vN=normalize(mat3(modelMatrix)*normal);
          // 接空間（法線マップ用）。球の経度方向を接線に。
          vec3 t=normalize(mat3(modelMatrix)*vec3(-normal.z,0.0,normal.x));
          vT=t; vB=cross(vN,t);
          vWpos=(modelMatrix*vec4(position,1.0)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`
        precision highp float;
        uniform sampler2D dayMap, nightMap, specMap, normalMap;
        uniform float hasNight, hasDay, hasReal, hasNormal;
        uniform vec3 sunDir;
        varying vec2 vUv; varying vec3 vN; varying vec3 vWpos; varying vec3 vT; varying vec3 vB;
        void main(){
          vec3 n=normalize(vN);
          // 法線マップで地形の凹凸を表現（陸の陰影が出る）
          if(hasNormal>0.5){
            vec3 nm=texture2D(normalMap,vUv).rgb*2.0-1.0;
            n=normalize(vT*nm.x + vB*nm.y + vN*nm.z);
          }
          vec3 L=normalize(sunDir);
          float d=dot(n, L);                          // 昼夜・陰影
          float geoD=dot(normalize(vN), L);           // 球全体の昼夜（地形に依らない）
          float dayAmt=smoothstep(-0.12,0.22,geoD);

          vec3 day = hasDay>0.5 ? texture2D(dayMap,vUv).rgb : vec3(0.10,0.22,0.45);
          // 彩度を少し上げて地球らしい青と緑を引き立てる
          float lum=dot(day,vec3(0.299,0.587,0.114));
          day=mix(vec3(lum), day, 1.25);
          // 昼側のランバート陰影（地形の凹凸で明暗）＋アンビエント
          float diff = max(d,0.0);
          day *= (0.42 + 1.05*diff);

          // 海マスク（specMap: 海ほど明るい）
          float ocean = hasDay>0.5 ? texture2D(specMap,vUv).r : 0.4;
          // 海の鏡面反射（太陽の照り返し）— 鋭く・弱く（白ボケ防止）
          vec3 V=normalize(cameraPosition-vWpos);
          vec3 Hh=normalize(L+V);
          float spec=pow(max(dot(normalize(vN),Hh),0.0), 800.0) * ocean * dayAmt;

          // 夜：街の灯り（昼側では消える）＋夜の地表をうっすら
          vec3 lights = hasNight>0.5 ? texture2D(nightMap,vUv).rgb : vec3(0.0);
          vec3 nightBase = mix(vec3(0.012,0.02,0.045), vec3(0.02,0.035,0.03), ocean); // 夜の海/陸
          vec3 night = nightBase + lights*2.2;   // 街灯を強める
          night *= (1.0-dayAmt);

          vec3 col = mix(night, day, dayAmt);
          col += vec3(1.0,0.97,0.9)*spec*0.5;                  // 海の照り返し（鋭く小さく）

          // 大気散乱：縁が青く光り、昼夜境界はやや赤み（夕焼け）
          float fres=pow(1.0-max(dot(normalize(vN),V),0.0), 2.5);
          float term=smoothstep(0.0,0.3,geoD)*(1.0-smoothstep(0.25,0.6,geoD)); // 昼夜境界帯
          col += vec3(0.35,0.55,1.0)*fres*0.6*dayAmt;          // 縁の青
          col += vec3(1.0,0.5,0.25)*fres*term*0.5;             // 夕焼けの赤
          gl_FragColor=vec4(col,1.0);
        }`,
    });
    earthMesh=new THREE.Mesh(new THREE.SphereGeometry(R,160,160), earthMat);
    earthGroup.add(earthMesh);

    // 雲
    if(cloudT){
      cloudMesh=new THREE.Mesh(new THREE.SphereGeometry(R*1.012,64,64),
        new THREE.MeshLambertMaterial({map:cloudT, transparent:true, opacity:0.45, depthWrite:false}));
      earthGroup.add(cloudMesh);
    }
    // 大気グロー（太陽側だけ強く光る・薄青→白）
    atmoMesh=new THREE.Mesh(new THREE.SphereGeometry(R*1.18,96,96), new THREE.ShaderMaterial({
      side:THREE.BackSide, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ sunDir:{value:new THREE.Vector3().copy(sun.position).normalize()} },
      vertexShader:`varying vec3 vN; varying vec3 vWpos;
        void main(){ vN=normalize(mat3(modelMatrix)*normal);
          vWpos=(modelMatrix*vec4(position,1.0)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`uniform vec3 sunDir; varying vec3 vN; varying vec3 vWpos;
        void main(){
          vec3 V=normalize(cameraPosition-vWpos);
          float i=pow(1.0-max(dot(normalize(vN),V),0.0), 3.2);
          float lit=max(dot(normalize(vN), normalize(sunDir)),0.0);   // 太陽側で強く
          float a=clamp(i,0.0,1.0)*(0.25+0.95*lit);
          vec3 c=mix(vec3(0.2,0.45,0.95), vec3(0.6,0.8,1.0), lit);
          gl_FragColor=vec4(c, a*0.85); }`,
    }));
    scene.add(atmoMesh);

    buildPins();
    bootEl.classList.add('gone');
  }

  // ===== 緯度経度 → 3D座標 =====
  function llToVec(lat,lon,radius){
    const phi=(90-lat)*Math.PI/180, theta=(lon+180)*Math.PI/180;
    return new THREE.Vector3(
      -radius*Math.sin(phi)*Math.cos(theta),
       radius*Math.cos(phi),
       radius*Math.sin(phi)*Math.sin(theta));
  }

  // ===== 国ピン =====
  const pinGroup=new THREE.Group(); earthGroup.add(pinGroup);
  const pins=[];
  // 円形グラデのスプライト用テクスチャ（淡く光るドット）
  function dotTex(){ const s=64,cv=document.createElement('canvas'); cv.width=cv.height=s;
    const g=cv.getContext('2d'); const rg=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    rg.addColorStop(0,'rgba(255,240,200,1)'); rg.addColorStop(0.35,'rgba(255,205,90,0.9)');
    rg.addColorStop(1,'rgba(255,180,60,0)'); g.fillStyle=rg; g.fillRect(0,0,s,s);
    const t=new THREE.CanvasTexture(cv); return t; }
  const PIN_TEX=dotTex();
  function buildPins(){
    COUNTRIES.forEach(c=>{
      const pos=llToVec(c.lat,c.lon,R*1.008);
      // 光るスプライトのピン（常にカメラを向き、地表に馴染む）
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:PIN_TEX, transparent:true,
        depthTest:true, depthWrite:false, blending:THREE.AdditiveBlending}));
      sp.scale.setScalar(0.05); sp.position.copy(pos); sp.userData=c;
      pinGroup.add(sp); pins.push(sp);
      // 当たり判定用の見えない小球（クリックしやすく）
      const hit=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,8),
        new THREE.MeshBasicMaterial({visible:false}));
      hit.position.copy(pos); hit.userData=c; pinGroup.add(hit); pins.push(hit);
    });
  }

  // テクスチャを生成して地球を構築（CDN不要・全定義の後で実行）
  const tex=makeEarthTextures();
  bootbar.style.width='100%';
  buildEarth(tex.dayT, null, tex.specT, tex.cloudT);

  // 本物のNASA地図テクスチャを取得して手描き版を差し替え。
  // ①同梱の textures/（最優先・file://で確実）→ ②CDN の順でフォールバック。
  (function upgradeTextures(){
    const LOCAL='static/textures/';
    const CDN='https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/';
    const ld=new THREE.TextureLoader(); ld.setCrossOrigin('anonymous');
    const tryLoad=(srcs)=> new Promise(res=>{
      let i=0; const next=()=>{ if(i>=srcs.length){ res(null); return; }
        ld.load(srcs[i++], t=>{ t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; res(t); }, undefined, next); };
      next();
    });
    const get=(name)=> tryLoad([LOCAL+name, CDN+name]);
    Promise.all([
      get('earth_atmos_2048.jpg'),
      get('earth_specular_2048.jpg'),
      get('earth_normal_2048.jpg'),
      get('earth_lights_2048.png'),
      get('earth_clouds_1024.png'),
    ]).then(([day,spec,normal,night,cloud])=>{
      if(!earthMat) return;
      if(day){ earthMat.uniforms.dayMap.value=day; earthMat.uniforms.hasReal.value=1; }
      if(spec){ earthMat.uniforms.specMap.value=spec; }
      if(normal){ earthMat.uniforms.normalMap.value=normal; earthMat.uniforms.hasNormal.value=1; }
      if(night){ earthMat.uniforms.nightMap.value=night; if(typeof flags==='undefined'||flags.night) earthMat.uniforms.hasNight.value=1; }
      if(cloud && cloudMesh){ cloudMesh.material.map=cloud; cloudMesh.material.opacity=0.55; cloudMesh.material.needsUpdate=true; }
    });
  })();

  // ===== 操作（ドラッグ回転・ホイールズーム）=====
  let dragging=false, lastX=0,lastY=0, vx=0,vy=0, downX=0,downY=0,movedFlag=false;
  let rotX=0.2, rotY=0;     // 地球の回転
  app.addEventListener('pointerdown',e=>{ dragging=true; movedFlag=false; lastX=downX=e.clientX; lastY=downY=e.clientY; app.classList.add('grabbing'); });
  window.addEventListener('pointermove',e=>{
    if(!dragging) return;
    const dx=e.clientX-lastX, dy=e.clientY-lastY;
    if(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)>4) movedFlag=true;
    rotY+=dx*0.005; rotX+=dy*0.005;
    rotX=Math.max(-1.4,Math.min(1.4,rotX));
    vx=dx*0.005; vy=dy*0.005;
    lastX=e.clientX; lastY=e.clientY;
  });
  window.addEventListener('pointerup',e=>{ if(dragging&&!movedFlag) onClick(e.clientX,e.clientY); dragging=false; app.classList.remove('grabbing'); });
  app.addEventListener('wheel',e=>{ e.preventDefault();
    camera.position.z=Math.max(1.25,Math.min(7, camera.position.z*Math.exp(e.deltaY*0.0009))); },{passive:false});

  // ===== クリック → 国カード =====
  const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
  const cardEl=document.getElementById('card');
  function onClick(sx,sy){
    if(!pins.length) return;
    ndc.x=(sx/window.innerWidth)*2-1; ndc.y=-(sy/window.innerHeight)*2+1;
    ray.setFromCamera(ndc,camera);
    ray.params.Points.threshold=0.02;
    const hit=ray.intersectObjects(pins,false);
    if(hit.length){ showCard(hit[0].object.userData, sx,sy); }
    else { cardEl.style.display='none'; selected=null; }
  }
  let selected=null;
  function showCard(c, sx,sy){
    selected=c;
    cardEl.innerHTML=`<div class="flag">${c.flag}</div><h3>${c.n}</h3>
      <div class="row"><b>首都</b> ${c.cap}</div>
      <div class="row"><b>人口</b> 約${c.pop} <span style="color:#6f86b8">(85%)</span></div>
      <div class="row"><b>面積</b> ${c.area}</div>
      <div class="note">※人口は2023年前後の概数。正確な最新値は要出典。</div>`;
    const x=sx!==undefined?sx:window.innerWidth/2, y=sy!==undefined?sy:window.innerHeight/2;
    cardEl.style.left=Math.min(window.innerWidth-300,x+16)+'px';
    cardEl.style.top=Math.min(window.innerHeight-180,y+16)+'px';
    cardEl.style.display='block';
  }

  // ===== レイヤートグル =====
  const flags={clouds:true,night:true,pins:true,spin:true};
  document.querySelectorAll('#layers button').forEach(b=> b.addEventListener('click',()=>{
    const l=b.dataset.l; flags[l]=!flags[l]; b.classList.toggle('on',flags[l]);
    if(l==='clouds'&&cloudMesh) cloudMesh.visible=flags.clouds;
    if(l==='pins') pinGroup.visible=flags.pins;
    if(l==='night'&&earthMat) earthMat.uniforms.hasNight.value=(flags.night&&nightT)?1:0;
  }));

  // ===== 検索 → その国へ回転 =====
  const sb=document.getElementById('searchBox');
  sb.addEventListener('keydown',e=>{ if(e.key!=='Enter')return;
    const q=sb.value.trim().toLowerCase(); if(!q)return;
    const c=COUNTRIES.find(x=> x.n.toLowerCase().includes(q)||x.en.toLowerCase().includes(q)||x.cap.toLowerCase().includes(q));
    if(c){ // その国を正面に持ってくる回転を設定
      rotY = -(c.lon+180)*Math.PI/180 - Math.PI/2;
      rotX = c.lat*Math.PI/180;
      camera.position.z=2.0;
      showCard(c);
    } else { sb.value=''; sb.placeholder='見つかりません（主要国のみ対応）'; }
  });

  // ===== リサイズ =====
  window.addEventListener('resize',()=>{ camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth,window.innerHeight); });

  // ===== ループ =====
  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),0.05);
    if(!dragging){ if(flags.spin) rotY+=0.035*dt + vx; rotX+=vy; vx*=0.92; vy*=0.92; }
    earthGroup.rotation.y=rotY; earthGroup.rotation.x=rotX;
    if(cloudMesh) cloudMesh.rotation.y += 0.004*dt;  // 雲は少し速く流れる
    // 選択中カードを天体に追従（地軸傾き tiltGroup も合成）
    if(selected && cardEl.style.display==='block'){
      const p=llToVec(selected.lat,selected.lon,R*1.05).clone();
      p.applyEuler(earthGroup.rotation); p.applyEuler(tiltGroup.rotation); p.project(camera);
      if(p.z<1){ cardEl.style.left=Math.min(window.innerWidth-300,(p.x*0.5+0.5)*window.innerWidth+16)+'px';
        cardEl.style.top=Math.min(window.innerHeight-180,(-p.y*0.5+0.5)*window.innerHeight+16)+'px'; }
    }
    renderer.render(scene,camera);
  }
  animate();

} catch(e){ fail(e&&e.message?e.message:String(e), e); }
