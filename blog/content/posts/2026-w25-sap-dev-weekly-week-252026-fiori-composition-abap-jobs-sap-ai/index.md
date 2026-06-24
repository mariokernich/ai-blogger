---
title: "SAP Dev Weekly – Week 25/2026: Fiori Composition, ABAP Jobs & SAP AI"
date: 2026-06-24T21:29:40.457Z
draft: false
description: "Week 25 highlights Fiori Elements composition, ABAP Cloud jobs, RAP learning, CAP representations, Pi SDK AI, abap2UI5 and wdi5."
tags:
  - "sapui5"
  - "fiori-elements"
  - "abap-cloud"
  - "rap"
  - "cap"
  - "sap-btp"
  - "ai"
  - "abap2ui5"
  - "wdi5"
  - "sap"
  - "weekly"
cover:
  image: "thumbnail.png"
  alt: "Fiori shell with ABAP Cloud automation"
  caption: "SAP Dev Weekly – Week 25/2026: Fiori Composition, ABAP Jobs & SAP AI"
  relative: true
ShowToc: true
TocOpen: false
---

Week 25 brings a practical full-stack theme: composing generated Fiori UIs into larger products, automating ABAP Cloud workloads, and making SAP APIs more conversational. Here are the SAP developer items worth your attention from 2026-06-14 to 2026-06-21.

## SAP Community Highlights

### Fiori Elements as pages inside a SAPUI5 product

[Use Fiori Elements Apps As Views In Sapui5](https://community.sap.com/t5/frontend-ui5-sap-fiori-blog-posts/use-fiori-elements-apps-as-views-in-sapui5/ba-p/14412125) tackles a familiar architecture problem: several independent Fiori Elements apps may be the right development unit, but users expect one cohesive product experience.

The post is relevant if you have multiple FE apps, potentially backed by different OData services, and want them to behave like sections of one SAPUI5 application with shared navigation, authentication, and layout chrome. The interesting developer angle is preserving the productivity of Fiori Elements while wrapping the experience in a single SAPUI5 entry point.

### ABAP Cloud application jobs, end to end

[Application Jobs in SAP S/4HANA Public Cloud: End-to-End Guide](https://community.sap.com/t5/abap-blog-posts/application-jobs-in-sap-s-4hana-public-cloud-end-to-end-guide/ba-p/14381949) is a very useful walkthrough for the cloud successor to the classic SM36/SM37 batch-job mindset.

The guide covers the moving parts developers often miss: catalog, template, authorization, value help, and scheduling. The sample job mass-sets the Delivery Completed indicator on purchase order items using the released RAP business object `I_PurchaseOrderTP` and EML `MODIFY ENTITIES`. If you have ever wondered why a custom job does not appear in the Application Jobs Fiori app, the authorization wiring alone makes this worth bookmarking.

### A real RAP app built incrementally

[Building A Real RAP Application Step By Step Vlog Series Introduction](https://community.sap.com/t5/abap-blog-posts/building-a-real-rap-application-step-by-step-vlog-series-introduction/ba-p/14290896) introduces a RAP vlog series focused on building from real functional requirements rather than isolated demo snippets.

The setup uses SAP BTP Pay-As-You-Go with the ABAP free tier, and the stated approach is incremental: implement one requirement at a time, from scratch. That makes it a good companion for developers who want to see RAP project decisions unfold in context, including the practical constraints of a free-tier ABAP environment.

### CAP knowledge: representations matter

[June Developer Challenge CAP Knowledge Task 11: Metaphysics Of Languages](https://community.sap.com/t5/sap-cap-blog-posts/june-developer-challenge-cap-knowledge-task-11-metaphysics-of-languages/ba-p/14418600) digs into the CDS family of languages: CDL, CQL, CXL, and their machine-readable representations such as CSN.

This is more than trivia. If you build CAP tooling, generators, model transformations, or diagnostics, understanding the difference between logical resources and their representations helps explain why the same model can appear in multiple forms without becoming a different model.

## SAP AI and BTP Integration

### A natural-language S/4HANA analyst with Pi SDK

[Talk To Sap System In Plain English Building An S 4hana Analyst With Pi SDK](https://community.sap.com/t5/artificial-intelligence-blogs-posts/talk-to-sap-system-in-plain-english-building-an-s-4hana-analyst-with-pi-sdk/ba-p/14416899) shows a CLI tool that answers natural-language questions against SAP ERP data.

The example asks for purchase orders with supplier names. The agent reads a Markdown skill file, queries purchase orders, follows up with supplier lookups, and returns the chained result. The developer takeaway is the simplified orchestration model: hand Pi an LLM, a tool, and a Markdown file, then call `session.prompt()`, instead of hand-wiring ReAct loops, state graphs, and message history.

### Making AI operational on SAP BTP

[ATUL Architecture #4 — AI on SAP BTP for Grid Operations](https://community.sap.com/t5/sap-for-utilities-blog-posts/atul-architecture-4-ai-on-sap-btp-for-grid-operations/ba-p/14419316) is industry-specific, but the architecture pattern is broadly relevant: AI should not stop at dashboards and predictions; it should trigger operational work.

The post frames a closed-loop model using time-series data, machine learning, event-driven integration, and SAP S/4HANA workflows. For BTP developers, the useful lens is how AI insights become process triggers inside SAP landscapes.

## Developer Environments

[Using Podman For ABAP Platform Trial Container On Ubuntu Server And On](https://community.sap.com/t5/devops-and-system-administration-blog-posts/using-podman-for-abap-platform-trial-container-on-ubuntu-server-and-on/ba-p/13573945) is a hands-on environment note for running the ABAP Platform Trial / ABAP Cloud Developer Trial container with Podman.

The guide covers Ubuntu Server and an amd64 MacBook scenario, including some Podman Desktop aspects. If you prefer Podman over Docker for local SAP development infrastructure, this is a practical reference for setting up an ABAP trial system with the current image naming context and availability notes.

## Open Source Watch

### abap2UI5 improves UI behavior and draft handling

[abap2UI5](https://github.com/abap2UI5/abap2UI5) had several meaningful runtime and developer-experience improvements this week. The notable changes include enhanced `CameraPicture` sizing, improved Info reporting and error handling, optimized device-info caching and scroll event handling, plus draft-management improvements and type-consistency fixes.

For teams building UI5 apps purely in ABAP, the `CameraPicture` and draft-related work is the most interesting part: it keeps broadening the practical UI surface you can build without JavaScript, OData, or RAP.

### wdi5 adds RecordReplay support for Enter key handling

[wdio-ui5-service / wdi5](https://github.com/ui5-community/wdi5/tree/main/) released `v3.0.10`. The standout change is new RecordReplay support for `pressEnterKey`, which is useful for UI5 end-to-end tests that need keyboard-driven interactions.

The release also includes fixes around BiDi init script handling and common interaction paths such as `enterText`, `press`, and selector IDs. If your WebdriverIO-based UI5 tests have flaky input or keyboard behavior, this patch is worth scanning.

## Takeaway

This week is less about big version numbers and more about integration patterns: FE apps inside a SAPUI5 shell, ABAP Cloud jobs instead of classic batch, CAP model representations for tooling, and AI agents that can orchestrate SAP API calls. Solid material for developers building real SAP products rather than isolated demos.
