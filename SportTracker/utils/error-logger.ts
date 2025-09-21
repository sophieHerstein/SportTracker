import * as FileSystem from 'expo-file-system';

const LOG_FILE_PATH = FileSystem.documentDirectory + 'error_log.txt';

export async function logErrorToFile(error: any, info?: any) {
    const timestamp = new Date().toISOString();
    const content = `[${timestamp}] ${error?.message || error}\n${info ? JSON.stringify(info) : ''}\n\n`;
    await FileSystem.writeAsStringAsync(
        LOG_FILE_PATH,
        content,
        { encoding: FileSystem.EncodingType.UTF8,
            // @ts-expect-error: `append` ist kein offizielles Typfeld, funktioniert aber dennoch
            append: true }
    );
}

export async function getErrorLogContent() {
    const exists = await FileSystem.getInfoAsync(LOG_FILE_PATH);
    if (!exists.exists) return null;
    return await FileSystem.readAsStringAsync(LOG_FILE_PATH);
}

export async function clearErrorLog() {
    const exists = await FileSystem.getInfoAsync(LOG_FILE_PATH);
    if (exists.exists) await FileSystem.deleteAsync(LOG_FILE_PATH);
}