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

            // In the constructor, create collision detector
            this.collisionDetector = null;
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

            // Create collision detector
            this.collisionDetector = new CollisionDetector(this.physics);

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
            const holeData = this.level.createHole(this.physics.groundY); // Pass the actual ground Y
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

            // Update physics (this will skip resting balls)
            this.physics.updateBall(this.ball);

            // Only update trail and visuals if ball is moving
            if (this.ball.isMoving) {
                this.ball.updateTrail();
                this.updateTrailVisual();
                
                // Camera follow
                this.camera.x = Math.min(
                    this.ball.x - window.innerWidth / 4,
                    this.level.puttingAreaStart - window.innerWidth / 2
                );
                this.gameLayer.x(-this.camera.x);
            }

            // Always update ball visual position
            this.ballVisual.x(this.ball.x);
            this.ballVisual.y(this.ball.y);

            // Check collisions only if ball is moving
            if (this.collisionsEnabled && this.ball.isMoving) {
                this.checkCollisions();
            }

            // Check hole only if ball is moving slowly (not resting)
            if (this.hole && !this.ball.isResting && this.hole.checkBallInHole(this.ball)) {
                this.completeLevel();
            }

            // Check bounds
            if (this.ball.x > this.level.length + 200) {
                this.resetBallToStart();
            }

            this.gameLayer.batchDraw();
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
            if (!this.collisionsEnabled) return;
            
            const result = this.collisionDetector.checkCollisions(this.ball, this.obstacles);
            
            // Handle special collision results
            if (result === 'reset') {
                this.resetBallToStart();
            }
        }

        handleTowerCollision(obstacle) {
            const ball = this.ball;
            
            // Calculate overlap on each axis
            const overlapLeft = (ball.x + ball.radius) - obstacle.x;
            const overlapRight = (obstacle.x + obstacle.width) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - obstacle.y;
            const overlapBottom = (obstacle.y + obstacle.height) - (ball.y - ball.radius);
            
            // Find the minimum overlap to determine collision direction
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            
            // Apply collision response based on smallest overlap
            if (minOverlapX < minOverlapY) {
                // Horizontal collision (side impact)
                if (overlapLeft < overlapRight) {
                    // Hit left side of obstacle
                    ball.x = obstacle.x - ball.radius - 1;
                    ball.velocityX = Math.abs(ball.velocityX) * -0.7; // Bounce left with energy loss
                } else {
                    // Hit right side of obstacle
                    ball.x = obstacle.x + obstacle.width + ball.radius + 1;
                    ball.velocityX = Math.abs(ball.velocityX) * 0.7; // Bounce right with energy loss
                }
            } else {
                // Vertical collision (top/bottom impact)
                if (overlapTop < overlapBottom) {
                    // Hit top of obstacle - ball bounces up and continues horizontal motion
                    ball.y = obstacle.y - ball.radius - 1;
                    ball.velocityY = Math.abs(ball.velocityY) * -0.8; // Bounce up with some energy loss
                    ball.velocityX *= 0.9; // Slight horizontal friction but maintain direction
                } else {
                    // Hit bottom of obstacle (rare case)
                    ball.y = obstacle.y + obstacle.height + ball.radius + 1;
                    ball.velocityY = Math.abs(ball.velocityY) * 0.8; // Bounce down
                    ball.velocityX *= 0.9; // Slight horizontal friction
                }
            }
            
            // Ensure minimum bounce velocity for realistic physics
            if (Math.abs(ball.velocityX) < 0.5) ball.velocityX = 0;
            if (Math.abs(ball.velocityY) < 0.5) ball.velocityY = 0;
        }

    handleRampCollision(obstacle) {
        const ball = this.ball;
        
        // Calculate ball speed
        const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
        
        // Calculate ramp angle (assuming ramp slopes up from left to right)
        const rampAngle = Math.atan2(-obstacle.height, obstacle.width);
        const rampSlope = Math.tan(rampAngle);
        
        // Determine which side of ramp the ball hit
        const ballRelativeX = ball.x - obstacle.x;
        const rampHeightAtBall = obstacle.y + obstacle.height - (ballRelativeX / obstacle.width) * obstacle.height;
        
        // Position ball on ramp surface
        ball.y = rampHeightAtBall - ball.radius;
        
        // Speed threshold for bouncing vs rolling
        const bounceThreshold = 8; // Fast balls bounce, slow balls roll
        
        if (speed > bounceThreshold) {
            // Fast ball - bounce off ramp
            this.handleRampBounce(ball, rampAngle, speed);
        } else {
            // Slow ball - roll up/down ramp
            this.handleRampRoll(ball, rampAngle, rampSlope, obstacle);
        }
    }

    handleRampBounce(ball, rampAngle, speed) {
        // Calculate incoming angle
        const incomingAngle = Math.atan2(ball.velocityY, ball.velocityX);
        
        // Calculate normal to ramp surface
        const normalAngle = rampAngle + Math.PI / 2;
        
        // Reflect velocity off the ramp
        const reflectedAngle = 2 * normalAngle - incomingAngle;
        
        // Apply reflected velocity with some energy loss
        const energyRetention = 0.7;
        ball.velocityX = Math.cos(reflectedAngle) * speed * energyRetention;
        ball.velocityY = Math.sin(reflectedAngle) * speed * energyRetention;
        
        // Ensure ball bounces upward if it was going down
        if (ball.velocityY > 0) {
            ball.velocityY = -Math.abs(ball.velocityY);
        }
    }

    handleRampRoll(ball, rampAngle, rampSlope, obstacle) {
        // Convert horizontal velocity to velocity along the ramp
        const rampDirection = Math.sign(ball.velocityX); // 1 for right, -1 for left
        
        // Calculate velocity component along the ramp
        const velocityAlongRamp = ball.velocityX * Math.cos(rampAngle) + ball.velocityY * Math.sin(rampAngle);
        
        // Apply gravity component along the ramp
        const gravityAlongRamp = this.physics.gravity * Math.sin(rampAngle);
        
        // Rolling friction
        const rollingFriction = 0.95;
        
        // Update velocity along ramp (considering gravity pulling down the slope)
        let newVelocityAlongRamp = velocityAlongRamp * rollingFriction;
        
        // Add gravity component (positive = down the ramp, negative = up the ramp)
        if (rampDirection > 0) {
            // Ball moving right (up the ramp) - gravity slows it down
            newVelocityAlongRamp -= gravityAlongRamp * 0.3;
        } else {
            // Ball moving left (down the ramp) - gravity speeds it up
            newVelocityAlongRamp += gravityAlongRamp * 0.3;
        }
        
        // Convert back to x,y components
        ball.velocityX = newVelocityAlongRamp * Math.cos(rampAngle);
        ball.velocityY = newVelocityAlongRamp * Math.sin(rampAngle);
        
        // If ball is moving very slowly, let it settle on the ramp
        if (Math.abs(newVelocityAlongRamp) < 0.5) {
            ball.velocityX *= 0.8;
            ball.velocityY = 0; // Stop vertical movement when settled
        }
        
        // Ensure ball stays on ramp surface
        const ballRelativeX = ball.x - obstacle.x;
        if (ballRelativeX >= 0 && ballRelativeX <= obstacle.width) {
            const rampHeightAtBall = obstacle.y + obstacle.height - (ballRelativeX / obstacle.width) * obstacle.height;
            ball.y = Math.min(ball.y, rampHeightAtBall - ball.radius);
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