import re
import matplotlib.pyplot as plt
import numpy as np
import ast

def parse_all_arrays(filepath):
    with open(filepath, 'r') as file:
        content = file.read()

    # Match any variable = [[...]] with optional whitespace and optional semicolon
    pattern = re.compile(r'(\w+)\s*=\s*(\[\s*(?:\[[^\[\]]*\]\s*,?\s*)+\])\s*;?', re.DOTALL)
    matches = pattern.findall(content)

    data_dict = {}
    for var_name, array_str in matches:
        try:
            # Remove extra whitespace and safely evaluate
            array_str_cleaned = re.sub(r'\s+', '', array_str)
            parsed_array = ast.literal_eval(array_str_cleaned)
            if parsed_array:
                arr_np = np.array(parsed_array)
                if arr_np.ndim == 2 and arr_np.shape[1] == 2:
                    data_dict[var_name] = arr_np
                    print(f"✅ Loaded {var_name} with {len(parsed_array)} breakpoints.")
                else:
                    print(f"⚠️ Skipped {var_name} (not a 2-column array).")
            else:
                print(f"⚠️ {var_name} is empty.")
        except Exception as e:
            print(f"❌ Error parsing {var_name}: {e}")
    
    return data_dict

def plot_arrays(data_dict, title_prefix=""):
    if not data_dict:
        print("⚠️ No valid arrays found.")
        return

    plt.figure(figsize=(12, 2.5 * len(data_dict)))

    for i, (name, data) in enumerate(data_dict.items(), 1):
        times = data[:, 0] / 60000  # ms → minutes
        values = data[:, 1]

        plt.subplot(len(data_dict), 1, i)
        plt.plot(times, values, marker='o', markersize=3, linewidth=1)
        plt.title(f"{title_prefix}{name}")
        plt.xlabel("Time (minutes)")
        plt.ylabel("Value")
        plt.grid(True)

    plt.tight_layout()
    plt.show()

# === RUN THIS ===
if __name__ == "__main__":
    filepath = "globalShapes_custom_adjusted.js"  # 🔁 Change to your file
    arrays = parse_all_arrays(filepath)
    plot_arrays(arrays, title_prefix="Automation: ")
