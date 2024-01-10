import { NS } from "@ns";

export enum LogLevel {
  Error = "ERROR",
  Success = "SUCCESS",
  Warn = "WARN",
  Info = "INFO",
}

export function log(
  ns: NS,
  level: LogLevel,
  prefix: string,
  message: string,
): void {
  const time = new Date().toISOString();
  const finalMessage = `${time} ${level}: ${prefix} ${message}`;
  ns.print(finalMessage);
  ns.write(buildLogFn(ns.getScriptName()), finalMessage + "\n", "a");
}

export function buildLogFn(scriptFn: string): string {
  return scriptFn.split(".js")[0] + ".txt";
}
