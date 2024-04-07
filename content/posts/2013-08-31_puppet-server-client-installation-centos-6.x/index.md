---
title: "Puppet Server & Client Installation CentOS 6.x"
author: "Russ Mckendrick"
description: "Step-by-step guide to setting up a Puppet Server and agent on CentOS 6.4, including Apache configuration and SSL certificate management."
date: 2013-08-31T11:00:00.000Z
lastmod: 2021-07-31T12:30:58+01:00
tags:
    - "Linux"
    - "Automation"
    - "Infrastructure as Code"
cover:
    image: "/img/2013-08-31_puppet-server-client-installation-centos-6.x_0.png" 
images:
 - "/img/2013-08-31_puppet-server-client-installation-centos-6.x_0.png"
aliases:
- "/puppet-server-client-installation-centos-6-x-c8145dacdbd1"

---

This post assumes that you are starting with a clean minimal CentOS 6.4 64bit server and you have a full hostname set.

Puppet Server Installation ……

```
# Hostname — Make sure the host name it set to puppet.yourdomain.com and that you replace references in this file

# Install puppet & epel repos
yum install -y http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

# Download puppet-server from Puppet Labs, apache and necessary dependencies
yum install -y vim-enhanced puppet-server httpd httpd-devel mod_ssl ruby-devel rubygems gcc-c++ curl-devel zlib-devel make automake openssl-devel rubygem-rack rubygem-passenger-native-libs rubygem-passenger-native rubygem-passenger rubygem-fastthread libev mod_passenger git

# Start Puppet-Server
/etc/init.d/puppetmaster start

# Set Puppet Master to run on startup
puppet resource service puppetmaster ensure=running enable=true

# Create the directory structure for Puppet Master Rack Application
mkdir -p /usr/share/puppet/rack/puppetmasterd
mkdir /usr/share/puppet/rack/puppetmasterd/public /usr/share/puppet/rack/puppetmasterd/tmp
cp /usr/share/puppet/ext/rack/files/config.ru /usr/share/puppet/rack/puppetmasterd/
chown puppet /usr/share/puppet/rack/puppetmasterd/config.ru

# Create the VHOST for puppet master
cat > /etc/httpd/conf.d/puppetmaster.conf << APACHE_CONFIG

PassengerHighPerformance On
PassengerMaxPoolSize 6
PassengerMaxRequests 1000
PassengerPoolIdleTime 600

Listen 8140
<VirtualHost *:8140>
 SSLEngine On

# Only allow high security cryptography. Alter if needed for compatibility.
 SSLProtocol All -SSLv2
 SSLCipherSuite HIGH:!ADH:RC4+RSA:-MEDIUM:-LOW:-EXP
 SSLCertificateFile /var/lib/puppet/ssl/certs/puppet.yourdomain.com.pem
 SSLCertificateKeyFile /var/lib/puppet/ssl/private_keys/puppet.yourdomain.com.pem
 SSLCertificateChainFile /var/lib/puppet/ssl/ca/ca_crt.pem
 SSLCACertificateFile /var/lib/puppet/ssl/ca/ca_crt.pem
 SSLCARevocationFile /var/lib/puppet/ssl/ca/ca_crl.pem
 SSLVerifyClient optional
 SSLVerifyDepth 1
 SSLOptions +StdEnvVars +ExportCertData

# These request headers are used to pass the client certificate
 # authentication information on to the puppet master process
 RequestHeader set X-SSL-Subject %{SSL_CLIENT_S_DN}e
 RequestHeader set X-Client-DN %{SSL_CLIENT_S_DN}e
 RequestHeader set X-Client-Verify %{SSL_CLIENT_VERIFY}e

DocumentRoot /usr/share/puppet/rack/puppetmasterd/public/
 <Directory /usr/share/puppet/rack/puppetmasterd/>
 Options None
 AllowOverride None
 Order Allow,Deny
 Allow from All
 </Directory>
</VirtualHost>
APACHE_CONFIG

# Sort out the services
/etc/init.d/puppetmaster stop
/etc/init.d/httpd start
chkconfig puppetmaster off
chkconfig httpd on

# check its listening

netstat -ln | grep 8140

# bosh
```

Install the agent ……

```
# Add the Puppetlabs & VIM !!!
yum install -y http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm vim-enhanced

# Disable the repo
sed -i ‘s/enabled=1/enabled=0/g’ /etc/yum.repos.d/puppetlabs.repo

# Install the agent
yum install -y puppet — enablerepo=puppetlabs*

# Configure the agent
cat >> /etc/puppet/puppet.conf << CONFIG
 server = puppet.yourdomain.com
 report = true
 pluginsync = true
CONFIG

# Daemonize it and make it start on boot
chkconfig puppet on
puppet agent — daemonize
```

This will have sent the client certificate to the master server, all you have to do now is sign it. On Puppet Master ……

```
puppet cert list
puppet cert sign — all
```

and then test on the Puppet client ……

```
puppet agent — test
```