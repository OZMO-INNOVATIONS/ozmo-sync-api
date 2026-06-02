export declare const configuration: () => {
    port: number;
    nodeEnv: string;
    appName: string;
    rateLimit: {
        login: {
            windowMs: number;
            max: number;
        };
        global: {
            windowMs: number;
            max: number;
        };
    };
    corsOrigin: string;
};
export type Configuration = ReturnType<typeof configuration>;
