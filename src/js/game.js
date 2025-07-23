// This file contains the main game loop and controls the overall game state. 
// It initializes the game, updates the game state, and renders the game elements on the canvas.

$(document).ready(function() {
    class GolfGame {
        constructor() {
            this.stage = null;
            this.gameLayer = null;
            this.uiLayer = null;
            this.ball = null;
            this.physics = null;
            this.inputHandler = null;
            this.obstacles = [];
            this.camera = { x: 0, y: 0 };
            this.score = 0;
            this.shots = 0;
            this.isRunning = false;
            
            // Visual elements
            this.ballVisual = null;
            this.trailVisual = null;
            
            // DEBUG: Set to false to disable collisions
            this.collisionsEnabled = true;
            
            // Level management
            this.currentLevel = 1;
            this.level = null;
            this.hole = null;
            this.levelComplete = false;
            
            // Level bounds
            this.minLevelLength = 1200;
            this.maxLevelLength = 4000;
        }

        init() {
            // Initialize Konva stage
            this.stage = new Konva.Stage({
                container: 'game-canvas',
                width: window.innerWidth,
                height: window.innerHeight
            });

            // Create layers
            this.gameLayer = new Konva.Layer();
            this.uiLayer = new Konva.Layer();
            this.stage.add(this.gameLayer);
            this.stage.add(this.uiLayer);

            // Initialize game components
            this.physics = new Physics();
            this.ball = new Ball(100, this.physics.groundY - 8);
            this.inputHandler = new InputHandler(this);

            // Load first level
            this.loadLevel(this.currentLevel);

            // Start game loop
            this.startGame();
        }

        loadLevel(levelNumber) {
            // Clear previous level
            this.gameLayer.destroyChildren();
            this.obstacles = [];
            this.levelComplete = false;
            this.shots = 0;

            // Create new level
            this.level = new Level(levelNumber, this.minLevelLength, this.maxLevelLength);
            this.level.generateObstacles();

            // Create ground (extend to level length)
            this.createGround();

            // Create obstacles
            this.createObstacles();

            // Create hole
            this.createHole();

            // Reset ball position
            this.ball.reset(100, this.physics.groundY - 8);
            this.createBallVisual();

            // Reset camera
            this.camera.x = 0;
            this.gameLayer.x(0);

            // Update UI
            this.updateUI();
            
            this.gameLayer.batchDraw();
        }

        createGround() {
            const ground = new Konva.Rect({
                x: 0,
                y: this.physics.groundY,
                width: this.level.length + 500, // Extra length past hole
                height: window.innerHeight - this.physics.groundY,
                fill: '#2d5016'
            });
            this.gameLayer.add(ground);

            // Create putting green around hole
            const puttingGreen = new Konva.Rect({
                x: this.level.puttingAreaStart,
                y: this.physics.groundY,
                width: this.level.length - this.level.puttingAreaStart + 200,
                height: window.innerHeight - this.physics.groundY,
                fill: '#228B22'
            });
            this.gameLayer.add(puttingGreen);
        }

        createObstacles() {
            this.level.obstacles.forEach(obstacleData => {
                let obstacle;
                
                // Adjust y position to ground level
                obstacleData.y = this.physics.groundY - obstacleData.height;
                
                if (obstacleData.type === 'tower') {
                    obstacle = new Konva.Rect({
                        x: obstacleData.x,
                        y: obstacleData.y,
                        width: obstacleData.width,
                        height: obstacleData.height,
                        fill: '#8B4513',
                        stroke: '#654321',
                        strokeWidth: 2
                    });
                } else if (obstacleData.type === 'water') {
                    obstacleData.y = this.physics.groundY; // Water sits on ground
                    obstacle = new Konva.Rect({
                        x: obstacleData.x,
                        y: obstacleData.y,
                        width: obstacleData.width,
                        height: obstacleData.height,
                        fill: '#0066cc',
                        opacity: 0.8
                    });
                } else if (obstacleData.type === 'ramp') {
                    const points = [
                        obstacleData.x, this.physics.groundY,
                        obstacleData.x + obstacleData.width, this.physics.groundY,
                        obstacleData.x + obstacleData.width, obstacleData.y,
                        obstacleData.x, this.physics.groundY
                    ];
                    obstacle = new Konva.Line({
                        points: points,
                        fill: '#654321',
                        closed: true
                    });
                }
                
                this.gameLayer.add(obstacle);
                this.obstacles.push(obstacleData);
            });
        }

        createHole() {
            const holeData = this.level.createHole(this.physics.groundY);
            this.hole = new Hole(holeData.x, holeData.y, holeData.radius);
            
            const holeVisuals = this.hole.createVisual();
            this.gameLayer.add(holeVisuals.hole);
            this.gameLayer.add(holeVisuals.flag);
        }

        createBallVisual() {
            this.ballVisual = new Konva.Circle({
                x: this.ball.x,
                y: this.ball.y,
                radius: this.ball.radius,
                fill: 'white',
                stroke: 'black',
                strokeWidth: 1
            });
            
            // Create trail visual
            this.trailVisual = new Konva.Line({
                points: [],
                stroke: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 3,
                lineCap: 'round',
                lineJoin: 'round'
            });
            
            this.gameLayer.add(this.trailVisual);
            this.gameLayer.add(this.ballVisual);
        }

        hitBall(velocityX, velocityY) {
            if (this.levelComplete) return;
            
            this.ball.setVelocity(velocityX, velocityY);
            this.shots++;
            this.updateUI();
        }

        update() {
            if (!this.isRunning) return;

            // Update physics
            this.physics.updateBall(this.ball);

            // Update ball trail
            this.ball.updateTrail();

            // Update ball visual position
            this.ballVisual.x(this.ball.x);
            this.ballVisual.y(this.ball.y);

            // Update trail visual
            this.updateTrailVisual();

            // Camera follow ball but stop at putting area
            if (this.ball.isMoving) {
                this.camera.x = Math.min(
                    this.ball.x - window.innerWidth / 4,
                    this.level.puttingAreaStart - window.innerWidth / 2
                );
                this.gameLayer.x(-this.camera.x);
            }

            // Check collisions
            if (this.collisionsEnabled) {
                this.checkCollisions();
            }

            // Check if ball reached hole
            if (this.hole.checkBallInHole(this.ball)) {
                this.completeLevel();
            }

            // Check if ball went too far
            if (this.ball.x > this.level.length + 200 ) {
                this.resetBallToStart();
            }

            // Redraw
            this.gameLayer.batchDraw();

            // Continue game loop
            requestAnimationFrame(() => this.update());
        }

        updateTrailVisual() {
            const trailPoints = this.ball.getTrailPoints();
            
            if (trailPoints.length < 2) {
                this.trailVisual.points([]);
                return;
            }

            // Convert trail points to flat array for Konva
            const points = [];
            trailPoints.forEach(point => {
                points.push(point.x, point.y);
            });

            this.trailVisual.points(points);

            // Create fading effect by using gradient or multiple lines with different opacities
            this.createFadingTrail(trailPoints);
        }

        createFadingTrail(trailPoints) {
            // Remove old trail segments
            const oldTrails = this.gameLayer.find('.trail-segment');
            oldTrails.forEach(trail => trail.destroy());

            // Create multiple trail segments with fading opacity
            for (let i = 0; i < trailPoints.length - 1; i++) {
                const opacity = (i + 1) / trailPoints.length; // Fade from 0 to 1
                const strokeWidth = 2 + (opacity * 2); // Vary thickness too
                
                const trailSegment = new Konva.Line({
                    points: [
                        trailPoints[i].x, trailPoints[i].y,
                        trailPoints[i + 1].x, trailPoints[i + 1].y
                    ],
                    stroke: `rgba(255, 255, 255, ${opacity * 0.8})`,
                    strokeWidth: strokeWidth,
                    lineCap: 'round',
                    lineJoin: 'round',
                    name: 'trail-segment'
                });
                
                this.gameLayer.add(trailSegment);
            }
            
            // Move trail segments behind the ball
            this.ballVisual.moveToTop();
        }

        checkCollisions() {
            const ballBounds = this.ball.getBounds();
            
            for (const obstacle of this.obstacles) {
                if (ballBounds.right > obstacle.x && 
                    ballBounds.left < obstacle.x + obstacle.width &&
                    ballBounds.bottom > obstacle.y && 
                    ballBounds.top < obstacle.y + obstacle.height) {
                
                    if (obstacle.type === 'tower') {
                        // Determine which side of the obstacle the ball hit
                        const ballCenterX = this.ball.x;
                        const obstacleCenterX = obstacle.x + obstacle.width / 2;
                        
                        if (ballCenterX < obstacleCenterX) {
                            // Ball hit from the left side
                            this.ball.velocityX *= -0.5;
                            this.ball.x = obstacle.x - this.ball.radius - 1;
                        } else {
                            // Ball hit from the right side
                            this.ball.velocityX *= -0.5;
                            this.ball.x = obstacle.x + obstacle.width + this.ball.radius + 1;
                        }
                        
                        // Add some vertical bounce for more realistic physics
                        if (Math.abs(this.ball.velocityY) < 1) {
                            this.ball.velocityY = -2; // Small upward bounce
                        }
                        
                    } else if (obstacle.type === 'water') {
                        // Ball stops in water - reset to start
                        this.resetBallToStart();
                    } else if (obstacle.type === 'ramp') {
                        // Handle ramp collision (ball bounces up the ramp)
                        const rampAngle = Math.atan2(-obstacle.height, obstacle.width);
                        const speed = Math.sqrt(this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY);
                        
                        this.ball.velocityX = speed * Math.cos(rampAngle) * 0.8;
                        this.ball.velocityY = speed * Math.sin(rampAngle) * 0.8;
                    }
                }
            }
        }

        completeLevel() {
            if (this.levelComplete) return; // Prevent multiple calls
            
            this.levelComplete = true;
            
            // Calculate score
            const scoreDiff = this.shots - this.level.par;
            let scoreText = "";
            
            if (scoreDiff <= -2) scoreText = "Eagle!";
            else if (scoreDiff === -1) scoreText = "Birdie!";
            else if (scoreDiff === 0) scoreText = "Par!";
            else if (scoreDiff === 1) scoreText = "Bogey";
            else scoreText = "Over Par";

            // Show completion message
            alert(`Level ${this.currentLevel} Complete!\n${scoreText}\nShots: ${this.shots} | Par: ${this.level.par}`);
            
            // Load next level
            setTimeout(() => {
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
            }, 1000);
        }

        resetBallToStart() {
            this.ball.reset(100, this.physics.groundY - 8);
            this.ballVisual.x(this.ball.x);
            this.ballVisual.y(this.ball.y);
            this.camera.x = 0;
            this.gameLayer.x(0);
            this.shots++;
            this.updateUI();
        }

        updateUI() {
            $('#score').text(`Level: ${this.currentLevel} | Shots: ${this.shots} | Par: ${this.level ? this.level.par : 0}`);
        }

        startGame() {
            this.isRunning = true;
            this.update();
        }
    }

    // Make GolfGame available globally
    window.GolfGame = GolfGame;

    const game = new GolfGame();
    game.init();
});