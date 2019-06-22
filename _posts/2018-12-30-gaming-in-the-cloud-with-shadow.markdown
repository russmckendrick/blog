---
author: russmckendrick
comments: true
date: 2018-12-30 15:35:42+00:00
excerpt: Is PC gaming in the cloud viable?
layout: post
current: post
class: post-template
cover: assets/posts/hardik-sharma-560353-unsplash.jpg
link: http://mediaglasses.blog/2018/12/30/gaming-in-the-cloud-with-shadow/
slug: gaming-in-the-cloud-with-shadow
title: Gaming in the Cloud with Shadow
wordpress_id: 1707
categories:
- Tech
tags:
- Cloud
- Cloud Computing
- Gaming
- Shadow
---




In a change from my normal technical posts, I thought I would write a little about Shadow, which I signed up for a few weeks ago. 







Game streaming in the cloud is nothing new, I have tried a few services such as OnLive, who had [a drama-filled existence](https://www.theverge.com/2012/8/28/3274739/onlive-report), [PlayStation Now](https://www.playstation.com/en-gb/explore/playstation-now/) and the permanently in beta [GeForce NOW](https://www.nvidia.com/en-gb/geforce/products/geforce-now/) by NVIDIA. One of the things these services have (or had in the case of OnLive) in common is that there is a fixed number of games you can stream, typically you pay a fixed monthly fee and you have access to x amount of games.







After being bombarded by adverts on [Instagram](http://instagram.com/russmckendrick/) I decided to sign up and have a play.

Below, you can see The Witcher 3, running in a window, on macOS !!!

<video autoplay="autoplay" loop="loop" width="768" height="512">
  <source src="/assets/posts/IMG_1197_hd.mp4" type="video/mp4">
</video>

So what was it I signed up for? Well, for a monthly fee of £26.95 will get your own 64bit Windows 10 virtual machine with the following specifications;

  * **CPU**: Intel Xeon with 8 dedicated threads
  * **RAM**: 12GB DDR4
  * **Storage**: 256GB HDD
  * **GPU**: NVIDIA GTX 1080 or equivalent
  * **Network**:  Ultra fast fiber (1Gbps down and 100Mbps up)

You also get free component upgrades, for life. There are clients available for macOS, Windows, Linux, iOS and Android which pretty much covers everything you could need (the Linux and iOS clients are in beta).

At the time of writing, there is a wait time of around 15 days from order to activation. While this doesn't sound very cloud-like watching the video which was in part responsible for the delays (it has had over 2 million views) from [Linus Tech Tips](https://www.youtube.com/user/LinusTechTips) shows why;

{% include embed/youtube.html id="0BQ4bXNdEQI" %}

Around the 3 minute mark in the video, there is an overview of the hardware hosts which each of the Shadow VMs.


Each of the blades is made up of a custom built chassis which houses 16 CPU Cores, 48GB of RAM and either four NVIDIA GTX 1080s or NVIDIA Quattro P5s. Each blade runs a custom version of KVM which helps to pass through one of the graphics cards to the virtual machine. All of this means you are getting quite close to bare metal performance for each of the Shadow VMs.

This very custom approach to building their own hardware rather than just using someone else's setup such as GPU accelerated instances from Amazon Web Services, or Microsoft Azure adds quite an overhead which is why they are [quoting up to 15 days to build each Shadow VM](https://shadow.tech/gben/community/newsuk/activation).

As you can see from the photos below the client works great on macOS, as well as iOS as seen on both the iPad and also iPhone - running No Mans Sky, The Witcher 3, Doom and Dishonoured 2;

![]({{ site.baseurl }}assets/posts/IMG_1303.png)
![]({{ site.baseurl }}assets/posts/IMG_5127.png)
![]({{ site.baseurl }}assets/posts/IMG_6274-1.png)
![]({{ site.baseurl }}assets/posts/IMG_3965-1.png)
![]({{ site.baseurl }}assets/posts/IMG_0080-1.png)
![]({{ site.baseurl }}assets/posts/IMG_2473-1.png)
![]({{ site.baseurl }}assets/posts/IMG_8099.png)

So far lag doesn't appear to be a problem, and given the types of game I play, I don't think it will be much of an issue either. You can see a very poorly shot video below;

<video autoplay="autoplay" loop="loop" width="768" height="512">
  <source src="/assets/posts/IMG_1198_hd.mp4" type="video/mp4">
</video>

The video above was using the 5Ghz WiFi rather than wired. The experience on 4G isn't too bad either;

Oh just playing Witcher 3 on my iPhone

<video autoplay="autoplay" loop="loop" width="768" height="512">
  <source src="/assets/posts/IMG_0008_hd.mp4" type="video/mp4">
</video>


As you get a full Windows 10 experience you have to make sure that the correct graphics card drivers are installed, you can install Steam, download from the Windows store, also, there are Windows updates to contend with;

![]({{ site.baseurl }}assets/posts/screenshot_101-1.png)
![]({{ site.baseurl }}assets/posts/screenshot_102-1.png)
![]({{ site.baseurl }}assets/posts/screenshot_104.png)
![]({{ site.baseurl }}assets/posts/screenshot_099.png)

There have been a few glitches, but nothing terrible, in fact, my only gripe is the controller I am using for iOS, a [SteelSeries Nimbus](https://steelseries.com/gaming-controllers/nimbus), doesn't have a select button or supports clickable Analog sticks, though is more the fault of Apples APIs than the controller.

You can find more details on Shadow at [http://shadow.tech/](http://shadow.tech/). If you decide to sign-up use the referral code **RUSZWJDR**  and you will get £10 off your first month, and that is on top of any offers they are running. You can run a speed test to see what your ping and flutter is like to the Shadows Paris data centre, which is where all UK orders are hosted, at [http://speedtest.shadow.guru/](http://speedtest.shadow.guru/).

Finally, it is worth reading through their FAQ which can be found [here](https://shadow.tech/gben/faq/).

So in all, really impressive stuff, it looks like the promise of the streaming services from way back when is finally coming true, gaming in the cloud has actually arrived and works !!!

Oh, and having a full Windows 10 desktop accessible on all your devices is a really useful bonus.