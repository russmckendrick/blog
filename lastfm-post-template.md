---
title: "{{ title }}"
author: "Russ McKendrick"
date: "{{ date }}"
description: "{{ summary }}"
draft: false
robotsNoIndex: false
showToc: true
ShowRelated: false
cover:
    image: "/img/weekly-tunes-{{ random_number }}.png"
    relative: false
    alt: "{{ summary }}"
tags:
    - "Listened"
keywords:
{% for (artist, album), count in top_albums %}
- "{{ artist }}"
- "{{ album }}"
{%- endfor %}
---

{% raw %}{{< notice note >}}{% endraw %}
This is what GPT had to say this about what I listened to last week; it is auto-generated and might not be 💯% factual.
{% raw %}{{< /notice >}}{% endraw %}

{% raw %}{{< gallery match="artists/*" sortOrder="desc" rowHeight="250" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}{% endraw %}

{{ blog_post }}

## Top Artists (Week {{ week_number }})

{% for artist, count in top_artists -%}
{%- set artist_key = artist|lower -%}
{%- if artist_info.get(artist_key) and artist_info[artist_key].get('artist_link') -%}
- [{{ artist }}]({{ artist_info[artist_key].artist_link }}) ({{ count }} plays)
{% else -%}
- {{ artist }} ({{ count }} plays)
{% endif -%}
{%- endfor %}

## Top Albums (Week {{ week_number }})

{ for (artist, album), count in top_albums -%}
{%- set album_key = (artist|lower, album|lower) -%}
{%- set artist_key = artist|lower -%}
{%- if album_info.get(album_key) and album_info[album_key].get('album_link') -%}
{%- if artist_info.get(artist_key) and artist_info[artist_key].get('artist_link') -%}
- [{{ album }}]({{ album_info[album_key].album_link }}) by [{{ artist }}]({{ artist_info[artist_key].artist_link }})
{%- else -%}
- [{{ album }}]({{ album_info[album_key].album_link }}) by {{ artist }}
{%- endif -%}
{%- else -%}
{%- if artist_info.get(artist_key) and artist_info[artist_key].get('artist_link') -%}
- {{ album }} by [{{ artist }}]({{ artist_info[artist_key].artist_link }})
{%- else -%}
- {{ album }} by {{ artist }}
{%- endif -%}
{%- endif %}
{% endfor %}

{% raw %}{{< gallery match="albums/*" sortOrder="desc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=flase >}}{% endraw %}