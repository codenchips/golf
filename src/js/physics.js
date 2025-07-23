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
        if (ball.isResting) return; // Don't update resting balls
    
        // Apply gravity
        ball.velocityY += this.gravity;
    
        // Apply air resistance
        ball.velocityX *= this.airResistance;
        ball.velocityY *= this.airResistance;
    
        // Update position
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;
    
        // Ground collision
        if (ball.y + ball.radius >= this.groundY) {
            ball.y = this.groundY - ball.radius;
            ball.velocityY *= -this.bounceReduction;
            ball.velocityX *= this.friction;
            
            // Stop tiny bounces
            if (Math.abs(ball.velocityY) < 1) {
                ball.velocityY = 0;
            }
        }
    
        // Check if ball should rest
        ball.checkForRest();
    
        // Update moving state
        const totalVelocity = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
        ball.isMoving = totalVelocity > 0.1 && !ball.isResting;
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