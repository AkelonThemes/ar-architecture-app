/**
 * Model Loader - Handles loading of 3D house models
 * Supports GLTF/GLB, FBX, and OBJ formats
 */

import * as THREE from 'three';

export class ModelLoader {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.loadedModels = new Map();
        
        // Built-in model definitions
        this.builtInModels = {
            'default-house': () => this.createDefaultHouse(),
            'cottage': () => this.createCottage(),
            'apartment': () => this.createApartment()
        };
    }

    async loadModel(modelId) {
        // Check cache
        if (this.loadedModels.has(modelId)) {
            return this.loadedModels.get(modelId).clone();
        }
        
        // Check if it's a built-in model
        if (this.builtInModels[modelId]) {
            const model = this.builtInModels[modelId]();
            this.loadedModels.set(modelId, model);
            return model.clone();
        }
        
        throw new Error(`Model ${modelId} not found`);
    }

    async loadFromFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const url = URL.createObjectURL(file);
        
        try {
            let model;
            
            switch (extension) {
                case 'glb':
                case 'gltf':
                    model = await this.loadGLTF(url);
                    break;
                case 'fbx':
                    model = await this.loadFBX(url);
                    break;
                case 'obj':
                    model = await this.loadOBJ(url);
                    break;
                default:
                    throw new Error(`Unsupported format: ${extension}`);
            }
            
            URL.revokeObjectURL(url);
            return model;
            
        } catch (error) {
            URL.revokeObjectURL(url);
            throw error;
        }
    }

    async loadGLTF(url) {
        // Dynamic import for GLTF loader
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Handle animations if present
                    if (gltf.animations.length > 0) {
                        model.userData.animations = gltf.animations;
                    }
                    
                    resolve(model);
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    async loadFBX(url) {
        // Dynamic import for FBX loader
        const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
        const loader = new FBXLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (fbx) => {
                    resolve(fbx);
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    async loadOBJ(url) {
        // Dynamic import for OBJ loader
        const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
        const loader = new OBJLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (obj) => {
                    resolve(obj);
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    // Procedural house models as fallback
    createDefaultHouse() {
        const group = new THREE.Group();
        
        // Materials
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc, // Beige
            roughness: 0.8,
            metalness: 0.1
        });
        
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // Brown
            roughness: 0.7,
            metalness: 0.2
        });
        
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.6,
            metalness: 0.1
        });

        // Main house body
        const bodyGeometry = new THREE.BoxGeometry(4, 3, 5);
        const body = new THREE.Mesh(bodyGeometry, wallMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Roof
        const roofGeometry = new THREE.ConeGeometry(3.5, 2, 4);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 4;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
        
        // Front door
        const doorGeometry = new THREE.BoxGeometry(0.8, 2, 0.1);
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1, 2.55);
        door.castShadow = true;
        group.add(door);
        
        // Windows
        const windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
        
        const positions = [
            { x: -1.2, y: 2, z: 2.55 },  // Front left
            { x: 1.2, y: 2, z: 2.55 },   // Front right
            { x: -2.05, y: 2, z: 0 },    // Left side
            { x: 2.05, y: 2, z: 0 }      // Right side
        ];
        
        positions.forEach(pos => {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(pos.x, pos.y, pos.z);
            if (Math.abs(pos.x) > 2) {
                window.rotation.y = Math.PI / 2;
            }
            group.add(window);
        });
        
        // Chimney
        const chimneyGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        const chimney = new THREE.Mesh(chimneyGeometry, roofMaterial);
        chimney.position.set(1, 4.5, -1);
        chimney.castShadow = true;
        group.add(chimney);
        
        // Foundation
        const foundationGeometry = new THREE.BoxGeometry(4.5, 0.3, 5.5);
        const foundationMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9
        });
        const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
        foundation.position.y = 0.15;
        foundation.receiveShadow = true;
        group.add(foundation);
        
        return group;
    }

    createCottage() {
        const group = new THREE.Group();
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xdeb887, // Burlywood
            roughness: 0.9,
            metalness: 0.0
        });
        
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x228b22, // Forest green (thatched look)
            roughness: 0.95,
            metalness: 0.0
        });
        
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8,
            metalness: 0.1
        });

        // Cottage body - slightly irregular
        const bodyGeometry = new THREE.BoxGeometry(3, 2.5, 4);
        const body = new THREE.Mesh(bodyGeometry, wallMaterial);
        body.position.y = 1.25;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Thatched roof
        const roofGeometry = new THREE.ConeGeometry(2.8, 2.5, 4);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 3.75;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
        
        // Wooden door frame
        const doorFrameGeometry = new THREE.BoxGeometry(1, 1.8, 0.2);
        const doorFrame = new THREE.Mesh(doorFrameGeometry, woodMaterial);
        doorFrame.position.set(0, 0.9, 2.05);
        doorFrame.castShadow = true;
        group.add(doorFrame);
        
        // Round window
        const roundWindowGeometry = new THREE.CircleGeometry(0.3, 16);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff8dc,
            emissive: 0xfff8dc,
            emissiveIntensity: 0.2
        });
        const roundWindow = new THREE.Mesh(roundWindowGeometry, windowMaterial);
        roundWindow.position.set(0, 2, 2.02);
        group.add(roundWindow);
        
        // Side windows
        const sideWindowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
        const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        leftWindow.position.set(-1.55, 1.5, 0);
        leftWindow.rotation.y = Math.PI / 2;
        group.add(leftWindow);
        
        // Flower boxes
        const flowerBoxGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.2);
        const flowerBoxMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const flowerBox = new THREE.Mesh(flowerBoxGeometry, flowerBoxMaterial);
        flowerBox.position.set(-1.55, 1.1, 0);
        flowerBox.rotation.y = Math.PI / 2;
        group.add(flowerBox);
        
        return group;
    }

    createApartment() {
        const group = new THREE.Group();
        
        const concreteMaterial = new THREE.MeshStandardMaterial({
            color: 0xb0b0b0,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90d9,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.6
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6b35,
            roughness: 0.5,
            metalness: 0.3
        });

        // Main building
        const buildingGeometry = new THREE.BoxGeometry(6, 12, 6);
        const building = new THREE.Mesh(buildingGeometry, concreteMaterial);
        building.position.y = 6;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Windows - grid pattern
        const windowGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.1);
        
        for (let floor = 0; floor < 4; floor++) {
            for (let col = 0; col < 2; col++) {
                // Front windows
                const frontWindow = new THREE.Mesh(windowGeometry, glassMaterial);
                frontWindow.position.set(-1.5 + col * 3, 2 + floor * 3, 3.05);
                group.add(frontWindow);
                
                // Back windows
                const backWindow = new THREE.Mesh(windowGeometry, glassMaterial);
                backWindow.position.set(-1.5 + col * 3, 2 + floor * 3, -3.05);
                group.add(backWindow);
            }
        }
        
        // Balconies
        const balconyGeometry = new THREE.BoxGeometry(2, 0.1, 1);
        const railingGeometry = new THREE.BoxGeometry(2, 0.5, 0.05);
        
        for (let floor = 1; floor < 4; floor++) {
            // Front balcony
            const balcony = new THREE.Mesh(balconyGeometry, concreteMaterial);
            balcony.position.set(0, floor * 3, 3.5);
            balcony.castShadow = true;
            group.add(balcony);
            
            const railing = new THREE.Mesh(railingGeometry, accentMaterial);
            railing.position.set(0, floor * 3 + 0.3, 4);
            group.add(railing);
        }
        
        // Entrance overhang
        const overhangGeometry = new THREE.BoxGeometry(3, 0.2, 2);
        const overhang = new THREE.Mesh(overhangGeometry, accentMaterial);
        overhang.position.set(0, 3, 4);
        overhang.castShadow = true;
        group.add(overhang);
        
        // Glass entrance door
        const entranceGeometry = new THREE.BoxGeometry(2, 2.5, 0.1);
        const entrance = new THREE.Mesh(entranceGeometry, glassMaterial);
        entrance.position.set(0, 1.25, 3.05);
        group.add(entrance);
        
        // Roof structure
        const roofGeometry = new THREE.BoxGeometry(5.5, 0.5, 5.5);
        const roofStructure = new THREE.Mesh(roofGeometry, concreteMaterial);
        roofStructure.position.y = 12.25;
        roofStructure.castShadow = true;
        group.add(roofStructure);
        
        return group;
    }

    dispose() {
        this.loadedModels.forEach((model) => {
            model.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.loadedModels.clear();
    }
}
