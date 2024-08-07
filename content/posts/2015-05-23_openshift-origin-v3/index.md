---
title: "OpenShift Origin V3"
description: "Learn how to install and run OpenShift Origin V3 on CentOS, step-by-step guide with commands and configuration for setting up a test server using Vagrant."
author: "Russ Mckendrick"
date: "2015-05-23T11:00:00+01:00"
tags:
  - "Linux"
  - "Docker"
cover:
  image: "/img/2015-05-23_openshift-origin-v3_0.png"
  alt: "Learn how to install and run OpenShift Origin V3 on CentOS, step-by-step guide with commands and configuration for setting up a test server using Vagrant."
lastmod: "2021-07-31T12:33:03+01:00"
aliases:
  - "/openshift-origin-v3-1e8bc7db46a7"
---

After being nagged by the gaffer to try OpenShift Origin V3 I finally got round to running a test server using Vagrant on my Mac.

I must say, going into this that the documentation at this stage is struggling a little to keep up with the development and these instructions are the results of much trial, error & Googling.

Also, the product is very much still in active development and there have been several bugs, [like this one](https://github.com/openshift/origin/issues/2245 "BUG!!"), which have caused the instructions below not to work.

First off, I am assuming you have Vagrant & VirtualBox installed (if not, go and install now).

I put my Vagrant machines in ~/Machines/ so first of lets create a directory in there so we can checkout the [latest release](https://github.com/openshift/origin/releases) and start the Vagrant machine;

{{< terminal title="OpenShift Origin V3 1/21" >}}
```
mkdir -p ~/Machines/openshift
cd ~/Machines/openshift
git clone — branch v0.5.2 https://github.com/openshift/origin.git .
vagrant up
vagrant ssh
```
{{< /terminal >}}

and finally change to root to stop loads of permissions problems later on.

{{< terminal title="OpenShift Origin V3 2/21" >}}
```
sudo su -
```
{{< /terminal >}}

You should be now SSH’ed into a Fedora 21 machine as root, before we start there is a little bit of house keeping we need to do to make sure you are starting from a clean slate. First off, lets install killall as you will need this later;

{{< terminal title="OpenShift Origin V3 3/21" >}}
```
yum install -y psmisc 
```
{{< /terminal >}}

The Vagrantbox comes with some containers running, so lets clean up;

{{< terminal title="OpenShift Origin V3 4/21" >}}
```
docker rm -f $(docker ps -a -q)
```
{{< /terminal >}}

Now check that everything is gone;

{{< terminal title="OpenShift Origin V3 5/21" >}}
```
docker ps -a
```
{{< /terminal >}}

When the Vagrant machine booted it mounted a copy of the code you checked out into itself at /data/src/github.com/openshift/origin so lets change to that directory and install the client tools & server;

{{< terminal title="OpenShift Origin V3 6/21" >}}
```
cd /data/src/github.com/openshift/origin
make clean build
```
{{< /terminal >}}

So we now have a clean Fedora 21 machine running Docker with the latest release of OpenShift installed. Now its time to deploy actually run something, lets change to the [“Sample App”](https://github.com/openshift/origin/tree/master/examples/sample-app) directory and use it as the base for the remaining commands;

{{< terminal title="OpenShift Origin V3 7/21" >}}
```
cd /data/src/github.com/openshift/origin/examples/sample-app
```
{{< /terminal >}}

The first thing we need to do is pull down the latest version of the Docker images we are going to need to run the example app;

{{< terminal title="OpenShift Origin V3 8/21" >}}
```
./pullimages.sh
```
{{< /terminal >}}

Now we have the latests images lets start up the OpenShift server, load the certificate which was generated by the server starting and finally set some permissions on the config files;

{{< terminal title="OpenShift Origin V3 9/21" >}}
```
 /data/src/github.com/openshift/origin/_output/local/go/bin/openshift start — public-master=localhost &> logs/openshift.log &
 export CURL_CA_BUNDLE=pwd/openshift.local.config/master/ca.crt
 chmod a+rwX pwd/openshift.local.config/master/admin.kubeconfig

```
{{< /terminal >}}

Next up, lets start a Docker Registry;

{{< terminal title="OpenShift Origin V3 10/21" >}}
```
chmod +r pwd/openshift.local.config/master/openshift-registry.kubeconfig
 openshift ex registry — create — credentials=`pwd`/openshift.local.config/master/openshift-registry.kubeconfig — config=`pwd`/openshift.local.config/master/admin.kubeconfig
```
{{< /terminal >}}

You can check that the registry is running with the following command;

{{< terminal title="OpenShift Origin V3 11/21" >}}
```
 watch osc describe service docker-registry — config=openshift.local.config/master/admin.kubeconfig
```
{{< /terminal >}}

It may take a few minutes to start, but when it has started you should see an Endpoint listed and not [none].

Once started you can add some permissions for the user test-admin;

{{< terminal title="OpenShift Origin V3 12/21" >}}
```
osadm policy add-role-to-user view test-admin — config=openshift.local.config/master/admin.kubeconfig
```
{{< /terminal >}}

and finally login;

{{< terminal title="OpenShift Origin V3 13/21" >}}
```
osc login — certificate-authority=openshift.local.config/master/ca.crt
```
{{< /terminal >}}

Select the default URL and enter the username / password test-admin.

Now we can add the example app project;

{{< terminal title="OpenShift Origin V3 14/21" >}}
```
osc new-project test — display-name=”OpenShift 3 Sample” — description=”This is an example project to demonstrate OpenShift v3"
```
{{< /terminal >}}

Import the project definition;

{{< terminal title="OpenShift Origin V3 15/21" >}}
```
osc process -f application-template-stibuild.json | osc create -f -
```
{{< /terminal >}}

and finally build the application;

{{< terminal title="OpenShift Origin V3 16/21" >}}
```
osc start-build ruby-sample-build
```
{{< /terminal >}}

To view the status of the builds you can run the following;

{{< terminal title="OpenShift Origin V3 17/21" >}}
```
osc get builds — watch
```
{{< /terminal >}}

If a build fails, you can just run the start-build command again. Once everything has been build you can view the status by running;

{{< terminal title="OpenShift Origin V3 18/21" >}}
```
osc get pods
```
{{< /terminal >}}

This will show you all of the running containers and is similar to the output you see when running docker -ps. You can also run;

{{< terminal title="OpenShift Origin V3 19/21" >}}
```
osc get services
```
{{< /terminal >}}

When running the last command make a note of the IP address and port of the front-end.

To view the application exit out of the Vagrant box and then log back in using the following (replacing the IP address of that of the front-end from the osc get services);

{{< terminal title="OpenShift Origin V3 20/21" >}}
```
vagrant ssh — -L 9999:172.30.69.234:5432
```
{{< /terminal >}}

Now goto [http://localhost:9999](http://localhost:9999) and you should see the application.

Also, don’t forget there is a web interface available at [https://localhost:8443/console/](https://localhost:8443/console/) login using the test-admin username you created earlier.

![openshift-management-console-60ad36a7618b4c47930043f7f1feb1c7](/img/2015-05-23_openshift-origin-v3_1.png)

Finally, when you have finished don’t forget to teardown the application and destroy the sample application (it will leave traces in your working directory) by running the clean up script;

{{< terminal title="OpenShift Origin V3 21/21" >}}
```
 cd /data/src/github.com/openshift/origin/examples/sample-app
 ./cleanup.sh
 exit
 exit
 vagrant destroy
```
{{< /terminal >}}

And thats it, you have installed OpenShift 3 and launched a sample application. Its going to be an interesting few months as OpenShift 3 gets closer to release.
