---
title: "Thoughts on Amazon Lightsail"
author: "Russ Mckendrick"
date: 2016-12-18T17:21:49.496Z
lastmod: 2021-07-31T12:34:30+01:00

tags:
 - AWS
 - Cloud Computing
 - Amazon Lightsail

cover:
    image: "/img/2016-12-18_thoughts-on-amazon-lightsail_0.png" 
images:
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_0.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_1.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_2.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_3.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_4.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_5.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_6.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_7.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_8.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_9.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_10.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_11.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_12.png"
 - "/img/2016-12-18_thoughts-on-amazon-lightsail_13.png"


aliases:
- "/thoughts-on-amazon-lightsail-fc37ca50d626"

---

I am still catching up on all of the announcements from the AWS re:invent 2016, one of the ones I was interested in was Amazon Lightsail. I have always found Digital Ocean to be useful for launching instances, doing some test installations of XYZ and then terminating them.

![](/img/2016-12-18_thoughts-on-amazon-lightsail_1.png)

It makes perfect sense that Amazon would offer a service which allows you to consume resources in the same way Digital Ocean allow their users to, they have the infrastructure to provide as well as an established customer base who probably already use Digital Ocean.

### Instances vs Virtual Machines or Pets vs Cattle

Some of you maybe thinking, isn’t this already what Amazon Web Services do? The short answer is no, while it is possible to launch a single instance using EC2 it is not recommended.

#### Instances / Cattle

A typical AWS solution should be built for failure;

> If you’re used to designing and deploying applications in your own data centers, you need to be prepared to unlearn a lot of what you know. Seek to understand and embrace the differences operating in a cloud environment.

> Many examples come to mind, such as hardware reliability. In our own data centers, session-based memory management was a fine approach, because any single hardware instance failure was rare. Managing state in volatile memory was reasonable, because it was rare that we would have to migrate from one instance to another. I knew to expect higher rates of individual instance failure in AWS, but I hadn’t thought through some of these sorts of implications.

The quote above is taken from a blog post published by the engineering team from Netflix a year into their migration to AWS back in December 2010;

[5 Lessons We've Learned Using AWS](http://techblog.netflix.com/2010/12/5-lessons-weve-learned-using-aws.html "http://techblog.netflix.com/2010/12/5-lessons-weve-learned-using-aws.html")

Trust me, if you haven’t approached an AWS solution with this in mind then at some point you are going to have trouble.

Building for failure means;

- You have two or more instances performing a single role in launched in a auto-scaling group across multiple availability zones
- You should not care if an instance or the application it is running stops responding as it should be immediatly terminated and be replaced with an exact replica
- You should never need to “quickly login to an instance to make a change to xyz or fix an issue”
- Traffic should be routed in a way which allows you to have no fixed points within a single availability zone, you shouldn’t be using fixed IP addresses to talk to your applications, use the Elastic Load Balancing service, dynamic DNS with Route53 and have your databases running in a RDS instance which is in a multi availibility zone configuration

You should be calling these types of compute resources Instances or cattle

#### Virtual Machines / Pets

Virtual Machines on the other hand are more akin to traditional servers, you have a single Virtual Machine running a single role.

You care if it is up and running and you have have to login and fix it. It is a fixed point and you have to maintain it.

I am not going to go into the whole Pet vs. Cattle explaination, just read through slide deck below for the complete history;

<iframe src="https://www.slideshare.net/slideshow/embed_code/key/9ofEmedJ31mr9o" width="595" height="485" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border:1px solid #CCC; border-width:1px; margin-bottom:5px; " allowfullscreen> </iframe>

### Amazon Lightsail = Pets in AWS?

So does the introduction of Amazon Lightsail mean you can host Pets in AWS? Ermmmmmm, sort of.

Lets walk through launching an Instance with Amazon Lightsail. When you first login you are present with a much friendlier welcome than the overwhelming AWS Console;

![](/img/2016-12-18_thoughts-on-amazon-lightsail_2.png)

Clicking on **Create instance** gives you the option of launching a pre configured software stack;

![](/img/2016-12-18_thoughts-on-amazon-lightsail_3.png)

Or a plain Operating System (currently limited to Amazin Linux and Ubuntu 16.04 LTS);

![](/img/2016-12-18_thoughts-on-amazon-lightsail_4.png)

Scrolling down gives you the options of selecting the size of the instance you want to launch, and it tells you exactly how much it is going to cost you per month, which key to use and which availability zone within us-east1 (currently the only region available) it should be launched in and finally you get to name your instance.

![](/img/2016-12-18_thoughts-on-amazon-lightsail_5.png)

As you can see, onced launched you machine has a publicly accessible IP address which you can connect to using a terminal;

![](/img/2016-12-18_thoughts-on-amazon-lightsail_6.png)

Or login using the Connect using SSH button in the GUI;

![](/img/2016-12-18_thoughts-on-amazon-lightsail_7.png)

So far on the face it the experience very Digital Ocean like, all be it with an AWS twist. Click on Manage gives you several tabs;

- **Connect** gives you the details you need to connect to the isntance using a terminal or the web interface.
- **Metrics** gives you graphs and details on the instance.
- **Networking** allows you assgin a static IP address and also manage the firewall.
- **Snapshots** gives you the options of making and managing, you guessed it, snapshots.
- **History** shows you a run down of what tasks though the web interface have been carried out on the instance.
- **Delete** allows you to, well, delete your instance.

![](/img/2016-12-18_thoughts-on-amazon-lightsail_8.png)![](/img/2016-12-18_thoughts-on-amazon-lightsail_9.png)![](/img/2016-12-18_thoughts-on-amazon-lightsail_10.png)![](/img/2016-12-18_thoughts-on-amazon-lightsail_11.png)![](/img/2016-12-18_thoughts-on-amazon-lightsail_12.png)![](/img/2016-12-18_thoughts-on-amazon-lightsail_13.png)

The whole thing feels very much like a lite AWS, and that is where a few potential problems could come in.

First of all the prices might not seem as fixed as they first appear, this is covered in an article by The Register;

[Cheap virtual box hosters - Amazon's Lightsail is out to destroy you (yes, you, Digital Ocean)](http://www.theregister.co.uk/2016/11/30/amazon_lightsail/ "http://www.theregister.co.uk/2016/11/30/amazon_lightsail/")

Secondly, and more importantly, from what I can tell it is still an Ec2 instance. Failures may still be few and far between but essetntially you are still running a service on top of Ec2 which means your instance is still potentally more Cattle than it is Pet.

The reason why I say potentially is that I can’t find any documenation or service level agreements for Amazon Lightsail which give an uptime expectations.

It is safe to assume though, that in the background that Amazon automatically configue Instance Recovery for your Amazon Lightsail instances.

Instance Recovery has been a feature since January 2015 and Amazon Lightscale instances appear to tick the boxes of being having the feature enabled;

- **Use a C3, C4, M3, M4, R3, R4, T2, or X1 instance type**; we know from the FAQ and specs that Amazon Lightsail instances are T2 instances.
- **Run in a VPC (not EC2-Classic)**; it was stated at launch that Amazon Lightsail runs inside a dedicated and hidden VPC in your account.
- **Use shared tenancy**; this is a no-brainer :).
- **Use EBS volumes, including encrypted EBS volumes;**as you are given snaphot options then this is a given.

Instance Recovery is a Cloud Watch function, Amazon Lightsail present metrics which look alot like Cloud Watch, which when configured restarts your instance on different hardware while maintaining your instance state (HDD, Networking etc).

[Recover Your Instance - Amazon Elastic Compute Cloud](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-recover.html "http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-recover.html")

As an early release the service appears to be pretty solid, there are some omissions such as;

- Automatic Snapshots; while you can [trigger a snapshot using the API](https://docs.aws.amazon.com/lightsail/2016-11-28/api-reference/API_CreateInstanceSnapshot.html) there are not any options so you can click “Nightly Snaphot” and keep x number of snapshots. Backups should be configure it once and then forget about them until you need them.
- Resize your instance; you have to create a snaphot, then launch a new instance from it at the desired size and then move (if you have one) your static IP address across to it. This process should be automated, it certainly seems doable using the API.
- Block Storage; not sure if there is a feature too far, but it would be good to be able to attach EBS volumes.

For more information see the Amazon Lightsail Docs and FAQ site at;

[Lightsail Docs: API, CLI, and tutorials for developers](https://amazonlightsail.com/docs/ "https://amazonlightsail.com/docs/")
