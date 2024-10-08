---
title: "Updating my blog using CrewAI"
author: "Russ McKendrick"
date: 2024-05-06T10:12:31+01:00
description: "Discover how CrewAI revolutionized my blog's AI-generated music roundups, enhancing content quality and accuracy. Unlock the potential of collaborative AI for your creative projects."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Discover how CrewAI revolutionized my blog's AI-generated music roundups, enhancing content quality and accuracy. Unlock the potential of collaborative AI for your creative projects."
tags:
  - "ai"
  - "blog"
keywords:
  - "AI"
  - "CrewAI"
  - "Python"
  - "Blogging"
---

I have been reading a lot about CrewAI recently and as it was a long weekend I decided to tip my toe in the water and do something with it, but what?

About a year ago, while bored, I added a Python script to this blog which used the OpenAI API to write a blog post based on what I had listened to the previous week using data from [Last.FM](http://last.fm/user/RussMckendrick).

The first of these posts [can be found here](/2023/05/22/the-cure-dominates-my-week-a-deep-dive-into-post-punk-melancholy-and-gothic-rock/). 

## The Original Code

The code to write this was very basic, there was a simple function that calls the OpenAI API ...

{{< ide title="Original GPT Function" lang="Python" >}}
```python {linenos=true}
def get_gpt3_text(prompt):
    completion = openai.ChatCompletion.create(
        model='gpt-4-1106-preview',
        messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ]
    )
    return completion['choices'][0]['message']['content'].strip()
```
{{< /ide >}}

This function was then called with the following information which defined the instructions and then passed them to the function ...

{{< ide title="The Prompt" lang="Python" >}}
```python {linenos=true}
top_artist_summary = get_wiki_summary(top_artist + " band")
chat_post_summary = f"According to LastFM data the artist I most played this week was {top_artist}. Can you write a short 50 word summary to say this. It is going to be used as a description for a blog post so should be descriptive and interesting."
chat_intro = "Write a casual blog post which details what music I have been listening to this week. The blog post should be 1000 words long. Feel free to use emjois and markdown formatting to make the post more interesting."
if top_artist_summary:
    chat_top_artist_info = f"The most played artist this week was {top_artist}, Wikipedia has this to say about {top_artist} ... {top_artist_summary}."
else:
    chat_top_artist_info = f"The most played artist this week was {top_artist}."
chat_other_artists = f"Other artists I listened to this week include {', '.join([artist for artist, count in top_artists[1:12]])}, mention these too the end, but don't repeat any information you have already given."
chat_data_source = "The data for this blog post was collected from Last.fm you can find my profile at https://www.last.fm/user/RussMckendrick."
chat_ai_generated = "Also, mention that this part of the blog post was AI generated - this part of the post should be short"
gpt3_prompt = f"{chat_intro} {chat_top_artist_info} {chat_other_artists} {chat_data_source} {chat_ai_generated}"
gpt3_summary = get_gpt3_text(chat_post_summary)
gpt3_post = get_gpt3_text(gpt3_prompt) 
```
{{< /ide >}}

As you can see, I was getting information on the top artists, using Wikipedia and then passing everything to OpenAI to write the blog post, there is also code to pull down artist and album images from [russ.fm ](https://russ.fm/) - which is my other site that catalogs my record collection.

This was all run from a GitHub Action which was automatically triggered early Monday morning, creating a pull request for me to review on my way to work.

It worked, but it wasn't perfect - it had a habit of making things up, also, from time to time it would try to embed images that didn't exist and one case ignored everything I told it and made up an album from the top artist - referencing songs and reviews that simply weren't real !!!

This seemed to like the perfect bit of code to review and replace with CrewAI.

## Introducing CrewAI

The [CrewAI website](https://www.crewai.com) describes the tool as ... 

> Cutting-edge framework for orchestrating role-playing, autonomous AI agents. By fostering collaborative intelligence, CrewAI empowers agents to work together seamlessly, tackling complex tasks.

... which does sound a little far-fetched, but then I started looking at some of the example code and it VERY easy to read and understand, the code below is taken from the [documentation](https://docs.crewai.com/) ...

{{< ide title="Creating the agents" lang="Python" >}}
```python {linenos=true}
import os
os.environ["SERPER_API_KEY"] = "Your Key"  # serper.dev API key
os.environ["OPENAI_API_KEY"] = "Your Key"

from crewai import Agent
from crewai_tools import SerperDevTool
search_tool = SerperDevTool()

# Creating a senior researcher agent with memory and verbose mode
researcher = Agent(
  role='Senior Researcher',
  goal='Uncover groundbreaking technologies in {topic}',
  verbose=True,
  memory=True,
  backstory=(
    "Driven by curiosity, you're at the forefront of"
    "innovation, eager to explore and share knowledge that could change"
    "the world."
  ),
  tools=[search_tool],
  allow_delegation=True
)

# Creating a writer agent with custom tools and delegation capability
writer = Agent(
  role='Writer',
  goal='Narrate compelling tech stories about {topic}',
  verbose=True,
  memory=True,
  backstory=(
    "With a flair for simplifying complex topics, you craft"
    "engaging narratives that captivate and educate, bringing new"
    "discoveries to light in an accessible manner."
  ),
  tools=[search_tool],
  allow_delegation=False
)
```
{{< /ide >}}

As you can see, this is adding two agents, one who will research the subject `{topic}` and the other who will write about it. Both can access and search the internet using [Serper ](https://serper.dev). With the two agents defined you then need to create tasks ...



{{< ide title="Creating the tasks" lang="Python" >}}
```python {linenos=true}
from crewai import Task

# Research task
research_task = Task(
  description=(
    "Identify the next big trend in {topic}."
    "Focus on identifying pros and cons and the overall narrative."
    "Your final report should clearly articulate the key points,"
    "its market opportunities, and potential risks."
  ),
  expected_output='A comprehensive 3 paragraphs long report on the latest AI trends.',
  tools=[search_tool],
  agent=researcher,
)

# Writing task with language model configuration
write_task = Task(
  description=(
    "Compose an insightful article on {topic}."
    "Focus on the latest trends and how it's impacting the industry."
    "This article should be easy to understand, engaging, and positive."
  ),
  expected_output='A 4 paragraph article on {topic} advancements formatted as markdown.',
  tools=[search_tool],
  agent=writer,
  async_execution=False,
  output_file='new-blog-post.md'  # Example of output customization
)
```
{{< /ide >}}

Again, it easy to see what is happening here as each of the two tasks is assigned an agent and that expected output is being clearly defined. With the agents and tasks defined we can then assemble the crew ...

{{< ide title="Assembling the crew" lang="Python">}}
```python {linenos=true}
from crewai import Crew, Process

# Forming the tech-focused crew with some enhanced configurations
crew = Crew(
  agents=[researcher, writer],
  tasks=[research_task, write_task],
  process=Process.sequential,  # Optional: Sequential task execution is default
  memory=True,
  cache=True,
  max_rpm=100,
  share_crew=True
)
```
{{< /ide >}}

Finally, we can then run the tasks ...

{{< ide title="Start the task" lang="Python" >}}
```python {linenos=true}
# Starting the task execution process with enhanced feedback
result = crew.kickoff(inputs={'topic': 'AI in healthcare'})
print(result)
```
{{< /ide >}}

Running the code above, but using the topic of "AI in blogging" gave the following results ...

> **The Rise of AI in Blogging: A Double-Edged Sword?**
> 
> Artificial Intelligence (AI) is redefining the blogging landscape, with a surge in AI-powered writing tools and techniques. These tools leverage advancements in Natural Language Processing (NLP) and Machine Learning (ML) to generate ideas and overcome writer's block, making content creation more efficient and cost-effective. In addition, AI-powered brainstorming apps and topic generators are gaining traction, aiding writers in exploring new perspectives and identifying trending topics.
> 
> However, the AI-powered revolution in blogging isn't without its challenges. Critics have raised concerns over AI-generated content's quality, with a common critique being the lack of human personality and creativity. AI's inability to replicate the emotional depth and personal touch of a human writer can sometimes result in content that feels sterile or impersonal.
> 
> In addition, the risk of plagiarism is a significant concern in AI-generated content. As AI tools draw from existing online content to generate new material, there's a potential for inadvertently replicating copyrighted work. Furthermore, ethical questions have emerged about transparency, with readers having a right to know if the content they're consuming is AI-generated.
> 
> Despite these challenges, the industry is looking to mitigate these risks. The key lies in using reliable AI writing assistants that produce high-quality, original content. Maintaining transparency about the use of AI in content creation and upholding ethical standards regarding the use of private information are also crucial steps. In conclusion, while AI offers exciting new possibilities for the blogging industry, it's essential to navigate its use responsibly and ethically to reap its benefits while minimizing potential drawbacks.

... there is a lot of output when running the script, I added a copy of [the full script and the output to this GitHub Gist](https://gist.github.com/russmckendrick/6b3dc6872d4cfe8b4f5fed6b9c0f1a26) so you can review it all, as I am sure you will agree - it is impressive stuff.

## What did listen to?

I decided that I should have two separate crews in my code, the first will generate the post title and add an SEO-friendly description ...

{{< ide title="The Subject and Summary Crew" lang="Python" >}}
```python {linenos=true}
def sanitize_text_output(text):
    """
    Clean the output text by removing backticks, double quotes, and any characters that are not word characters, whitespace, or hyphens.
    Args:
        text (str): The input text to be cleaned.
    Returns:
        str: The cleaned text with backticks, double quotes, and specified characters removed.
    """
    return re.sub(r'[\'"]', '', text)

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
        goal=f"Generate a catchy and SEO-friendly title for a weekly music blog post. The post is about the top artists and albums listened to this week, {', '.join([artist for artist, _ in top_artists])} and top albums: {', '.join([album for (_, album), _ in top_albums])}. Do not exceed 70 characters or use special characters such a :, -, |, quotes or emojis.",
        backstory="You are an expert in creating creative, engaging and SEO-optimized titles for blog posts. Your titles should grab the reader's attention and include relevant keywords.",
        verbose=True,
        max_inter=1,
    )

    title_task = Task(
        description=f"Generate a title for a weekly music blog post featuring the top artists: {', '.join([artist for artist, _ in top_artists])} and top albums: {', '.join([album for (_, album), _ in top_albums])}.",
        expected_output="A catchy and SEO-friendly title for the blog post. Do not exceed 70 characters or use special characters such a :, -, |, quotes or emojis.",
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
        expected_output="A concise and SEO-friendly summary for the blog post. It shouldn't be more than 180 characters and it should NOT use special characters such a :, -, |,  quotes or emojis.",
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
    title = sanitize_text_output(result['tasks_outputs'][0].exported_output)
    summary = sanitize_text_output(result['tasks_outputs'][1].exported_output)

    return title, summary
```
{{< /ide >}}

You might have noticed that I am passing the output through another function that removes some of the characters that would break the blog posts front-mater as I found that it generates something that would look something like `""My Blog Post""` and the `""` would break Hugo.

This was called using ...

{{< ide title="Calling the function" lang="Python" >}}
```python {linenos=true}
title, summary = generate_title_and_summary(date_str_start, week_number, top_artists, top_albums)
```
{{< /ide >}}

Next up we have the crew that researched the albums I listened to one by one ...

{{< ide title="The Album Research Crew" lang="Python" >}}
```python {linenos=true}
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
```
{{< /ide >}}

This was called by a for loop which contained details of the album ...

{{< ide title="Calling the function" lang="Python" >}}
```python {linenos=true}
    topics = [f"{album} by {artist}" for (artist, album), _ in top_albums]
    blog_post_sections = []

    for album in topics:
        result = research_an_album(album)
        print(result)
        output_str = result['final_output']
        blog_post_sections.append(output_str)
    blog_post = "\n\n".join(blog_post_sections)
```
{{< /ide >}}

This resulted in a BIG improvement to the size, quality and accuracy of the posts, I went through and updated all of April's posts and today's (6th May 2024) was also automatically generated:

- [2024/04/01 - Weekly Top Tunes: From Beach Boys to Thundercat](/2024/04/01/weekly-top-tunes-from-beach-boys-to-thundercat/)
- [2024/04/08 - This Weeks Top Music Hits: From INXS to The Who](/2024/04/08/this-weeks-top-music-hits-from-inxs-to-the-who/)
- [2024/04/15 - This Weeks Top Music Picks: Rancid to Tears for Fears](/2024/04/15/this-weeks-top-music-picks-rancid-to-tears-for-fears/)
- [2024/04/22 - This Weeks Top Music Hits: From Springsteen to R.E.M.](/2024/04/22/this-weeks-top-music-hits-from-springsteen-to-r.e.m./)
- [2024/04/29 - This Weeks Top Music Hits: Eagles, Blur, Kim Gordon and More](/2024/04/29/this-weeks-top-music-hits-eagles-blur-kim-gordon-and-more/)
- [2024/05/06 - This Weeks Top Music Hits: From Pink Floyd to Soulwax](/2024/05/06/this-weeks-top-music-hits-from-pink-floyd-to-soulwax/)

The full output of today's post being generated [can be found in this GitHub Gist](https://gist.github.com/russmckendrick/f5a3407b84f2850be0ffcacf5d32124a) and the full code is [here](https://github.com/russmckendrick/blog/blob/main/generate_blog_post.py).

If you want to keep an eye on what I am listening to then [follow this link](/tunes/).

## Conclusion

Integrating CrewAI into my blog's AI-generated weekly music roundup feature has been a game-changer. By leveraging the power of collaborative AI agents, I've been able to significantly improve the quality, accuracy, and depth of the content generated for these posts.

The Subject and Summary Crew ensures that each post has a compelling, SEO-friendly title and a concise summary that captures the essence of the content. Meanwhile, the Album Research Crew does a fantastic job of researching the albums I've listened to and generating informative, engaging sections for the blog post.

The results speak for themselves – the updated posts are more comprehensive, better structured, and far more enjoyable to read. CrewAI has allowed me to take my AI-generated content to the next level, providing my readers with valuable insights into my weekly music listening habits.

As I continue to explore the capabilities of CrewAI and other AI technologies, I'm excited about the possibilities they offer for enhancing my blog and delivering high-quality content to my audience. By embracing these tools and using them responsibly, we can unlock new ways to inform, entertain, and engage our readers.

If you're interested in seeing how AI can revolutionize your content creation process, I highly recommend giving CrewAI a try. With its intuitive framework and powerful collaboration features, it's an invaluable tool for anyone looking to harness the power of AI in their creative endeavors.