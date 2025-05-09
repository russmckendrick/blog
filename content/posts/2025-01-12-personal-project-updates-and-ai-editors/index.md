---
title: "Personal Project Updates and AI Editors"
author: "Russ McKendrick"
date: 2025-01-12T11:16:46Z
description: "About that time I wrote and published an App to the Apple App Store without knowing how to code"
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: false
    alt: ""
tags:
  - "ai"
  - "macos"
  - "code"
  - "vinyl"
---

Over the holidays, I decided to revisit [a personal project I worked on in October](/2024/10/28/vinyl-scrobbling-macos-app/).

## Vinyl Scrobbler Recap

The project was a very basic Python script prompted using AI. The application sits in the macOS menu bar and allows you to enter a [Discogs](http://discogs.com) release ID to scrobble the record you are listening to in real-time to [LastFM](http://last.fm).

The reason for the application was not only to dip my toes into the then newly released [Claude 3.5 Sonnet model](https://www.anthropic.com/news/3-5-models-and-computer-use) but also to have the artwork for the album I am listening to show up on my [Tuneshine](http://tuneshine.rocks), as existing services didn’t quite have the functionality needed for it to work.

The end of the post came with this warning:

{{< notice warning >}}
Build and use this app at your own risk. It was developed by AI, and I am probably the only one who will ever want to use it. 😊
{{< /notice >}}

But that didn’t stop Tobias Butler, the creator of Tuneshine, from posting about it:

{{< instagram DCzAQBuSGUt >}}

I fixed a few annoying issues and tidied up the code a little over November and December. I was happy using it in the background as a personal project.

## Enter AI-Powered Code Editors

I started talking with a colleague about AI code editors before the Christmas break. Since I had some free time, I decided to take a look at two of them.

### Windsurf and a Test Project

The first editor I looked at was [Windsurf by Codeium](https://codeium.com/). My initial idea, rather than touching the Vinyl Scrobbler app, was to create a Spotify Wrapped-style end-of-year report on the albums I had purchased. As I catalog everything I buy using my [Discogs account](https://www.discogs.com/user/russmck/collection), which is then indexed on [my own website](http://russ.fm/), I had all the data I needed to create something.

I first ended up asking Windsurf to create a set of Python scripts, as I am getting used to working with and debugging Python code. While that was great for fetching data from Discogs, I quickly hit limitations when it came to creating the HTML for the reports. Rather than spending too much time trying to fix it, I scrapped the code and started again. This time, I used Python to generate JSON for each year and then asked Windsurf to create a single-page web app.

It suggested creating a Vue 3-powered SPA that read the JSON files and created the site, which is hosted at:

{{< linkpreview "https://unwrapped.russ.fm/" "noimage" >}}

... As you can see, it eventually did a good job. I say "eventually" because while it worked, I got stuck in a few loops, which annoyingly ate into my prompt allowance (more on that later).

The full code and commit history can be found at [https://github.com/russmckendrick/unwrapped](https://github.com/russmckendrick/unwrapped).

This gave me the confidence to try something a little more challenging.

## Revisiting Vinyl Scrobbler

The code I have, which produces the website at [https://www.russ.fm/](https://www.russ.fm), interacts with the Apple Music API to get album covers and the links to embed the Apple Music player on the page.

Because accessing the Apple Music API requires a developer key, I had to sign up to be an Apple Developer. This meant that if I wanted to, I could properly sign the Vinyl Scrobbler application so that it didn’t warn the user that the application is not trusted when they first opened it.

This then got me thinking: maybe I could use Windsurf to port the Python code to Swift and make the application a fully native macOS app.

### Windsurf + Vinyl Scrobbler

With Xcode installed and a new project created, I dropped a copy of the Python script into the project and asked Windsurf to reproduce the functionality in Swift. To my surprise, after a little back and forth about build errors, I had something that pretty much recreated the original Python script in Swift. It didn’t work initially because it appeared unable to reach the necessary APIs. However, it successfully built and launched an application that visually resembled the Python version.

Now that I had a base to build on, I could start adding functionality back in. This went as follows:

- **Sorting out permissions**: By default, the application was being blocked from accessing the internet, which made interacting with the Discogs and LastFM APIs a little troublesome. :rofl:
- **Clearing up some misunderstandings**: The original Python code was documented, but the documentation mostly dealt with what to do with each function rather than why it was there. This meant I had to fix some of the logic related to how it was scrobbling tracks to Last.FM.
- **Build errors**: With each change came build errors, most of which were simple to fix. However, I did find that some fixes broke previously working functionality, which resulted in quite a bit of back and forth.

Now I had a working application, so I decided it was time to add some functionality. This was partly inspired by my experience using AI-powered tools like Windsurf for other projects and my curiosity about how far I could take this app with similar assistance.

The first new functionality I tried to add was a player window, and this is where I became a little unstuck with Windsurf.

While prompting the functionality, things started off great, but I soon found myself fighting Windsurf due to technical issues and limitations. Specifically, it started overcomplicating the code when making small changes and, worse, removed large chunks of existing working code for no apparent reason. as it started over complicating code when making small changes and worse, it removed large chunks of existing working code for no apparent reason. Normally, when an LLM starts to do that,t I start new chats with a detailed prompt; in this case, I used:

{{< chat-message position="left" avatar="https://www.russ.social/sticker-clear.svg" >}}

This Swift app is building and running great, but would like to add more functionality.

The files we are working with are as follows ...

- ConfigurationManager.swift = Loads in the configuration file from ~/.vinyl-scrobbler-config.json and sets everything up
- AppDelegate.swift = The bulk of the main code
- DiscogsService.swift = The Discogs part of the application
- LastFMService.swift = The LastFM parts of the application

Please concentrate on only adding this functionality, which is detailed below ...

< rest of the prompt here >

{{< /chat-message >}}

While this approach normally works when dealing with Claude directly I was still having problems with Windsurf - at this stage I decided to look at one of Windsurf's competitors, Cursor, as I had used pretty much all of the tokens I had paid for and felt like I was going around in circles.

### A new challenger enters the ring, Cursor.

I had used [Cursor](https://www.cursor.com) when it was first launched, and I am not entirely sure why, but I didn't get on with the interface. It felt like having a whole separate IDE when VS Code was fine seemed like overkill. Given my experience of Windsurf I decided to sign-up for the trial and give it a second chance to see if it could pick up from where Windsurf left off.

Now given that both tools use Claude 3.5 Sonnet by default, the difference was night and day. The quality of the interactions felt a lot better, and within no time, I had a player window, with artwork and track listing within the application.

{{< gallery match="images/screens/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

Sure, it had problems when adding code that caused build errors—but these were nowhere near as dramatic as the ones Windsurf caused in that it was a problem with the new code that was added rather than the tool's decision to remove entire functions without explanation or reason.

99% of the time, these errors were resolved by passing the line number and the error itself, and if Xcode suggested a fix, I passed that along, too. This gave me the confidence to add more functionality.

#### Last.FM authentication

One of the things which I had been doing, since it was only really me using the application was putting my Last.FM credentials in a text file, it was very hacky, but functional. If I was to make a little more user friendly I had to get the end users to properly authenticate against using their own Last.FM credentials. After a little looking around I found ScrobbleKit, it would handle both the authentication as well as scrobbling the tracks to Last.FM:

{{< linkpreview "https://github.com/tfmart/ScrobbleKit" "noimage" >}}

With a few prompts and a little back and forth with Cursor and a little Googling I had removed my method of handling the authentication and was using ScrobbleKit to sign into Last.FM and saving the credntials to the Key Chain so I could use them each time the application launched. I had also switched over to using ScrobbleKit to send the actual scrobbles.

{{< gallery match="images/screens/04.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

#### Searching Discogs

Up until now I was passing in the Discogs release ID to search for an album and load its details, this was good for me as I index my collection on [Russ.FM](https://www.russ.fm) and one of the features I added a while ago was a button which copies the Discogs ID to the clipboard, which you can see [here][(](https://www.russ.fm/albums/metropolis-pt-2-scenes-from-a-memory-32745087/)).

Again, with a few prompts I had the application searching Discogs and presenting the results back to the user so that can select which release to Scrobble.

{{< gallery match="images/screens/03.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

#### Time to submit to Apple

After a little bit of tidying up and removing some of the leftover debug code, I was ready to submit the application to Apple. The application was rejected a few times because I had not removed some of the security entitlements that had allowed the application to access the configuration file in the user's folder, which was a good catch. There was also a redundant entitlement file that had been created at some point and was doubling up on some information.

Once those issues were resolved, the application was accepted, and I published it; you can find it on the Mac App Store by clicking the banner below:

{{< img src="images/LandscapeBannerAd.png" alt="Download on the App Store [noExternalIcon]" zoom="false" link="https://apps.apple.com/gb/app/vinyl-scrobbler/id6740146205?mt=12&itscg=30200&itsct=apps_box_badge&mttnsubad=6740146205" >}}

So, with that, I have what was a simple app that I would only use, converted to native Swift, and published on the Mac Store. That's not bad, considering I am not a developer by trade, nor had I ever used Swift or Xcode before starting this project.

## Things I wish I knew before starting

There are a few things I should have been doing, but I didn't and regretted not doing so.

### Branch and commit often

Create a "feature" branch in Git, commit often and don't be afraid to roll back.

### Plan and feedback

Take baby steps, it is tempting to ask the LLM to just make one big feature change in one go. Don't do this, instead explain your plan and ask the LLM to break it down into steps, here is the initial prompt I have used to implement an upcoming feature.

{{< chat-message position="left" avatar="https://www.russ.social/sticker-clear.svg" >}}
We are working on a feature branch. I want to add the option to use ShazamKit to listen to what the user is playing and then use the results to search Discogs. As ShazamKit only returns the Artist and track title, we need to think carefully about how to pass this information onto Discogs. Let's use the LastFM API to get more information on the track using track.getInfo and then the album information from there to pass onto the Discogs search we already have using the Album details there.

The interface should be a new slider activated from a new “Listen” menu item below “Load Album.” As per the rest of the application, this new slider should be modern and animated, providing user feedback on what is happening. It should also, as always, be written and implemented using pure SwiftUI and Apple’s best practices regarding creating new Views, models, and, if requested, Services.

Please do not change any existing functionality.

How does this sound? 
{{< /chat-message >}}

{{< chat-message position="right" avatar="images/cursor.png" >}}
Your approach sounds well thought out and aligns perfectly with macOS design patterns and SwiftUI best practices. Let me outline the plan and then we can implement it step by step:

Architecture Plan:

1. Create a ShazamService to handle audio recognition
2. Add a new ListenView for the sliding panel
3. Create a ListenViewModel to manage the state and business logic
4, Integrate with existing LastFMService and DiscogsService

The flow would be:

1. User activates "Listen" from menu
2. Sliding panel appears with animation
3. ShazamKit starts listening
4. On match:
	- Get track/artist from Shazam
	- Use LastFM API to get album info
	- Pass album info to Discogs search
	- Show results in existing Discogs view

Let me first check the existing codebase structure to ensure we maintain consistency.

< agent action taken here >

Perfect. The project follows a clean architecture. Here's what we'll need to create:

1. New Service:
	- ShazamService.swift - Handles ShazamKit integration
2. New Views:
	- ListenView.swift - Main sliding panel view
	- ListenButtonView.swift - Reusable button component for listening state
3. New ViewModel:
	- ListenViewModel.swift - Manages listening state and coordinates services
4. Model updates:
	- ShazamMatch.swift - Model for Shazam results

Before we start implementing, I should check the entitlements file to ensure we have microphone access:

< agent action taken here >

We'll need to add microphone access entitlements. Would you like me to proceed with:

- Adding the necessary entitlements for microphone access and ShazamKit
- Creating the ShazamService with basic recognition functionality
- Implementing the ListenView with a sliding panel design
- Integrating with existing LastFM and Discogs services
- The UI will follow macOS design patterns with:
- A subtle sliding panel from the right
- Clear visual feedback during listening
- SF Symbols for status indicators
- Smooth animations for state transitions
- Proper error handling and user feedback

Does this align with your vision? I can start with any of these components first, but I recommend beginning with the entitlements and ShazamService as they're foundational to the feature.

{{< /chat-message >}}

A preview of this (and the new GUI) can been seen below:

{{< gallery match="images/shazam/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="800x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

### Going around in circles

Sometimes, you will find yourself going around in a loop. You will ask to fix an error, and the LLM will try to cause another problem. You manage to prompt a fix for the new issue, but all that does is recreate the original problem, and your prompt to fix that recreates the new problem you just fixed.

Ask the LLM this one simple thing:

{{< chat-message position="left" avatar="https://www.russ.social/sticker-clear.svg" >}}
Are we using the simplest approach and best practices for the scale of our project structure?
{{< /chat-message >}}

A lot of LLMs like Clade 3.5 and GPT-4o love to overcomplicate their solutions and sometimes need to be told to calm things down and take a simpler approach.

### Forgetfulness

At some point, the LLM will behave like it has forgotten what it is doing. At the first sign of this, start a new session and give the LLM a prompt to refresh its context of where you are in the task. To do this, you can use the plan it originally gave. Just let us know what steps it has done and which step you would like it to work on next. Ensure that you tell it to do it one step at a time.

## Summary

This blog post chronicles my journey of revisiting the Vinyl Scrobbler app, initially written in Python, and transforming it into a fully native macOS app using Swift. Using AI-assisted development tools like Windsurf and Cursor, I explored new functionality, tackled technical challenges, and learned valuable lessons about working with AI-driven tools. Finally, the project culminated in the successful publication of Vinyl Scrobbler on the Mac App Store, which was fun considering my lack of prior experience with Swift or Xcode. The lessons learned during this process apply to anyone venturing into AI-assisted app development or embarking on similar projects.

## Audio Summary

{{< notice tip "Please note" >}}
The following audio summary of this blog post was generated by [NotebookLM](https://notebooklm.google).
{{< /notice >}}

{{< audio mp3="2025-01-12-personal-project-updates-and-ai-editors.mp3" >}}
