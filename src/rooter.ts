import { NS } from "@ns";
import { serverList } from "lib/servers";

type Opener = 'brutessh' | 'ftpcrack'

const openers: Opener[] = [
    'brutessh'
    'ftpcrack'
]

export async function main(ns: NS): Promise<void> {
  let currentHackingLevel = ns.getHackingLevel()
  for (;;) {
    const nonRootedServers = serverList(ns).filter(server => !server.root)
    if (nonRootedServers.length == 0) break
    const availableOpeners = getAvailableOpeners(ns)
    const rootableServers = nonRootedServers.filter(
        server => server.requiredLevel <= currentHackingLevel &&
                  server.requiredPorts <= availableOpeners.length
    )
    for (const server of rootableServers) {
        applyOpeners(ns, server.name, availableOpeners)
        ns.nuke(server.name)
    }
    while (currentHackingLevel == ns.getHackingLevel()) await ns.sleep(1000)
    currentHackingLevel = ns.getHackingLevel()
  }
}

function getAvailableOpeners(ns: NS): Opener[] {
    return openers.filter(opener => ns.fileExists(`${opener}.exe`, 'home'))
}

function applyOpeners(ns: NS, host: string, openers: Opener[]) {
    for (const opener of openers) {
        switch(opener) {
                case 'brutessh': {
                    ns.brutessh(host)
                    break
                }
                case 'ftpcrack': {
                    ns.ftpcrack(host)
                    break
                }
        }
    }
}
