import { NS } from "@ns";

export enum LogLevel {
    Error = "ERROR",
    Success = "SUCCESS",
    Warn = "WARN",
    Info = "INFO",
}

export function log(ns: NS, level: LogLevel, prefix: string, message: string): void {
    ns.print(`${level}: ${prefix} ${message}`)
}
