---
title: "Jekyll Snippets"
description: "Explore handy Jekyll snippets for enhancing static site generation, including unique presentation of the latest post and consistent post excerpts."
author: "Russ Mckendrick"
date: 2014-02-02T12:00:00.000Z
lastmod: 2021-07-31T12:31:10+01:00
tags:
    - "Code"
    - "Tools"
cover:
    image: "/img/2014-02-02_jekyll-snippets_0.png" 
    alt: "Explore handy Jekyll snippets for enhancing static site generation, including unique presentation of the latest post and consistent post excerpts."
images:
 - "/img/2014-02-02_jekyll-snippets_0.png"
aliases:
- "/jekyll-snippets-c0192a5f3f6d"

---

Had a go at converting a mostly static but dynamically rendered site to use Jekyll yesterday, it was a lot more straight forward than I thought it was going to be.

As part of the conversion I needed to display the first post differently, after consulting the all knowing Google I settled on the following method;

```
Getting just the latest post;

```html
{% for post in site.posts offset: 0 limit: 1 %}
<div class="some-style">
<a href="{{post.url}}">
<h3 class='news-title'>{{ post.title }}</h3>
<span class='news-date'>{{ post.date | date_to_string }}</span>
</a>
<p>{{ page.excerpt }} <a href='{{post.url}}'><span class='read-more'> Read more</span></a></p>
</div>
{% endfor %}
```

Getting the rest of the posts;

```html
{% for post in site.posts offset: 1 limit: 4 %}
<div class="some-other-style">
<a href="{{post.url}}">
<h3 class='news-title'>{{ post.title }}</h3>
<span class='news-date'>{{ post.date | date_to_string }}</span>
</a>
<p>{{ page.excerpt }} <a href='{{post.url}}'><span class='read-more'> Read more</span></a></p>
</div>
{% endfor %}
```

that worked apart from I need more consistancy with the `page.excerpt` to keep things a little more uniform, the following code fitted the bill nicely;

```
{{ post.content | strip_html | truncatewords:75 }}
```

it even added `...` to the end automagically.
```

Also, if you don’t know what Jekyll is then have a look at [the website](http://jekyllrb.com) or dive straight in with the following simple install guide above.

I will keep the [Gist](https://gist.github.com/russmckendrick/8768334) updated as I do more stuff.