---
title: "Stop hardcoding network values in Ansible"
author: "Russ McKendrick"
date: 2024-09-21T09:00:00+01:00
description: ""
draft: true
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: ""
tags:
  - "Ansible"
  - "Cloud"
keywords:
  - "Ansible"
  - "Networking"
  - "Microsoft Azure"
  - "Amazon Web Services"
---

## Working with Networks dynamically in Ansible

### A Basic Playbook


{{< ide title="Something here" lang="YAML" >}}
```yaml {linenos=true}
---

- name: "Network and Subnet Information Playbook"
  hosts: localhost
  gather_facts: true
  vars:
    cidr_range: "10.0.0.0/24"
    subnets:
      - name: "subnet1"
        cidr_size: 27
      - name: "subnet2"
        cidr_size: 27
      - name: "subnet3"
        cidr_size: 27
      - name: "subnet4"
        cidr_size: 27

  tasks:
    - name: "Generate network information"
      ansible.builtin.set_fact:
        network_info:
          cidr: "{{ cidr_range }}"
          available_ips: "{{ (cidr_range | ansible.utils.ipaddr('size')) - 2 }}"

    - name: "Generate subnet information"
      ansible.builtin.set_fact:
        subnet_info: "{{ subnet_info | default([]) + [{'name': item.0.name, 'cidr': cidr_range | ansible.utils.ipsubnet(item.0.cidr_size, item.1)}] }}"
      loop: "{{ subnets | zip_longest(range(subnets|length), fillvalue='')|list }}"

    - name: "Calculate detailed subnet information"
      ansible.builtin.set_fact:
        subnet_details: "{{ subnet_details | default([]) + [subnet | combine({
          'network': (subnet.cidr | ansible.utils.ipaddr('network')),
          'netmask': (subnet.cidr | ansible.utils.ipaddr('netmask')),
          'broadcast': (subnet.cidr | ansible.utils.ipaddr('broadcast')),
          'first_ip': (subnet.cidr | ansible.utils.ipaddr('1') | ansible.utils.ipaddr('address')),
          'last_ip': (subnet.cidr | ansible.utils.ipaddr('-2') | ansible.utils.ipaddr('address'))
        })] }}"
      loop: "{{ subnet_info }}"
      loop_control:
        loop_var: subnet

    - name: "Display network information"
      vars:
        network_info_output: |
          ===============================
          Network Information
          ===============================
          CIDR Range: {{ network_info.cidr }}
          Available IP Addresses: {{ network_info.available_ips }}

          Subnet Overview:
          {% for subnet in subnet_info %}
          - {{ subnet.name }}: {{ subnet.cidr }}
          {% endfor %}
      ansible.builtin.debug:
        msg: "{{ network_info_output.split('\n') }}"

    - name: "Display detailed subnet information"
      vars:
        detailed_info: |
          ===============================
          Detailed Subnet Information
          ===============================
          {% for subnet in subnet_details %}
          {{ subnet.name }}:
            CIDR: {{ subnet.cidr }}
            Network: {{ subnet.network }}
            Netmask: {{ subnet.netmask }}
            Broadcast: {{ subnet.broadcast }}
            First Usable IP: {{ subnet.first_ip }}
            Last Usable IP: {{ subnet.last_ip }}
          {% if not loop.last %}

          {% endif %}
          {% endfor %}
      ansible.builtin.debug:
        msg: "{{ detailed_info.split('\n') }}"
```
{{< /ide >}}
