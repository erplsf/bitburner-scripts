import { NS } from "@ns";

export enum LogLevel {
    Error = "ERROR",
    Success = "SUCCESS",
    Warn = "WARN",
    Info = "INFO",
}

export function log(ns: NS, level: LogLevel, prefix: string, message: string): void {
    const finalMessage = `${level}: ${prefix} ${message}`
    ns.print(message)
    ns.write(buildLogFn(ns.getScriptName()), finalMessage, 'a')
}

export function buildLogFn(scriptFn: string): string {
    return scriptFn.split('.js')[0] + '.txt'
}
