/**
 * ระบบควบคุมมุมกล้อง 3D (Camera Rig) และท่าเต้น/ท่าทางตามโหมดกิจกรรม
 * แยกออกมาเป็นโมดูลอิสระเพื่อให้ดูแลโค้ดง่าย
 */

const DEG2RAD = Math.PI / 180;

export function getCameraAngles(sceneCfg = {}, t = 0) {
  const preset = sceneCfg.cameraPreset || 'front';
  let baseYaw = 0;
  let baseTilt = 0;
  let baseZoom = 1;

  if (preset === 'iso-left') {
    baseYaw = -24;
    baseTilt = 8;
    baseZoom = 1.04;
  } else if (preset === 'iso-right') {
    baseYaw = 24;
    baseTilt = 8;
    baseZoom = 1.04;
  } else if (preset === 'high-stage') {
    baseYaw = 0;
    baseTilt = 16;
    baseZoom = 1.08;
  } else if (preset === 'cinema-orbit') {
    baseYaw = Math.sin(t * 0.45) * 22;
    baseTilt = 6 + Math.cos(t * 0.3) * 4;
    baseZoom = 1.05;
  }

  const yawDeg = baseYaw + (Number(sceneCfg.cameraYaw) || 0);
  const tiltDeg = baseTilt + (Number(sceneCfg.cameraTilt) || 0);
  const zoom = Math.max(0.65, Math.min(1.5, baseZoom * (Number(sceneCfg.cameraZoom) || 1)));

  return {
    yawRad: yawDeg * DEG2RAD,
    tiltRad: tiltDeg * DEG2RAD,
    zoom,
  };
}

/**
 * ปรับมุมกล้อง Three.js OrthographicCamera ให้ซูมและเอียงตามมุมที่ตั้งไว้จากหน้า Admin
 */
export function updateCameraRig(camera, L, sceneCfg = {}, t = 0) {
  if (!camera) return { yawRad: 0, tiltRad: 0, zoom: 1 };
  const { yawRad, tiltRad, zoom } = getCameraAngles(sceneCfg, t);

  // กรอบภาพของกล้อง (left=0, top=0, bottom=-H) วัดจากตำแหน่งกล้อง ดังนั้นตำแหน่งปกติคือ (0,0)
  // ซูมจะขยายรอบ "กึ่งกลางกรอบภาพ" จึงต้องเลื่อนกล้องให้กึ่งกลางกรอบตรงกับเส้นพื้นที่ตัวละครยืน
  // เพื่อให้เท้าตัวละครติดพื้นฉาก 2D เสมอไม่ว่าจะซูมเท่าไร
  const centerY = L.walkY - (L.walkY - L.H * 0.5) / zoom; // จุดกึ่งกลางกล้อง (พิกัด canvas) ที่ทำให้เส้นพื้นอยู่ที่เดิมหลังซูม
  const shiftY = L.H * 0.5 - centerY; // ที่ zoom = 1 จะได้ 0 พอดี
  // yaw/tilt ทำเป็น parallax เล็กน้อยเพื่อไม่ให้ตัวละครหลุดจากพื้นฉาก 2D
  const parallaxX = Math.sin(yawRad) * 70 * L.unit;
  const parallaxY = Math.sin(tiltRad) * 18 * L.unit;

  camera.position.set(parallaxX, shiftY + parallaxY, 1000);
  camera.rotation.set(0, 0, 0);

  if (Math.abs(camera.zoom - zoom) > 0.001) {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }

  return { yawRad, tiltRad, zoom };
}

/**
 * คำนวณมุมหันของตัวละครและจังหวะเต้น/ไหว้พระตามโหมดกิจกรรมและทิศทางการเดิน
 */
export function applyActivityPose(avatar, ch, sceneCfg, playAnimFn, t, dt, u) {
  const mode = sceneCfg.activityMode || 'loy-krathong';
  const dirMode = sceneCfg.walkDirection || 'left-to-right';
  const { yawRad } = getCameraAngles(sceneCfg, t);
  const danceSpeed = Number(sceneCfg.danceSpeed) || 1;
  const tier = Math.min(4, Math.max(0, ch.job?.tier || 0));

  // มุมหันขณะเดินเข้าและเดินออกตามทิศทาง
  const walkInAngle =
    dirMode === 'right-to-left'
      ? -Math.PI * 0.55
      : dirMode === 'back-to-front'
      ? 0
      : ch.vx < 0
      ? -Math.PI * 0.55
      : Math.PI * 0.55;

  const walkOutAngle =
    dirMode === 'right-to-left'
      ? -Math.PI * 0.55
      : ch.exitDir < 0
      ? -Math.PI * 0.55
      : Math.PI * 0.55;

  // รีเซ็ตออฟเซ็ตการเต้นเริ่มต้น
  let bounceY = 0;
  let swayX = 0;
  let bodyRollZ = 0;

  if (ch.state === 0) {
    // WALK_IN
    if (mode === 'temple-blessing') {
      if (ch.walkingUp || ch.isWaitingInQueue) {
        // เลี้ยว 90 องศาเดินขึ้นหน้าตรงหรือยืนต่อแถวมุ่งสู่จุดไหว้: หันหน้าขึ้นไปยังเบาะและโต๊ะหมู่บูชา
        avatar.targetRotationY = Math.PI - yawRad * 0.4;
      } else {
        // เดินในแนวนอนตามเลนสีทองถือถ้วยเทียน: หันหน้าไปทางขวาตามแนวเดิน
        avatar.targetRotationY = Math.PI * 0.55 + yawRad * 0.4;
      }
      playAnimFn(avatar, 'Walking_Krathong', 0.2, true);
    } else {
      avatar.targetRotationY = walkInAngle + yawRad * 0.5;
      const walkClip = mode === 'party-dance' && avatar.actions['Walking_Empty'] ? 'Walking_Empty' : 'Walking_Krathong';
      playAnimFn(avatar, walkClip, 0.2, true);
    }
  } else if (ch.state === 3) {
    // WALK_OUT: เดินต่อไปข้างหน้าข้ามสะพาน/ลานวัดออกทางขวา หันหน้าไปทางขวา
    avatar.targetRotationY = Math.PI * 0.55 + yawRad * 0.5;
    playAnimFn(avatar, 'Walking_Empty', 0.2, true);
  } else if (mode === 'party-dance') {
    // โหมดปาร์ตี้เต้นสนุกสนาน (เมื่อตัวละครยืนประจำจุด state 1 และ 2)
    const beat = t * 6.5 * danceSpeed + (ch.slot || 0) * 1.1;

    // ตรวจสอบว่าโมเดลมีคลิปท่าเต้นเฉพาะหรือไม่ ถ้าไม่มีใช้ท่า Standing/Praying ผสมจังหวะเต้น 3D
    const customDanceClip = Object.keys(avatar.actions).find((k) =>
      /dance|hiphop|samba|party|cheer/i.test(k)
    );
    if (customDanceClip) {
      playAnimFn(avatar, customDanceClip, 0.2, true);
    } else {
      // สลับจังหวะท่าทางตามบีทเพลงให้ดูมีชีวิตชีวา
      const phase = Math.floor((t * 0.8 * danceSpeed + (ch.slot || 0)) % 3);
      if (phase === 0 && avatar.actions['Standing']) {
        playAnimFn(avatar, 'Standing', 0.35, true);
      } else if (phase === 1 && avatar.actions['Walking_Empty']) {
        playAnimFn(avatar, 'Walking_Empty', 0.35, true);
      } else if (avatar.actions['Praying']) {
        playAnimFn(avatar, 'Praying', 0.35, true);
      }
    }

    // ยิ่งส่งของขวัญระดับสูง จังหวะเต้นและหมุนตัวสนุกยิ่งขึ้น
    const energy = 1 + tier * 0.28;
    bounceY = Math.abs(Math.sin(beat)) * 18 * energy * u;
    swayX = Math.sin(beat * 0.5) * 16 * energy * u;
    bodyRollZ = Math.sin(beat * 0.5) * 0.09 * energy;

    // หมุนตัวโชว์สเต็ปแดนซ์เมื่อได้ของขวัญระดับสูง
    if (tier >= 3 && ch.state === 2) {
      avatar.targetRotationY = yawRad + Math.sin(beat * 0.5) * 0.9;
    } else {
      avatar.targetRotationY = yawRad + Math.sin(beat * 0.5) * 0.45;
    }
  } else if (mode === 'temple-blessing') {
    // โหมดไหว้พระขอพร: นั่งคุกเข่าพนมมือไหว้องค์พระที่โต๊ะหมู่บูชาอย่างสำรวม (หันไปทางโต๊ะหมู่บูชาด้านบนต่อเนื่องจากการเดิน ไม่หมุนตัวกลับหลัง)
    avatar.targetRotationY = Math.PI - yawRad * 0.4;
    if (ch.state === 1 && ch.timer < 1.2) {
      playAnimFn(avatar, 'Kneeling_Down', 0.2, false);
    } else {
      playAnimFn(avatar, 'Praying', 0.25, true);
    }
  } else {
    // โหมดลอยกระทงมาตรฐาน
    avatar.targetRotationY = yawRad * 0.7;
    if (ch.state === 1) {
      if (ch.timer < 1.3) {
        playAnimFn(avatar, 'Kneeling_Down', 0.2, false);
      } else {
        playAnimFn(avatar, 'Kneeling_Idle', 0.2, true);
      }
    } else if (ch.state === 2) {
      playAnimFn(avatar, 'Praying', 0.25, true);
    }
  }

  // applying position & rhythmic dance offsets
  const depthScale = ch.depthScale || 1;
  avatar.model.position.x = ch.x + swayX;
  avatar.model.position.y = -ch.y + bounceY;
  avatar.model.position.z = 100 + (ch.y * 0.12) + (ch.zOffset || 0);
  avatar.model.rotation.z = bodyRollZ;

  if (avatar.baseScale) {
    const s = avatar.baseScale * depthScale;
    avatar.model.scale.set(s, s, s);
  }
}

