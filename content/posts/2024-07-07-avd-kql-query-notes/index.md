---
title: "Azure Virtual Desktop KQL Queries"
author: "Russ McKendrick"
date: 2024-07-07T15:52:12+01:00
description: "Discover powerful KQL queries to enhance your Azure Virtual Desktop (AVD) management. Learn how to track user connections, analyze session times, monitor errors, and gain insights into your AVD environment's performance and security."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Discover powerful KQL queries to enhance your Azure Virtual Desktop (AVD) management. Learn how to track user connections, analyze session times, monitor errors, and gain insights into your AVD environment's performance and security."
tags:
  - "azure"
keywords:
  - "Azure"
  - "Azure Virtual Desktop"
  - "Azure Log Analytics"
  - "KQL"
  - "Logs"
---

This is a quick post collating some of the notes for KQL queries for Azure Virtual Desktop I have in various documents into a single place, just in case they are helpful for anyone and also for my reference, 👋 hello future [Russ](/about).

## Find out all the IP addresses in the last 30 days

This query looks at the past 30 days, counting connections by username and client IP address, then sorts these counts in descending order, adds geolocation data for each IP, and finally outputs the client IP, connection count, and location details (country, state, and city) to provide insights into connection patterns and frequencies across different users and locations in the Windows Virtual Desktop environment.

{{< ide title="Find out all the IP addresses in the last 30 days" lang="KQL" >}}
```kql {linenos=true}
let daysAgo = 30d;
WVDConnections
| where TimeGenerated > ago(daysAgo)
| summarize NumberOfConnections = count() by UserName, ClientIPAddress
| order by NumberOfConnections desc
| extend ip_location = parse_json(geo_info_from_ip_address(ClientIPAddress))
| extend
    Country = tostring(ip_location.country),
    State = tostring(ip_location.state),
    City = tostring(ip_location.city)
| project ClientIPAddress, NumberOfConnections, Country, State, City
```
{{< /ide >}}

## Find out all Users and their IP addresses in the last 30 days

This query extends the previous query and analyses AVD connections over the last 30 days, counting connections by username and client IP address, sorting these counts in descending order, enriching the data with geo-location information for each IP, and finally outputting the username, client IP, connection count, and location details (country, state, and city). This provides a comprehensive view of the Azure Virtual Desktop environment's connection patterns, frequencies, and geographical distribution for each user.

{{< ide title="Find out all Users and their IP addresses in the last 30 days"  lang="KQL" >}}
```kql {linenos=true}
let daysAgo = 30d;
WVDConnections
| where TimeGenerated > ago(daysAgo)
| summarize NumberOfConnections = count() by UserName, ClientIPAddress
| order by NumberOfConnections desc
| extend ip_location = parse_json(geo_info_from_ip_address(ClientIPAddress))
| extend
	Country = tostring(ip_location.country),
	State = tostring(ip_location.state),
	City = tostring(ip_location.city)
| project UserName, ClientIPAddress, NumberOfConnections, Country, State, City
```
{{< /ide >}}

## Find out the IP addresses of where a user is connecting from

This KQL query is similar to the previous ones but introduces a new variable and focuses on filtering by username. Here's a summary:
The query analyses WVDConnections over the past 30 days, filters for usernames containing a specified search string (currently empty), and counts connections by client IP address. It orders these counts in descending order, adds geolocation data for each IP, and outputs the client IP, connection count, and location details (country, state, and city).

This query allows for targeted analysis of connection patterns for specific users or user groups, providing insights into the geographical distribution of their connections to the Windows Virtual Desktop environment.

{{< ide title="Find out the IP addresses of where a user is connecting from"  lang="KQL" >}}
```kql {linenos=true}
let userSearch = "<replace with the UPN of a user>";
let daysAgo = 30d;
WVDConnections
| where TimeGenerated > ago(daysAgo)
| where UserName contains userSearch
| summarize NumberOfConnections = count() by ClientIPAddress
| order by NumberOfConnections desc
| extend ip_location = parse_json(geo_info_from_ip_address(ClientIPAddress))
| extend
	Country = tostring(ip_location.country),
	State = tostring(ip_location.state),
	City = tostring(ip_location.city)
| project ClientIPAddress, NumberOfConnections, Country, State, City
```
{{< /ide >}}

## Get all errors for all users from a single IP address

The query first identifies users connected from a specified IP address (currently set to an empty string) within the last 30 days using the WVDConnections table. It then uses this list of users to filter the WVDErrors table, summarising the count of errors for each user and the error code. The results are ordered by error count in descending order. This query allows for targeted error analysis, linking connection data with error occurrences to help identify potential issues affecting users connecting from specific IP addresses in the Windows Virtual Desktop environment.

{{< ide title="Get all errors for all users from a single IP address" lang="KQL" >}}
```kql {linenos=true}
let ipAddress = "<replace with the IP address you are interested in>";
let daysAgo = 30d;
let users =
    WVDConnections
    | where TimeGenerated > ago(daysAgo)
    | where ClientSideIPAddress contains ipAddress
    | summarize by UserName;
WVDErrors
| where TimeGenerated > ago(daysAgo)
| where UserName in (users)
| summarize ErrorCount = count() by UserName, CodeSymbolic
| order by ErrorCount desc
```
{{< /ide >}}

## Total session time

This KQL query analyses Azure Virtual Desktop connections over the past month, matching 'Connected' and 'Completed' session states to calculate total session durations for each user and connection type, then presents the results in both hours and days, sorted to show the most active users first, thereby providing insights into user engagement patterns and system usage within the WVD environment.

{{< ide title="Total session time"  lang="KQL" >}}
```kql {linenos=true}
let daysAgo = 31d;
WVDConnections
| where TimeGenerated > ago(daysAgo)
| where State == "Connected"
| project CorrelationId, UserName, ConnectionType, StartTime=TimeGenerated
| join (WVDConnections
    | where State == "Completed"
    | project EndTime=TimeGenerated, CorrelationId)
    on CorrelationId
| extend SessionDuration = EndTime - StartTime
| summarize TotalDuration = sum(SessionDuration) by UserName, ConnectionType
| extend 
    DurationHours = round(TotalDuration / 1h, 2),
    DurationDays = round(TotalDuration / 1d, 2)
| project UserName, ConnectionType, DurationHours, DurationDays
| sort by DurationHours desc
```
{{< /ide >}}

## Total number of sessions per host pool

This KQL query analyses Windows Virtual Desktop connections from the past 31 days, focusing on successful connections to count distinct users per host pool, then formats the host pool names by combining specific segments of the resource ID, ultimately providing a concise summary of user diversity across different WVD host pools.

{{< ide title="Total number of sessions per host pool"  lang="KQL" >}}
```kql {linenos=true}
let daysAgo = 31d;
WVDConnections 
| where TimeGenerated > ago(daysAgo)
| where State == "Connected" 
| project _ResourceId, UserName 
| project-rename Hostpool = _ResourceId 
| summarize DistinctUsers= dcount(UserName) by Hostpool 
| extend HostPool=toupper(strcat(split(Hostpool, "/")[4], ".", split(Hostpool, "/")[8])) 
| project HostPool, DistinctUsers
```
{{< /ide >}}

## Total Sessions

This KQL query analyses Windows Virtual Desktop connections from the past day, focusing on completed sessions, and extracts key session information including timestamp, user, client details, connection type, and a reformatted host pool identifier, providing a detailed snapshot of recent WVD activity across different host pools with an emphasis on successfully concluded sessions.

{{< ide title="Total Sessions"  lang="KQL" >}}
```kql {linenos=true}
let daysAgo = 1d;
WVDConnections
| where TimeGenerated > ago(daysAgo) and State contains "Completed"
| project-rename Hostpool = _ResourceId
| extend HostPool=toupper(strcat(split(Hostpool, "/")[4], ".", split(Hostpool, "/")[8]))
| project TimeGenerated, UserName, ClientOS, ClientType, ConnectionType, HostPool
```
{{< /ide >}}

## Errors per host pool

This KQL query examines Azure Virtual Desktop errors from the past day, extracting the error code and reformatting the host pool identifier from the resource ID, then summarises the data by counting the occurrences of each error code per host pool, providing a concise overview of recent error patterns across different AVD environments.

{{< ide title="Errors per host pool"  lang="KQL" >}}
```kql {linenos=true}
let daysAgo = 1d;
WVDErrors
| where TimeGenerated > ago(daysAgo) 
| project _ResourceId, CodeSymbolic
| project-rename Hostpool = _ResourceId
| extend HostPool=toupper(strcat(split(Hostpool, "/")[4], ".", split(Hostpool, "/")[8]))
| summarize Count=count() by CodeSymbolic, HostPool
```
{{< /ide >}}

## Wrapping Up

So there you have it - a handful of KQL queries I've found useful when working with Azure Virtual Desktop. These aren't exhaustive by any means, just a collection of queries I've used and wanted to keep handy.

Remember, these queries are starting points. Feel free to tweak them to fit your specific needs. As you work more with AVD and KQL, you'll probably come up with your own variations that work even better for your environment.

A few final thoughts:

- Keep an eye on performance. Some of these queries look at 30 days of data, which might be heavy if you have a large environment.
- Always test your queries, especially if you modify them.
- Don't forget to update the placeholders (like `<replace with the IP address you are interested in>`) with actual values when you use these queries.

Hopefully, these notes will save future me (and maybe you) time when digging into AVD logs. If you've got any cool AVD queries of your own, I'd love to hear about them in the comments.

Happy querying!
