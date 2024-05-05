from crewai import Agent, Task, Crew, Process
from langchain_community.tools import DuckDuckGoSearchRun
from crewai_tools import WebsiteSearchTool
import os
import requests
import json
import argparse
import random
import time
import re
from datetime import datetime, timedelta
from collections import Counter
from jinja2 import Environment, FileSystemLoader
from fuzzywuzzy import fuzz

# Load user secrets from environment variables
lastfm_user = os.getenv('LASTFM_USER')
lastfm_api_key = os.getenv('LASTFM_API_KEY')
collection_url = os.getenv('COLLECTION_URL')
api_key = os.environ["OPENAI_API_KEY"]
embedding_model = os.environ["OPENAI_MODEL_NAME"]

search_tool = DuckDuckGoSearchRun()
web_tool = WebsiteSearchTool()

def generate_random_number():
    """Generate a random number between 1 and 23 and format it as a 3-digit string."""
    number = random.randint(1, 23)
    return str(number).zfill(3)

def get_lastfm_data(method, lastfm_user, lastfm_api_key, from_time, to_time):
    """Get data from the Last.fm API for a given method and time range."""
    url = f"http://ws.audioscrobbler.com/2.0/?method={method}&user={lastfm_user}&api_key={lastfm_api_key}&format=json&from={from_time}&to={to_time}"
    response = requests.get(url)
    return response.json()

import os
import json
import time
import requests

def get_collection_data(collection_url):
    """Get collection data from a personal website."""
    local_file = 'index.json'
    
    # Check if the local index.json file exists
    if os.path.exists(local_file):
        # Get the modification time of the local file
        mod_time = os.path.getmtime(local_file)
        current_time = time.time()
        
        # Check if the file is more than an hour old
        if current_time - mod_time > 3600:
            # Download the updated index.json file
            response = requests.get(f'{collection_url}/index.json')
            with open(local_file, 'wb') as f:
                f.write(response.content)
    else:
        # Download the index.json file if it doesn't exist
        response = requests.get(f'{collection_url}/index.json')
        with open(local_file, 'wb') as f:
            f.write(response.content)
    
    # Read the local index.json file
    with open(local_file, 'r') as f:
        data = json.load(f)
    
    info = {}
    for doc in data['documents']:
        artist = doc.get('artist')
        album = doc.get('album')
        cover_image = doc.get('coverImage')
        artist_image = doc.get('artistImage')
        album_uri = doc.get('uri')
        artist_uri = doc.get('artistUri')
        
        if artist and album and album_uri:
            album_link = f"{collection_url}{album_uri}"
            
            # Check if the cover image URL is valid
            if cover_image and cover_image.startswith('https://'):
                album_image_link = cover_image
            else:
                album_image_link = None
            
            info[(artist, album)] = {
                'album_image': album_image_link,
                'album_link': album_link
            }
        
        if artist and artist_uri:
            artist_link = artist_uri
            
            # Check if the artist image URL is valid
            if artist_image and artist_image.startswith('https://'):
                artist_image_link = artist_image
            else:
                artist_image_link = None
            
            info[artist] = {
                'artist_image': artist_image_link,
                'artist_link': artist_link
            }
    
    return info

def generate_summary(artist_data, album_data, collection_info):
    """Generate a summary of weekly music activity."""
    top_artists = Counter()
    top_albums = Counter()
    for artist in artist_data['weeklyartistchart']['artist']:
        artist_name = artist['name']
        top_artists[artist_name] += int(artist['playcount'])
    for album in album_data['weeklyalbumchart']['album']:
        artist_name = album['artist']['#text']
        album_name = album['name']
        top_albums[(artist_name, album_name)] += int(album['playcount'])
    return top_artists.most_common(12), top_albums.most_common(12), collection_info

def render_template(template_name, context):
    """Render a template using Jinja2."""
    env = Environment(loader=FileSystemLoader('.'))
    template = env.get_template(template_name)
    return template.render(context)

def download_image(url, folder, name):
    """Download an image from a URL and save it to a folder."""
    response = requests.get(url, stream=True)
    clean_name = name.replace(' ', '-').replace('/', '-')
    image_file_path = os.path.join(folder, f"{clean_name}.jpg")
    json_file_path = os.path.join(folder, f"{clean_name}.jpg.meta")

    if response.status_code == 200:
        with open(image_file_path, 'wb') as out_file:
            out_file.write(response.content)
        print(f"Downloaded image to {image_file_path}")

        # Create JSON metadata file
        metadata = {"Title": name}
        with open(json_file_path, 'w') as json_file:
            json.dump(metadata, json_file)
        print(f"Created JSON metadata at {json_file_path}")
    else:
        print(f"Failed to download image from {url}")

def kickoff_crew(album):
    """Kickoff the crew to generate a blog post section for a given album."""
    blogger = Agent(
        role="Music Research",
        goal=f"You are a Music lover and are going to be writing sections of a blog post containing information on the albums you have listed to this week. One the albums you listened to is '{album}'. Find a good summary of '{album}' which can be used to write the blog post.",
        backstory=f"You are an expert music Blogger on Internet. Include details on the album '{album}', artist and any other interesting facts you can find. You have a passion for music of all genres and you are excited to share your thoughts with the world.",
        verbose=True,
        max_inter=1,
    )

    task_blog_post = Task(
        description=f"Search for details about the album '{album}'. Your final answer MUST be a consolidated content that can be as a section of a blog post. This content should be well organized, and should be very easy to read. You must provide a 800 word section for a blog post.",
        expected_output=f"Write a well structured section for a blog post on '{album}'. A comprehensive section on '{album}' in markdown format - do not use any H1 headers, only H2 and below, add lots of relevant emojis and make it no more than 800 words.",
        max_inter=1,
        tools=[search_tool, web_tool],
        agent=blogger)

    crew = Crew(
        agents=[blogger],
        tasks=[task_blog_post],
        process=Process.sequential,
        max_rpm=10,
        full_output=True,
    )

    result = crew.kickoff()
    return result

def generate_title_and_summary(date_str_start, week_number, top_artists, top_albums):
    """Generate a title and summary for the blog post using CrewAI."""
    title_agent = Agent(
        role="Title Generator",
        goal=f"Generate a catchy and SEO-friendly title for a weekly music blog post. The post is about the top artists and albums listened to this week, {', '.join([artist for artist, _ in top_artists])} and top albums: {', '.join([album for (_, album), _ in top_albums])}.",
        backstory="You are an expert in creating engaging and SEO-optimized titles for blog posts. Your titles should grab the reader's attention and include relevant keywords.",
        verbose=True,
        max_inter=1,
    )

    title_task = Task(
        description=f"Generate a title for a weekly music blog post featuring the top artists: {', '.join([artist for artist, _ in top_artists])} and top albums: {', '.join([album for (_, album), _ in top_albums])}.",
        expected_output="A catchy and SEO-friendly title for the blog post. Do not exceed 70 characters or use special characters such a :, -, |,  or emojis.",
        max_inter=1,
        tools=[],
        agent=title_agent,
    )

    summary_agent = Agent(
        role="Summary Generator",
        goal=f"Generate a concise and SEO-friendly summary for a weekly music blog post. The post is about the top artists and albums listened to in week {week_number} starting from {date_str_start}.",
        backstory="You are an expert in creating informative and SEO-optimized summaries for blog posts. Your summaries should provide a brief overview of the post's content and include relevant keywords.",
        verbose=True,
        max_inter=1,
    )

    summary_task = Task(
        description=f"Generate a summary for a weekly music blog post featuring the top artists: {', '.join([artist for artist, _ in top_artists])} and top albums: {', '.join([album for (_, album), _ in top_albums])}.",
        expected_output="A concise and SEO-friendly summary for the blog post. It shoud be no more than 180 characters.",
        max_inter=1,
        tools=[],
        agent=summary_agent,
    )

    crew = Crew(
        agents=[title_agent, summary_agent],
        tasks=[title_task, summary_task],
        max_rpm=10,
        full_output=True,
    )

    result = crew.kickoff()
    title = re.sub(r'[^\w\s-]', '', result['tasks_outputs'][0].exported_output)
    print("Crew.kickoff() result:")
    print(result)
    print()

    print("Title:")
    print(result['tasks_outputs'][0].exported_output)
    print()

    print("Summary:")
    print(result['tasks_outputs'][1].exported_output)
    print()

    title = result['tasks_outputs'][0].exported_output
    summary = result['tasks_outputs'][1].exported_output
    return title, summary

def generate_blog_post(top_artists, top_albums, collection_info, week_start, week_end):
    """Generate a blog post for the weekly music activity."""
    date_str_start = week_end.strftime('%Y-%m-%d')
    week_number = week_start.strftime('%U')
    post_folder = f"content/tunes/{date_str_start}-listened-to-this-week"
    os.makedirs(post_folder, exist_ok=True)  # Create blog post directory
    albums_folder = os.path.join(post_folder, "albums")
    artists_folder = os.path.join(post_folder, "artists")
    os.makedirs(albums_folder, exist_ok=True)  # Create albums directory
    os.makedirs(artists_folder, exist_ok=True)  # Create artists directory
    filename = os.path.join(post_folder, "index.md")
    artist_info = {artist: data for artist, data in collection_info.items() if not isinstance(artist, tuple)}
    album_info = {key: data for key, data in collection_info.items() if isinstance(key, tuple)}

    for artist, _ in top_artists:
        artist_data = artist_info.get(artist)
        if artist_data:
            artist_image_url = artist_data.get('artist_image')
            if artist_image_url:
                download_image(artist_image_url, artists_folder, artist)

    for (artist, album), _ in top_albums:
        max_ratio = 0
        best_match = None
        for key, data in album_info.items():
            if key[0] == artist:
                ratio = fuzz.ratio(album.lower(), key[1].lower())
                if ratio > max_ratio:
                    max_ratio = ratio
                    best_match = data

        if best_match:
            album_cover_url = best_match.get('album_image')
            if album_cover_url:
                download_image(album_cover_url, albums_folder, album)

    topics = [f"{album} by {artist}" for (artist, album), _ in top_albums]
    blog_post_sections = []

    # Generate title and summary using CrewAI
    title, summary = generate_title_and_summary(date_str_start, week_number, top_artists, top_albums)

    for album in topics:
        result = kickoff_crew(album)
        print(result)
        output_str = result['final_output']
        blog_post_sections.append(output_str)

    blog_post = "\n\n".join(blog_post_sections)

    random_number = generate_random_number()
    context = {
        'date': date_str_start,
        'week_number': week_number,
        'top_artists': top_artists,
        'artist_info': artist_info,
        'top_albums': top_albums,
        'album_info': album_info,
        'title': title,
        'summary': summary,
        'blog_post': blog_post,
        'random_number': random_number,
    }
    content = render_template('lastfm-post-template.md', context)
    with open(filename, 'w') as f:
        f.write(content)

def main():
    # Command line argument for the start of the week
    parser = argparse.ArgumentParser(description='Generate a blog post about your week in music.')
    parser.add_argument('--week_start', type=str, help='The starting date of the week, in YYYY-MM-DD format. Defaults to 7 days ago.')
    args = parser.parse_args()

    # Calculate start and end of the week
    if args.week_start:
        week_start = datetime.strptime(args.week_start, '%Y-%m-%d')
    else:
        week_start = datetime.now() - timedelta(days=7)
    week_end = week_start + timedelta(days=7)

    start_timestamp = int(week_start.timestamp())
    end_timestamp = int(week_end.timestamp())

    artist_data = get_lastfm_data('user.getweeklyartistchart', lastfm_user, lastfm_api_key, start_timestamp, end_timestamp)
    album_data = get_lastfm_data('user.getweeklyalbumchart', lastfm_user, lastfm_api_key, start_timestamp, end_timestamp)
    collection_info = get_collection_data(collection_url)
    top_artists, top_albums, images = generate_summary(artist_data, album_data, collection_info)

    print(top_artists)
    print(top_albums)

    generate_blog_post(top_artists, top_albums, collection_info, week_start, week_end)

    # Remove the index.json file and the "db" folder after the script finishes
    os.remove('index.json')
    shutil.rmtree('db')

if __name__ == '__main__':
    main()