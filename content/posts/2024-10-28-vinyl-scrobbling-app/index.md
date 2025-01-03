---
title: "Vinyl Scrobbling macOS App"
author: "Russ McKendrick"
date: 2024-10-28T13:47:28Z
description: ""
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: ""
tags:
  - "macos"
  - "vinyl"
  - "python"
  - "ai"
---

Like many techies on their day off, I completely abandoned my planned tasks and embarked on an entirely unplanned project: creating a macOS application. Well, to be more precise, I decided to prompt one using [Claude 3.5 Sonnet](https://www.anthropic.com/news/3-5-models-and-computer-use).

With Anthropic's recent updates to their AI model, I figured it was the perfect opportunity to test its capabilities while solving a personal need.

## The Catalyst: My New Tuneshine Device

Recently, I acquired a [Tuneshine](https://www.tuneshine.rocks) - a clever device that arrived last week. It works wonderfully with my streaming services of choice, including [Apple Music](https://music.apple.com/profile/russmckendrick) and [Spotify](https://open.spotify.com/user/russmckendrick), and offers integration with [LastFM](https://www.last.fm/user/RussMckendrick).

For those unfamiliar with the device, Techmoan provides an excellent overview in their review:

{{< youtube 6Y_AfSzjjL0 >}}<br>

For those that know me, you will know that the Tuneshine ticks a lot of geeky boxes ✅.

### The Challenge

Given the Tuneshine's LastFM support, I assumed I could continue using [OpenScrobbler](https://openscrobbler.com) to log my vinyl listening sessions and have the album artwork display on the device. I was mistaken - but not due to any fault in either the Tuneshine or OpenScrobbler.

The issue lies in how these services interact with LastFM. The Tuneshine is designed for online players and monitors tracks that are "Scrobbling now" through LastFM's API. In contrast, OpenScrobbler manually logs tracks after they've been played, which means they don't trigger the "now playing" status that the Tuneshine looks for.

After searching for an alternative - specifically, an application that would run in the background and send real-time "now playing" requests to the [LastFM API](https://www.last.fm/api/scrobbling) - I came up empty-handed. That's when I decided to prompt my own solution.

### Where to start?

The place to start was prompting a quick MVP, could I get Clade to give me something that 

{{< chat-message position="left" avatar="https://www.russ.social/sticker-clear.svg" >}}
I would like to have python script that scrobles to Last.FM in real-time so it shows on now playing - can you help?
{{< /chat-message >}}

{{< chat-message position="right" avatar="images/claude.svg" >}}
Let me help you create a script for Last.FM scrobbling. I'll create a Python script that can handle real-time scrobbling.
{{< /chat-message >}}

Claude returned the following code (I filled in the track details at the bottom):

{{< ide title="Something here" lang="YAML" >}}
```python {linenos=true}
import pylast
import time
from datetime import datetime
import logging
import json
import os

class LastFMScrobbler:
    def __init__(self, config_path='config.json'):
        self.load_config(config_path)
        self.setup_logging()
        self.initialize_network()
        
    def load_config(self, config_path):
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                self.api_key = config['api_key']
                self.api_secret = config['api_secret']
                self.username = config['username']
                self.password_hash = config['password_hash']
        except FileNotFoundError:
            raise Exception("Config file not found. Please create a config.json file.")
            
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('scrobbler.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def initialize_network(self):
        """Initialize Last.FM network connection"""
        try:
            self.network = pylast.LastFMNetwork(
                api_key=self.api_key,
                api_secret=self.api_secret,
                username=self.username,
                password_hash=self.password_hash
            )
            self.logger.info("Successfully connected to Last.FM network")
        except Exception as e:
            self.logger.error(f"Failed to initialize Last.FM network: {str(e)}")
            raise
            
    def scrobble_track(self, artist, title, album=""):
        """Scrobble a track to Last.FM"""
        timestamp = int(time.time())
        try:
            self.network.scrobble(
                artist=artist,
                title=title,
                timestamp=timestamp,
                album=album
            )
            self.logger.info(f"Scrobbled: {artist} - {title}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to scrobble track: {str(e)}")
            return False
            
    def update_now_playing(self, artist, title, album=""):
        """Update now playing status"""
        try:
            self.network.update_now_playing(
                artist=artist,
                title=title,
                album=album
            )
            self.logger.info(f"Updated now playing: {artist} - {title}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to update now playing: {str(e)}")
            return False

def main():
    # Example configuration file format (config.json):
    # {
    #     "api_key": "your_api_key",
    #     "api_secret": "your_api_secret",
    #     "username": "your_username",
    #     "password_hash": "your_password_hash"
    # }
    
    scrobbler = LastFMScrobbler()
    
    # Example usage:
    artist = "Tori Amos"
    title = "God"
    album = "Under The Pink"
    
    # Update now playing
    scrobbler.update_now_playing(artist, title, album)
    
    # Scrobble the track
    scrobbler.scrobble_track(artist, title, album)

if __name__ == "__main__":
    main()
```
{{< /ide >}}

After installing the [pylast](https://github.com/pylast/pylast) module using the command below:

{{< terminal title="Something here" >}}
```text
pip install pylast
```
{{< /terminal >}}

I ran the code and saw that "God" by Tori Amos from the album Under The Pink had appeared in LastFM and glancing over at the Tuneshine I saw the following ...

{{< gallery match="images/01.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

Result !!! Now that I proved it could work I could start prompting away.

## Prompting the full application

I won't fill this post with every prompt, because there were a lot of them, but after a few hours I had a Python powered stand-alone macOS application. The key fetaures I prompted were ...

- Search albums using their Discogs ID
- Automatic track duration detection (with fallback options)
- Real-time "Now Playing" status with a timer
- Automatic track progression
- Clean configuration management as I didn't want to hard code any of my keys or credentials into the application
- Detailed logging system

Its uses the [rumps](https://rumps.readthedocs.io/en/latest/) to do the bulk of heavy lifting around being a status bar application and then [py2app](https://py2app.readthedocs.io/en/latest/) to take the rumps powered status bar application and make it standalone,

### Seeing it in action

It is a really basic application so lets dive straight in scrobble [Damned Damned Damned](https://www.russ.fm/albums/damned-damned-damned-24589202/) by [The Damned](https://www.russ.fm/artist/the-damned/)- first off we need the Discogs ID which is "24589202". Now we have that we can open the application and search for it:

{{< gallery match="images/damned/*" sortOrder="assc" rowHeight="300" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

Checking the logs at `~/.vinyl-scrobbler/vinyl_scrobbler.log` I can see the following:

{{< terminal title="Something here" >}}
```text
tail -f ~/.vinyl-scrobbler/vinyl_scrobbler.log
2024-10-28 16:45:46,156 - INFO - No Discogs duration for I Feel Alright, trying Last.fm...
2024-10-28 16:45:46,156 - INFO - Fetching duration from Last.fm for: The Damned - I Feel Alright
2024-10-28 16:45:46,156 - INFO - track.getInfo
2024-10-28 16:45:46,570 - INFO - HTTP Request: POST https://ws.audioscrobbler.com/2.0/ "HTTP/1.1 200 OK"
2024-10-28 16:45:46,573 - INFO - Found duration on Last.fm: 4:27
2024-10-28 16:45:46,573 - INFO - Menu updated successfully
2024-10-28 16:46:04,573 - INFO - Loaded album: Damned Damned Damned
2024-10-28 16:46:54,528 - INFO - track.updateNowPlaying
2024-10-28 16:46:54,773 - INFO - HTTP Request: POST https://ws.audioscrobbler.com/2.0/ "HTTP/1.1 200 OK"
2024-10-28 16:46:54,774 - INFO - Updated now playing: The Damned - Neat Neat Neat
2024-10-28 16:49:36,780 - INFO - track.scrobble
2024-10-28 16:49:36,941 - INFO - HTTP Request: POST https://ws.audioscrobbler.com/2.0/ "HTTP/1.1 200 OK"
2024-10-28 16:49:36,943 - INFO - Scrobbled: The Damned - Neat Neat Neat
2024-10-28 16:49:36,944 - INFO - track.updateNowPlaying
2024-10-28 16:49:37,093 - INFO - HTTP Request: POST https://ws.audioscrobbler.com/2.0/ "HTTP/1.1 200 OK"
2024-10-28 16:49:37,095 - INFO - Updated now playing: The Damned - Fan Club
```
{{< /terminal >}}

Finally, checking the Tuneshine we can see:

{{< gallery match="images/02.png" sortOrder="assc" rowHeight="300" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

## Summary

What started as an off the cuff idea after waking up turned into a successful experiment in AI-assisted development using Claude 3.5 Sonnet. The challenge was to create a solution that would enable real-time LastFM scrobbling for vinyl records to work with the Tuneshine device. Through iterative prompting and development, I was were able to create a functional macOS status bar application that not only solves the original problem but includes several useful features.

The project demonstrates the potential of modern AI tools in practical application development. By leveraging Claude 3.5 Sonnet's capabilities alongside libraries like rumps and py2app, I were was to transform a simple Python script into a fully-functional macOS application with next to no knowlege of either developing Python or native macOS applications. 

For those interested in trying it out or building upon this project, the complete source code is available on GitHub at:

{{< linkpreview "https://github.com/russmckendrick/vinyl-scrobbler/" "noimage" >}}

Now its not perfect, so I should probably add the following:

{{< notice warning >}}
Build and use this app at your own risk, it was developed by AI and I am on the only one who will probably ever want to use it 😊
{{< /notice >}}

But this adhoc project served as an example of how AI can be effectively used to rapidly prototype and develop solutions for specific use cases, even when working with multiple APIs and system-level integration requirements.

## Audio Summary

{{< notice tip "Please note" >}}
The following audio summary of this blog post was generated by [NotebookLM](https://notebooklm.google).
{{< /notice >}}

{{< audio mp3="2024-10-28-vinyl-scrobbling-app.mp3" >}}
