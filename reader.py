import os
import pyperclip

exclude = {"node_modules", ".git", ".expo", "expo", "android", "venv"}

def tree(dir_path, prefix="", output=None):
    if output is None:
        output = []

    entries = [e for e in os.listdir(dir_path) if e not in exclude]
    entries.sort()

    for i, entry in enumerate(entries):
        path = os.path.join(dir_path, entry)
        connector = "└── " if i == len(entries) - 1 else "├── "
        line = prefix + connector + entry
        output.append(line)

        if os.path.isdir(path):
            extension = "    " if i == len(entries) - 1 else "│   "
            tree(path, prefix + extension, output)

    return output

# Generate tree as a list of strings
lines = tree(".")
tree_str = "\n".join(lines)

# Print the tree
print(tree_str)

# Copy to clipboard
pyperclip.copy(tree_str)
print("\nTree copied to clipboard!")