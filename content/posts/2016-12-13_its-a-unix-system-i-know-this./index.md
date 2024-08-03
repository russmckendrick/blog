---
title: "It’s a UNIX system, I know this."
description: "Discover Microsoft SQL Server on Mac via Docker, along with .NET Core & Visual Studio. A glimpse into technology's evolving integration."
author: "Russ Mckendrick"
date: 2016-12-13T09:01:02.264Z
lastmod: 2021-07-31T12:34:28+01:00

tags:
 - Docker
 - DevOps

cover:
    image: "/img/2016-12-13_its-a-unix-system-i-know-this._0.png" 
    alt: "Discover Microsoft SQL Server on Mac via Docker, along with .NET Core & Visual Studio. A glimpse into technology's evolving integration."

images:
 - "/img/2016-12-13_its-a-unix-system-i-know-this._0.png"
 - "/img/2016-12-13_its-a-unix-system-i-know-this._1.png"
 - "/img/2016-12-13_its-a-unix-system-i-know-this._2.png"
 - "/img/2016-12-13_its-a-unix-system-i-know-this._3.png"
 - "/img/2016-12-13_its-a-unix-system-i-know-this._4.png"
 - "/img/2016-12-13_its-a-unix-system-i-know-this._5.png"
 - "/img/2016-12-13_its-a-unix-system-i-know-this._6.png"


aliases:
- "/its-a-unix-system-i-know-this-44fa5a1d4b4"

---

I am late to the party with this post due to other [projects](https://media-glass.es/pre-order-docker-data-management-with-flocker-bed7b582e3a) and [work](http://www.node4.co.uk/) taking up nearly all of my time, but its one I have been to write for a while.

Who would have though that after I first wrote about Docker back in early 2014;

[Docker](https://media-glass.es/docker-516afc902732 "https://media-glass.es/docker-516afc902732")

that I would be writting a post like this …

### Microsoft SQL Server 2016 on a Mac, using Docker

Given that I don’t use Windows much I thought it would be interesting to see how simple it would be for me to install and use the latest version of MS SQL.

First of all you need to ensure that your Docker installation has at least 4GB of RAM assigned, as I am running Docker for Mac, all that I need to do is open up the Preferences and change the memory to 4GB;

![graphical user interface](/img/2016-12-13_its-a-unix-system-i-know-this._1.png)

Once you have done that it turns out getting things up and running is really simple, all you have to do is pull the image from the Docker Hub by running;

```
docker pull microsoft/mssql-server-linux
```

and then launch it by running the following command;

```
docker run -itd \
 --name mssql \
 -e 'ACCEPT_EULA=Y' \
 -e 'SA_PASSWORD=P@$$w0rd!123' \
 -p 1433:1433 \
 microsoft/mssql-server-linux
```

Thats it, no messing about, just accept the end user agreement and set a secure password.

![text](/img/2016-12-13_its-a-unix-system-i-know-this._2.png)

Great, now what? Well Microsoft have helpfully provided a command line client you can install on macOS by running;

```
npm install -g sql-cli
```

If you don’t have Node.js install you can install that using Homebrew;

```
brew install npm
```

Once installed you should be able to connect to your MSSQL container by running the following;

```
mssql -s localhost -u sa -p 'P@$$w0rd!123' -e
```

![text](/img/2016-12-13_its-a-unix-system-i-know-this._3.png)

### Its not just MS SQL, there is .NET Core as well

Its not just Microsoft SQL server, they have been hard at work getting .NET core over to Linux as well, I can remember the days when to get .net running on Linux you had to use something like the long dead Chill!soft ASP or Mono.

Now it is as simple as running;

```
docker run -it microsoft/dotnet:latest
```

This will download and launch the latest .NET core container and switch to a session, from there you can run;

```
mkdir hwapp
cd hwapp
dotnet new
dotnet restore
dotnet run
```

To run a simple “Hello World”

![text](/img/2016-12-13_its-a-unix-system-i-know-this._4.png)

### Visual Studio on macOS and Linux

Add this this that you can also get [an open source version VisualStudio](http://code.visualstudio.com) on macOS & Linux which is actually really stable and not that different from Atom & Sublime Text and all of a sudden building apps in what was once a very (and I mean very) much a traditional Windows only domain is now available to all.

![text](/img/2016-12-13_its-a-unix-system-i-know-this._5.png)

Now, I wouldn’t say that MSSQL is production ready, but Visual Studio Code is extremely stable and it was recently announced that the open source [.NET core powers C# fucntions in AWS Lambda](https://aws.amazon.com/blogs/compute/announcing-c-sharp-support-for-aws-lambda/).

Following it becoming [a platinum member of the Linux Foundation](https://www.linuxfoundation.org/press/press-release/microsoft-fortifies-commitment-to-open-source-becomes-linux-foundation-platinum-member) last month I think Microsoft is going to make 2017 a really interesting year for open source.

I guess that …

![logo, company name](/img/2016-12-13_its-a-unix-system-i-know-this._6.png)

… after all.
