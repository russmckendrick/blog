---
title: "Dynamic Network Config in Ansible: Local to Azure VNet"
author: "Russ McKendrick"
date: 2024-09-21T09:00:00+01:00
description: "Learn to use Ansible's network utilities for dynamic subnet configuration and Azure VNet deployment. Boost your infrastructure-as-code flexibility with practical examples."
draft: false
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
  - "ansible.utils.ipsubnet"
  - "ansible.utils.ipaddr"
---

If like me you have been guilty of hard coding all of your network configuration in Ansible variables like this ...

{{< ide title="Hard Code Values" lang="YAML" >}}
```yaml {linenos=true}
  vars:
    network:
      full_range: "10.0.0.0/24"
      subnets:
        - name: "subnet1"
          address_range: "10.0.0.0/27"
        - name: "subnet2"
          address_range: "10.0.0.32/27"
        - name: "subnet3"
          address_range: "10.0.0.64/27"
        - name: "subnet4"
          address_range: "10.0.0.96/27"
```
{{< /ide >}}<br>

... then this post is for you. Not that I am saying that is wrong, but it does mean if you want to the network range you are using them you also have to update it in four other places.

## Working with network ranges dynamically in Ansible

Instead of hardcoding subnet addresses, we can leverage Ansible's powerful filters and plugins to calculate network and subnet information dynamically. This approach enhances the flexibility and maintainability of your playbooks.

### A Basic Playbook

Let's start by creating a playbook that calculates subnet addresses based on a given network range and subnet sizes.

{{< ide title="site.yml" lang="YAML" >}}
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

### Breaking Down the Playbook

The playbook is designed to generate and display network and subnet information based on a given CIDR range. Let's break it down:

1. Playbook Header:
   - Name: "Network and Subnet Information Playbook"
   - Hosts: localhost (runs on the local machine)
   - gather_facts: true (collects system information)

2. Variables:
   - cidr_range: Defines the main network CIDR (10.0.0.0/24)
   - subnets: A list of 4 subnets, each with a name and CIDR size (27 bits)

3. Tasks:
   The playbook contains several tasks that generate and display network information.

### Tasks

1. Generate network information:
   - Creates a 'network_info' fact containing the CIDR range and available IP addresses
   - Uses the 'ansible.utils.ipaddr' filter to calculate the number of available IPs

2. Generate subnet information:
   - Creates a 'subnet_info' list containing each subnet's name and CIDR
   - Uses 'ansible.utils.ipsubnet' to calculate subnet CIDRs
   - Utilizes a loop with zip_longest to iterate over subnets

3. Calculate detailed subnet information:
   - Expands on 'subnet_info' to create 'subnet_details'
   - Adds network, netmask, broadcast, first IP, and last IP for each subnet
   - Uses various 'ansible.utils.ipaddr' filters to calculate these values

4. Display network information:
   - Creates a formatted output string with network overview
   - Uses ansible.builtin.debug to display the information

5. Display detailed subnet information:
   - Creates a formatted output string with detailed subnet information
   - Uses ansible.builtin.debug to display the information

### Understanding the ansible.utils.ipsubnet function

The 'ansible.utils.ipsubnet' function is used to calculate subnet information based on a given network and subnet size. In this playbook, it's used as follows:


{{< ide title="Dynamic Network Configuration" lang="YAML" >}}
```yaml {linenos=true}
cidr_range | ansible.utils.ipsubnet(item.0.cidr_size, item.1)
```
{{< /ide >}}<br>

- cidr_range: The base network (10.0.0.0/24)
- item.0.cidr_size: The size of the subnet (27 in this case)
- item.1: The index of the current subnet (0, 1, 2, 3)

This function calculates the CIDR for each subnet within the main network. For example:

- Subnet 1: 10.0.0.0/27
- Subnet 2: 10.0.0.32/27
- Subnet 3: 10.0.0.64/27
- Subnet 4: 10.0.0.96/27

### Understanding the ansible.utils.ipaddr function

The 'ansible.utils.ipaddr' function is a versatile filter for IP address manipulation. In this playbook, it's used in several ways, as you can see from the examples below the 'ansible.utils.ipaddr' function accepts various options to perform different operations on IP addresses and networks, making it a powerful tool for network-related tasks in Ansible playbooks.

#### Calculating available IPs

{{< ide title="Dynamic Network Configuration" lang="YAML" >}}
```yaml {linenos=true}
 cidr_range | ansible.utils.ipaddr('size')
```
{{< /ide >}}<br>
This calculates the total number of IP addresses in the CIDR range.

#### Getting network address
{{< ide title="Dynamic Network Configuration" lang="YAML" >}}
```yaml {linenos=true}
 subnet.cidr | ansible.utils.ipaddr('network')
 ```
 {{< /ide >}}<br>
 This extracts the network address from a CIDR.

#### Getting netmask   
{{< ide title="Dynamic Network Configuration" lang="YAML" >}}
```yaml {linenos=true}
subnet.cidr | ansible.utils.ipaddr('netmask')
```
{{< /ide >}}<br>
This calculates the subnet mask for a given CIDR.

#### Getting broadcast address   
{{< ide title="Dynamic Network Configuration" lang="YAML" >}}
```yaml {linenos=true}
subnet.cidr | ansible.utils.ipaddr('broadcast')
```
{{< /ide >}}<br>
This calculates the broadcast address for a subnet.

#### Calculating first and last usable IPs
{{< ide title="Dynamic Network Configuration" lang="YAML" >}}
```yaml {linenos=true}
subnet.cidr | ansible.utils.ipaddr('1') | ansible.utils.ipaddr('address')
subnet.cidr | ansible.utils.ipaddr('-2') | ansible.utils.ipaddr('address')
```
{{< /ide >}}<br>
These calculate the first and last usable IP addresses in a subnet.

### Running the Playbook

Running the `site.yml` playbook using the following:

{{< terminal title="Running the playbook" >}}
```text
ansible-playbook site.yml
```
{{< /terminal >}}

Gives the following output:

{{< terminal title="The Full Output" >}}
```text
[WARNING]: No inventory was parsed, only implicit localhost is available
[WARNING]: provided hosts list is empty, only localhost is available. Note that the implicit
localhost does not match 'all'

PLAY [Network and Subnet Information Playbook] *************************************

TASK [Gathering Facts] *************************************************************
ok: [localhost]

TASK [Generate network information] ************************************************
ok: [localhost]

TASK [Generate subnet information] *************************************************
ok: [localhost] => (item=[{'name': 'subnet1', 'cidr_size': 27}, 0])
ok: [localhost] => (item=[{'name': 'subnet2', 'cidr_size': 27}, 1])
ok: [localhost] => (item=[{'name': 'subnet3', 'cidr_size': 27}, 2])
ok: [localhost] => (item=[{'name': 'subnet4', 'cidr_size': 27}, 3])

TASK [Calculate detailed subnet information] ***************************************
ok: [localhost] => (item={'name': 'subnet1', 'cidr': '10.0.0.0/27'})
ok: [localhost] => (item={'name': 'subnet2', 'cidr': '10.0.0.32/27'})
ok: [localhost] => (item={'name': 'subnet3', 'cidr': '10.0.0.64/27'})
ok: [localhost] => (item={'name': 'subnet4', 'cidr': '10.0.0.96/27'})

TASK [Display network information] *************************************************
ok: [localhost] => {
    "msg": [
        "===============================",
        "Network Information",
        "===============================",
        "CIDR Range: 10.0.0.0/24",
        "Available IP Addresses: 254",
        "",
        "Subnet Overview:",
        "- subnet1: 10.0.0.0/27",
        "- subnet2: 10.0.0.32/27",
        "- subnet3: 10.0.0.64/27",
        "- subnet4: 10.0.0.96/27",
        ""
    ]
}

TASK [Display detailed subnet information] ****************************************
ok: [localhost] => {
    "msg": [
        "===============================",
        "Detailed Subnet Information",
        "===============================",
        "subnet1:",
        "  CIDR: 10.0.0.0/27",
        "  Network: 10.0.0.0",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.31",
        "  First Usable IP: 10.0.0.1",
        "  Last Usable IP: 10.0.0.30",
        "",
        "subnet2:",
        "  CIDR: 10.0.0.32/27",
        "  Network: 10.0.0.32",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.63",
        "  First Usable IP: 10.0.0.33",
        "  Last Usable IP: 10.0.0.62",
        "",
        "subnet3:",
        "  CIDR: 10.0.0.64/27",
        "  Network: 10.0.0.64",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.95",
        "  First Usable IP: 10.0.0.65",
        "  Last Usable IP: 10.0.0.94",
        "",
        "subnet4:",
        "  CIDR: 10.0.0.96/27",
        "  Network: 10.0.0.96",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.127",
        "  First Usable IP: 10.0.0.97",
        "  Last Usable IP: 10.0.0.126",
        ""
    ]
}

PLAY RECAP ************************************************************************
localhost: ok=6  changed=0 unreachable=0  failed=0  skipped=0  rescued=0  ignored=0
```
{{< /terminal >}}

As you can see, we are getting quite alot of information about the network with only telling Ansible the CIDR range to use and the number of subnets and their size.

## Deploying an Azure Virtual Network

This Ansible playbook automates the creation of an Azure Virtual Network (VNet) and multiple subnets. It leverages the same network calculation concepts as our previous example, applying them to real Azure resources. The playbook creates a VNet with a specified CIDR range and dynamically generates subnets based on given parameters. It uses Azure Resource Manager modules to interact with Azure, and concludes by displaying detailed information about the created network infrastructure - which you probably would never include in your own Playbooks - I have included it here so we can see the output.

This automation streamlines the process of setting up complex network configurations in Azure, ensuring consistency and reducing manual errors.

The Playbook itself looks like the following:

### The Azure Vnet Playbook

{{< ide title="azure.yml" lang="YAML" >}}
```yaml {linenos=true}
---

- name: "Create Azure Virtual Network and Subnets"
  hosts: localhost
  connection: local
  gather_facts: false

  vars:
    location: "uksouth"
    resource_group: "rg-ansible-demo-uks"
    vnet_name: "vnet-ansible-demo-uks"
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
    - name: "Ensure resource group exists"
      azure.azcollection.azure_rm_resourcegroup:
        name: "{{ resource_group }}"
        location: "{{ location }}"

    - name: "Calculate subnet CIDRs"
      ansible.builtin.set_fact:
        subnet_info: "{{ subnet_info | default([]) + [{'name': item.0.name, 'cidr': cidr_range | ansible.utils.ipsubnet(item.0.cidr_size, item.1)}] }}"
      loop: "{{ subnets | zip_longest(range(subnets|length), fillvalue='')|list }}"

    - name: "Create virtual network"
      azure.azcollection.azure_rm_virtualnetwork:
        resource_group: "{{ resource_group }}"
        name: "{{ vnet_name }}"
        address_prefixes_cidr:
          - "{{ cidr_range }}"

    - name: "Create subnets"
      azure.azcollection.azure_rm_subnet:
        resource_group: "{{ resource_group }}"
        name: "{{ item.name }}"
        address_prefix_cidr: "{{ item.cidr }}"
        virtual_network_name: "{{ vnet_name }}"
      loop: "{{ subnet_info }}"

    - name: "Gather VNet facts"
      azure.azcollection.azure_rm_virtualnetwork_info:
        resource_group: "{{ resource_group }}"
        name: "{{ vnet_name }}"
      register: vnet_facts

    - name: "Gather VNet facts"
      azure.azcollection.azure_rm_virtualnetwork_info:
        resource_group: "{{ resource_group }}"
        name: "{{ vnet_name }}"
      register: vnet_facts

    - name: "Calculate detailed subnet information"
      ansible.builtin.set_fact:
        subnet_details: "{{ subnet_details | default([]) + [subnet | combine({
          'network': (subnet.address_prefix | ansible.utils.ipaddr('network')),
          'netmask': (subnet.address_prefix | ansible.utils.ipaddr('netmask')),
          'broadcast': (subnet.address_prefix | ansible.utils.ipaddr('broadcast')),
          'first_ip': (subnet.address_prefix | ansible.utils.ipaddr('1') | ansible.utils.ipaddr('address')),
          'last_ip': (subnet.address_prefix | ansible.utils.ipaddr('-2') | ansible.utils.ipaddr('address'))
        })] }}"
      loop: "{{ vnet_facts.virtualnetworks[0].subnets }}"
      loop_control:
        loop_var: subnet

    - name: "Display detailed VNet and Subnet information"
      vars:
        detailed_info: |
          ===============================
          Virtual Network Information
          ===============================
          Name: {{ vnet_name }}
          Resource Group: {{ resource_group }}
          Location: {{ location }}
          Address Space: {{ vnet_facts.virtualnetworks[0].address_prefixes[0] }}

          ===============================
          Detailed Subnet Information
          ===============================
          {% for subnet in subnet_details %}
          {{ subnet.name }}:
            CIDR: {{ subnet.address_prefix }}
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
{{< /ide >}}<br>

### Running the Playbook

Running the `azure.yml` playbook using the following:

{{< terminal title="Running the playbook" >}}
```text
ansible-playbook site.yml
```
{{< /terminal >}}

Gives the following output:

{{< terminal title="The Full Output" >}}
```text
PLAY [Create Azure Virtual Network and Subnets] ************************************

TASK [Ensure resource group exists] ************************************************
changed: [localhost]

TASK [Calculate subnet CIDRs] ******************************************************
ok: [localhost] => (item=[{'name': 'subnet1', 'cidr_size': 27}, 0])
ok: [localhost] => (item=[{'name': 'subnet2', 'cidr_size': 27}, 1])
ok: [localhost] => (item=[{'name': 'subnet3', 'cidr_size': 27}, 2])
ok: [localhost] => (item=[{'name': 'subnet4', 'cidr_size': 27}, 3])

TASK [Create virtual network] ******************************************************
changed: [localhost]

TASK [Create subnets] ***************************************************************
changed: [localhost] => (item={'name': 'subnet1', 'cidr': '10.0.0.0/27'})
changed: [localhost] => (item={'name': 'subnet2', 'cidr': '10.0.0.32/27'})
changed: [localhost] => (item={'name': 'subnet3', 'cidr': '10.0.0.64/27'})
changed: [localhost] => (item={'name': 'subnet4', 'cidr': '10.0.0.96/27'})

TASK [Gather VNet facts] ************************************************************
ok: [localhost]

TASK [Gather VNet facts] *************************************************************
ok: [localhost]

TASK [Calculate detailed subnet information] *****************************************
ok: [localhost] => (item={'id': '/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-ansible-demo-uks/providers/Microsoft.Network/virtualNetworks/vnet-ansible-demo-uks/subnets/subnet1', 'name': 'subnet1', 'provisioning_state': 'Succeeded', 'address_prefix': '10.0.0.0/27', 'address_prefixes': None, 'network_security_group': None, 'route_table': None})
ok: [localhost] => (item={'id': '/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-ansible-demo-uks/providers/Microsoft.Network/virtualNetworks/vnet-ansible-demo-uks/subnets/subnet2', 'name': 'subnet2', 'provisioning_state': 'Succeeded', 'address_prefix': '10.0.0.32/27', 'address_prefixes': None, 'network_security_group': None, 'route_table': None})
ok: [localhost] => (item={'id': '/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-ansible-demo-uks/providers/Microsoft.Network/virtualNetworks/vnet-ansible-demo-uks/subnets/subnet3', 'name': 'subnet3', 'provisioning_state': 'Succeeded', 'address_prefix': '10.0.0.64/27', 'address_prefixes': None, 'network_security_group': None, 'route_table': None})
ok: [localhost] => (item={'id': '/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-ansible-demo-uks/providers/Microsoft.Network/virtualNetworks/vnet-ansible-demo-uks/subnets/subnet4', 'name': 'subnet4', 'provisioning_state': 'Succeeded', 'address_prefix': '10.0.0.96/27', 'address_prefixes': None, 'network_security_group': None, 'route_table': None})

TASK [Display detailed VNet and Subnet information] **********************************
ok: [localhost] => {
    "msg": [
        "===============================",
        "Virtual Network Information",
        "===============================",
        "Name: vnet-ansible-demo-uks",
        "Resource Group: rg-ansible-demo-uks",
        "Location: uksouth",
        "Address Space: 10.0.0.0/24",
        "",
        "===============================",
        "Detailed Subnet Information",
        "===============================",
        "subnet1:",
        "  CIDR: 10.0.0.0/27",
        "  Network: 10.0.0.0",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.31",
        "  First Usable IP: 10.0.0.1",
        "  Last Usable IP: 10.0.0.30",
        "",
        "subnet2:",
        "  CIDR: 10.0.0.32/27",
        "  Network: 10.0.0.32",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.63",
        "  First Usable IP: 10.0.0.33",
        "  Last Usable IP: 10.0.0.62",
        "",
        "subnet3:",
        "  CIDR: 10.0.0.64/27",
        "  Network: 10.0.0.64",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.95",
        "  First Usable IP: 10.0.0.65",
        "  Last Usable IP: 10.0.0.94",
        "",
        "subnet4:",
        "  CIDR: 10.0.0.96/27",
        "  Network: 10.0.0.96",
        "  Netmask: 255.255.255.224",
        "  Broadcast: 10.0.0.127",
        "  First Usable IP: 10.0.0.97",
        "  Last Usable IP: 10.0.0.126",
        ""
    ]
}

PLAY RECAP ***************************************************************************
localhost:   ok=8  changed=3  unreachable=0  failed=0  skipped=0  rescued=0  ignored=0
```
{{< /terminal >}}

As you can see, we have the VNet and subnets all created as well. 

### Extending the Playbook further

We could extend the playbook further, for example we could deploy an Azure Application Gateway into one of the subnets and get its static internal IP address by figuring out the forth IP address in `subnet1` by using:

{{< ide title="Adding an Azure Application Gateway" lang="YAML" >}}
```yaml {linenos=true}
- name: "Calculate 4th IP address of subnet1"
  ansible.builtin.set_fact:
    appgw_ip: "{{ subnet_details | selectattr('name', 'equalto', 'subnet1') | map(attribute='cidr') | first | ansible.utils.ipaddr('4') | ansible.utils.ipaddr('address') }}"

- name: "Create public IP address for Application Gateway"
  azure.azcollection.azure_rm_publicipaddress:
    resource_group: "{{ resource_group }}"
    name: "pip-agw-ansible-demo-uks"
    allocation_method: Static
    sku: Standard

- name: "Create Application Gateway"
  azure.azcollection.azure_rm_applicationgateway:
    resource_group: "{{ resource_group }}"
    name: "pip-agw-ansible-demo-uks"
    sku:
      name: Standard_v2
      tier: Standard_v2
    gateway_ip_configurations:
      - subnet:
          id: "{{ vnet_facts.virtualnetworks[0].subnets | selectattr('name', 'equalto', 'subnet1') | map(attribute='id') | first }}"
        name: appGatewayIpConfig
    frontend_ip_configurations:
      - public_ip_address: "pip-agw-ansible-demo-uks"
        name: appGatewayFrontendIP
    frontend_ports:
      - port: 80
        name: appGatewayFrontendPort
    backend_address_pools:
      - name: appGatewayBackendPool
    backend_http_settings_collection:
      - port: 80
        protocol: Http
        cookie_based_affinity: Disabled
        name: appGatewayBackendHttpSettings
    http_listeners:
      - frontend_ip_configuration: appGatewayFrontendIP
        frontend_port: appGatewayFrontendPort
        name: appGatewayHttpListener
    request_routing_rules:
      - rule_type: Basic
        http_listener: appGatewayHttpListener
        backend_address_pool: appGatewayBackendPool
        backend_http_settings: appGatewayBackendHttpSettings
        name: rule1
    ip_configurations:
      - subnet:
          id: "{{ vnet_facts.virtualnetworks[0].subnets | selectattr('name', 'equalto', 'subnet1') | map(attribute='id') | first }}"
        private_ip_address: "{{ appgw_ip }}"
        private_ip_allocation_method: Static
```
{{< /ide >}}<br>

## Summary

In this post, we've explored the power of dynamic network configuration in Ansible, moving beyond hardcoded values to create more flexible and maintainable playbooks. We started with a local playbook that calculates subnet information based on a given CIDR range, utilizing Ansible's powerful `ansible.utils.ipsubnet` and `ansible.utils.ipaddr` functions.

We then applied these concepts to a real-world scenario, creating an Azure Virtual Network with multiple subnets. This approach not only simplifies our code but also makes it more adaptable to changes in network requirements.

Key takeaways include:
1. Using `ansible.utils.ipsubnet` to dynamically calculate subnet CIDRs
2. Leveraging `ansible.utils.ipaddr` for detailed IP address manipulation
3. Applying these techniques to Azure VNet and subnet creation
4. Extending the playbook to include advanced resources like Azure Application Gateway

By adopting these practices, you can create more robust, flexible, and error-resistant network configurations in your Ansible playbooks. Whether you're working with local environments or cloud providers like Azure, these techniques will help you manage network infrastructure more effectively. I would encourage you to experiment with these methods in your own projects. As you become more comfortable with dynamic network calculations, you'll find that your infrastructure-as-code becomes more powerful and adaptable to changing requirements.

## Audio Summary

{{< notice tip "Please note" >}}
The following audio summary of this blog post was generated by [NotebookLM](https://notebooklm.google).
{{< /notice >}}

{{< audio mp3="2024-09-21-dynamic-network-config-in-ansible-local-to-azure-vnet.mp3" >}}
