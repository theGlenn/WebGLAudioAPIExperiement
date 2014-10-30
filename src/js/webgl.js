var Webgl = (function () {
    // parameters
    var SEPARATION = 25;
    var AMOUNTX = 50;
    var AMOUNTY = 50;
    var INITIAL_FACTOR = 1.0;
    var WAVE_HEIGHT = 200;
    var WAVE_SPEED = 0.2;
    var ROTATION_SPEED = 0.1;
    var DAMP_SPEED = 0.005;
    var CAMERA_SPEED = 0.05;

    var CAMERA_SPEED = 0.05;
    var CAMERA_INITIAL_X = -600;
    var CAMERA_INITIAL_Y = 1500;
    var CAMERA_INITIAL_Z = 3703;



    var LINES_HEIGHT = 10;

    var rotation = 0;
    var mouseX = -300;
    var mouseY = -300;



    var attributes = {

        size: {
            type: 'f',
            value: []
        },

        customColor: {
            type: 'c',
            value: []
        }
    };

    var uniforms = {

        amplitude: {
            type: "f",
            value: 1.0
        },
        color: {
            type: "c",
            value: new THREE.Color(0xffffff)
        },
        texture: {
            type: "t",
            value: THREE.ImageUtils.loadTexture("./src/js/img/particle.png")
        },
    };

    function Webgl(width, height) {
        // Basic three.js setup

        var worldWidth = 256,
            worldDepth = 256,
            worldHalfWidth = worldWidth / 2,
            worldHalfDepth = worldDepth / 2;

        this.canJumpTime = 0;
        this.bigTime = false;
        this.calming = false;

        this.factor = INITIAL_FACTOR;
        this.objects = [];
        this.particles = [];
        this.points = [];
        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.FogExp2(0x2D2D2D, 0.0000675);
        this.scene.fog = new THREE.FogExp2(0x000104, 0.0000675);
        this.raycaster = new THREE.Raycaster();

        this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 100000);
        this.camera.position.x = CAMERA_INITIAL_X;
        this.camera.position.y = CAMERA_INITIAL_Y;
        this.camera.position.z = CAMERA_INITIAL_Z;

        this.camera.rotation = new THREE.Euler(-0.2998598927782072, -0.16611777185981183, -0.05108038192443367, 'XYZ');


        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        this.renderer.autoClear = false;
        this.renderer.setClearColor(this.scene.fog.color, 1);
        $('.three').append(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.damping = 0.2;

        /*this.controls = new THREE.FlyControls(this.camera);

        this.controls.movementSpeed = 1000;
        this.controls.domElement = container;
        this.controls.rollSpeed = Math.PI / 24;
        this.controls.autoForward = false;
        this.controls.dragToLook = false;*/

        //Terrain
        this.terrainMesh = this.buildTerrainMesh(256, 256);

        //sky
        //this.sky = new THREE.Sky();
        //this.scene.add(this.sky.mesh);


        //Intiate 

        //this.calculateInitialPoints();
        //this.updatePoints();

        // Directly add objects
        this.scene.add(this.terrainMesh);
        this.objects.push(this.terrainMesh);



        //ProposPorcessing

        this.composer = new THREE.EffectComposer(this.renderer);

        var renderModel = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderModel);

        this.effectBloom = new THREE.BloomPass(1.3);
        this.effectBloom.renderToScreen = true;

        //this.effectBloom.blurX = 100;

        //new THREE.Vector2(0.001953125, 0.0);


        this.composer.addPass(this.effectBloom);


        this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        this.effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);
        //this.effectFXAA.renderToScreen = true;
        this.composer.addPass(this.effectFXAA);

        //Blurs
        var blurValue = 1 / 16;
        var tweenLength = 4;

        this.hBlurPass = new THREE.ShaderPass(THREE.HorizontalBlurShader);
        this.hBlurPass.uniforms['h'].value = 0;
        this.composer.addPass(this.hBlurPass);

        this.vBlurPass = new THREE.ShaderPass(THREE.VerticalBlurShader);
        this.vBlurPass.uniforms['v'].value = 0;
        this.composer.addPass(this.vBlurPass);

        TweenMax.from(this.hBlurPass.uniforms.h, tweenLength, {
            value: blurValue
        });
        TweenMax.from(this.vBlurPass.uniforms.v, tweenLength, {
            value: blurValue
        });

        //End Blurs

        this.effectCopy = new THREE.ShaderPass(THREE.CopyShader);
        this.effectCopy.renderToScreen = true;
        this.composer.addPass(this.effectCopy);

        //this.effectFilm = new THREE.FilmPass(0.5, 0.5, 1448, false);
        //this.effectFilm.renderToScreen = true;
        //this.composer.addPass(this.effectFilm);

        /* this.effectFocus = new THREE.ShaderPass(THREE.FocusShader);
        this.effectFocus.uniforms["screenWidth"].value = width;
        this.effectFocus.uniforms["screenHeight"].value = height;
        this.effectFocus.renderToScreen = true;
        this.composer.addPass(this.effectFocus);*/

    }



    Webgl.prototype.buildTerrainMesh = function (worldWidth, worldDepth) {
        var geometry = new THREE.PlaneBufferGeometry(50000, 50000, worldWidth - 1, worldDepth - 1);
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 4));



        var vertices = geometry.attributes.position.array;

        var data = this.generateHeight(256, 256);
        var basePos = new Float32Array(vertices.length);


        for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {

            vertices[j + 1] = data[i] * 10;
            basePos[j + 0] = vertices[j + 0];
            basePos[j + 1] = vertices[j + 1];
            basePos[j + 2] = vertices[j + 2];
        }

        geometry.addAttribute('basePos', new THREE.BufferAttribute(basePos, 1));

        //geometry.addAttribute('pushed', new THREE.BufferAttribute(values_pushed, 1));

        this.drawParticles(geometry);

        var material = new THREE.MeshBasicMaterial({
            color: 0x448844,
            shading: THREE.FlatShading,
            wireframe: false,
            wireframeLinewidth: 2,
            transparent: true
        });


        var mesh = new THREE.Mesh(geometry, material);
        //mesh.visible = false;
        return mesh;

    }

    Webgl.prototype.drawParticles = function (geometry) {
        this.geometry = geometry;
        this.lineAvgGeometry = new THREE.Geometry();
        this.lgeometry = new THREE.Geometry();
        this.lBassGeometry = new THREE.Geometry();

        var add = true,
            colors = [],
            particle, material = new THREE.ShaderMaterial({

                uniforms: uniforms,
                attributes: attributes,
                vertexShader: document.getElementById('vertexshader').textContent,
                fragmentShader: document.getElementById('fragmentshader').textContent,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                opacity: 0.7,
                // vertexColors: THREE.VertexColors,
            }),
            vertices = this.geometry.attributes.position.array,
            p = [3.5, 0xffffff, 0.5, 7],
            lmaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                opacity: 1,
                linewidth: p[3],
                vertexColors: THREE.VertexColors
            }),
            lAvgMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                opacity: 1,
                linewidth: 10,
                vertexColors: THREE.VertexColors
            }),
            lBassMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                opacity: 1,
                linewidth: 20,
                vertexColors: THREE.VertexColors
            });;


        var direction = new Float32Array(vertices.length);
        var positions = new Float32Array(vertices.length * 3);
        var values_color = new Float32Array(vertices.length * 3);
        var values_size = new Float32Array(vertices.length);
        var baseSize = new Float32Array(vertices.length);
        //var basePos= new Float32Array(vertices.length);

        var mover = new Float32Array(vertices.length);
        var scaler = new Float32Array(vertices.length);
        var liner = new Float32Array(vertices.length);

        //Freq data
        var frequency = new Float32Array(vertices.length);
        var color = new THREE.Color(0xffaa00);

        var linePositions = new Float32Array(vertices.length * 6);
        var linesColors = [];
        var linesAvgColors = [];
        var linesBassColors = [];

        for (var v = 0; v < vertices.length; v++) {

            //Particle type definition
            var isMover = Math.random() >= 0.50;
            var isLiner = Math.random() >= 0.99;


            liner[v] = isLiner;

            if (!isLiner) {
                mover[v] = isMover;
                scaler[v] = !isMover;
            }

            //PArticle size deifnition
            var size = Math.floor(Math.random() * 100) + 15;
            values_size[v] = size;
            baseSize[v] = size;


            //Particle Color definition
            values_color[v * 3 + 0] = color.r;
            values_color[v * 3 + 1] = color.g;
            values_color[v * 3 + 2] = color.b;

            if (vertices[v] < 0)
                color.setHSL(0.5 + 0.1 * (v / vertices.length), 0.7, 0.5);
            else
                color.setHSL(0.0 + 0.1 * (v / vertices.length), 0.9, 0.5);

            //Particles associated lines
            if (isLiner) {
                var isBass = Math.random() >= 0.70;
                var isAvg = Math.random() >= 0.40;


                var lgeometry = this.lBassGeometry;
                if (isAvg) {
                    if (isBass) {
                        var lbColor = new THREE.Color(0xE8590C);

                        if (v % 2 != 1)
                            lbColor.setHSL(0.1 + 0.1 * (v / vertices.length), 0.7, 0.5);
                        linesBassColors.push(lbColor);

                    } else {
                        lgeometry = this.lineAvgGeometry
                        var lacolor = new THREE.Color(0x440DFF);

                        if (v % 2 != 1)
                            lacolor.setHSL(0.1 + 0.1 * (v / vertices.length), 0.7, 0.5);

                        linesAvgColors.push(lacolor);
                    }
                } else {
                    lgeometry = this.lgeometry
                    var lcolor = new THREE.Color(0xffffff);

                    if (v % 2 != 1)
                        lcolor.setHSL(0.5 + 0.1 * (v / vertices.length), 0.7, 0.5);
                    else
                        lcolor.setHSL(0.0 + 0.1 * (v / vertices.length), 0.9, 0.5);

                    linesColors.push(lcolor);
                }

                var vertex1 = new THREE.Vector3();
                vertex1.x = vertices[v * 3 + 0];
                vertex1.y = vertices[v * 3 + 1];
                vertex1.z = vertices[v * 3 + 2];


                var vertex2 = vertex1.clone();
                vertex2.y += LINES_HEIGHT;
                vertex2.baseY = vertices[v * 3 + 1] + LINES_HEIGHT;

                lgeometry.vertices.push(vertex1);
                lgeometry.vertices.push(vertex2);
            }
        }

        this.lBassGeometry.colors = linesBassColors;
        this.lineAvgGeometry.colors = linesAvgColors;
        this.lgeometry.colors = linesColors;

        //this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.addAttribute('customColor', new THREE.BufferAttribute(values_color, 3));
        this.geometry.addAttribute('size', new THREE.BufferAttribute(values_size, 1));
        this.geometry.addAttribute('baseSize', new THREE.BufferAttribute(baseSize, 1));
        this.geometry.addAttribute('direction', new THREE.BufferAttribute(direction, 1));

        //Add types
        this.geometry.addAttribute('liner', new THREE.BufferAttribute(liner, 1));
        this.geometry.addAttribute('mover', new THREE.BufferAttribute(mover, 1));
        this.geometry.addAttribute('scaler', new THREE.BufferAttribute(scaler, 1));
        this.geometry.addAttribute('frequency', new THREE.BufferAttribute(frequency, 1));

        this.line = new THREE.Line(this.lgeometry, lmaterial, THREE.LinePieces);
        this.lineAvg = new THREE.Line(this.lineAvgGeometry, lAvgMaterial, THREE.LinePieces);
        this.lineBass = new THREE.Line(this.lBassGeometry, lBassMaterial, THREE.LinePieces);
        //this.line.scale.x = this.line.scale.y = this.line.scale.z = p[0];
        //this.line.originalScale = p[0];
        this.scene.add(this.line);
        this.scene.add(this.lineAvg);
        this.scene.add(this.lineBass);



        console.log(this.geometry);
        var pointcloud = new THREE.PointCloud(this.geometry, material);
        pointcloud.dynamic = true;

        this.scene.add(pointcloud);

    }


    Webgl.prototype.generateHeight = function (width, height) {

        var size = width * height,
            data = new Uint8Array(size),
            perlin = new ImprovedNoise(),
            quality = 1,
            z = Math.random() * 100;

        for (var j = 0; j < 4; j++) {

            for (var i = 0; i < size; i++) {

                var x = i % width,
                    y = ~~ (i / width);
                data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

            }

            quality *= 5;

        }

        return data;
    }

    Webgl.prototype.onDocumentMouseDown = function (event) {

        event.preventDefault();

        var vector = new THREE.Vector3();
        vector.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
        vector.unproject(this.camera);

        this.raycaster.ray.set(this.camera.position, vector.sub(this.camera.position).normalize());

        var intersects = this.raycaster.intersectObjects(this.objects);

        this.actor = INITIAL_FACTOR;
        if (intersects.length > 0) {

            //intersects[0].object.material.color.setHex(Math.random() * 0xffffff);

            //var particle = new THREE.Sprite(particleMaterial);
            //particle.position.copy(intersects[0].point);
            //particle.scale.x = particle.scale.y = 16;
            //this.scene.add(particle);

            //console.log(intersects[0].point);
        }
    }


    Webgl.prototype.calculateNextParameters = function () {
        rotation += ROTATION_SPEED;
        if (this.factor > 0) {
            this.factor -= DAMP_SPEED;
        }
    }

    Webgl.prototype.calculateInitialPoints = function () {
        for (var i = 0; i < this.geometry.vertices.length; i++) {
            var v = this.geometry.vertices[i];
            var x = (v.x /
                SEPARATION) * WAVE_SPEED;
            var y = (v.y / SEPARATION) * WAVE_SPEED;
            this.points[i] = WAVE_HEIGHT * (Math.cos(x * x + y * y) / Math.sqrt(x * x + y * y + 0.25));
        }
    }

    Webgl.prototype.render = function (songman) {



        var time = Date.now() * 0.005;
        this.songdata = new Uint8Array(songman.analyser.frequencyBinCount);
        songman.analyser.getByteFrequencyData(this.songdata);

        this.updatePoints(time, songman);
        this.upDateLines(time, songman);
        this.updateCamera(time, songman);
        songman.render();

        this.geometry.computeFaceNormals();
        this.geometry.computeVertexNormals();

        this.lBassGeometry.verticesNeedUpdate = true;
        this.lineAvgGeometry.verticesNeedUpdate = true;
        this.lgeometry.verticesNeedUpdate = true;

        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.customColor.needsUpdate = true;

        this.composer.render();
        //this.renderer.render(this.scene, this.camera);
        //console.log("intensity %s | volume : %s [ avg  : %s", intensity, volume, avg);
    };

    Webgl.prototype.updateCamera = function (time, songman) {
        var intensity = songman.getSoundDataIntensity(this.songdata);
        this.camera.position.x = Math.cos(time * 0.01) * 20000;
        this.camera.position.z = Math.sin(time * 0.01) * 20000;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        if ((this.bigTime == true) && (this.camera.position.y <= CAMERA_INITIAL_Y + 100) && this.canJumpTime <= 2) {
            TweenMax.from(this.camera.position, 5, {
                y: CAMERA_INITIAL_Y + 5000
            });

        } else if (this.calming == true && this.camera.position.y > CAMERA_INITIAL_Y + 5000) {

            /*TweenMax.from(this.camera.position, 10, {
                y: CAMERA_INITIAL_Y
            });*/
        }
    }

    Webgl.prototype.updatePoints = function (time, songman) {

        var size = this.geometry.attributes.size.array;
        var vertice = this.geometry.attributes.position.array;
        var colors = this.geometry.attributes.customColor;
        var direction = this.geometry.attributes.direction.array;
        var baseSize = this.geometry.attributes.baseSize.array;
        var basePos = this.geometry.attributes.basePos.array;

        var mover = this.geometry.attributes.mover.array;
        var scaler = this.geometry.attributes.scaler.array;
        var liner = this.geometry.attributes.liner.array;

        var frequency = this.geometry.attributes.frequency.array;

        var avg = songman.getSoundDataAverage(this.songdata);

        var intensity = songman.getSoundDataIntensity(this.songdata);
        var volume = songman.getAverageVolume(this.songdata);

        var $$ = this;
        songman.doBeat(this.songdata, function () {
            $$.terrainMesh.material.color.setHex(Math.random() * 0xffffff);
        });

        this.bigTime = (intensity > 79);
        if (this.bigTime) {
            this.canJumpTime++
        } else if (this.caJumpTime > 15) {
            //this.calming = true;
            this.bigTime = false;
            this.canJumpTime = 0
        }

        for (var i = 0, j = 0, l = vertice.length; i < l; i++, j += 3) {

            if (frequency[i] === 0) {
                frequency[i] = Math.floor(Math.random() * this.songdata.length / 2);
            }

            //this.songdata[frequency[i]];
            //this.songdata[i % this.songdata.length];

            //___Particles jump
            var avgDestValue = (basePos[j + 1] + avg) * 3;

            if (scaler[i]) {
                //var vertDestValue = baseSize[i] + (this.bigTime ? avg + (baseSize[i] / 2) : (avg / 1.99));
                //size[i] += (vertDestValue - size[i]) * 0.6;
                //size[i] = 14 + 13 * Math.sin(0.1 * i + time);
            } else {


                //this.caJumpTime = this.bigTime ? this.canJumpTime++ : this.caJumpTime > 15 ? 0;

                //75 for more tolerance
                var vertDestValue = basePos[j + 1] + (this.bigTime ? avg + (basePos[j + 1] / 2) : (avg / 1.5));
                vertice[j + 1] += (vertDestValue - vertice[j + 1]) * 0.6;

                //move(vertice[j + 1], basePos[j + 1], direction[i]);
            }
        }
    }

    //___Lines jump
    Webgl.prototype.upDateLines = function (time, songman) {

        var avg = songman.getSoundDataAverage(this.songdata);
        var intensity = songman.getSoundDataIntensity(this.songdata);
        var volume = songman.getAverageVolume(this.songdata);

        var lines = this.lgeometry.vertices;
        var linesAvg = this.lineAvgGeometry.vertices;
        var linesBass = this.lBassGeometry.vertices;

        //intensity > 80 && console.log(this.songdata);

        for (var i = 0; i < lines.length; i += 2) {

            //pick a random indice in array could be : (i % this.songdata.length);
            if (!lines[i + 1].hasOwnProperty('note'))
                lines[i + 1].note = Math.floor(Math.random() * this.songdata.length / 2);

            var songD = this.songdata[lines[i + 1].note];
            if (lines[i + 1]) {
                var value = lines[i + 1].baseY + (LINES_HEIGHT + (songD * 15));
                lines[i + 1].y += (value - lines[i + 1].y) * 0.6;
            }
        };

        for (var i = 0; i < linesAvg.length; i += 2) {

            var multiplier = intensity > 80 ? intensity : 1;

            var songD = this.songdata[i % this.songdata.length];
            if (linesAvg[i + 1]) {
                var value = linesAvg[i + 1].baseY + (((LINES_HEIGHT * 1.5) + (avg * 30)) * (avg / avg));
                linesAvg[i + 1].y += (value - linesAvg[i + 1].y) * 0.6;
            }
        };

        //TODO : indice attribute value to line
        //Bass
        for (var i = 0; i < linesBass.length; i += 2) {

            var songD = this.songdata[Math.floor(Math.random() * 5) + 1];
            if (linesBass[i + 1]) {
                var value = linesBass[i + 1].baseY + (1 * songD);
                linesBass[i + 1].y += (value - linesBass[i + 1].y) * 0.6;
            }
        };
    }

    //this.move(vertice[j + 1], basePos[j + 1], direction[i]);
    Webgl.prototype.move = function (vertice, base, direction) {
        if (vertice == base) {
            direction = 1;
        } else if (vertice == base + 30) {
            direction = -1;
        }
        vertice = vertice + direction;



        if (vertice[j + 1] == basePos[j + 1]) {
            direction[i] = 1;
        } else if (vertice[j + 1] == basePos[j + 1] + 30) {
            direction[i] = -1;
        }
        vertice[j + 1] = vertice[j + 1] + direction[i];
    };

    Webgl.prototype.scale = function (width, height) {
        //vertice[j + 1] = basePos[j + 1] * Math.sin(j / 5 + (time + j) / 7);
        //size[i] = 14 + 13 * Math.sin(0.1 * i + time);
        if (size[i] <= 1) {
            direction[i] = 1;
        } else if (size[i] == baseSize[i]) {
            direction[i] = -1;
        }
        size[i] += direction[i];
    };


    Webgl.prototype.resize = function (width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.reset();

        //this.controls.handleResize();
    };


    return Webgl;

})();