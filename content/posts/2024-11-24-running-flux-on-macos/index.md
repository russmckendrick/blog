---
title: "Running Flux on macOS"
author: "Russ McKendrick"
date: 2024-11-24T14:16:40Z
description: “Learn how to install and use MFLUX to run FLUX.1 models on macOS. This guide explores generating high-quality AI images, comparing [Schnell] and [Dev] models, and enhancing outputs with LoRAs for custom styles.”
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: ""
tags:
  - "macos"
  - "ai"
  - "python"
---

When I last wrote about [FLUX.1 from Black Forest Labs](/2024/08/11/unlocking-image-creation-with-flux-and-gpt-4o/), I mentioned, "however, it quickly became clear that my M3 MacBook Pro with its 36GB of RAM wasn’t going to cut it." Since then, I’ve upgraded to an M4 MacBook Pro with 48GB of RAM. Alongside this, substantial improvements have been made to run FLUX.1 smoothly on macOS machines via the [MFLUX project](https://github.com/filipstrand/mflux). 

In this quick post, I’ll walk you through installing and using MFLUX. Let’s dive in!

## Installing MFLUX

As I’ve shared over the past few months, I use [Conda](/2024/04/06/conda-for-python-environment-management-on-macos/) to [manage](/2024/11/17/zsh-conda-environment-selector-function/) Python environments on my macOS machine. The first step is to create a new environment, switch to it, and install MFLUX:


{{< terminal title="Installing MFLUX" >}}
```text
conda create -n mflux python=3.11
conda activate mflux
pip install mflux
```
{{< /terminal >}}

With that, MFLUX is installed, and we’re almost ready to generate our first image.

## Generating images with FLUX.1 [schnell]

With MFLUX installed, the `mflux-generate` command becomes available. On its first run, it will download the models and necessary files—over 30GB in total, so be prepared for a bit of a wait:

{{< terminal title="Something here" >}}
```text
mflux-generate \
--prompt "Luxury food photograph" \
--model schnell \
--steps 2 \
--seed 2 \
--height 1024 \
--width 1024
```
{{< /terminal >}}

Once done, you’ll receive an image like this:

{{< gallery match="images/01.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

### Sample FLUX.1 [schnell] images

Here are more samples using FLUX.1 [Schnell], generated by altering only the prompts:

{{< gallery match="images/schnell-samples/*" sortOrder="assc" rowHeight="300" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

The prompts for each of the images are below:

{{< notice tip "Prompt #1" >}}
Detailed cinematic dof render of an old detailed CRT monitor on a wooden desk in a bright room with items around, messy dirty room. On the screen are the letters "RUSS.CLOUD" glowing softly. High detail hard surface render.
{{< /notice >}}

{{< notice tip "Prompt #2" >}}
Create a hyperrealistic image of a person sitting in a cozy coffee shop, working on a sleek laptop. The individual should be wearing casual but stylish attire, with a focused expression. Surround them with the warm ambiance of the cafe: a mix of modern and rustic decor, soft lighting from hanging Edison bulbs, and steam rising from a freshly brewed coffee cup beside their laptop. Through the window behind them, show a bustling city street with pedestrians and blurred car lights, suggesting an early evening setting. The laptop screen should display faint reflections of text or code, adding to the sense of productivity.
{{< /notice >}}

{{< notice tip "Prompt #3" >}}
Create a highly detailed and dramatic image of a 1950s movie scene. The setting should be a dimly lit diner at night, with neon signs glowing faintly through rain-streaked windows. Center two characters: a woman in a vintage dress with perfectly styled hair, clutching a handkerchief as she looks distraught, and a man in a sharp suit with a loosened tie, leaning against the counter with a cigarette in hand, his expression a mix of regret and defiance. The tension between them should be palpable. Surround them with details like a jukebox softly glowing in the corner, a half-empty coffee cup on the counter, and a lone waitress in the background, watching the scene unfold with concern. Use dramatic chiaroscuro lighting to heighten the emotion and give the scene a cinematic noir feel.
{{< /notice >}}

{{< notice tip "Prompt #4" >}}
Design a sleek, modern promotional image for the tech blog “russ.cloud.” Center the blog’s name in bold, futuristic typography, glowing with a soft neon effect. The background should feature a dynamic blend of cloud patterns and abstract digital elements, such as circuits, floating data streams, and holographic grids, to symbolize cutting-edge technology and cloud computing. Include subtle icons of tech concepts like servers, code snippets, and analytics charts seamlessly integrated into the background. Use a color palette of deep blues, vibrant purples, and glowing whites to convey innovation and sophistication.
{{< /notice >}}

Each image adhered closely to its prompt and rendered text beautifully, taking about 30 seconds to generate.

## Generating images with FLUX.1 [dev]

Switching to FLUX.1 [Dev] only requires changing the `--model` flag to `dev`. However, this model requires login credentials for Hugging Face. Install the CLI and log in:

{{< terminal title="Install the Hugging Face CLI and login " >}}
```text
brew install hugging face-cli
huggingface-cli login
```
{{< /terminal >}}

After logging in, download the FLUX.1 [Dev] model (another 30GB). Running the same command with adjusted steps yields improved results.

{{< gallery match="images/02.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

Oh, well that didn't work as expected, what happened? Well, FLUX.1 [schnell] is optimized for speed and is capable of generating images in just a small number of steps, like the 2 we used. This makes it significantly faster than FLUX.1 [dev], which typically requires 20 steps or more for image generation. The trade-off for this speed is a somewhat lower image quality compared to FLUX.1 dev.

Lets add some more steps:

{{< terminal title="Running with more steps" >}}
```text
mflux-generate \
--prompt "Luxury food photograph" \
--model dev \
--steps 20 \
--seed 20 \
--height 1024 \
--width 1024
```
{{< /terminal >}}

{{< gallery match="images/03.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

What difference did increase the number of steps to 20 have? Well it now took just over 5 minutes to generate then image, but as you can see the quality is a lot higher.

### Sample FLUX.1 [dev] images

Here are some samples of the same prompts we used for FLUX.1 [schnell], but this time the number of steps was updated to 20 and also the so was the seed.

{{< gallery match="images/dev-samples/*" sortOrder="assc" rowHeight="300" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

I think this is one of the only times I have taxed my M4 (so far) that the fans have kicked in while running the command. I think that FLUX.1 [dev] did a way better job on the first three images than FLUX.1 [schnell], what do you think?

## Adding LoRAs

Now we have FLUX.1 [dev] running we can also add LoRAs:

> LoRAs (Low-Rank Adaptations) for Flux are specialized fine-tuning modules that enhance the capabilities of the Flux image generation model. These adaptations allow users to customize Flux’s output for specific styles, concepts, or characters without retraining the entire model.

In the example below I am using to the following LoRA:

{{< linkpreview "https://huggingface.co/Purz/choose-your-own-adventure" "noimage" >}}

All you need to do it download `purz-cy04-choose_your_own_adventure.safetensors` file and then add the path to your command:

{{< terminal title="Something here" >}}
```text
mflux-generate \
--prompt 'cy04, a book titled "Paths of the Vale". A breathtaking fantasy scene unfolds on the illustrated cover. A lone adventurer clad in a flowing cloak stands at a crossroads surrounded by glowing ethereal pathways that twist and ascend into a star-streaked sky. Each path is lined with unique details: one shimmering with golden light and blooming flowers, another cloaked in shadow with ominous ruins, and a third sparkling with icy frost and towering crystalline spires. In the distance, a mysterious, floating vale hovers, its surface glowing with pulsating, magical runes. The adventurer holds an ancient, glowing compass, its needle spinning wildly, reflecting the uncertainty of the journey ahead.' \
--model dev \
--steps 30 \
--seed 20 \
--height 1024 \
--width 720 \
--lora-paths purz-cy04-choose_your_own_adventure.safetensors
```
{{< /terminal >}}

In this case the LoRA is referenced using `cy04` in your prompt, this gave me the following:

{{< gallery match="images/04.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

As you can see from the prompt, I used a few more steps for this one and adjusted the size to make it more book shaped - the other over you may have noticed is that image above is a little larger than 1024x720. To upscale the image is used [Upscayl](https://upscayl.org).

## Summary

In this post, I’ve explored installing and running FLUX.1 with MFLUX on macOS, demonstrated the differences between the FLUX.1 [Schnell] and [Dev] models, and showcased how LoRAs enhance customization. Whether you’re focused on speed or quality, these tools deliver impressive results on macOS.

For more information on MFLUX see the following GitHub repo:

{{< linkpreview "https://github.com/filipstrand/mflux" >}}