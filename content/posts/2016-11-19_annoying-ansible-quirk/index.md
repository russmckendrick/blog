---
title: "Annoying Ansible Quirk"
description: "Discover a workaround for an annoying quirk in Ansible playbook execution. Learn why pre-tasks were ignored and how to ensure their execution."
author: "Russ Mckendrick"
date: "2016-11-19T13:32:31+01:00"
tags:
  - "Ansible"
  - "AWS"
cover:
  image: "/img/2016-11-19_annoying-ansible-quirk_0.gif"
  alt: "Discover a workaround for an annoying quirk in Ansible playbook execution. Learn why pre-tasks were ignored and how to ensure their execution."
lastmod: "2021-07-31T12:34:22+01:00"
aliases:
  - "/annoying-ansible-quirk-af21fd0c0a2d"
---

I am not sure if this a bug or not, but I spent an hour scratching my head today trying to figure out why part of playbook which was working seemingly suddenly stopped.

I have a playbook which executes each morning to create a staging version of a site from the previous night’s snapshots.

Each weekday morning at 0730am it …

- Bootstraps an AWS environment (VPC, ELB and all the other acronyms)
- Launches a RDS instance from the previous nights snapshot
- Launches an instances and deploys an application and then creates an AMI
- Creates an auto-scaling group and launches three instances using the new AMI behind an ELB

The base operating system is Red Hat Enterprise Linux 7 which does not ship with any AWS tools installed by default, so before the tasks which start interacting with the instance and application I run the following;

```
pre_tasks:
  - yum: name=python-setuptools state=installed
  - shell: easy_install pip
  - pip: name=boto
```

There are several tasks which run when the AMI is launched such as mounting the EFS share, and then once mounted the instance which is running a named AZ removes the contents of the EFS shares and syncs the previous nights S3 back-ups.

So far, so good.

However, the requirements changed slightly, I now need to deploy an updated AMI during the day.

No problem I thought to myself, I will just make some tweaks to the playbook so if there is not an RDS instance running it doesn’t rebuilding the AMI and then a rolling deploy.

To save any problems with peoples work being removed before the environment gets torn down the end of the day I needed to not deploy the scripts which do the sync of the backups, this should be simple enough I will tag those parts of the roles and then exclude the tags which doing the deploy.

After tagging those parts of the playbook and then running …

```
ansible-playbook -i hosts stage-launch.yml — extra-vars “ami_name=$(date +%Y-%m-%d-%H%M)” — ask-vault-pass
```

Everything worked as expected, now I had my environment up and running I tried to do a deploy using …

```

ansible-playbook -i hosts stage-launch.yml — skip-tags “morning” — extra-vars “ami_name=$(date +%Y-%m-%d-%H%M)” — ask-vault-pass
```

Everything worked fine until it came to running the part of the playbook which interacted with the AWS API from the instance itself, it bombed out telling me that Boto was needed to run the task.

Confused I started looking at the errors, why was it saying that Boto wasn’t installed when that was the one thing which should have been installed before anything else !!!

I logged into the temporary instance to see what was going and it was right, Boto wasn’t installed, in-fact neither was pip or easy_install I checked yum and python-setuptools wasn’t installed either, there were no errors, it simply wasn’t there.

I manually following ran the commands which should have been executed during the **pre_tasks** section of the playbook and everything installed as expected and also it all worked when I ran it originally to launch the environment.

I double checked the rest of the playbook, everything just looked fine.

After a more couple runs, which all failed at the same point I added the -vvv flag to get more verbose output, reading through the output I noticed that the **pre_tasks** weren’t failing, they were just being ignored and there was no attempt to even execute them.

But they were not tagged **morning** so they shouldn’t have been skipped, why !!!!

I opened the Ansible documentation, and started reading on **pre_tasks**

> If you want to define certain tasks to happen before AND after roles are applied

Which is what I wanted, it then went on give several examples and then at the bottom of the examples;

> If using tags with tasks (described later as a means of only running part of a playbook), be sure to also tag your pre_tasks and post_tasks and pass those along as well, especially if the pre and post tasks are used for monitoring outage window control or load balancing.

Well I am using tags, but I am excluding a tag everything else which isn’t tagged is working as;

> By default ansible runs as if ‘–tags all’ had been specified.

Reading some more I found;

> There is a special ‘always’ tag that will always run a task, unless specifically skipped (–skip-tags always)

I updated the pre_tasks section of the playbook to read;

```

pre_tasks:
  - yum: name=python-setuptools state=installed
tags:
  - always
  - shell: easy_install pip
tags:
  - always
  - pip: name=boto
tags:
  - always
```

And then ran;

```
ansible-playbook -i hosts stage-launch.yml — skip-tags “morning” — extra-vars “ami_name=$(date +%Y-%m-%d-%H%M)” — ask-vault-pass
```

What do you know, it worked !!!

So because I was skipping a single tag I needed to tag each part of the pre_tasks section **always** as it was skipping them even though it wasn’t doing that for any other part of the playbook.

The moral of this story, even if something looks like it will work, don’t assume it should and check the basics it will save you a lot of time and frustration !!!