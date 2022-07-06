import mcache from 'memory-cache';

export function putCache(url: string, body: any, duration: number) {
    mcache.put('squirrelly_' + url, body, duration * 1000);
}