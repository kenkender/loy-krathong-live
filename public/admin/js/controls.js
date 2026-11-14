import { $, toast } from './dom.js';
import { api } from './api.js';
import { initSidebar } from './views/sidebar.js';
import { mountSceneView } from './views/scene-view.js';
import { mountCameraView } from './views/camera-view.js';
import { mountCharactersView } from './views/characters-view.js';
import { mountSourceView } from './views/source-view.js';

const run = (label, p) =>
  p()
    .then(() => toast(label))
    .catch((e) => toast(e.message, true));

export function mountControls(getState) {
  initSidebar();

  const pushScenePatch = (label, patch) => {
    run(label, async () => {
      await api('/scene', { method: 'POST', body: patch });
      await loadSceneState();
    });
  };

  const sceneView = mountSceneView($('#view-scene'), pushScenePatch);
  const cameraView = mountCameraView($('#view-camera'), pushScenePatch);
  const charactersView = mountCharactersView($('#view-characters'), pushScenePatch, run, toast, loadSceneState);
  const sourceView = mountSourceView($('#view-source'), run, toast, getState, loadSceneState);

  async function loadSceneState() {
    try {
      const data = await api('/scene');
      const scene = data.scene || {};
      const models = data.models || [];

      sceneView.update(scene);
      cameraView.update(scene);
      charactersView.update(scene, models);
    } catch (e) {
      console.warn('Load scene state failed:', e);
    }
  }

  loadSceneState();

  return {
    setTiers(tiers) {
      sourceView.setTiers(tiers);
    },
    sync(s) {
      sourceView.sync(s);
    },
  };
}
