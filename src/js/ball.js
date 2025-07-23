class Ball {
    constructor(x, y, radius = 8) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isMoving = false;
        this.color = '#ffffff';
        
        // Trail system
        this.trailPoints = [];
        this.maxTrailLength = 10; // Maximum number of trail points
        this.trailUpdateCounter = 0;
        this.trailUpdateFrequency = 2; // Add trail point every 3 frames
    }

    update() {
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Apply friction
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        // Prevent the ball from falling below the ground level
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.velocityY = 0;
        }

        this.updateTrail();
    }

    // Set velocity for the ball
    setVelocity(vx, vy) {
        this.velocityX = vx;
        this.velocityY = vy;
        this.isMoving = true;
        this.clearTrail(); // Clear old trail when starting new shot
    }

    // Update trail points
    updateTrail() {
        if (!this.isMoving) return;

        this.trailUpdateCounter++;
        
        // Only add trail point every few frames to avoid too dense trail
        if (this.trailUpdateCounter >= this.trailUpdateFrequency) {
            this.addTrailPoint();
            this.trailUpdateCounter = 0;
        }
    }

    // Add point to trail
    addTrailPoint() {
        this.trailPoints.push({ 
            x: this.x, 
            y: this.y,
            timestamp: Date.now()
        });
        
        // Remove old trail points
        if (this.trailPoints.length > this.maxTrailLength) {
            this.trailPoints.shift();
        }
    }

    // Clear trail
    clearTrail() {
        this.trailPoints = [];
        this.trailUpdateCounter = 0;
    }

    // Get trail points for rendering
    getTrailPoints() {
        return this.trailPoints;
    }

    // Reset ball position
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isMoving = false;
        this.clearTrail();
    }

    // Get ball bounds for collision detection
    getBounds() {
        return {
            left: this.x - this.radius,
            right: this.x + this.radius,
            top: this.y - this.radius,
            bottom: this.y + this.radius
        };
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = 'white';
        context.fill();
        context.closePath();
    }
}

// Make Ball available globally
window.Ball = Ball;