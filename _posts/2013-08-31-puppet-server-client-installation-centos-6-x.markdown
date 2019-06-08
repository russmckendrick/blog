---
author: russmckendrick
comments: true
date: 2013-08-31 11:00:00+00:00
layout: post
link: http://mediaglasses.blog/2013/08/31/puppet-server-client-installation-centos-6-x/
slug: puppet-server-client-installation-centos-6-x
title: Puppet Server & Client Installation CentOS 6.x
wordpress_id: 1014
categories:
- Tech
tags:
- CentOS
- Puppet
- Shell
---






![]({{ baseurl }}/assets/posts/e8ac9-1zazvvqg5phryav9k_szxzq.png)




This post assumes that you are starting with a clean minimal CentOS 6.4 64bit server and you have a full hostname set.




Puppet Server Installation ……



    
    # Hostname — Make sure the host name it set to puppet.yourdomain.com and that you replace references in this file



    
    # Install puppet & epel repos<br>yum install -y <a href="http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm" target="_blank" data-href="http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm">http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm</a> <a href="http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm" target="_blank" data-href="http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm">http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm</a>



    
    # Download puppet-server from Puppet Labs, apache and necessary dependencies<br>yum install -y vim-enhanced puppet-server httpd httpd-devel mod_ssl ruby-devel rubygems gcc-c++ curl-devel zlib-devel make automake openssl-devel rubygem-rack rubygem-passenger-native-libs rubygem-passenger-native rubygem-passenger rubygem-fastthread libev mod_passenger git



    
    # Start Puppet-Server<br>/etc/init.d/puppetmaster start



    
    # Set Puppet Master to run on startup<br>puppet resource service puppetmaster ensure=running enable=true



    
    # Create the directory structure for Puppet Master Rack Application<br>mkdir -p /usr/share/puppet/rack/puppetmasterd<br>mkdir /usr/share/puppet/rack/puppetmasterd/public /usr/share/puppet/rack/puppetmasterd/tmp<br>cp /usr/share/puppet/ext/rack/files/config.ru /usr/share/puppet/rack/puppetmasterd/<br>chown puppet /usr/share/puppet/rack/puppetmasterd/config.ru



    
    # Create the VHOST for puppet master<br>cat > /etc/httpd/conf.d/puppetmaster.conf << APACHE_CONFIG



    
    PassengerHighPerformance On<br>PassengerMaxPoolSize 6<br>PassengerMaxRequests 1000<br>PassengerPoolIdleTime 600



    
    Listen 8140<br><VirtualHost *:8140><br> SSLEngine On



    
    # Only allow high security cryptography. Alter if needed for compatibility.<br> SSLProtocol All -SSLv2<br> SSLCipherSuite HIGH:!ADH:RC4+RSA:-MEDIUM:-LOW:-EXP<br> SSLCertificateFile /var/lib/puppet/ssl/certs/puppet.yourdomain.com.pem<br> SSLCertificateKeyFile /var/lib/puppet/ssl/private_keys/puppet.yourdomain.com.pem<br> SSLCertificateChainFile /var/lib/puppet/ssl/ca/ca_crt.pem<br> SSLCACertificateFile /var/lib/puppet/ssl/ca/ca_crt.pem<br> SSLCARevocationFile /var/lib/puppet/ssl/ca/ca_crl.pem<br> SSLVerifyClient optional<br> SSLVerifyDepth 1<br> SSLOptions +StdEnvVars +ExportCertData



    
    # These request headers are used to pass the client certificate<br> # authentication information on to the puppet master process<br> RequestHeader set X-SSL-Subject %{SSL_CLIENT_S_DN}e<br> RequestHeader set X-Client-DN %{SSL_CLIENT_S_DN}e<br> RequestHeader set X-Client-Verify %{SSL_CLIENT_VERIFY}e



    
    DocumentRoot /usr/share/puppet/rack/puppetmasterd/public/<br> <Directory /usr/share/puppet/rack/puppetmasterd/><br> Options None<br> AllowOverride None<br> Order Allow,Deny<br> Allow from All<br> </Directory><br></VirtualHost><br>APACHE_CONFIG



    
    # Sort out the services<br>/etc/init.d/puppetmaster stop<br>/etc/init.d/httpd start<br>chkconfig puppetmaster off<br>chkconfig httpd on



    
    # check its listening



    
    netstat -ln | grep 8140



    
    # bosh




Install the agent ……



    
    # Add the Puppetlabs & VIM !!!<br>yum install -y <a href="http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm" target="_blank" data-href="http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm">http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-6.noarch.rpm</a> vim-enhanced



    
    # Disable the repo<br>sed -i ‘s/enabled=1/enabled=0/g’ /etc/yum.repos.d/puppetlabs.repo



    
    # Install the agent<br>yum install -y puppet — enablerepo=puppetlabs*



    
    # Configure the agent<br>cat >> /etc/puppet/puppet.conf << CONFIG<br> server = puppet.yourdomain.com<br> report = true<br> pluginsync = true<br>CONFIG



    
    # Daemonize it and make it start on boot<br>chkconfig puppet on<br>puppet agent — daemonize




This will have sent the client certificate to the master server, all you have to do now is sign it. On Puppet Master ……



    
    puppet cert list<br>puppet cert sign — all




and then test on the Puppet client ……



    
    puppet agent — test




