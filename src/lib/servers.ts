import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.tprint(serverList(ns).filter(s => s.freeRAM > 0).sort((a, b) => a.freeRAM - b.freeRAM));
}

export interface Server {
  name: string
  freeRAM: number
  root: boolean
  requiredLevel: number
  requiredPorts: number
  score: number
}

export function serverList(ns: NS): Server[] {
  let allServers: Set<string> = new Set(['home']);
  allServers.forEach((server) => {
    const servers = ns.scan(server);
    servers.forEach((foundServer) => allServers.add(foundServer));
  });
  return Array.from(allServers.values()).map(host => buildServer(ns, host))
}

function buildServer(ns: NS, host: string): Server {
  return {
    name: host,
    freeRAM: getServerFreeRAM(ns, host),
    root: ns.hasRootAccess(host),
    requiredLevel: ns.getServerRequiredHackingLevel(host),
    requiredPorts: ns.getServerNumPortsRequired(host),
    score: ns.getServerMaxMoney(host) / ns.getServerMinSecurityLevel(host)
  }
}

export function getServerFreeRAM(ns: NS, host: string): number {
  return ns.getServerMaxRam(host) - ns.getServerUsedRam(host)
}

export function isServerPrepared(ns: NS, host: string): boolean {
  return ns.getServerMoneyAvailable(host) == ns.getServerMaxMoney(host) &&
         ns.getServerSecurityLevel(host) == ns.getServerMinSecurityLevel(host)
}
