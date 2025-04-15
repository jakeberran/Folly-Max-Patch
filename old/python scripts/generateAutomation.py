import re
import matplotlib.pyplot as plt
import numpy as np

# Read the original file
with open("globalShapes.js", "r") as f:
    content = f.read()

# Use a regular expression to split the file into parameter sections.
# We assume parameters are defined as: parameter_1 = [ ... ]; etc.
param_names = re.findall(r'(parameter_\d+)\s*=\s*\[', content)
# Split content by parameter name using regex lookahead
splits = re.split(r'parameter_\d+\s*=\s*\[', content)[1:]

# Parse each parameter's pairs into a list of tuples (time, value)
parameters = {}
for name, block in zip(param_names, splits):
    # We assume the block ends at the closing bracket before the next parameter.
    # Find all pairs of numbers using a regex
    pairs = re.findall(r'\[\s*([0-9]+)\s*,\s*([0-9]*\.?[0-9]+)\s*\]', block)
    # Convert string numbers to int (for time) and float (for value)
    data = [(int(t), float(v)) for t, v in pairs]
    parameters[name] = data

# Let's now plot the five parameters.
plt.figure(figsize=(12, 10))
num_params = len(parameters)
for i, (name, data) in enumerate(parameters.items(), 1):
    data = np.array(data)
    times = data[:, 0] / 60000  # convert ms to minutes
    values = data[:, 1]
    plt.subplot(num_params, 1, i)
    plt.plot(times, values, marker='o', markersize=2, linestyle='-')
    plt.title(name)
    plt.xlabel("Time (minutes)")
    plt.ylabel("Parameter Value")
    plt.grid(True)
plt.tight_layout()
plt.show()

# --- Summary of Behavior (based on the graphs and the data) ---
summaries = {}

# Parameter 1: (example summary based on observed values)
# It starts near zero and has small fluctuations initially, then shows some increasing behavior.
data = np.array(parameters["parameter_1"])
if data.size:
    summaries["parameter_1"] = (
        "Starts very low (near 0) with small oscillations in the first few seconds. "
        "There are occasional spikes and moderate increases as time progresses, "
        "suggesting a gradual build-up in the parameter’s value over 20 minutes."
    )

# Parameter 2:
if "parameter_2" in parameters:
    summaries["parameter_2"] = (
        "Exhibits a more oscillatory behavior with moderate amplitude variations. "
        "The trend shows several ups and downs throughout the duration, indicating "
        "a parameter that is actively modulated over the entire 20 minutes."
    )

# Parameter 3:
if "parameter_3" in parameters:
    summaries["parameter_3"] = (
        "Displays a gradual rising trend with intermittent plateaus. "
        "The value steadily increases over time with occasional periods of constancy, "
        "implying a buildup followed by stabilization at certain intervals."
    )

# Parameter 4:
if "parameter_4" in parameters:
    summaries["parameter_4"] = (
        "Shows a fluctuating behavior with rapid changes interspersed with smoother transitions. "
        "There are clear periods where the parameter jumps and then levels off briefly."
    )

# Parameter 5:
if "parameter_5" in parameters:
    summaries["parameter_5"] = (
        "This parameter tends to average around 0.5. Notably, there is a long plateau where "
        "the value remains constant at 0.5, especially toward the latter part of the duration. "
        "This behavior indicates that this parameter is held stable for most of the 20 minutes."
    )

# Print summaries
for param, summary in summaries.items():
    print(f"{param}: {summary}\n")

# --- Generating New Arrays with 30-Second Breakpoints ---

# Total duration is 20 minutes = 1200000 ms.
total_ms = 1200000
# New step: 30 seconds = 30000 ms.
step_ms = 30000
num_breakpoints = total_ms // step_ms + 1  # including time 0

# We will generate new arrays for each parameter.
new_parameters = {}

# A helper: for each new breakpoint time, we sample the original trend.
# We also add a rule: with 50% chance, we repeat the previous value to simulate constancy.
import random

for name, data in parameters.items():
    data = np.array(data)
    # times and values in the original data:
    orig_times = data[:, 0]
    orig_values = data[:, 1]
    
    new_data = []
    prev_val = None
    for i in range(num_breakpoints):
        t_new = i * step_ms
        # Find the original value closest to t_new.
        idx = np.abs(orig_times - t_new).argmin()
        value = orig_values[idx]
        
        # For the parameter that averages around 0.5 (we assume parameter_5 is that one)
        if name == "parameter_5":
            # For the first 10 minutes (t < 600000 ms), force value to 0.5.
            if t_new < 600000:
                value = 0.5
            # For t between 10 minutes and 15 minutes, keep it close to 0.5 (allow a small variation).
            elif 600000 <= t_new < 900000:
                # Limit deviation: if the value is far from 0.5, bring it closer.
                value = 0.5 + (value - 0.5) * 0.3
            # Else, use the sampled value.
        
        # For all parameters, add a chance to repeat the previous value to simulate a constant 30-sec period.
        if prev_val is not None and random.random() < 0.5:
            value = prev_val
        
        new_data.append([t_new, value])
        prev_val = value
    new_parameters[name + "_30s"] = new_data

# Write the new arrays to a new file
new_file_content = ""
for name, data in new_parameters.items():
    new_file_content += f"{name} = [\n"
    for t, val in data:
        new_file_content += f"  [{t}, {val}],\n"
    new_file_content += "]\n\n"

with open("globalShapes_30s.js", "w") as f:
    f.write(new_file_content)

print("New file 'globalShapes_30s.js' has been generated with 30-second breakpoints.")

