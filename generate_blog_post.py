import os
import requests
import json
import argparse
import random
import time
import re
from crewai import Agent, Task, Crew, Process
from langchain_community.tools import DuckDuckGoSearchRun
from crewai_tools import WebsiteSearchTool
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
    """
    Generate a random number between 1 and 23 and format it as a 3-digit string.
    Returns:
        str: A string representation of the randomly generated number, padded with leading zeros
            to ensure a 3-digit format.
    """
    number = random.randint(1, 23)
    return str(number).zfill(3)

def get_lastfm_data(method, lastfm_user, lastfm_api_key, from_time, to_time):
    """
    Retrieve data from the Last.fm API for a specified method and time range.
    Args:
        method (str): The Last.fm API method to call (e.g., 'user.getRecentTracks').
        lastfm_user (str): The Last.fm username for which to retrieve data.
        lastfm_api_key (str): The API key required to access the Last.fm API.
        from_time (int): The Unix timestamp representing the start of the time range.
        to_time (int): The Unix timestamp representing the end of the time range.
    Returns:
        dict: The JSON response from the Last.fm API containing the requested data.
    Raises:
        requests.exceptions.RequestException: If an error occurs while making the API request.
    """
    url = f"http://ws.audioscrobbler.com/2.0/?method={method}&user={lastfm_user}&api_key={lastfm_api_key}&format=json&from={from_time}&to={to_time}"
    response = requests.get(url)
    return response.json()

def sanitize_text_output(text):
    """
    Clean the output text by removing backticks, double quotes, and any characters that are not word characters, whitespace, or hyphens.
    Args:
        text (str): The input text to be cleaned.
    Returns:
        str: The cleaned text with backticks, double quotes, and specified characters removed.
    """
    return re.sub(r'[\'"]', '', text)

def get_collection_data(collection_url):
    """
    Retrieve collection data from a personal website.

    This function checks for the existence of a local 'index.json' file and downloads an updated version
    from the specified collection URL if the file is older than an hour or doesn't exist. It then reads
    the local 'index.json' file and extracts relevant information such as artist, album, cover image, and
    artist image URLs. The extracted information is stored in a dictionary and returned.

    Args:
        collection_url (str): The URL of the personal website's collection.

    Returns:
        dict: A dictionary containing the extracted collection data, with the following structure:
            - Keys: Tuples of (artist, album) for each album in the collection.
            - Values: Dictionaries with the following keys:
                - 'album_image': The URL of the album cover image (or None if not available).
                - 'album_link': The URL of the album page on the personal website.
            - Additional keys: Artist names for each unique artist in the collection.
            - Values: Dictionaries with the following keys:
                - 'artist_image': The URL of the artist image (or None if not available).
                - 'artist_link': The URL of the artist page on the personal website.

    Raises:
        requests.exceptions.RequestException: If an error occurs while making the HTTP request to download
            the 'index.json' file.
        json.JSONDecodeError: If the 'index.json' file contains invalid JSON.
        IOError: If an error occurs while reading or writing the local 'index.json' file.
    """
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
    """
    Generate a summary of weekly music activity based on artist and album data.
    This function takes the artist data, album data, and collection information as input and generates
    a summary of the top artists and albums played during the week. It counts the playcounts for each
    artist and album, and returns the top 12 artists and albums along with the collection information.
    Args:
        artist_data (dict): A dictionary containing the weekly artist chart data, with the following structure:
            - 'weeklyartistchart': A dictionary with an 'artist' key containing a list of artist dictionaries.
            - Each artist dictionary contains 'name' and 'playcount' keys.
        album_data (dict): A dictionary containing the weekly album chart data, with the following structure:
            - 'weeklyalbumchart': A dictionary with an 'album' key containing a list of album dictionaries.
            - Each album dictionary contains 'artist', 'name', and 'playcount' keys.
        collection_info (dict): A dictionary containing the collection information.
    Returns:
        tuple: A tuple containing three elements:
            - top_artists (list): A list of the top 12 artists played during the week, represented as tuples
            in the format (artist_name, playcount).
            - top_albums (list): A list of the top 12 albums played during the week, represented as tuples
            in the format ((artist_name, album_name), playcount).
            - collection_info (dict): The collection information passed as input.
    """
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
    """
    Render a template using the Jinja2 templating engine.
    This function takes a template name and a context dictionary as input, and renders the template
    using the Jinja2 templating engine. It searches for the template file in the current directory
    and its subdirectories, and returns the rendered template as a string.
    Args:
        template_name (str): The name of the template file to render.
        context (dict): A dictionary containing the variables to be passed to the template for rendering.
    Returns:
        str: The rendered template as a string.
    Raises:
        jinja2.TemplateNotFound: If the specified template file is not found.
        jinja2.TemplateSyntaxError: If there is a syntax error in the template.
        jinja2.UndefinedError: If an undefined variable is used in the template.
    """
    env = Environment(loader=FileSystemLoader('.'))
    template = env.get_template(template_name)
    return template.render(context)

def download_image(url, folder, name):
    """
    Download an image from a URL and save it to a specified folder.
    This function takes a URL, a folder path, and a name as input. It sends a GET request to the URL
    to download the image content. If the request is successful (status code 200), it saves the image
    to the specified folder with the given name (after replacing spaces and forward slashes with hyphens).
    It also creates a corresponding JSON metadata file with the same name and ".meta" extension, containing
    the original name of the image.
    Args:
        url (str): The URL of the image to download.
        folder (str): The path to the folder where the downloaded image and metadata file will be saved.
        name (str): The name to be used for the downloaded image and metadata file.
    Returns:
        None
    Side Effects:
        - Downloads the image from the specified URL and saves it to the specified folder with the cleaned name.
        - Creates a JSON metadata file with the same name as the image and ".meta" extension in the specified folder.
    Raises:
        requests.exceptions.RequestException: If an error occurs while making the HTTP request to download the image.
        IOError: If an error occurs while writing the downloaded image or JSON metadata file to disk.
    Note:
        - The function replaces spaces and forward slashes in the name with hyphens to ensure valid file names.
        - If the image download fails (status code other than 200), an error message is printed to the console.
    """
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

def research_an_album(album):
    """
    Research an album and generate a blog post section using a crew of agents.
    This function takes an album name as input and kicks off a crew of agents to research the album
    and generate a well-structured blog post section. The crew consists of a single "Music Research"
    agent with a specific goal and backstory. The agent is assigned a task to search for details about
    the album and write an informative and engaging blog post section in markdown format.
    Args:
        album (str): The name of the album to research and write about.
    Returns:
        str: The generated blog post section about the album in markdown format.
    Raises:
        AgentError: If an error occurs during the agent's execution of the task.
        TaskError: If an error occurs while processing the task.
        CrewError: If an error occurs during the crew's execution.
    Notes:
        - The agent uses search and web tools (search_tool and web_tool) to gather information about the album.
        - The generated blog post section should be well-organized, easy to read, and in markdown format.
        - The section should be no more than 800 words and include relevant emojis.
        - The agent is limited to a single interaction (max_inter=1) to generate the content.
        - The crew is set up with sequential processing and a maximum of 10 interactions per minute.
        - The function returns the full output of the crew's execution, which includes the generated blog post section.    
    """
    blogger = Agent(
        role="Music Research",
        goal=f"""You are a Music lover and are going to be writing sections of a blog post
            containing information on the albums you have listed to this week. One the albums
            you listened to is '{album}'. Find a good summary of '{album}' which can be used
            to write the blog post.""",
        backstory=f"""You are an expert music Blogger on Internet. Include details on the album
            '{album}', artist and any other interesting facts you can find. You have a passion
            for music of all genres and you are excited to share your thoughts with the world.""",
        verbose=True,
        max_inter=1,
    )

    task_blog_post = Task(
        description=f"""Search for details about the album '{album}'. Your final answer MUST be a
            consolidated content that can be as a section of a blog post. This content should be
            well organized, and should be very easy to read. You must provide a 800 word section
            for a blog post.""",
        expected_output=f"""Write a well structured section for a blog post on '{album}'. A comprehensive
            section on '{album}' in markdown format - do not use any H1 headers, only H2 and below, add
            lots of relevant emojis and make it no more than 800 words.""",
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
    """
    Generate a title and summary for a weekly music blog post using a crew of agents.
    This function takes the start date, week number, top artists, and top albums as input and kicks off
    a crew of agents to generate a catchy and SEO-friendly title and a concise summary for the blog post.
    The crew consists of two agents: a "Title Generator" agent and a "Summary Generator" agent.
    The "Title Generator" agent is assigned a task to generate a title for the blog post, considering the
    top artists and albums of the week. The title should be catchy, SEO-friendly, and not exceed 70
    characters or use special characters such as :, -, |, quotes, or emojis.
    The "Summary Generator" agent is assigned a task to generate a summary for the blog post, providing
    a brief overview of the post's content. The summary should be concise, SEO-friendly, and not exceed
    180 characters or use special characters.
    Args:
        date_str_start (str): The start date of the week in string format.
        week_number (int): The number of the week.
        top_artists (list): A list of tuples representing the top artists of the week, where each tuple
        contains the artist name and the play count.
        top_albums (list): A list of tuples representing the top albums of the week, where each tuple
        contains a tuple of the artist name and album name, and the play count.
    Returns:
    tuple: A tuple containing two elements:
        - title (str): The generated title for the blog post.
        - summary (str): The generated summary for the blog post.
    Raises:
        AgentError: If an error occurs during the agents' execution of the tasks.
        TaskError: If an error occurs while processing the tasks.
        CrewError: If an error occurs during the crew's execution.
    Notes:
        - The function uses the clean_output function to remove special characters from the generated
        title and summary.
        - The crew is set up with a maximum of 10 interactions per minute.
        - The function prints the result of the crew's execution, the generated title, and the generated
        summary.
    """
    title_agent = Agent(
        role="Title Generator",
        goal=f"""Generate a catchy and SEO-friendly title for a weekly music blog
            post. The post is about the top artists and albums listened to this week, 
            {', '.join([artist for artist, _ in top_artists])} and top albums: 
            {', '.join([album for (_, album), _ in top_albums])}. Do not exceed 70 
            characters or use special characters such a :, -, |, quotes or emojis.""",
        backstory="""You are an expert in creating creative, engaging and SEO-optimized
            titles for blog posts. Your titles should grab the reader's attention and
            include relevant keywords.""",
        verbose=True,
        max_inter=1,
    )

    title_task = Task(
        description=f"""Generate a title for a weekly music blog post featuring the
            top artists: {', '.join([artist for artist, _ in top_artists])} and top albums:
            {', '.join([album for (_, album), _ in top_albums])}.""",
        expected_output="""A catchy and SEO-friendly title for the blog post. Do not
            exceed 70 characters or use special characters such a :, -, |, quotes or emojis.""",
        max_inter=1,
        tools=[],
        agent=title_agent,
    )

    summary_agent = Agent(
        role="Summary Generator",
        goal=f"""Generate a concise and SEO-friendly summary for a weekly music blog post.
            The post is about the top artists and albums listened to in week {week_number}
            starting from {date_str_start}.""",
        backstory="""You are an expert in creating informative and SEO-optimized summaries for
            blog posts. Your summaries should provide a brief overview of the post's content 
            and include relevant keywords.""",
        verbose=True,
        max_inter=1,
    )

    summary_task = Task(
        description=f"""Generate a summary for a weekly music blog post featuring the top artists:
            {', '.join([artist for artist, _ in top_artists])} and top albums: 
            {', '.join([album for (_, album), _ in top_albums])}.""",
        expected_output="""A concise and SEO-friendly summary for the blog post. It shouldn't be 
            more than 180 characters and it should NOT use special characters such a :, -, |, 
            quotes or emojis.""",
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
    print("Crew.kickoff() result:")
    print(result)
    print()

    title = sanitize_text_output(result['tasks_outputs'][0].exported_output)
    print("Title:")
    print(title)
    print()
    
    summary = sanitize_text_output(result['tasks_outputs'][1].exported_output)
    print("Summary:")
    print(summary)
    print()
    
    return title, summary

def generate_blog_post(top_artists, top_albums, collection_info, week_start, week_end):
    """
    Generate a blog post for the weekly music activity.
    This function generates a blog post summarizing the weekly music activity based on the provided top artists,
    top albums, and collection information. It creates a directory structure for the blog post, including folders
    for albums and artists. It downloads album cover images and artist images, generates a title and summary using
    CrewAI, researches each album using the research_an_album function, and renders the blog post content using
    a template.
    Args:
        top_artists (list): A list of tuples representing the top artists of the week, where each tuple contains
        the artist name and the play count.
        top_albums (list): A list of tuples representing the top albums of the week, where each tuple contains a
        tuple of the artist name and album name, and the play count.
        collection_info (dict): A dictionary containing information about the music collection, including artist
        and album details.
        week_start (datetime): The start date of the week.
        week_end (datetime): The end date of the week.
    Returns:
        None
    Side Effects:
        - Creates a directory structure for the blog post, including folders for albums and artists.
        - Downloads album cover images and artist images to the respective folders.
        - Generates a title and summary for the blog post using CrewAI.
        - Researches each album using the research_an_album function.
        - Renders the blog post content using a template and saves it to a file.
    Notes:
        - The blog post directory is created based on the end date of the week in the format
        "content/tunes/YYYY-MM-DD-listened-to-this-week".
        - The album cover images and artist images are downloaded using the download_image function.
        - The generate_title_and_summary function is used to generate a catchy title and concise summary for the
        blog post using CrewAI.
        - The research_an_album function is used to research each album and generate a section of the blog post.
        - The blog post content is rendered using the 'lastfm-post-template.md' template and the provided context.
        - The generated blog post is saved to a file named "index.md" in the blog post directory.
"""
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
        result = research_an_album(album)
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
    """
    The main function of the program that generates a blog post about your week in music.

    This function serves as the entry point of the program. It performs the following steps:
    1. Parses command line arguments to determine the start of the week. If not provided, it defaults to 7 days ago.
    2. Calculates the start and end timestamps of the week.
    3. Retrieves the weekly artist and album data from Last.fm using the `get_lastfm_data` function.
    4. Retrieves the collection information using the `get_collection_data` function.
    5. Generates a summary of the top artists, top albums, and images using the `generate_summary` function.
    6. Prints the top artists and top albums.
    7. Generates the blog post using the `generate_blog_post` function.

    Usage:
        To run the program, execute the script from the command line. You can optionally provide the start of the week
        using the `--week_start` argument in the format 'YYYY-MM-DD'. If not provided, it defaults to 7 days ago.

        Example:
            python script_name.py --week_start 2023-05-01

    Dependencies:
        - argparse: For parsing command line arguments.
        - datetime: For handling dates and timestamps.
        - get_lastfm_data: A function that retrieves data from the Last.fm API.
        - get_collection_data: A function that retrieves collection information.
        - generate_summary: A function that generates a summary of the top artists, top albums, and images.
        - generate_blog_post: A function that generates the blog post.

    Notes:
        - The `lastfm_user` and `lastfm_api_key` variables should be defined with the appropriate Last.fm user and API key.
        - The `collection_url` variable should be defined with the URL of the collection data.

    """
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

if __name__ == '__main__':
    """
    The entry point of the program.

    This block of code checks if the script is being run as the main program and calls the `main` function if true.
    It ensures that the `main` function is only executed when the script is run directly and not when it is imported
    as a module.

    """
    main()