import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  let allServers: Set<string> = new Set(['home']);
  allServers.forEach((server) => {
    const servers = ns.scan(server);
    servers.forEach((foundServer) => allServers.add(foundServer));
  });
  ns.tprint(allServers);
}
