export interface UpdatedObjects {
    [key: string]: UpdatedObjects | object;
}
export interface DeletedObjects {
    [key: string]: DeletedObjects | boolean;
}
export declare const isShallow: (val: any) => boolean;
declare type Obj = {
    [key: string]: any;
};
export declare function objectDifference(old: Obj, curr: Obj): {
    updated: UpdatedObjects;
    deleted: DeletedObjects;
};
export {};
