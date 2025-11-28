/**
 * AR Engine - Simplified optical flow based tracking
 * With enhanced debugging and error handling
 */

export class AREngineSimple {
    constructor() {
        // Frames
        this.frame = null;
        this.grayFrame = null;
        this.prevGrayFrame = null;
        
        // Optical flow
        this.prevPoints = null;
        this.nextPoints = null;
        this.status = null;
        this.err = null;
        
        // Tracking state
        this.isTracking = false;
        this.currentPose = null;
        this.trackedPoints = [];
        this.goodFeatures = [];
        
        // Plane state
        this.groundPlane = null;
        this.planeConfidence = 0;
        
        // IMU
        this.imuData = { alpha: 0, beta: 0, gamma: 0 };
        
        // Settings
        this.settings = {
            maxCorners: 200,
            qualityLevel: 0.01,
            minDistance: 15,
            blockSize: 7,
            winSize: 21,
            maxLevel: 3,
            minFeatures: 15,
            featureRefreshInterval: 15 // Refresh more often
        };
        
        this.frameCount = 0;
        this.initialized = false;
        this.debugCanvas = document.getElementById('debug-canvas');
        this.debugCtx = this.debugCanvas?.getContext('2d');
        this.showDebug = true; // Enable debug by default for troubleshooting
        
        // Logging
        this.lastLogTime = 0;
    }

    async init() {
        console.log('[AREngine] Initializing...');
        
        try {
            // Check if OpenCV is available
            if (typeof cv === 'undefined') {
                throw new Error('OpenCV.js not loaded');
            }
            
            // Initialize OpenCV matrices
            this.grayFrame = new cv.Mat();
            this.prevGrayFrame = new cv.Mat();
            this.prevPoints = new cv.Mat();
            this.nextPoints = new cv.Mat();
            this.status = new cv.Mat();
            this.err = new cv.Mat();
            
            // Setup IMU
            this.setupIMU();
            
            this.initialized = true;
            console.log('[AREngine] Initialized successfully');
            
        } catch (error) {
            console.error('[AREngine] Initialization failed:', error);
            throw error;
        }
    }

    setupIMU() {
        if (window.DeviceOrientationEvent) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+
                document.body.addEventListener('click', async () => {
                    try {
                        const permission = await DeviceOrientationEvent.requestPermission();
                        if (permission === 'granted') {
                            this.bindIMU();
                        }
                    } catch (e) {
                        console.warn('[AREngine] IMU permission denied:', e);
                    }
                }, { once: true });
            } else {
                this.bindIMU();
            }
        }
    }

    bindIMU() {
        window.addEventListener('deviceorientation', (event) => {
            this.imuData.alpha = event.alpha || 0;
            this.imuData.beta = event.beta || 0;
            this.imuData.gamma = event.gamma || 0;
        });
        console.log('[AREngine] IMU bound');
    }

    processFrame(video) {
        const result = {
            isTracking: false,
            hasFeatures: false,
            featureCount: 0,
            planeCount: 0,
            pose: null,
            imu: this.imuData
        };

        if (!this.initialized) {
            console.warn('[AREngine] Not initialized');
            return result;
        }

        try {
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            
            // Log periodically
            const now = Date.now();
            if (now - this.lastLogTime > 2000) {
                console.log(`[AREngine] Processing frame ${this.frameCount}, video: ${videoWidth}x${videoHeight}`);
                this.lastLogTime = now;
            }
            
            // Validate video dimensions
            if (videoWidth === 0 || videoHeight === 0) {
                console.warn('[AREngine] Invalid video dimensions');
                return result;
            }
            
            // Initialize frame matrix on first run
            if (!this.frame || this.frame.rows !== videoHeight || this.frame.cols !== videoWidth) {
                console.log(`[AREngine] Creating frame buffer: ${videoWidth}x${videoHeight}`);
                
                if (this.frame) this.frame.delete();
                this.frame = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
                
                if (this.debugCanvas) {
                    this.debugCanvas.width = videoWidth;
                    this.debugCanvas.height = videoHeight;
                }
            }
            
            // Capture frame from video using canvas (more reliable)
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoWidth;
            tempCanvas.height = videoHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(video, 0, 0);
            
            const imageData = tempCtx.getImageData(0, 0, videoWidth, videoHeight);
            this.frame.data.set(imageData.data);
            
            // Convert to grayscale
            cv.cvtColor(this.frame, this.grayFrame, cv.COLOR_RGBA2GRAY);
            
            this.frameCount++;
            
            // Detect features on first frame or periodically
            const needsFeatures = this.prevPoints.rows < this.settings.minFeatures;
            const refreshInterval = this.frameCount % this.settings.featureRefreshInterval === 0;
            
            if (needsFeatures || refreshInterval) {
                this.detectFeatures();
                
                if (now - this.lastLogTime > 1000) {
                    console.log(`[AREngine] Detected ${this.prevPoints.rows} features`);
                }
            }
            
            // Track if we have previous frame and enough points
            if (this.prevGrayFrame.rows > 0 && this.prevPoints.rows >= this.settings.minFeatures) {
                this.trackPoints();
                
                result.featureCount = this.goodFeatures.length;
                result.hasFeatures = result.featureCount >= this.settings.minFeatures;
                
                if (result.hasFeatures) {
                    const planeFound = this.estimatePlane();
                    result.planeCount = planeFound ? 1 : 0;
                    
                    if (planeFound) {
                        this.estimatePose();
                        result.isTracking = true;
                        result.pose = this.currentPose;
                    }
                }
            } else {
                // Still building up - report features detected
                result.featureCount = this.prevPoints.rows;
                result.hasFeatures = result.featureCount > 0;
            }
            
            // Store current frame for next iteration
            this.grayFrame.copyTo(this.prevGrayFrame);
            
            // Always draw debug for troubleshooting
            this.drawDebug(result);
            
        } catch (error) {
            console.error('[AREngine] Frame processing error:', error);
        }

        this.isTracking = result.isTracking;
        return result;
    }

    detectFeatures() {
        try {
            // Clean up previous points
            if (this.prevPoints && this.prevPoints.rows > 0) {
                this.prevPoints.delete();
            }
            
            this.prevPoints = new cv.Mat();
            const mask = new cv.Mat();
            
            // Detect Shi-Tomasi corners (good features to track)
            cv.goodFeaturesToTrack(
                this.grayFrame,
                this.prevPoints,
                this.settings.maxCorners,
                this.settings.qualityLevel,
                this.settings.minDistance,
                mask,
                this.settings.blockSize,
                false,
                0.04
            );
            
            mask.delete();
            
            console.log(`[AREngine] goodFeaturesToTrack found ${this.prevPoints.rows} points`);
            
        } catch (error) {
            console.error('[AREngine] Feature detection error:', error);
            this.prevPoints = new cv.Mat();
        }
    }

    trackPoints() {
        if (!this.prevPoints || this.prevPoints.rows === 0) {
            return;
        }
        
        try {
            // Clean up old matrices
            if (this.nextPoints && this.nextPoints.rows > 0) this.nextPoints.delete();
            if (this.status && this.status.rows > 0) this.status.delete();
            if (this.err && this.err.rows > 0) this.err.delete();
            
            this.nextPoints = new cv.Mat();
            this.status = new cv.Mat();
            this.err = new cv.Mat();
            
            // Lucas-Kanade optical flow parameters
            const winSize = new cv.Size(this.settings.winSize, this.settings.winSize);
            const criteria = new cv.TermCriteria(
                cv.TermCriteria_EPS | cv.TermCriteria_COUNT,
                30, 0.01
            );
            
            cv.calcOpticalFlowPyrLK(
                this.prevGrayFrame,
                this.grayFrame,
                this.prevPoints,
                this.nextPoints,
                this.status,
                this.err,
                winSize,
                this.settings.maxLevel,
                criteria
            );
            
            // Filter good points
            this.goodFeatures = [];
            this.trackedPoints = [];
            const newPrevPoints = [];
            
            for (let i = 0; i < this.status.rows; i++) {
                if (this.status.data[i] === 1) {
                    const prevX = this.prevPoints.data32F[i * 2];
                    const prevY = this.prevPoints.data32F[i * 2 + 1];
                    const nextX = this.nextPoints.data32F[i * 2];
                    const nextY = this.nextPoints.data32F[i * 2 + 1];
                    
                    // Validate coordinates
                    if (isNaN(prevX) || isNaN(nextX)) continue;
                    
                    // Filter large movements (outliers)
                    const dx = nextX - prevX;
                    const dy = nextY - prevY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 50) {
                        this.goodFeatures.push({ x: nextX, y: nextY });
                        this.trackedPoints.push({
                            prev: { x: prevX, y: prevY },
                            curr: { x: nextX, y: nextY }
                        });
                        newPrevPoints.push(nextX, nextY);
                    }
                }
            }
            
            // Update prev points for next frame
            this.prevPoints.delete();
            if (newPrevPoints.length > 0) {
                this.prevPoints = cv.matFromArray(
                    newPrevPoints.length / 2, 1, cv.CV_32FC2, newPrevPoints
                );
            } else {
                this.prevPoints = new cv.Mat();
            }
            
        } catch (error) {
            console.error('[AREngine] Tracking error:', error);
            this.goodFeatures = [];
            this.trackedPoints = [];
        }
    }

    estimatePlane() {
        if (this.trackedPoints.length < 8) {
            this.planeConfidence = Math.max(0, this.planeConfidence - 0.1);
            return false;
        }
        
        // Calculate average motion
        let totalDX = 0, totalDY = 0;
        
        for (const pt of this.trackedPoints) {
            totalDX += pt.curr.x - pt.prev.x;
            totalDY += pt.curr.y - pt.prev.y;
        }
        
        const avgDX = totalDX / this.trackedPoints.length;
        const avgDY = totalDY / this.trackedPoints.length;
        
        // Calculate variance (coherent motion = planar surface)
        let motionVariance = 0;
        for (const pt of this.trackedPoints) {
            const dx = (pt.curr.x - pt.prev.x) - avgDX;
            const dy = (pt.curr.y - pt.prev.y) - avgDY;
            motionVariance += dx * dx + dy * dy;
        }
        motionVariance /= this.trackedPoints.length;
        
        const isCoherent = motionVariance < 100;
        
        if (isCoherent) {
            this.planeConfidence = Math.min(1, this.planeConfidence + 0.15);
            
            // Calculate center
            let centerX = 0, centerY = 0;
            for (const feat of this.goodFeatures) {
                centerX += feat.x;
                centerY += feat.y;
            }
            centerX /= this.goodFeatures.length;
            centerY /= this.goodFeatures.length;
            
            this.groundPlane = {
                center: { x: centerX, y: centerY },
                confidence: this.planeConfidence,
                motion: { dx: avgDX, dy: avgDY }
            };
            
            return this.planeConfidence > 0.5;
        } else {
            this.planeConfidence = Math.max(0, this.planeConfidence - 0.1);
            return false;
        }
    }

    estimatePose() {
        if (!this.groundPlane) return;
        
        const motion = this.groundPlane.motion;
        
        const tx = -motion.dx * 0.001;
        const ty = motion.dy * 0.001;
        const tz = 3.0;
        
        const rotX = this.imuData.beta * (Math.PI / 180);
        const rotY = this.imuData.gamma * (Math.PI / 180);
        const rotZ = this.imuData.alpha * (Math.PI / 180);
        
        this.currentPose = {
            position: { x: tx, y: ty, z: tz },
            rotation: { x: rotX, y: rotY, z: rotZ },
            planeCenter: this.groundPlane.center,
            confidence: this.groundPlane.confidence
        };
    }

    drawDebug(result) {
        if (!this.debugCtx || !this.debugCanvas) return;
        
        const ctx = this.debugCtx;
        const w = this.debugCanvas.width;
        const h = this.debugCanvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw all detected features as green dots
        ctx.fillStyle = '#00ff00';
        for (const feat of this.goodFeatures) {
            ctx.beginPath();
            ctx.arc(feat.x, feat.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw motion vectors
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        for (const pt of this.trackedPoints) {
            ctx.beginPath();
            ctx.moveTo(pt.prev.x, pt.prev.y);
            ctx.lineTo(pt.curr.x, pt.curr.y);
            ctx.stroke();
        }
        
        // Draw plane center if detected
        if (this.groundPlane && this.planeConfidence > 0.3) {
            ctx.fillStyle = `rgba(0, 255, 255, ${this.planeConfidence})`;
            ctx.beginPath();
            ctx.arc(this.groundPlane.center.x, this.groundPlane.center.y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.groundPlane.center.x, this.groundPlane.center.y, 40, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw status info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`Frame: ${this.frameCount}`, 10, 25);
        ctx.fillText(`Features: ${this.goodFeatures.length}`, 10, 45);
        ctx.fillText(`Tracked: ${this.trackedPoints.length}`, 10, 65);
        ctx.fillText(`Confidence: ${(this.planeConfidence * 100).toFixed(0)}%`, 10, 85);
        ctx.fillText(`Status: ${result.isTracking ? 'TRACKING' : (result.hasFeatures ? 'SEARCHING' : 'NO FEATURES')}`, 10, 105);
    }

    setDebugVisible(visible) {
        this.showDebug = visible;
        if (this.debugCanvas) {
            this.debugCanvas.classList.toggle('visible', visible);
        }
    }

    updateSettings(settings) {
        Object.assign(this.settings, settings);
    }

    reset() {
        console.log('[AREngine] Resetting...');
        this.isTracking = false;
        this.trackedPoints = [];
        this.goodFeatures = [];
        this.currentPose = null;
        this.groundPlane = null;
        this.planeConfidence = 0;
        this.frameCount = 0;
        
        if (this.prevPoints && this.prevPoints.rows > 0) {
            this.prevPoints.delete();
            this.prevPoints = new cv.Mat();
        }
        
        if (this.prevGrayFrame && this.prevGrayFrame.rows > 0) {
            this.prevGrayFrame.delete();
            this.prevGrayFrame = new cv.Mat();
        }
    }

    dispose() {
        this.frame?.delete();
        this.grayFrame?.delete();
        this.prevGrayFrame?.delete();
        this.prevPoints?.delete();
        this.nextPoints?.delete();
        this.status?.delete();
        this.err?.delete();
    }
}
