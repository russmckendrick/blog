---
title: "What did I listen to in week {{ week_number }}?"
date: "{{ date }}"
draft: false
summary: "{{ summary }}"
---

{% raw %}{{< gallery columns="4" >}}{% endraw %}
{%- for artist, count in top_artists %}
{% if artist_info.get(artist) and artist_info[artist].get('artist_image') -%}
{%- raw %}{{< img src="{% endraw %}{{ artist_info[artist].artist_image }}{%- raw %}" alt="{% endraw %}{{ artist | capitalize }}{%- raw %}" >}}{% endraw -%}
{%- endif -%}
{%- endfor -%}
{% raw %}{{< /gallery >}}{% endraw %}

{% raw %}{{< notice info >}}{% endraw %}
This is what GPT had to say about this weeks music selection it is auto generated and left here for posterity.
{% raw %}{{< /notice >}}{% endraw %}

{{ gpt3_summary }}

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

{% raw %}{{< gallery columns="4" >}}{% endraw %}
{% for (artist, album), count in top_albums %}{% if album_info.get((artist, album)) and album_info[(artist, album)].get('cover_image') -%}
{%- raw %}{{< img src="{% endraw %}{{ album_info[(artist, album)].cover_image }}{%- raw %}" alt="{% endraw %}{{ album }} by {{ artist }}{%- raw %}" >}}{% endraw %}
{% endif -%}
{% endfor -%}
{% raw %}{{< /gallery >}}{% endraw %}