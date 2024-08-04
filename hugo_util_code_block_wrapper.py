import os
import re
import yaml
import argparse
import difflib

def extract_title(content):
    match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if match:
        front_matter = yaml.safe_load(match.group(1))
        return front_matter.get('title', '').strip('"')
    return ''

def show_diff(old, new):
    diff = difflib.unified_diff(
        old.splitlines(keepends=True),
        new.splitlines(keepends=True),
        fromfile='Original',
        tofile='Updated',
        n=3
    )
    return ''.join(diff)

def wrap_single_code_block(content, title, block_number, total_blocks):
    def replace_code_block(match):
        full_match = match.group(0)
        # Check if the code block is already wrapped in the shortcode
        if re.search(r'{{<\s*terminal.*?>}}.*?{{<\s*/terminal\s*>}}', full_match, re.DOTALL):
            return full_match  # Return unchanged if already wrapped
        
        # Extract the code block content
        code_match = re.search(r'```(.*?)\n([\s\S]*?)```', full_match, re.DOTALL)
        if code_match:
            language = code_match.group(1).strip()
            code_content = code_match.group(2)
            
            # Ensure there's a newline after the opening backticks
            if not code_content.startswith('\n'):
                code_content = '\n' + code_content

            # Construct the wrapped code block
            wrapped_code = f'''{{{{< terminal title="{title} {block_number}/{total_blocks}" >}}}}
```{language}{code_content}```
{{{{< /terminal >}}}}'''
            
            return wrapped_code
        return full_match

    # Find all code blocks, including those already wrapped in terminal shortcode
    code_blocks = list(re.finditer(r'({{<\s*terminal.*?>}}.*?{{<\s*/terminal\s*>}}|```[\s\S]*?```)', content, re.DOTALL))
    
    if block_number <= len(code_blocks):
        # Replace only the specified code block
        start, end = code_blocks[block_number - 1].span()
        block_content = content[start:end]
        
        # Only wrap if not already wrapped
        if not re.search(r'{{<\s*terminal.*?>}}.*?{{<\s*/terminal\s*>}}', block_content, re.DOTALL):
            updated_content = (
                content[:start] +
                replace_code_block(code_blocks[block_number - 1]) +
                content[end:]
            )
            return updated_content
        else:
            return content  # Return unchanged if already wrapped
    else:
        return content

def process_file(file_path, auto_apply=False):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    title = extract_title(content)
    if not title:
        print(f"Warning: No title found in {file_path}")
        return

    total_blocks = len(re.findall(r'({{<\s*terminal.*?>}}\s*```[\s\S]*?```\s*{{<\s*/terminal\s*>}}|```[\s\S]*?```)', content, re.DOTALL))
    
    changes_made = False
    for block_number in range(1, total_blocks + 1):
        updated_content = wrap_single_code_block(content, title, block_number, total_blocks)
        
        if updated_content != content:
            diff = show_diff(content, updated_content)
            print(f"\nChanges for {file_path}, Code Block {block_number}/{total_blocks}:")
            print(diff)
            
            if auto_apply:
                content = updated_content
                changes_made = True
                print(f"Applied changes to Code Block {block_number}/{total_blocks}")
            else:
                while True:
                    user_input = input("Apply these changes? (y/n): ").lower()
                    if user_input in ['y', 'n']:
                        break
                    print("Please enter 'y' for yes or 'n' for no.")

                if user_input == 'y':
                    content = updated_content
                    changes_made = True
                    print(f"Applied changes to Code Block {block_number}/{total_blocks}")
                else:
                    print(f"Skipped changes to Code Block {block_number}/{total_blocks}")
        else:
            print(f"No changes needed for Code Block {block_number}/{total_blocks} in {file_path}")

    if changes_made:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated: {file_path}")
    else:
        print(f"No changes made to {file_path}")

def process_directory(directory, auto_apply=False):
    base_dir = os.path.dirname(directory)
    year_prefix = os.path.basename(directory)

    for item in os.listdir(base_dir):
        if item.startswith(year_prefix):
            item_path = os.path.join(base_dir, item)
            if os.path.isdir(item_path):
                index_file = os.path.join(item_path, 'index.md')
                if os.path.exists(index_file):
                    process_file(index_file, auto_apply)

def main():
    parser = argparse.ArgumentParser(description="Wrap code blocks in Hugo posts with custom shortcode.")
    parser.add_argument("path", help="Path prefix for the directories containing Hugo blog posts")
    parser.add_argument("--auto-apply", action="store_true", help="Automatically apply changes without prompting")
    args = parser.parse_args()

    base_dir = os.path.dirname(args.path)
    if not os.path.exists(base_dir):
        print(f"Error: The directory '{base_dir}' does not exist.")
        return

    process_directory(args.path, args.auto_apply)

if __name__ == "__main__":
    main()