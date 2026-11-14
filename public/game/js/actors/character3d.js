import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { updateCameraRig, applyActivityPose } from '../modes/camera-rig.js';

export class Character3DManager {
  constructor(L, backdrop = null) {
    this.L = L;
    this.backdrop = backdrop;
    this.enabled = true;
    this.loaded = false;
    this.templates = {}; // { male: gltf, female: gltf }
    this.poolTemplates = []; // array of gltf for diverse characters in the scene
    this.poolIndex = 0;
    this.shuffleBag = [];
    this.lastPoppedModel = null;
    this.modelCache = new Map(); // url -> gltf
    this.avatars = new Map(); // ch -> avatarData
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
    this.loader = new GLTFLoader();
    this.characterScale = 1.0;
    this.sceneCfg = {
      characterPool: ['/models/amy.glb', '/models/aj.glb', '/models/kate.glb'],
      femaleModel: '/models/amy.glb',
      maleModel: '/models/aj.glb',
      leftPropModel: '/models/pagoda_thai.glb',
      rightPropModel: '/models/mandapa_wat_khuha_phimuk_yala_thailand.glb',
      showProps: true,
      characterScale: 1.0,
    };
  }

  async loadModelCached(url, bustCache = false) {
    if (!url || url === 'none') return null;
    if (!bustCache && this.modelCache.has(url)) return this.modelCache.get(url);
    try {
      const fetchUrl = bustCache ? `${url}?t=${Date.now()}` : url;
      const gltf = await this.loader.loadAsync(fetchUrl);
      // วัดความสูงโมเดลธรรมชาติ
      gltf.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const h = box.getSize(new THREE.Vector3()).y;

      // ตรวจสอบทิศทางหันหน้าตามแกน Z ของโมเดลเพื่อปรับแก้โมเดลที่แกนกลับด้าน 180 องศา
      // (ตรวจสอบบน testModel โคลนเฉพาะกิจ ไม่กระทบ gltf.scene ต้นฉบับ และตรวจทิศทางมือที่ยื่นไปข้างหน้า)
      let yawOffset = 0;
      const orientClip =
        gltf.animations?.find((a) => a.name === 'Walking_Krathong') ||
        gltf.animations?.find((a) => a.name === 'Praying') ||
        gltf.animations?.[0];
      if (orientClip) {
        const testModel = SkeletonUtils.clone(gltf.scene);
        const mixer = new THREE.AnimationMixer(testModel);
        mixer.clipAction(orientClip).play();
        mixer.update(0.2);
        testModel.updateMatrixWorld(true);
        let spine = null;
        const hands = [];
        testModel.traverse((c) => {
          if (/spine|chest|hips/i.test(c.name) && !spine) spine = c;
          if (/hand/i.test(c.name)) hands.push(c);
        });
        if (spine && hands.length > 0) {
          const sp = new THREE.Vector3();
          spine.getWorldPosition(sp);
          let avgZ = 0;
          for (const h of hands) {
            const hp = new THREE.Vector3();
            h.getWorldPosition(hp);
            avgZ += hp.z - sp.z;
          }
          avgZ /= hands.length;
          // ทิศมาตรฐานของโมเดล Mixamo/VRM: มือจะยื่นไปข้างหน้าในแกน +Z (avgZ > 0)
          // หากมีโมเดลใดที่แกนกลับด้าน 180 องศา (avgZ < -0.05) จะหมุนแก้ด้วย Math.PI
          if (avgZ < -0.05) {
            yawOffset = Math.PI;
          }
        }
      }

      gltf.userData = {
        rawHeight: h > 0.1 && h < 10 ? h : 1.55,
        yawOffset,
      };
      this.modelCache.set(url, gltf);
      return gltf;
    } catch (e) {
      console.warn('Failed to load ' + url, e);
      return null;
    }
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

    try {
      await this.applySceneConfig(this.sceneCfg, false);
      console.log('✅ 3D Models loaded (characters, mandapa, pagoda)');
    } catch (err) {
      console.warn('⚠️ 3D models load error, fallback to 2D:', err);
      this.loaded = false;
    }
  }

  async applySceneConfig(cfg = {}, bustCache = false) {
    this.sceneCfg = { ...this.sceneCfg, ...cfg };
    this.characterScale = Number(this.sceneCfg.characterScale) || 1.0;

    const poolUrls = Array.isArray(this.sceneCfg.characterPool) && this.sceneCfg.characterPool.length
      ? this.sceneCfg.characterPool
      : [this.sceneCfg.femaleModel || '/models/amy.glb', this.sceneCfg.maleModel || '/models/aj.glb'];

    const [loadedPool, rightGltf, leftGltf] = await Promise.all([
      Promise.all(poolUrls.map((u) => this.loadModelCached(u, bustCache))),
      this.sceneCfg.showProps !== false ? this.loadModelCached(this.sceneCfg.rightPropModel, bustCache) : Promise.resolve(null),
      this.sceneCfg.showProps !== false ? this.loadModelCached(this.sceneCfg.leftPropModel, bustCache) : Promise.resolve(null),
    ]);

    const validPool = loadedPool.filter(Boolean);
    if (validPool.length > 0) {
      this.poolTemplates = validPool;
      this.shuffleBag = [];
      this.lastPoppedModel = null;
      this.templates.female = validPool[0];
      this.templates.male = validPool[1] || validPool[0];
      this.loaded = true;
    }

    this.renderBackdropProps(leftGltf, rightGltf);
  }

  renderBackdropProps(pagodaGltf, mandapaGltf) {
    if (!this.backdrop?.modelsCanvas || !this.renderer || !this.camera) return;
    const modelsCtx = this.backdrop.modelsCanvas.getContext('2d');
    modelsCtx.clearRect(0, 0, this.L.W, this.L.H);

    if (!pagodaGltf && !mandapaGltf) return;

    const u = this.L.unit;
    const portrait = this.L.mode === 'portrait';
    const baseY = this.backdrop?.baseY || (this.L.landTop + (portrait ? 273 : 233) * u);

    const bgScene = new THREE.Scene();

    const bgAmbient = new THREE.AmbientLight(0xffe8c8, 1.9);
    bgScene.add(bgAmbient);

    const bgKeyLight = new THREE.DirectionalLight(0xffdf9e, 2.4);
    bgKeyLight.position.set(350, 500, 750);
    bgScene.add(bgKeyLight);

    const bgFillLight = new THREE.DirectionalLight(0x9b7ede, 1.1);
    bgFillLight.position.set(-400, 200, 400);
    bgScene.add(bgFillLight);

    if (pagodaGltf) {
      const pagodaModel = pagodaGltf.scene.clone(true);
      pagodaModel.traverse((child) => {
        if (child.isMesh) child.frustumCulled = false;
      });
      const pagodaPivot = this.fitModel(pagodaModel, (portrait ? 280 : 255) * u);
      const chediX = this.L.W * (portrait ? 0.14 : 0.13);
      pagodaPivot.position.set(chediX, -(baseY + 8 * u), -40);
      pagodaPivot.rotation.y = Math.PI * 0.12;
      bgScene.add(pagodaPivot);
    }

    if (mandapaGltf) {
      const mandapaModel = mandapaGltf.scene.clone(true);
      mandapaModel.traverse((child) => {
        if (child.isMesh) child.frustumCulled = false;
      });
      const mandapaPivot = this.fitModel(mandapaModel, (portrait ? 190 : 175) * u);
      const mandapaX = this.L.W * (portrait ? 0.30 : 0.27);
      mandapaPivot.position.set(mandapaX, -(baseY + 14 * u), 20);
      mandapaPivot.rotation.y = -Math.PI * 0.45;
      bgScene.add(mandapaPivot);

      const buddhaLight = new THREE.PointLight(0xffd875, 3.2, 500);
      buddhaLight.position.set(mandapaX, -(baseY - 95 * u), 140);
      bgScene.add(buddhaLight);
    }

    // เรนเดอร์ฉากหลังด้วยกล้องค่ามาตรฐาน (ไม่ซูม/ไม่เลื่อน) แล้วคืนค่ากล้องเดิม
    const savedPos = this.camera.position.clone();
    const savedZoom = this.camera.zoom;
    this.camera.position.set(0, 0, 1000);
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.renderer.render(bgScene, this.camera);
    this.camera.position.copy(savedPos);
    this.camera.zoom = savedZoom;
    this.camera.updateProjectionMatrix();
    modelsCtx.drawImage(this.renderer.domElement, 0, 0, this.L.W, this.L.H);
    this.renderer.clear();
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
    let gltf = null;
    if (ch.job?.modelUrl) {
      if (this.modelCache.has(ch.job.modelUrl)) {
        gltf = this.modelCache.get(ch.job.modelUrl);
      } else {
        this.loadModelCached(ch.job.modelUrl);
      }
    }
    if (!gltf && this.poolTemplates.length > 0) {
      if (!this.shuffleBag || this.shuffleBag.length === 0) {
        // สุ่มสับไพ่โมเดลใหม่ทั้งหมด (Fisher-Yates Shuffle) เพื่อให้ทุกตัวในคลังมีโอกาสเดินออกสลับกันครบถ้วน
        this.shuffleBag = [...this.poolTemplates];
        for (let i = this.shuffleBag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.shuffleBag[i], this.shuffleBag[j]] = [this.shuffleBag[j], this.shuffleBag[i]];
        }
        // เลี่ยงการสุ่มได้โมเดลซ้ำกับตัวล่าสุดทันทีเมื่อมีโมเดลมากกว่า 1 ตัว
        if (this.shuffleBag.length > 1 && this.shuffleBag[this.shuffleBag.length - 1] === this.lastPoppedModel) {
          const swapIdx = Math.floor(Math.random() * (this.shuffleBag.length - 1));
          [this.shuffleBag[this.shuffleBag.length - 1], this.shuffleBag[swapIdx]] = [this.shuffleBag[swapIdx], this.shuffleBag[this.shuffleBag.length - 1]];
        }
      }
      gltf = this.shuffleBag.pop();
      this.lastPoppedModel = gltf;
    }
    if (!gltf) {
      gltf = ch.gender === 'female' ? this.templates.female : this.templates.male;
    }
    if (!gltf) return null;

    // Clone model and skeleton cleanly
    const model = SkeletonUtils.clone(gltf.scene);
    model.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.frustumCulled = false;
        if (child.material) {
          child.material = Array.isArray(child.material)
            ? child.material.map((m) => m.clone())
            : child.material.clone();
          if (!Array.isArray(child.material)) {
            if ('roughness' in child.material) child.material.roughness = 0.45;
            if ('metalness' in child.material) child.material.metalness = 0.05;
          }
        }
      }
    });

    const u = this.L.unit;
    const targetPixelHeight = (ch.gender === 'female' ? 235 : 255) * u * (this.characterScale || 1.0);
    const modelHeightInMeters = gltf.userData?.rawHeight || (ch.gender === 'female' ? 1.47 : 1.85);
    const scaleFactor = targetPixelHeight / modelHeightInMeters;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    model.rotation.y = Math.PI * 0.55;
    this.scene.add(model);

    // ค้นหากระดูกข้อมือ/ฝ่ามือ และกระดูกศีรษะ (รองรับทั้ง Mixamo และ VRoid/VRM)
    let rightHand = null;
    let leftHand = null;
    let head = null;
    model.traverse((child) => {
      const n = child.name || '';
      if (n === 'mixamorigRightHand' || n === 'J_Bip_R_Hand') rightHand = child;
      if (n === 'mixamorigLeftHand' || n === 'J_Bip_L_Hand') leftHand = child;
      if (n === 'mixamorigHead' || n === 'J_Bip_C_Head' || n === 'Head' || n.toLowerCase().includes('head')) head = child;
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
      head,
      baseScale: scaleFactor,
      currentAction: null,
      currentClipName: null,
      gender: ch.gender,
      targetRotationY: Math.PI * 0.55,
      yawOffset: gltf.userData?.yawOffset || 0,
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

  update(characters, dt, t = 0) {
    if (!this.loaded || !this.enabled) {
      if (this.renderer && this.canvas) {
        this.renderer.clear();
      }
      return;
    }

    updateCameraRig(this.camera, this.L, this.sceneCfg, t);

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

      const u = this.L.unit;

      // อัปเดตตำแหน่ง ท่าทาง และการเต้น/ไหว้ตามโหมดกิจกรรมและมุมกล้อง
      applyActivityPose(
        avatar,
        ch,
        this.sceneCfg,
        (av, clip, fade, loop) => this.playAnim(av, clip, fade, loop),
        t,
        dt,
        u
      );

      // Smooth rotation with unified model orientation
      const desiredY = avatar.targetRotationY + (avatar.yawOffset || 0);
      let diff = desiredY - avatar.model.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      avatar.model.rotation.y += diff * Math.min(1, dt * 10);

      // อัปเดตอนิเมชันก่อนเพื่อดึงตำแหน่งกระดูกมือในเฟรมปัจจุบัน
      avatar.mixer.update(dt);
      avatar.model.updateMatrixWorld(true);

      const isKneeling = ch.state === 1;

      // ติดตามตำแหน่งฝ่ามือ 3D จริง เพื่อให้กระทง/ถ้วยเทียนวางอยู่บนฝ่ามือพอดีเป๊ะ
      if (avatar.rightHand && avatar.leftHand) {
        const rPos = new THREE.Vector3();
        const lPos = new THREE.Vector3();
        avatar.rightHand.getWorldPosition(rPos);
        avatar.leftHand.getWorldPosition(lPos);
        const mid = rPos.clone().add(lPos).multiplyScalar(0.5);

        // วางกึ่งกลางถ้วยเทียนให้อยู่บนฝ่ามือพอดีเป๊ะ
        // -mid.y คือพิกัด Y บน Canvas ของฝ่ามือ
        // ปรับ -2 * u ให้ก้นฐานถ้วยเทียน/กระทงสัมผัสกับฝ่ามือทั้งสองข้างอย่างแนบสนิท
        ch.customHandPos = {
          x: mid.x,
          y: -mid.y - 2 * u,
        };
      } else {
        const isFacingFront = isKneeling || ch.state === 2 || ch.walkingUp;
        const handYOffset = isFacingFront ? 60 * u : 105 * u;
        const handXOffset = isFacingFront ? 0 : 20 * u * (ch.dir || 1);
        ch.customHandPos = {
          x: ch.x + handXOffset,
          y: ch.y - handYOffset,
        };
      }

      // ติดตามตำแหน่งศีรษะ (Head Bone) เพื่อให้ป้ายชื่ออยู่ใกล้ชิดเหนือหัวตัวละครพอดี (ทั้งตอนยืนและคุกเข่า)
      let headBone = avatar.head;
      if (!headBone) {
        avatar.model.traverse((child) => {
          const n = child.name || '';
          if (n === 'mixamorigHead' || n === 'J_Bip_C_Head' || n === 'Head' || n.toLowerCase().includes('head')) headBone = child;
        });
        avatar.head = headBone;
      }

      if (headBone) {
        const headPos = new THREE.Vector3();
        headBone.getWorldPosition(headPos);
        // ใน Three.js OrthographicCamera: canvasY = -headPos.y
        // -28 * u วางกึ่งกลางป้ายชื่อเหนือกระดูกศีรษะให้พอดีกับทรงผม/หูแมว
        ch.customHeadY = -headPos.y - 28 * u;
      } else {
        const isKneelingState = ch.state === 1 || ch.state === 2;
        const h = (isKneelingState ? 135 : 220) * u * (this.characterScale || 1.0);
        ch.customHeadY = ch.y - (h + 20 * u);
      }
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}
