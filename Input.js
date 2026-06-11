export class Input {
    constructor() {
        this.keys = {};
        this._touchSteering = 0;
        this._touchThrottle = false;
        this._touchBrake = false;
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', e => { this.keys[e.code] = true; });
        window.addEventListener('keyup',   e => { this.keys[e.code] = false; });
        this._setupTouch();
    }

    _setupTouch() {
        // Virtual touch zones: left third = steer left, right third = steer right,
        // centre top half = throttle, centre bottom = brake
        let touchStartX = null;

        const onStart = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            touchStartX = t.clientX;
            const w = window.innerWidth;
            const h = window.innerHeight;

            if (t.clientX < w * 0.33) {
                this._touchSteering = -1;
                this._touchThrottle = true;
            } else if (t.clientX > w * 0.67) {
                this._touchSteering = 1;
                this._touchThrottle = true;
            } else {
                this._touchSteering = 0;
                this._touchThrottle = t.clientY < h * 0.6;
                this._touchBrake    = t.clientY >= h * 0.6;
            }
        };

        const onMove = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            if (touchStartX !== null) {
                const delta = t.clientX - touchStartX;
                if (Math.abs(delta) > 20) {
                    this._touchSteering = delta > 0 ? 1 : -1;
                }
            }
        };

        const onEnd = (e) => {
            e.preventDefault();
            this._touchSteering = 0;
            this._touchThrottle = false;
            this._touchBrake = false;
            touchStartX = null;
        };

        window.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove',  onMove,  { passive: false });
        window.addEventListener('touchend',   onEnd,   { passive: false });
    }

    isPressed(keyCode, altKeyCode) {
        return this.keys[keyCode] || this.keys[altKeyCode] || false;
    }

    get steering() {
        if (this.isPressed('ArrowLeft', 'KeyA')) return -1;
        if (this.isPressed('ArrowRight', 'KeyD')) return 1;
        return this._touchSteering;
    }

    get throttle() {
        return this.isPressed('ArrowUp', 'KeyW') || this._touchThrottle;
    }

    get brake() {
        return this.isPressed('ArrowDown', 'KeyS') || this._touchBrake;
    }
}
