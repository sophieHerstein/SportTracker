export type DebouncedFunction<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
    cancel: () => void;
};

export function debounce<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    waitMs: number
): DebouncedFunction<TArgs> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const debounced = ((...args: TArgs) => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            timeoutId = undefined;
            callback(...args);
        }, waitMs);
    }) as DebouncedFunction<TArgs>;

    debounced.cancel = () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };

    return debounced;
}
