import { EventEmitter } from 'events';
import { OutputDescriptor } from 'tsp-typescript-client';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { Trace } from 'tsp-typescript-client/lib/models/trace';
import { OpenedTracesUpdatedSignalPayload } from './opened-traces-updated-signal-payload';
import { OutputAddedSignalPayload } from './output-added-signal-payload';
import { TimeRangeUpdatePayload } from './time-range-data-signal-payloads';
import { ContextMenuContributedSignalPayload } from './context-menu-contributed-signal-payload';
import { ContextMenuItemClickedSignalPayload } from './context-menu-item-clicked-signal-payload';
import { RowSelectionsChangedSignalPayload } from './row-selections-changed-signal-payload';
import { ItemPropertiesSignalPayload } from './item-properties-signal-payload';

export declare interface SignalManager {
    fireTraceOpenedSignal(trace: Trace): void;
    fireTraceDeletedSignal(trace: Trace): void;
    fireExperimentOpenedSignal(experiment: Experiment): void;
    fireExperimentClosedSignal(experiment: Experiment): void;
    fireExperimentDeletedSignal(experiment: Experiment): void;
    fireExperimentSelectedSignal(experiment: Experiment | undefined): void;
    fireExperimentUpdatedSignal(experiment: Experiment): void;
    fireOpenedTracesChangedSignal(payload: OpenedTracesUpdatedSignalPayload): void;
    fireOutputAddedSignal(payload: OutputAddedSignalPayload): void;
    fireItemPropertiesSignalUpdated(payload: ItemPropertiesSignalPayload): void;
    fireThemeChangedSignal(theme: string): void;
    // TODO - Refactor or remove this signal.  Similar signal to fireRequestSelectionRangeChange
    fireSelectionChangedSignal(payload: { [key: string]: string }): void;
    fireRowSelectionsChanged(payload: RowSelectionsChangedSignalPayload): void;
    fireCloseTraceViewerTabSignal(traceUUID: string): void;
    fireTraceViewerTabActivatedSignal(experiment: Experiment): void;
    fireUpdateZoomSignal(hasZoomedIn: boolean): void;
    fireResetZoomSignal(): void;
    fireMarkerCategoriesFetchedSignal(): void;
    fireMarkerSetsFetchedSignal(): void;
    fireMarkerCategoryClosedSignal(payload: { traceViewerId: string; markerCategory: string }): void;
    fireTraceServerStartedSignal(): void;
    fireUndoSignal(): void;
    fireRedoSignal(): void;
    fireOutputDataChanged(outputs: OutputDescriptor[]): void;
    fireOpenOverviewOutputSignal(traceId: string): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    firePinView(output: OutputDescriptor, payload?: any): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fireUnPinView(output: OutputDescriptor, payload?: any): void;
    fireOverviewOutputSelectedSignal(payload: { traceId: string; outputDescriptor: OutputDescriptor }): void;
    fireSaveAsCsv(payload: { traceId: string; data: string }): void;
    fireSelectionRangeUpdated(payload: TimeRangeUpdatePayload): void;
    fireViewRangeUpdated(payload: TimeRangeUpdatePayload): void;
    fireRequestSelectionRangeChange(payload: TimeRangeUpdatePayload): void;
    fireContributeContextMenu(payload: ContextMenuContributedSignalPayload): void;
    fireContextMenuItemClicked(payload: ContextMenuItemClickedSignalPayload): void;
}

export const Signals = {
    TRACE_OPENED: 'trace opened',
    TRACE_DELETED: 'trace deleted',
    EXPERIMENT_OPENED: 'experiment opened',
    EXPERIMENT_CLOSED: 'experiment closed',
    EXPERIMENT_DELETED: 'experiment deleted',
    EXPERIMENT_SELECTED: 'experiment selected',
    EXPERIMENT_UPDATED: 'experiment updated',
    OPENED_TRACES_UPDATED: 'opened traces updated',
    AVAILABLE_OUTPUTS_CHANGED: 'available outputs changed',
    OUTPUT_ADDED: 'output added',
    ITEM_PROPERTIES_UPDATED: 'item properties updated',
    THEME_CHANGED: 'theme changed',
    SELECTION_CHANGED: 'selection changed',
    ROW_SELECTIONS_CHANGED: 'rows selected changed',
    CLOSE_TRACEVIEWERTAB: 'tab closed',
    TRACEVIEWERTAB_ACTIVATED: 'widget activated',
    UPDATE_ZOOM: 'update zoom',
    RESET_ZOOM: 'reset zoom',
    UNDO: 'undo',
    REDO: 'redo',
    MARKER_CATEGORIES_FETCHED: 'marker categories fetched',
    MARKERSETS_FETCHED: 'markersets fetched',
    MARKER_CATEGORY_CLOSED: 'marker category closed',
    TRACE_SERVER_STARTED: 'trace server started',
    PIN_VIEW: 'view pinned',
    UNPIN_VIEW: 'view unpinned',
    OPEN_OVERVIEW_OUTPUT: 'open overview output',
    OVERVIEW_OUTPUT_SELECTED: 'overview output selected',
    SAVE_AS_CSV: 'save as csv',
    VIEW_RANGE_UPDATED: 'view range updated',
    SELECTION_RANGE_UPDATED: 'selection range updated',
    REQUEST_SELECTION_RANGE_CHANGE: 'change selection range',
    OUTPUT_DATA_CHANGED: 'output data changed',
    CONTRIBUTE_CONTEXT_MENU: 'contribute context menu',
    CONTEXT_MENU_ITEM_CLICKED: 'context menu item clicked'
};

export class SignalManager extends EventEmitter implements SignalManager {
    private managerId: string;
    private listenerRegisterersPerEvent = new Map<string, string[]>();
    private currentDepth;

    constructor() {
        super();
        this.managerId = getNonce();
        this.currentDepth = 0;
        console.log(`*** Creation of SignalManager, id: ${this.managerId}`);
    }

    getId(): string {
        return this.managerId;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(sender: string, event: string | symbol, ...args: any[]): boolean {
        let expName = 'n/a';
        if (args[0] && args[0].name) {
            expName = args[0].name;
        }

        const ev = event.toString();
        const listeners = this.listeners(event);
        const callers = this.getEventListenerRegisterers(ev);

        this.currentDepth++;
        if (this.currentDepth > 1) {
            this.getCaller();
        }
        console.log(`sender[${sender}]=> [calling listeners] SignalManager[${this.managerId}, depth: ${this.currentDepth}]: Firing Event: '${ev}', trace/exp: ${expName} ` +
            `. Will call ${listeners.length} listener(s)`);

        listeners.forEach((listener, index) => {
            const caller = (callers && callers[index]) ? callers[index] : '<unknown>';
            console.log(`   -> [calling listener] - [listener idx=${index}/${listeners.length - 1}] SignalManager[${this.managerId}]:` +
              `Calling listener [name: ${caller}], event: '${ev}' (trace/exp: ${expName})`);
            listener(...args);
          });

        this.currentDepth--;
        return listeners.length > 0;
        // return super.emit(event, ...args, this.managerId, seq);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        const listenerIndex = this.listeners(event).length;
        const eventName = event.toString();
        const caller = this.getCaller();
        const listenerStr = listener.toString().split('=>')[1];
        // console.log(`******************** listener.toString(): ${listenerStr}`);
        this.saveEventListenerRegisterer(eventName, listenerIndex, caller);

        console.log(`-> [new listener] SignalManager[${this.managerId}]#on(): Registering Listener[event='${eventName}', idx=${listenerIndex}] - caller: ${caller}`);
        return super.on(event, listener);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    off(event: string | symbol, listener: (...args: any[]) => void): this {
        let listenerIndex = this.listeners(event).length;
        const eventName = event.toString();
        const caller = this.getCaller();
        const listenerStr = listener.toString().split('=>')[1];
        // console.log(`******************** listener.toString(): ${listenerStr}`);
        if (listenerIndex === 0) {
            console.log(`-> [remove listener (none)] SignalManager[${this.managerId}]#on(): Registering Listener[event='${eventName}', idx=${listenerIndex}] - caller: ${caller}`);
        } else {
            this.removeEventListenerRegisterer(eventName, listenerIndex, caller);
            listenerIndex = this.listeners(event).length;
            console.log(`-> [remove listener] SignalManager[${this.managerId}]#on(): Registering Listener[event='${eventName}', idx=${listenerIndex}] - caller: ${caller}`);
        }
        return super.off(event, listener);
    }

    private saveEventListenerRegisterer(event: string, index: number, caller: string) {
        let listenerCallers: string[] | undefined;
        if (index === 0) {
            listenerCallers = [];
        } else {
            listenerCallers = this.listenerRegisterersPerEvent.get(event);
        }
        if (listenerCallers) {
            listenerCallers.push(caller);
            this.listenerRegisterersPerEvent.set(event, listenerCallers);
        }
    }

    private removeEventListenerRegisterer(event: string, index: number, caller: string) {
      const listenerCallers: string[] | undefined = this.listenerRegisterersPerEvent.get(event);

        if (listenerCallers) {
            const i = listenerCallers.indexOf(caller);
            listenerCallers.splice(i, 1);
            this.listenerRegisterersPerEvent.set(event, listenerCallers);
        }
    }

    private getEventListenerRegisterers(event: string): string[] | undefined {
        const callers = this.listenerRegisterersPerEvent.get(event);
        if (callers) {
            return callers;
        }
        return;
    }

    fireTraceOpenedSignal(trace: Trace): void {
        this.emit(this.getCaller(), Signals.TRACE_OPENED, trace);
    }
    fireTraceDeletedSignal(trace: Trace): void {
        this.emit(this.getCaller(), Signals.TRACE_DELETED, { trace });
    }
    fireExperimentOpenedSignal(experiment: Experiment): void {
        this.emit(this.getCaller(), Signals.EXPERIMENT_OPENED, experiment);
    }
    fireExperimentClosedSignal(experiment: Experiment): void {
        this.emit(this.getCaller(), Signals.EXPERIMENT_CLOSED, experiment);
    }
    fireExperimentDeletedSignal(experiment: Experiment): void {
        this.emit(this.getCaller(), Signals.EXPERIMENT_DELETED, experiment);
    }
    fireExperimentSelectedSignal(experiment: Experiment | undefined): void {
        this.emit(this.getCaller(), Signals.EXPERIMENT_SELECTED, experiment);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fireRowSelectionsChanged(payload: RowSelectionsChangedSignalPayload): void {
        this.emit(this.getCaller(), Signals.ROW_SELECTIONS_CHANGED, payload);
    }
    fireExperimentUpdatedSignal(experiment: Experiment): void {
        this.emit(this.getCaller(), Signals.EXPERIMENT_UPDATED, experiment);
    }
    fireOpenedTracesChangedSignal(payload: OpenedTracesUpdatedSignalPayload): void {
        this.emit(this.getCaller(), Signals.OPENED_TRACES_UPDATED, payload);
    }
    fireOutputAddedSignal(payload: OutputAddedSignalPayload): void {
        this.emit(this.getCaller(), Signals.OUTPUT_ADDED, payload);
    }
    fireItemPropertiesSignalUpdated(payload: ItemPropertiesSignalPayload): void {
        this.emit(this.getCaller(), Signals.ITEM_PROPERTIES_UPDATED, payload);
    }
    fireThemeChangedSignal(theme: string): void {
        this.emit(this.getCaller(), Signals.THEME_CHANGED, theme);
    }
    fireSelectionChangedSignal(payload: { [key: string]: string }): void {
        this.emit(this.getCaller(), Signals.SELECTION_CHANGED, payload);
    }
    fireCloseTraceViewerTabSignal(traceUUID: string): void {
        this.emit(this.getCaller(), Signals.CLOSE_TRACEVIEWERTAB, traceUUID);
    }
    fireTraceViewerTabActivatedSignal(experiment: Experiment): void {
        this.emit(this.getCaller(), Signals.TRACEVIEWERTAB_ACTIVATED, experiment);
    }
    fireUpdateZoomSignal(hasZoomedIn: boolean): void {
        this.emit(this.getCaller(), Signals.UPDATE_ZOOM, hasZoomedIn);
    }
    fireResetZoomSignal(): void {
        this.emit(this.getCaller(), Signals.RESET_ZOOM);
    }
    fireMarkerCategoriesFetchedSignal(): void {
        this.emit(this.getCaller(), Signals.MARKER_CATEGORIES_FETCHED);
    }
    fireMarkerSetsFetchedSignal(): void {
        this.emit(this.getCaller(), Signals.MARKERSETS_FETCHED);
    }
    fireMarkerCategoryClosedSignal(payload: { traceViewerId: string; markerCategory: string }): void {
        this.emit(this.getCaller(), Signals.MARKER_CATEGORY_CLOSED, payload);
    }
    fireTraceServerStartedSignal(): void {
        this.emit(this.getCaller(), Signals.TRACE_SERVER_STARTED);
    }
    fireUndoSignal(): void {
        this.emit(this.getCaller(), Signals.UNDO);
    }
    fireRedoSignal(): void {
        this.emit(this.getCaller(), Signals.REDO);
    }
    fireOutputDataChanged(outputs: OutputDescriptor[]): void {
        this.emit(this.getCaller(), Signals.OUTPUT_DATA_CHANGED, outputs);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    firePinView(output: OutputDescriptor, payload?: any): void {
        this.emit(this.getCaller(), Signals.PIN_VIEW, output, payload);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    fireUnPinView(output: OutputDescriptor, payload?: any): void {
        this.emit(this.getCaller(), Signals.UNPIN_VIEW, output, payload);
    }
    fireOpenOverviewOutputSignal(traceId: string): void {
        this.emit(this.getCaller(), Signals.OPEN_OVERVIEW_OUTPUT, traceId);
    }
    fireOverviewOutputSelectedSignal(payload: { traceId: string; outputDescriptor: OutputDescriptor }): void {
        this.emit(this.getCaller(), Signals.OVERVIEW_OUTPUT_SELECTED, payload);
    }
    fireSaveAsCsv(payload: { traceId: string; data: string }): void {
        this.emit(this.getCaller(), Signals.SAVE_AS_CSV, payload);
    }
    fireViewRangeUpdated(payload: TimeRangeUpdatePayload): void {
        this.emit(this.getCaller(), Signals.VIEW_RANGE_UPDATED, payload);
    }
    fireSelectionRangeUpdated(payload: TimeRangeUpdatePayload): void {
        this.emit(this.getCaller(), Signals.SELECTION_RANGE_UPDATED, payload);
    }
    fireRequestSelectionRangeChange(payload: TimeRangeUpdatePayload): void {
        this.emit(this.getCaller(), Signals.REQUEST_SELECTION_RANGE_CHANGE, payload);
    }
    fireContributeContextMenu(payload: ContextMenuContributedSignalPayload): void {
        this.emit(this.getCaller(), Signals.CONTRIBUTE_CONTEXT_MENU, payload);
    }
    fireContextMenuItemClicked(payload: ContextMenuItemClickedSignalPayload): void {
        this.emit(this.getCaller(), Signals.CONTEXT_MENU_ITEM_CLICKED, payload);
    }

    // hacky way to figure-out who registered a listener
    private getCaller(): string {
        const stackTrace = new Error().stack?.split('\n');
        if (stackTrace) {
            const entry = stackTrace[3].trim().split(' ');
            let inConstructor = false;
            const packFile = detectPack(entry);
            for (let i = 0; i < entry.length; i++ ) {
                if (entry[i] === 'at') {
                    continue;
                } else if (entry[i] === 'new') {
                    inConstructor = true;
                    continue;
                }
                entry[i] = inConstructor ? '(constructor) ' + entry[i] : entry[i];
                return packFile ? entry[i] + ` (packfile: ${packFile})` : entry[i];
            }
        }
        return '<???>';
    }
}

function detectPack(stackFrame: string[]) {
    for (let i = 0; i< stackFrame.length; i++) {
        if (stackFrame[i].includes('/pack/')) {
            return stackFrame[i].substring(stackFrame[i].indexOf('/pack/'));
        }
    }
    return undefined;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 8; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// function getInitialSeq() {
//     // Return a nice round number
//     return (Math.round(Math.random() * 1000) * 1000);
// }

let instance: SignalManager = new SignalManager();

export const setSignalManagerInstance = (sm: SignalManager): void => {
    instance = sm;
};

export const signalManager = (): SignalManager => instance;
