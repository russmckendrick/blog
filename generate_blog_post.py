import os
import requests
import json
import argparse
import random
import time
import re
import warnings
import logging
import unicodedata
from datetime import datetime, timedelta
from collections import Counter
from jinja2 import Environment, FileSystemLoader
from fuzzywuzzy import fuzz
from typing import Any, Dict, List, Tuple, Optional

# Suppress deprecation warnings early
warnings.filterwarnings("ignore", message=".*TracerProvider.*")
warnings.filterwarnings("ignore", message=".*class-based.*config.*deprecated.*") 
warnings.filterwarnings("ignore", message=".*schema.*method.*deprecated.*")
warnings.filterwarnings("ignore", message=".*path_separator.*configuration.*")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pydantic")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="alembic")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="opentelemetry")

from pydantic import BaseModel
from crewai import Agent, Task, Crew, Process
from langchain.tools import BaseTool
from crewai_tools import SerperDevTool, WebsiteSearchTool
try:
    from langchain_community.tools import DuckDuckGoSearchRun
except ImportError:
    DuckDuckGoSearchRun = None
from config.config_loader import ConfigLoader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

no_of_items = 11

def normalize_text(text: str) -> str:
    """Normalize text for case-insensitive Unicode matching."""
    if not text:
        return ""
    # Normalize Unicode characters and convert to lowercase
    return unicodedata.normalize('NFKD', text.strip()).lower()

class SimpleFallbackTool(BaseTool):
    """Fallback tool when other search tools aren't available."""
    name: str = "simple_search"
    description: str = "A simple fallback search tool"
    
    def _run(self, query: str) -> str:
        return f"Search query: {query} - Using fallback search mode"

# Shared utility functions
class Utils:
    @staticmethod
    def initialize_tools() -> Dict[str, BaseTool]:
        """Initialize search tools with error handling."""
        try:
            tools = {}
            
            # Try to use SerperDevTool first (CrewAI native)
            try:
                tools['search'] = SerperDevTool()
            except Exception:
                # Fallback to DuckDuckGo if SerperDevTool fails
                try:
                    if DuckDuckGoSearchRun:
                        tools['search'] = DuckDuckGoSearchRun()
                    else:
                        raise Exception("DuckDuckGo not available")
                except Exception:
                    # Final fallback
                    print("Using fallback search tool")
                    tools['search'] = SimpleFallbackTool()
            
            # Web search tool
            tools['web'] = WebsiteSearchTool()
            
            return tools
        except Exception as e:
            print(f"Error initializing tools: {e}")
            return {}

    @staticmethod
    def configure_logging():
        """Configure logging for the application."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )

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
                if hasattr(text, 'raw'):
                    text = text.raw
                else:
                    text = str(text)
            return re.sub(r"[\'\"]", '', text)
        except Exception as e:
            print(f"Error sanitizing text: {e}")
            return ""

    @staticmethod
    def find_best_match(name: str, info_dict: Dict) -> Optional[Dict]:
        """Find best matching entry using fuzzy matching."""
        max_ratio = 0
        best_match = None
        normalized_name = normalize_text(name)
        for key, data in info_dict.items():
            normalized_key = normalize_text(key) if isinstance(key, str) else key
            ratio = fuzz.ratio(normalized_name, normalized_key)
            if ratio > max_ratio:
                max_ratio = ratio
                best_match = data
        return best_match if max_ratio > 70 else None

    @staticmethod
    def find_best_album_match(artist: str, album: str, album_info: Dict) -> Optional[Dict]:
        """Find best matching album using fuzzy matching."""
        max_ratio = 0
        best_match = None
        normalized_artist = normalize_text(artist)
        normalized_album = normalize_text(album)
        for (a, b), data in album_info.items():
            normalized_a = normalize_text(a) if isinstance(a, str) else a
            normalized_b = normalize_text(b) if isinstance(b, str) else b
            artist_match_ratio = fuzz.ratio(normalized_artist, normalized_a)
            album_match_ratio = fuzz.ratio(normalized_album, normalized_b)
            combined_ratio = (artist_match_ratio + album_match_ratio) / 2
            if combined_ratio > max_ratio:
                max_ratio = combined_ratio
                best_match = data
        return best_match if max_ratio > 70 else None

    @staticmethod
    def lookup_artist_data(artist: str, collection_info: Dict) -> Optional[Tuple[str, str]]:
        """Consistent artist lookup using fuzzy matching. Returns (link, image) tuple or None."""
        artist_info = {artist: data for artist, data in collection_info.items() if not isinstance(artist, tuple)}
        best_match = Utils.find_best_match(artist, artist_info)
        if best_match:
            return best_match.get('artist_link'), best_match.get('artist_image')
        return None

    @staticmethod
    def lookup_album_data(artist: str, album: str, collection_info: Dict) -> Optional[Tuple[str, str]]:
        """Consistent album lookup using fuzzy matching. Returns (link, image) tuple or None."""
        album_info = {key: data for key, data in collection_info.items() if isinstance(key, tuple)}
        best_match = Utils.find_best_album_match(artist, album, album_info)
        if best_match:
            return best_match.get('album_link'), best_match.get('album_image')
        return None


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


class CollectionManager:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.local_file = 'collection.json'
        
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
            response = requests.get(f'{self.base_url}/collection.json')
            response.raise_for_status()
            with open(self.local_file, 'wb') as f:
                f.write(response.content)

    def _process_collection_data(self) -> Dict:
        """Process collection data from local cache with case preservation."""
        with open(self.local_file, 'r') as f:
            data = json.load(f)
        
        info = {}
        original_cases = {}  # Store original cases
        
        # Handle the new collection.json format - data is a list of releases
        for release in data:
            self._process_release(release, info, original_cases)
        return info, original_cases

    def _process_release(self, release: Dict, info: Dict, original_cases: Dict):
        """Process individual release data while preserving original cases."""
        artist = release.get('release_artist')
        album = release.get('release_name')
        
        # Get hi-res images from the new format
        album_image_url = None
        image_base_url = 'https://assets.russ.fm'
        
        if release.get('images_uri_release') and release['images_uri_release'].get('hi-res'):
            album_image_url = f"{image_base_url}{release['images_uri_release']['hi-res']}"
        
        # Get URIs for album and artist pages
        album_uri = f"{self.base_url}{release.get('uri_release', '')}" if release.get('uri_release') else None
        
        if artist and album and album_uri:
            # Store normalized key for matching
            key = (normalize_text(artist), normalize_text(album))
            info[key] = {
                'album_image': album_image_url,
                'album_link': album_uri
            }
            # Store original case
            original_cases[key] = {'artist': artist, 'album': album}

        # Process artist data from the nested artists array
        if release.get('artists'):
            for artist_data in release['artists']:
                artist_name = artist_data.get('name')
                artist_uri_path = artist_data.get('uri_artist')
                
                if artist_name and artist_uri_path:
                    artist_key = normalize_text(artist_name)
                    artist_uri = f"{self.base_url}{artist_uri_path}"
                    
                    # Generate artist image URL using the URI path (which handles special chars correctly)
                    # Extract the slug from the URI path and construct image URL
                    artist_slug = artist_uri_path.strip('/').split('/')[-1]  # e.g., "sigur-ros" from "/artist/sigur-ros/"
                    artist_image_url = f"{image_base_url}/artist/{artist_slug}/{artist_slug}-hi-res.jpg"
                    
                    info[artist_key] = {
                        'artist_image': artist_image_url,
                        'artist_link': artist_uri
                    }
                    original_cases[artist_key] = artist_name


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
            
            # Handle different response formats
            if hasattr(result, 'tasks_output') and len(result.tasks_output) >= 2:
                title = Utils.sanitize_output(result.tasks_output[0].raw)
                summary = Utils.sanitize_output(result.tasks_output[1].raw)
            elif isinstance(result, list) and len(result) >= 2:
                title = Utils.sanitize_output(result[0])
                summary = Utils.sanitize_output(result[1])
            else:
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
            return Utils.sanitize_output(result.tasks_output[0].raw if hasattr(result, 'tasks_output') and result.tasks_output else result)
            
        except Exception as e:
            print(f"Error in research_album: {e}")
            raise


class NumberGenerator:
    @staticmethod
    def generate_random_number() -> str:
        """Generate a random number between 1 and 23 in 3-digit format."""
        return str(random.randint(1, 23)).zfill(3)


class BlogPostGenerator:
    """
    Main class responsible for generating blog posts about weekly music listening habits.
    """
    def __init__(self, config: ConfigLoader, debug: bool = False):
        self.config = config
        self.tools = Utils.initialize_tools()
        self.lastfm_client = LastFMClient(os.getenv('LASTFM_USER'), os.getenv('LASTFM_API_KEY'))
        self.collection_manager = CollectionManager(os.getenv('COLLECTION_URL'))
        self.content_generator = BlogPostContent(self.tools)
        self.debug = debug

    def generate_blog_post(self, week_start: datetime, week_end: datetime) -> None:
        """
        Generate a complete blog post about weekly music listening habits.
        
        Args:
            week_start: Start date of the week
            week_end: End date of the week
        """
        try:
            date_str = week_end.strftime('%Y-%m-%d')
            week_number = week_start.strftime('%U')
            post_folder = f"content/tunes/{date_str}-listened-to-this-week"
            albums_folder = os.path.join(post_folder, "albums")
            artists_folder = os.path.join(post_folder, "artists")
            os.makedirs(albums_folder, exist_ok=True)
            os.makedirs(artists_folder, exist_ok=True)

            # Gather data
            start_timestamp = int(week_start.timestamp())
            end_timestamp = int(week_end.timestamp())
            
            artist_data = self.lastfm_client.get_data('user.getweeklyartistchart', start_timestamp, end_timestamp)
            album_data = self.lastfm_client.get_data('user.getweeklyalbumchart', start_timestamp, end_timestamp)
            collection_info, original_cases = self.collection_manager.get_collection_data()
            
            # Process data (storing original case)
            top_artists = self._process_artist_data(artist_data, original_cases)
            top_albums = self._process_album_data(album_data, original_cases)

            # If in debug mode, limit to one album
            if self.debug:
                top_artists = top_artists[:1]
                top_albums = top_albums[:1]
                print("Running in debug mode. Only processing one album.")

            # Print links and pause for verification
            self._print_links(collection_info, top_artists, top_albums)
            time.sleep(5)

            # Generate content
            title, summary = self.content_generator.generate_title_and_summary(date_str, week_number, top_artists, top_albums)
            blog_sections = self._generate_blog_sections(top_albums)
            
            # Download images
            self._handle_images(top_artists, top_albums, collection_info, artists_folder, albums_folder)

            # Render final blog post
            self._render_blog_post(
                post_folder=post_folder,
                date_str=date_str,
                week_number=week_number,
                top_artists=top_artists,
                top_albums=top_albums,
                collection_info=collection_info,
                title=title,
                summary=summary,
                blog_sections=blog_sections
            )
            
            print(f"Successfully generated blog post for week {week_number}")
        
        except Exception as e:
            print(f"Error in blog post generation: {e}")
            raise

    def _process_artist_data(self, artist_data: Dict, original_cases: Dict) -> List[Tuple[str, int]]:
        """Process artist data while preserving original case for display."""
        artists = Counter()
        original_entries = {}  # Store original case entries
        
        for artist in artist_data['weeklyartistchart']['artist']:
            artist_name = artist['name']
            # Use normalized text for the counter key
            key = normalize_text(artist_name)
            artists[key] += int(artist['playcount'])
            # Store original case
            original_entries[key] = artist_name
    
        # Convert back to original case for display
        return [(original_entries.get(key, key), count) for key, count in artists.most_common(no_of_items)]
    

    def _process_album_data(self, album_data: Dict, original_cases: Dict) -> List[Tuple[Tuple[str, str], int]]:
        """Process album data while preserving original case for display."""
        albums = Counter()
        original_entries = {}  # Store original case entries
        
        for album in album_data['weeklyalbumchart']['album']:
            artist = album['artist']['#text']
            album_name = album['name']
            # Use normalized text for the counter key
            key = (normalize_text(artist), normalize_text(album_name))
            albums[key] += int(album['playcount'])
            # Store original case
            original_entries[key] = (artist, album_name)
        
        # Convert back to original case for display
        return [(original_entries.get(key, key), count) for key, count in albums.most_common(no_of_items)]

    def _generate_blog_sections(self, top_albums: List[Tuple[Tuple[str, str], int]]) -> str:
        sections = []
        for (artist, album), _ in top_albums:
            result = self.content_generator.research_album(f"{album} by {artist}")
            sections.append(result)
        return "\n\n".join(sections)

    def _handle_images(self, top_artists, top_albums, collection_info, artists_folder, albums_folder):
        for artist, _ in top_artists:
            artist_data = Utils.lookup_artist_data(artist, collection_info)
            if artist_data:
                artist_link, artist_image = artist_data
                if artist_image:
                    ImageHandler.download_image(artist_image, artists_folder, artist)

        for (artist, album), _ in top_albums:
            album_data = Utils.lookup_album_data(artist, album, collection_info)
            if album_data:
                album_link, album_image = album_data
                if not album_image:
                    print(f"Missing album image for {album} by {artist}")
                if not album_link:
                    print(f"Missing album link for {album} by {artist}")
                if album_image:
                    ImageHandler.download_image(album_image, albums_folder, album)

    def _print_links(self, collection_info: Dict, top_artists: List[Tuple[str, int]], top_albums: List[Tuple[Tuple[str, str], int]]):
        print("\nArtist Links:")
        for artist, _ in top_artists:
            artist_data = Utils.lookup_artist_data(artist, collection_info)
            if artist_data:
                artist_link, artist_image = artist_data
                print(f"{artist}: {artist_link or 'No link available'}")
            else:
                print(f"No data found for {artist}")

        print("\nAlbum Links:")
        for (artist, album), _ in top_albums:
            album_data = Utils.lookup_album_data(artist, album, collection_info)
            if album_data:
                album_link, album_image = album_data
                print(f"{album} by {artist}: {album_link or 'No link available'}")
            else:
                print(f"No data found for {album} by {artist}")

    def _render_blog_post(self, post_folder: str, date_str: str, week_number: str,
                        top_artists: List[Tuple[str, int]], top_albums: List[Tuple[Tuple[str, str], int]],
                        collection_info: Dict, title: str, summary: str, blog_sections: str):
        """Render blog post with preserved case sensitivity."""
        context = {
            'date': date_str,
            'week_number': week_number,
            'top_artists': top_artists,
            'top_albums': top_albums,
            'artist_info': {artist: data for artist, data in collection_info.items() if not isinstance(artist, tuple)},
            'album_info': {key: data for key, data in collection_info.items() if isinstance(key, tuple)},
            'title': title,
            'summary': summary,
            'blog_post': blog_sections,
            'random_number': NumberGenerator.generate_random_number(),
        }
        
        env = Environment(loader=FileSystemLoader('.'))
        template = env.get_template('lastfm-post-template.md')
        rendered_content = template.render(context)
        
        with open(os.path.join(post_folder, 'index.md'), 'w') as f:
            f.write(rendered_content)


def main():
    """Main entry point for the blog post generator."""
    parser = argparse.ArgumentParser(description='Generate a blog post about your week in music.')
    parser.add_argument('--week_start', type=str, help='Starting date of the week (YYYY-MM-DD). Defaults to 7 days ago.')
    parser.add_argument('--debug', action='store_true', help='Run script in debug mode (only one album)')
    args = parser.parse_args()
    
    week_start = (datetime.strptime(args.week_start, '%Y-%m-%d') if args.week_start else datetime.now() - timedelta(days=7))
    week_end = week_start + timedelta(days=7)
    
    Utils.configure_logging()
    config = ConfigLoader()
    generator = BlogPostGenerator(config, debug=args.debug)
    generator.generate_blog_post(week_start, week_end)

if __name__ == '__main__':
    main()