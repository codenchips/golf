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
    constructor() {
        this.collisions = [];
    }

    // Check collision between ball and obstacle
    checkBallObstacle(ball, obstacle) {
        const ballBounds = ball.getBounds();
        const obsBounds = obstacle.getBounds();

        return (ballBounds.right > obsBounds.x && 
                ballBounds.left < obsBounds.x + obsBounds.width &&
                ballBounds.bottom > obsBounds.y && 
                ballBounds.top < obsBounds.y + obsBounds.height);
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
        const ballCenter = { x: ball.x, y: ball.y };
        const obstacleCenter = { 
            x: obstacle.x + obstacle.width / 2, 
            y: obstacle.y + obstacle.height / 2 
        };

        // Determine collision side
        const deltaX = ballCenter.x - obstacleCenter.x;
        const deltaY = ballCenter.y - obstacleCenter.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal collision
            if (deltaX > 0) {
                // Ball hit from right
                ball.x = obstacle.x + obstacle.width + ball.radius;
            } else {
                // Ball hit from left
                ball.x = obstacle.x - ball.radius;
            }
            ball.velocityX *= -0.6; // Bounce with energy loss
        } else {
            // Vertical collision
            if (deltaY > 0) {
                // Ball hit from below
                ball.y = obstacle.y + obstacle.height + ball.radius;
            } else {
                // Ball hit from above
                ball.y = obstacle.y - ball.radius;
            }
            ball.velocityY *= -0.6; // Bounce with energy loss
        }
    }

    handleWaterCollision(ball, obstacle) {
        // Ball gets stuck in water
        ball.isMoving = false;
        ball.velocityX = 0;
        ball.velocityY = 0;
        ball.y = obstacle.y; // Float on water surface
    }

    handleRampCollision(ball, obstacle) {
        // Simple ramp physics - redirect ball upward
        const rampAngle = Math.atan2(-obstacle.height, obstacle.width);
        const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
        
        ball.velocityX = speed * Math.cos(rampAngle) * 0.8;
        ball.velocityY = speed * Math.sin(rampAngle) * 0.8;
    }

    // Check if point is inside circle
    pointInCircle(pointX, pointY, circleX, circleY, radius) {
        const distance = Math.sqrt((pointX - circleX) ** 2 + (pointY - circleY) ** 2);
        return distance <= radius;
    }

    // Check if two circles overlap
    circleOverlap(x1, y1, r1, x2, y2, r2) {
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        return distance < (r1 + r2);
    }

    // Check if point is inside rectangle
    pointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
        return pointX >= rectX && pointX <= rectX + rectWidth &&
               pointY >= rectY && pointY <= rectY + rectHeight;
    }
}

// Make CollisionDetector available globally
window.CollisionDetector = CollisionDetector;