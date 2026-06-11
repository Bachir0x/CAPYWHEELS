export const Config = {
    road: {
        width: 400,
        frequency1: 0.0015,
        frequency2: 0.004,
        amplitude1: 220,
        amplitude2: 90,
        edgeWidth: 18,
    },
    player: {
        maxSpeed: 14,
        acceleration: 0.28,
        friction: 0.987,
        baseTurnRate: 0.055,
        baseMomentumDrain: 0.055,
        offRoadMomentumDrain: 0.32,
        grassSpeedPenalty: 0.93,
        cameraLerp: 0.08,
    },
    items: {
        spawnChance: 0.065,
        orangeRestore: 22,
        bananaPenalty: -15,
    },
    particles: {
        maxParticles: 200,
    },
    combo: {
        window: 180,  // frames before combo resets
        multipliers: [1, 1.5, 2, 3],
    }
};
