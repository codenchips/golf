class Hole {
    constructor(x, y, radius = 20) {
        this.x = x;
        this.y = y; // This is ground level
        this.radius = radius;
        this.holeDepth = 15; // How deep the hole is below ground
        this.visual = null;
        this.flagVisual = null;
        this.isCompleted = false;
    }

    createVisual() {
        // Create hole as a semi-circle using Arc
        this.visual = new Konva.Arc({
            x: this.x,
            y: this.y +6, // Ground level
            innerRadius: 0,
            outerRadius: this.radius,
            angle: 180, // Semi-circle (180 degrees)
            rotation: 0, // Start from top
            fill: '#000000',
            stroke: '#333333',
            strokeWidth: 2
        });

        // Create flag positioned at the center of the hole
        this.flagVisual = new Konva.Group();
        
        // Flag pole - centered in hole, bottom at hole bottom
        const poleHeight = 55; // 10% longer (was 50)
        const pole = new Konva.Line({
            points: [
                this.x, this.y, // Bottom of pole at ground level
                this.x, this.y - poleHeight // Top of pole
            ],
            stroke: '#8B4513',
            strokeWidth: 3
        });
        
        // Flag - centered above the hole
        const flag = new Konva.Rect({
            x: this.x, // Centered on hole
            y: this.yl - poleHeight, // At top of pole
            width: 30,
            height: 20,
            fill: '#FF0000',
            stroke: '#800000',
            strokeWidth: 1
        });

        this.flagVisual.add(pole);
        this.flagVisual.add(flag);

        return {
            hole: this.visual,
            flag: this.flagVisual
        };
    }

    checkBallInHole(ball) {
        if (this.isCompleted) return false; // Already completed
        
        const distance = Utils.distance(ball.x, ball.y, this.x, this.y);
        
        // Ball must be close to hole center and at ground level, moving slowly
        if (distance < this.radius - ball.radius && 
            ball.y >= this.y - 5 && // Ball must be at or near ground level
            Math.abs(ball.velocityX) < 3 && 
            Math.abs(ball.velocityY) < 3) {
            
            // Ball falls into hole - animate drop to bottom
            this.dropBallInHole(ball);
            this.isCompleted = true;
            
            return true;
        }
        
        return false;
    }

    dropBallInHole(ball) {
        // Stop horizontal movement immediately
        ball.velocityX = 0;
        ball.velocityY = 0;
        ball.isMoving = false;
        
        // Position ball at center of hole
        ball.x = this.x;
        
        // Start drop animation
        this.animateBallDrop(ball);
    }

    animateBallDrop(ball) {
        const startY = ball.y;
        const endY = this.y + this.holeDepth; // Bottom of hole
        const dropDuration = 500; // 500ms animation
        const startTime = Date.now();
        
        const animateDrop = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / dropDuration, 1);
            
            // Ease-in animation (accelerating fall)
            const easeProgress = progress * progress;
            
            // Update ball position
            ball.y = startY + (endY - startY) * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateDrop);
            } else {
                // Ball has reached bottom of hole
                ball.y = endY;
            }
        };
        
        animateDrop();
    }

    reset() {
        this.isCompleted = false;
    }
}

// Make Hole available globally
window.Hole = Hole;