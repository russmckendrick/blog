---
title: "High Availability Central Logging in AWS"
description: "Set up high availability central logging in AWS with Amazon CloudWatch Logs. This guide covers installation, IAM permissions, and CloudWatch Logs agent setup."
author: "Russ Mckendrick"
date: 2014-07-22T11:00:00.000Z
lastmod: 2021-07-31T12:31:40+01:00

tags:
    - "Code"
    - "Tools"
    - "AWS"
    - "Cloud"

cover:
    image: "/img/2014-07-22_high-availability-central-logging-in-aws_0.png" 
images:
 - "/img/2014-07-22_high-availability-central-logging-in-aws_0.png"


aliases:
- "/high-availability-central-logging-in-aws-88878a25e9f1"

---

As part of another work project I needed to install some central logging to run in AWS. Simple you may say, create an instance and use [Puppet](/tags/#puppet) to install [ELK server stack](http://www.elasticsearch.org/overview/elkdownloads/) on there, or go back to basics and create a [rsyslog](http://www.rsyslog.com/) server. Normally this would be well and good, however I needed to ensure that all parts solution were highly available and fully redundant, this meant that I would have engineer a lot of HA into my ELK or rsyslog servers.

This lead me to think I could configure rsyslog to ship its logs to a [RDS instancee](http://aws.amazon.com/rds/), however this could have a high cost associated with it. My next idea was to ship the logs to [S3](http://aws.amazon.com/s3/), this sounds simpler than it is so I quickly scrapped writing my own script and looked at [Fluentd](http://fluentd.org/), this acts as a director for logs and seemed to tick all the boxes, the only downside was that shipping the logs to S3 wasn’t done it real time, for most of the time this shouldn’t be a problem, however the solution could have load spikes and there are some quite aggressive auto-scaling rules in place meaning so it would be possible for instances to automatically spun up and then terminated before the logs had chance to be shipped to S3.

While I was looking into a way of getting around Amazon made an [announcement](http://aws.amazon.com/about-aws/whats-new/2014/07/10/introducing-amazon-cloudwatch-logs/);

> You can now use Amazon CloudWatch to monitor and troubleshoot your systems and applications using your existing system, application, and custom log files. You can send your existing log files to CloudWatch Logs and monitor these logs in near real-time.

Ooooooooo, thats convenient. The great thing is that it just works and its really simple to install;

The first step is add a IAM user or role with the following permissions ……

{{< terminal title="Example code" >}}
``` terminfo
{
 “Version”: “2012–10–17”,
 “Statement”: [
 {
 “Effect”: “Allow”,
 “Action”: [
 “logs:*”,
 “s3:GetObject”
 ],
 “Resource”: [
 “arn:aws:logs:us-east-1:*:*”,
 “arn:aws:s3:::*”
 ]
 }
 ]
}
```
{{< /terminal >}}

…… once you have done this bit and launched an EC2 instance with the new role or have the user credentials its just a case of running the install script ……

{{< terminal title="Example code" >}}
``` terminfo
wget https://s3.amazonaws.com/aws-cloudwatch/downloads/awslogs-agent-setup-v1.0.py
chmod 755 awslogs-agent-setup-v1.0.py
./awslogs-agent-setup-v1.0.py -r us-east-1

Launching interactive setup of CloudWatch Logs agent …

Step 1 of 5: Installing pip …DONE

Step 2 of 5: Downloading the latest CloudWatch Logs agent bits … DONE

Step 3 of 5: Configuring AWS CLI …
AWS Access Key ID [None]:
AWS Secret Access Key [None]:
Default region name [None]:
Default output format [None]:

Step 4 of 5: Configuring the CloudWatch Logs Agent …
Path of log file to upload [/var/log/messages]:
Destination Log Group name [/var/log/messages]:

Choose Log Stream name:
 1. Use EC2 instance id.
 2. Use hostname.
 3. Custom.
Enter choice [1]: 1

Choose Log Event timestamp format:
 1. %b %d %H:%M:%S (Dec 31 23:59:59)
 2. %d/%b/%Y:%H:%M:%S (10/Oct/2000:13:55:36)
 3. %Y-%m-%d %H:%M:%S (2008–09–08 11:52:54)
 4. Custom
Enter choice [1]: 1

Choose initial position of upload:
 1. From start of file.
 2. From end of file.
Enter choice [1]: 1
More log files to configure? [Y]: y
Path of log file to upload [/var/log/messages]: /var/log/secure
Destination Log Group name [/var/log/secure]:

Choose Log Stream name:
 1. Use EC2 instance id.
 2. Use hostname.
 3. Custom.
Enter choice [1]: 1

Choose Log Event timestamp format:
 1. %b %d %H:%M:%S (Dec 31 23:59:59)
 2. %d/%b/%Y:%H:%M:%S (10/Oct/2000:13:55:36)
 3. %Y-%m-%d %H:%M:%S (2008–09–08 11:52:54)
 4. Custom
Enter choice [1]: 1

Choose initial position of upload:
 1. From start of file.
 2. From end of file.
Enter choice [1]: 1
More log files to configure? [Y]: n

Step 5 of 5: Setting up agent as a daemon …DONE

— — — — — — — — — — — — — — — — — — — — — — — — — — — 
- Configuration file successfully saved at: /var/awslogs/etc/awslogs.conf
- You can begin accessing new log events after a few moments at https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs:
- You can use ‘sudo service awslogs start|stop|status|restart’ to control the daemon.
- To see diagnostic information for the CloudWatch Logs Agent, see /var/log/awslogs.log
- You can rerun interactive setup using ‘sudo ./awslogs-agent-setup.py — region us-east-1 — only-generate-config’
 — — — — — — — — — — — — — — — — — — — — — — — — — — — 
```
{{< /terminal >}}

and thats it, if you goto your AWS Console you should now see the /var/log/messages and /var/log/secure logs being captured.

Don’t you just love it when a new service is launched at the exact time when you need it most :)

For more on service please see [here](https://aws.amazon.com/blogs/aws/cloudwatch-log-service/) and for more [in-depth reading here](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/WhatIsCloudWatchLogs.html)
