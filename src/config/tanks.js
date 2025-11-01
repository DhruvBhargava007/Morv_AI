// Tank configurations
// Add new tanks here as you download them

export const tanks = {
    abrams: {
        id: 'abrams',
        name: 'Abrams M1A2 SEPv3',
        modelPath: '/models/abrams_m1a2_sepv3/scene.gltf',
        description: 'System Enhancement Program Version 3 - US Army main battle tank',
        vehicleId: 'M1A2-0428',
        dbName: 'M1 Abrams',
        dbVariant: 'M1A2 SEPv3',
        sketchfabUrl: 'https://sketchfab.com/3d-models/abrams-m1a2-sepv3-eb6f5560198740269507e9948376414c'
    },
    leopard: {
        id: 'leopard',
        name: 'Leopard 2A7',
        modelPath: '/models/leopard_2a7v_main_battle_tank.glb',
        description: 'Advanced NATO tank - Germany',
        vehicleId: 'LEO-2A7',
        dbName: 'Leopard 2',
        dbVariant: '2A7',
        sketchfabUrl: null
    },
    t90m: {
        id: 't90m',
        name: 'T-90M',
        modelPath: '/models/russian_t-90m3/scene.gltf',
        description: 'Modern Russian design',
        vehicleId: 'T90M-001',
        dbName: 'T-90',
        dbVariant: 'T-90M Proryv-3',
        sketchfabUrl: null
    }
};

// Default tank to display
export const defaultTank = tanks.abrams;

