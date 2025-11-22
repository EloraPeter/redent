declare module "react-beautiful-dnd" {
    import * as React from "react";

    export interface DraggableProvided {
        innerRef: (element?: HTMLElement | null) => any;
        draggableProps: React.HTMLAttributes<HTMLElement>;
        dragHandleProps?: React.HTMLAttributes<HTMLElement>;
    }

    export interface DroppableProvided {
        innerRef: (element?: HTMLElement | null) => any;
        droppableProps: React.HTMLAttributes<HTMLElement>;
        placeholder?: React.ReactNode;
    }

    export interface DropResult {
        source: { index: number; droppableId: string };
        destination: { index: number; droppableId: string } | null;
        draggableId: string;
        type: string;
    }

    export const DragDropContext: React.FC<{
        onDragEnd: (result: DropResult) => void | Promise<void>;
        children?: React.ReactNode;
    }>;
    export const Droppable: React.FC<{
        droppableId: string;
        children: (provided: DroppableProvided) => React.ReactNode;
    }>;
    export const Draggable: React.FC<{
        draggableId: string;
        index: number;
        children: (provided: DraggableProvided) => React.ReactNode;
    }>;
}
