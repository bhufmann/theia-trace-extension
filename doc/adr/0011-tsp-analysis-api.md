# 11. Tsp analysis api

Date: 2023-06-20

## Status

Proposed
Version v2

## Context

The trace viewer currently is able to visualize trace data provided by a trace server over the trace server protocol (TSP). The Trace Compass server has some built-in analysis view for that. However, it is not possible to side-load analysis and visualization descriptions over the TSP so that end-user can provide some custom views. The Trace Compass supports loading of data-driven analysis and views, e.g. XML driven views or in-and-out anlysis of the Trace Compass incubator project. In the Eclispe-based Trace Compass application, there exists UI primitive to load e.g. XML files or configure custom analysis. While the Trace Compass server has the capablility to understand these defintions, there is no way to side-load this definition over the TSP. This ADR will propose a configuration service within the TSP to facilitate these custom analysis. The proposed configuration service can be use to configure other server specific customization, e.g. custom trace parsers.

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
- `parameters`: An optional map of parameters to show to the users of the configuration

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

### Configuration service per experiment

See [Updated API poposal](#Updated API poposal) for newer, augmented proposal to this chapter.

For this data provider service will be augmented for managing configurations per experiment.

    GET experiments/{expUUID}/outputs/config
        returns a map typeId -> list of configuration descriptors of existing configurations on server
    POST experiments/{expUUID}/outputs/config
        Assign configuration to an experiment using typeId and configId from above.
        Returns configuration descriptor and list of data provider descriptors (if available)
    DELETE experiments/{expUUID}/outputs/config/{configId}
        Removes a configuration from an experiment

#### Sequence: Create configuration instance for an experiment

The following illustrates the sequence of events and messages to create an configuration instance for a given type and experiment. It uses the Trace Compass In-And-Out as example. Note, that the configuration is provided using a file.

Pre-requisite: Configuration instance created as described in [Sequence: Create configuration instance](#sequence-create-configuration-instance).

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    user->>client: Select global configuration manager
    client->>client: Open configuration manager UI
    client->>server: GET /config/
    server->>client: 200: List of ConfigurationSourceType
    client->>client: Populate drop-down menu
    user->>client: Select "In-And-Out" type
    client->>server: GET /config/types/{typeId}
    server->>client: 200: List of exiting Configuration descriptors
    client->>client: Populate UI
    user->>client: Select browse button
    client->>client: Open file chooser dialog
    user->>client: Select new "In-And-Out" analysis file
    client->>server: POST /config/types/{typeId}
    server->>client: 200: New Configuration
    client->>client: Update list of existing Configuration
    user->>client: Select experiment
    user->>client: Open Configuration Selector UI for experiments
    client->>client: Select Configuration (typeId, configId)
    Note over client,server: Configuration can be assigned for different experiments
    user->>client: Open trace
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: list of available outputs including In-And-Out outputs
    client->>client: Refresh UI
```

#### Sequence: Delete configuration instance for an experiment

The following illustrates the sequence of events and messages to delete an configuration instance for a given type and experiment.

Pre-requisite: Analysis instance created as described in [Sequence: Create configuration instance for an experiment](#sequence-create-configuration-instance-for-an-experiment).

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    user->>client: Open Configuration Selector UI for experiments
    client->>server: GET /experiments/{expUUID}/outputs/config/
    server->>client: 200: Map <typeId -> List of Configuration>
    client->>client: Populate drop-down menu
    user->>client: Select "In-And-Out" type
    client->>client: Populate UI with "In-And-Out" type only
    user->>client: Select configuration instance
    user->>client: CLick on Delete button
    client->>server: DELETE /config/types/{typeId}/configs/{configId}
    server->>client: 200
    client->>client: Refresh UI
```

### Future considerations
The proposal requires the input of the configuration be a file that needs to be provided to the trace server. This works well, however a generic front-end cannot provide a UI implementation for creating such a file with the correct syntax. Custom client extensions implementation can be implemented for that. Also, JSON forms could be used for JSON based input.

### Implementation steps

 Use configuration using file by default for external configuration. This will allow to have a generic UI implementation in `theia-trace-extension` for that. 
 The following list provides a break down in different implementation steps. This doesn't inlcude effort for the Python client.

- Configuration Service
    - TSP updates for configuration service
    - Back-end: Configuration Service (TSP) skeleton
    - Back-end: Trace Compass Server back-end API for configuration source types
    - Back-end: Trace Compass Server back-end API for XML analysis
    - Back-end: Use Trace Compass Server back-end API in Configuration Service
    - Front-end: tsp-typescript-client updates
    - Front-end: Implement simple manager UI for files per typeID (re-usable react component)
- Data provider configuration service (InAndOut)
    - TSP updates for data provider configuration service
    - Back-end: Data provider configuration service (TSP) skeleton
    - Back-end: Implement support for InAndOut configuration
    - Front-end: tsp-typescript-client updates
    - Front-end: Add UI to apply configuration to experiment (in react-component)

## Decision

The change that we're proposing or have agreed to implement, will be implemented.

## Consequences

### Easier to do

This will introduce new TSP endpoints and it's a completely new feature for trace viewers supporting supporting these endpoints in the front-end and server back-end. Once implemented, it will greatly enhance the feature capabilities of the whole application. It will help end-users to define their custom analysis and visualization definitions as well as other server side configurations, and allow them to get such features faster than having to write code in the server application, compile and re-deploy the server afterwards. This will reduce troubleshooting times for the end-users.

### More difficult

Having new TSP endpoints will make the TSP more complicated to use, and interested front-end / back-end implementations need to follow. A TSP will become larger and will need to be maintained.

### Risks introduced

The TSP will be bigger and more APIs need to be maintained on all levels of the client-server application.

### Updated API poposal

The update API proposal augments the `OutputDescriptor`, `ConfigurationSourceType` and `Configuation` to allow for more flexibility in supporting more use cases to configure new (clone data providers), other existing data provider or own data provider.


**Updates to OutputDescriptor**

```javascript
OutputDescriptor
    /**
     * Output provider's ID
     */
    id: string;
    /**
     * Human readable name
     */
    name: string;
    /**
     * Description of the output provider
     */
    description: string;
    /**
     * Type of data returned by this output.
     * Serve as a hint to determine what kind of view should be use for this output (ex. XY, Time Graph, Table, etc..)
     */
    type: string;
    configSourcesIds?: string[];
    configIds?: string[];
}
```

```javascript
ConfigurationSourceType {
    name: string,
    description: string,
    id: string,
    scope: string,
    parameterDescriptors: ConfigurationParameterDescriptor[]
}

```

```javascript
ConfigurationParameterDescriptor {
    keyName: string,
    description: string,
    dataType: string,
    isRequired: bool
}
```

```javascript
Configuration {
    name: string,
    description: string,
    id: string,
    sourceTypeId: string,
    parameters: map<string, object>,
}
```

**Example Custom Flame Chart**.

```json
ConfigurationSourceType {
    "name": Custom Flame Charts,
    "description": Manage custom flame chartsbased on input parameters,
    "id": "custom.flame.charts.id",
    "scope": "data_provider", // or self, data_provider, tree, experiment, trace
    "parameterDescriptors": [
        {
            "keyName": "title",
            "description": "Provide a name to be shown in UI",
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

```json
OutputDescriptor {
    "id": "flamechart.id",
    "name": "Flame Chart",
    "description": "Flame Chart description",
    "type": "TIME_GRAPH",
    "configSourcesIds": ["custom.flame.charts.id"]
}
```

`Menu in Available View beside "Flame Chart"`: `"Custom Flame Charts..."`

`User input`:
```json
    {"title": "CPU 0-1 only", "filter": "cpu matches [0-1]"}
```

```json
Configuration {
    "name": "CPU 0-1 only",
    "description": "Custom call stack 'CPU 0-1 only' ",
    "id": "custom.generated.id.1",
    "sourceTypeId": "custom.call.stacks.id",
    "parameters": { 
        "title": "CPU 0-1 only",
        "filter": "cpu matches [0-1]" 
    }
}
```

`"New Descriptor"`

```json
OutputDescriptor { 
        "id": "custom.callstack.id",
        "name": "CPU 0-1 only",  // name of configuration
        "description": "Custom call stack 'CPU 0-1 only' ", // description of cofiguration
        "type": "TIME_GRAPH",
        "configIds" :  ["custom.generated.id.1"]
    }
```

```mermaid
sequenceDiagram
    participant user as User
    participant client as TSP Client
    participant server as Trace Server
    client->>server: GET /experiments/{expUUID}/outputs
    server->>client: 200: List of Available Views
    client->>client: Render "Available Views" view and config menu buttons if configSourcesIds.length() > 0
    user->>client: Click menu beside 'Flame Chart' in 'Available Views'
    client->>client: View menu opens with entry all names from configSourcesIds
    user->>client: Click on 'Custom Flame Charts..."
    client->>client: Open Dialog for ConfigurationSourceType:'Custom Flame Charts'
    user->>client: Fill in 'title' and 'filter' and click on 'Apply'
    client->>server: POST /config/types/{typeId} {title, filter}
    server->>server: Validate and persist config
    server->>client: 200: Configuration Instance
    client->>server: POST /experiments/{expUUID}/outputs/{outputId}/configs/ {configId}
    server->>server: Create new data provider
    server->>client: 200: OutputDescriptor
    client->>client: Refresh 'Available views' view
    user->>client: User clicks on new output
    client->>client: Customized view opens
 ```   

**Example: Critical Path**.

```json
ConfigurationSourceType {
    "name": Follow Thread Filter,
    "description": Manages parameters for thread filter,
    "id": "thread.filter.id",
    "scope": "tree", // or data_provider, tree (for context sensitive menu), experiment, trace, 
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

```json
OutputDescriptor {
    "id": "thread.status.id",
    "name": "Thread Status",
    "description": "Thread Status description",
    "type": "TIME_GRAPH",
    "configSourcesIds": ["follow.thread.id"]
}
```

`Context sensitive menu on tree of "Thread Status View"`: `"Follow Thread Filter"` 

`User input by selection and not dialog`:

```json
Configuration {
    "name": "My thread", // thread name
    "description": "Thread filter",
    "id": "thread.filter.generated.id.1",
    "sourceTypeId": "thread.filter.id",
    "parameters": {
        "extraParams": "{\"name\": \"My Thread\", \"tid\": \"1234\", \"host\": \"hostId\"}" ,
    }
}

`New Descriptor`

```json
OutputDescriptor { 
        "id": "critical.path.id",
        "name": "Critical Path for 'My thread'",  // name of configuration
        "description": "Critical Path for ' ", // description of cofiguration
        "type": "TIME_GRAPH",
        "configIds" :  ["custom.generated.id.1"]
    }
```
Create 
- When opening critical path view add extraParams to queries
- When doing it a second time critical path view needs to be refreshed with new extra query params
    Alternatively, you can have multiple critical path data provider for each thread configured.

**Example: Active Thread Filter**.

```json
ConfigurationSourceType {
    "name": Active Thread Filter,
    "description": Manages parameters for active thread filter,
    "id": "active.thread.filter.id",
    "scope": "self", // or self, data_provider, tree (for context sensitive menu), experiment, trace, 
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

```json
OutputDescriptor {
    "id": "thread.status.id",
    "name": "Thread Status",
    "description": "Thread Status description",
    "type": "TIME_GRAPH",
    "configSourcesIds": ["active.thread.filter.id"]
}
```

`View menu in "Thread Status View" (because of self)`: `"Active Thread Filter..."`

`User input`:
```json
    {"isActiveThreadFilter": "true", "cpus": "0-1"}
```

```json
Configuration {
    "name": "Active Thread Filter for cpu 0-1",
    "description": "Active Thread Filter for cpu 0-1",
    "id": "active.thread.filter.generated.id.1",
    "sourceTypeId": "active.thread.filter.id",
    "parameters": {
        "extraParams": "{\"isActiveThreadFilter\": \"true\", \"requested_cpus\": [0, 1] }" ,
    }
}
```

`New Descriptor`

```json
OutputDescriptor { 
    "id": "thread.status.id",
    "name": "Thread Status",
    "description": "Thread Status description",
    "type": "TIME_GRAPH",
    "configIds" :  ["active.thread.filter.generated.id.1"]
    }
```

- When doing clicking a second time, user can add new filter


**Example: XY Chart From Events Table**.

```json
ConfigurationSourceType {
    "name": Custom XY TIME Charts,
    "description": Manages custom XY time series,
    "id": "custom.xy.time.charts.id",
    "scope": "data_provider", // or self, data_provider, tree (for context sensitive menu), experiment, trace, 
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

```json
OutputDescriptor {
    "id": "events.table.id",
    "name": "Events Table",
    "description": "Event Table description",
    "type": "TABLE",
    "configSourcesIds": ["custom.xy.time.charts.id"]
}
```

`Menu in Available views view beside Events Table`: `"Custom XY TIME Charts..."`

`User input`:
```json
    {
        "title": "CPU Number Plot", 
        "columns": ["CPU"],
        "filter": "tid==1234",
        "y-axis": "CPU",
        "y-unit": "no-unit",
        "y-data-type": "Number"
    }
```

```json
Configuration {
    "name": "CPU Number Plot",
    "description": "Plots the CPU over time for given filter",
    "id": "custom.xy.time.charts.instance.1",
    "sourceTypeId": "custom.xy.time.charts.id",
    "parameters": {
        "title": "CPU Number Plot", 
        "columns": ["CPU"], 
        "filter": "tid==1234",
        "y-axis": "CPU",
        "y-unit": "no-unit",
        "y-data-type": "Number"
    }
}
```

`New Descriptor`

```json
OutputDescriptor { 
    "id": "custom.xy.plot.id.1",
    "name": "CPU Number Plot",
    "description": "Plots the CPU over time for given filter",
    "type": "TREE_TIME_XY",
    "configIds" :  ["custom.xy.time.charts.instance.1"]
    }
```




**Example: Custom Function Execution Statistics**.

```json
ConfigurationSourceType {
    "name": Custom Function Execution Statistics,
    "description": Manages Custom Function Execution Statistics,
    "id": "custom.fct.execution.stats.id",
    "scope": "data_provider", // or self, data_provider, tree (for context sensitive menu), experiment, trace, 
    "parameterDescriptors": [
        {
            "keyName": "title",
            "description": "title of graph",
            "dataType": "string",
            "isRequired": "true"
        },
        {
            "keyName": "aggregation",
            "description": "Aggregate stats for functions matching regex",
            "dataType": "string",
            "isRequired": "optional"
        },
        {
            "keyName": "filter",
            "description": "Show stats for functions matching regex",
            "dataType": "array",
            "isRequired": "optional"
        }
    ]
}
```

```json
OutputDescriptor {
    "id": "segmentstore.latency.analysis.statistics:callstack.analysis",
    "name": "Function Execution statistics",
    "description": "Function Execution statistics",
    "type": "DATA_TREE",
    "configSourcesIds": ["custom.fct.execution.stats.id"]
}
```

`Menu in Available views view beside Function Duration Statistics`: `"Custom Function Execution Statistics..."`

`User input`:
```json
    {
        "title": "Grouped Stats", 
        "aggregation": "label matches COM.*"
    }
```

```json
Configuration {
    "name": "Grouped Stats",
    "description": "Custom function duration statistics aggregated by name: [COM.*]",
    "id": "custom.fct.execution.stats.id.instance.1",
    "sourceTypeId": "custom.fct.execution.stats.id",
    "parameters": {
        "title": "Grouped Stats", 
        "aggregation": "label matches COM.*"
    }
}
```

`New Descriptor`

```json
OutputDescriptor { 
    "id": "segmentstore.latency.analysis.statistics:callstack.analysis:custom.fct.execution.stats.id.instance.1",
    "name": "CPU Number Plot",
    "description": "Custom function duration statistics aggregated by name: [COM.*]",
    "type": "DATA_TREE",
    "configIds" :  ["custom.fct.execution.stats.id.instance.1"]
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


