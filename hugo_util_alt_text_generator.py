import os
import re
import traceback
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import VisualFeatureTypes
from msrest.authentication import CognitiveServicesCredentials

region = os.environ['ACCOUNT_REGION']
key = os.environ['ACCOUNT_KEY']
SITE_PATH = os.environ['SITE_PATH']

if not region or not key:
    raise EnvironmentError("ACCOUNT_REGION and/or ACCOUNT_KEY are not set in the environment")

credentials = CognitiveServicesCredentials(key)
client = ComputerVisionClient(
    endpoint=f"https://{region}.api.cognitive.microsoft.com/",
    credentials=credentials
)

def get_image_path(relative_path, md_file_path):
    md_dir = os.path.dirname(md_file_path)
    
    possible_paths = [
        os.path.join(md_dir, relative_path),
        os.path.join(SITE_PATH, relative_path.lstrip('/')),
        os.path.join(SITE_PATH, 'static', relative_path.lstrip('/')),
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    print(f"Image not found in any of these locations:")
    for path in possible_paths:
        print(f"  - {path}")
    return None

def get_image_description(image_path, md_file_path):
    try:
        full_image_path = get_image_path(image_path, md_file_path)
        if not full_image_path:
            print(f"Image not found: {image_path}")
            return None

        with open(full_image_path, 'rb') as image_data:
            analysis = client.describe_image_in_stream(image_data)
            
            if analysis.captions:
                for caption in analysis.captions:
                    print(f"Caption: {caption.text}, Confidence: {caption.confidence}")
                
                description = analysis.captions[0].text
                return description
        
        print(f"No description found for {full_image_path}")
    
    except Exception as e:
        print(f"Failed to get description for {image_path}: {e}")
        traceback.print_exc()

    return None

def update_markdown_content(content, image_descriptions):
    def replace_markdown_image(match):
        full_match = match.group(0)
        alt_text = match.group(1)
        image_path = match.group(2)
        
        if alt_text:  # If alt text is already present, don't change it
            return full_match
        
        if image_path in image_descriptions:
            new_alt_text = image_descriptions[image_path]
            return f'![{new_alt_text}]({image_path})'
        
        return full_match

    def replace_html_image(match):
        full_match = match.group(0)
        image_path = match.group(1)
        
        if 'alt=' in full_match:  # If alt attribute is already present, don't change it
            return full_match
        
        if image_path in image_descriptions:
            new_alt_text = image_descriptions[image_path]
            return f'<image src="{image_path}" alt="{new_alt_text}">'
        
        return full_match

    def replace_hugo_shortcode(match):
        full_match = match.group(0)
        image_path = match.group(1)
        
        if 'alt=' in full_match:  # If alt attribute is already present, don't change it
            return full_match
        
        if image_path in image_descriptions:
            new_alt_text = image_descriptions[image_path]
            return f'{{{{< img src="{image_path}" alt="{new_alt_text}" >}}}}'
        
        return full_match

    # Regular expressions
    markdown_image_pattern = r'!\[(.*?)\]\((.*?)\)'
    html_image_pattern = r'<image\s+src="([^"]+)"[^>]*>'
    hugo_shortcode_pattern = r'{{<\s*img\s+src="([^"]+)"[^>]*>}}'
    
    # Replace image references
    updated_content = re.sub(markdown_image_pattern, replace_markdown_image, content)
    updated_content = re.sub(html_image_pattern, replace_html_image, updated_content)
    updated_content = re.sub(hugo_shortcode_pattern, replace_hugo_shortcode, updated_content)
    
    return updated_content

def process_markdown_file(md_file_path):
    try:
        with open(md_file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Find all image references in the markdown content
        markdown_image_pattern = r'!\[(.*?)\]\((.*?)\)'
        html_image_pattern = r'<image\s+src="([^"]+)"[^>]*>'
        hugo_shortcode_pattern = r'{{<\s*img\s+src="([^"]+)"[^>]*>}}'
        
        markdown_matches = re.findall(markdown_image_pattern, content)
        html_matches = re.findall(html_image_pattern, content)
        hugo_matches = re.findall(hugo_shortcode_pattern, content)

        image_descriptions = {}
        
        for alt_text, image_path in markdown_matches:
            if not alt_text:  # Only process images without alt text
                description = get_image_description(image_path, md_file_path)
                if description:
                    image_descriptions[image_path] = description

        for image_path in html_matches:
            if f'alt="{image_path}"' not in content:  # Only process images without alt attribute
                description = get_image_description(image_path, md_file_path)
                if description:
                    image_descriptions[image_path] = description

        for image_path in hugo_matches:
            if f'alt=' not in content:  # Only process images without alt attribute
                description = get_image_description(image_path, md_file_path)
                if description:
                    image_descriptions[image_path] = description

        if image_descriptions:
            updated_content = update_markdown_content(content, image_descriptions)
            
            with open(md_file_path, 'w', encoding='utf-8') as file:
                file.write(updated_content)
            
            print(f"Updated markdown file: {md_file_path}")
        else:
            print(f"No updates needed for: {md_file_path}")

    except Exception as e:
        print(f"Failed to process markdown file {md_file_path}: {e}")
        traceback.print_exc()

for root, dirs, files in os.walk(SITE_PATH):
    for file_name in files:
        if file_name.endswith(".md"):
            md_file_path = os.path.join(root, file_name)
            process_markdown_file(md_file_path)