import re
import ast

def compress_timing(filepath, output_path, compression_ratio=10):
    with open(filepath, 'r') as file:
        content = file.read()

    # Match arrays of the form: varName = [[...]];
    pattern = re.compile(r'(\w+)\s*=\s*(\[\s*(?:\[[^\[\]]*\]\s*,?\s*)+\])\s*;?', re.DOTALL)
    matches = pattern.findall(content)

    compressed_chunks = []

    for var_name, array_str in matches:
        try:
            # Parse array safely
            clean_array = re.sub(r'\s+', '', array_str)
            data = ast.literal_eval(clean_array)
            # Scale time values down
            compressed_data = [[int(t / compression_ratio), v] for t, v in data]
            # Format output JS
            array_text = ',\n  '.join(f'[{t},{round(v, 4)}]' for t, v in compressed_data)
            chunk = f"{var_name} = [\n  {array_text}\n];\n"
            compressed_chunks.append(chunk)
            print(f"✅ Compressed {var_name} with {len(data)} points.")
        except Exception as e:
            print(f"❌ Failed to process {var_name}: {e}")

    # Write new file
    with open(output_path, 'w') as out:
        out.write('\n'.join(compressed_chunks))

    print(f"\n🎉 Done! Compressed file saved to: {output_path}")

# === RUN THIS ===
if __name__ == "__main__":
    input_file = "globalShapes_30s.js"         # change to your file
    output_file = "compressed_2min.js"     # new output file
    compress_timing(input_file, output_file, compression_ratio=10)
