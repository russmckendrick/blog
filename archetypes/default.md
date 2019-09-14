---
title: "{{ replace .Name "-" " " | title }}"
summary: ""
author: "Russ McKendrick"
date: {{ .Date }}
image: "assets/headers/{{ replace .Name ".md" ".png" | title }}"
comments: true
draft: true
categories:
  - Tech
tags: 
  - Azure
---