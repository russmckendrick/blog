#!/usr/bin/env python3
import os
import re
import argparse
import difflib
import yaml

def show_diff(old, new):
    """Show a diff of the changes to be made."""
    diff = difflib.unified_diff(
        old.splitlines(keepends=True),
        new.splitlines(keepends=True),
        fromfile='Original',
        tofile='Updated',
        n=3
    )
    return ''.join(diff)

def update_shortcodes(content, shortcode_mappings):
    """
    Update deprecated shortcodes in the content.
    
    Args:
        content (str): The content of the file
        shortcode_mappings (dict): Dictionary mapping old shortcode names to new ones
        
    Returns:
        str: Updated content
    """
    updated_content = content
    
    for old_shortcode, new_shortcode in shortcode_mappings.items():
        # Pattern to match twitter shortcode with parameters
        # This handles both user= and id= parameters with proper spacing
        pattern = r'{{<\s*' + re.escape(old_shortcode) + r'\s+(user=\S+)\s+(id=\S+)\s*>}}'
        
        # Replace with properly formatted x shortcode
        updated_content = re.sub(
            pattern,
            lambda m: f'{{{{< {new_shortcode} {m.group(1)} {m.group(2)} >}}}}',
            updated_content
        )
        
        # Also handle shortcodes with just one parameter
        pattern_single = r'{{<\s*' + re.escape(old_shortcode) + r'\s+(\w+=\S+)\s*>}}'
        updated_content = re.sub(
            pattern_single,
            lambda m: f'{{{{< {new_shortcode} {m.group(1)} >}}}}',
            updated_content
        )
        
        # Handle empty shortcodes
        pattern_empty = r'{{<\s*' + re.escape(old_shortcode) + r'\s*>}}'
        updated_content = re.sub(
            pattern_empty,
            f'{{{{< {new_shortcode} >}}}}',
            updated_content
        )
    
    return updated_content

def process_file(file_path, shortcode_mappings, auto_apply=False):
    """Process a single file and update shortcodes."""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    updated_content = update_shortcodes(content, shortcode_mappings)
    
    if updated_content != content:
        print(f"\nChanges for {file_path}:")
        print(show_diff(content, updated_content))
        
        if auto_apply:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(updated_content)
            print(f"Updated: {file_path}")
        else:
            while True:
                user_input = input("Apply these changes? (y/n): ").lower()
                if user_input in ['y', 'n']:
                    break
                print("Please enter 'y' for yes or 'n' for no.")
            
            if user_input == 'y':
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(updated_content)
                print(f"Updated: {file_path}")
            else:
                print(f"Skipped: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

def process_directory(directory, shortcode_mappings, auto_apply=False):
    """Process all markdown files in a directory and its subdirectories."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                process_file(file_path, shortcode_mappings, auto_apply)

def main():
    parser = argparse.ArgumentParser(description="Update deprecated shortcodes in Hugo blog posts.")
    parser.add_argument("path", help="Path to the directory containing Hugo blog posts")
    parser.add_argument("--auto-apply", action="store_true", help="Automatically apply changes without prompting")
    parser.add_argument("--config", help="Path to a YAML config file with shortcode mappings")
    args = parser.parse_args()
    
    # Default shortcode mappings
    shortcode_mappings = {
        "twitter": "x",
        "tweet": "x",
        "twitter_simple": "x"
    }
    
    # Load custom mappings from config file if provided
    if args.config:
        try:
            with open(args.config, 'r') as f:
                config = yaml.safe_load(f)
                if 'shortcode_mappings' in config:
                    shortcode_mappings.update(config['shortcode_mappings'])
        except Exception as e:
            print(f"Error loading config file: {e}")
    
    if not os.path.exists(args.path):
        print(f"Error: The directory '{args.path}' does not exist.")
        return
    
    process_directory(args.path, shortcode_mappings, args.auto_apply)

if __name__ == "__main__":
    main() 