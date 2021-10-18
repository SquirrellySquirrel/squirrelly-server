export function stringAsBoolean(param: string | undefined, defaultVal: boolean): boolean {
    if (param && param.trim().length > 0) {
        return JSON.parse(param);
    }
    return defaultVal;
}

export function stringAsNumber(param: string | undefined): number | undefined {
    if (param && param.trim().length > 0) {
        return Number(param);
    }
    return undefined;
}