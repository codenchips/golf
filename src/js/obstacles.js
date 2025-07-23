class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'tower', 'water', 'ramp', etc.
        this.visual = null;
    }

    createVisual() {
        switch (this.type) {
            case 'tower':
                this.visual = new Konva.Rect({
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    fill: '#8B4513',
                    stroke: '#654321',
                    strokeWidth: 2
                });
                break;
            case 'water':
                this.visual = new Konva.Rect({
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    fill: '#0066cc',
                    opacity: 0.8
                });
                break;
            case 'ramp':
                const points = [
                    this.x, this.y + this.height,
                    this.x + this.width, this.y + this.height,
                    this.x + this.width, this.y,
                    this.x, this.y + this.height
                ];
                this.visual = new Konva.Line({
                    points: points,
                    fill: '#654321',
                    closed: true
                });
                break;
        }
        return this.visual;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class ObstacleManager {
    constructor() {
        this.obstacles = [];
    }

    createTower(x, y, width, height) {
        const obstacle = new Obstacle(x, y, width, height, 'tower');
        this.obstacles.push(obstacle);
        return obstacle;
    }

    createWater(x, y, width, height) {
        const obstacle = new Obstacle(x, y, width, height, 'water');
        this.obstacles.push(obstacle);
        return obstacle;
    }

    createRamp(x, y, width, height) {
        const obstacle = new Obstacle(x, y, width, height, 'ramp');
        this.obstacles.push(obstacle);
        return obstacle;
    }

    getObstacles() {
        return this.obstacles;
    }

    checkCollision(ball) {
        const ballBounds = ball.getBounds();
        
        for (const obstacle of this.obstacles) {
            const obsBounds = obstacle.getBounds();
            
            if (ballBounds.right > obsBounds.x && 
                ballBounds.left < obsBounds.x + obsBounds.width &&
                ballBounds.bottom > obsBounds.y && 
                ballBounds.top < obsBounds.y + obsBounds.height) {
                
                return {
                    obstacle: obstacle,
                    collision: true
                };
            }
        }
        
        return { collision: false };
    }
}

// Make classes available globally
window.Obstacle = Obstacle;
window.ObstacleManager = ObstacleManager;