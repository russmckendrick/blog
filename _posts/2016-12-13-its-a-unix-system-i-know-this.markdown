---
author: russmckendrick
comments: true
date: 2016-12-13 09:01:02+00:00
layout: post
link: http://mediaglasses.blog/2016/12/13/its-a-unix-system-i-know-this/
slug: its-a-unix-system-i-know-this
title: It’s a UNIX system, I know this.
wordpress_id: 1077
categories:
- Tech
tags:
- DevOps
- Docker
- Linux
- Mac
- Microsoft
---

I am late to the party with this post due to other [projects](https://media-glass.es/pre-order-docker-data-management-with-flocker-bed7b582e3a) and [work](http://www.node4.co.uk/) taking up nearly all of my time, but its one I have been to write for a while.

Who would have though that after I first wrote about Docker back in early 2014;

[embed]https://media-glass.es/docker-516afc902732[/embed]

that I would be writting a post like this …


### Microsoft SQL Server 2016 on a Mac, using Docker


Given that I don’t use Windows much I thought it would be interesting to see how simple it would be for me to install and use the latest version of MS SQL.

First of all you need to ensure that your Docker installation has at least 4GB of RAM assigned, as I am running Docker for Mac, all that I need to do is open up the Preferences and change the memory to 4GB;
![]({{ site.baseurl }}/assets/posts/630a8-1y4ajnhe08shkdq0jiyrabq.png)
Once you have done that it turns out getting things up and running is really simple, all you have to do is pull the image from the Docker Hub by running;

    
    docker pull microsoft/mssql-server-linux


and then launch it by running the following command;

    
    docker run -itd 
     --name mssql 
     -e 'ACCEPT_EULA=Y' 
     -e 'SA_PASSWORD=P@$w0rd!123' 
     -p 1433:1433 
     microsoft/mssql-server-linux


Thats it, no messing about, just accept the end user agreement and set a secure password.
![]({{ site.baseurl }}/assets/posts/1d5cb-1p8rl7wqptf_nqjof9gypqw.png)
Great, now what? Well Microsoft have helpfully provided a command line client you can install on macOS by running;

    
    npm install -g sql-cli


If you don’t have Node.js install you can install that using Homebrew;

    
    brew install npm


Once installed you should be able to connect to your MSSQL container by running the following;

    
    mssql -s localhost -u sa -p 'P@$w0rd!123' -e


![]({{ site.baseurl }}/assets/posts/3f522-16usc4h74rxy4d8zodyga7w.png)


### Its not just MS SQL, there is .NET Core as well


Its not just Microsoft SQL server, they have been hard at work getting .NET core over to Linux as well, I can remember the days when to get .net running on Linux you had to use something like the long dead Chill!soft ASP or Mono.

Now it is as simple as running;

    
    docker run -it microsoft/dotnet:latest


This will download and launch the latest .NET core container and switch to a session, from there you can run;

    
    mkdir hwapp
    cd hwapp
    dotnet new
    dotnet restore
    dotnet run


To run a simple “Hello World”
![]({{ site.baseurl }}/assets/posts/28ab2-13tsvffwn-ywpb0rrwpnixa.png)


### Visual Studio on macOS and Linux


Add this this that you can also get [an open source version VisualStudio](http://code.visualstudio.com) on macOS & Linux which is actually really stable and not that different from Atom & Sublime Text and all of a sudden building apps in what was once a very (and I mean very) much a traditional Windows only domain is now available to all.
![]({{ site.baseurl }}/assets/posts/bbd28-1nxcnjfx-mla2qdnglsnpng.png)
Now, I wouldn’t say that MSSQL is production ready, but Visual Studio Code is extremely stable and it was recently announced that the open source [.NET core powers C# fucntions in AWS Lambda](https://aws.amazon.com/blogs/compute/announcing-c-sharp-support-for-aws-lambda/).

Following it becoming [a platinum member of the Linux Foundation](https://www.linuxfoundation.org/announcements/microsoft-fortifies-commitment-to-open-source-becomes-linux-foundation-platinum) last month I think Microsoft is going to make 2017 a really interesting year for open source.

I guess that …
![]({{ site.baseurl }}/assets/posts/fd2c9-1fs1tqsak-g0dzn_a-vrjig.png)
… after all.
