---
title: "Jenkins"
author: "Russ Mckendrick"
date: 2015-12-20T18:10:26.000Z
lastmod: 2021-07-31T12:33:38+01:00

tags:
 - Tech
 - Centos
 - Jenkins

cover:
    image: "/img/2015-12-20_jenkins_0.png" 
images:
 - "/img/2015-12-20_jenkins_0.png"


aliases:
- "/jenkins-afbc870c46ee"

---

Jenkins has always been a bit of an elephant in the room to me. Not being a developer I have always just shrugged it off a tool used for running unit tests, however, as I moving more into orchestration and automation I am finding the need for a tool which can run both tasks and unit tests, so this weekend I decided to finally take the plunge and have a play around with it.

As always I started off with a blank CentOS 7 server hosted in Digital and ran [my bootstrap script](/2015/06/28/digital-ocean-bootstrap/) to get the basics sorted.

Once I had that in order I grabbed the repo file for the Jenkins RPM repository and installed the package along with Java and NGINX;

```
wget -O /etc/yum.repos.d/jenkins.repo http://pkg.jenkins-ci.org/redhat/jenkins.repo
rpm — import http://pkg.jenkins-ci.org/redhat/jenkins-ci.org.key
yum install nginx httpd-tools java-1.7.0-openjdk jenkins
```

As there is only going to be me using this installation I decided that I would use NGINX to provide both the SSL termination and also the password protection for the installation.

I started by creating the password file for NGINX to use;

```
htpasswd -c /etc/nginx/.htpasswd my_username
```

The NGINX config file which was called /etc/nginx/conf.d/jenkins.conf looks like this;

```
server {
 listen 80;
 server_name jenkins.super-awesome-domain.io;
 return 301 https://$host$request_uri;
}

server {

listen 443;
 server_name jenkins.super-awesome-domain.io;

ssl_certificate /etc/letsencrypt/live/jenkins.super-awesome-domain.io/fullchain.pem;
 ssl_certificate_key /etc/letsencrypt/live/jenkins.super-awesome-domain.io/privkey.pem;

ssl on;
 ssl_session_cache builtin:1000 shared:SSL:10m;
 ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
 ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
 ssl_prefer_server_ciphers on;

access_log /var/log/nginx/jenkins.access.log;

location / {

auth_basic “Restricted”;
 auth_basic_user_file /etc/nginx/.htpasswd;
 proxy_set_header Host $host;
 proxy_set_header X-Real-IP $remote_addr;
 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 proxy_set_header X-Forwarded-Proto $scheme;
 proxy_pass http://localhost:8080;
 proxy_read_timeout 90;
 proxy_redirect http://localhost:8080 https://jenkins.super-awesome-domain.io;
 }
 }
```

As you have noticed I got the certificate from the incredibly awesome [LetEncrypt](https://letsencrypt.org). As the domain I was using was already resolving to the server getting the certificate was a simple as running the following commands and then following the on screen prompts;

```
cd /root/
git clone https://github.com/letsencrypt/letsencrypt
cd letsencrypt/
./letsencrypt-auto certonly
```

As I wasn’t going to directly expose Jenkins to the world, I configured it to listen on localhost, that way we don’t have a Java service bond directly publicly available NIC. To do this run the following command;

```
echo ‘JENKINS_ARGS=” — webroot=/var/cache/jenkins/war — httpListenAddress=127.0.0.1 — httpPort=$HTTP_PORT -ajp13Port=$AJP_PORT’ > /etc/default/jenkins
```

Finally, it’s time to enable the firewall, by default Firewalld has the ssh port (22) configured. As the bootstrap script installed [Fail2Ban](https://media-glass.es/2015/03/29/fail2ban-on-centos-7/), and also password enabled login is disabled on the instance so I am happy to keep the port open. So we just need to enable ports 80 & 443;

```
systemctl enable firewalld && systemctl restart firewalld
firewall-cmd — zone=public — add-port=80/tcp — permanent
firewall-cmd — zone=public — add-port=443/tcp — permanent
firewall-cmd — reload
```

Finally, its time to enable and start the rest of the services;

```
systemctl enable jenkins.service && systemctl restart jenkins.service
systemctl enable nginx.service && systemctl restart nginx
```

If everything went as planned you should be able to access Jenkins at the domain name you configured in the NGINX configuration.

Once I had access to the GUI I configured Jenkins to deploy this blog whenever it detects a change at the [repo](https://github.com/russmckendrick/blog). I won’t go into to the details here as there are both AWS access keys and Cloudflare API keys involved in the configuration, and knowing my luck I would end up getting hacked because I exposed them.
