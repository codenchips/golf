// This file handles user input, including mouse and touch events for dragging to set the angle and velocity of the ball hit.

$(document).ready(function() {
    class InputHandler {
        constructor(game) {
            this.game = game;
            this.isDragging = false;
            this.startX = 0;
            this.startY = 0;
            this.endX = 0;
            this.endY = 0;
            this.aimLine = null;
            this.trajectoryLine = null;
            this.maxPower = 20; // Maximum shot power
            
            this.setupEventListeners();
        }
    
        setupEventListeners() {
            const stage = this.game.stage;
            
            // Mouse and touch start
            stage.on('mousedown touchstart', (e) => {
                if (this.game.ball.isMoving) return; // Don't allow input while ball is moving
                
                this.isDragging = true;
                const pos = this.getWorldPosition(stage.getPointerPosition());
                this.startX = pos.x;
                this.startY = pos.y;
                
                // Create aim line and trajectory preview
                this.createAimVisualization();
            });

            // Mouse and touch move
            stage.on('mousemove touchmove', (e) => {
                if (!this.isDragging || this.game.ball.isMoving) return;
                
                const pos = this.getWorldPosition(stage.getPointerPosition());
                this.endX = pos.x;
                this.endY = pos.y;
                
                // Update aim visualization
                this.updateAimVisualization();
            });

            // Mouse and touch end
            stage.on('mouseup touchend', (e) => {
                if (!this.isDragging || this.game.ball.isMoving) return;
                
                this.isDragging = false;
                
                // Calculate and apply shot
                this.executeShot();
                
                // Clean up visualization
                this.clearAimVisualization();
            });
        }

        // Convert screen coordinates to world coordinates
        getWorldPosition(screenPos) {
            return {
                x: screenPos.x - this.game.gameLayer.x(), // Adjust for camera offset
                y: screenPos.y - this.game.gameLayer.y()  // Adjust for camera offset
            };
        }

        createAimVisualization() {
            // Create aim line to show shot direction
            this.aimLine = new Konva.Line({
                points: [this.game.ball.x, this.game.ball.y, this.game.ball.x, this.game.ball.y],
                stroke: 'white',
                strokeWidth: 3,
                dash: [5, 5]
            });
            
            // Create trajectory preview line
            this.trajectoryLine = new Konva.Line({
                points: [],
                stroke: 'rgba(255, 255, 0, 0.8)',
                strokeWidth: 2,
                dash: [10, 5],
                lineCap: 'round'
            });
            
            // Add to gameLayer instead of uiLayer so they move with camera
            this.game.gameLayer.add(this.aimLine);
            this.game.gameLayer.add(this.trajectoryLine);
        }
    
        updateAimVisualization() {
            if (!this.aimLine || !this.trajectoryLine) return;
            
            // Calculate direction (opposite to drag)
            const deltaX = this.startX - this.endX;
            const deltaY = this.startY - this.endY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance < 5) {
                this.aimLine.points([this.game.ball.x, this.game.ball.y, this.game.ball.x, this.game.ball.y]);
                this.trajectoryLine.points([]);
                this.game.gameLayer.batchDraw();
                return;
            }
            
            // Aim line shows pull direction (same as drag direction)
            const aimDeltaX = this.endX - this.startX; // Opposite of trajectory direction
            const aimDeltaY = this.endY - this.startY; // Opposite of trajectory direction
            
            // Limit the line length for better visualization
            const maxLineLength = 100;
            const lineLength = Math.min(distance, maxLineLength);
            const aimNormalizedX = (aimDeltaX / distance) * lineLength;
            const aimNormalizedY = (aimDeltaY / distance) * lineLength;
            
            // Update aim line (shows pull direction)
            this.aimLine.points([
                this.game.ball.x, 
                this.game.ball.y,
                this.game.ball.x + aimNormalizedX,
                this.game.ball.y + aimNormalizedY
            ]);
            
            // Calculate trajectory preview (ball goes opposite to pull direction)
            const powerMultiplier = 0.3;
            const velocityX = deltaX * powerMultiplier; // Ball direction (opposite to pull)
            const velocityY = deltaY * powerMultiplier; // Ball direction (opposite to pull)
            
            const trajectoryPoints = this.calculateTrajectoryPreview(
                this.game.ball.x, 
                this.game.ball.y, 
                velocityX, 
                velocityY
            );
            
            // Convert to flat array for Konva
            const flatPoints = [];
            trajectoryPoints.forEach(point => {
                flatPoints.push(point.x, point.y);
            });
            
            this.trajectoryLine.points(flatPoints);
            
            // Update power meter
            const power = Math.min(distance / 10, this.maxPower);
            this.updatePowerMeter(power);
            
            this.game.gameLayer.batchDraw();
        }

        calculateTrajectoryPreview(startX, startY, velocityX, velocityY) {
            const points = [];
            let x = startX;
            let y = startY;
            let vx = velocityX;
            let vy = velocityY;
            
            const maxSteps = 100;
            const timeStep = 1;
            
            points.push({ x, y });
            
            for (let step = 0; step < maxSteps; step++) {
                // Apply physics (simplified version of the real physics)
                vy += this.game.physics.gravity * timeStep;
                vx *= this.game.physics.airResistance;
                vy *= this.game.physics.airResistance;
                
                // Update position
                x += vx * timeStep;
                y += vy * timeStep;
                
                // Check ground collision
                if (y >= this.game.physics.groundY) {
                    // Add the ground hit point
                    points.push({ x, y: this.game.physics.groundY });
                    break; // Stop at first bounce
                }
                
                // Check obstacle collision
                const hitObstacle = this.checkTrajectoryObstacleCollision(x, y);
                if (hitObstacle) {
                    // Add the collision point
                    points.push({ x, y });
                    break; // Stop at first obstacle hit
                }
                
                points.push({ x, y });
                
                // Stop if velocity is very low or ball goes too far
                if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) break;
                if (x > this.game.level.length + 500) break;
            }
            
            return points;
        }

        checkTrajectoryObstacleCollision(x, y) {
            const ballRadius = this.game.ball.radius;
            
            // Check collision with obstacles
            for (const obstacle of this.game.obstacles) {
                if (x + ballRadius > obstacle.x && 
                    x - ballRadius < obstacle.x + obstacle.width &&
                    y + ballRadius > obstacle.y && 
                    y - ballRadius < obstacle.y + obstacle.height) {
                    return true;
                }
            }
            
            return false;
        }
    
        updatePowerMeter(power) {
            const powerPercent = (power / this.maxPower) * 100;
            $('#power-meter .fill').css('width', powerPercent + '%');
            
            // Update angle display
            const deltaX = this.startX - this.endX;
            const deltaY = this.startY - this.endY;
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            $('#angle-indicator').text(`Angle: ${Math.round(angle)}°`);
        }
    
        executeShot() {
            // Calculate shot parameters (opposite to drag direction)
            const deltaX = this.startX - this.endX;
            const deltaY = this.startY - this.endY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance < 5) return; // Minimum drag distance
            
            // Scale velocity based on drag distance
            const powerMultiplier = 0.3;
            const velocityX = deltaX * powerMultiplier;
            const velocityY = deltaY * powerMultiplier;
            
            // Apply velocity to ball
            this.game.hitBall(velocityX, velocityY);
        }
    
        clearAimVisualization() {
            if (this.aimLine) {
                this.aimLine.destroy();
                this.aimLine = null;
            }
            
            if (this.trajectoryLine) {
                this.trajectoryLine.destroy();
                this.trajectoryLine = null;
            }
            
            // Reset power meter
            $('#power-meter .fill').css('width', '0%');
            $('#angle-indicator').text('Angle: 0°');
            
            this.game.gameLayer.batchDraw();
        }
    }
    
    // Make InputHandler available globally
    window.InputHandler = InputHandler;

    let isDragging = false;
    let startX, startY, endX, endY;

    const canvas = document.getElementById('game-canvas');
    const stage = new Konva.Stage({
        container: 'game-canvas',
        width: window.innerWidth,
        height: window.innerHeight
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    stage.on('mousedown touchstart', function(e) {
        isDragging = true;
        const pos = stage.getPointerPosition();
        startX = pos.x;
        startY = pos.y;
    });

    stage.on('mousemove touchmove', function(e) {
        if (!isDragging) return;
        const pos = stage.getPointerPosition();
        endX = pos.x;
        endY = pos.y;
        // Optionally, you can visualize the drag line here
    });

    stage.on('mouseup touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;

        const angle = Math.atan2(endY - startY, endX - startX);
        const velocity = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        // Trigger the ball hit with the calculated angle and velocity
        hitBall(angle, velocity);
    });

    function hitBall(angle, velocity) {
        // Implement the logic to hit the ball with the given angle and velocity
        console.log(`Ball hit with angle: ${angle}, velocity: ${velocity}`);
    }
});