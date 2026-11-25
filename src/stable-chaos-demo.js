// Stable Chaos Model - Interactive WebGL Demonstration
// A real-time visualization of transceiver networks and stable chaos dynamics

class StableChaosDemo {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // Simulation parameters
        this.params = {
            nodeCount: 8,
            connectionStrength: 0.5,
            chaosFactor: 0.3,
            waveFrequency: 1.0,
            animationSpeed: 1.0,
            demoMode: 'standard'
        };
        
        // System state
        this.nodes = [];
        this.connections = [];
        this.isPlaying = true;
        this.time = 0;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 60;
        
        // Controls
        this.controls = null;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupControls();
        this.setupEventListeners();
        this.createNodes();
        this.createConnections();
        this.hideLoadingScreen();
        this.animate();
    }
    
    setupScene() {
        this.canvas = document.getElementById('demo-canvas');
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0a0a0b, 10, 50);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(15, 10, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth - 320, window.innerHeight);
        this.renderer.setClearColor(0x0a0a0b, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x2563eb, 0.5, 50);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
        
        // Add orbital controls
        this.setupOrbitalControls();
    }
    
    setupOrbitalControls() {
        // Simple mouse controls
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let cameraAngleX = 0;
        let cameraAngleY = Math.PI / 6;
        let cameraDistance = 25;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            cameraAngleX += deltaX * 0.01;
            cameraAngleY = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleY + deltaY * 0.01));
            
            this.updateCameraPosition(cameraAngleX, cameraAngleY, cameraDistance);
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            cameraDistance += e.deltaY * 0.01;
            cameraDistance = Math.max(5, Math.min(50, cameraDistance));
            this.updateCameraPosition(cameraAngleX, cameraAngleY, cameraDistance);
            e.preventDefault();
        });
        
        this.updateCameraPosition = (angleX, angleY, distance) => {
            this.camera.position.x = distance * Math.sin(angleY) * Math.cos(angleX);
            this.camera.position.y = distance * Math.cos(angleY);
            this.camera.position.z = distance * Math.sin(angleY) * Math.sin(angleX);
            this.camera.lookAt(0, 0, 0);
        };
        
        // Initial camera position
        this.updateCameraPosition(cameraAngleX, cameraAngleY, cameraDistance);
    }
    
    setupControls() {
        // Node count
        const nodeCountSlider = document.getElementById('nodeCount');
        const nodeCountValue = document.getElementById('nodeCountValue');
        
        nodeCountSlider.addEventListener('input', (e) => {
            this.params.nodeCount = parseInt(e.target.value);
            nodeCountValue.textContent = this.params.nodeCount;
            this.recreateSystem();
        });
        
        // Connection strength
        const connectionStrengthSlider = document.getElementById('connectionStrength');
        const connectionStrengthValue = document.getElementById('connectionStrengthValue');
        
        connectionStrengthSlider.addEventListener('input', (e) => {
            this.params.connectionStrength = parseFloat(e.target.value);
            connectionStrengthValue.textContent = this.params.connectionStrength.toFixed(1);
        });
        
        // Chaos factor
        const chaosFactorSlider = document.getElementById('chaosFactor');
        const chaosFactorValue = document.getElementById('chaosFactorValue');
        
        chaosFactorSlider.addEventListener('input', (e) => {
            this.params.chaosFactor = parseFloat(e.target.value);
            chaosFactorValue.textContent = this.params.chaosFactor.toFixed(2);
        });
        
        // Wave frequency
        const waveFrequencySlider = document.getElementById('waveFrequency');
        const waveFrequencyValue = document.getElementById('waveFrequencyValue');
        
        waveFrequencySlider.addEventListener('input', (e) => {
            this.params.waveFrequency = parseFloat(e.target.value);
            waveFrequencyValue.textContent = this.params.waveFrequency.toFixed(1);
        });
        
        // Animation speed
        const animationSpeedSlider = document.getElementById('animationSpeed');
        const animationSpeedValue = document.getElementById('animationSpeedValue');
        
        animationSpeedSlider.addEventListener('input', (e) => {
            this.params.animationSpeed = parseFloat(e.target.value);
            animationSpeedValue.textContent = this.params.animationSpeed.toFixed(1);
        });
        
        // Play/Pause button
        const playPauseBtn = document.getElementById('playPause');
        playPauseBtn.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
        });
        
        // Reset button
        const resetBtn = document.getElementById('reset');
        resetBtn.addEventListener('click', () => {
            this.resetSimulation();
        });
        
        // Demo mode selector
        const demoModeSelect = document.getElementById('demoMode');
        demoModeSelect.addEventListener('change', (e) => {
            this.params.demoMode = e.target.value;
            this.activateDemoMode(this.params.demoMode);
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }
    
    createNodes() {
        // Clear existing nodes
        this.nodes.forEach(node => {
            this.scene.remove(node.mesh);
        });
        this.nodes = [];
        
        const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        
        // Create tetrahedral lattice based on node count
        const gridPositions = this.getTetrahedralLatticePositions(this.params.nodeCount);
        
        for (let i = 0; i < gridPositions.length; i++) {
            const position = gridPositions[i];
            
            // Node material with position-based coloring
            const hue = (i * 0.1 + position.x * 0.05 + position.z * 0.05) % 1.0;
            const nodeMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(hue, 0.7, 0.5),
                emissive: new THREE.Color().setHSL(hue, 0.3, 0.1),
                transparent: true,
                opacity: 0.9
            });
            
            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            nodeMesh.position.copy(position);
            nodeMesh.castShadow = true;
            nodeMesh.receiveShadow = true;
            
            this.scene.add(nodeMesh);
            
            // Store grid coordinates for connection logic
            const gridCoords = this.positionToGridCoords(position);
            
            // Node state for simulation
            const node = {
                id: i,
                mesh: nodeMesh,
                originalPosition: position.clone(),
                gridCoords: gridCoords,
                state: Math.random() * 2 - 1,
                connections: [],
                resonancePhase: Math.random() * Math.PI * 2,
                neighbors: [],
                opposites: []
            };
            
            this.nodes.push(node);
        }
    }
    
    getTetrahedralLatticePositions(nodeCount) {
        const positions = [];
        const spacing = 4;
        
        if (nodeCount === 4) {
            // Single tetrahedron - perfect tetrahedral geometry
            const h = spacing * Math.sqrt(2/3);
            positions.push(
                new THREE.Vector3(0, -h/2, 0),
                new THREE.Vector3(spacing/2, h/2, -spacing/(2*Math.sqrt(3))),
                new THREE.Vector3(-spacing/2, h/2, -spacing/(2*Math.sqrt(3))),
                new THREE.Vector3(0, h/2, spacing/Math.sqrt(3))
            );
            
        } else {
            // Build proper tetrahedral lattice for all other counts
            this.buildTetrahedralLattice(positions, nodeCount, spacing);
        }
        
        return positions;
    }
    
    buildTetrahedralLattice(positions, nodeCount, spacing) {
        // Simple tetrahedral grid: each new node creates a tetrahedron with 3 existing nodes
        
        if (nodeCount < 4) {
            // Not enough for a tetrahedron, just place nodes in a line
            for (let i = 0; i < nodeCount; i++) {
                positions.push(new THREE.Vector3(i * spacing, 0, 0));
            }
            return;
        }
        
        // Start with first tetrahedron (nodes 0, 1, 2, 3)
        const h = spacing * Math.sqrt(2/3); // tetrahedron height
        const r = spacing * Math.sqrt(3) / 3; // circumradius of base triangle
        
        positions.push(new THREE.Vector3(0, 0, 0));                    // Node 0 (base center)
        positions.push(new THREE.Vector3(spacing, 0, 0));              // Node 1 (base)
        positions.push(new THREE.Vector3(-spacing/2, 0, spacing*Math.sqrt(3)/2)); // Node 2 (base)
        positions.push(new THREE.Vector3(spacing/4, h, spacing*Math.sqrt(3)/6));  // Node 3 (apex)
        
        // For each additional node, create a new tetrahedron sharing 3 nodes with an existing one
        for (let i = 4; i < nodeCount; i++) {
            const newNode = this.addNextTetrahedralNode(positions, spacing, i);
            positions.push(newNode);
        }
        
        // Center the structure
        const center = new THREE.Vector3();
        positions.forEach(pos => center.add(pos));
        center.divideScalar(positions.length);
        positions.forEach(pos => pos.sub(center));
    }
    
    addNextTetrahedralNode(existingPositions, spacing, nodeIndex) {
        // Find the best face of 3 nodes to create a new tetrahedron with
        // For simplicity, we'll use a systematic approach
        
        const numExisting = existingPositions.length;
        
        if (nodeIndex === 4) {
            // Node 4: Create tetrahedron with nodes 0, 1, 2 (opposite side from node 3)
            const face = [existingPositions[0], existingPositions[1], existingPositions[2]];
            return this.calculateTetrahedralApex(face, spacing, true); // opposite side from node 3
        }
        
        if (nodeIndex === 5) {
            // Node 5: Create tetrahedron with nodes 0, 1, 3
            const face = [existingPositions[0], existingPositions[1], existingPositions[3]];
            return this.calculateTetrahedralApex(face, spacing, false);
        }
        
        if (nodeIndex === 6) {
            // Node 6: Create tetrahedron with nodes 0, 2, 3
            const face = [existingPositions[0], existingPositions[2], existingPositions[3]];
            return this.calculateTetrahedralApex(face, spacing, false);
        }
        
        // For larger counts, use a more systematic approach
        const faceIndex = (nodeIndex - 4) % (numExisting - 2);
        const face = [
            existingPositions[faceIndex],
            existingPositions[(faceIndex + 1) % numExisting],
            existingPositions[(faceIndex + 2) % numExisting]
        ];
        
        return this.calculateTetrahedralApex(face, spacing, false);
    }
    
    calculateTetrahedralApex(triangleFace, spacing, flipDirection = false) {
        // Given a triangular face, calculate the 4th point to make a regular tetrahedron
        const [p1, p2, p3] = triangleFace;
        
        // Calculate face center
        const faceCenter = new THREE.Vector3()
            .addVectors(p1, p2)
            .add(p3)
            .divideScalar(3);
        
        // Calculate face normal
        const edge1 = new THREE.Vector3().subVectors(p2, p1);
        const edge2 = new THREE.Vector3().subVectors(p3, p1);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
        
        // Calculate tetrahedral height
        const tetraHeight = spacing * Math.sqrt(2/3);
        
        // Apply direction
        if (flipDirection) normal.multiplyScalar(-1);
        
        // Position new apex at tetrahedral height from face center
        return faceCenter.clone().add(normal.multiplyScalar(tetraHeight));
    }
    
    positionToGridCoords(position) {
        // Convert 3D position back to approximate grid coordinates
        const spacing = 4;
        return {
            x: Math.round(position.x / spacing),
            y: Math.round(position.y / spacing),
            z: Math.round(position.z / spacing)
        };
    }
    
    createConnections() {
        // Clear existing connections
        this.connections.forEach(connection => {
            this.scene.remove(connection.line);
        });
        this.connections = [];
        
        // Clear node connection arrays
        this.nodes.forEach(node => {
            node.connections = [];
            node.neighbors = [];
            node.opposites = [];
        });
        
        // For each node, find exactly 4 tetrahedral neighbors
        this.nodes.forEach(nodeA => {
            // Calculate distances to all other nodes
            const distances = [];
            this.nodes.forEach((nodeB, index) => {
                if (nodeA !== nodeB) {
                    const distance = nodeA.originalPosition.distanceTo(nodeB.originalPosition);
                    distances.push({ node: nodeB, distance: distance, index: index });
                }
            });
            
            // Sort by distance and take the 4 closest as tetrahedral neighbors
            distances.sort((a, b) => a.distance - b.distance);
            
            // Connect to the 4 closest nodes (tetrahedral coordination)
            for (let i = 0; i < Math.min(4, distances.length); i++) {
                const neighborData = distances[i];
                const nodeB = neighborData.node;
                
                // Check if connection already exists
                const existingConnection = this.connections.find(conn => 
                    (conn.nodeA === nodeA && conn.nodeB === nodeB) ||
                    (conn.nodeB === nodeA && conn.nodeA === nodeB)
                );
                
                if (!existingConnection) {
                    // Determine connection type based on position in neighbor list
                    let connectionType;
                    if (i < 2) {
                        // First 2 closest are primary neighbors (attraction)
                        connectionType = { type: 'neighbor', color: 0x10b981 }; // Green
                    } else if (i === 2) {
                        // Third closest could be opposite (repulsion)
                        connectionType = { type: 'opposite', color: 0xef4444 }; // Red
                    } else {
                        // Fourth is secondary neighbor
                        connectionType = { type: 'neighbor', color: 0x06b6d4 }; // Cyan
                    }
                    
                    this.createConnection(nodeA, nodeB, connectionType.type, connectionType.color);
                    
                    // Add to node relationship arrays
                    if (connectionType.type === 'neighbor') {
                        if (!nodeA.neighbors.includes(nodeB)) nodeA.neighbors.push(nodeB);
                        if (!nodeB.neighbors.includes(nodeA)) nodeB.neighbors.push(nodeA);
                    } else if (connectionType.type === 'opposite') {
                        if (!nodeA.opposites.includes(nodeB)) nodeA.opposites.push(nodeB);
                        if (!nodeB.opposites.includes(nodeA)) nodeB.opposites.push(nodeA);
                    }
                }
            }
        });
    }
    
    determineConnectionType(nodeA, nodeB, distance) {
        // For diamond/tetrahedral lattice, connections are based on crystal structure
        const spacing = 4;
        
        // In diamond lattice, nearest neighbors are at distance a*sqrt(3)/4
        const nearestNeighborDist = spacing * Math.sqrt(3) / 2;
        const secondNearestDist = spacing;
        const tolerance = 0.5;
        
        if (Math.abs(distance - nearestNeighborDist) < tolerance) {
            // These are the 4 tetrahedral neighbors - primary bonds
            return { type: 'neighbor', color: 0x10b981 }; // Green
            
        } else if (Math.abs(distance - secondNearestDist) < tolerance) {
            // Second nearest neighbors in diamond lattice
            return { type: 'weak', color: 0x06b6d4 }; // Cyan
            
        } else if (Math.abs(distance - spacing * Math.sqrt(2)) < tolerance) {
            // Face diagonal connections - these can be opposites
            return { type: 'opposite', color: 0xef4444 }; // Red
            
        } else if (distance < spacing * 1.8) {
            // Check for other tetrahedral relationships based on geometry
            const relativePos = nodeB.originalPosition.clone().sub(nodeA.originalPosition).normalize();
            
            // In tetrahedral coordination, opposite nodes are at specific angles
            // Use geometric criteria to determine if this is an opposite relationship
            const centerA = nodeA.originalPosition.clone().normalize();
            const centerB = nodeB.originalPosition.clone().normalize();
            const dotProduct = centerA.dot(centerB);
            
            if (dotProduct < -0.5) {
                // Nodes are roughly opposite from center
                return { type: 'opposite', color: 0xef4444 }; // Red
            } else {
                // Other neighboring relationships
                return { type: 'weak', color: 0x7c3aed }; // Purple
            }
        }
        
        return null; // No connection
    }
    
    checkTetrahedralOpposition(posA, posB, spacing) {
        // In a tetrahedral structure, opposites are displaced by the tetrahedral body diagonal
        const difference = posB.clone().sub(posA);
        const bodyDiagonal = spacing * Math.sqrt(3) / 2;
        
        // Check if the displacement matches tetrahedral opposition pattern
        const distance = difference.length();
        return Math.abs(distance - bodyDiagonal) < 0.5;
    }
    
    createConnection(nodeA, nodeB, type, color) {
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: this.getConnectionOpacity(type),
            linewidth: this.getConnectionLineWidth(type)
        });
        
        const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
            nodeA.mesh.position,
            nodeB.mesh.position
        ]);
        
        const connectionLine = new THREE.Line(connectionGeometry, connectionMaterial);
        this.scene.add(connectionLine);
        
        const connection = {
            nodeA: nodeA,
            nodeB: nodeB,
            line: connectionLine,
            geometry: connectionGeometry,
            material: connectionMaterial,
            type: type,
            strength: this.getConnectionStrength(type),
            phase: Math.random() * Math.PI * 2,
            baseColor: color
        };
        
        this.connections.push(connection);
        
        // Add connection references to nodes
        nodeA.connections.push(connection);
        nodeB.connections.push(connection);
    }
    
    getConnectionOpacity(type) {
        switch(type) {
            case 'neighbor': return 0.7;
            case 'opposite': return 0.5;
            case 'weak': return 0.3;
            default: return 0.4;
        }
    }
    
    getConnectionLineWidth(type) {
        switch(type) {
            case 'neighbor': return 3;
            case 'opposite': return 2;
            case 'weak': return 1;
            default: return 2;
        }
    }
    
    getConnectionStrength(type) {
        switch(type) {
            case 'neighbor': return 1.0;   // Positive attraction
            case 'opposite': return -0.8;  // Negative repulsion
            case 'weak': return 0.3;       // Weak coupling
            default: return 0.5;
        }
    }
    
    updateSimulation() {
        if (!this.isPlaying) return;
        
        this.time += 0.016 * this.params.animationSpeed;
        
        // Calculate global chaos influence first
        const globalChaosPhase = this.time * this.params.waveFrequency * 0.5;
        const globalChaos = Math.sin(globalChaosPhase) * this.params.chaosFactor;
        
        // Update node states using enhanced stable chaos rules
        this.nodes.forEach(node => {
            let attractionInfluence = 0;
            let repulsionInfluence = 0;
            let weakCouplingInfluence = 0;
            let localChaosInfluence = 0;
            
            // Calculate influences from all connections
            node.connections.forEach(connection => {
                const otherNode = connection.nodeA === node ? connection.nodeB : connection.nodeA;
                const influence = otherNode.state * connection.strength * this.params.connectionStrength;
                
                if (connection.type === 'neighbor') {
                    attractionInfluence += influence;
                } else if (connection.type === 'opposite') {
                    repulsionInfluence += influence; // Already negative from connection.strength
                } else if (connection.type === 'weak') {
                    weakCouplingInfluence += influence;
                }
            });
            
            // Self-opposition (key to stability in chaos)
            const selfOpposition = -node.state * (0.6 + this.params.chaosFactor * 0.4);
            
            // Local chaos influences
            const localPhase = this.time * this.params.waveFrequency + node.resonancePhase;
            const harmonicChaos = Math.sin(localPhase) * this.params.chaosFactor;
            const secondOrderChaos = Math.sin(localPhase * 2.3 + globalChaosPhase) * this.params.chaosFactor * 0.5;
            const thirdOrderChaos = Math.sin(localPhase * 0.7 + node.id * 0.3) * this.params.chaosFactor * 0.3;
            
            localChaosInfluence = harmonicChaos + secondOrderChaos + thirdOrderChaos;
            
            // Chaos factor affects the balance between order and disorder
            const chaosMultiplier = 1 + this.params.chaosFactor * 2;
            const stabilityMultiplier = 1 - this.params.chaosFactor * 0.5;
            
            // Combine all influences with chaos factor integration
            const totalInfluence = 
                (attractionInfluence * chaosMultiplier) + 
                (repulsionInfluence * chaosMultiplier) + 
                (weakCouplingInfluence * 0.5) +
                (selfOpposition * stabilityMultiplier) + 
                (localChaosInfluence * 1.5) +
                (globalChaos * 0.8);
            
            // Update node state with adaptive damping based on chaos factor
            const dampingFactor = 0.02 * (1 + this.params.chaosFactor);
            const deltaState = totalInfluence * dampingFactor;
            node.state += deltaState;
            
            // Dynamic state bounds influenced by chaos factor
            const maxState = 1 + this.params.chaosFactor * 0.5;
            node.state = Math.max(-maxState, Math.min(maxState, node.state));
            
            // Update visual properties with chaos-influenced dynamics
            const baseHue = (node.id * 0.15 + this.time * 0.02 * this.params.chaosFactor) % 1.0;
            const stateIntensity = Math.abs(node.state) / maxState;
            const chaosColorShift = globalChaos * this.params.chaosFactor * 0.2;
            
            const hue = (baseHue + chaosColorShift + stateIntensity * 0.1) % 1.0;
            const saturation = 0.6 + stateIntensity * 0.4;
            const brightness = 0.3 + stateIntensity * 0.6 + Math.abs(globalChaos) * this.params.chaosFactor * 0.2;
            
            node.mesh.material.color.setHSL(hue, saturation, brightness);
            node.mesh.material.emissive.setHSL(hue, saturation * 0.4, brightness * 0.15);
            
            // Enhanced position dynamics with chaos influence
            const stateAmplitude = node.state * (0.2 + this.params.chaosFactor * 0.3);
            const chaosAmplitude = localChaosInfluence * this.params.chaosFactor * 0.15;
            const resonance = stateAmplitude + chaosAmplitude;
            
            // Multi-directional movement influenced by chaos
            const primaryDirection = node.originalPosition.clone().normalize();
            const secondaryDirection = new THREE.Vector3(
                Math.sin(localPhase + node.id),
                Math.cos(localPhase * 1.3 + node.id),
                Math.sin(localPhase * 0.8 + node.id)
            ).normalize();
            
            const primaryOffset = primaryDirection.multiplyScalar(resonance);
            const secondaryOffset = secondaryDirection.multiplyScalar(chaosAmplitude * this.params.chaosFactor);
            
            const totalOffset = primaryOffset.add(secondaryOffset);
            node.mesh.position.copy(node.originalPosition).add(totalOffset);
        });
        
        // Update connection visuals with enhanced chaos dynamics
        this.connections.forEach(connection => {
            // Update line geometry positions
            const positions = connection.geometry.attributes.position.array;
            positions[0] = connection.nodeA.mesh.position.x;
            positions[1] = connection.nodeA.mesh.position.y;
            positions[2] = connection.nodeA.mesh.position.z;
            positions[3] = connection.nodeB.mesh.position.x;
            positions[4] = connection.nodeB.mesh.position.y;
            positions[5] = connection.nodeB.mesh.position.z;
            connection.geometry.attributes.position.needsUpdate = true;
            
            // Enhanced connection visualization with chaos integration
            const stateA = connection.nodeA.state;
            const stateB = connection.nodeB.state;
            const stateDifference = Math.abs(stateA - stateB);
            const stateProduct = stateA * stateB;
            
            // Wave effects influenced by chaos factor
            const baseWavePhase = this.time * this.params.waveFrequency + connection.phase;
            const chaosWavePhase = baseWavePhase * (1 + this.params.chaosFactor * 2);
            const waveEffect = Math.sin(chaosWavePhase) * 0.5 + 0.5;
            const chaosWaveEffect = Math.sin(chaosWavePhase * 1.7 + globalChaos) * this.params.chaosFactor;
            
            let opacity, intensity, hue, saturation;
            
            if (connection.type === 'neighbor') {
                // Attraction connections - visualize cooperation
                const cooperation = (stateProduct > 0) ? Math.abs(stateProduct) : 0;
                const chaosInfluence = Math.abs(chaosWaveEffect) * 0.4;
                
                opacity = 0.3 + cooperation * 0.5 + waveEffect * 0.3 + chaosInfluence;
                intensity = 0.4 + cooperation * 0.6 + chaosInfluence;
                hue = 0.33 - this.params.chaosFactor * 0.1 + chaosWaveEffect * 0.05; // Green shifting with chaos
                saturation = 0.7 + this.params.chaosFactor * 0.3;
                
            } else if (connection.type === 'opposite') {
                // Repulsion connections - visualize opposition  
                const opposition = (stateProduct < 0) ? Math.abs(stateProduct) : stateDifference;
                const chaosInfluence = Math.abs(chaosWaveEffect) * 0.5;
                
                opacity = 0.2 + opposition * 0.6 + waveEffect * 0.2 + chaosInfluence;
                intensity = 0.3 + opposition * 0.7 + chaosInfluence;
                hue = 0.0 + this.params.chaosFactor * 0.05 + chaosWaveEffect * 0.03; // Red shifting with chaos
                saturation = 0.8 + this.params.chaosFactor * 0.2;
                
            } else { // weak coupling
                // Weak connections show system-wide chaos propagation
                const avgStateIntensity = (Math.abs(stateA) + Math.abs(stateB)) / 2;
                const chaosInfluence = Math.abs(globalChaos) * this.params.chaosFactor;
                
                opacity = 0.1 + avgStateIntensity * 0.3 + chaosInfluence * 0.4;
                intensity = 0.3 + avgStateIntensity * 0.4 + chaosInfluence * 0.5;
                hue = 0.75 + this.params.chaosFactor * 0.15 + chaosWaveEffect * 0.1; // Purple shifting with chaos
                saturation = 0.6 + this.params.chaosFactor * 0.4;
            }
            
            // Apply chaos-influenced pulsing
            const chaosPulse = 1 + Math.sin(chaosWavePhase * 0.3) * this.params.chaosFactor * 0.2;
            opacity *= chaosPulse;
            intensity *= chaosPulse;
            
            // Ensure proper bounds
            opacity = Math.max(0.05, Math.min(0.95, opacity));
            intensity = Math.max(0.1, Math.min(1.0, intensity));
            hue = (hue + 1) % 1.0; // Wrap around
            saturation = Math.max(0.3, Math.min(1.0, saturation));
            
            connection.material.opacity = opacity;
            connection.material.color.setHSL(hue, saturation, intensity);
        });
    }
    
    updateStats() {
        // Calculate FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            document.getElementById('fps').textContent = this.fps;
        }
        
        // Update other stats
        document.getElementById('activeNodes').textContent = this.nodes.length;
        document.getElementById('connections').textContent = this.connections.length;
        
        // Calculate total possible states (approximation)
        const totalStates = Math.pow(4, this.nodes.length);
        document.getElementById('totalStates').textContent = totalStates > 1000000 ? 
            (totalStates / 1000000).toFixed(1) + 'M' : 
            totalStates.toLocaleString();
        
        // Calculate stability and chaos metrics
        let totalVariance = 0;
        let totalAbsState = 0;
        
        this.nodes.forEach(node => {
            totalAbsState += Math.abs(node.state);
            totalVariance += node.state * node.state;
        });
        
        const avgAbsState = totalAbsState / this.nodes.length;
        const stability = Math.max(0, 1 - avgAbsState / 2);
        const chaosIndex = Math.min(1, Math.sqrt(totalVariance / this.nodes.length) / 2);
        
        document.getElementById('stability').textContent = stability.toFixed(3);
        document.getElementById('chaosIndex').textContent = chaosIndex.toFixed(3);
    }
    
    recreateSystem() {
        this.createNodes();
        this.createConnections();
    }
    
    activateDemoMode(mode) {
        // Reset system first
        this.resetSimulation();
        
        switch(mode) {
            case 'wave':
                // Set up wave propagation demonstration
                this.params.waveFrequency = 2.0;
                this.params.chaosFactor = 0.1;
                this.params.connectionStrength = 0.8;
                this.initializeWaveMode();
                break;
                
            case 'sync':
                // Synchronization demonstration
                this.params.waveFrequency = 1.5;
                this.params.chaosFactor = 0.05;
                this.params.connectionStrength = 1.2;
                this.initializeSyncMode();
                break;
                
            case 'bifurcation':
                // Bifurcation demonstration
                this.params.waveFrequency = 0.8;
                this.params.chaosFactor = 0.7;
                this.params.connectionStrength = 0.6;
                this.initializeBifurcationMode();
                break;
                
            case 'resonance':
                // Resonance cascade demonstration
                this.params.waveFrequency = 3.0;
                this.params.chaosFactor = 0.4;
                this.params.connectionStrength = 1.0;
                this.initializeResonanceMode();
                break;
                
            default: // 'standard'
                this.params.waveFrequency = 1.0;
                this.params.chaosFactor = 0.3;
                this.params.connectionStrength = 0.5;
                break;
        }
        
        // Update UI controls to reflect new values
        this.updateControlsFromParams();
    }
    
    initializeWaveMode() {
        // Create a wave impulse from one corner
        this.nodes.forEach((node, index) => {
            if (index === 0) {
                node.state = 1.0; // Strong positive impulse
            } else {
                node.state = 0; // Start at rest
            }
        });
    }
    
    initializeSyncMode() {
        // Start with alternating states to show synchronization
        this.nodes.forEach((node, index) => {
            node.state = (index % 2 === 0) ? 0.8 : -0.8;
        });
    }
    
    initializeBifurcationMode() {
        // Start with small random perturbations
        this.nodes.forEach(node => {
            node.state = (Math.random() - 0.5) * 0.2;
        });
    }
    
    initializeResonanceMode() {
        // Set up harmonic initial conditions
        this.nodes.forEach((node, index) => {
            const phase = (index / this.nodes.length) * Math.PI * 2;
            node.state = Math.sin(phase) * 0.6;
            node.resonancePhase = phase;
        });
    }
    
    updateControlsFromParams() {
        document.getElementById('waveFrequency').value = this.params.waveFrequency;
        document.getElementById('waveFrequencyValue').textContent = this.params.waveFrequency.toFixed(1);
        document.getElementById('chaosFactor').value = this.params.chaosFactor;
        document.getElementById('chaosFactorValue').textContent = this.params.chaosFactor.toFixed(2);
        document.getElementById('connectionStrength').value = this.params.connectionStrength;
        document.getElementById('connectionStrengthValue').textContent = this.params.connectionStrength.toFixed(1);
    }
    
    resetSimulation() {
        this.time = 0;
        this.nodes.forEach(node => {
            node.state = Math.random() * 2 - 1;
            node.resonancePhase = Math.random() * Math.PI * 2;
            node.mesh.position.copy(node.originalPosition);
        });
    }
    
    onWindowResize() {
        const width = window.innerWidth - 320;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('hidden');
        }, 1500);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateSimulation();
        this.updateStats();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StableChaosDemo();
});

// Add some additional visual effects
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.init();
    }
    
    init() {
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = (Math.random() - 0.5) * 100;
            positions[i + 2] = (Math.random() - 0.5) * 100;
            
            colors[i] = Math.random();
            colors[i + 1] = Math.random();
            colors[i + 2] = Math.random();
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particleMesh);
    }
}

// Export for potential external use
window.StableChaosDemo = StableChaosDemo;