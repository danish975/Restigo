import { Queue } from 'bullmq';
export declare const bookingExpirationQueue: Queue<any, any, string, any, any, string>;
export declare const notificationQueue: Queue<any, any, string, any, any, string>;
export declare const paymentReconciliationQueue: Queue<any, any, string, any, any, string>;
export declare const mlUpdateQueue: Queue<any, any, string, any, any, string>;
export declare const analyticsQueue: Queue<any, any, string, any, any, string>;
export declare const initializeQueues: () => Promise<void>;
export declare const getQueueConnection: () => {
    host: string;
    port: number;
    password: string | undefined;
    maxRetriesPerRequest: null;
};
//# sourceMappingURL=bull.d.ts.map