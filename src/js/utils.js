// Utility functions for the golf game
class Utils {
    // Calculate distance between two points
    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Calculate angle between two points
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // Convert radians to degrees
    static radToDeg(rad) {
        return rad * (180 / Math.PI);
    }

    // Convert degrees to radians
    static degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    // Clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Linear interpolation
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Check if point is inside rectangle
    static pointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    // Generate random number between min and max
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Detect if device is mobile
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}

// Make Utils available globally
window.Utils = Utils;