import os
import requests
import json
import argparse
from datetime import datetime, timedelta
from collections import Counter
from jinja2 import Environment, FileSystemLoader

# Load user secrets from environment variables
user = os.getenv('LASTFM_USER')
api_key = os.getenv('LASTFM_API_KEY')
url = os.getenv('COLLECTION_URL')
openai_key = os.getenv('OPENAI_KEY')

# Function to get Wikipedia summary
def get_wiki_summary(page_name):
    page_py = wiki_wiki.page(page_name)
    if page_py.exists():
        return page_py.summary[0:500]  # Limit summary to 500 characters
    return None

# Function to get GPT-3 generated text
def get_gpt3_text(prompt):
    completion = openai.ChatCompletion.create(
        model='gpt-3.5-turbo-16k-0613',
        messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ]
    )
    return completion['choices'][0]['message']['content'].strip()

# Get artist data from Last.fm API
def get_lastfm_artist_data(user, api_key, from_time, to_time):
    url = f"http://ws.audioscrobbler.com/2.0/?method=user.getweeklyartistchart&user={user}&api_key={api_key}&format=json&from={from_time}&to={to_time}"
    response = requests.get(url)
    return response.json()

# Get album data from Last.fm API
def get_lastfm_album_data(user, api_key, from_time, to_time):
    url = f"http://ws.audioscrobbler.com/2.0/?method=user.getweeklyalbumchart&user={user}&api_key={api_key}&format=json&from={from_time}&to={to_time}"
    response = requests.get(url)
    return response.json()

# Get collection data from personal website
def get_collection_data():
    response = requests.get(f'{url}/index.json')
    data = response.json()
    info = {}
    for doc in data['documents']:
        artist = doc.get('artist')
        album = doc.get('album')
        cover_image = doc.get('coverImage')
        artist_image = doc.get('artistImage')
        album_uri = doc.get('uri')
        artist_uri = doc.get('artistUri')
        if artist and album and cover_image and artist_image and album_uri and artist_uri:
            info[(artist, album)] = {
                'cover_image': cover_image,
                'artist_image': artist_image,
                'album_link': f"{url}{album_uri}",
                'artist_link': artist_uri
            }
    return info

# Generate summary of weekly music activity
def generate_summary(data_artists, data_albums, collection):
    top_artists = Counter()
    top_albums = Counter()
    for artist in data_artists['weeklyartistchart']['artist']:
        artist_name = artist['name']
        top_artists[artist_name] += int(artist['playcount'])
    for album in data_albums['weeklyalbumchart']['album']:
        artist_name = album['artist']['#text']
        album_name = album['name']
        top_albums[(artist_name, album_name)] += int(album['playcount'])
    return top_artists.most_common(12), top_albums.most_common(12), collection

# Render the markdown template
def render_template(template_name, context):
    env = Environment(loader=FileSystemLoader('.'))
    template = env.get_template(template_name)
    return template.render(context)

# Generate the blog post
def generate_blog_post(top_artists, top_albums, info, week_start, week_end):
    date_str_start = week_start.strftime('%Y-%m-%d')
    week_number = week_start.strftime('%U')
    filename = f"{date_str_start}-listened-to-this-week.md"
    artist_info = {artist: data for (artist, album), data in info.items()}
    album_info = {(artist, album): data for (artist, album), data in info.items()}
    top_artist = top_artists[0][0] if top_artists else 'No artist data'
    top_artist_summary = get_wiki_summary(top_artist)
    intro = "Write a casual blog post which details what music I have been listening to this week. The blog post should be 900 words long."
    other_artists = f"Other artists I listened to this week include {', '.join([artist for artist, count in top_artists[1:10]])}, mention these too the end, but don't repeat any inforation you have already given."
    ai_generated = "Also, mention that this part of the blog post was AI generated - this part of the post should be short"
    if top_artist_summary:
        top_artist_info = f"Information from Wikipedia on {top_artist}, who is the most played artist this week, says {top_artist_summary}."
    else:
        top_artist_info = f"The most played artist this week was {top_artist}."
    gpt3_prompt = f"{intro} {top_artist_info} {other_artists} {ai_generated}" # Construct the full prompt
    gpt3_summary = get_gpt3_text(gpt3_prompt) # Generate the summary
    context = {
        'date': date_str_start,
        'week_number': week_number,
        'top_artists': top_artists,
        'artist_info': artist_info,
        'top_albums': top_albums,
        'album_info': album_info,
        'summary': f"This week's top artist was {top_artist}.",
        'gpt3_summary': gpt3_summary,
    }
    content = render_template('lastfm-post-template.md', context)
    with open(filename, 'w') as f:
        f.write(content)

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

# Fetch data and generate blog post
openai.api_key = openai_key
wiki_wiki = wikipediaapi.Wikipedia('en')
artist_data = get_lastfm_artist_data(user, api_key, start_timestamp, end_timestamp)
album_data = get_lastfm_album_data(user, api_key, start_timestamp, end_timestamp)
collection = get_collection_data()
top_artists, top_albums, images = generate_summary(artist_data, album_data, collection)
generate_blog_post(top_artists, top_albums, collection, week_start, week_end)
