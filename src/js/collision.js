function detectCollision(ball, obstacles) {
    for (let obstacle of obstacles) {
        if (isColliding(ball, obstacle)) {
            handleCollision(ball, obstacle);
        }
    }
}

function isColliding(ball, obstacle) {
    const ballBounds = {
        left: ball.x - ball.radius,
        right: ball.x + ball.radius,
        top: ball.y - ball.radius,
        bottom: ball.y + ball.radius
    };

    const obstacleBounds = {
        left: obstacle.x,
        right: obstacle.x + obstacle.width,
        top: obstacle.y,
        bottom: obstacle.y + obstacle.height
    };

    return ballBounds.right > obstacleBounds.left &&
           ballBounds.left < obstacleBounds.right &&
           ballBounds.bottom > obstacleBounds.top &&
           ballBounds.top < obstacleBounds.bottom;
}

function handleCollision(ball, obstacle) {
    // Simple bounce effect
    if (ball.y + ball.radius > obstacle.y && ball.y - ball.radius < obstacle.y + obstacle.height) {
        ball.velocity.y *= -1; // Reverse vertical velocity
        ball.y = obstacle.y - ball.radius; // Position ball above the obstacle
    } else if (ball.x + ball.radius > obstacle.x && ball.x - ball.radius < obstacle.x + obstacle.width) {
        ball.velocity.x *= -1; // Reverse horizontal velocity
        ball.x = obstacle.x - ball.radius; // Position ball to the left of the obstacle
    }
}

class CollisionDetector {
    constructor(physics) {
        this.physics = physics;
        this.collisions = [];
        this.lastCollisionFrame = 0;
        this.collisionCooldown = 5; // Frames between collision checks
    }

    // Main collision check method
    checkCollisions(ball, obstacles) {
        // Don't check collisions for resting balls
        if (ball.isResting) return;

        // Collision cooldown to prevent rapid re-collisions
        if (this.lastCollisionFrame > 0) {
            this.lastCollisionFrame--;
            return;
        }

        for (const obstacle of obstacles) {
            if (this.checkBallObstacle(ball, obstacle)) {
                const result = this.handleCollision(ball, obstacle);
                this.lastCollisionFrame = this.collisionCooldown;
                return result;
            }
        }
    }

    // Check collision between ball and obstacle
    checkBallObstacle(ball, obstacle) {
        const ballBounds = ball.getBounds();
        
        // Basic bounding box check first
        const basicCollision = (ballBounds.right > obstacle.x && 
                           ballBounds.left < obstacle.x + obstacle.width &&
                           ballBounds.bottom > obstacle.y && 
                           ballBounds.top < obstacle.y + obstacle.height);
    
        if (!basicCollision) return false;
    
        // For ramps, do more precise collision detection
        if (obstacle.type === 'ramp') {
            return this.checkRampCollision(ball, obstacle);
        }
    
        return basicCollision;
    }

    checkRampCollision(ball, obstacle) {
        // Check if ball is within ramp bounds
        const ballRelativeX = ball.x - obstacle.x;
        const ballRelativeY = ball.y - obstacle.y;
    
        // Ball must be within horizontal bounds
        if (ballRelativeX < -ball.radius || ballRelativeX > obstacle.width + ball.radius) {
            return false;
        }
    
        // Calculate ramp height at ball's X position
        const rampHeightAtBall = obstacle.height - (ballRelativeX / obstacle.width) * obstacle.height;
    
        // Check if ball intersects with either the sloped surface or the base
        const ballBottom = ballRelativeY + ball.radius;
        const ballTop = ballRelativeY - ball.radius;
    
        // Collision with sloped surface OR base
        return (ballBottom >= rampHeightAtBall && ballTop <= obstacle.height);
    }

    // Handle collision response
    handleCollision(ball, obstacle) {
        switch (obstacle.type) {
            case 'tower':
                this.handleTowerCollision(ball, obstacle);
                break;
            case 'water':
                this.handleWaterCollision(ball, obstacle);
                break;
            case 'ramp':
                this.handleRampCollision(ball, obstacle);
                break;
        }
    }

    handleTowerCollision(ball, obstacle) {
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
                ball.x = obstacle.x - ball.radius - 2;
                ball.velocityX = Math.abs(ball.velocityX) * -0.7;
            } else {
                // Hit right side of obstacle
                ball.x = obstacle.x + obstacle.width + ball.radius + 2;
                ball.velocityX = Math.abs(ball.velocityX) * 0.7;
            }
        } else {
            // Vertical collision (top/bottom impact)
            if (overlapTop < overlapBottom) {
                // Hit top of obstacle - ball bounces up and continues horizontal motion
                ball.y = obstacle.y - ball.radius - 2;
                ball.velocityY = Math.abs(ball.velocityY) * -0.8;
                ball.velocityX *= 0.9; // Slight horizontal friction but maintain direction
            } else {
                // Hit bottom of obstacle
                ball.y = obstacle.y + obstacle.height + ball.radius + 2;
                ball.velocityY = Math.abs(ball.velocityY) * 0.8;
                ball.velocityX *= 0.9;
            }
        }
        
        // Stop tiny vibrations
        if (Math.abs(ball.velocityX) < 0.3) ball.velocityX = 0;
        if (Math.abs(ball.velocityY) < 0.3) ball.velocityY = 0;
    }

    handleWaterCollision(ball, obstacle) {
        // Ball gets stuck in water - trigger reset
        return 'reset'; // Return signal to game to reset ball
    }

    handleRampCollision(ball, obstacle) {
    // Calculate ramp angle (assuming ramp slopes up from left to right)
    const rampAngle = Math.atan2(-obstacle.height, obstacle.width);
    
    // Determine which part of the ramp the ball hit
    const ballRelativeX = ball.x - obstacle.x;
    const ballRelativeY = ball.y - obstacle.y;
    
    // Calculate where the sloped surface would be at the ball's X position
    const rampHeightAtBallX = obstacle.height - (ballRelativeX / obstacle.width) * obstacle.height;
    
    // Check if ball hit the sloped surface or the base
    const hitSlopedSurface = ballRelativeY <= rampHeightAtBallX + ball.radius + 5; // 5px tolerance
    const hitBase = ballRelativeY > rampHeightAtBallX + ball.radius;
    
    console.log('Ball hit:', hitSlopedSurface ? 'sloped surface' : 'base', 
                'ballY:', ballRelativeY.toFixed(1), 
                'rampHeight:', rampHeightAtBallX.toFixed(1));
    
    if (hitBase) {
        // Ball hit the base of the ramp - treat like a tower collision
        console.log('Hit ramp base - treating as tower collision');
        this.handleTowerCollision(ball, obstacle);
        return;
    }
    
    // Ball hit the sloped surface - proceed with ramp physics
    const ballAngle = Math.atan2(ball.velocityY, ball.velocityX);
    let approachAngle = Math.abs(ballAngle - rampAngle);
    
    if (approachAngle > Math.PI) {
        approachAngle = 2 * Math.PI - approachAngle;
    }
    
    const approachDegrees = approachAngle * (180 / Math.PI);
    const ballSpeed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
    
    // Position ball on ramp surface
    ball.y = obstacle.y + rampHeightAtBallX - ball.radius;
    
    console.log('Hit sloped surface - Approach angle:', approachDegrees.toFixed(1), 'degrees, Speed:', ballSpeed.toFixed(2));
    
    const rollThreshold = 46;
    
    if (approachDegrees < rollThreshold) {
        console.log('Rolling up ramp (angle < 46°)');
        this.handleRampRoll(ball, rampAngle, obstacle);
    } else {
        console.log('Bouncing off ramp (angle >= 46°)');
        this.handleRampBounce(ball, rampAngle, ballAngle);
    }
}

    handleRampBounce(ball, rampAngle, ballAngle) {
        // Calculate ball speed
        const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
        
        // Calculate normal to ramp surface
        const normalAngle = rampAngle + Math.PI / 2;
        
        // Reflect velocity off the ramp
        const reflectedAngle = 2 * normalAngle - ballAngle;
        
        // Apply reflected velocity with energy loss
        const energyRetention = 0.6;
        const newVelocityX = Math.cos(reflectedAngle) * speed * energyRetention;
        const newVelocityY = Math.sin(reflectedAngle) * speed * energyRetention;
        
        console.log('Bounce - Original velocityX:', ball.velocityX.toFixed(2), 'New velocityX:', newVelocityX.toFixed(2));
        
        ball.velocityX = newVelocityX;
        ball.velocityY = newVelocityY;
        
        // Ensure ball bounces upward
        if (ball.velocityY > 0) {
            ball.velocityY = -Math.abs(ball.velocityY);
        }
    }

    handleRampRoll(ball, rampAngle, obstacle) {
    // Calculate current ball speed
    const currentSpeed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
    
    // Calculate velocity component along the ramp
    const velocityAlongRamp = ball.velocityX * Math.cos(rampAngle) + ball.velocityY * Math.sin(rampAngle);
    
    // Determine if ball is moving up or down the ramp based on its actual velocity direction
    // For a ramp sloping up to the right:
    // - Positive velocityAlongRamp = moving up the ramp (to the right)
    // - Negative velocityAlongRamp = moving down the ramp (to the left)
    const movingUpRamp = velocityAlongRamp > 0;
    
    console.log('Ball velocityX:', ball.velocityX.toFixed(2), 'velocityAlongRamp:', velocityAlongRamp.toFixed(2), 'movingUpRamp:', movingUpRamp);
    
    // Apply physics for rolling on ramp
    const rollingFriction = 0.99; // Very little friction loss for rolling
    const gravityComponent = this.physics.gravity * Math.sin(Math.abs(rampAngle));
    
    let newVelocityAlongRamp = velocityAlongRamp * rollingFriction;
    
    if (movingUpRamp) {
        // Moving up the ramp - gravity slows it down
        newVelocityAlongRamp -= gravityComponent * 0.3;
        
        // If velocity becomes too small or negative, ball stops and starts rolling back
        if (newVelocityAlongRamp <= 0) {
            // Ball has stopped or is starting to roll back down
            newVelocityAlongRamp = Math.max(newVelocityAlongRamp, -0.1);
        }
    } else {
        // Moving down the ramp - gravity speeds it up gradually
        newVelocityAlongRamp -= gravityComponent * 0.2; // This will make it more negative (faster downhill)
        
        // Cap the maximum speed rolling down to keep it realistic
        const maxDownwardSpeed = -8;
        newVelocityAlongRamp = Math.max(newVelocityAlongRamp, maxDownwardSpeed);
    }
    
    // Convert velocity back to x,y components
    ball.velocityX = newVelocityAlongRamp * Math.cos(rampAngle);
    ball.velocityY = newVelocityAlongRamp * Math.sin(rampAngle);
    
    console.log('New velocityX:', ball.velocityX.toFixed(2), 'newVelocityAlongRamp:', newVelocityAlongRamp.toFixed(2));
    
    // Check if ball should come to complete rest on ramp
    if (Math.abs(newVelocityAlongRamp) < 0.05) {
        // Ball is essentially stopped - let it rest briefly then start rolling back
        ball.velocityX = 0;
        ball.velocityY = 0;
        
        // After a brief moment, gravity will naturally pull it back down
        setTimeout(() => {
            if (Math.abs(ball.velocityX) < 0.1 && Math.abs(ball.velocityY) < 0.1) {
                // Give it tiny initial velocity to start rolling back down
                const tinyDownwardVelocity = -0.05;
                ball.velocityX = tinyDownwardVelocity * Math.cos(rampAngle);
                ball.velocityY = tinyDownwardVelocity * Math.sin(rampAngle);
            }
        }, 100); // 100ms pause
    }
    
    // Ensure ball stays on ramp surface
    const ballRelativeX = ball.x - obstacle.x;
    if (ballRelativeX >= 0 && ballRelativeX <= obstacle.width) {
        const rampHeightAtBall = obstacle.y + obstacle.height - (ballRelativeX / obstacle.width) * obstacle.height;
        ball.y = rampHeightAtBall - ball.radius;
        
        this.handleRampExit(ball, rampAngle, obstacle, newVelocityAlongRamp);
    } else {
        // Ball is leaving the ramp
        this.handleRampExit(ball, rampAngle, obstacle, newVelocityAlongRamp);
    }
}

    handleRampExit(ball, rampAngle, obstacle, velocityAlongRamp) {
        // Check if ball is leaving the ramp
        const ballRelativeX = ball.x - obstacle.x;
        
        if (ballRelativeX <= 0) {
            // Ball left the left side of ramp (rolling back down)
            ball.x = obstacle.x - ball.radius - 1;
            
            // Transition to normal ground physics
            const exitSpeed = Math.abs(velocityAlongRamp);
            ball.velocityX = -exitSpeed * 0.8; // Slight energy loss when leaving ramp
            ball.velocityY = 0; // Reset Y velocity for ground rolling
            
        } else if (ballRelativeX >= obstacle.width) {
            // Ball left the right side of ramp (went up and over)
            ball.x = obstacle.x + obstacle.width + ball.radius + 1;
            
            // Ball leaves at ramp angle with current speed
            const exitSpeed = Math.abs(velocityAlongRamp);
            ball.velocityX = exitSpeed * Math.cos(rampAngle) * 0.9; // Slight energy loss
            ball.velocityY = exitSpeed * Math.sin(rampAngle);
            
            // Add small upward component for realistic trajectory
            ball.velocityY -= 0.5;
            
        } else {
            // Ball is still on ramp - keep it on the surface
            const rampHeightAtBall = obstacle.y + obstacle.height - (ballRelativeX / obstacle.width) * obstacle.height;
            ball.y = rampHeightAtBall - ball.radius;
        }
    }
}

// Make CollisionDetector available globally
window.CollisionDetector = CollisionDetector;