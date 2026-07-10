// =============================================
// NEURAL MAP 27.R - Vue 3 + Three.js
// =============================================
const { createApp, ref, reactive, onMounted, onUnmounted } = Vue;

createApp({
  setup() {
    const rand = (min, max) => Math.random() * (max - min) + min;
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    const freq = ref(45);
    const alpha = ref(12.4);
    const beta = ref(28.7);
    const theta = ref(6.1);
    const delta = ref(3.2);
    const frontal = ref(84);
    const temporal = ref(67);
    const occipital = ref(91);
    const broca = ref(87);
    const prefrontal = ref(74);
    const limbic = ref(62);
    const brainstem = ref(45);
    const cerebellum = ref(38);
    const coordX = ref('+0.00');
    const coordY = ref('-0.00');
    const coordZ = ref('+0.00');
    const tempCore = ref('37.2C');
    const tempSurface = ref('35.8C');
    const frameCount = ref(0);
    const timeDisplay = ref('00:00:00');
    const dateDisplay = ref('2087.06.14');

    const alphaBar = ref(62);
    const betaBar = ref(78);
    const thetaBar = ref(35);
    const deltaBar = ref(20);
    const frontalBar = ref(84);
    const temporalBar = ref(67);
    const occipitalBar = ref(91);
    const selectedRegionName = ref('Selecciona una zona del cerebro 3D');
    const selectedRegionShort = ref('Haz clic sobre la malla para inspeccionar la región.');
    const selectedRegionDesc = ref('La selección mostrará información anatómica y funcional de la parte del cerebro marcada por el punto de impacto.');
    const selectedRegionStats = ref('');
    const selectedRegionColor = ref('var(--accent)');
    const selectedRegionKey = ref('default');

    // Three.js refs
    let brainScene, brainCamera, brainRenderer, brainMesh, brainGroup;
    let raycaster;
    let pointer;
    let nodeMeshes = [];
    let connectionLines = [];
    let pulseMeshes = [];
    let animationId;
    let particles = [];
    let time = 0;
    let lastPulse = 0;
    let resizeObserver;

    // Wave canvases refs
    let wave1Canvas, wave1Ctx, wave2Canvas, wave2Ctx;
    let wave1W, wave1H, wave2W, wave2H;

    const brainRegions = {
      frontal: {
        name: 'Lóbulo frontal',
        short: 'Control ejecutivo, lenguaje y planificación.',
        desc: 'Región anterior dominante en la referencia visual. Se asocia con decisiones, control motor fino, lenguaje y funciones ejecutivas.',
        stats: 'Funciones: planificación, lenguaje, control motor',
        color: 'var(--yellow)'
      },
      temporal: {
        name: 'Lóbulo temporal',
        short: 'Procesamiento auditivo y memoria.',
        desc: 'Zona lateral media vinculada al reconocimiento auditivo, memoria episódica y comprensión del lenguaje.',
        stats: 'Funciones: memoria, audición, comprensión',
        color: 'var(--red)'
      },
      parietal: {
        name: 'Lóbulo parietal',
        short: 'Integración sensorial y orientación espacial.',
        desc: 'Región superior que integra tacto, propiocepción y orientación en el espacio.',
        stats: 'Funciones: integración sensorial, espacio',
        color: 'var(--blue)'
      },
      occipital: {
        name: 'Lóbulo occipital',
        short: 'Procesamiento visual.',
        desc: 'Zona posterior encargada del análisis de la información visual.',
        stats: 'Funciones: visión, forma, movimiento',
        color: 'var(--accent)'
      },
      cerebellum: {
        name: 'Cerebelo',
        short: 'Coordinación y equilibrio.',
        desc: 'Estructura inferior posterior que coordina movimiento, equilibrio, precisión y aprendizaje motor.',
        stats: 'Funciones: equilibrio, coordinación',
        color: 'var(--fg-dim)'
      },
      brainstem: {
        name: 'Tallo encefálico',
        short: 'Funciones vitales y conexión central.',
        desc: 'Parte inferior de conexión con médula espinal. Regula respiración, ritmo cardíaco y reflejos básicos.',
        stats: 'Funciones: respiración, ritmo, reflejos',
        color: 'var(--accent)'
      },
      default: {
        name: 'Corteza cerebral',
        short: 'Zona cortical seleccionada.',
        desc: 'Punto seleccionado sobre la superficie del cerebro. El sistema está clasificando la zona anatómica más cercana.',
        stats: 'Funciones: variada según subregión',
        color: 'var(--accent)'
      }
    };

    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      timeDisplay.value = `${h}:${m}:${s}`;
      const y = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      dateDisplay.value = `${y}.${mo}.${d}`;
    }

    function updateMetrics() {
      frameCount.value++;

      const now = Date.now();
      freq.value = Math.round(45 + Math.sin(now * 0.001) * 3);

      alpha.value = (12 + Math.sin(now * 0.0007) * 2).toFixed(1);
      beta.value = (28 + Math.cos(now * 0.0005) * 4).toFixed(1);
      theta.value = (6 + Math.sin(now * 0.0009) * 1.5).toFixed(1);
      delta.value = (3 + Math.cos(now * 0.0006) * 1).toFixed(1);

      alphaBar.value = clamp(alpha.value / 20 * 100, 5, 100);
      betaBar.value = clamp(beta.value / 40 * 100, 5, 100);
      thetaBar.value = clamp(theta.value / 10 * 100, 5, 100);
      deltaBar.value = clamp(delta.value / 6 * 100, 5, 100);

      frontal.value = Math.round(84 + Math.sin(now * 0.0004) * 6);
      temporal.value = Math.round(67 + Math.cos(now * 0.0006) * 8);
      occipital.value = Math.round(91 + Math.sin(now * 0.0003) * 4);
      frontalBar.value = frontal.value;
      temporalBar.value = temporal.value;
      occipitalBar.value = occipital.value;

      broca.value = Math.round(87 + Math.sin(now * 0.0008) * 8);
      prefrontal.value = Math.round(74 + Math.cos(now * 0.0005) * 10);
      limbic.value = Math.round(62 + Math.sin(now * 0.0007) * 7);
      brainstem.value = Math.round(45 + Math.cos(now * 0.0009) * 5);
      cerebellum.value = Math.round(38 + Math.sin(now * 0.0004) * 4);

      const cx = (Math.sin(now * 0.0003) * 12).toFixed(2);
      const cy = (Math.cos(now * 0.0004) * 8).toFixed(2);
      const cz = (Math.sin(now * 0.0002) * 5).toFixed(2);
      coordX.value = (cx >= 0 ? '+' : '') + cx;
      coordY.value = (cy >= 0 ? '+' : '') + cy;
      coordZ.value = (cz >= 0 ? '+' : '') + cz;

      tempCore.value = (37.2 + Math.sin(now * 0.0001) * 0.3).toFixed(1) + 'C';
      tempSurface.value = (35.8 + Math.cos(now * 0.00015) * 0.2).toFixed(1) + 'C';
    }

    function setupWaveCanvas(id) {
      const canvas = document.getElementById(id);
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        return { w: rect.width, h: rect.height };
      }
      const dims = resize();
      return { canvas, ctx, resize, w: dims.w, h: dims.h };
    }

    function getBrainRegionInfo(localPoint) {
      const x = localPoint.x;
      const y = localPoint.y;
      const z = localPoint.z;

      if (y < -0.34 && x > 0.1) return { key: 'brainstem', ...brainRegions.brainstem };
      if (y < -0.18 && x > 0.05) return { key: 'cerebellum', ...brainRegions.cerebellum };
      if (x < -0.28 && y > -0.12) return { key: 'frontal', ...brainRegions.frontal };
      if (x > 0.28 && y > -0.05) return { key: 'occipital', ...brainRegions.occipital };
      if (y > 0.16 && x >= -0.15) return { key: 'parietal', ...brainRegions.parietal };
      if (x >= -0.25 && x <= 0.15) return { key: 'temporal', ...brainRegions.temporal };

      if (z > 0.2) return { key: 'occipital', ...brainRegions.occipital };
      if (z < -0.15) return { key: 'temporal', ...brainRegions.temporal };
      return { key: 'default', ...brainRegions.default };
    }

    function applyRegionSelection(regionKey, localPoint) {
      const region = brainRegions[regionKey] || brainRegions.default;
      selectedRegionKey.value = regionKey;
      selectedRegionName.value = region.name;
      selectedRegionShort.value = region.short;
      selectedRegionDesc.value = region.desc;
      selectedRegionStats.value = region.stats;
      selectedRegionColor.value = region.color;

      if (localPoint) {
        coordX.value = (localPoint.x >= 0 ? '+' : '') + localPoint.x.toFixed(2);
        coordY.value = (localPoint.y >= 0 ? '+' : '') + localPoint.y.toFixed(2);
        coordZ.value = (localPoint.z >= 0 ? '+' : '') + localPoint.z.toFixed(2);
      }
    }

    function handleBrainPointerDown(event) {
      if (!brainRenderer || !brainCamera || !brainMesh || !raycaster || !pointer) return;

      const rect = brainRenderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(pointer, brainCamera);
      const hits = raycaster.intersectObject(brainMesh, false);
      if (!hits.length) return;

      const hit = hits[0];
      const localPoint = brainGroup.worldToLocal(hit.point.clone());
      const region = getBrainRegionInfo(localPoint);
      applyRegionSelection(region.key, localPoint);
    }

    function drawWave(waveObj, t, color, freq, amp) {
      if (!waveObj) return;
      const { ctx, w, h } = waveObj;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(200, 220, 232, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const y = h / 2 +
          Math.sin(nx * freq + t * 3) * amp * h * 0.3 +
          Math.sin(nx * freq * 2.3 + t * 5) * amp * h * 0.1 +
          Math.sin(nx * freq * 0.5 + t * 1.5) * amp * h * 0.15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, h / 2, 0, h);
      grad.addColorStop(0, 'rgba(0, 229, 200, 0.08)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // =============================================
    // THREE.JS - MODELO 3D DEL CEREBRO
    // =============================================
    function initThreeJS() {
      const container = document.getElementById('brainCanvas');
      if (!container) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;

      brainScene = new THREE.Scene();

      brainCamera = new THREE.PerspectiveCamera(45, w / Math.max(h, 1), 0.1, 100);
      brainCamera.position.z = 4.5;
      brainCamera.position.y = 0.2;
      brainCamera.lookAt(0, 0, 0);

      brainRenderer = new THREE.WebGLRenderer({ canvas: container, alpha: true, antialias: true });
      brainRenderer.setSize(w, h);
      brainRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Luz ambiental
      const ambientLight = new THREE.AmbientLight(0x404040, 2);
      brainScene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0x8fdfff, 0x0a1020, 1.5);
      brainScene.add(hemiLight);

      // Luz puntual principal
      const pointLight = new THREE.PointLight(0x00e5c8, 2, 20);
      pointLight.position.set(5, 5, 5);
      brainScene.add(pointLight);

      const pointLight2 = new THREE.PointLight(0xff3a5c, 1, 15);
      pointLight2.position.set(-5, -3, 3);
      brainScene.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0x2e8cff, 1, 15);
      pointLight3.position.set(3, -5, -3);
      brainScene.add(pointLight3);

      const pointLight4 = new THREE.PointLight(0xffffff, 0.8, 18);
      pointLight4.position.set(0, 2, 6);
      brainScene.add(pointLight4);

      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();

      brainGroup = new THREE.Group();
      brainGroup.scale.set(1.25, 1.18, 1.2);
      brainScene.add(brainGroup);

      // Crear cerebro principal - esfera con ruido
      const brainGeom = new THREE.IcosahedronGeometry(1.2, 5);
      const positions = brainGeom.attributes.position;
      const colors = [];

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);

        // Perfil anatómico: frente a la izquierda, cerebelo y tallo a la derecha-abajo.
        let nx = x * 1.18;
        let ny = y * 0.98;
        let nz = z * 0.9;

        const front = clamp((-nx + 1.1) / 2.2, 0, 1);
        const back = clamp((nx + 1.1) / 2.2, 0, 1);
        const top = clamp((ny + 1.1) / 2.2, 0, 1);
        const bottom = clamp((-ny + 1.1) / 2.2, 0, 1);

        // Lóbulo frontal voluminoso
        nx -= front * front * 0.22;
        ny += front * 0.06;
        nz += front * 0.03;

        // Parte posterior redondeada
        nx += back * back * 0.14;
        nz -= back * 0.04;

        // Parte superior más elevada
        ny += top * top * 0.18;

        // Base más plana
        ny -= bottom * bottom * 0.12;

        // Cerebelo visible en la zona posterior-inferior
        const cerebellum = clamp((nx + 0.15) / 0.9, 0, 1) * clamp((-ny + 0.35) / 0.9, 0, 1);
        nx += cerebellum * 0.15;
        ny -= cerebellum * 0.12;
        nz += cerebellum * 0.16;

        // Tallo encefálico
        const stem = clamp((nx + 0.25) / 0.7, 0, 1) * clamp((-ny + 0.7) / 0.8, 0, 1) * clamp((0.3 - Math.abs(nz)) / 0.3, 0, 1);
        nx += stem * 0.04;
        ny -= stem * 0.42;
        nz *= (1 - stem * 0.25);

        // Surco central y pliegues grandes
        const midline = 1 - Math.min(Math.abs(z) * 1.8, 1);
        nx += Math.sin((ny + 0.25) * 6.0) * 0.03 * midline;
        ny += Math.cos((nx - 0.1) * 5.0) * 0.025;
        nz += Math.sin((nx + ny) * 4.5) * 0.025;

        // Deformación orgánica suave para simular giros y surcos
        const noise = Math.sin(x * 3.1 + y * 2.2) * Math.cos(z * 2.6 - y * 1.4) * 0.045;
        nx += noise * 0.8;
        ny += noise * 0.55;
        nz += noise * 0.7;

        // Aplanar un poco la base
        if (ny < -0.35) {
          ny += 0.08 * clamp((-ny - 0.35) / 0.8, 0, 1);
        }

        // Suavizar la punta frontal
        if (nx < -0.65) {
          nz *= 0.95;
          ny += 0.03;
        }

        positions.setXYZ(i, nx, ny, nz);

        // Color base con gradiente sutil
        const r = 0.04 + Math.abs(nx) * 0.025;
        const g = 0.12 + Math.abs(ny) * 0.03;
        const b = 0.2 + Math.abs(nz) * 0.035;
        colors.push(r, g, b);
      }

      brainGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      brainGeom.computeVertexNormals();

      // Material del cerebro
      const brainMaterial = new THREE.MeshPhongMaterial({
        color: 0x3d78ff,
        emissive: 0x1030a0,
        specular: 0x9edcff,
        shininess: 62,
        transparent: true,
        opacity: 0.96,
        wireframe: false,
        side: THREE.DoubleSide
      });

      brainMesh = new THREE.Mesh(brainGeom, brainMaterial);
      brainGroup.add(brainMesh);

      // Wireframe sutil del cerebro
      const wireframeGeom = new THREE.IcosahedronGeometry(1.22, 3);
      const wireframeMat = new THREE.MeshBasicMaterial({
        color: 0x6fb9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.1
      });
      const wireframeMesh = new THREE.Mesh(wireframeGeom, wireframeMat);
      brainGroup.add(wireframeMesh);

      // Nodos neuronales
      createBrainNodes();

      // Conexiones entre nodos
      createConnections();

      // Impulsos iniciales
      for (let i = 0; i < 3; i++) {
        spawnPulse();
      }

      // Partículas flotantes
      createFloatingParticles();

      // Resize handler
      window.addEventListener('resize', onBrainResize);
      brainRenderer.domElement.addEventListener('pointerdown', handleBrainPointerDown);
    }

    function createBrainNodes() {
      // Limpiar nodos anteriores
      nodeMeshes.forEach(mesh => brainGroup.remove(mesh));
      nodeMeshes = [];

      const regions = [
        { name: 'higher', count: 35, ox: 0.2, oy: 0.35, oz: 0.1, rx: 0.5, ry: 0.35, rz: 0.35, color: 0xffc940 },
        { name: 'speech', count: 25, ox: -0.45, oy: 0.05, oz: 0.15, rx: 0.3, ry: 0.25, rz: 0.3, color: 0xff3a5c },
        { name: 'middle', count: 30, ox: -0.1, oy: 0.0, oz: 0.2, rx: 0.35, ry: 0.3, rz: 0.35, color: 0x2e8cff },
        { name: 'lower', count: 20, ox: -0.2, oy: -0.35, oz: 0.1, rx: 0.25, ry: 0.2, rz: 0.25, color: 0x00e5c8 },
        { name: 'cerebellum', count: 25, ox: -0.5, oy: -0.25, oz: -0.15, rx: 0.3, ry: 0.22, rz: 0.28, color: 0x4a6a7a }
      ];

      const nodeGeom = new THREE.SphereGeometry(0.03, 8, 8);

      regions.forEach(region => {
        for (let i = 0; i < region.count; i++) {
          const angle = rand(0, Math.PI * 2);
          const phi = rand(0, Math.PI);
          const r = rand(0, 1);
          const sx = Math.sin(phi) * Math.cos(angle) * region.rx * r;
          const sy = Math.sin(phi) * Math.sin(angle) * region.ry * r;
          const sz = Math.cos(phi) * region.rz * r;

          const x = region.ox + sx;
          const y = region.oy + sy;
          const z = region.oz + sz;

          const material = new THREE.MeshBasicMaterial({
            color: region.color,
            transparent: true,
            opacity: 0.8
          });

          const node = new THREE.Mesh(nodeGeom, material);
          node.position.set(x, y, z);
          node.userData = {
            region: region.name,
            baseX: x,
            baseY: y,
            baseZ: z,
            phase: rand(0, Math.PI * 2),
            speed: rand(0.3, 1.2),
            amplitude: rand(0.02, 0.06),
            connections: []
          };

          brainGroup.add(node);
          nodeMeshes.push(node);
        }
      });
    }

    function createConnections() {
      // Limpiar conexiones anteriores
      connectionLines.forEach(line => brainGroup.remove(line));
      connectionLines = [];

      const maxDist = 0.35;

      for (let i = 0; i < nodeMeshes.length; i++) {
        for (let j = i + 1; j < nodeMeshes.length; j++) {
          const a = nodeMeshes[i].position;
          const b = nodeMeshes[j].position;
          const dist = a.distanceTo(b);

          if (dist < maxDist && nodeMeshes[i].userData.connections.length < 4) {
            nodeMeshes[i].userData.connections.push(j);
            nodeMeshes[j].userData.connections.push(i);

            const geometry = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(a.x, a.y, a.z),
              new THREE.Vector3(b.x, b.y, b.z)
            ]);

            const sameRegion = nodeMeshes[i].userData.region === nodeMeshes[j].userData.region;
            const material = new THREE.LineBasicMaterial({
              color: sameRegion ? nodeMeshes[i].material.color.getHex() : 0x4a6a7a,
              transparent: true,
              opacity: sameRegion ? 0.15 : 0.06
            });

            const line = new THREE.Line(geometry, material);
            brainGroup.add(line);
            connectionLines.push({ line, from: i, to: j });
          }
        }
      }
    }

    function spawnPulse() {
      if (nodeMeshes.length === 0) return;
      const idx = Math.floor(rand(0, nodeMeshes.length));
      const node = nodeMeshes[idx];
      if (node.userData.connections.length > 0) {
        const targetIdx = node.userData.connections[Math.floor(rand(0, node.userData.connections.length))];
        const target = nodeMeshes[targetIdx];

        const geometry = new THREE.SphereGeometry(0.025, 6, 6);
        const material = new THREE.MeshBasicMaterial({
          color: node.material.color.getHex(),
          transparent: true,
          opacity: 0.9
        });

        const pulse = new THREE.Mesh(geometry, material);
        pulse.position.copy(node.position);
        pulse.userData = {
          from: idx,
          to: targetIdx,
          progress: 0,
          speed: rand(0.005, 0.02),
          alive: true
        };

        brainGroup.add(pulse);
        pulseMeshes.push(pulse);
      }
    }

    function createFloatingParticles() {
      // Limpiar partículas anteriores
      particles.forEach(p => brainScene.remove(p));
      particles = [];

      const particleGeom = new THREE.BufferGeometry();
      const particleCount = 50;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const theta = rand(0, Math.PI * 2);
        const phi = rand(0, Math.PI);
        const r = 1.8 + rand(0, 0.5);

        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
        positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
        positions[i * 3 + 2] = Math.cos(phi) * r;

        const colorChoice = Math.random();
        if (colorChoice < 0.33) {
          colors[i * 3] = 0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.78;
        } else if (colorChoice < 0.66) {
          colors[i * 3] = 1; colors[i * 3 + 1] = 0.23; colors[i * 3 + 2] = 0.36;
        } else {
          colors[i * 3] = 0.18; colors[i * 3 + 1] = 0.55; colors[i * 3 + 2] = 1;
        }
      }

      particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      const particleSystem = new THREE.Points(particleGeom, particleMat);
      brainScene.add(particleSystem);
      particles.push(particleSystem);
    }

    function updateBrain(t) {
      if (!brainGroup) return;

      // Rotación suave del cerebro
      brainGroup.rotation.y = -0.42 + Math.sin(t * 0.2) * 0.08;
      brainGroup.rotation.x = 0.12 + Math.sin(t * 0.15) * 0.05;
      brainGroup.rotation.z = -0.08 + Math.sin(t * 0.11) * 0.03;

      // Actualizar nodos
      nodeMeshes.forEach(node => {
        const ud = node.userData;
        node.position.x = ud.baseX + Math.sin(t * ud.speed + ud.phase) * ud.amplitude;
        node.position.y = ud.baseY + Math.cos(t * ud.speed * 0.7 + ud.phase) * ud.amplitude * 0.6;
        node.position.z = ud.baseZ + Math.cos(t * ud.speed * 0.5 + ud.phase) * ud.amplitude * 0.4;

        // Pulso de opacidad
        const alpha = 0.4 + Math.sin(t * ud.speed + ud.phase) * 0.3;
        const regionMap = {
          frontal: ['higher', 'speech'],
          temporal: ['speech', 'middle'],
          parietal: ['higher', 'middle'],
          occipital: ['middle'],
          cerebellum: ['cerebellum'],
          brainstem: ['lower']
        };
        const activeRegions = regionMap[selectedRegionKey.value] || [];
        const isActive = activeRegions.includes(ud.region);
        node.material.opacity = clamp(isActive ? alpha + 0.25 : alpha, 0.18, 1);
        const scale = isActive ? 1.8 : 1;
        node.scale.set(scale, scale, scale);
      });

      // Actualizar conexiones
      connectionLines.forEach(conn => {
        const fromNode = nodeMeshes[conn.from];
        const toNode = nodeMeshes[conn.to];
        if (fromNode && toNode) {
          const positions = conn.line.geometry.attributes.position.array;
          positions[0] = fromNode.position.x;
          positions[1] = fromNode.position.y;
          positions[2] = fromNode.position.z;
          positions[3] = toNode.position.x;
          positions[4] = toNode.position.y;
          positions[5] = toNode.position.z;
          conn.line.geometry.attributes.position.needsUpdate = true;
        }
      });

      // Actualizar impulsos
      pulseMeshes.forEach(pulse => {
        const ud = pulse.userData;
        ud.progress += ud.speed;
        if (ud.progress >= 1) {
          ud.alive = false;
        } else {
          const fromNode = nodeMeshes[ud.from];
          const toNode = nodeMeshes[ud.to];
          if (fromNode && toNode) {
            pulse.position.x = lerp(fromNode.position.x, toNode.position.x, ud.progress);
            pulse.position.y = lerp(fromNode.position.y, toNode.position.y, ud.progress);
            pulse.position.z = lerp(fromNode.position.z, toNode.position.z, ud.progress);

            const scale = 1 + Math.sin(ud.progress * Math.PI) * 2;
            pulse.scale.set(scale, scale, scale);

            const alpha = 1 - Math.abs(ud.progress - 0.5) * 2;
            pulse.material.opacity = clamp(alpha, 0.1, 1);
          }
        }
      });

      // Limpiar impulsos muertos
      pulseMeshes = pulseMeshes.filter(p => {
        if (!p.userData.alive) {
          brainGroup.remove(p);
          p.geometry.dispose();
          p.material.dispose();
          return false;
        }
        return true;
      });

      // Generar nuevos impulsos
      if (t - lastPulse > 0.08) {
        spawnPulse();
        if (Math.random() < 0.3) spawnPulse();
        lastPulse = t;
      }

      // Rotar partículas
      particles.forEach(p => {
        p.rotation.y += 0.0005;
        p.rotation.x += 0.0003;
      });
    }

    function onBrainResize() {
      const container = document.getElementById('brainCanvas');
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      brainCamera.aspect = w / Math.max(h, 1);
      brainCamera.updateProjectionMatrix();
      brainRenderer.setSize(w, h);
    }

    function animate(timestamp) {
      time = timestamp * 0.001;

      // Actualizar métricas
      updateMetrics();

      // Dibujar cerebro 3D
      updateBrain(time);

      // Dibujar ondas
      drawWave(wave1Obj, time, 'rgba(0, 229, 200, 0.7)', 12, 0.4);
      drawWave(wave2Obj, time, 'rgba(255, 58, 92, 0.6)', 18, 0.3);

      // Renderizar Three.js
      if (brainRenderer && brainScene && brainCamera) {
        brainRenderer.render(brainScene, brainCamera);
      }

      animationId = requestAnimationFrame(animate);
    }

    let wave1Obj, wave2Obj;
    let metricsInterval;

    onMounted(() => {
      updateClock();
      setInterval(updateClock, 1000);

      wave1Obj = setupWaveCanvas('waveCanvas');
      wave2Obj = setupWaveCanvas('waveCanvas2');

      window.addEventListener('resize', () => {
        if (wave1Obj) {
          const d1 = wave1Obj.resize();
          wave1Obj.w = d1.w;
          wave1Obj.h = d1.h;
        }
        if (wave2Obj) {
          const d2 = wave2Obj.resize();
          wave2Obj.w = d2.w;
          wave2Obj.h = d2.h;
        }
      });

      requestAnimationFrame(() => {
        initThreeJS();
      });

      resizeObserver = new ResizeObserver(() => {
        onBrainResize();
      });

      const brainCanvas = document.getElementById('brainCanvas');
      if (brainCanvas && brainCanvas.parentElement) {
        resizeObserver.observe(brainCanvas.parentElement);
      }

      animationId = requestAnimationFrame(animate);
    });

    onUnmounted(() => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', onBrainResize);
      if (brainRenderer && brainRenderer.domElement) {
        brainRenderer.domElement.removeEventListener('pointerdown', handleBrainPointerDown);
      }
    });

    return {
      freq, alpha, beta, theta, delta,
      frontal, temporal, occipital,
      alphaBar, betaBar, thetaBar, deltaBar,
      frontalBar, temporalBar, occipitalBar,
      broca, prefrontal, limbic, brainstem, cerebellum,
      coordX, coordY, coordZ,
      tempCore, tempSurface,
      frameCount, timeDisplay, dateDisplay,
      selectedRegionName, selectedRegionShort, selectedRegionDesc, selectedRegionStats, selectedRegionColor
    };
  }
}).mount('#app');
