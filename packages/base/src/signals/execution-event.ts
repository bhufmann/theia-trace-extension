export interface ExecutionEvent {
    command: string;
    commandName: string;
    source: string;
    parameters: { [key: string]: unknown };
}
