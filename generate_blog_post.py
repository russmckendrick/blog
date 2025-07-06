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
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

no_of_items = 11

# Shared utility functions
class Utils:
    @staticmethod
    def initialize_tools() -> Dict[str, BaseTool]:
        """Initialize search tools with error handling."""
        try:
            return {
                'search': DuckDuckGoSearchRun(),
                'web': WebsiteSearchTool()
            }
        except Exception as e:
            print(f"Error initializing tools: {e}")
            return None

    @staticmethod
    def configure_logging():
        """Configure logging and suppress unwanted warnings."""
        warnings.filterwarnings(
            "ignore", 
            message="Overriding of current TracerProvider is not allowed"
        )
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
        for key, data in info_dict.items():
            ratio = fuzz.ratio(name.lower(), key.lower())
            if ratio > max_ratio:
                max_ratio = ratio
                best_match = data
        return best_match if max_ratio > 70 else None

    @staticmethod
    def find_best_album_match(artist: str, album: str, album_info: Dict) -> Optional[Dict]:
        """Find best matching album using fuzzy matching."""
        max_ratio = 0
        best_match = None
        for (a, b), data in album_info.items():
            artist_match_ratio = fuzz.ratio(artist.lower(), a.lower())
            album_match_ratio = fuzz.ratio(album.lower(), b.lower())
            combined_ratio = (artist_match_ratio + album_match_ratio) / 2
            if combined_ratio > max_ratio:
                max_ratio = combined_ratio
                best_match = data
        return best_match if max_ratio > 70 else None


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
        artist_image_url = None
        
        if release.get('images_uri_release') and release['images_uri_release'].get('hi-res'):
            album_image_url = f"{self.base_url}{release['images_uri_release']['hi-res']}"
        
        if release.get('images_uri_artist') and release['images_uri_artist'].get('hi-res'):
            artist_image_url = f"{self.base_url}{release['images_uri_artist']['hi-res']}"
        
        # Get URIs for album and artist pages
        album_uri = f"{self.base_url}{release.get('uri_release', '')}" if release.get('uri_release') else None
        artist_uri = f"{self.base_url}{release.get('uri_artist', '')}" if release.get('uri_artist') else None

        if artist and album and album_uri:
            # Store lowercase key for matching
            key = (artist.lower(), album.lower())
            info[key] = {
                'album_image': album_image_url,
                'album_link': album_uri
            }
            # Store original case
            original_cases[key] = {'artist': artist, 'album': album}

        if artist and artist_uri:
            artist_key = artist.lower()
            info[artist_key] = {
                'artist_image': artist_image_url,
                'artist_link': artist_uri
            }
            original_cases[artist_key] = artist


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
            # Use lowercase for the counter key
            key = artist_name.lower()
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
            # Use lowercase for the counter key
            key = (artist.lower(), album_name.lower())
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
        artist_info = {artist: data for artist, data in collection_info.items() if not isinstance(artist, tuple)}
        album_info = {key: data for key, data in collection_info.items() if isinstance(key, tuple)}

        for artist, _ in top_artists:
            best_match = Utils.find_best_match(artist.lower(), artist_info)
            if best_match and best_match.get('artist_image'):
                ImageHandler.download_image(best_match['artist_image'], artists_folder, artist)

        for (artist, album), _ in top_albums:
            best_match = Utils.find_best_album_match(artist, album, album_info)
            if best_match:
                if not best_match.get('album_image'):
                    print(f"Missing album image for {album} by {artist}")
                if not best_match.get('album_link'):
                    print(f"Missing album link for {album} by {artist}")
                ImageHandler.download_image(best_match.get('album_image', ''), albums_folder, album)

    def _print_links(self, collection_info: Dict, top_artists: List[Tuple[str, int]], top_albums: List[Tuple[Tuple[str, str], int]]):
        print("\nArtist Links:")
        for artist, _ in top_artists:
            artist_key = artist.lower()
            if artist_key in collection_info:
                artist_link = collection_info[artist_key].get('artist_link', 'No link available')
                print(f"{artist}: {artist_link}")

        print("\nAlbum Links:")
        for (artist, album), _ in top_albums:
            album_key = (artist.lower(), album.lower())
            if album_key in collection_info:
                album_link = collection_info[album_key].get('album_link', 'No link available')
                print(f"{album} by {artist}: {album_link}")
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