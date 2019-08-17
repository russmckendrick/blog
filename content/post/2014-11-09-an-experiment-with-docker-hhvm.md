---
author: Russ McKendrick
comments: true
date: 2014-11-09 12:00:00+00:00
image: assets/posts/54995-1wuw41wqdexz0au4qmvhfmw.png
title: An Experiment with Docker & HHVM
categories:
  - Tech
tags:
  - CentOS
  - Docker
  - HHVM
  - PHP
---

Now the dev team at [work](https://reconnix.com) have moved over to using Docker we decided to have some fun.

An internal system we use is based on [Drupal7](https://www.drupal.org/drupal-7.0), the development version of the site has a [NGINX / PHP 5.4 container](https://registry.hub.docker.com/u/russmckendrick/nginx-php/) running in front of it. We have been hearing alot about [HHVM](http://hhvm.com) so why not try building a container and seeing if it our codebase works?

First off, as I prefer to use [CentOS](https://media-glass.es/2014/08/03/operating-system-snob/), I needed to find a way of getting HHVM installed which wouldn’t take hours (a build from source can notoriously take hours) as I was on the clock. Luckily for me someone had [pushed a package](https://copr.fedoraproject.org/coprs/no1youknowz/hhvm-repo/) to [Copr](https://copr.fedoraproject.org/coprs/) meaning I could do a yum install and quickly adapt the [Dockerfile](http://docs.docker.com/reference/builder/) I already had in place for PHP 5.4 changing it from ….

    
    ### Dockerfile
    #
    # See <a href="https://github.com/russmckendrick/docker/" target="_blank" data-href="https://github.com/russmckendrick/docker/">https://github.com/russmckendrick/docker/</a>



    
    FROM russmckendrick/base:latest
    MAINTAINER Russ McKendrick <russ@mckendrick.io>



    
    ADD nginx.repo /etc/yum.repos.d/
    RUN yum -y install nginx mariadb php php-fpm php-mysql php-pdo php-devel php-gd php-pecl-memcache php-pspell php-snmp php-xmlrpc php-xml php-mcrypt php-mbstring php-imap php-pecl-xdebug php-pecl-xhprof python-setuptools && yum clean all
    RUN easy_install pip && pip install “pip>=1.4,<1.5” — upgrade && pip install supervisor
    RUN useradd webserver -u 666 && gpasswd -a webserver apache
    ADD conf-supervisord.conf /etc/supervisord.conf
    ADD default.conf /etc/nginx/conf.d/default.conf
    RUN curl -sS <a href="https://getcomposer.org/installer" target="_blank" data-href="https://getcomposer.org/installer">https://getcomposer.org/installer</a> | php && mv composer.phar /usr/local/bin/composer
    ADD run /usr/local/bin/
    RUN chmod +x /usr/local/bin/run
    CMD [“/usr/local/bin/run”]


…. to ….

    
    ### Dockerfile
    #
    # See <a href="https://github.com/russmckendrick/docker/" target="_blank" data-href="https://github.com/russmckendrick/docker/">https://github.com/russmckendrick/docker/</a>



    
    FROM russmckendrick/base:latest
    MAINTAINER Russ McKendrick <russ@mckendrick.io>



    
    ADD nginx.repo /etc/yum.repos.d/
    ADD hhvm.repo /etc/yum.repos.d/
    RUN yum -y install yum-plugin-replace
    RUN yum -y install nginx mariadb hhvm python-setuptools postfix gcc make && yum clean all
    RUN easy_install pip && pip install “pip>=1.4,<1.5” — upgrade && pip install supervisor
    RUN groupadd apache && useradd webserver -u 666 && gpasswd -a webserver apache && mkdir -p /var/www/html/ && chown -R webserver:webserver /var/www/html/
    ADD index.php /var/www/html/
    ADD conf-supervisord.conf /etc/supervisord.conf
    ADD default.conf /etc/nginx/conf.d/default.conf
    ADD run /usr/local/bin/
    RUN chmod +x /usr/local/bin/run
    CMD [“/usr/local/bin/run”]


…. and hey presto a working HHVM image. Now all we had to do was change the reference to the container being pulled down in the [fig.yml](http://www.fig.sh/yml.html) file for the project. After doing a fig stop and then fig rm we did a fig up -d and waited ….
![docker-success_x7gdrq](https://cdn-images-1.medium.com/max/800/0*VYLx35MbHaAUP5Mv.jpg)
…. yep, it just worked. Within 30 minutes we had decided to try HHVM, built a [Docker Image](https://registry.hub.docker.com/u/russmckendrick/nginx-hhvm/) and put it in-front of our codebase.

Due to actually needing to get on with some work we could not do much in-depth testing and simply put the PHP 5.4 container back in front of the codebase.

To achieve this without Docker it would have meant taking the following steps ….



 	
  * Commission a new Dev VM

 	
  * Install the new software stack

 	
  * Configure the new software stack

 	
  * Copy the codebase and database backup to the new VM

 	
  * Test, play then remove VM


…. all of which would have taken a good few hours of back & forth with the development and operations team.

Finally, this seems as a good as place as any to embed a copy of a presentation I have produced on how we at [Reconnix](https://reconnix.com) are using Docker ….

[embed]https://www.slideshare.net/slideshow/embed_code/40340710[/embed]
