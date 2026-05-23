import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
export declare const initializeSocketIO: (httpServer: HttpServer) => Server;
export declare const getIO: () => Server;
export declare const broadcastInventoryUpdate: (propertyId: string, slotId: string, status: string, data?: Record<string, unknown>) => Promise<void>;
export declare const sendUserNotification: (userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}) => Promise<void>;
declare const _default: {
    initializeSocketIO: (httpServer: HttpServer) => Server;
    getIO: () => Server;
    broadcastInventoryUpdate: (propertyId: string, slotId: string, status: string, data?: Record<string, unknown>) => Promise<void>;
    sendUserNotification: (userId: string, notification: {
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
    }) => Promise<void>;
};
export default _default;
//# sourceMappingURL=socket.d.ts.map