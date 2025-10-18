import ExpoTHREE from 'expo-three';
import * as THREE from 'three';

let cachedModel: THREE.Object3D | null = null;
let isLoading = false;
let loadPromise: Promise<THREE.Object3D | null> | null = null;

const createWalletMaterial = () => {
  return new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
    envMapIntensity: 1.5,
    ior: 1.5,
  });
};

const applyMaterialToModel = (model: any) => {
  const walletMaterial = createWalletMaterial();
  
  model.traverse((child: any) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.computeVertexNormals();
        const tempGeometry = child.geometry.clone();
        tempGeometry.deleteAttribute('normal');
        const smoothAngle = 30;
        const threshold = Math.cos(THREE.MathUtils.degToRad(smoothAngle));
        const normals = new Float32Array(tempGeometry.attributes.position.count * 3);
        tempGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        tempGeometry.computeVertexNormals();
        child.geometry = tempGeometry;
      }
      
      child.material = walletMaterial;
      child.material.needsUpdate = true;
      child.material.flatShading = false;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

export const loadWalletModel = async (scene: THREE.Scene, colorScheme: 'light' | 'dark') => {
  if (cachedModel) {
    const clonedModel = cachedModel.clone();
    clonedModel.position.set(0, 0, 0);
    clonedModel.scale.set(3, 3, 3);
    scene.add(clonedModel);
    return clonedModel;
  }

  if (isLoading && loadPromise) {
    const model = await loadPromise;
    if (model) {
      const clonedModel = model.clone();
      clonedModel.position.set(0, 0, 0);
      clonedModel.scale.set(3, 3, 3);
      scene.add(clonedModel);
      return clonedModel;
    }
    return null;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      const modelUrl = 'https://cdn.jsdelivr.net/gh/SkSin19/3D-Models@main/3D%20Models/GoldenCardModel.glb?v=2';
      const loaded: any = await ExpoTHREE.loadAsync(modelUrl);
      const model = loaded && loaded.scene ? loaded.scene : loaded;
      
      if (model) {
        applyMaterialToModel(model);
        model.position.set(0, 0, 0);
        model.scale.set(3, 3, 3);
        
        cachedModel = model;
        isLoading = false;
        
        scene.add(model);
        return model;
      }
    } catch (error) {
      console.warn('Failed to load 3D wallet model:', error);
      isLoading = false;
    }
    
    return null;
  })();

  return loadPromise;
};
