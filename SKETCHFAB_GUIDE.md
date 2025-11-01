# How to Use Sketchfab 3D Models

This guide explains how to import and use 3D models from Sketchfab in your landing page.

## Method 1: Download and Host Locally (Recommended)

### Step 1: Download a Model from Sketchfab

1. Go to [Sketchfab.com](https://sketchfab.com)
2. Search for a tank or military vehicle model
3. Look for models with a **Download** button (free or purchased)
4. Download the model as **GLTF/GLB** format
5. Extract the files if it's a zip archive

### Step 2: Add Model to Your Project

1. Create a `public/models/` folder in your project root:
   ```bash
   mkdir -p public/models
   ```

2. Copy your `.glb` or `.gltf` file (and associated textures) to `public/models/`

3. Example structure:
   ```
   public/
   └── models/
       ├── tank.glb          (or tank.gltf)
       └── textures/         (if separate texture files)
           ├── texture1.jpg
           └── texture2.jpg
   ```

### Step 3: Update Scene3D.jsx

Open `src/components/Scene3D.jsx` and update the `MODEL_URL`:

```javascript
const MODEL_URL = '/models/tank.glb'; // or '/models/tank.gltf'
```

### Step 4: Test

Run `npm run dev` and your model should load!

## Method 2: Use Direct URL (If Available)

Some models on Sketchfab allow direct URL access:

1. Find a model that allows embedding/download
2. Get the direct download URL (usually ends with `.glb` or `.gltf`)
3. Update `MODEL_URL` in `Scene3D.jsx`:

```javascript
const MODEL_URL = 'https://sketchfab.com/models/.../tank.glb';
```

**Note:** Many Sketchfab models require authentication or don't allow direct URLs due to CORS policies. Method 1 is more reliable.

## Method 3: Using Sketchfab API (Advanced)

For paid/authenticated models, you can use Sketchfab's API:

1. Get a Sketchfab API token
2. Download the model programmatically
3. Host it locally

## Tips for Best Results

1. **Model Format**: Prefer `.glb` over `.gltf` (single file, easier to manage)
2. **Model Size**: Keep models under 10MB for web performance
3. **Named Meshes**: Models with named parts/meshes work better for click detection
4. **Optimization**: Use tools like [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) to optimize large models

## Making Parts Clickable

For models from Sketchfab, the parts are clickable if:
- The model's meshes have **names** (e.g., "turret", "engine", "tracks")
- The names match the keys in your `mockData.js` file

If your model's parts have different names, you have two options:

### Option A: Update mockData.js
Add entries for your model's part names:
```javascript
export const partsData = {
  'turret_01': { // Match your model's mesh name
    name: 'Main Turret',
    // ... rest of data
  }
}
```

### Option B: Rename Meshes in Blender
1. Import the model into Blender
2. Rename meshes to match your data keys
3. Export as GLB

## Example: Finding Free Tank Models

Good sources for free military vehicle models:
- **Sketchfab** - Search "tank" and filter by "Downloadable" and "Free"
- **Poly Haven** - Free models (though fewer military vehicles)
- **TurboSquid** - Some free models available

## Troubleshooting

**Model doesn't load:**
- Check the file path is correct
- Verify the file is in `public/models/`
- Check browser console for errors
- Try a different model format (`.glb` vs `.gltf`)

**Parts not clickable:**
- Check if meshes have names
- Open model in a viewer to inspect structure
- Add console.log in ExternalModel to see mesh names

**Model too large/slow:**
- Use gltf-pipeline to optimize: `npx gltf-pipeline -i tank.glb -o tank-optimized.glb`
- Reduce texture sizes
- Use compressed textures

