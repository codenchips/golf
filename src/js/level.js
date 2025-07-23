class Level {
    constructor(levelNumber, minLength = 1500, maxLength = 3000) {
        this.levelNumber = levelNumber;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.length = Utils.random(minLength, maxLength);
        this.holePosition = this.length - 200; // Hole 200px before level end
        this.puttingAreaStart = this.holePosition - 150; // Clear area for putting
        this.obstacles = [];
        this.hole = null;
        this.par = this.calculatePar();
    }

    calculatePar() {
        // Calculate par based on level length and difficulty
        const baseLength = 1000;
        const lengthFactor = Math.floor(this.length / baseLength);
        return Math.max(3, Math.min(7, 3 + lengthFactor + this.levelNumber));
    }

    generateObstacles() {
        this.obstacles = [];
        
        // Generate obstacles but avoid the putting area
        const obstacleCount = Math.floor(this.length / 300);
        
        for (let i = 0; i < obstacleCount; i++) {
            const x = Utils.random(200, this.puttingAreaStart - 100);
            
            // Skip if too close to putting area
            if (x > this.puttingAreaStart - 200) continue;
            
            const obstacleType = Math.random();
            
            if (obstacleType < 0.6) {
                // Tower obstacle
                const height = Utils.random(50, 200);
                this.obstacles.push({
                    x: x,
                    y: 0, // Will be adjusted to ground level
                    width: 50,
                    height: height,
                    type: 'tower'
                });
            } else if (obstacleType < 0.8) {
                // Water hazard
                this.obstacles.push({
                    x: x,
                    y: 0, // Will be adjusted to ground level
                    width: 100,
                    height: 20,
                    type: 'water'
                });
            } else {
                // Ramp
                this.obstacles.push({
                    x: x,
                    y: 0, // Will be adjusted to ground level
                    width: 80,
                    height: 60,
                    type: 'ramp'
                });
            }
        }
    }

    createHole(groundY) {
        this.hole = {
            x: this.holePosition,
            y: groundY - 5,
            radius: 20,
            type: 'hole'
        };
        return this.hole;
    }
}

// Make Level available globally
window.Level = Level;