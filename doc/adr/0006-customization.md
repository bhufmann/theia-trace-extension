# 6. Customization

Date: 2022-04-25

## Status

Proposed

## Context

The domain specific implementation for trace analysis is performed by the trace server implementation, and the visualization data is transported via the Trace Server Protocol to the `Theia trace viewer`. The `Theia trace viewer` is a thin client and only shows what is provided by the connected trace server. The Trace Compass server provides many doman specific features for different domains (e.g. Linux). However, the pre-defined and built-in analysis are often not enought and end-user require ways to customize the domain specific parts. While it's possible to extend the server implementation and build a new server application, it is required to dynamically extend the server capabilities by using scripting, configurations (e.g. XML, JSON) etc. The `Trace Compass server` for example, provides the following ways to extend the server without recompiling the server:

- Custom text parsers
- XML analysis and views
- Scripting (EASE and external analysis)
- YAML description (In-and-Out analysis)

Since the Trace Server Protocol and the Theia trace viewer is trace server agnostic, the customization of the trace server has to be trace server agnostic as well. The TSP needs to be extended to

- query supported customizations types
- load, list, update and delete customizations per customization type
- assign customization instances to experiments
- run customzation instances, if needed

Here are steps what needs to be done:

- Define customization API in Trace Server Protocol
- Implement the customization API in the `tsp-typescript-client` and `tsp-python-client`
- Implement the UI in the `Theia Trace Viewer`
- Implement the API in the `Trace Compass server`
- Implement extension point in `Trace Compass server` to allow server plug-ins to provide custom implementations

Each component will need the proper quality assurance, that includes reviews, unit and integration tests. Where applicable add documentation as well.

While the TSP description needs to be done first, the implementation and support of the various types of extension of the Trace Compass server can be done incrementally.

Traces TSP endpoints:

- GET /traces/customizations
- POST /traces/customizations
- PATCH /traces/customizations/{id}
- DELETE /traces/customizaitons/{id}

Global Experiment TSP endpoints:

- GET /experiments/customizations
- POST /experiments/customizations
- PATCH /experiments/customizations/{id}
- DELETE /experiments/customizaitons/{id}

Per Experiment Customization:

- GET /experiments/{expUUID}/outputs/customizations
- POST /experiments/{expUUID}/outputs/customizations
- PATCH /experiments/{expUUID}/outputs/customizations/{id}
- DELETE /experiments/{expUUID}/outputs/customizaitons/{id}

## Decision

The change that we're proposing or have agreed to implement.

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
