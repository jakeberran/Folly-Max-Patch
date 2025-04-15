Max Patch for Folly at UH - Convergence Research
================================================

Getting Started
---------------

1. **Keep the entire `Folly Max Patch` folder together.**  
   Don't remove files-everything assumes they're in the same folder.

2. **Open only** `FOLLY_MAIN.maxpat` in Max.  
   (Created in Max 8.6.2 on 64-bit Windows, partially tested on Mac.)

3. **Set your audio input/output** under `Options > Audio Status`:  
   - Sampling Rate: `44100`  
   - Click `Open I/O Mappings` (bottom right) and confirm the first 8 inputs match your channels:  
     - `1-4 = Room mics`  
     - `5-8 = Contact mics`

4. **Add the folder to the Max file path:**  
   - Go to `File > Show File Browser`  
   - Click the icon with a page and arrow (bottom left)  
   - Navigate to `Folly Max Patch`, select all files (`Ctrl`/`Cmd`+click), and add them

5. **Ensure Presentation Mode is active.**  
   If the patch looks messy, click the `TV icon` in the lower-left toolbar (third from left).

Running the Patch
-----------------

Follow the **pink bubbles** in order:

1. Start/stop the audio engine  
2. Play test noise - check output level  
   - At `amplitude = 0.5`, it's about as loud as anything in the patch  
   - You can drag the number box or click & type a new value  
3. Adjust mic input levels (mainly on the interface)  
   - Use the patch adjustments only if needed  
4. Set total performance length (default: `20 min`; adjust for testing if needed)  
5-6. Choose file name and toggle `X` to start recording  
   - It's fine to start early - it records inputs/outputs (excluding contact mics) to a `6-channel AIFF` file  
   - You'll mix down to stereo afterward  
7. Toggle `START` to begin the performance

Additional Features
-------------------

- **High-pass filter**  
  Removes frequencies below `125 Hz` to keep the room sound clean.

- **Feedback detection**  
  Continuously kills the loudest single frequency if it exceeds the amplitude threshold.  
  Lower the threshold if feedback is an issue.

- **Compressor**  
  Balances quiet and loud sounds.  
  Adjust the `ratio` and `threshold` if loudness variation becomes distracting.

- **Random envelope density & strength**  
  Controls how frequent and strong the "disturbances" are to the long-term parameter arcs - mostly an aesthetic choice.
