import os
import re
from datetime import datetime
import yaml
import argparse
import difflib

class QuotedString(str):
    pass

def quoted_presenter(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')

yaml.add_representer(QuotedString, quoted_presenter)

def process_frontmatter(content):
    # Extract front matter
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not match:
        return content, None

    frontmatter = match.group(1)
    rest_of_content = content[match.end():]

    # Parse YAML front matter
    try:
        data = yaml.safe_load(frontmatter)
    except yaml.YAMLError:
        return content, None

    # Remove 'images' section
    if 'images' in data:
        del data['images']

    # Reformat date and lastmod
    for date_field in ['date', 'lastmod']:
        if date_field in data:
            if isinstance(data[date_field], datetime):
                data[date_field] = QuotedString(data[date_field].strftime("%Y-%m-%dT%H:%M:%S+01:00"))
            elif isinstance(data[date_field], str):
                try:
                    date_obj = datetime.strptime(data[date_field], "%Y-%m-%dT%H:%M:%S.%fZ")
                except ValueError:
                    try:
                        date_obj = datetime.strptime(data[date_field], "%Y-%m-%dT%H:%M:%SZ")
                    except ValueError:
                        continue
                data[date_field] = QuotedString(date_obj.strftime("%Y-%m-%dT%H:%M:%S+01:00"))

    # Ensure required fields are present and wrap string values
    required_fields = ['title', 'description', 'author', 'date', 'tags', 'cover']
    for field in required_fields:
        if field not in data:
            data[field] = QuotedString("")
        elif isinstance(data[field], str):
            data[field] = QuotedString(data[field])

    # Wrap string values in quotes, including nested dictionaries
    def quote_strings(obj):
        if isinstance(obj, dict):
            return {k: quote_strings(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [quote_strings(item) for item in obj]
        elif isinstance(obj, str):
            return QuotedString(obj)
        else:
            return obj

    data = quote_strings(data)

    # Reorder fields
    ordered_data = {key: data[key] for key in required_fields if key in data}
    for key, value in data.items():
        if key not in ordered_data:
            ordered_data[key] = value

    # Custom YAML dumper for proper indentation
    class Dumper(yaml.Dumper):
        def increase_indent(self, flow=False, indentless=False):
            return super(Dumper, self).increase_indent(flow, False)

    # Convert back to YAML
    new_frontmatter = yaml.dump(ordered_data, Dumper=Dumper, sort_keys=False, allow_unicode=True, width=1000, default_flow_style=False, indent=2)

    # Remove extra newlines
    new_frontmatter = re.sub(r'\n\s*\n', '\n', new_frontmatter).strip()

    return f"---\n{new_frontmatter}\n---\n{rest_of_content}", frontmatter

def show_diff(old, new):
    diff = difflib.unified_diff(
        old.splitlines(keepends=True),
        new.splitlines(keepends=True),
        fromfile='Old Front Matter',
        tofile='New Front Matter',
        n=10
    )
    return ''.join(diff)

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    new_content, old_frontmatter = process_frontmatter(content)

    if new_content != content and old_frontmatter is not None:
        print(f"\nReviewing changes for: {file_path}")
        print(show_diff(old_frontmatter, new_content.split('---\n')[1]))

        while True:
            user_input = input("Apply these changes? (y/n): ").lower()
            if user_input in ['y', 'n']:
                break
            print("Please enter 'y' for yes or 'n' for no.")

        if user_input == 'y':
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated: {file_path}")
        else:
            print(f"Skipped: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

def process_directory(directory):
    base_dir = os.path.dirname(directory)
    year_prefix = os.path.basename(directory)

    for item in os.listdir(base_dir):
        if item.startswith(year_prefix):
            item_path = os.path.join(base_dir, item)
            if os.path.isdir(item_path):
                index_file = os.path.join(item_path, 'index.md')
                if os.path.exists(index_file):
                    process_file(index_file)

def main():
    parser = argparse.ArgumentParser(description="Clean up Hugo blog post front matter.")
    parser.add_argument("path", help="Path prefix for the directories containing Hugo blog posts")
    args = parser.parse_args()

    base_dir = os.path.dirname(args.path)
    if not os.path.exists(base_dir):
        print(f"Error: The directory '{base_dir}' does not exist.")
        return

    process_directory(args.path)

if __name__ == "__main__":
    main()