// Physics engine for the golf game
class Physics {
    constructor() {
        this.gravity = 0.5;
        this.friction = 0.98;
        this.airResistance = 0.999;
        this.bounceReduction = 0.7;
        this.groundY = window.innerHeight - 100; // Ground level
    }

    // Apply gravity to a ball
    applyGravity(ball) {
        ball.velocityY += this.gravity;
    }

    // Apply friction when ball is on ground
    applyFriction(ball) {
        if (ball.y >= this.groundY - ball.radius) {
            ball.velocityX *= this.friction;
        }
    }

    // Apply air resistance
    applyAirResistance(ball) {
        ball.velocityX *= this.airResistance;
        ball.velocityY *= this.airResistance;
    }

    // Handle ground collision
    handleGroundCollision(ball) {
        if (ball.y + ball.radius >= this.groundY) {
            ball.y = this.groundY - ball.radius;
            ball.velocityY *= -this.bounceReduction;
            
            // Stop tiny bounces
            if (Math.abs(ball.velocityY) < 2) {
                ball.velocityY = 0;
            }
        }
    }

    // Update ball physics
    updateBall(ball) {
        if (!ball.isMoving) return;

        // Apply forces
        this.applyGravity(ball);
        this.applyAirResistance(ball);

        // Update position
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // Handle ground collision
        this.handleGroundCollision(ball);

        // Apply friction if on ground
        if (ball.y >= this.groundY - ball.radius) {
            this.applyFriction(ball);
        }

        // Stop ball if velocity is very low
        if (Math.abs(ball.velocityX) < 0.1 && Math.abs(ball.velocityY) < 0.1 && 
            ball.y >= this.groundY - ball.radius) {
            ball.velocityX = 0;
            ball.velocityY = 0;
            ball.isMoving = false;
        }
    }

    // Calculate trajectory for aiming preview
    calculateTrajectory(startX, startY, velocityX, velocityY, steps = 50) {
        const points = [];
        let x = startX;
        let y = startY;
        let vx = velocityX;
        let vy = velocityY;

        for (let i = 0; i < steps; i++) {
            points.push({ x, y });
            
            // Apply physics
            vy += this.gravity;
            vx *= this.airResistance;
            vy *= this.airResistance;
            
            x += vx;
            y += vy;

            // Stop if hits ground
            if (y >= this.groundY) {
                points.push({ x, y: this.groundY });
                break;
            }
        }

        return points;
    }
}

// Make Physics available globally
window.Physics = Physics;