---
title: "What did I listen to in week {{ week_number }}?"
date: "{{ date }}"
draft: false
summary: "{{ summary }}"
cover:
    image: "/img/weekly-tunes-{{ random_number }}.png"
    relative: false
tags:
    - "Vinyl"
---

{% raw %}{{< notice note >}}{% endraw %}
This is what GPT had to say this about what I listened to last week; it is auto-generated and might not be 💯% factual.
{% raw %}{{< /notice >}}{% endraw %}

{% raw %}{{< gallery match="artists/*" sortOrder="desc" rowHeight="150" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}{% endraw %}

{{ gpt3_post }}

## Top Artists (Week {{ week_number }})

{% for artist, count in top_artists -%}
{%- if artist_info.get(artist) and artist_info[artist].get('artist_link') -%}
- [{{ artist }}]({{ artist_info[artist].artist_link }}) ({{ count }} plays)
{% else -%}
- {{ artist }} ({{ count }} plays)
{% endif -%}
{%- endfor %}

## Top Albums (Week {{ week_number }})

{% for (artist, album), count in top_albums -%}
{% if album_info.get((artist, album)) and album_info[(artist, album)].get('album_link') -%}
- [{{ album }}]({{ album_info[(artist, album)].album_link }}) by {{ artist }}
{% else -%}
- {{ album }} by {{ artist }}
{% endif %}
{%- endfor %}

{% raw %}{{< gallery match="albums/*" sortOrder="desc" rowHeight="150" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=flase >}}{% endraw %}