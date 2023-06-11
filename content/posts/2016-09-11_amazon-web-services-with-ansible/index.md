---
title: "Amazon Web Services with Ansible"
author: "Russ Mckendrick"
date: 2016-09-11T15:45:16.000Z
lastmod: 2021-07-31T12:34:12+01:00

tags:
 - Infrastructure As Code
 - Ansible
 - AWS
 - Cloud

cover:
    image: "/img/2016-09-11_amazon-web-services-with-ansible_0.png" 
images:
 - "/img/2016-09-11_amazon-web-services-with-ansible_0.png"


aliases:
- "/amazon-web-services-with-ansible-5e07d7e0e387"

---

More and more I am having to not only think about how I would ensure that the infrastructure a service I am deploying on is highly available but also how I can manage its entire life-cycle in code.

I have tried several tools for this such as [Terraform](http://media-glass.es/tag/terraform/), [Puppet](/tag/puppet/) and [Ansible](/tag/ansible/), however over the last six months or so I have settled on Ansible.

After I first looked at it back in [December 2014](http://media-glass.es/2014/12/14/first-steps-with-ansible/) it has come on quite a lot, especially after the [version 2 release at the start of this year](https://www.ansible.com/blog/ansible-2.0-launch).

I have demo playbook I use when showing people how Ansible works, it targets Amazon Web Services and does the following;

- Launches an entire stack including creating a VPC and bootstrapped instances
- Ansible looks up your current public IP address using [ipify](https://ipify.org) and adds a rule so you can SSH to build the AMI.
- Finds the correct AMI for the region you defined in the enviroment file
- Uploads your public key, uses it to connect to the instance launched to build the AMI and then removes it once the AMI has been built.
- If you re-run the command with a different ami_name it will build a new AMI and do a rolling deploy the new instances from the newly built AMI.

It does this by executing the following roles;

- ec2-vpc: Creates the VPC
- ec2-sg: Configures the security groups
- ec2-ami-find: Files the AMI ID based on the variables you pass it
- ec2-single-instance-build (*): launches a temporary instance in the VPC above and installs the stack
- provision-users (*): Configures users on temporary instance
- provision-stack (*): Installs the software stack
- provision-code (*): Checkout and configure the application
- ec2-ami-build (*): Create an AMI of the above instance
- ec2-teardown (*): terminate the temporary instance we
- ec2-loadbalancer: Creates an Elastic Load Balancer
- ec2-asg: Creates and configures an Auto Scaling Group, then create a launch configuration using the AMI we have just built and attach it to the ASG

Steps marked with (*) are skipped if the AMI name variable we have passed when launching the playbook already exists, this is useful for rolling back when stuff hits the fan as all it does it re-attach the Launch Configuration for the previous AMI to the ASG and trigger a refresh of the instances.

As I have been working through creating the playbook to achieve the above there are few things I have to look-up so I thought I would post some of a solutions I found here.

#### Subnets & Subnet Groups

At one point I was hard coding variables for the subnets into the environment file in group_vars , while this worked great for VPCs which only had a single subnet range

```
subnet_elb:
 - { az: ‘a’, subnet: ‘192.168.0.0/24’ }
 - { az: ‘b’, subnet: ‘192.168.1.0/24’ }
 - { az: ‘c’, subnet: ‘192.168.2.0/24’
subnet_ec2:
 — { az: ‘a’, subnet: ‘192.168.3.0/24’ }
 — { az: ‘b’, subnet: ‘192.168.4.0/24’ }
 — { az: ‘c’, subnet: ‘192.168.5.0/24’ }
```

This means when it comes to creating the subnets I can use the use the with_items command to loop through the variables;

```
- name: create the EC2 subnets
  ec2_vpc_subnet:
   state: present
   vpc_id: "{{ vpc.vpc_id }}"
   cidr: "{{ item.subnet }}"
   az: "{{ ec2_region }}{{ item.az }}"
   region: "{{ ec2_region }}”
   with_items: "{{ subnet_ec2 }}"
  register: “subnets_ec2”

- name: register the IDs for the EC2 subnets
  set_fact:
  subnet_ec2_ids=”{{ subnets_ec2.results | map(attribute=’subnet.id’) | list }}”

- name: create the ELB subnets
  ec2_vpc_subnet:
   state: present
   vpc_id: “{{ vpc.vpc_id }}”
   cidr: “{{ item.subnet }}”
   az: “{{ ec2_region }}{{ item.az }}”
   region: “{{ ec2_region }}”
   with_items: “{{ subnet_elb }}”
  register: “subnets_elb”

- name: register the IDs for the ELB subnets
  set_fact: subnet_elb_ids=”{{ subnets_elb.results | map(attribute=’subnet.id’) | list }}”
```

Note that I am creating the subnets, registering the results when they have been created and then I setting a fact which contains just the subnet IDs.

This means when it comes to using doing something with the subnets, such as setting up a route for them on an internet gateway, I can do the following;

```

- name: create the internet gateway
  ec2_vpc_igw:
   vpc_id: “{{ vpc.vpc_id }}”
   state: present
   region: “{{ ec2_region }}”
  register: igw

- name: setup public subnet route table
  ec2_vpc_route_table:
   vpc_id: “{{ vpc.vpc_id }}”
   subnets: “{{ subnet_elb_ids + subnet_ec2_ids }}”
   routes:
    — dest: 0.0.0.0/0
      gateway_id: “{{ igw.gateway_id }}”
      region: “{{ ec2_region }}”
  register: public_route_table
```

As you can see, I am just using {{ subnet_elb_ids + subnet_ec2_ids }} to create a list of the all of the subnets from the two facts, it took me ages to figure that I could join lists like that.

This meant that I have more control at the variable level rather than having to edit the task if I wanted for example remove one of the Availability Zones from the deployment.

#### Security Groups

One thing I found when trying to apply the same logic to security groups was that if I used something like the following code;

```
firewall_elb:
 - { port: ‘443’, source: ‘0.0.0.0/0’ }
 - { port: ‘80’, source: ‘0.0.0.0/0’ }

- name: example ec2 group
  ec2_group:
   name: “ELB Group”
   description: “Rule to allow ELB traffic”
   vpc_id: “{{ vpc.vpc_id }}”
   region: “{{ ec2_region }}
   rules:
    — proto: tcp
      from_port: {{ item.port }}
      to_port: {{ item.port }}
      cidr_ip: {{ item.source }}
      with_items: “{{ firewall_elb }}”
  register: sg_elb
```

I would only ever have a single rule created once the playbook had run through. After much head scratching I realised that unlike other Ansible modules the ec2_group module required you to explicitly define the rules rather than loop over — which kind of makes sense after I had thought about it.

It turns out the [boto libary](http://docs.pythonboto.org/en/latest/), which is used by nearly all of the AWS module in Ansible, requires you to pass in all of the rules in one. If you pass them in one at a time it will simply think you are trying to update the existing rule set and overwrite the rule which is there.

To get around this I looked at using a template or creating my own python script to dynamically create the rules, which is typical always going for the hard solution first.

In the end I just went with defining the entire rule set as a variable !!!

```
firewall_elb:
 — proto: tcp
   from_port: 443
   to_port: 443
   cidr_ip: “0.0.0.0/0”
 — proto: tcp
   from_port: 80
   to_port: 80
   cidr_ip: “0.0.0.0/0”

- name: example ec2 group
  ec2_group:
   name: “ELB Group”
   description: “Rule to allow ELB traffic”
   vpc_id: “{{ vpc.vpc_id }}”
   region: “{{ ec2_region }}
   rules: “{{ firewall_elb }}”
  register: sg_elb
```

This was a lot less confusing to keep on top of as I just created a file calls firewall.yml and loaded that as part of the playbook :)

#### Elastic Load Balancer (ELB)

When Ansible was launching services for the first time AWS was not that quick to respond which caused problems when it moved on to the next task in the playbook. A good example of this was that sometimes the creation of the Elastic Load Balancer would be a little on the slow side.

This mean that Ansible had moved on before the ELB had launched meaning that the ID of the ELB would not be available to the next task which needed it to create the Auto Scaling Group (ASG).

To get around this the I added until, retries and delay to the end of the module;

```
- name: Provision an Elastic Load Balancer
  ec2_elb_lb:
    name: "{{ app_name }}"
    state: present
    aws_access_key: "{{ ec2_access_key }}"
    aws_secret_key: "{{ ec2_secret_key }}"
    region: "{{ ec2_region }}"
    cross_az_load_balancing: "yes"
    security_group_ids:
      - "{{ sg_loadbalancer.group_id }}"
    subnets:
      - "{{ subnet_AZ1.subnet.id }}"
      - "{{ subnet_AZ2.subnet.id }}"
      - "{{ subnet_AZ3.subnet.id }}"
    listeners:
      - protocol: http
        load_balancer_port: "80"
        instance_port: "80"
    health_check:
        ping_protocol: http
        ping_port: "80"
        ping_path: "/"
        response_timeout: "6" # seconds
        interval: "10" # seconds
        unhealthy_threshold: "5"
        healthy_threshold: "2"
  register: loadbalancer
  until: "loadbalancer.module_stderr is not defined"
  retries: 2
  delay: 1
```

#### Searching for the AMI

The final bit of logic I am going to cover here it finding the AMI used to launch the temporary instance.

Again, this was something I had been hard coding for quite a while as each region has its on AMI ID for each distribution, so not only was the AMI ID changing each time the underlying AMI was updated it was also different in each region.

To get around this I defined the following variables in my enviroment.yml file;

```
# Which AMI do we want to base our own off?
image_base: amzn-ami-hvm-*
image_owner: amazon
image_architecture: x86_64
```

and then used the following to get the AMI ID of the latest release in a given region by running;

```
- name: Search for all of the AMIs in {{ ec2_region }} which match {{ image_base }}
  ec2_ami_find:
    region: "{{ ec2_region }}"
    aws_access_key: "{{ ec2_access_key }}"
    aws_secret_key: "{{ ec2_secret_key }}"
    name: "{{ image_base }}"
    owner: "{{ image_owner }}"
    architecture: "{{ image_architecture }}"
    sort: name
    no_result_action: fail
  register: amiFind

- name: Filter the list of AMIs to find the latest one with an EBS backed volume 
  set_fact:
    amiSortFilter: "{{ item }}" 
  with_items: "{{ amiFind.results }}"
  when:
    - not item | skipped
    - "'Amazon Linux AMI' in item.description"
    - "'x86_64 HVM GP2' in item.description"
    - "'.rc' not in item.description"
    - item.is_public
    - item.root_device_type == "ebs"

- name: Finally grab AMI ID of the most recent result which matches {{ image_base }} which is backed by an EBS volume
  set_fact:
    our_ami_id: "{{ amiSortFilter.ami_id }}"
```

Now we have the AMI ID of the latest release of Amazon Linux in the region we have defined we can then launch the EC2 instance with something like;

```
- name: Launch a temporary instance so we can bootstrap it
  ec2:
    region: "{{ ec2_region }}"
    aws_access_key: "{{ ec2_access_key }}"
    aws_secret_key: "{{ ec2_secret_key }}"
    instance_type: "{{ app_instance_type }}"
    cover:
    image: "{{ our_ami_id }}"
    wait: yes
    key_name: "{{ ansible_user_id }}-{{ app_name }}"
    group_id: [ "{{ sg_ssh.group_id }}"]
    exact_count: 1
    count_tag:
      environment: "{{ environment_name }}"
      tier: "{{ app_tier }}-temporary"
    vpc_subnet_id: "{{ subnet_AZ1.subnet.id }}"
    assign_public_ip: yes
    instance_tags:
      Name: "temporary"
      environment: "{{ environment_name }}"
      tier: "{{ app_tier }}-temporary"
  register: temporary
```

There are lots of other things I came across when coming up with the playbooks, but those are for another post.