import { DeletedObjects } from './object-difference';
export declare function filterObject(source: any, filter: DeletedObjects | boolean): DeletedObjects;
export declare const isFilterObject: (o: any) => o is object;
