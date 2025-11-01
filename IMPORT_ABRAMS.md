# How to Import the Abrams M1A2 SEPv3 Model

This guide walks you through importing the Abrams tank model from Sketchfab into your landing page.

## Step 1: Download the Model from Sketchfab

1. Go to the model page: [Abrams M1A2 SEPv3 on Sketchfab](https://sketchfab.com/3d-models/abrams-m1a2-sepv3-eb6f5560198740269507e9948376414c)

2. **You may need to create a free Sketchfab account** if you don't have one:
   - Click "Sign Up" in the top right
   - Use email or social login

3. Click the **"Download 3D Model"** button (located below the model viewer)

4. In the download dialog:
   - Select **GLB** or **GLTF** format (both work!)
     - **GLB** (recommended): Single file, easier to manage - all textures embedded
     - **GLTF**: May include multiple files (.gltf + .bin + textures folder)
   - Choose the quality/resolution you want (for web, "Medium" or "High" is usually fine)
   - Click **Download**

5. Save the file somewhere you can find it (like your Downloads folder)

## Step 2: Add Model to Your Project

1. **Create the models folder** in your project:
   ```bash
   mkdir -p public/models
   ```

2. **Move/Rename the downloaded files:**

   **If you downloaded GLB format (single file):**
   - Take the downloaded GLB file (it might have a random name)
   - Rename it to: `abrams-m1a2-sepv3.glb`
   - Move it to: `public/models/abrams-m1a2-sepv3.glb`

   **If you downloaded GLTF format (multiple files):**
   - You'll get a `.gltf` file and possibly a `.bin` file and a `textures` folder
   - Place **all** these files in `public/models/` keeping the same folder structure
   - Rename the main `.gltf` file to: `abrams-m1a2-sepv3.gltf`
   - Keep the `.bin` and `textures/` folder if present (they're needed!)

   Your file structure should look like:
   ```
   Morv_AI/
   ├── public/
   │   └── models/
   │       ├── abrams-m1a2-sepv3.gltf  (or .glb)
   │       ├── abrams-m1a2-sepv3.bin   (if using GLTF)
   │       └── textures/               (if using GLTF with separate textures)
   │           ├── texture1.jpg
   │           └── texture2.jpg
   ├── src/
   └── ...
   ```

   **Important:** If using GLTF format, make sure to keep all related files together in the same folder!

## Step 3: Verify Configuration

The code is already configured to use this model! Check `src/config/tanks.js` - it should have:

```javascript
abrams: {
  id: 'abrams',
  name: 'Abrams M1A2 SEPv3',
  modelPath: '/models/abrams-m1a2-sepv3.gltf', // or .glb if you used GLB format
  // ...
}
```

**Note:** Update the `modelPath` to match your downloaded format:
- If you downloaded **GLB**: use `/models/abrams-m1a2-sepv3.glb`
- If you downloaded **GLTF**: use `/models/abrams-m1a2-sepv3.gltf`

## Step 4: Test It Out

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** to `http://localhost:5173`

3. You should see the Abrams tank model loading!

## Troubleshooting

### Model doesn't appear:
- Check that the file is in `public/models/` with the correct name
- If using GLTF, make sure the `.bin` file and `textures/` folder (if any) are also there
- Check browser console (F12) for errors - it will tell you if files are missing
- Verify the filename in `src/config/tanks.js` matches your file exactly (case-sensitive)
- For GLTF: The path should point to the `.gltf` file, not the `.bin` file

### Model loads but parts aren't clickable:
- The model's mesh names need to match your `mockData.js` keys
- Open browser console and hover/click to see what mesh names are detected
- You may need to inspect the model structure or update `mockData.js` to match

### File too large:
- The model is about 256k triangles, which should be fine for web
- If it's too slow, you can optimize it using [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline):
  ```bash
  npm install -g gltf-pipeline
  gltf-pipeline -i public/models/abrams-m1a2-sepv3.glb -o public/models/abrams-optimized.glb
  ```

## GLB vs GLTF - Which Should I Use?

**GLB (Recommended for beginners):**
- ✅ Single file - easier to manage
- ✅ All textures embedded
- ✅ No risk of missing files
- ✅ Faster to upload/download

**GLTF:**
- ✅ Human-readable JSON format (can edit if needed)
- ⚠️ May be multiple files (.gltf + .bin + textures)
- ⚠️ Need to keep all files together
- ⚠️ Can be harder to manage

**Our Recommendation:** Use GLB if you just want it to work. Use GLTF if you need to edit the model or prefer the format. Both work perfectly with React Three Fiber!

## Adding More Tanks Later

When you download your 2nd and 3rd tanks:

1. Download them from Sketchfab as GLB or GLTF files
2. Place them in `public/models/` (keep all related files if using GLTF)
3. Add entries to `src/config/tanks.js`:

```javascript
tank2: {
  id: 'tank2',
  name: 'Your Tank Name',
  modelPath: '/models/tank2.glb',
  description: 'Description',
  vehicleId: 'ID-XXXX',
  sketchfabUrl: 'https://sketchfab.com/...'
}
```

4. You can then add a tank selector dropdown in the header to switch between them!

## Model Information

- **Name:** Abrams M1A2 SEPv3
- **Triangles:** 256.8k
- **Vertices:** 137.1k
- **License:** CC Attribution (free to use)
- **Creator:** dannzjs
- **Source:** [Sketchfab Model Page](https://sketchfab.com/3d-models/abrams-m1a2-sepv3-eb6f5560198740269507e9948376414c)

