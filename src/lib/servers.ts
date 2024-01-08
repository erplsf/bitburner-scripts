import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.tprint(serverList(ns));
}

export function serverList(ns: NS): string[] {
  let allServers: Set<string> = new Set(['home']);
  allServers.forEach((server) => {
    const servers = ns.scan(server);
    servers.forEach((foundServer) => allServers.add(foundServer));
  });
  return Array.from(allServers.values())
}
