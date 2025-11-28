# AR Architecture Visualization App

A markerless Augmented Reality web application for architectural visualization. Built without ARCore dependency - works on any Android device with a camera.

## 🏗️ Features

- **Markerless AR**: Uses OpenCV.js for feature detection and tracking (no markers needed)
- **Plane Detection**: Automatically detects flat surfaces for model placement
- **3D House Models**: Built-in procedural houses + support for custom GLTF/FBX/OBJ models
- **Touch Controls**: Pinch to scale, two-finger rotate
- **Real-time Shadows**: Realistic ground shadows for better immersion
- **Cross-Platform**: Works on Android, iOS, and desktop browsers

## 🛠️ Technology Stack

- **OpenCV.js** - Computer vision for feature detection and tracking
- **Three.js** - 3D rendering engine
- **Vite** - Fast build tool and dev server
- **DeviceOrientation API** - IMU sensor fusion for stable tracking

## 📱 Requirements

- Modern web browser with WebGL support
- Camera access (HTTPS required for mobile)
- Android 5.0+ / iOS 11+ / Chrome 60+ / Firefox 55+ / Safari 11+

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ar-architecture-app
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access on Mobile

The dev server will show a network URL (e.g., `http://192.168.1.x:5173`).

**Important**: Camera access requires HTTPS on mobile. Options:

#### Option A: Use ngrok (Recommended for testing)
```bash
npm install -g ngrok
ngrok http 5173
```
Use the HTTPS URL from ngrok on your mobile device.

#### Option B: Local HTTPS with mkcert
```bash
# Install mkcert
npm install -g mkcert

# Create certificates
mkcert create-ca
mkcert create-cert

# Update vite.config.js to use HTTPS (see below)
```

#### Option C: Chrome flags (Android only)
1. Open `chrome://flags` on your Android Chrome
2. Search for "Insecure origins treated as secure"
3. Add your local IP (e.g., `http://192.168.1.100:5173`)
4. Restart Chrome

## 📁 Project Structure

```
ar-architecture-app/
├── index.html              # Main HTML entry point
├── package.json            # Dependencies
├── vite.config.js          # Build configuration
├── src/
│   ├── main.js            # Application entry point
│   ├── styles.css         # UI styles
│   └── ar/
│       ├── AREngine.js    # OpenCV-based SLAM tracking
│       ├── SceneManager.js # Three.js scene management
│       ├── ModelLoader.js  # 3D model loading
│       └── UIController.js # UI interactions
├── models/                 # Custom 3D models (GLTF/GLB/FBX/OBJ)
└── public/                 # Static assets
```

## 🎮 How to Use

1. **Grant Camera Permission**: Allow access when prompted
2. **Point at a Surface**: Aim camera at a textured floor or ground
3. **Wait for Detection**: Green indicator appears when surface is found
4. **Tap "Place Model"**: House model appears at the detected location
5. **Adjust**: Use sliders or pinch/rotate to modify scale and rotation

## 🏠 Loading Custom Models

### Supported Formats
- **GLTF/GLB** (recommended)
- **FBX**
- **OBJ**

### To Load Your Own House Model
1. Tap the "🏠 Models" button
2. Select "📁 Load Custom..."
3. Choose your 3D file

### Tips for Best Results
- Keep models under 5MB for mobile performance
- Ensure models are centered at origin
- Y-up orientation works best
- Include materials/textures for realism

## ⚙️ Configuration

### Settings Panel Options

| Setting | Description |
|---------|-------------|
| Show Debug View | Visualize tracked features and planes |
| Feature Point Count | More = better tracking, less = better performance |
| Tracking Sensitivity | Higher = more responsive, Lower = more stable |
| Ground Shadow | Toggle shadow rendering |
| Ambient Lighting | Adjust scene brightness |

### AR Engine Settings (Advanced)

Edit `src/ar/AREngine.js` to modify:

```javascript
this.settings = {
    maxFeatures: 500,        // ORB feature count
    qualityLevel: 0.01,      // Feature quality threshold
    minDistance: 10,         // Min distance between features
    ransacThreshold: 3.0,    // Plane detection strictness
    minInliers: 10           // Min matches for valid tracking
};
```

## 🔧 Troubleshooting

### "Camera not available"
- Ensure HTTPS (or localhost) for camera access
- Check browser permissions
- Try a different browser

### "OpenCV.js failed to load"
- Check internet connection (CDN loading)
- Try clearing browser cache
- OpenCV.js is ~8MB, may take time on slow connections

### "Tracking is unstable"
- Point at textured surfaces (grass, pavement, carpet)
- Avoid plain white walls or reflective surfaces
- Ensure good lighting
- Move camera slowly

### "Model not appearing"
- Ensure surface is detected (green indicator)
- Check browser console for errors
- Try resetting and placing again

## 📊 Performance Tips

1. **Reduce Feature Count**: Lower from 500 to 300 for older devices
2. **Disable Shadows**: Turn off in settings for ~20% FPS boost
3. **Use Smaller Models**: Keep under 2MB for smooth rendering
4. **Close Background Apps**: Free up GPU memory

## 🔒 Privacy

- Camera feed is processed locally only
- No data is sent to external servers
- No tracking or analytics

## 📝 Known Limitations

1. **Tracking Drift**: Position may drift over time (no loop closure)
2. **Plane Detection**: Works best on horizontal surfaces
3. **Scale Estimation**: Uses approximate camera calibration
4. **Low Texture Surfaces**: Tracking fails on plain surfaces

## 🚧 Future Improvements

- [ ] Multi-plane support
- [ ] Persistent anchors (save placed models)
- [ ] Occlusion (hide model behind real objects)
- [ ] Better scale estimation using known markers
- [ ] WebGPU support for better performance

## 📄 License

MIT License - Feel free to use for commercial and personal projects.

## 🙏 Acknowledgments

- [OpenCV.js](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html) - Computer vision in JavaScript
- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Build tool
