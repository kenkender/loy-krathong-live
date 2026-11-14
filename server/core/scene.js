import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { logger } from './logger.js';

const SCENE_FILE = path.join(config.root, 'config', 'scene.json');
const MODELS_DIR = path.join(config.publicDir, 'models');

export const ALLOWED_MODES = ['loy-krathong', 'temple-blessing', 'party-dance'];
export const ALLOWED_THEMES = ['loy-krathong', 'temple-fair', 'sakura-anime', 'cyber-festival'];
export const ALLOWED_DIRECTIONS = ['left-to-right', 'right-to-left', 'back-to-front', 'center-spread'];
export const ALLOWED_CAMERAS = ['front', 'iso-left', 'iso-right', 'high-stage', 'cinema-orbit'];

const DEFAULT_SCENE = {
  activityMode: 'loy-krathong',
  theme: 'loy-krathong',
  badgeText: 'ประเพณีลอยกระทง',
  title: 'ลอยกระทง Live',
  subtitle: 'ร่วมลอยกระทงด้วยกัน ทุกใบคือความตั้งใจดี',
  walkDirection: 'left-to-right',
  cameraPreset: 'front',
  cameraYaw: 0,
  cameraTilt: 0,
  cameraZoom: 1,
  danceSpeed: 1,
  characterPool: ['/models/vroid.glb', '/models/aora.glb', '/models/amy.glb', '/models/aj.glb', '/models/kate.glb'],
  femaleModel: '/models/vroid.glb',
  maleModel: '/models/aora.glb',
  leftPropModel: '/models/pagoda_thai.glb',
  rightPropModel: '/models/mandapa_wat_khuha_phimuk_yala_thailand.glb',
  showProps: true,
  showFerrisWheel: true,
  showLanterns: true,
  showNPCs: true,
  characterScale: 0.9,
};

let currentScene = { ...DEFAULT_SCENE };

export function loadSceneConfig() {
  try {
    if (fs.existsSync(SCENE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SCENE_FILE, 'utf8'));
      currentScene = { ...DEFAULT_SCENE, ...raw };
      if (!Array.isArray(currentScene.characterPool) || currentScene.characterPool.length === 0) {
        currentScene.characterPool = [...DEFAULT_SCENE.characterPool];
      }
    }
  } catch (e) {
    logger.warn('scene', 'โหลด config/scene.json ไม่สำเร็จ ใช้ค่าเริ่มต้น', { error: e.message });
  }
  return currentScene;
}

export function getSceneConfig() {
  return currentScene;
}

const clampNum = (val, min, max, fallback) => {
  const n = Number(val);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export function updateSceneConfig(patch = {}) {
  if (patch.activityMode && ALLOWED_MODES.includes(patch.activityMode)) {
    currentScene.activityMode = patch.activityMode;
  }
  if (patch.theme && ALLOWED_THEMES.includes(patch.theme)) {
    currentScene.theme = patch.theme;
  }
  if (patch.walkDirection && ALLOWED_DIRECTIONS.includes(patch.walkDirection)) {
    currentScene.walkDirection = patch.walkDirection;
  }
  if (patch.cameraPreset && ALLOWED_CAMERAS.includes(patch.cameraPreset)) {
    currentScene.cameraPreset = patch.cameraPreset;
  }
  if (patch.cameraYaw !== undefined) {
    currentScene.cameraYaw = clampNum(patch.cameraYaw, -45, 45, currentScene.cameraYaw);
  }
  if (patch.cameraTilt !== undefined) {
    currentScene.cameraTilt = clampNum(patch.cameraTilt, -25, 25, currentScene.cameraTilt);
  }
  if (patch.cameraZoom !== undefined) {
    currentScene.cameraZoom = clampNum(patch.cameraZoom, 0.65, 1.45, currentScene.cameraZoom);
  }
  if (patch.danceSpeed !== undefined) {
    currentScene.danceSpeed = clampNum(patch.danceSpeed, 0.5, 2.5, currentScene.danceSpeed);
  }

  if (typeof patch.badgeText === 'string') currentScene.badgeText = patch.badgeText.slice(0, 60);
  if (typeof patch.title === 'string') currentScene.title = patch.title.slice(0, 80);
  if (typeof patch.subtitle === 'string') currentScene.subtitle = patch.subtitle.slice(0, 120);

  if (Array.isArray(patch.characterPool)) {
    const cleanPool = patch.characterPool.filter((u) => typeof u === 'string' && u.startsWith('/models/'));
    if (cleanPool.length > 0) currentScene.characterPool = [...new Set(cleanPool)];
  }
  if (typeof patch.addCharacterUrl === 'string' && patch.addCharacterUrl.startsWith('/models/')) {
    if (!currentScene.characterPool.includes(patch.addCharacterUrl)) {
      currentScene.characterPool = [...currentScene.characterPool, patch.addCharacterUrl];
    }
  }
  if (typeof patch.femaleModel === 'string') currentScene.femaleModel = patch.femaleModel;
  if (typeof patch.maleModel === 'string') currentScene.maleModel = patch.maleModel;
  if (typeof patch.leftPropModel === 'string') currentScene.leftPropModel = patch.leftPropModel;
  if (typeof patch.rightPropModel === 'string') currentScene.rightPropModel = patch.rightPropModel;
  if (typeof patch.showProps === 'boolean') currentScene.showProps = patch.showProps;
  if (typeof patch.showFerrisWheel === 'boolean') currentScene.showFerrisWheel = patch.showFerrisWheel;
  if (typeof patch.showLanterns === 'boolean') currentScene.showLanterns = patch.showLanterns;
  if (typeof patch.showNPCs === 'boolean') currentScene.showNPCs = patch.showNPCs;
  if (patch.characterScale !== undefined) {
    currentScene.characterScale = clampNum(patch.characterScale, 0.4, 2.5, currentScene.characterScale);
  }

  try {
    fs.writeFileSync(SCENE_FILE, JSON.stringify(currentScene, null, 2), 'utf8');
  } catch (e) {
    logger.error('scene', 'บันทึก config/scene.json ไม่สำเร็จ', { error: e.message });
  }
  return currentScene;
}

export function listAvailableModels() {
  try {
    if (!fs.existsSync(MODELS_DIR)) return [];
    return fs
      .readdirSync(MODELS_DIR)
      .filter((f) => f.toLowerCase().endsWith('.glb'))
      .map((f) => {
        const stat = fs.statSync(path.join(MODELS_DIR, f));
        return {
          name: f,
          url: `/models/${f}`,
          sizeMB: +(stat.size / (1024 * 1024)).toFixed(2),
          updatedAt: stat.mtime.toISOString(),
        };
      });
  } catch (e) {
    logger.warn('scene', 'อ่านรายการโมเดลไม่สำเร็จ', { error: e.message });
    return [];
  }
}

export function saveModelBuffer(rawName, buffer) {
  if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });
  let safeName = path.basename(String(rawName || 'model.glb')).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeName.toLowerCase().endsWith('.glb')) safeName += '.glb';
  const targetPath = path.join(MODELS_DIR, safeName);
  fs.writeFileSync(targetPath, buffer);
  return {
    name: safeName,
    url: `/models/${safeName}`,
    sizeMB: +(buffer.length / (1024 * 1024)).toFixed(2),
  };
}

loadSceneConfig();
