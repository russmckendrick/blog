---
title: "Azure Firewall KQL Query"
author: "Russ McKendrick"
date: 2024-07-20T13:42:01+01:00
description: "Explore a powerful KQL query for Azure Firewall logs. Learn how to analyze network traffic, filter by source and destination IP, and gain insights into your Azure Firewall's performance and security."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Explore a powerful KQL query for Azure Firewall logs. Learn how to analyze network traffic, filter by source and destination IP, and gain insights into your Azure Firewall's performance and security."
tags:
  - "azure"
---

This is a quick post to share a useful KQL query for Azure Firewalls that I've been using. It's based on the default Firewall query from Microsoft, but with some added variables to allow for a more focused analysis of source and destination traffic. I'm putting it here for [my](/about) future reference and in case it's helpful for anyone else.

## Azure Firewall Query with Variables

This query allows you to analyze Azure Firewall logs, focusing on specific source and destination IP addresses within a defined time range. It's particularly useful for troubleshooting and security analysis.

{{< ide title="Azure Firewall Query with variables" lang="KQL" >}}
```kql {linenos=true}
let timeAgo = 15m; // how far back to look in the logs
let sourceIP = "192.168.0.1"; // the source IP address
let targetIP = "10.0.0.1"; // the desination IP address
let theLimit = 100; // number of results to return
AzureDiagnostics
| where Category == "AzureFirewallNetworkRule" or Category == "AzureFirewallApplicationRule"
| extend msg_original = msg_s
| extend msg_s = replace(@'. Action: Deny. Reason: SNI TLS extension was missing.', @' to no_data:no_data. Action: Deny. Rule Collection: default behavior. Rule: SNI TLS extension missing', msg_s)
| extend msg_s = replace(@'No rule matched. Proceeding with default action', @'Rule Collection: default behavior. Rule: no rule matched', msg_s)
| parse msg_s with * " Web Category: " WebCategory
| extend msg_s = replace(@'(. Web Category:).*', '', msg_s)
| parse msg_s with * ". Rule Collection: " RuleCollection ". Rule: " Rule
| extend msg_s = replace(@'(. Rule Collection:).*', '', msg_s)
| parse msg_s with * ". Rule Collection Group: " RuleCollectionGroup
| extend msg_s = replace(@'(. Rule Collection Group:).*', '', msg_s)
| parse msg_s with * ". Policy: " Policy
| extend msg_s = replace(@'(. Policy:).*', '', msg_s)
| parse msg_s with * ". Signature: " IDSSignatureIDInt ". IDS: " IDSSignatureDescription ". Priority: " IDSPriorityInt ". Classification: " IDSClassification
| extend msg_s = replace(@'(. Signature:).*', '', msg_s)
| parse msg_s with * " was DNAT'ed to " NatDestination
| extend msg_s = replace(@"( was DNAT'ed to ).*", ". Action: DNAT", msg_s)
| parse msg_s with * ". ThreatIntel: " ThreatIntel
| extend msg_s = replace(@'(. ThreatIntel:).*', '', msg_s)
| extend URL = extract(@"(Url: )(.*)(\. Action)", 2, msg_s)
| extend msg_s=replace(@"(Url: .*)(Action)", @"\2", msg_s)
| parse msg_s with Protocol " request from " SourceIP " to " Target ". Action: " Action
| extend 
    SourceIP = iif(SourceIP contains ":", strcat_array(split(SourceIP, ":", 0), ""), SourceIP),
    SourcePort = iif(SourceIP contains ":", strcat_array(split(SourceIP, ":", 1), ""), ""),
    Target = iif(Target contains ":", strcat_array(split(Target, ":", 0), ""), Target),
    TargetPort = iif(SourceIP contains ":", strcat_array(split(Target, ":", 1), ""), ""),
    Action = iif(Action contains ".", strcat_array(split(Action, ".", 0), ""), Action),
    Policy = case(RuleCollection contains ":", split(RuleCollection, ":")[0], Policy),
    RuleCollectionGroup = case(RuleCollection contains ":", split(RuleCollection, ":")[1], RuleCollectionGroup),
    RuleCollection = case(RuleCollection contains ":", split(RuleCollection, ":")[2], RuleCollection),
    IDSSignatureID = tostring(IDSSignatureIDInt),
    IDSPriority = tostring(IDSPriorityInt)
| project
    msg_original,
    TimeGenerated,
    Protocol,
    SourceIP,
    SourcePort,
    Target,
    TargetPort,
    URL,
    Action,
    NatDestination,
    OperationName,
    ThreatIntel,
    IDSSignatureID,
    IDSSignatureDescription,
    IDSPriority,
    IDSClassification,
    Policy,
    RuleCollectionGroup,
    RuleCollection,
    Rule,
    WebCategory
| order by TimeGenerated
| where TimeGenerated > ago(timeAgo)
| where Target == targetIP and SourceIP == sourceIP
| limit theLimit
```
{{< /ide >}}

## Key Features of the Query

1. **Variable Declarations**: The query starts with variables for time range, source IP, target IP, and result limit. This makes it easy to customize without changing the main query logic.
2. **Log Filtering**: It focuses on Azure Firewall Network and Application rules.
3. **Data Parsing**: The query uses a series of `parse` and `extend` operations to extract structured information from the log messages.
4. **Field Extraction**: Important fields like Protocol, Source/Target IP and Port, URL, Action, and various rule details are extracted.
5. **Custom Filtering**: The query filters results based on the specified source and target IP addresses.

## How to Use This Query

1. Adjust the `timeAgo`, `sourceIP`, `targetIP`, and `theLimit` variables at the beginning of the query to suit your needs.
2. Run the query in your Azure Log Analytics workspace.
3. The results will show you detailed information about firewall actions, including source and destination details, protocols used, and the specific rules applied.

## Wrapping Up

This query has been a handy tool for me when working with Azure Firewall logs. It's particularly useful for:

- Troubleshooting connectivity issues between specific hosts
- Investigating potential security incidents
- Auditing Firewall Rule Effectiveness
- Monitoring traffic patterns

Remember, this is just a starting point. Feel free to modify the query to better fit your specific needs. As you work more with Azure Firewall and KQL, you'll probably come up with your own variations that work even better for your environment.

A few final thoughts:

- Keep an eye on performance, especially if you're looking at a large time range or have a busy environment.
- Always test your queries, especially after making modifications.
- Don't forget to update the placeholders (like `sourceIP` and `targetIP`) with actual values when you use this query.

Hopefully, this query will save future me, (👋 Hello again future [Russ](/about), and maybe you sometime when digging into Azure Firewall logs.

Happy querying!
