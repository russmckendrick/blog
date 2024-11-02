# Updated imports
import os
import requests
import json
import argparse
import random
import time
import re
import warnings
import logging
from datetime import datetime, timedelta
from collections import Counter
from jinja2 import Environment, FileSystemLoader
from fuzzywuzzy import fuzz
from typing import Any, Dict, List, Tuple, Optional
from pydantic import BaseModel
from crewai import Agent, Task, Crew, Process
from langchain.tools import BaseTool
from langchain_community.tools import DuckDuckGoSearchRun
from crewai_tools import WebsiteSearchTool
from config.config_loader import ConfigLoader
from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource

def configure_logging():
    """Configure logging and suppress unwanted warnings."""
    # Suppress the specific warning about TracerProvider
    warnings.filterwarnings(
        "ignore", 
        message="Overriding of current TracerProvider is not allowed"
    )
    
    # Configure basic logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Configure OpenTelemetry
    resource = Resource.create({})
    TracerProvider(resource=resource)
    LoggerProvider(resource=resource)

configure_logging()

# Environment variables
class Config:
    lastfm_user: str = os.getenv('LASTFM_USER')
    lastfm_api_key: str = os.getenv('LASTFM_API_KEY')
    collection_url: str = os.getenv('COLLECTION_URL')
    openai_api_key: str = os.getenv('OPENAI_API_KEY')
    model_name: str = os.getenv('OPENAI_MODEL_NAME', 'gpt-4')

# Rest of your tool initialization code...
def initialize_tools():
    """Initialize search tools with error handling."""
    try:
        return {
            'search': DuckDuckGoSearchRun(),
            'web': WebsiteSearchTool()
        }
    except Exception as e:
        print(f"Error initializing tools: {e}")
        return None

# If you need to create custom tools, use this pattern:
class CustomTool(BaseTool):
    name: str = "custom_tool_name"
    description: str = "Description of what this tool does"

    def _run(self, query: str) -> str:
        # Tool implementation
        pass

    def _arun(self, query: str) -> str:
        # Async implementation if needed
        raise NotImplementedError("Async not implemented")

class NumberGenerator:
    @staticmethod
    def generate_random_number() -> str:
        """Generate a random number between 1 and 23 in 3-digit format."""
        return str(random.randint(1, 23)).zfill(3)

class LastFMClient:
    def __init__(self, username: str, api_key: str):
        self.username = username
        self.api_key = api_key
        self.base_url = "http://ws.audioscrobbler.com/2.0/"

    def get_data(self, method: str, from_time: int, to_time: int) -> Dict:
        """
        Retrieve data from Last.fm API with improved error handling.
        
        Args:
            method: API method to call
            from_time: Start timestamp
            to_time: End timestamp
            
        Returns:
            Dict containing API response
            
        Raises:
            requests.exceptions.RequestException: If API request fails
        """
        try:
            params = {
                'method': method,
                'user': self.username,
                'api_key': self.api_key,
                'format': 'json',
                'from': from_time,
                'to': to_time
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching Last.fm data: {e}")
            raise

class TextSanitizer:
    @staticmethod
    def sanitize_output(text: Any) -> str:
        """
        Clean text output by removing unwanted characters.
        
        Args:
            text: Input text to clean (can be string or TaskOutput)
            
        Returns:
            Cleaned text string
        """
        try:
            # Convert input to string if it isn't already
            if not isinstance(text, str):
                # Handle TaskOutput objects
                if hasattr(text, 'raw'):
                    text = text.raw
                # Handle other objects by converting to string
                else:
                    text = str(text)
            
            # Remove unwanted characters
            return re.sub(r'[\'"]', '', text)
        except Exception as e:
            print(f"Error sanitizing text: {e}")
            return ""
        return re.sub(r'[\'"]', '', text)

class CollectionManager:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.local_file = 'index.json'
        
    def get_collection_data(self) -> Dict:
        """
        Retrieve and process collection data with improved caching and error handling.
        
        Returns:
            Dict containing processed collection data
        """
        try:
            self._update_local_cache()
            return self._process_collection_data()
        except Exception as e:
            print(f"Error processing collection data: {e}")
            raise

    def _update_local_cache(self):
        """Update local cache if needed."""
        should_update = (
            not os.path.exists(self.local_file) or
            time.time() - os.path.getmtime(self.local_file) > 3600
        )
        
        if should_update:
            response = requests.get(f'{self.base_url}/index.json')
            response.raise_for_status()
            with open(self.local_file, 'wb') as f:
                f.write(response.content)

    def _process_collection_data(self) -> Dict:
        """Process collection data from local cache."""
        with open(self.local_file, 'r') as f:
            data = json.load(f)
        
        info = {}
        for doc in data['documents']:
            self._process_document(doc, info)
        return info

    def _process_document(self, doc: Dict, info: Dict):
        """Process individual document data."""
        artist = doc.get('artist')
        album = doc.get('album')
        cover_image = doc.get('coverImage')
        artist_image = doc.get('artistImage')
        album_uri = doc.get('uri')
        artist_uri = doc.get('artistUri')

        if artist and album and album_uri:
            info[(artist, album)] = {
                'album_image': cover_image if cover_image and cover_image.startswith('https://') else None,
                'album_link': f"{self.base_url}{album_uri}"
            }

        if artist and artist_uri:
            info[artist] = {
                'artist_image': artist_image if artist_image and artist_image.startswith('https://') else None,
                'artist_link': artist_uri
            }

class MusicResearchAgent:
    def __init__(self, tools: Dict[str, BaseTool]):
        self.tools = tools
        
    def create_agent(self, album: str) -> Agent:
        """Create a music research agent with specified configuration."""
        return Agent(
            role="Music Research",
            goal=f"Research and write about the album '{album}'",
            backstory=f"""You are an expert music blogger with deep knowledge about 
                music across all genres. You're writing about '{album}'.""",
            tools=[self.tools['search'], self.tools['web']],
            verbose=True,
            llm_config={
                "temperature": 0.7,
                "max_tokens": 1500
            }
        )

    def create_task(self, agent: Agent, album: str) -> Task:
        """Create a research task for the specified album."""
        return Task(
            description=f"Research and write about '{album}'",
            expected_output="A well-structured blog post section in markdown format",
            agent=agent,
            tools=[self.tools['search'], self.tools['web']],
            context=[],
            output_json=None
        )

class BlogPostGenerator:
    """
    Main class responsible for generating blog posts about weekly music listening habits.
    """
    def __init__(self, config: Config):
        self.config = config
        self.tools = initialize_tools()
        self.lastfm_client = LastFMClient(config.lastfm_user, config.lastfm_api_key)
        self.collection_manager = CollectionManager(config.collection_url)
        self.music_research_agent = MusicResearchAgent(self.tools)
        
    def generate_blog_post(self, week_start: datetime, week_end: datetime) -> None:
        """
        Generate a complete blog post about weekly music listening habits.
        
        Args:
            week_start: Start date of the week
            week_end: End date of the week
        """
        try:
            # Setup folder structure
            date_str = week_end.strftime('%Y-%m-%d')
            week_number = week_start.strftime('%U')
            folders = self._create_folder_structure(date_str)
            
            # Gather data
            music_data = self._gather_music_data(week_start, week_end)
            processed_data = self._process_music_data(music_data)
            
            # Generate content
            content = self._generate_content(processed_data, date_str, week_number)
            
            # Save images
            self._handle_images(processed_data, folders)
            
            # Render final blog post
            self._render_blog_post(content, folders['post'])
            
            print(f"Successfully generated blog post for week {week_number}")
            
        except Exception as e:
            print(f"Error in blog post generation: {e}")
            raise

    def _create_folder_structure(self, date_str: str) -> Dict[str, str]:
        """Create necessary folders for the blog post."""
        post_folder = f"content/tunes/{date_str}-listened-to-this-week"
        folders = {
            'post': post_folder,
            'albums': os.path.join(post_folder, "albums"),
            'artists': os.path.join(post_folder, "artists")
        }
        
        for folder in folders.values():
            os.makedirs(folder, exist_ok=True)
            
        return folders

    def _gather_music_data(self, week_start: datetime, week_end: datetime) -> Dict:
        """Gather all necessary music data."""
        start_timestamp = int(week_start.timestamp())
        end_timestamp = int(week_end.timestamp())
        
        return {
            'artist_data': self.lastfm_client.get_data(
                'user.getweeklyartistchart', start_timestamp, end_timestamp
            ),
            'album_data': self.lastfm_client.get_data(
                'user.getweeklyalbumchart', start_timestamp, end_timestamp
            ),
            'collection_info': self.collection_manager.get_collection_data()
        }

    def _process_music_data(self, music_data: Dict) -> Dict:
        """Process raw music data into usable format."""
        # Process artist data
        artist_counter = Counter()
        for artist in music_data['artist_data']['weeklyartistchart']['artist']:
            artist_counter[artist['name']] += int(artist['playcount'])
        
        # Process album data
        album_counter = Counter()
        for album in music_data['album_data']['weeklyalbumchart']['album']:
            key = (album['artist']['#text'], album['name'])
            album_counter[key] += int(album['playcount'])
        
        return {
            'top_artists': artist_counter.most_common(12),
            'top_albums': album_counter.most_common(12),
            'collection_info': music_data['collection_info']
        }

    def _generate_content(self, processed_data: Dict, date_str: str, week_number: str) -> Dict:
        """Generate all content for the blog post."""
        # Create content generator
        content_generator = BlogPostContent(self.tools)
        
        # Generate title and summary
        title, summary = content_generator.generate_title_and_summary(
            date_str,
            week_number,
            processed_data['top_artists'],
            processed_data['top_albums']
        )
        
        # Generate blog sections
        blog_sections = []
        for (artist, album), _ in processed_data['top_albums']:
            album_result = content_generator.research_album(f"{album} by {artist}")
            blog_sections.append(album_result)
        
        return {
            'title': title,
            'summary': summary,
            'blog_sections': "\n\n".join(blog_sections),
            'top_artists': processed_data['top_artists'],
            'top_albums': processed_data['top_albums'],
            'collection_info': processed_data['collection_info']
        }

    def _handle_images(self, processed_data: Dict, folders: Dict[str, str]) -> None:
        """Handle downloading and saving of images."""
        image_handler = ImageHandler()
        collection_info = processed_data['collection_info']
        
        # Separate artist and album info
        artist_info = {artist: data for artist, data in collection_info.items() 
                      if not isinstance(artist, tuple)}
        album_info = {key: data for key, data in collection_info.items() 
                     if isinstance(key, tuple)}
        
        # Download artist images
        for artist, _ in processed_data['top_artists']:
            best_match = self._find_best_match(artist, artist_info)
            if best_match and best_match.get('artist_image'):
                image_handler.download_image(
                    best_match['artist_image'],
                    folders['artists'],
                    artist
                )
        
        # Download album images
        for (artist, album), _ in processed_data['top_albums']:
            best_match = self._find_best_album_match(artist, album, album_info)
            if best_match and best_match.get('album_image'):
                image_handler.download_image(
                    best_match['album_image'],
                    folders['albums'],
                    album
                )

    def _find_best_match(self, name: str, info_dict: Dict) -> Optional[Dict]:
        """Find best matching entry using fuzzy matching."""
        max_ratio = 0
        best_match = None
        for key, data in info_dict.items():
            ratio = fuzz.ratio(name.lower(), key.lower())
            if ratio > max_ratio:
                max_ratio = ratio
                best_match = data
        return best_match if max_ratio > 80 else None

    def _find_best_album_match(self, artist: str, album: str, album_info: Dict) -> Optional[Dict]:
            """Find best matching album using improved fuzzy matching."""
            max_ratio = 0
            best_match = None
            
            # Clean input strings
            clean_artist = artist.lower().strip()
            clean_album = album.lower().strip()
            
            for (a, b), data in album_info.items():
                # Clean comparison strings
                comp_artist = a.lower().strip()
                comp_album = b.lower().strip()
                
                # Calculate ratios using multiple methods
                artist_ratio = max(
                    fuzz.ratio(clean_artist, comp_artist),
                    fuzz.partial_ratio(clean_artist, comp_artist),
                    fuzz.token_sort_ratio(clean_artist, comp_artist)
                )
                
                # Only proceed if artist matches with high confidence
                if artist_ratio >= 85:
                    album_ratio = max(
                        fuzz.ratio(clean_album, comp_album),
                        fuzz.partial_ratio(clean_album, comp_album),
                        fuzz.token_sort_ratio(clean_album, comp_album)
                    )
                    
                    # Weighted combination of both ratios
                    combined_ratio = (artist_ratio * 0.4) + (album_ratio * 0.6)
                    
                    if combined_ratio > max_ratio:
                        max_ratio = combined_ratio
                        best_match = data
            
            # Return match only if the combined ratio is high enough
            return best_match if max_ratio >= 85 else None

    def _render_blog_post(self, content: Dict, post_folder: str) -> None:
        """Render the final blog post using template."""
        context = {
            'date': content['date_str'],
            'week_number': content['week_number'],
            'top_artists': content['top_artists'],
            'top_albums': content['top_albums'],
            'artist_info': {artist: data for artist, data in content['collection_info'].items() 
                          if not isinstance(artist, tuple)},
            'album_info': {key: data for key, data in content['collection_info'].items() 
                          if isinstance(key, tuple)},
            'title': content['title'],
            'summary': content['summary'],
            'blog_post': content['blog_sections'],
            'random_number': NumberGenerator.generate_random_number(),
        }
        
        env = Environment(loader=FileSystemLoader('.'))
        template = env.get_template('lastfm-post-template.md')
        rendered_content = template.render(context)
        
        with open(os.path.join(post_folder, 'index.md'), 'w') as f:
            f.write(rendered_content)

class BlogPostTask:
    """Handles blog post task creation and management"""
    
    def __init__(self, tools: Dict[str, BaseTool]):
        self.tools = tools

    def create_title_agent(self) -> Agent:
        """Create an agent for generating blog post titles."""
        return Agent(
            role="Title Generator",
            goal="Generate catchy and SEO-friendly blog post titles",
            backstory="""You are an expert in creating engaging, SEO-optimized titles 
                for music-related blog posts. You excel at capturing attention while
                maintaining readability.""",
            tools=[],
            verbose=True
        )

    def create_summary_agent(self) -> Agent:
        """Create an agent for generating blog post summaries."""
        return Agent(
            role="Summary Generator",
            goal="Generate concise and informative blog post summaries",
            backstory="""You are skilled at distilling complex music-related content 
                into clear, engaging summaries that inform and intrigue readers.""",
            tools=[],
            verbose=True
        )

    def create_title_task(self, top_artists: List[Tuple[str, int]], top_albums: List[Tuple[Tuple[str, str], int]], agent: Agent) -> Task:
        """Create a task for generating the blog post title."""
        artists_str = ', '.join(artist for artist, _ in top_artists)
        albums_str = ', '.join(album for (_, album), _ in top_albums)
        
        return Task(
            description=f"Generate a title for a weekly music blog post featuring: {artists_str} and albums: {albums_str}",
            expected_output="A catchy, SEO-friendly title under 70 characters without special characters",
            agent=agent
        )

    def create_summary_task(self, week_number: str, date_str: str, 
                          top_artists: List[Tuple[str, int]], 
                          top_albums: List[Tuple[Tuple[str, str], int]], 
                          agent: Agent) -> Task:
        """Create a task for generating the blog post summary."""
        artists_str = ', '.join(artist for artist, _ in top_artists)
        albums_str = ', '.join(album for (_, album), _ in top_albums)
        
        return Task(
            description=f"""Generate a summary for week {week_number} starting {date_str} 
                featuring: {artists_str} and albums: {albums_str}""",
            expected_output="A concise, SEO-friendly summary under 180 characters without special characters",
            agent=agent
        )

class ImageHandler:
    """Handles image downloads and processing"""
    
    @staticmethod
    def download_image(url: str, folder: str, name: str):
        """Download and save image with metadata."""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            clean_name = name.replace(' ', '-').replace('/', '-')
            image_path = os.path.join(folder, f"{clean_name}.jpg")
            meta_path = os.path.join(folder, f"{clean_name}.jpg.meta")
            
            with open(image_path, 'wb') as out_file:
                out_file.write(response.content)
                
            metadata = {"Title": name}
            with open(meta_path, 'w') as json_file:
                json.dump(metadata, json_file)
                
            print(f"Successfully downloaded and saved image: {image_path}")
            
        except Exception as e:
            print(f"Error downloading image {url}: {e}")

# blog_post_generator.py
from config.config_loader import ConfigLoader

class BlogPostContent:
    """Handles blog post content generation using YAML configurations."""
    
    def __init__(self, tools: Dict[str, BaseTool]):
        self.tools = tools
        self.config_loader = ConfigLoader()
        self.config_loader.set_tools(tools)

    def generate_title_and_summary(self, date_str: str, week_number: str,
                                 top_artists: List[Tuple[str, int]], 
                                 top_albums: List[Tuple[Tuple[str, str], int]]) -> Tuple[str, str]:
        """Generate title and summary using configured agents."""
        try:
            # Create agents
            title_agent = self.config_loader.create_agent('title_generator_agent')
            summary_agent = self.config_loader.create_agent('summary_generator_agent')

            # Prepare context for tasks
            context = {
                'artists': ', '.join(artist for artist, _ in top_artists),
                'albums': ', '.join(album for (_, album), _ in top_albums),
                'week_number': week_number,
                'date_str': date_str
            }

            # Create tasks
            title_task = self.config_loader.create_task('generate_title', title_agent, context)
            summary_task = self.config_loader.create_task('generate_summary', summary_agent, context)

            # Execute tasks
            crew = Crew(
                agents=[title_agent, summary_agent],
                tasks=[title_task, summary_task],
                process=Process.sequential,
                max_rpm=10,
                verbose=True
            )

            result = crew.kickoff()
            
            # Get outputs handling different response formats
            if hasattr(result, 'tasks_output'):
                title = TextSanitizer.sanitize_output(result.tasks_output[0].raw)
                summary = TextSanitizer.sanitize_output(result.tasks_output[1].raw)
            elif isinstance(result, list) and len(result) >= 2:
                title = TextSanitizer.sanitize_output(result[0])
                summary = TextSanitizer.sanitize_output(result[1])
            elif isinstance(result, str):
                # Handle string output by splitting on double newline
                parts = result.split('\n\n', 1)
                title = TextSanitizer.sanitize_output(parts[0] if parts else "Weekly Music Roundup")
                summary = TextSanitizer.sanitize_output(parts[1] if len(parts) > 1 else parts[0])
            else:
                # Default fallback
                title = "Weekly Music Roundup"
                summary = "A weekly exploration of music highlights and discoveries."

            return title, summary
            
        except Exception as e:
            print(f"Error in generate_title_and_summary: {e}")
            raise

    def research_album(self, album: str) -> str:
        """Research an album using configured agent."""
        try:
            # Create agent
            researcher = self.config_loader.create_agent('music_research_agent')
            
            # Create task with context
            context = {'album': album}
            research_task = self.config_loader.create_task('research_album', researcher, context)

            # Execute task
            crew = Crew(
                agents=[researcher],
                tasks=[research_task],
                process=Process.sequential,
                max_rpm=10,
                verbose=True
            )

            result = crew.kickoff()
            
            # Handle different response formats
            if hasattr(result, 'tasks_output') and result.tasks_output:
                return TextSanitizer.sanitize_output(result.tasks_output[0].raw)
            elif isinstance(result, str):
                return TextSanitizer.sanitize_output(result)
            elif isinstance(result, list) and len(result) > 0:
                return TextSanitizer.sanitize_output(result[0])
            else:
                return TextSanitizer.sanitize_output(str(result))
                
        except Exception as e:
            print(f"Error in research_album: {e}")
            raise

class BlogPostManager:
    """Manages the entire blog post generation process"""
    
    def __init__(self, config: Config):
        self.config = config
        self.tools = initialize_tools()
        self.lastfm_client = LastFMClient(config.lastfm_user, config.lastfm_api_key)
        self.collection_manager = CollectionManager(config.collection_url)
        self.content_generator = BlogPostContent(self.tools)
        self.image_handler = ImageHandler()
        
    def generate_blog_post(self, week_start: datetime, week_end: datetime):
        """Generate complete blog post."""
        try:
            # Setup basic information
            date_str = week_end.strftime('%Y-%m-%d')
            week_number = week_start.strftime('%U')
            
            # Create directory structure
            post_folder = f"content/tunes/{date_str}-listened-to-this-week"
            albums_folder = os.path.join(post_folder, "albums")
            artists_folder = os.path.join(post_folder, "artists")
            os.makedirs(albums_folder, exist_ok=True)
            os.makedirs(artists_folder, exist_ok=True)
            
            # Gather data
            start_timestamp = int(week_start.timestamp())
            end_timestamp = int(week_end.timestamp())
            
            artist_data = self.lastfm_client.get_data('user.getweeklyartistchart', 
                                                     start_timestamp, end_timestamp)
            album_data = self.lastfm_client.get_data('user.getweeklyalbumchart',
                                                    start_timestamp, end_timestamp)
            collection_info = self.collection_manager.get_collection_data()
            
            # Process data
            top_artists = self._process_artist_data(artist_data)
            top_albums = self._process_album_data(album_data)
            
            # Generate content
            title, summary = self.content_generator.generate_title_and_summary(
                date_str, week_number, top_artists, top_albums)
            
            # Download images
            self._handle_images(top_artists, top_albums, collection_info, 
                              artists_folder, albums_folder)
            
            # Generate blog post sections
            blog_sections = self._generate_blog_sections(top_albums)
            
            # Render final blog post
            self._render_blog_post(post_folder, date_str, week_number,
                                 top_artists, top_albums, collection_info,
                                 title, summary, blog_sections)
            
        except Exception as e:
            print(f"Error generating blog post: {e}")
            raise

    def _process_artist_data(self, artist_data: Dict) -> List[Tuple[str, int]]:
        """Process artist data and return top artists."""
        artists = Counter()
        for artist in artist_data['weeklyartistchart']['artist']:
            artists[artist['name']] += int(artist['playcount'])
        return artists.most_common(12)

    def _process_album_data(self, album_data: Dict) -> List[Tuple[Tuple[str, str], int]]:
        """Process album data and return top albums."""
        albums = Counter()
        for album in album_data['weeklyalbumchart']['album']:
            key = (album['artist']['#text'], album['name'])
            albums[key] += int(album['playcount'])
        return albums.most_common(12)

    def _handle_images(self, top_artists, top_albums, collection_info, artists_folder, albums_folder):
        """Handle downloading of artist and album images."""
        artist_info = {artist: data for artist, data in collection_info.items() 
             if not isinstance(artist, tuple)}
        album_info = {key: data for key, data in collection_info.items() 
                     if isinstance(key, tuple)}
        
        # Process artist images
        for artist, _ in top_artists:
            best_match = self._find_best_match(artist, artist_info)
            if best_match and best_match.get('artist_image'):
                self.image_handler.download_image(
                    best_match['artist_image'], artists_folder, artist)
        
        # Process album images
        for (artist, album), _ in top_albums:
            best_match = self._find_best_album_match(artist, album, album_info)
            if best_match and best_match.get('album_image'):
                self.image_handler.download_image(
                    best_match['album_image'], albums_folder, album)

    def _find_best_match(self, name: str, info_dict: Dict) -> Optional[Dict]:
        """Find best matching entry using fuzzy matching."""
        max_ratio = 0
        best_match = None
        for key, data in info_dict.items():
            ratio = fuzz.ratio(name.lower(), key.lower())
            if ratio > max_ratio:
                max_ratio = ratio
                best_match = data
        return best_match if max_ratio > 80 else None

    def _find_best_album_match(self, artist: str, album: str, album_info: Dict) -> Optional[Dict]:
        """Find best matching album using fuzzy matching."""
        max_ratio = 0
        best_match = None
        for (a, b), data in album_info.items():
            if fuzz.ratio(artist.lower(), a.lower()) > 80:
                ratio = fuzz.ratio(album.lower(), b.lower())
                if ratio > max_ratio:
                    max_ratio = ratio
                    best_match = data
        return best_match if max_ratio > 80 else None

    def _generate_blog_sections(self, top_albums: List[Tuple[Tuple[str, str], int]]) -> str:
        """Generate blog post sections for each album."""
        sections = []
        for (artist, album), _ in top_albums:
            result = self.content_generator.research_album(f"{album} by {artist}")
            sections.append(result)
        return "\n\n".join(sections)

    def _render_blog_post(self, post_folder: str, date_str: str, week_number: str,
                         top_artists: List[Tuple[str, int]], 
                         top_albums: List[Tuple[Tuple[str, str], int]],
                         collection_info: Dict, title: str, summary: str,
                         blog_sections: str):
        """Render the final blog post using template."""
        context = {
            'date': date_str,
            'week_number': week_number,
            'top_artists': top_artists,
            'top_albums': top_albums,
            'artist_info': {artist: data for artist, data in collection_info.items() 
                          if not isinstance(artist, tuple)},
            'album_info': {key: data for key, data in collection_info.items() 
                          if isinstance(key, tuple)},
            'title': title,
            'summary': summary,
            'blog_post': blog_sections,
            'random_number': NumberGenerator.generate_random_number(),
        }
        
        env = Environment(loader=FileSystemLoader('.'))
        template = env.get_template('lastfm-post-template.md')
        content = template.render(context)
        
        with open(os.path.join(post_folder, 'index.md'), 'w') as f:
            f.write(content)

def main():
    """Main entry point for the blog post generator."""
    parser = argparse.ArgumentParser(
        description='Generate a blog post about your week in music.')
    parser.add_argument(
        '--week_start', 
        type=str,
        help='Starting date of the week (YYYY-MM-DD). Defaults to 7 days ago.'
    )
    
    args = parser.parse_args()
    
    # Initialize dates
    week_start = (datetime.strptime(args.week_start, '%Y-%m-%d') 
                 if args.week_start else datetime.now() - timedelta(days=7))
    week_end = week_start + timedelta(days=7)
    
    # Initialize and run blog post generator
    try:
        config = Config()
        manager = BlogPostManager(config)
        manager.generate_blog_post(week_start, week_end)
        print("Blog post generated successfully!")
        
    except Exception as e:
        print(f"Error generating blog post: {e}")
        raise

if __name__ == '__main__':
    main()