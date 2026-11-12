import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class Character3DManager {
  constructor(L, backdrop = null) {
    this.L = L;
    this.backdrop = backdrop;
    this.enabled = true;
    this.loaded = false;
    this.templates = {}; // { male: gltf, female: gltf }
    this.avatars = new Map(); // ch -> avatarData
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
  }

  async init(stageEl) {
    let canvas = document.getElementById('scene3d');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'scene3d';
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '2';
      const scene2d = document.getElementById('scene');
      if (scene2d && scene2d.parentNode) {
        scene2d.parentNode.insertBefore(canvas, scene2d.nextSibling);
      } else {
        stageEl.appendChild(canvas);
      }
    }
    this.canvas = canvas;
    canvas.width = this.L.W;
    canvas.height = this.L.H;

    // Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.L.W, this.L.H, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Scene
    this.scene = new THREE.Scene();

    // Orthographic Camera: 1 Three.js unit = 1 Canvas pixel
    // X goes 0 to L.W, Y goes 0 to -L.H
    this.camera = new THREE.OrthographicCamera(
      0, this.L.W,
      0, -this.L.H,
      0.1, 4000
    );
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(0, 0, 0);

    // Warm Festival Lights
    const ambient = new THREE.AmbientLight(0xfff6e8, 2.2);
    this.scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    moonLight.position.set(400, 600, 800);
    this.scene.add(moonLight);

    const fillLight = new THREE.DirectionalLight(0xffb86c, 1.4);
    fillLight.position.set(-300, -200, 600);
    this.scene.add(fillLight);

    // Load Models
    const loader = new GLTFLoader();
    const loadSafe = (url) => loader.loadAsync(url).catch((e) => {
      console.warn('Failed to load ' + url, e);
      return null;
    });

    try {
      const [femaleGltf, maleGltf, mandapaGltf, pagodaGltf] = await Promise.all([
        loadSafe('/models/amy.glb'),
        loadSafe('/models/aj.glb'),
        loadSafe('/models/mandapa_wat_khuha_phimuk_yala_thailand.glb'),
        loadSafe('/models/pagoda_thai.glb'),
      ]);

      if (femaleGltf && maleGltf) {
        this.templates.female = femaleGltf;
        this.templates.male = maleGltf;
        this.loaded = true;
      }

      const u = this.L.unit;
      const portrait = this.L.mode === 'portrait';
      const baseY = this.backdrop?.baseY || (this.L.landTop + (portrait ? 273 : 233) * u);

      // เรนเดอร์โมเดล 3D ฉากหลัง (เจดีย์ + มณฑปองค์พระ) ลงในเลเยอร์ฉากหลัง (modelsCanvas)
      // เพื่อให้อยู่หลังสนามหญ้า สายไฟ โคมไฟ และตัวละครอย่างสมส่วน ไม่ลอยทับวัตถุด้านหน้า
      if ((pagodaGltf || mandapaGltf) && this.backdrop?.modelsCanvas) {
        const bgScene = new THREE.Scene();

        const bgAmbient = new THREE.AmbientLight(0xffe8c8, 1.9);
        bgScene.add(bgAmbient);

        const bgKeyLight = new THREE.DirectionalLight(0xffdf9e, 2.4);
        bgKeyLight.position.set(350, 500, 750);
        bgScene.add(bgKeyLight);

        const bgFillLight = new THREE.DirectionalLight(0x9b7ede, 1.1);
        bgFillLight.position.set(-400, 200, 400);
        bgScene.add(bgFillLight);

        // 1. เจดีย์สีทอง 3D (วางฝั่งซ้ายของวัด ขนาดสมส่วน ไม่ชนการ์ดด้านบน)
        if (pagodaGltf) {
          const pagodaModel = pagodaGltf.scene;
          pagodaModel.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
            }
          });
          const pagodaPivot = this.fitModel(pagodaModel, (portrait ? 280 : 255) * u);
          const chediX = this.L.W * (portrait ? 0.14 : 0.13);
          pagodaPivot.position.set(chediX, -(baseY + 8 * u), -40);
          pagodaPivot.rotation.y = Math.PI * 0.12;
          bgScene.add(pagodaPivot);
        }

        // 2. มณฑปพระพุทธรูปวัดคูหาภิมุข 3D (วางถัดมาทางขวาของเจดีย์ ไม่ทับซ้อนกัน หันบันไดหน้าออกสู่แม่น้ำ)
        if (mandapaGltf) {
          const mandapaModel = mandapaGltf.scene;
          mandapaModel.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
            }
          });
          const mandapaPivot = this.fitModel(mandapaModel, (portrait ? 190 : 175) * u);
          const mandapaX = this.L.W * (portrait ? 0.30 : 0.27);
          mandapaPivot.position.set(mandapaX, -(baseY + 14 * u), 20);
          // หันด้านหน้ามณฑป (+X ของโมเดล) ออกมาทางผู้ชม (+Z)
          mandapaPivot.rotation.y = -Math.PI * 0.45;
          bgScene.add(mandapaPivot);

          const buddhaLight = new THREE.PointLight(0xffd875, 3.2, 500);
          buddhaLight.position.set(mandapaX, -(baseY - 95 * u), 140);
          bgScene.add(buddhaLight);
        }

        // เรนเดอร์ฉากหลัง 3D ลงบน modelsCanvas ครั้งเดียว แล้วล้าง WebGL canvas ให้พร้อมสำหรับตัวละคร
        this.renderer.render(bgScene, this.camera);
        const modelsCtx = this.backdrop.modelsCanvas.getContext('2d');
        modelsCtx.clearRect(0, 0, this.L.W, this.L.H);
        modelsCtx.drawImage(this.renderer.domElement, 0, 0, this.L.W, this.L.H);
        this.renderer.clear();
      }

      console.log('✅ 3D Models loaded (characters, mandapa, pagoda)');
    } catch (err) {
      console.warn('⚠️ 3D models load error, fallback to 2D:', err);
      this.loaded = false;
    }
  }

  fitModel(model, targetPixelHeight) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = targetPixelHeight / (size.y > 0 ? size.y : 1);
    model.scale.set(scale, scale, scale);

    model.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());

    const pivot = new THREE.Group();
    model.position.x = -center.x;
    model.position.z = -center.z;
    model.position.y = -scaledBox.min.y;
    pivot.add(model);
    return pivot;
  }

  resize(L) {
    this.L = L;
    if (this.canvas) {
      this.canvas.width = L.W;
      this.canvas.height = L.H;
    }
    if (this.renderer) {
      this.renderer.setSize(L.W, L.H, false);
    }
    if (this.camera) {
      this.camera.left = 0;
      this.camera.right = L.W;
      this.camera.top = 0;
      this.camera.bottom = -L.H;
      this.camera.updateProjectionMatrix();
    }
  }

  createAvatar(ch) {
    const gltf = ch.gender === 'female' ? this.templates.female : this.templates.male;
    if (!gltf) return null;

    // Clone model and skeleton cleanly
    const model = SkeletonUtils.clone(gltf.scene);
    model.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.frustumCulled = false;
        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = 0.45;
          child.material.metalness = 0.05;
        }
      }
    });

    // Scale calculation:
    // Model in GLB has root scale 0.01, so raw height is ~1.47m (Amy) and ~1.85m (AJ)
    // Target height on screen: ~235px (Amy) and ~260px (AJ)
    const u = this.L.unit;
    const targetPixelHeight = (ch.gender === 'female' ? 230 : 255) * u;
    const modelHeightInMeters = ch.gender === 'female' ? 1.47 : 1.85;
    const scaleFactor = targetPixelHeight / modelHeightInMeters; // ~140 - 160
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    model.rotation.y = Math.PI * 0.55;
    this.scene.add(model);

    // ค้นหากระดูกข้อมือ/ฝ่ามือของโมเดลเพื่อติดตามตำแหน่งกระทงแบบเรียลไทม์
    let rightHand = null;
    let leftHand = null;
    model.traverse((child) => {
      if (child.name === 'mixamorigRightHand') rightHand = child;
      if (child.name === 'mixamorigLeftHand') leftHand = child;
    });

    // Setup animations
    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    if (gltf.animations) {
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
      });
    }

    const avatar = {
      model,
      mixer,
      actions,
      rightHand,
      leftHand,
      currentAction: null,
      currentClipName: null,
      gender: ch.gender,
      targetRotationY: Math.PI * 0.55,
    };

    // Initial animation
    this.playAnim(avatar, 'Walking_Krathong', 0.1, true);
    return avatar;
  }

  playAnim(avatar, clipName, fadeTime = 0.2, loop = true) {
    const nextAction = avatar.actions[clipName];
    if (!nextAction) return;

    if (avatar.currentClipName === clipName) return;

    if (loop) {
      nextAction.setLoop(THREE.LoopRepeat);
      nextAction.clampWhenFinished = false;
    } else {
      nextAction.setLoop(THREE.LoopOnce);
      nextAction.clampWhenFinished = true;
    }

    if (avatar.currentAction && avatar.currentAction !== nextAction) {
      avatar.currentAction.fadeOut(fadeTime);
    }

    nextAction.reset().fadeIn(fadeTime).play();
    avatar.currentAction = nextAction;
    avatar.currentClipName = clipName;
  }

  update(characters, dt) {
    if (!this.loaded || !this.enabled) {
      if (this.renderer && this.canvas) {
        this.renderer.clear();
      }
      return;
    }

    const currentChSet = new Set(characters);

    // Remove finished avatars
    for (const [ch, avatar] of this.avatars.entries()) {
      if (!currentChSet.has(ch) || ch.done) {
        this.scene.remove(avatar.model);
        avatar.mixer.stopAllAction();
        this.avatars.delete(ch);
      }
    }

    // Sync active characters
    for (const ch of characters) {
      if (ch.done) continue;

      let avatar = this.avatars.get(ch);
      if (!avatar) {
        avatar = this.createAvatar(ch);
        if (avatar) this.avatars.set(ch, avatar);
      }
      if (!avatar) continue;

      // Position in Three.js coordinates
      avatar.model.position.x = ch.x;
      avatar.model.position.y = -ch.y;
      avatar.model.position.z = 100;

      // Update Animation State
      // 0: WALK_IN, 1: BOW, 2: PRAY, 3: WALK_OUT, 4: DONE
      if (ch.state === 0) {
        // WALK_IN: เดินถือกระทงเข้ามา หันหน้าไปทางขวาตามทิศทางเดิน
        avatar.targetRotationY = Math.PI * 0.55;
        this.playAnim(avatar, 'Walking_Krathong', 0.2, true);
      } else if (ch.state === 1) {
        // BOW: ย่อตัวลงวางกระทง หันตรงมาทางแม่น้ำ/ผู้ชม
        avatar.targetRotationY = 0;
        if (ch.timer < 1.3) {
          this.playAnim(avatar, 'Kneeling_Down', 0.2, false);
        } else {
          this.playAnim(avatar, 'Kneeling_Idle', 0.2, true);
        }
      } else if (ch.state === 2) {
        // PRAY: พนมมือไหว้ขอขมา หันตรงมาทางแม่น้ำ/ผู้ชม
        avatar.targetRotationY = 0;
        this.playAnim(avatar, 'Praying', 0.25, true);
      } else if (ch.state === 3) {
        // WALK_OUT: เดินต่อไปข้างหน้าข้ามสะพานออกทางขวา หันหน้าไปทางขวา
        avatar.targetRotationY = Math.PI * 0.55;
        this.playAnim(avatar, 'Walking_Empty', 0.2, true);
      }

      // Smooth rotation
      let diff = avatar.targetRotationY - avatar.model.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      avatar.model.rotation.y += diff * Math.min(1, dt * 10);

      // อัปเดตอนิเมชันก่อนเพื่อดึงตำแหน่งกระดูกมือในเฟรมปัจจุบัน
      avatar.mixer.update(dt);
      avatar.model.updateMatrixWorld(true);

      const u = this.L.unit;
      const isKneeling = ch.state === 1;

      // ติดตามตำแหน่งฝ่ามือ 3D จริง เพื่อให้กระทงขยับขึ้นลงตามจังหวะเดินและนั่งอย่างเป็นธรรมชาติ
      if (avatar.rightHand && avatar.leftHand) {
        const rPos = new THREE.Vector3();
        const lPos = new THREE.Vector3();
        avatar.rightHand.getWorldPosition(rPos);
        avatar.leftHand.getWorldPosition(lPos);
        const mid = rPos.clone().add(lPos).multiplyScalar(0.5);

        if (isKneeling) {
          // ตอนนั่งคุกเข่าหันหน้าตรง กระทงอยู่ด้านหน้าลำตัว/ตักเหนือผิวน้ำ
          ch.customHandPos = {
            x: ch.x,
            y: -mid.y + 10 * u,
          };
        } else {
          // ตอนเดินหันขวา กระทงยื่นไปข้างหน้าตามทิศเดิน
          const forwardOffset = 18 * u;
          ch.customHandPos = {
            x: mid.x + forwardOffset,
            y: -mid.y - 6 * u,
          };
        }
      } else {
        const handYOffset = isKneeling ? 50 * u : 138 * u;
        const handXOffset = isKneeling ? 0 : 44 * u;
        ch.customHandPos = {
          x: ch.x + handXOffset,
          y: ch.y - handYOffset,
        };
      }
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}
