# 11. Tsp analysis api

Date: 2024-05-29

## Status

Proposed
Version v2

## Context

The trace viewer currently is able to visualize trace data provided by a trace server over the trace server protocol (TSP). The Trace Compass server has some built-in analysis view for that. It is not possible to side-load analysis and visualization descriptions over the TSP so that end-user can provide custom views. Trace Compass supports loading of data-driven analysis and views, e.g. XML driven views or in-and-out anlysis of the Trace Compass incubator project. The Eclispe-based Trace Compass application has UI primitives to load e.g. XML files or configure custom analysis (InAndOut analysis). While the Trace Compass server has the capablility to understand these defintions, there is no way to side-load this definition over the TSP. This ADR will propose a configuration service within the TSP to facilitate these custom analysis. The proposed configuration service can also be used to configure other server specific customizations, e.g. custom trace parsers.

The ADR has been modified from its orignal version to remove experiment configuring service for loading customizations per experiment. Instead new chapters were added for customizing analysis over the TSP. With this it will be possible to provide parameters for data providers that can be customized. The server will indicate which data provider can be customized and what parameters it needs. Action endpoint use to provide users actions to create and delete custom outputs. The configured customization then can be managed through the global configuration service.

Note that `data provider` and `output` below are used interexchangably, however `output` is used in all data structures and endpoints.

### Global configuration service

An analysis service for managing global configurations will be introduced. Global in this context means that the configuration definitions will be handled on the application level. 

    GET /config/types
            returns a list of configuration source types: typeId, name, description, scope, expected parameter descriptors (e.g. "path" for file path)
    GET /config/types/{typeId}
            returns a single configuration source type for given typeId: typeId, name, description, scope, expected parameter descriptors (e.g. "path" for file path)
    GET /config/types/{typeId}/configs
        returns a list of configuration instances for a given typeId
    POST /config/types/{typeId}/configs
        Upload an configuration definition for given typeId
        Returns a new configuration descriptor with unique configuration ID
    PUT /config/types/{typeId}/configs/{configId}
        Update a configuration
    GET /config/types/{typeId}/configs/{configId}
        Returns the configuration descriptor for given configId and typeId
    DELETE /config/types/{typeId}/configs/{configId}
        Delete a configuration instance

#### Configuration source type descriptor

The configuration source type descriptor describes the type of external configuration. Different types have different syntax and hence back-end implementation. This descriptor is used to distinquish the different external configurations. The trace server implementation will provide the list of type descriptors on client requests.
```javascript
ConfigurationSourceType {
    name: string,
    description: string,
    id: string,
    scope: string,
    parameterDescriptors: ConfigurationParameterDescriptor[]
}
```

Where:

- `name`: Name of the configuration source type. Can be shown to the end-user.
- `description`: The description of the configuration source type. Can be shown to the end-user.
- `id`: Unique id of the configuration source type. Used in the application to distinquish configuration source types
- `scope:` `experiment` for configuration source types per experiment or `global` for all experiments
- `parameterDescriptors`: A list of descriptors that describe the parameters that the front-end needs to provide with corresponding values. For example, use "path" for file path. 

#### Configuration parameter descriptor

The configuration parameter descriptor describes a parameter that the front-end needs to provide with corresponding values. This descriptor will help implementing a UI for the parameters.

```javascript
ConfigurationParameterDescriptor {
    keyName: string,
    description: string,
    dataType: string,
    isRequired: bool
}
```

Where:

- `keyName`: Name of the key to use in the parameter map.
- `description`: The description of the configuration parameter. Can be shown to the end-user.
- `dataType`: A data type hint to the client. Helps implementing validation of values in the front-end.
- `isRequired`: A flag indicating whether parameter is required or not.

#### Configuration descriptor

The configuration descriptor describes an instance of an external configuration for a given source type. This descriptor is used to distinquish the different external configurations for a given type.

```javascript
Configuration {
    name: string,
    description: string,
    id: string,
    sourceTypeId: string
    parameters: map<string, object>
}
```

Where:
- `name`: Name of the configuration. Can be shown to the end-user.
- `description`: The description of the configuration. Can be shown to the end-user.
- `id`: Unique id of the configuration. Used in the application to distinquish the configurations
- `sourceTypeId`: ID of the configuration source type.
- `parameters`: Input parameters to be used to create configuration

#### Sequence: Create configuration instance

The following illustrates the sequence of events and messages to create an instance of an external configuration for a given type (e.g. XML analysis).

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    user->>client: Select global configuration manager
    client->>client: Open config manager UI
    client->>server: GET /config/types
    server->>client: 200: List of ConfigurationSourceType
    client->>client: Populate drop-down menu
    user->>client: Select "XML analysis" type
    client->>server: GET /config/types/{typeId}/configs
    server->>client: 200: List of exiting Configurations
    client->>client: Populate UI
    user->>client: Select browse button
    client->>client: Open file chooser dialog
    user->>client: Select new XML analysis file
    client->>server: POST /config/types/{typeId}/configs
    server->>client: 200: New Configuration instance
    client->>client: Update list of existing Configuration instances
    user->>client: Open trace
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: list of available outputs including XML outputs
    client->>client: Refresh UI
```

#### Sequence: Update configuration instance

The following illustrates the sequence of events and messages to update an existing instance of an external configuration for a given type (e.g. XML analysis).

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    user->>client: Select global configuration manager
    client->>client: Open configuration manager UI
    client->>server: GET /config/types
    server->>client: 200: List of ConfigurationSourceType
    client->>client: Populate drop-down menu
    user->>client: Select "XML analysis" type
    client->>server: GET /config/types/{typeId}/configs
    server->>client: 200: List of exiting Configuration instances
    client->>client: Populate UI
    user->>client: Select browse button
    client->>client: Open file chooser dialog
    user->>client: Select updated XML analysis file
    client->>server: PUT /config/types/{typeId}/configs/{configId}
    server->>client: 200: Updated Configuration descriptor
    client->>client: Update list of existing Configuration descriptors
    user->>client: Open trace
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: list of available outputs including XML outputs
    client->>client: Refresh UI
```
Note: If traces are open, the trace server has to take care of refreshing the back-end data structures (e.g. state systems). The client also needs to refresh the UI.

#### Sequence: Delete analysis instance

The following illustrates the sequence of events and messages to delete an existing instance of an external analysis for a given type (e.g. XML analysis).

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    user->>client: Select global analysis manager
    client->>client: Open configuration manager UI
    client->>server: GET /config/types
    server->>client: 200: List of ConfigurationSourceType
    client->>client: Populate drop-down menu
    user->>client: Select "XML analysis" type
    client->>server: GET /config/types/{typeId}/configs
    server->>client: 200: List of exiting Configuration
    client->>client: Populate UI
    user->>client: Select existing Configuration (XML analysis)
    user->>client: CLick on Delete button
    client->>server: DELETE /config/types/{typeId}/configs/{configId}
    server->>client: 200
    client->>client: Refresh UI
```

### Configure customizable outputs 

Outputs might accept input parameters that will configure the analysis used to create the output. Such customization can create new outputs or provide additional query parameters. The TSP api will allow the back-end to define actions for that. Each action will use `CustomizationTypeSource` define what user can customize. The back-end then may store configuration instances so that the can be manage by the [Global Configuration Service](#global-configuration-service).

    GET /experiments/{expUUID}/outputs/{outputId}/actions {scope={scope-name}}
        returns a list of `ActionDescriptors`
    POST /experiments/{expUUID}/outputs/{outputId}/actions/{actionId} {config-params}
        Execute command using config-params defined its `ConfigurationSourceType`
        Returns ActionResult with an OutputDescriptor for a new or updated output or extra query params to apply in queries

The update API proposal augments the `OutputDescriptor`, and `ConfigurationSourceType`, as well as and adds new data structures, `ActionDescriptor` and `ExtraQueryParameter` to allow for more flexibility in supporting more use cases to configure new (cloned outputs) or existing output.

**Updated or new data structures**

```javascript
    OutputDescriptor {
        id: string,
        name: string,
        description: string,
        type: string,  // provider type
        // new parameter
        hasActions?: boolean // optional, default false
    }
```

```javascript
ActionDescriptor {
    name: string,
    description: string,
    id: string,
    scope: string, // view, self, tree, graph (location of action)
    configType: ConfigurationSourceType
}
```

```javascript
ExtraQueryParameter {
    param: { [key: string]: string }  // map string -> string to avoid issues with 64-bit timestamps serializations
}
```

```javascript
ActionResult {
    result: enum // OUTPUT_ADDED, OUTPUT_DELETED, EXTRA_PARAMS,
    output?: OutputDescriptor
    extraParam?: ExtraQueryParam
}
```

#### Sequence: Execute action to create new data provider

The following illustrates the sequence of events and messages to execute an action on a give data provider to create a new data provider. It uses an example to create a new, custom Flame Chart from an existing flame chart. The existing `Flame Chart` data provider would have an action `Create custom Flame Chart...`.

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: List of Available Views
    client->>client: Render "Available Views" view and config menu buttons if hasActions
    user->>client: Click config menu beside 'Flame Chart''
    client->>server: GET /experiments/{expUUID}/outputs/{outputId}/actions {scope=view}
    server->>client: 200: List of ActionDescriptors
    client->>client: Render menu for each action
    user->>client: Click on "Create custom Flame Chart"
    client->>client: Open Dialog for ActionDescriptor
    user->>client: Fill in 'title' and 'filter' and click on 'Apply'
    client->>server: POST experiments/{expUUID}/outputs/{outputId}/actions/{actionId} {title, filter}
    server->>server: Validate, create data provider, persist config (experiment and global)
    server->>client: 200: ActionResult {result: OUTPUT_ADDED, output: OutputDescriptor}
    client->>client: Refresh 'Available views' view
    user->>client: User clicks on new output
    client->>client: Customized view opens
 ```

Notes: 
- Data provider persists input parameters (configuraton) in global server-wide storage that can be manage through [Global Configuration Service](#global-configuration-service).
- Data provider returns additional actions in List of Action Descriptors for applying existing configs that had been storead in global-wide storage previously

```javascript
ActionDescriptor {
    "name": Create Custom Flame Chart...,
    "description": Manage instance of a custom flame based on input parameters,
    "id": "custom.flame.charts.id",
    "scope": "view", // self, view, tree, graph (location of action)
    "parameterDescriptors": [
        {
            "keyName": "title",
            "description": "Provide a name of custom flame chart to be shown in UI",
            "dataType": "string",
            "isRequired": "true"
        },
        {
            "keyName": "filter",
            "description": "Provide a filter string according to filter language",
            "dataType": "string",
            "isRequired": "true"
        }
    ]
}
```

Input data provider:

```javascript
OutputDescriptor {
    "id": "flamechart.id",
    "name": "Flame Chart",
    "description": "Flame Chart description",
    "type": "TIME_GRAPH",
    "hasActions": "true" // To avoid querying each data provider one-by-one
}
```

`User input`:
```javascript
    {"title": "CPU 0-1 only", "filter": "cpu matches [0-1]"}
```

```javascript
ActionResult {
    "result": "OUTPUT_ADDED"
    "output":  { 
        "id": "custom.callstack.id",
        "name": "CPU 0-1 only",  // name of configuration
        "description": "Custom call stack 'CPU 0-1 only' ", // description of customized data provider
        "type": "TIME_GRAPH",
        "hasActions": "true"   // for delete, data provider action
    }
```

Notes:
- Stored configurations need to have unique IDs. Consider generating IDs from input parameters to avoid duplicate configurations.
- The new data provider should also have an action to delete this custom data provider.
- The data provider may have actions to apply stored configurations on the server
- Users can use [Global configuration service](#global-configuration-service) to manage stored configurations (list, inport/export, delete)

#### Sequence: Delete custom data provider

The following illustrates the sequence of events and messages to delete a custom data provider for an experiment.

Pre-requisite: Analysis instance created as described in [Sequence: Execute action to create new data provider](#sequence-execute-action-to-create-new-data-provider.

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: List of Available Views
    client->>client: Render "Available Views" view and config menu buttons if hasActions
    user->>client: Click config menu beside 'CPU 0-1 only'
    client->>server: GET /experiments/{expUUID}/outputs/{outputId}/actions {scope=view}
    server->>client: 200: List of ActionDescriptors
    client->>client: Render menu for each action
    user->>client: Click on "Delete"
    client->>server: POST experiments/{expUUID}/outputs/{outputId}/actions/{actionId}
    server->>server: Delete data provider and persisted data
    server->>client: 200: ActionResult { result: OUTPUT_DELETED, output: OutputDescriptor }
    client->>client: Refresh 'Available views' view and close view
    Note right of client: Custom view is gone
```

#### Manage configurations

Data provider may decide to persist input parameters (configuraton) in global server-wide storage that can be managed through the [Global Configuration Service](#global-configuration-service). With this configurations can be shared between experiments and users. For that data provider can return additional actions in List of Action Descriptors for applying existing configs that had been stored in the global server-wide storage. To list or delete a persisted configuration in global server-wide storage use the global configuration source endpoint described here [Global configuration service](#global-configuration-service).

### Future considerations
The proposal requires the input of the configuration be a file that needs to be provided to the trace server. This works well, however a generic front-end cannot provide a UI implementation for creating such a file with the correct syntax. Custom client extensions implementation can be implemented for that. Also, JSON forms could be used for JSON based input.

ActionDescriptor to indicate a way to group, have sub-menus and where to put action (e.g. before/after)

### Implementation steps

 Use configuration using file by default for external configuration. This will allow to have a generic UI implementation in `theia-trace-extension` for that. 
 The following list provides a break down in different implementation steps. This doesn't inlcude effort for the Python client.

- Configuration Service
    - TSP updates for configuration service 
    - Back-end: Configuration Service (TSP) skeleton (Done)
    - Back-end: Trace Compass Server back-end API for configuration source types (Done)
    - Back-end: Trace Compass Server back-end API for XML analysis (Done)
    - Back-end: Use Trace Compass Server back-end API in Configuration Service (Done)
    - Front-end: tsp-typescript-client updates (Done)
    - Front-end: Implement simple manager UI for files per typeID (re-usable react component)
- Data provider configuration service: [Critical Path](#example-critical-path)
    - TSP updates for data provider configuration service
    - Back-end: Data provider configuration service (TSP) skeleton
    - Back-end: Implement support for Critical Path configuration
    - Front-end: tsp-typescript-client updates
    - Front-end: Add UI to support actions from data provider

Other use case will be implemted on need base.

## Decision

The change that we're proposing or have agreed to implement, will be implemented.

## Consequences

### Easier to do

This will introduce new TSP endpoints and it's a completely new feature for trace viewers supporting supporting these endpoints in the front-end and server back-end. Once implemented, it will greatly enhance the feature capabilities of the whole application. It will help end-users to define their custom analysis and visualization definitions as well as other server side configurations, and allow them to get such features faster than having to write code in the server application, compile and re-deploy the server afterwards. This will reduce troubleshooting times for the end-users.

### More difficult

Having new TSP endpoints will make the TSP more complicated to use, and interested front-end / back-end implementations need to follow. A TSP will become larger and will need to be maintained.

### Risks introduced

The TSP will be bigger and more APIs need to be maintained on all levels of the client-server application.

### Examples use case realizations using actions

#### Example: Critical Path

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: List of Available Views
    client->>client: Render "Available Views" view and config menu buttons if hasActions
    user->>client: User selects "Thread Status View"
    Note right of user: Thread Status view opens
    user->>client: Right-mouse click on thread in tree
    client->>server: GET /experiments/{expUUID}/outputs/{outputId}/actions {scope=tree}
    server->>client: 200: List of ActionDescriptors
    client->>client: Render view menu for each action with entry 'Follow Thread"
    client->>server: POST experiments/{expUUID}/outputs/{outputId}/actions/{actionId} {requested_items=[{itemId}]}
    server->>server: Validate, create custom query parameter
    server->>client: 200: ActionResult { result: OUTPUT_ADDED, output: OutputDescriptor } 
    client->>client: Refresh 'Available views' view
    user->>client: User clicks on new output
    client->>client: Customized view opens
 ```

```javascript
ActionDescriptor {
    "name": Follow Thread,
    "description": Follows a selected thread,
    "id": "thread.filter.id",
    "scope": "tree", // self, view, tree, graph (location of action)
    "parameterDescriptors": [
        {
            "keyName": "requested_items",
            "description": "ids of requested_itmes",
            "dataType": "None",
            "isRequired": "true"
        }
    ]
}
```

```javascript
OutputDescriptor {
    "id": "thread.status.id",
    "name": "Thread Status",
    "description": "Thread Status description",
    "type": "TIME_GRAPH",
    "hasActions": "true"
}
```

`User input by selection and not dialog`:

```javascript
ActionResult {
    "result": "OUTPUT_ADDED"
    "output":  { 
        "id": "custom.critical.path.id1",
        "name": "Critical Path ({tid})",
        "description": "Critical path for thread: {name}, {tid}, {host}",
        "type": "TIME_GRAPH",
        "hasActions": "true" // to delete
    }
```

Note:
    - Multiple critical path views possible

-------------------------------------------------------------------------------
-------------------------------------------------------------------------------
#### Example: Active Thread Filters

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: List of Available Views
    client->>client: Render "Available Views" view and config menu buttons if hasActions
    user->>client: Click on 'Thread Status view'
    Note right of user: Thread Status view opens
    user->>client: Click on view menu
    client->>server: GET /experiments/{expUUID}/outputs/{outputId}/actions {scope=self}
    server->>client: 200: List of ActionDescriptors
    client->>client: Render view menu for each action with entry 'Active Threads Filter"
    client->>server: POST experiments/{expUUID}/outputs/{outputId}/actions/{actionId} {isActiveThreadFilter=true, cpu=[0-1]}
    server->>server: Validate, create extra query parameters
    server->>client: 200: ActionResult { result: EXTRA_PARAMS, output: OutputDescriptor, extraParams: ExtraQueryParameter } 
    client->>client: Refresh tree and graph view
 ```

```javascript
ActionDescriptor {
    "name": "Active Thread Filter",
    "description": "Show only active threads for all or selected cpus",
    "id": "active.thread.filter.id",
    "scope": "self", // self, view, tree, graph (location of action)
    "parameterDescriptors": [
        {
            "keyName": "isActiveThreadFilter",
            "description": "Flag to indicate active thread filter",
            "dataType": "boolean",
            "isRequired": "true"
        },
        {
            "keyName": "cpus",
            "description": "list of cpus, e.g. 0 or 0-2, or 0,1,4. If missing all cpus.",
            "dataType": "string",
            "isRequired": "false"
        },
    ]
}
```

```javascript
OutputDescriptor {
    "id": "thread.status.id",
    "name": "Thread Status",
    "description": "Thread Status description",
    "type": "TIME_GRAPH",
    "hasActions": "true"
}
```

```javascript
    {"isActiveThreadFilter": "true", "cpus": "0-1"}
```

```javascript
ActionResult {
    "result": "EXTRA_PARAMS"
    "extraParams": {
        "param": {
        "isActiveThreadFilter": "true", 
        "cpus": "[0-1]"
        }
    }
    "output":  { 
        "id": "thread.status.id",
        "name": "Thread Status",
        "description": "Thread Status description",
        "type": "TIME_GRAPH",
        "hasActions": "true" // Action to remove extra params
    }
```

```javascript
ExtraQueryParameter {
    "param": {
        "isActiveThreadFilter": "true", 
        "cpus": "[0-1]"
    }
}
```

Note:
    - Extra query param are added to all data provider queries of `self` view when button active
    - `self` DP will return different ActionDescriptor to clear query params and remove active thread filter

-----------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------
#### Example: XY Chart From Events Table

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: List of Available Views
    client->>client: Render "Available Views" view and config menu buttons if hasActions
    user->>client: Click config menu beside 'Events Table''
    client->>server: GET /experiments/{expUUID}/outputs/{outputId}/actions {scope=view}
    server->>client: 200: List of ActionDescriptors
    client->>client: Render menu for each action
    user->>client: Click on "Create Custom XY TIME Chart..."
    client->>client: Open Dialog for ActionDescriptor
    user->>client: Fill in 'title' and 'filter' and click on 'Apply'
    client->>server: POST experiments/{expUUID}/outputs/{outputId}/actions/{actionId} {title, filter}
    server->>server: Validate, create data provider, persist config (experiment and global)
    server->>client: 200: ActionResult {result: OUTPUT_ADDED, output: OutputDescriptor}
    client->>client: Refresh 'Available views' view
    user->>client: User clicks on new output
    client->>client: Customized view opens
```

```javascript
ActionDescriptor {
    "name": Create Custom XY Chart... ,
    "description": Create custom XY chart,
    "id": "custom.xy.time.charts.id",
    "scope": "view", // self, view, tree, graph (location of action)
    "parameterDescriptors": [
        {
            "keyName": "title",
            "description": "title of graph",
            "dataType": "string",
            "isRequired": "true"
        },
        {
            "keyName": "columns",
            "description": "Names of columns to plot",
            "dataType": "array",
            "isRequired": "true"
        },
        {
            "keyName": "filter",
            "description": "Filter condition",
            "dataType": "array",
            "isRequired": "true"
        }
        {
            "keyName": "y-axis",
            "description": "Names of y-axis",
            "dataType": "string",
            "isRequired": "false"
        },
        {
            "keyName": "y-unit",
            "description": "Unit of y-axis",
            "dataType": "string",
            "isRequired": "false"
        },
        {
            "keyName": "y-data-type",
            "description": "data type of y-axis",
            "dataType": "string",
            "isRequired": "false"
        }
    ]
}
```

```javascript
OutputDescriptor {
    "id": "events.table.id",
    "name": "Events Table",
    "description": "Event Table description",
    "type": "TABLE",
    "hasActions: "true"
}
```

`User input`:
```javascript
    {
        "title": "CPU Number Plot", 
        "columns": ["CPU"],
        "filter": "tid==1234",
        "y-axis": "CPU",
        "y-unit": "no-unit",
        "y-data-type": "Number"
    }
```

```javascript
ActionResult {
    "result": "OUTPUT_ADDED"
    "output":  { 
        "id": "custom.xy.plot.id.1",
        "name": "CPU Number Plot",
        "description": "Plots the CPU over time for given filter",
        "type": "TREE_TIME_XY",
        "hasActions": "true"  // for delete action
    }
```

-------------------------------------------------------------------------------
-------------------------------------------------------------------------------
#### Example: Custom Function Execution Statistics**.

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: List of Available Views
    client->>client: Render "Available Views" view and config menu button if hasActions
    user->>client: Click config menu beside 'Segment Store Statistics''
    client->>server: GET /experiments/{expUUID}/outputs/{outputId}/actions {scope=view}
    server->>client: 200: List of ActionDescriptors
    client->>client: Render menu for each action
    user->>client: Click on "Aggregate..."
    client->>client: Open Dialog for ActionDescriptor
    user->>client: Fill in 'title', 'filter' and click on 'Apply'
    client->>server: POST experiments/{expUUID}/outputs/{outputId}/actions/{actionId} {title, filter}
    server->>server: Validate, create data provider, persist config (experiment and global)
    server->>client: 200: ActionResult {result: OUTPUT_ADDED, output: OutputDescriptor}
    client->>client: Refresh 'Available views' view
    user->>client: User clicks on new output
    client->>client: Customized view opens
 ```

```javascript
[
    ActionDescriptor {
        "name": Aggregate...,
        "description": Manages Custom Function Duration Statistics,
        "id": "custom.fct.duration.stats.id",
        "scope": "view", // self, view, tree, graph (location of action)
        "parameterDescriptors": [
            {
                "keyName": "title",
                "description": "title of graph",
                "dataType": "string",
                "isRequired": "true"
            },
            {
                "keyName": "filter",
                "description": "Aggregate stats for functions matching regex",
                "dataType": "string",
                "isRequired": "true"
            }
        ]
    },
    ActionDescriptor {
        "name": Create custom view...,
        "description": Creates a custom Function Duration Statistics view based on input regex filter to include/exclude functions.
        "id": "custom.fct.duration.stats.id",
        "scope": "view", // self, view, tree, graph (location of action)
        "parameterDescriptors": [
            {
                "keyName": "filter",
                "description": "Regex filter on function names.",
                "dataType": "string",
                "isRequired": "true"
            }
        ]
]
```

```javascript
OutputDescriptor {
    "id": "segmentstore.latency.analysis.statistics:callstack.analysis",
    "name": "Function Execution statistics",
    "description": "Function Execution statistics",
    "type": "DATA_TREE",
    "hasAction": "true"  // 2 actions of above
}
```

`User input`:
```javascript
    {
        "title": "Grouped Stats", 
        "aggregation": "label matches COM.*"
    }
```

```javascript
ActionResult {
    "result": "OUTPUT_ADDED"
    "output":  { 
        "id": "segmentstore.latency.analysis.statistics:callstack.analysis:custom.fct.execution.stats.id.instance.1",
        "name": "Grouped Stats",
        "description": "Custom function duration statistics aggregated by name: [COM.*]",
        "type": "DATA_TREE",
        "hasAction": "true"  // for delete, modify actions
    }
```

### Notes

It would be good that for each domain in server e.g. linux kernel there is a common language so that elements can referenced by the same keys

thread-name
host-id
tid
pid
ppid
cpu
others?


