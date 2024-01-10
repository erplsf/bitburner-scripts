import { NS } from "@ns";
import { serverList } from "lib/servers";
import { buildLogFn, log, LogLevel } from "lib/logging";

type Opener = "brutessh" | "ftpcrack" | "relaysmtp" | "httpworm" | "sqlinject";

const openers: Opener[] = [
  "brutessh",
  "ftpcrack",
  "relaysmtp",
  "httpworm",
  "sqlinject",
];

const logPrefix = "[rooter]";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.write(buildLogFn(ns.getScriptName()), "");
  let currentHackingLevel = ns.getHackingLevel();
  for (;;) {
    const nonRootedServers = serverList(ns).filter((server) => !server.root);
    if (nonRootedServers.length == 0) break;
    const availableOpeners = getAvailableOpeners(ns);
    const rootableServers = nonRootedServers.filter(
      (server) =>
        server.requiredLevel <= currentHackingLevel &&
        server.requiredPorts <= availableOpeners.length,
    );
    for (const server of rootableServers) {
      applyOpeners(ns, server.name, availableOpeners);
      ns.nuke(server.name);
      log(ns, LogLevel.Info, logPrefix, `Rooted ${server.name}`);
    }
    log(
      ns,
      LogLevel.Info,
      logPrefix,
      `Waiting until hacking level increases...`,
    );
    while (currentHackingLevel == ns.getHackingLevel()) await ns.asleep(1000);
    currentHackingLevel = ns.getHackingLevel();
  }
}

function getAvailableOpeners(ns: NS): Opener[] {
  return openers.filter((opener) => ns.fileExists(`${opener}.exe`, "home"));
}

function applyOpeners(ns: NS, host: string, openers: Opener[]) {
  for (const opener of openers) {
    switch (opener) {
      case "brutessh": {
        ns.brutessh(host);
        break;
      }
      case "ftpcrack": {
        ns.ftpcrack(host);
        break;
      }
      case "httpworm": {
        ns.httpworm(host);
        break;
      }
      case "relaysmtp": {
        ns.relaysmtp(host);
        break;
      }
      case "sqlinject": {
        ns.sqlinject(host);
        break;
      }
    }
  }
}
