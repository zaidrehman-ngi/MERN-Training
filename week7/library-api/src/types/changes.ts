export type Changes<T> = { [K in keyof T]?: T[K] | undefined };
