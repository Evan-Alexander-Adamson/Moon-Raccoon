// Three.js Scene Component
const ThreeScene = () => {
    React.useEffect(() => {
        // Set up Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0); // Fully transparent background
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Clear the background
        scene.background = null;
        
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // Set up post-processing
        const composer = new THREE.EffectComposer(renderer);
        const renderScene = new THREE.RenderPass(scene, camera);
        
        // Improve render quality
        renderScene.magFilter = THREE.NearestFilter;
        renderScene.minFilter = THREE.NearestFilter;
        composer.addPass(renderScene);

        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.0,    // Reduced bloom strength
            0.4,    // Slightly reduced radius
            0.6     // Increased threshold to reduce overall glow
        );

        // Add better blending
        bloomPass.renderToScreen = true;
        bloomPass.combineMaterial = new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomPass.renderTargetsHorizontal[0].texture }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                varying vec2 vUv;
                void main() {
                    vec4 base = texture2D(baseTexture, vUv);
                    vec4 bloom = texture2D(bloomTexture, vUv);
                    gl_FragColor = vec4(base.rgb + bloom.rgb, 1.0);
                }
            `
        });
        composer.addPass(bloomPass);

        // Add SMAA pass for better anti-aliasing
        const smaaPass = new THREE.SMAAPass(
            window.innerWidth * renderer.getPixelRatio(),
            window.innerHeight * renderer.getPixelRatio()
        );
        composer.addPass(smaaPass);
        
        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Reduced ambient light
        scene.add(ambientLight);
        
        // Main directional light (like moonlight)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8); // Reduced intensity
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        scene.add(mainLight);

        // Add rim light for better definition
        const rimLight = new THREE.DirectionalLight(0x8e44ad, 0.2); // Reduced purple tint
        rimLight.position.set(-5, 0, -5);
        scene.add(rimLight);

        // Add fill light
        const fillLight = new THREE.DirectionalLight(0x2c3e50, 0.1); // Reduced blue tint
        fillLight.position.set(-2, -2, 4);
        scene.add(fillLight);
        
        // Set up camera position for fixed view
        camera.position.set(0, 0, 12);
        camera.lookAt(0, 0, 0);

        // Create a container for the logo
        const container = new THREE.Group();
        scene.add(container);
        
        // Create a container for the moon
        const moonContainer = new THREE.Group();
        scene.add(moonContainer);
        
        // Load the moon model
        const loader = new THREE.GLTFLoader();
        
        loader.load('./moon.glb',
            (gltf) => {
                const moon = gltf.scene;
                
                // Get the bounding box
                const box = new THREE.Box3().setFromObject(moon);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // Scale the moon (make it smaller than the logo)
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3 / maxDim;  // Half the size of the logo
                moon.scale.multiplyScalar(scale);

                // Center the moon
                moon.position.sub(center);
                
                // Position in top right corner
                moonContainer.position.set(8, 4, -5);
                
                // Add subtle rotation animation
                moon.rotation.x = -Math.PI / 6;  // Tilt slightly
                moon.rotation.y = Math.PI / 4;   // Turn slightly
                
                // Add to container
                moonContainer.add(moon);
                
                // Apply glowing material
                moon.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (node.material) {
                            const moonMaterial = new THREE.MeshStandardMaterial({
                                color: 0xffffff,
                                emissive: 0xffffff,
                                emissiveIntensity: 1,   // Subtle glow
                                metalness: 0.2,
                                roughness: 0.7,           // More rough for moon-like surface
                                envMapIntensity: 0.8
                            });
                            node.material = moonMaterial;
                        }
                    }
                });
            },
            (progress) => {
                console.log('Moon loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading moon model:', error);
            }
        );
        
        // Load the 3D logo
        loader.load('./3dLogo.glb', 
            (gltf) => {
                const logo = gltf.scene;
                
                // Scale the model
                logo.scale.set(16, 16, 16);

                // Add to container and position
                container.add(logo);
                container.position.y = 2;  // Changed from -2.5 to move it up
                container.position.x = -17;
                container.position.z = -5; // Added to bring it slightly forward
                
                // Enable shadows and enhance materials
                logo.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (node.material) {
                            // Create new material for glow effect
                            const glowMaterial = new THREE.MeshStandardMaterial({
                                color: 0xffffff,          // White base color
                                emissive: 0xffffff,       // White glow
                                emissiveIntensity: 0.3,   // Reduced glow strength
                                metalness: 0.5,           // Increased metalness to reduce light scatter
                                roughness: 0.3,           // Increased roughness to diffuse light more
                                envMapIntensity: 1.0      // Reduced environment reflection
                            });
                            node.material = glowMaterial;
                        }
                    }
                });
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading 3D model:', error);
            }
        );
        
        // Add stars as particles
        // Create a canvas for the star texture
        const starTexture = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            // Create a radial gradient for a soft, circular star
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
            
            return new THREE.CanvasTexture(canvas);
        })();

        // Create stars with depth for parallax
        const createStarField = (count, depth) => {
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            const layers = [];  // Store depth layer for each star
            
            for (let i = 0; i < count; i++) {
                const x = (Math.random() - 0.5) * 100;
                const y = (Math.random() - 0.5) * 100;
                const z = (Math.random() - 0.5) * depth;
                vertices.push(x, y, z);
                
                // Store which depth layer this star belongs to (0-1)
                layers.push(Math.abs(z / depth));
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('layer', new THREE.Float32BufferAttribute(layers, 1));
            
            return geometry;
        };

        // Create three layers of stars for parallax effect
        const starFields = [
            { geometry: createStarField(100, 20), speed: 0.002 },  // Far stars, slow
            { geometry: createStarField(50, 40), speed: 0.004 },   // Mid stars, medium
            { geometry: createStarField(25, 60), speed: 0.006 }    // Near stars, fast
        ];

        const stars = starFields.map(field => {
            const points = new THREE.Points(
                field.geometry,
                new THREE.PointsMaterial({
                    size: 0.5,
                    map: starTexture,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    opacity: 0.8
                })
            );
            scene.add(points);
            return { points, speed: field.speed };
        });

        // Add scroll listener for parallax effect
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const delta = (window.scrollY - lastScrollY) * 0.01;
            lastScrollY = window.scrollY;

            // Update star positions based on scroll
            stars.forEach((starField, index) => {
                starField.points.position.y += delta * starField.speed;
                
                // Reset stars when they move too far
                if (Math.abs(starField.points.position.y) > 50) {
                    starField.points.position.y = 0;
                }
            });

            // Parallax effect on logo and moon
            if (container.children.length > 0) {
                container.position.y = 2 - (window.scrollY * 0.002);
            }
            if (moonContainer.children.length > 0) {
                moonContainer.position.y = 4 + (window.scrollY * 0.001);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Update animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Twinkle stars by modifying their opacity
            const time = Date.now() * 0.001;
            stars.forEach(starField => {
                starField.points.material.opacity = Math.sin(time) * 0.2 + 0.6;
            });
            
            if (container.children.length > 0) {
                container.rotation.y += 0.003;
            }
            
            if (moonContainer.children.length > 0) {
                moonContainer.rotation.y += 0.001;
            }
            
            composer.render();
        };
        
        animate();
        
        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Clean up event listeners
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    
    return <div id="canvas-container"></div>;
};

// Hero Section Component
const HeroSection = () => (
    <section className="hero-section">
        <div className="container text-center">
            <h1 className="display-1 fade-in">MOON RACCOON</h1>
            <p className="lead fade-in">Focus Music & Audio Visual Experiences</p>
            <div className="mt-4 fade-in">
                <a href="#music" className="btn btn-outline-light me-3">EXPLORE MUSIC</a>
                <a href="#visuals" className="btn btn-outline-light">WATCH VISUALS</a>
            </div>
        </div>
    </section>
);

// Video Showcase Component
const VideoShowcase = () => (
    <section id="showcase" className="content-section video-section">
        <div className="container">
            <div className="video-container">
                <iframe 
                    width="100%" 
                    height="720" 
                    src="https://www.youtube.com/embed/ZKRKcs_dVT4?si=51sDUi_a_KmSa8Xp&amp;controls=0&amp;vq=hd2160&amp;quality=hd2160&amp;hd=1" 
                    title="Moon Raccoon Audio Visual Showcase" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen>
                </iframe>
            </div>
        </div>
    </section>
);

// Music Section Component
const MusicSection = () => (
    <section id="music" className="content-section">
        <div className="container">
            <div className="spotify-embed mb-5">
                <iframe 
                    style={{borderRadius: "12px"}} 
                    src="https://open.spotify.com/embed/artist/2Zkj0a4p1ENEdQEUXCs8Ib?utm_source=generator" 
                    width="100%" 
                    height="352" 
                    frameBorder="0" 
                    allowFullScreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy">
                </iframe>
            </div>
            <h2 className="text-center mb-5">Latest Releases</h2>
            <div className="row">
                {[
                    {
                        title: 'Moonrise',
                        link: 'https://youtu.be/55srkxHJ4mw?si=1gQOCZbC9oUQXiI2'
                    }, 
                    {
                        title: 'Drifting',
                        link: 'https://youtu.be/Zc9J19WH-gk?si=2rWzVg1UwuIdAO8_'
                    }, 
                    {
                        title: 'Celestial Reflections',
                        link: 'https://www.youtube.com/watch?v=HLxDlIiBs4Y'
                    }
                ].map((track) => (
                    <div className="col-md-4 mb-4" key={typeof track === 'string' ? track : track.title}>
                        <div className="track-card">
                            <h3>{typeof track === 'string' ? track : track.title}</h3>
                            <p className="text-muted">From the album "Lunar Echoes"</p>
                            <a 
                                href={typeof track === 'object' ? track.link : '#'} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-outline-light"
                            >
                                <i className="fas fa-play me-2"></i>Listen
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// Visuals Section Component
const VisualsSection = () => (
    <section id="visuals" className="content-section">
        <div className="container">
            <h2 className="text-center mb-5">Visual Experiences</h2>
            <div className="row">
                <div className="col-md-6 mb-4">
                    <div className="track-card">
                        <h3>Interactive Experiences</h3>
                        <p>Explore our web-based visual journeys</p>
                        <a 
                            href="https://evan-alexander-adamson.github.io/3d-Shader-Art/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline-light"
                        >
                            Launch Experience
                        </a>
                    </div>
                </div>
                <div className="col-md-6 mb-4">
                    <div className="track-card">
                        <h3>More from the creator</h3>
                        <p>Evan also releases music under the name Puppy Snoot</p>
                        <a 
                            href="https://youtu.be/vemldSZeMAg?si=Ob7r9BY7hvX0-QG9" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline-light"
                        >
                            Watch Now
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// Footer Component
const Footer = () => (
    <footer className="content-section">
        <div className="container text-center">
            <div className="social-links mb-4">
                <a href="https://www.youtube.com/@MoonRaccoonTunes" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
                <a href="https://open.spotify.com/artist/2Zkj0a4p1ENEdQEUXCs8Ib?si=kbbySpjcRKiNJTiXzc71oQ" target="_blank" rel="noopener noreferrer"><i className="fab fa-spotify"></i></a>
                <a href="https://x.com/MoonRaccoon_" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-x"></i></a>
                <a href="https://www.facebook.com/profile.php?id=100083213827930" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
            </div>
            <p>&copy; 2025 Moon Raccoon. All rights reserved.</p>
        </div>
    </footer>
);

// Main App Component
const App = () => (
    <React.Fragment>
        <ThreeScene />
        <HeroSection />
        <VideoShowcase />
        <MusicSection />
        <VisualsSection />
        <Footer />
    </React.Fragment>
);

// Render the app
ReactDOM.render(<App />, document.getElementById('root')); 