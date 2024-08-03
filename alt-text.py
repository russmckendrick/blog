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

# Get the directory where the script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_image_path(relative_path):
    possible_paths = [
        os.path.join(SITE_PATH, relative_path.lstrip('/')),
        os.path.join(SCRIPT_DIR, 'static', relative_path.lstrip('/')),
        os.path.join(SCRIPT_DIR, relative_path.lstrip('/')),
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    print(f"Image not found in any of these locations:")
    for path in possible_paths:
        print(f"  - {path}")
    return None

def get_image_description(image_path):
    try:
        full_image_path = get_image_path(image_path)
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
        traceback.print_exc()  # Print full traceback 

    return None

def update_markdown_content(content, image_descriptions):
    def replace_image(match):
        full_match = match.group(0)
        alt_text = match.group(1)
        image_path = match.group(2)
        
        if alt_text:  # If alt text is already present, don't change it
            return full_match
        
        if image_path in image_descriptions:
            new_alt_text = image_descriptions[image_path]
            return f'![{new_alt_text}]({image_path})'
        
        return full_match

    # Regular expression to match image references in markdown
    image_pattern = r'!\[(.*?)\]\((.*?)\)'
    
    # Replace image references with updated ones (including alt text)
    updated_content = re.sub(image_pattern, replace_image, content)
    
    return updated_content

def process_markdown_file(md_file_path):
    try:
        with open(md_file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Find all image references in the markdown content
        image_pattern = r'!\[(.*?)\]\((.*?)\)'
        image_matches = re.findall(image_pattern, content)

        image_descriptions = {}
        for alt_text, image_path in image_matches:
            if not alt_text:  # Only process images without alt text
                description = get_image_description(image_path)
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