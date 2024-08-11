---
title: "Unlocking Image Creation with Flux and GPT-4o"
author: "Russ McKendrick"
date: 2024-08-11T13:00:00+01:00
description: "Explore the world of AI image generation using Flux, fal.ai, and OpenAI. Learn how to build a Streamlit app that leverages GPT-4o for prompt tuning and Flux models for creating stunning visuals. Compare outputs with Midjourney and discover the potential of these cutting-edge tools."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Explore the world of AI image generation using Flux, fal.ai, and OpenAI. Learn how to build a Streamlit app that leverages GPT-4o for prompt tuning and Flux models for creating stunning visuals. Compare outputs with Midjourney and discover the potential of these cutting-edge tools."
tags:
  - "ai"
  - "python"
  - "code"
keywords:
  - "AI"
  - "Python"
  - "Flux"
  - "fal.ai"
  - "openai"
  - "Streamlit"
  - "GPT-4o"
  - "Flux Pro"
---

This week I decided to see how many buzzwords I could get into one post, given the recent release of Flux by Black Forest Labs I had originally intended on trying to get it up and running locally - however it quickly became clear that my M3 MacBook Pro with its 36GB of RAM wasn't going to cut it. Because of this, I decided to look at one of the many online services that offer access to the various Flux models via their APIs which led me to Fal.AI which in turn gave me the idea for this post.

## The Tools

Before we dive into the idea I had, let's quickly get ourselves up to speed with the tools we'll be using in this post. Each of these technologies plays a crucial role in our AI-powered image generation project.

### Flux.1: The new kid on the block

A team of AI researchers and engineers, renowned for their work on foundational generative AI models like VQGAN and Latent Diffusion across academic, industrial, and open-source platforms, surprised everyone with the announcement of [Black Forest Labs](https://blackforestlabs.ai/).

Alongside their Series Seed funding round of $31 million, they also revealed the immediate availability of three variations of their Flux.1 model:

- **FLUX.1 [pro]:** The premier version of the FLUX.1 model, offering state-of-the-art image generation with exceptional prompt following, visual quality, image detail, and output diversity. FLUX.1 [pro] is accessible via API, and is also available through platforms such as Replicate and fal.ai. Additionally, it supports dedicated and customized enterprise solutions.
- **FLUX.1 [dev]:** An open-weight, guidance-distilled model intended for non-commercial applications. Derived directly from FLUX.1 [pro], FLUX.1 [dev] provides similar quality and prompt adherence capabilities while being more efficient than standard models of the same size. The model's weights are available top download from [Hugging Face[noSpace]](https://huggingface.co/black-forest-labs/FLUX.1-dev), and it can be executed on [Replicate[noSpace]](https://replicate.com) and [fal.ai[noSpace]](https://fal.ai/).
- **FLUX.1 [schnell]:** Designed as the fastest model in the lineup, FLUX.1 [schnell] is optimized for local development and personal use. It is freely available under an Apache 2.0 license, with weights hosted on Hugging Face. Inference code can be found on GitHub and in Hugging Face’s Diffusers, and the model is integrated with ComfyUI from day one.

For an idea of what you can produce have a look at the example images below, which were all generated using the tools we are going to be covering in this post:

{{< gallery match="images/samples/*" sortOrder="assc" rowHeight="300" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

As you can see, it can not only handle text extremely well, but it also produces high-quality photo-realistic images as well as some abstract ones.

### fal.ai: Doing the heavy lifting

Also already mentioned, running even the small model locally was out of the question so I decided to look at one of the two original partners providing all three models in the Flux.1 family, I chose to focus on [fal.ai](https://fal.ai/) as I had used them previously to test another model earlier in the year.

{{< terminal title="Creating an image using cURL" >}}
```text
export FAL_KEY="YOUR_API_KEY"
curl --request POST \
  --url https://fal.run/fal-ai/flux-pro \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
   }'
```
{{< /terminal >}}

This returned the following JSON response:

{{< ide title="The results of the image" lang="JSON" >}}
```json {linenos=true}
{
    "images": [
        {
            "url": "https://fal.media/files/panda/oGSuf_FrMn7im_0DGnSdg_4378270c342f4170bb0f55e14cbb0636.jpg",
            "width": 1024,
            "height": 768,
            "content_type": "image/jpeg"
        }
    ],
    "timings": {},
    "seed": 932194184,
    "has_nsfw_concepts": [
        false
    ],
    "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
}

```
{{< /ide >}}<br>

Opening the image in the response gave us the following:

{{< gallery match="images/fal/01.jpg" sortOrder="assc" rowHeight="400" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

This got me thinking - there is a Python library for fal.ai so I could use that, also what other tools have Python libraries I can use alongside fai.ai?

### OpenAI: Building a Better Prompt

[OpenAI](https://openai.com) shouldn't need an introduction, we will be using the [GPT4o models](https://platform.openai.com/docs/models/gpt-4o) to help with prompting.

### Streamlit: Bring it all together

[Streamlit](https://streamlit.io) is a Python framework from [Snowflake](https://www.snowflake.com/) that quickly lets you build data and AI-driven web applications with a really low entry point, see the following for a quick overview:

{{< youtube c9k8K1eII4g >}}<br>

There was just one problem with this, I am not a developer - so how could I do this?

### Claude: Your personal development team

The final tool used in this post is [Claude](https://claude.ai/) from [Anthropic](https://www.anthropic.com/), while I may not be a developer - I can prompt and debug code and since the release of [Claude 3.5 Sonnet](https://www.anthropic.com/news/claude-3-5-sonnet) I have been using it more and more for development tasks.

So let's give it a go !!!

## The Idea

The idea I had was to use Streamlit to build an interface to interact with the fal.ai API and the Flux family of models from my local machine - as part of this it should also use GPT4o to help tune the prompt to give us the best shot at getting a good result from Flux.

## Running the application

Before we dive into the code, let's just download and run the app.

### Getting the keys

To run the application you will need two API keys, one for fal.ai and the other for the OpenAI API, the links below:

- [Key-based Authentication on fal.ai](https://fal.ai/docs/authentication/key-based)
- [OpenAI Authentication documentation](https://platform.openai.com/docs/api-reference/authentication)

Make a note of the keys and keep them very safe.

### Creating the environment

Next up we need to create an environment to run the application in and grab the code from [GitHub](https://github.com/russmckendrick/flux-fal-openai-streamlit).

{{< notice info >}}
I use Conda to run Python on my local machine, you can find [my blog post about installing and using Conda here](/2024/04/06/conda-for-python-environment-management-on-macos/).
{{< /notice >}}

Run the commands below to create the conda environment, switch to it, check the code out from [GitHub](https://github.com/russmckendrick/flux-fal-openai-streamlit) and install the required Python packages:

{{< terminal title="Preparing the environment" >}}
```text
conda create -n streamlit python=3.12
conda activate streamlit
git clone https://github.com/russmckendrick/flux-fal-openai-streamlit.git
cd flux-fal-openai-streamlit
pip install -r requirements.txt
```
{{< /terminal >}}

### Launching the application

We are nearly ready to launch the application, just one more thing to do and that is the expose our API keys as an environment variable for our application to read:

{{< terminal title="Exporting the API keys" >}}
```text
export FAL_KEY="<put-your-fal.ai-key-here>"
export OPENAI_API_KEY='<put-your-openai-key-here>'
```
{{< /terminal >}}

With the keys in place we can launch the application by running the command below:

{{< terminal title="Exporting the API keys" >}}
```text
streamlit run app.py
```
{{< /terminal >}}

This will open the application window, which should look something like the following:

{{< gallery match="images/app/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

### Using the application

Now we have the application open, let's generate an image, first let's write a basic prompt:

{{< notice tip "Initial Prompt:" >}}
A magical cityscape
{{< /notice >}}

Just clicking "☁️ Generate image" at this point will give you an impressive-looking image without any tuning, below is the image which was generated using the basic prompt above:

{{< gallery match="images/app/basic.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

Lets now get GPT-4o to expand on our basic prompt. First, click on "Use OpenAI for prompt tuning" and then select your chosen GPT-4o model from the drop-down, in this example, I will use the default of gpt-4o rather than gpt-4o-mini, then click on the "✏️ Tune Prompt" button.

This will send your original prompt to the model and not only return a new prompt, which in this run was:

{{< notice tip "Tuned Prompt:" >}}
A sprawling cityscape filled with fantastical architecture, where towering crystal spires and floating gardens intertwine with ancient, ivy-covered stone buildings. The streets are aglow with bioluminescent plants and bustling with mythical creatures such as griffins and fairies. In the sky, airships float alongside dragons, under a sky painted with auroras and dotted with twinkling stars and moons.
{{< /notice >}}

You will also get if you click on "See explanation and suggestions" more details on why the prompt has been updated:

{{< notice note "Explanation of changes:" >}}
The original prompt was very general and lacked specificity. By adding details such as "towering crystal spires," "floating gardens," "ancient, ivy-covered stone buildings," and "bioluminescent plants," the image becomes more vivid and specific. Including mythical creatures like griffins and fairies adds an element of magic and life to the city. The mention of airships, dragons, auroras, and multiple moons helps to set a more fantastical and immersive atmosphere.
{{< /notice >}}

As well as more suggestions on how you could further improve the prompt:

{{< notice note "Additional suggestions:" >}}
To further enhance the prompt, consider specifying the time of day or the overall mood you want to convey (e.g., twilight, festive, serene). You could also indicate the cultural influences or architectural styles you envision (e.g., "influenced by ancient Greek and futuristic aesthetics").
{{< /notice >}}

If you are happy with the new prompt, click on "✅ Accept Tuned Prompt" and then click the "☁️ Generate image" button, after a minute you will get your image back:

{{< gallery match="images/app/tuned.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

The screens below show how the process above looks within the application:

{{< gallery match="images/app/prompt-tune/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

As you can see from the last picture, a copy of the image and a markdown summary have been saved to your local machine.

## Code Highlights

Let's take a closer look at some key parts of our application's code. These snippets highlight the core functionality and demonstrate how we're integrating the various tools we've discussed. By examining these, you'll get a better understanding of how the different components work together to create our AI-powered image generation app.

{{< ide title="tune_prompt_with_openai" lang="Python" >}}
```python {linenos=true}
def tune_prompt_with_openai(prompt, model):
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    client = openai.OpenAI(api_key=openai_api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are an advanced AI assistant specialized in refining and enhancing image generation prompts. Your goal is to help users create more effective, detailed, and creative prompts for high-quality images. Respond with: 1) An improved prompt (prefix with 'PROMPT:'), 2) Explanation of changes (prefix with 'EXPLANATION:'), and 3) Additional suggestions (prefix with 'SUGGESTIONS:'). Each section should be on a new line."
            },
            {
                "role": "user",
                "content": f"Improve this image generation prompt: {prompt}"
            }
        ]
    )
    return response.choices[0].message.content.strip()

```
{{< /ide >}}<br>

As you can see from the system prompt below, we are instructing the model to not only generate the prompt but also everything else and how it should format its response:

{{< notice tip "The system prompt" >}}
You are an advanced AI assistant specialized in refining and enhancing image generation prompts. Your goal is to help users create more effective, detailed, and creative prompts for high-quality images.

Respond with:

1) An improved prompt (prefix with 'PROMPT:'),
2) Explanation of changes (prefix with 'EXPLANATION:'),
3) Additional suggestions (prefix with 'SUGGESTIONS:').

Each section should be on a new line.
{{< /notice >}}

This means we only make one call to the model and also we have sections we can identify when we receive the response.

As the images may take a little while to generate I had Claude add some messages to cycle through rather than us just looking at a boring spinner:

{{< ide title="cycle_spinner_messages" lang="Python" >}}
```python {linenos=true}
def cycle_spinner_messages():
    messages = [
        "🎨 Mixing colors...",
        "✨ Sprinkling creativity dust...",
        "🖌️ Applying artistic strokes...",
        "🌈 Infusing with vibrant hues...",
        "🔍 Focusing on details...",
        "🖼️ Framing the masterpiece...",
        "🌟 Adding that special touch...",
        "🎭 Bringing characters to life...",
        "🏙️ Building the scene...",
        "🌅 Setting the perfect mood...",
    ]
    return itertools.cycle(messages)
```
{{< /ide >}}<br>

When I said Streamlit made creating web applications really easy, I wasn't kidding. The code below generates the bulk of what you see on the initial screen:

{{< ide title="main()" lang="Python" >}}
```python {linenos=true}
def main():
    st.title("🤖 Image Generation with fal.ai & Flux")

    # Check for environment variables
    if not os.getenv("FAL_KEY"):
        st.error("FAL_KEY environment variable is not set. Please set it before running the app.")
        return

    # Model selection dropdown
    model_options = {
        "Flux Pro": "fal-ai/flux-pro",
        "Flux Dev": "fal-ai/flux/dev",
        "Flux Schnell": "fal-ai/flux/schnell",
        "Flux Realism": "fal-ai/flux-realism"
    }
    selected_model = st.selectbox("Select Model:", list(model_options.keys()), index=0)

    # Basic parameters
    image_size = st.selectbox("Image Size:", ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"], index=0)
    num_inference_steps = st.slider("Number of Inference Steps:", min_value=1, max_value=50, value=28)

    # Advanced configuration in an expander
    with st.expander("Advanced Configuration", expanded=False):
        guidance_scale = st.slider("Guidance Scale:", min_value=1.0, max_value=20.0, value=3.5, step=0.1)
        safety_tolerance = st.selectbox("Safety Tolerance:", ["1", "2", "3", "4"], index=1)

    # Initialize session state
    if 'user_prompt' not in st.session_state:
        st.session_state.user_prompt = ""
    if 'tuned_prompt' not in st.session_state:
        st.session_state.tuned_prompt = ""
    if 'prompt_accepted' not in st.session_state:
        st.session_state.prompt_accepted = False

    # User input for the prompt
    user_prompt = st.text_input("Enter your image prompt:", value=st.session_state.user_prompt)

    # Update session state when user types in the input field
    if user_prompt != st.session_state.user_prompt:
        st.session_state.user_prompt = user_prompt
        st.session_state.prompt_accepted = False

    # OpenAI prompt tuning options
    use_openai_tuning = st.checkbox("Use OpenAI for prompt tuning", value=False)
    
    openai_model_options = ["gpt-4o", "gpt-4o-mini"]
    selected_openai_model = st.selectbox("Select OpenAI Model:", openai_model_options, index=0, disabled=not use_openai_tuning)
```
{{< /ide >}}<br>

The drop-downs, text input boxes, sliders and the hidden advanced settings are all native Streamlit components which "just work", also being all native it gives the application a nice consistent look when other things happen like:

{{< ide title="Generating image" lang="Python" >}}
```python {linenos=true}
        # Display the prompt being used
        st.subheader("☁️ Generating image with the following prompt:")
        st.info(user_prompt)
```
{{< /ide >}}<br>

The rest of the code can be found on the applications [GitHub repo](https://github.com/russmckendrick/flux-fal-openai-streamlit)](https://github.com/russmckendrick/flux-fal-openai-streamlit).

## Some more images

Before wrapping up this post, let's take some of the prompts I have used to generate previous blog post covers in Midjouney and run them through Flux - I will leave you to make your own mind up on which is better 😊.

### Generating an Azure Storage Account SAS token using Azure Logic and Function apps

{{< notice note "Original Prompt" >}}
A high-resolution digital photograph featuring an Azure-colored traditional combination safe in a large open-plan office. The vintage metal safe, painted in shades of Azure blue, stands prominently next to a modern desk with high-tech tools. The setting blends modern and vintage elements, with natural light streaming through large windows and focused artificial lighting highlighting the safe and the workspace. Soft clouds surround the safe, symbolizing cloud storage. The image conveys the concept of secure access to information, blending old-world security with modern cloud technology. Shot on Kodachrome film stock for a rich, professional look.
{{< /notice >}}

**Midjourney** ...

{{< gallery match="images/covers/generating-an-azure-storage-account-sas-token-using-azure-logic-and-function-apps/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**Flux:1 [Pro]** ...

{{< gallery match="images/covers/generating-an-azure-storage-account-sas-token-using-azure-logic-and-function-apps/02.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**[Link to post](/2024/07/27/generating-an-azure-storage-account-sas-token-using-azure-logic-and-function-apps/)**


### Azure Firewall KQL Query

{{< notice note "Original Prompt" >}}
Retro computing magazine cover, KQL queries theme vibrant illustrated with futuristic elements, early 1980s style, computer terminals, bright color palette with yellows, blues, and reds, hand-drawn illustration style ::1 1980s computing magazine aesthetic, firewall, flames, fire, log, logs, no photorealism ::1
{{< /notice >}}


**Midjourney** ...

{{< gallery match="images/covers/azure-firewall-kql-query/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**Flux:1 [Pro]** ...

{{< gallery match="images/covers/azure-firewall-kql-query/02.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**[Link to post](/2024/07/20/azure-firewall-kql-query/)**


### Azure Virtual Desktop KQL Queries

{{< notice note "Original Prompt" >}}
Retro computing magazine cover, KQL queries theme vibrant illustrated landscape with futuristic elements, early 1980s style, computer terminals integrated into nature scenes, power lines connecting devices, cartoon-style buildings in background, vintage computer hardware in foreground, bright color palette with yellows, blues, and greens, hand-drawn illustration style ::1 1980s computing magazine aesthetic, no photorealism ::1
{{< /notice >}}

**Midjourney** ...

{{< gallery match="images/covers/azure-virtual-desktop-kql-queries/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**Flux:1 [Pro]** ...

{{< gallery match="images/covers/azure-virtual-desktop-kql-queries/02.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**[Link to post](/2024/07/07/azure-virtual-desktop-kql-queries/)**


### Azure DevOps Ansible Pipeline; Boosting Efficiency with Caching

{{< notice note "Original Prompt" >}}
Photorealistic image of a 1950s workshop bench. Two side-by-side conveyor belts with gears and cogs visible. On the left belt: a vintage tin robot toy moving slowly. On the right belt: a shiny die-cast 50s sports car toy speeding ahead. Warm lighting, slight workshop clutter. Muted color palette with focus on metallic silvers, cherry reds, and pastel blues.
{{< /notice >}}

**Midjourney** ...

{{< gallery match="images/covers/azure-devops-ansible-pipeline-boosting-efficiency-with-caching/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**Flux:1 [Pro]** ...

{{< gallery match="images/covers/azure-devops-ansible-pipeline-boosting-efficiency-with-caching/02.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**[Link to post](/2024/06/28/azure-devops-ansible-pipeline-boosting-efficiency-with-caching/)**

### Day to Day Tools, the 2024 edition

{{< notice note "Original Prompt" >}}
Create a photorealistic image of a well-organized tool wall in an indoor rustic workshop setting, showcasing a variety of tools neatly arranged, highlighting the tools used for everyday tasks - tools should represent different macOS tools like VS Code, Sublime Text, Docker, Apple Music to name but a few. Also, in the foreground there is an early 80s Beige IBM PC with a green screen CRT monitor. The lighting is soft and bright, ensuring all details of the tools and workbench are clearly visible. The image should look clean and professional, with a focus on the organization and variety of tools.
{{< /notice >}}

**Midjourney** ...

{{< gallery match="images/covers/day-to-day-tools-the-2024-edition/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**Flux:1 [Pro]** ...

{{< gallery match="images/covers/day-to-day-tools-the-2024-edition/02.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**[Link to post](/2024/06/16/day-to-day-tools-the-2024-edition/)**

### Conda for Python environment management on macOS

{{< notice note "Original Prompt" >}}
An extremely photo-realistic image of a developer with pronounced frustration on his face, his thick glasses slipping down the bridge of his nose, shirt sleeves rolled up. He's surrounded by a chaotic landscape of tangled wires, scattered papers, and multiple monitors flashing code on his very cluttered desk. In contrast, the modern office around him is orderly, with colleagues focused on their tasks, highlighting his isolation in frustration. Emphasize the contrast between his messy area and the clean, organized workspace of the office. Capture this in a wider shot to show both his immediate environment and the office backdrop, providing a full context of his challenging situation.
{{< /notice >}}

**Midjourney** ...

{{< gallery match="images/covers/conda-for-python-environment-management-on-macos/01.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**Flux:1 [Pro]** ...

{{< gallery match="images/covers/conda-for-python-environment-management-on-macos/02.png" sortOrder="assc" rowHeight="600" margins="5" thumbnailResizeOptions="800x800 q90 Lanczos" showExif=true previewType="blur" embedPreview=true >}}<br>

**[Link to post](/2024/04/06/conda-for-python-environment-management-on-macos/)**

## Conclusion

Now that you've seen the potential of combining Flux, fal.ai, OpenAI, and Streamlit, why not give it a try yourself? Clone the repository, set up your environment, and start experimenting with your own prompts. Whether you're a developer looking to build on this framework or a creative professional curious about AI-assisted image generation, there's plenty of room for exploration and innovation. Don't forget to share your experiences or any cool images you generate – I'd love to see what you come up with!