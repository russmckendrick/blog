---
title: "Playing with Aider Chat"
author: "Russ McKendrick"
date: 2023-07-15T13:01:41+01:00
description: "I had some time so decided to have a play with a new tool called Aider Chat, which allows you to write and edit code with OpenAI’s GPT models."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "ai"
  - "code"
---

I had some time, so I thought I would take a look at [Aider Chat](https://aider.chat),  Aidir Chat is described by its authors as;

> aider is a command-line chat tool that allows you to write and edit code with OpenAI’s GPT models. You can ask GPT to help you start a new project, or modify code in your existing git repo. Aider makes it easy to git commit, diff & undo changes proposed by GPT without copy/pasting. It also has features that [help GPT-4 understand and modify larger codebases](https://aider.chat/docs/ctags.html).

{{< notice info >}}
As you may know from reading other blog posts, I am a macOS user, so the commands in this post will cover macOS only.
{{< /notice >}}

Installing Aider Chat is a simple process which involves running two commands, the first installs Aider Chat;

{{< terminal title="Installing Aider Chat" >}}
``` terminfo
$ pip3 install aider-chat
```
{{< /terminal >}}

The second command installs the [Universal Ctags](https://github.com/universal-ctags/ctags) package using [Homebrew](https://brew.sh/);

{{< terminal title="Installing universal-ctags" >}}
``` terminfo
$ brew install universal-ctags
```
{{< /terminal >}}

Before running Aider Chat, you need to provide a valid OpenAI API key. To do this, you can export it as an environment variable by running the following;

{{< terminal title="Exporting your OpenAI API key" >}}
``` terminfo
$ export OPENAI_API_KEY=sk-test1234567890abcdef0123456789
```
{{< /terminal >}}

This will be valid for the life of your terminal session, or you can add it to a  config file which is stored at `~/.aider.conf.yml` by running the command which follows;

{{< terminal title="Creating the ~/.aider.conf.yml file" >}}
``` terminfo
$ echo "openai-api-key: sk-test1234567890abcdef0123456789" > ~/.aider.conf.yml
```
{{< /terminal >}}

Now we have everything installed and configured lets dive straight in and create a project, to do this create a new folder and initiate a chat by running the commands below;

{{< terminal title="Creating the ~/.aider.conf.yml file" >}}
``` terminfo
mkdir aider-blog-post
aider ./
```
{{< /terminal >}}

This will show you something like the following output;

{{< terminal title="Creating the ~/.aider.conf.yml file" >}}
``` terminfo
No git repo found, create one to track GPT's changes (recommended)? y
Git repository created in the current working directory.
Model: gpt-4
Git repo: .git
Repo-map: universal-ctags using 1024 tokens
Use /help to see in-chat commands.
```
{{< /terminal >}}

From here, we can start asking questions;

{{< notice tip "Russ" >}}
Write a basic Snake game using Python and Pygame, it should have the following …
- Have splash screen
- Use the Arrow keys to control the snake
- Each time the snake eats an apple, it should get faster
- Use Emjois for the graphics where possible
- Call the game file main.py and create a requirements.txt containing the requirements needed
{{< /notice >}}

This is what Aider had to say (please note, I have removed the code blocks for readability);

{{< notice note "Aider" >}}
Sure, I can help you with that. Here's a basic structure of how the game could be implemented. 

First, let's create the `requirements.txt` file

Now, let's create the `main.py` file

Please note that this is a basic implementation of the game. You may need to add more features or modify the existing ones to suit your needs. Also, the use of emojis in Pygame is not straightforward and may require additional libraries or a different approach.

> Allow creation of new file new_file/requirements.txt? y  
> Add new_file/requirements.txt to git? y  
> Allow creation of new file new_file/main.py? y  
> Add new_file/main.py to git? y  
> Applied edit to new_file/main.py  
> Applied edit to new_file/requirements.txt  
> Commit e7ef909 aider: Imported the necessary libraries and defined the main game loop, start screen, game over screen, and helper functions.
{{< /notice >}}

I then tried to run the code, and got an error - lets give Aider the error;

{{< notice tip "Russ" >}}
name 'DARKGREEN' is not defined 
{{< /notice >}}

To which I got the following response;

{{< notice note "Aider" >}}
It seems like the color `DARKGREEN` is not defined in your code. Let's add it to the color definitions in your `main.py` file.

This will define `DARKGREEN` as a darker shade of green. You can adjust the RGB values as needed to get the exact color you want.

> Applied edit to new_file/main.py  
> Commit 06f2242 aider: Added DARKGREEN as a darker shade of green to the color definitions in main.py.  
{{< /notice >}}

There were some other complaints about the code, after pasting the code in I decided to ask it something else;

{{< notice tip "Russ" >}}
 More errors about colors, can you read through the code and name sure they are all correctly defined, the last error was "NameError: name 'DARKGRAY' is not defined. Did you mean: 'DARKGREEN'?"
{{< /notice >}}

This did the trick, not only did Aider address the issue, but also checked the entire code for other missing elements;

{{< notice note "Aider" >}}
Sure, I can help with that. It seems like the color `DARKGRAY` is not defined in your code. Let's add it to the color definitions in your `main.py` file.

This will define `DARKGRAY` as a dark shade of gray. You can adjust the RGB values as needed to get the exact color you want.

Also, I noticed that there are some other variables like `FPS` and `SNAKESPEED` that are not defined in your code. Let's add them as well.

This will define `FPS` and `SNAKESPEED` as 15. You can adjust these values as needed to get the desired game speed.

> Applied edit to new_file/main.py  
> Commit 00f2451 aider: Added color `DARKGRAY` and constants `FPS` and `SNAKESPEED` to `main.py`.  
{{< /notice >}}

There was some more errors, this time around missing functions and some of the game logic - after about 10 minutes back and forth with Aider, I had a working game.

{{< notice tip "Russ" >}}
Check the new_file/main.py file for any other missing functions
{{< /notice >}}

Again, Aider was able to help;

{{< notice note "Aider" >}}
Sure, I can help with that. Looking at your code, it seems like the functions `drawApple` and `drawScore` are being called but they are not defined in your code. 

Let's add basic definitions for these functions in your `main.py` file.

The `drawApple` function draws the apple on the game screen by drawing a red rectangle at the apple's coordinates. The `drawScore` function displays the current score on the game screen. You can adjust the color and the size of the apple and the score display as needed.

> Applied edit to new_file/main.py  
> Commit 9d50b5a aider: Added missing functions `drawApple` and `drawScore` to `main.py`.  
{{< /notice >}}

This time everything worked as expected and we have a mostly functional game as you can see from the following screens;

{{< gallery match="images/*" sortOrder="assc" rowHeight="250" margins="5" previewType="blur" embedPreview=true loadJQuery=true >}}

The game code is below, it is untouched from what Aider Chat created and as you can see, functionality wise is a little hit and miss, but it well commented and easy to follow;

{{< terminal title="main.py" >}}
``` python
import pygame
import sys
import time
import random
import emoji
from pygame.locals import *

# set up some constants
WINDOWWIDTH = 800
WINDOWHEIGHT = 600
CELLSIZE = 20
FPS = 15
SNAKESPEED = 15

# calculate cell width and height
CELLWIDTH = int(WINDOWWIDTH / CELLSIZE)
CELLHEIGHT = int(WINDOWHEIGHT / CELLSIZE)

# set up the colours
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
DARKGREEN = (0, 100, 0)
DARKGRAY = (40, 40, 40)
BGCOLOR = (0, 0, 0) # Black background

# set up the direction variables
UP = 'up'
DOWN = 'down'
LEFT = 'left'
RIGHT = 'right'
HEAD = 0 # index of the snake's head

def main():
    global FPSCLOCK, DISPLAYSURF, BASICFONT

    pygame.init()
    FPSCLOCK = pygame.time.Clock()
    DISPLAYSURF = pygame.display.set_mode((WINDOWWIDTH, WINDOWHEIGHT))
    BASICFONT = pygame.font.Font('freesansbold.ttf', 18)
    pygame.display.set_caption('Snake Game')

    showStartScreen()
    while True:
        runGame()
        showGameOverScreen()

def runGame():
    # Set a random start point.
    startx = random.randint(5, CELLWIDTH - 6)
    starty = random.randint(5, CELLHEIGHT - 6)
    wormCoords = [{'x': startx, 'y': starty},
                  {'x': startx - 1, 'y': starty},
                  {'x': startx - 2, 'y': starty}]
    direction = RIGHT

    # Start the apple in a random place.
    apple = getRandomLocation()

    while True: # main game loop
        for event in pygame.event.get(): # event handling loop
            if event.type == QUIT:
                terminate()
            elif event.type == KEYDOWN:
                if (event.key == K_UP or event.key == K_w) and direction != DOWN:
                    direction = UP
                elif (event.key == K_DOWN or event.key == K_s) and direction != UP:
                    direction = DOWN
                elif (event.key == K_LEFT or event.key == K_a) and direction != RIGHT:
                    direction = LEFT
                elif (event.key == K_RIGHT or event.key == K_d) and direction != LEFT:
                    direction = RIGHT
                elif event.key == K_ESCAPE:
                    terminate()

        # check if the Snake has hit itself or the edge
        if wormCoords[HEAD]['x'] == -1 or wormCoords[HEAD]['x'] == CELLWIDTH or wormCoords[HEAD]['y'] == -1 or wormCoords[HEAD]['y'] == CELLHEIGHT:
            return # game over
        for wormBody in wormCoords[1:]:
            if wormBody['x'] == wormCoords[HEAD]['x'] and wormBody['y'] == wormCoords[HEAD]['y']:
                return # game over

        # check if Snake has eaten an apply
        if wormCoords[HEAD]['x'] == apple['x'] and wormCoords[HEAD]['y'] == apple['y']:
            # don't remove worm's tail segment
            apple = getRandomLocation() # set a new apple somewhere
        else:
            del wormCoords[-1] # remove worm's tail segment

        # move the worm by adding a segment in the direction it is moving
        if direction == UP:
            newHead = {'x': wormCoords[HEAD]['x'], 'y': wormCoords[HEAD]['y'] - 1}
        elif direction == DOWN:
            newHead = {'x': wormCoords[HEAD]['x'], 'y': wormCoords[HEAD]['y'] + 1}
        elif direction == LEFT:
            newHead = {'x': wormCoords[HEAD]['x'] - 1, 'y': wormCoords[HEAD]['y']}
        elif direction == RIGHT:
            newHead = {'x': wormCoords[HEAD]['x'] + 1, 'y': wormCoords[HEAD]['y']}
        wormCoords.insert(0, newHead)
        DISPLAYSURF.fill(BGCOLOR)
        drawGrid()
        drawWorm(wormCoords)
        drawApple(apple)
        drawScore(len(wormCoords) - 3)
        pygame.display.update()
        FPSCLOCK.tick(SNAKESPEED)

def drawPressKeyMsg():
    pressKeySurf = BASICFONT.render('Press a key to play.', True, DARKGRAY)
    pressKeyRect = pressKeySurf.get_rect()
    pressKeyRect.topleft = (WINDOWWIDTH - 200, WINDOWHEIGHT - 30)
    DISPLAYSURF.blit(pressKeySurf, pressKeyRect)

def checkForKeyPress():
    if len(pygame.event.get(QUIT)) > 0:
        terminate()
    keyUpEvents = pygame.event.get(KEYUP)
    if len(keyUpEvents) == 0:
        return None
    if keyUpEvents[0].key == K_ESCAPE:
        terminate()
    return keyUpEvents[0].key

def showStartScreen():
    titleFont = pygame.font.Font('freesansbold.ttf', 100)
    titleSurf1 = titleFont.render('Snake Game!', True, WHITE, DARKGREEN)
    degrees1 = 0
    degrees2 = 0
    while True:
        DISPLAYSURF.fill(BGCOLOR)
        rotatedSurf1 = pygame.transform.rotate(titleSurf1, degrees1)
        rotatedRect1 = rotatedSurf1.get_rect()
        rotatedRect1.center = (WINDOWWIDTH / 2, WINDOWHEIGHT / 2)
        DISPLAYSURF.blit(rotatedSurf1, rotatedRect1)

        drawPressKeyMsg()

        if checkForKeyPress():
            pygame.event.get() # clear event queue
            return
        pygame.display.update()
        FPSCLOCK.tick(FPS)
        degrees1 += 3 # rotate by 3 degrees each frame
        degrees2 += 7 # rotate by 7 degrees each frame

def terminate():
    pygame.quit()
    sys.exit()

def getRandomLocation():
    return {'x': random.randint(0, CELLWIDTH - 1), 'y': random.randint(0, CELLHEIGHT - 1)}

def drawGrid():
    for x in range(0, WINDOWWIDTH, CELLSIZE): # draw vertical lines
        pygame.draw.line(DISPLAYSURF, DARKGRAY, (x, 0), (x, WINDOWHEIGHT))
    for y in range(0, WINDOWHEIGHT, CELLSIZE): # draw horizontal lines
        pygame.draw.line(DISPLAYSURF, DARKGRAY, (0, y), (WINDOWWIDTH, y))

def drawWorm(wormCoords):
    for coord in wormCoords:
        x = coord['x'] * CELLSIZE
        y = coord['y'] * CELLSIZE
        wormSegmentRect = pygame.Rect(x, y, CELLSIZE, CELLSIZE)
        pygame.draw.rect(DISPLAYSURF, DARKGREEN, wormSegmentRect)
        wormInnerSegmentRect = pygame.Rect(x + 4, y + 4, CELLSIZE - 8, CELLSIZE - 8)
        pygame.draw.rect(DISPLAYSURF, GREEN, wormInnerSegmentRect)

def drawApple(coord):
    x = coord['x'] * CELLSIZE
    y = coord['y'] * CELLSIZE
    appleRect = pygame.Rect(x, y, CELLSIZE, CELLSIZE)
    pygame.draw.rect(DISPLAYSURF, RED, appleRect)

def drawScore(score):
    scoreSurf = BASICFONT.render('Score: %s' % (score), True, WHITE)
    scoreRect = scoreSurf.get_rect()
    scoreRect.topleft = (WINDOWWIDTH - 120, 10)
    DISPLAYSURF.blit(scoreSurf, scoreRect)

def showGameOverScreen():
    gameOverFont = pygame.font.Font('freesansbold.ttf', 150)
    gameSurf = gameOverFont.render('Game', True, WHITE)
    overSurf = gameOverFont.render('Over', True, WHITE)
    gameRect = gameSurf.get_rect()
    overRect = overSurf.get_rect()
    gameRect.midtop = (WINDOWWIDTH / 2, 10)
    overRect.midtop = (WINDOWWIDTH / 2, gameRect.height + 10 + 25)

    DISPLAYSURF.blit(gameSurf, gameRect)
    DISPLAYSURF.blit(overSurf, overRect)
    drawPressKeyMsg()
    pygame.display.update()
    pygame.time.wait(500)
    checkForKeyPress() # clear out any key presses in the event queue

    while True:
        if checkForKeyPress():
            pygame.event.get() # clear event queue
            return

if __name__ == '__main__':
    main()

```
{{< /terminal >}}

As you can see Aider is is simple to use and I suspect is way more powerful than I have shown here, I am going to spend some more time playing with it and see what else it can do.

If you want to learn more about Aider Chat, you can more examples [here](https://aider.chat/examples/README.html) and a GitHub repo containing the code and full chat history I generated for this post [here](https://github.com/russmckendrick/aider-blog-post).