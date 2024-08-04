---
title: "NGINX & ngx_pagespeed on CentOS 7"
description: "Compile NGINX with ngx_pagespeed on CentOS 7. Automate setup with init script. Configure NGINX for ngx_pagespeed to enhance performance."
author: "Russ Mckendrick"
date: "2015-02-14T15:36:06+01:00"
tags:
  - "Linux"
  - "Web"
cover:
  image: "/img/2015-02-14_nginx-ngxpagespeed-on-centos-7_0.png"
  alt: "Compile NGINX with ngx_pagespeed on CentOS 7. Automate setup with init script. Configure NGINX for ngx_pagespeed to enhance performance."
lastmod: "2021-07-31T12:32:39+01:00"
aliases:
  - "/nginx-ngx-pagespeed-on-centos-7-a1766f433e0f"
---

I wanted to have a quick play with Googles Pagespeed module, as I use NGINX and not Apache I needed to compile NGINX from source to enable the ngx_pagespeed module. The following assumes you are have a clean CentOS 7 installation.

First off you need to install the packages which enable you to compile NGINX with ngx_pagespeed from source.

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 1/8" >}}
```
yum install -y gcc-c++ pcre-dev pcre-devel zlib-devel make unzip openssl-devel
```
{{< /terminal >}}

Now create a NGINX user and make so the user doesn’t have a shell.

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 2/8" >}}
```
useradd nginx
usermod -s /sbin/nologin nginx
```
{{< /terminal >}}

Once the required packages have been installed and have created the NGINX user it’s time to grab a copy of the ngx_pagespeed and psol source code. See [https://github.com/pagespeed/ngx_pagespeed/releases](https://github.com/pagespeed/ngx_pagespeed/releases) for latest release details.

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 3/8" >}}
```
cd /usr/local/src/
NPS_VERSION=1.9.32.3
wget https://github.com/pagespeed/ngx_pagespeed/archive/release-${NPS_VERSION}-beta.zip
unzip release-${NPS_VERSION}-beta.zip
cd ngx_pagespeed-release-${NPS_VERSION}-beta/
wget https://dl.google.com/dl/page-speed/psol/${NPS_VERSION}.tar.gz
tar -xzvf ${NPS_VERSION}.tar.gz
```
{{< /terminal >}}

Now grab the latest version of NGINX. See [http://nginx.org/en/download.html](http://nginx.org/en/download.html) for details on the latest release.

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 4/8" >}}
```
cd /usr/local/src/
NGINX_VERSION=1.7.10
wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz
tar -xvzf nginx-${NGINX_VERSION}.tar.gz
cd nginx-${NGINX_VERSION}/
```
{{< /terminal >}}

Now you have the source its time to configure NGIX and compile

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 5/8" >}}
```
./configure — add-module=/usr/local/src/ngx_pagespeed-release-${NPS_VERSION}-beta — with-http_ssl_module — sbin-path=/usr/sbin/nginx — conf-path=/etc/nginx/nginx.conf — error-log-path=/var/log/nginx/error.log — http-log-path=/var/log/nginx/access.log
make && make install
```
{{< /terminal >}}

Now you have NGINX compiled and installed on your server. While you could manage the process manually it’s best to create an init script. As CentOS 7 uses systemd you need to create a service file in /usr/lib/systemd/system/.

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 6/8" >}}
```
cat >> /usr/lib/systemd/system/nginx.service << NGINX_SERVICE
[Unit]
Description=The nginx HTTP and reverse proxy server
After=syslog.target network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
NGINX_SERVICE
Finally you need to enable and start the service.

systemctl enable nginx
systemctl start nginx
```
{{< /terminal >}}

If everything has gone as expected you should have NGINX running your server with the ngx_pagespeed module also loaded. Now you will to do playing with ngx_pagespeed, first of all create a cache directory and make sure that NGINX can read and write to it;

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 7/8" >}}
```
mkdir /var/ngx_pagespeed_cache
chown -R nginx: /var/ngx_pagespeed_cache
```
{{< /terminal >}}

then add some directives to your NGINX virtual host block. I used to the following for my tests;

{{< terminal title="NGINX & ngx_pagespeed on CentOS 7 8/8" >}}
```
pagespeed on;
pagespeed FileCachePath /var/ngx_pagespeed_cache;

location ~ “^/pagespeed_static/” { }
location ~ “^/ngx_pagespeed_beacon$” { }
location /ngx_pagespeed_statistics { allow 127.0.0.1; deny all; }
location /ngx_pagespeed_global_statistics { allow 127.0.0.1; deny all; }
location /ngx_pagespeed_message { allow 127.0.0.1; deny all; }
location /pagespeed_console { allow 127.0.0.1; deny all; }
location /pagespeed_admin { allow 127.0.0.1; deny all; }

# Ensure requests for pagespeed optimized resources go to the pagespeed handler
# and no extraneous headers get set.
location ~ “\.pagespeed\.([a-z]\.)?[a-z]{2}\.[^.]{10}\.[^.]+” {
add_header “” “”;
}

pagespeed EnableFilters canonicalize_javascript_libraries,extend_cache,extend_cache_pdfs,combine_css,combine_javascript,move_css_above_scripts,insert_dns_prefetch,rewrite_javascript,rewrite_images,prioritize_critical_css,rewrite_css,rewrite_style_attributes,convert_meta_tags,lazyload_images,collapse_whitespace,move_css_to_head,remove_comments,remove_quotes,inline_css,inline_javascript;
pagespeed UseExperimentalJsMinifier on;
```
{{< /terminal >}}