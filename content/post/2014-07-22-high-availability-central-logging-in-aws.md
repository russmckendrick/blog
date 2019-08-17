---
author: Russ McKendrick
comments: true
date: 2014-07-22 11:00:00+00:00
image: assets/posts/09429-17i2luhneg1kyhppz4xclwa.png
title: High Availability Central Logging in AWS
categories:
    - Tech
tags:
    - AWS
    - Logs
---

As part of another work project I needed to install some central logging to run in AWS. Simple you may say, create an instance and use [Puppet](https://media-glass.es/tags/#puppet) to install [ELK server stack](http://www.elasticsearch.org/overview/elkdownloads/) on there, or go back to basics and create a [rsyslog](http://www.rsyslog.com/) server. Normally this would be well and good, however I needed to ensure that all parts solution were highly available and fully redundant, this meant that I would have engineer a lot of HA into my ELK or rsyslog servers.




This lead me to think I could configure rsyslog to ship its logs to a [RDS instancee](http://aws.amazon.com/rds/), however this could have a high cost associated with it. My next idea was to ship the logs to [S3](http://aws.amazon.com/s3/), this sounds simpler than it is so I quickly scrapped writing my own script and looked at [Fluentd](http://fluentd.org/), this acts as a director for logs and seemed to tick all the boxes, the only downside was that shipping the logs to S3 wasn’t done it real time, for most of the time this shouldn’t be a problem, however the solution could have load spikes and there are some quite aggressive auto-scaling rules in place meaning so it would be possible for instances to automatically spun up and then terminated before the logs had chance to be shipped to S3.




While I was looking into a way of getting around Amazon made an [announcement](http://aws.amazon.com/about-aws/whats-new/2014/07/10/introducing-amazon-cloudwatch-logs/);




<blockquote>You can now use Amazon CloudWatch to monitor and troubleshoot your systems and applications using your existing system, application, and custom log files. You can send your existing log files to CloudWatch Logs and monitor these logs in near real-time.</blockquote>




Ooooooooo, thats convenient. The great thing is that it just works and its really simple to install;




The first step is add a IAM user or role with the following permissions ……



    
    {<br> “Version”: “2012–10–17”,<br> “Statement”: [<br> {<br> “Effect”: “Allow”,<br> “Action”: [<br> “logs:*”,<br> “s3:GetObject”<br> ],<br> “Resource”: [<br> “arn:aws:logs:us-east-1:*:*”,<br> “arn:aws:s3:::*”<br> ]<br> }<br> ]<br>}




…… once you have done this bit and launched an EC2 instance with the new role or have the user credentials its just a case of running the install script ……



    
    wget <a href="https://s3.amazonaws.com/aws-cloudwatch/downloads/awslogs-agent-setup-v1.0.py" target="_blank" data-href="https://s3.amazonaws.com/aws-cloudwatch/downloads/awslogs-agent-setup-v1.0.py">https://s3.amazonaws.com/aws-cloudwatch/downloads/awslogs-agent-setup-v1.0.py</a><br>chmod 755 awslogs-agent-setup-v1.0.py<br>./awslogs-agent-setup-v1.0.py -r us-east-1



    
    Launching interactive setup of CloudWatch Logs agent …



    
    Step 1 of 5: Installing pip …DONE



    
    Step 2 of 5: Downloading the latest CloudWatch Logs agent bits … DONE



    
    Step 3 of 5: Configuring AWS CLI …<br>AWS Access Key ID [None]:<br>AWS Secret Access Key [None]:<br>Default region name [None]:<br>Default output format [None]:



    
    Step 4 of 5: Configuring the CloudWatch Logs Agent …<br>Path of log file to upload [/var/log/messages]:<br>Destination Log Group name [/var/log/messages]:



    
    Choose Log Stream name:<br> 1. Use EC2 instance id.<br> 2. Use hostname.<br> 3. Custom.<br>Enter choice [1]: 1



    
    Choose Log Event timestamp format:<br> 1. %b %d %H:%M:%S (Dec 31 23:59:59)<br> 2. %d/%b/%Y:%H:%M:%S (10/Oct/2000:13:55:36)<br> 3. %Y-%m-%d %H:%M:%S (2008–09–08 11:52:54)<br> 4. Custom<br>Enter choice [1]: 1



    
    Choose initial position of upload:<br> 1. From start of file.<br> 2. From end of file.<br>Enter choice [1]: 1<br>More log files to configure? [Y]: y<br>Path of log file to upload [/var/log/messages]: /var/log/secure<br>Destination Log Group name [/var/log/secure]:



    
    Choose Log Stream name:<br> 1. Use EC2 instance id.<br> 2. Use hostname.<br> 3. Custom.<br>Enter choice [1]: 1



    
    Choose Log Event timestamp format:<br> 1. %b %d %H:%M:%S (Dec 31 23:59:59)<br> 2. %d/%b/%Y:%H:%M:%S (10/Oct/2000:13:55:36)<br> 3. %Y-%m-%d %H:%M:%S (2008–09–08 11:52:54)<br> 4. Custom<br>Enter choice [1]: 1



    
    Choose initial position of upload:<br> 1. From start of file.<br> 2. From end of file.<br>Enter choice [1]: 1<br>More log files to configure? [Y]: n



    
    Step 5 of 5: Setting up agent as a daemon …DONE



    
    — — — — — — — — — — — — — — — — — — — — — — — — — — — <br>- Configuration file successfully saved at: /var/awslogs/etc/awslogs.conf<br>- You can begin accessing new log events after a few moments at <a href="https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs:" target="_blank" data-href="https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs:">https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs:</a><br>- You can use ‘sudo service awslogs start|stop|status|restart’ to control the daemon.<br>- To see diagnostic information for the CloudWatch Logs Agent, see /var/log/awslogs.log<br>- You can rerun interactive setup using ‘sudo ./awslogs-agent-setup.py — region us-east-1 — only-generate-config’<br> — — — — — — — — — — — — — — — — — — — — — — — — — — — 




and thats it, if you goto your AWS Console you should now see the /var/log/messages and /var/log/secure logs being captured.




Don’t you just love it when a new service is launched at the exact time when you need it most :)




For more on service please see [here](https://aws.amazon.com/blogs/aws/cloudwatch-log-service/) and for more [in-depth reading here](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/WhatIsCloudWatchLogs.html)




