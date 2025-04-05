---
title: "Docker Desktop Alternatives for macOS"
description: "Explore Docker Desktop alternatives for macOS: Lima, Rancher Desktop, and Minikube offer containerization and Kubernetes clustering solutions."
author: "Russ McKendrick"
date: "2021-09-05T10:29:51+01:00"
tags:
  - "Docker"
  - "macOS"
  - "Containers"
  - "Kubernetes"
cover:
  image: "cover.png"
  relative: true
  alt: "Explore Docker Desktop alternatives for macOS: Lima, Rancher Desktop, and Minikube offer containerization and Kubernetes clustering solutions."
draft: false
showToc: true
---

After the news earlier this week that Docker will be introducing charges to the Docker Subscription Service Agreement, as detailed in the Tweet below:

{{< center >}}{{< x user=russmckendrick id=1432739340266913797 >}}{{< /center >}}

I started to think about looking at alternatives, while I use Docker Desktop I did not use it enough to warrant looking at one of the new subscriptions. There are two main reasons to run Docker Desktop

- Running containers on an operating system where containers can't run natively
- Its built-in Kubernetes clustering is very convenient

Below are three tools which each try and solve one of those two points.

## Lima

[Lima](https://github.com/lima-vm/lima) had been on my list of things of things to look at for about a month, as I had seen it mentioned in a few places, the projects GitHub page describes it as follows:

> Lima launches Linux virtual machines with automatic file sharing, port forwarding, and containerd. It can be considered as a some sort of unofficial "macOS subsystem for Linux", or "containerd for Mac".

As you can see this replaces Docker with [containerd](https://containerd.io), it also replaces the `docker` command with [`nerdctl`](https://github.com/containerd/nerdctl) which promises to be a Docker-compatible CLI for containerd.

### Installing Lima

Lima is available on [Homebrew](http://brew.sh) so installing it is really easy, just run the two commands below to install it and then start the Virtual Machine ...

{{< terminal title="Installing and starting Lima" >}}
``` awk
brew install lima
limactl start
```
{{< /terminal >}}

... when starting the Virtual Machine I opted to keep the default settings which uses Ubuntu as its base, the output of the `limactl start` command is below ...

{{< terminal title="Output" >}}
``` plaintext
? Creating an instance "default" Proceed with the default configuration
INFO[0007] Downloading "https://github.com/containerd/nerdctl/releases/download/v0.11.1/nerdctl-full-0.11.1-linux-amd64.tar.gz" (sha256:ce7a6e119b03c3fb8ded3d46d929962fd17417bea1d5bbc07e0fce49494d8a09)
172.67 MiB / 172.67 MiB [----------------------------------] 100.00% 62.32 MiB/s
INFO[0011] Downloaded "nerdctl-full-0.11.1-linux-amd64.tar.gz"
INFO[0012] Attempting to download the image from "~/Downloads/hirsute-server-cloudimg-amd64.img"
INFO[0012] Attempting to download the image from "https://cloud-images.ubuntu.com/hirsute/current/hirsute-server-cloudimg-amd64.img"
554.25 MiB / 554.25 MiB [----------------------------------] 100.00% 37.21 MiB/s
INFO[0028] Downloaded image from "https://cloud-images.ubuntu.com/hirsute/current/hirsute-server-cloudimg-amd64.img"
INFO[0030] [hostagent] Starting QEMU (hint: to watch the boot progress, see "/Users/russ.mckendrick/.lima/default/serial.log")
INFO[0030] SSH Local Port: 60022
INFO[0030] [hostagent] Waiting for the essential requirement 1 of 4: "ssh"
INFO[0040] [hostagent] Waiting for the essential requirement 1 of 4: "ssh"
INFO[0059] [hostagent] The essential requirement 1 of 4 is satisfied
INFO[0059] [hostagent] Waiting for the essential requirement 2 of 4: "sshfs binary to be installed"
INFO[0068] [hostagent] The essential requirement 2 of 4 is satisfied
INFO[0068] [hostagent] Waiting for the essential requirement 3 of 4: "/etc/fuse.conf to contain \"user_allow_other\""
INFO[0083] [hostagent] The essential requirement 3 of 4 is satisfied
INFO[0083] [hostagent] Waiting for the essential requirement 4 of 4: "the guest agent to be running"
INFO[0083] [hostagent] The essential requirement 4 of 4 is satisfied
INFO[0083] [hostagent] Mounting "/Users/russ.mckendrick"
INFO[0083] [hostagent] Mounting "/tmp/lima"
INFO[0083] [hostagent] Waiting for the optional requirement 1 of 2: "systemd must be available"
INFO[0083] [hostagent] Forwarding "/run/user/501/lima-guestagent.sock" (guest) to "/Users/russ.mckendrick/.lima/default/ga.sock" (host)
INFO[0083] [hostagent] The optional requirement 1 of 2 is satisfied
INFO[0083] [hostagent] Waiting for the optional requirement 2 of 2: "containerd binaries to be installed"
INFO[0083] [hostagent] Not forwarding TCP 127.0.0.53:53
INFO[0083] [hostagent] Not forwarding TCP 0.0.0.0:22
INFO[0083] [hostagent] Not forwarding TCP [::]:22
INFO[0084] [hostagent] The optional requirement 2 of 2 is satisfied
INFO[0084] READY. Run `lima` to open the shell.
```
{{< /terminal >}}

From here you can prefix any command you want to be run within the Linux Virtual machine with `lima` so running the following ...

{{< terminal title="uname -a" >}}
``` awk
lima uname -a
```
{{< /terminal >}}

... returns the following output ...

{{< terminal title="Output" >}}
``` plaintext
Linux lima-default 5.11.0-31-generic #33-Ubuntu SMP Wed Aug 11 13:19:04 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
```
{{< /terminal >}}

Lets now take a look at running a container.

### Running a container

Any good Docker introduction will always have you running the [hello-world](https://hub.docker.com/_/hello-world) container, so that seems like a good place to start. To run the container the following command ...

{{< terminal title="Running the Docker hello-world" >}}
``` awk
lima nerdctl container run hello-world
```
{{< /terminal >}}

... this gives the following output ...

{{< terminal title="Output" >}}
``` plaintext
docker.io/library/hello-world:latest:                                             resolved       |++++++++++++++++++++++++++++++++++++++|
index-sha256:7d91b69e04a9029b99f3585aaaccae2baa80bcf318f4a5d2165a9898cd2dc0a1:    done           |++++++++++++++++++++++++++++++++++++++|
manifest-sha256:1b26826f602946860c279fce658f31050cff2c596583af237d971f4629b57792: done           |++++++++++++++++++++++++++++++++++++++|
config-sha256:d1165f2212346b2bab48cb01c1e39ee8ad1be46b87873d9ca7a4e434980a7726:   done           |++++++++++++++++++++++++++++++++++++++|
layer-sha256:b8dfde127a2919ff59ad3fd4a0776de178a555a76fff77a506e128aea3ed41e3:    done           |++++++++++++++++++++++++++++++++++++++|
elapsed: 1.9 s                                                                    total:  4.5 Ki (2.3 KiB/s)

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
 ```
{{< /terminal >}}

... success 🥳, we have pulled and download our first image using `nerdctl` and containerd.

### Building and working with containers

For this I took one of the examples from [Mastering Docker (Fourth Edition)](https://www.packtpub.com/product/mastering-docker-fourth-edition/9781839216572) which installs NGINX and deploys a simple static HTML file, the `Dockerfile` for this is below, however if you want to follow along you will need all the files which can be found at [russmckendrick/lima-dockerfile-example](https://github.com/russmckendrick/lima-dockerfile-example):

{{< terminal title="The Dockerfile" >}}
``` dockerfile
FROM alpine:latest
LABEL maintainer="Russ McKendrick <russ@mckendrick.io>"
LABEL description="This example Dockerfile installs NGINX."
RUN apk add --update nginx && \
        rm -rf /var/cache/apk/* && \
        mkdir -p /tmp/nginx/

COPY files/nginx.conf /etc/nginx/nginx.conf
COPY files/default.conf /etc/nginx/conf.d/default.conf
ADD files/html.tar.gz /usr/share/nginx/

EXPOSE 80/tcp

ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
```
{{< /terminal >}}

To build all you need to is change your current directory to the folder containing the `Dockerfile` and run the following command:

{{< terminal title="Running the Docker hello-world" >}}
``` awk
lima nerdctl image build --tag local:lima-example .
```
{{< /terminal >}}

You should see something which looks like the following output:

{{< terminal title="Output" >}}
``` plaintext
[+] Building 3.8s (10/10) FINISHED
 => [internal] load build definition from Dockerfile                                           0.1s
 => => transferring dockerfile: 474B                                                           0.0s
 => [internal] load .dockerignore                                                              0.0s
 => => transferring context: 2B                                                                0.0s
 => [internal] load metadata for docker.io/library/alpine:latest                               1.7s
 => [1/5] FROM docker.io/library/alpine:latest@sha256:e1c082e3d3c45cccac829840a25941e679c25d4  0.4s
 => => resolve docker.io/library/alpine:latest@sha256:e1c082e3d3c45cccac829840a25941e679c25d4  0.0s
 => => sha256:a0d0a0d46f8b52473982a3c466318f479767577551a53ffc9074c9fa7035982 2.81MB / 2.81MB  0.2s
 => => extracting sha256:a0d0a0d46f8b52473982a3c466318f479767577551a53ffc9074c9fa7035982e      0.1s
 => [internal] load build context                                                              0.0s
 => => transferring context: 59.58kB                                                           0.0s
 => [2/5] RUN apk add --update nginx &&         rm -rf /var/cache/apk/* &&         mkdir -p /  1.1s
 => [3/5] COPY files/nginx.conf /etc/nginx/nginx.conf                                          0.0s
 => [4/5] COPY files/default.conf /etc/nginx/conf.d/default.conf                               0.0s
 => [5/5] ADD files/html.tar.gz /usr/share/nginx/                                              0.1s
 => exporting to oci image format                                                              0.4s
 => => exporting layers                                                                        0.2s
 => => exporting manifest sha256:1b8d360cd195595bca09b64ad110ea31ca793d33a220fdd49b78a58ca6c2  0.0s
 => => exporting config sha256:ee2c8c52cc0fc3892d8b7538306a5e630d47e82cb07df57fb5b71b44c1b241  0.0s
 => => sending tarball                                                                         0.1s
unpacking docker.io/library/local:lima-example (sha256:1b8d360cd195595bca09b64ad110ea31ca793d33a220fdd49b78a58ca6c2f968)...done
unpacking fuse-overlayfs@sha256:1b8d360cd195595bca09b64ad110ea31ca793d33a220fdd49b78a58ca6c2f968 (sha256:1b8d360cd195595bca09b64ad110ea31ca793d33a220fdd49b78a58ca6c2f968)...done
```
{{< /terminal >}}

Now that we have our custom NGINX image, let's launch it by running:

{{< terminal title="Running a container from our image" >}}
``` awk
lima nerdctl container run -d --name lima-example -p 8080:80 local:lima-example
```
{{< /terminal >}}

Finally, going to [http://localhost:8080/](http://localhost:8080/) should show you the following page:

{{< img src="images/01.png" alt="We're no strangers to love, You know the rules and so do I" >}}

Now you might be thinking to yourself "Big deal, thats what I would have expected to have seen 🤷" and that is really a testament to what the developers have done, to get you into the the position where you can simply change folders on your local machine run a command and have your local folder mounted as the context within the Linux Virtual Machine means that they had to add some very complicated "stuff" in the background to enable both the mounting and also exposing the container port so it is bound to your local machine and not the Linux Virtual Machine itself.

Also, the syntax for other common `docker` commands it pretty much the same, as you can see below - we are listing all containers:

{{< terminal title="List all containers" >}}
``` plaintext
$ lima nerdctl container ls -a
CONTAINER ID    IMAGE                                   COMMAND                   CREATED           STATUS                       PORTS                   NAMES
0cd4757d4af0    docker.io/library/local:lima-example    "nginx -g daemon off;"    8 minutes ago     Up                           0.0.0.0:8080->80/tcp    lima-example
5181bb58d69a    docker.io/library/hello-world:latest    "/hello"                  10 seconds ago    Exited (0) 10 seconds ago
```
{{< /terminal >}}

Here we are listing the images:

{{< terminal title="List all images" >}}
``` plaintext
$ lima nerdctl image ls
REPOSITORY     TAG             IMAGE ID        CREATED               SIZE
hello-world    latest          7d91b69e04a9    About a minute ago    20.0 KiB
local          lima-example    47ad7ea849a6    10 minutes ago        7.8 MiB
```
{{< /terminal >}}

Finally, stop and remove the NGINX container:

{{< terminal title="Stop and remove NGINX container" >}}
``` awk
lima nerdctl container stop lima-example
lima nerdctl container rm lima-example
```
{{< /terminal >}}

There is one more thing though ...

### Tidying up

As the `limactl start` command basically launched a full Ubuntu Linux Virtual machine on your host machine you probably don't want that running all of the time so the following commands will stop and also you can remove the VM:

{{< notice warning >}}
**Please Note** running the "limactl remove" command will delete the virtual machine loosing any customization you have done along with any data you have explicitly stored on the virtual machine itself
{{< /notice >}}

{{< terminal title="Stop and remove Lima VM" >}}
``` awk
limactl stop
limactl remove default
```
{{< /terminal >}}


## Rancher Desktop

While watching "AzUpdate S03E05" [@TheAprilEdwards](https://twitter.com/TheAprilEdwards) mentioned [Rancher Desktop](https://rancherdesktop.io), you can find the full episode below:

{{< youtube R4kVNtVwMmo >}}<br>

Up until that point I hadn't heard of Rancher Desktop, so lets take a quick look at it.

### Installing Rancher Desktop

Rancher Desktop is very new, its first first release was May and it is still a very early alpha, because of this there is no Homebrew installer for it (just yet) so to install you will have to goto [the projects GitHub release page](https://github.com/rancher-sandbox/rancher-desktop/releases) and down the dmg file, once download mount it and then drag the application to your Applications folder.

Open the application and then give it about 5 minutes.

{{< notice tip >}}
There is are a few issues in Rancher Desktop 0.4.1 which stopped me from using the latest version, I ended up having to run the 0.3.0.
{{< /notice >}}

Once launched you should see something similar to the following screen:

{{< img src="images/02.png" alt="General" >}}

The other options look like the following (click to zoom):

{{< oldgallery >}}
{{< img src="images/03.png" alt="Kubernetes Settings" >}}
{{< img src="images/04.png" alt="Port Forwarding" >}}
{{< img src="images/05.png" alt="Images" >}}
{{< img src="images/06.png" alt="Troubleshooting" >}}
{{< /oldgallery >}}

### Using Rancher Desktop

Once up and running, Rancher Desktop is no real different from any Kubernetes installation, drop to the command line and use `kubectl`, for example running:

{{< terminal title="List the nodes" >}}
``` awk
kubectl get nodes
```
{{< /terminal >}}

Will show something like:

{{< terminal title="Output" >}}
``` plaintext
NAME      STATUS   ROLES            AGE     VERSION
default   Ready    builder,master   8m57s   v1.19.11+k3s1
```
{{< /terminal >}}


{{< terminal title="Install a helm chart" >}}
``` awk
helm repo add opsmx https://helmcharts.opsmx.com/
helm install my-hello-kubernetes opsmx/hello-kubernetes --version 1.0.3  --set service.type=ClusterIP
```
{{< /terminal >}}

I could go on, but Rancher Desktop is very alpha and I ended up having to mess about a lot to get things running.

{{< notice info >}}
Make sure you quit the desktop app from the menu bar and don't just close the window otherwise Rancher Desktop will remain running in the background.
{{< /notice >}}

## Minikube

Minikube has been around a longtime and while it does not have a Desktop front-end it remains more than capable to run your Kubernetes workload locally.

### Installing Minikube

{{< terminal title="Install a minikube, kubectl and helm" >}}
``` awk
brew install minikube kubectl helm
minikube start
```
{{< /terminal >}}

You should then see some like the following output:

{{< terminal title="Output" >}}
``` plaintext
😄  minikube v1.23.0 on Darwin 11.5.2
✨  Automatically selected the hyperkit driver. Other choices: virtualbox, ssh
💾  Downloading driver docker-machine-driver-hyperkit:
    > docker-machine-driver-hyper...: 65 B / 65 B [----------] 100.00% ? p/s 0s
    > docker-machine-driver-hyper...: 10.52 MiB / 10.52 MiB  100.00% ? p/s 100m
🔑  The 'hyperkit' driver requires elevated permissions. The following commands will be executed:

    $ sudo chown root:wheel /Users/russ.mckendrick/.minikube/bin/docker-machine-driver-hyperkit
    $ sudo chmod u+s /Users/russ.mckendrick/.minikube/bin/docker-machine-driver-hyperkit

💿  Downloading VM boot image ...
    > minikube-v1.23.0.iso.sha256: 65 B / 65 B [-------------] 100.00% ? p/s 0s
    > minikube-v1.23.0.iso: 229.15 MiB / 229.15 MiB  100.00% 68.60 MiB p/s 3.5s
👍  Starting control plane node minikube in cluster minikube
💾  Downloading Kubernetes v1.22.1 preload ...
    > preloaded-images-k8s-v12-v1...: 515.04 MiB / 515.04 MiB  100.00% 61.30 Mi
🔥  Creating hyperkit VM (CPUs=2, Memory=4000MB, Disk=20000MB) ...
🐳  Preparing Kubernetes v1.22.1 on Docker 20.10.8 ...
    ▪ Generating certificates and keys ...
    ▪ Booting up control plane ...
    ▪ Configuring RBAC rules ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```
{{< /terminal >}}

### Using Minikube

Once Minikube is up and running you should be able to interact with it using `kubectl` and `helm` for example running:

{{< terminal title="List the nodes" >}}
``` awk
kubectl get nodes
```
{{< /terminal >}}

Gives the following:

{{< terminal title="Output" >}}
``` plaintext
NAME       STATUS   ROLES                  AGE   VERSION
minikube   Ready    control-plane,master   17m   v1.22.1
```
{{< /terminal >}}

You can also install a Helm chart using:

{{< terminal title="Install a helm chart" >}}
``` awk
helm repo add opsmx https://helmcharts.opsmx.com/
helm install my-hello-kubernetes opsmx/hello-kubernetes --version 1.0.3  --set service.type=ClusterIP
```
{{< /terminal >}}

Once you have the application up and running you can run the following command to open a tunnel to your cluster:

{{< terminal title="Open a tunnel to the cluster" >}}
``` awk
minikube tunnel
```
{{< /terminal >}}

The `minikube tunnel` command needs to run in the foreground so open a new terminal window and run the following command:

{{< terminal title="" >}}
``` awk
kubectl get service hello-kubernetes-my-hello-kubernetes
```
{{< /terminal >}}

For me this returned the following:

{{< terminal title="Output" >}}
``` plaintext
NAME                                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
hello-kubernetes-my-hello-kubernetes   ClusterIP   10.105.108.88   <none>        80/TCP    15m
```
{{< /terminal >}}

Make a copy of the `CLUSTER-IP` and enter into your browser, e.g. `http://10.105.108.88` and you should be presented with the following:

{{< img src="images/07.png" alt="K8s Hello World" >}}

### Tidying up

Like Lima, Minikube will continue to run in the background until it is stopped, which you can do by running:

{{< terminal title="Stopping" >}}
```
minikube stop
✋  Stopping node "minikube"  ...
🛑  1 nodes stopped.
```
{{< /terminal >}}

You can also run the following command to delete the virtual machine running Minikube so that you start with a clean image when you next run `minikube start`

{{< notice warning >}}
Running the command below will immediately delete you Minikube VM, there are no prompts so please make sure that really want to delete the VM before running !!!
{{< /notice >}}

{{< terminal title="Deleting" >}}
```
minikube delete
🔥  Deleting "minikube" in hyperkit ...
💀  Removed all traces of the "minikube" cluster.
```
{{< /terminal >}}

## Summary

Two of the three tools covered here are very new, Lima and Rancher Desktop have only been publicly available since May 2021. Rancher Desktop is also actually in the middle of moving to use Lima as its backend in version v0.4 (which is also the version I had problems with) so should considered extremely alpha. However, it is well worth keeping a close eye on as K3s, the backend tool used to the Kubernetes cluster, is very stable so the Desktop wrapper for this should quickly catchup with any luck.

Lima on the other hand is a great replacement for Docker Desktop - it has quite close feature parity and moves to using 100% open source components.

Finally, Minikube has always been a great alternative to running a single node CNCF compliant Kubernetes cluster rather than the Kubernetes clustering built into Docker Desktop and it remains so.

It is going to be an interesting few months ahead as both Lima and Rancher Desktop ramp up their development and interest in the projects grow following Dockers announcement.
