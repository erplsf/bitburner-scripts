import { NS } from "@ns";
import { isServerPrepared, serverList } from "lib/servers";
import { Job, schedule, waitTillPidsDie } from "lib/scheduler";
import { log, LogLevel } from "lib/logging";

const logPrefix = '[manager]'

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL")
    const hackingThreshold = Math.max(1, ns.getHackingLevel() / 2)
    const candidateServers = serverList(ns)
        .filter(s => s.root)
        .filter(s => hackingThreshold >= s.requiredLevel)
    // sort in the descending order, so the best candidate is first in the list
    if (candidateServers.length == 0) {
        log(ns, LogLevel.Error, logPrefix, "no possible server to hack exiting...")
        ns.exit()
    } // nothing to hack, return early
    candidateServers.sort((a, b) => b.score - a.score)
    const host = candidateServers[0].name
    ns.print(`INFO: selected ${host} as the target`)
    ns.print("INFO: preparing server...")
    await prepareServer(ns, host)
}

async function prepareServer(ns: NS, host: string): Promise<void> {
    while (!isServerPrepared(ns, host)) {
        await minimizeSecurity(ns, host)
        await maximizeMoney(ns, host)
    }
}

async function minimizeSecurity(ns: NS, host: string): Promise<void> {
    const securityOverMin = ns.getServerSecurityLevel(host) - ns.getServerMinSecurityLevel(host)
    if (securityOverMin != 0) {
        const securityDecreasePerThread = ns.weakenAnalyze(1)
        const threadsNeeded = Math.ceil(securityOverMin / securityDecreasePerThread)
        ns.print(`INFO: threads needed to minimize security: ${threadsNeeded}`)
        const job: Job = {
            fn: 'hgw.js',
            threads: threadsNeeded,
            args: ['weaken', host],
            ramOverride: ns.getFunctionRamCost('weaken') + 1.6,
            splittable: true
        }
        let pids = await schedule(ns, job)
        ns.print(`INFO: all required threads scheduled, waiting for weaken jobs to finish...`)
        await waitTillPidsDie(ns, pids, 1000) // TODO: naive delay, can be improved with scripts writing back info
    }
}

async function maximizeMoney(ns: NS, host: string): Promise<void> {
    const rateToMax = ns.getServerMaxMoney(host) / ns.getServerMoneyAvailable(host)
    if (rateToMax > 1) {
        const threadsNeeded = ns.growthAnalyze(host, rateToMax)
        ns.print(`INFO: threads needed to maximize money: ${threadsNeeded}`)
        const job: Job = {
            fn: 'hgw.js',
            threads: threadsNeeded,
            args: ['grow', host],
            ramOverride: ns.getFunctionRamCost('grow') + 1.6,
            splittable: true
        }
        let pids = await schedule(ns, job)
        ns.print(`INFO: all required threads scheduled, waiting for grow jobs to finish...`)
        await waitTillPidsDie(ns, pids, 1000) // TODO: naive delay, can be improved with scripts writing back info
    }
}