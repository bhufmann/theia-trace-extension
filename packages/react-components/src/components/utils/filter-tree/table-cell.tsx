import * as React from 'react';
import { TreeNode } from './tree-node';

interface TableCellProps {
    node: TreeNode;
    index: number;
    children?: React.ReactNode | React.ReactNode[];
    onRowClick: (id: number) => void;
    onContextMenu: (event: React.MouseEvent<HTMLDivElement>, id: number) => void;
    selectedRow?: number;
}

export class TableCell extends React.Component<TableCellProps> {
    constructor(props: TableCellProps) {
        super(props);
    }

    private onClick = () => {
        const { node, onRowClick } = this.props;
        if (onRowClick) {
            onRowClick(node.id);
        }
    };

    private onContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        const { node, onContextMenu } = this.props;
        console.log('x:' + event.clientX + ', y:' + event.clientY);
        if (onContextMenu) {
            onContextMenu(event, node.id);
        }
    };

    render(): React.ReactNode {
        const { node, selectedRow, index } = this.props;
        const content = node.labels[index];
        const className = (selectedRow === node.id) ? 'selected' : '';

        return (
            <td key={this.props.index+'-td-'+this.props.node.id}
                     onClick={this.onClick}
                     onContextMenu={event => {this.onContextMenu(event); }}
                     className={className}>
                <span>
                    {this.props.children}
                    {content}
                </span>
            </td>
        );
    }
}
