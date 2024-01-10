import { NS } from "@ns";
import { serverList } from "lib/servers";

export interface Job {
    fn: string,
    threads: number
    args: NSArg[]
    ramOverride?: number
    splittable?: boolean
}

function totalFreeRam(ns: NS): number {
    return serverList(ns).filter(s => s.root).map(s => s.freeRAM).reduce((acc, v) => acc + v)
}

export async function main(ns: NS): Promise<void> {
    const fn = ns.args[0] as string
    const args = ns.args.slice(1)
    const job: Job = {
        fn: fn,
        threads: 1,
        args: args,
    }
    await schedule(ns, job)
}

export function calcMaxThreads(ns: NS, job: Job): number {
    const ramCost = job.ramOverride ? job.ramOverride : ns.getScriptRam(job.fn)
    const totalRamCost = ramCost * job.threads
    const usedRam = Math.min(totalFreeRam(ns), totalRamCost)
    const usedThreads = Math.floor(usedRam / ramCost)
    return usedThreads
}

export async function schedule(ns: NS, job: Job): Promise<number[]> {
    ns.print(`INFO: Scheduling ${job.fn}`)
    // figure out the real RAM cost - if there's an override, use that
    let ramCost = job.ramOverride ? job.ramOverride : ns.getScriptRam(job.fn)
    let totalRamCost = ramCost * job.threads
    if (!job.splittable && totalFreeRam(ns) < totalRamCost) {
        ns.print(`ERROR: not enough total free RAM to schedule the job!`)
        ns.exit()
    }
    const pids: number[] = []
    while (totalRamCost > 0) {
        let servers = serverList(ns).filter(server => server.root)
        // if the job is not splittable, use only those servers that have enough free RAM
        if (job.splittable)
            servers = servers.filter(server => server.freeRAM >= ramCost)
        else
            servers = servers.filter(server => server.freeRAM >= totalRamCost)
        // sort servers in ascending order by freeRam
        servers.sort((a, b) => a.freeRAM - b.freeRAM)
        while (servers.length > 0) {
            const server = servers.shift()!
            const maxThreadsForServer = Math.floor(server.freeRAM / ramCost)
            const actualThreads = Math.min(job.threads, maxThreadsForServer)
            ns.scp(job.fn, server.name, 'home')
            const pid = ns.exec(job.fn, server.name, {ramOverride: ramCost, threads: actualThreads}, ...job.args)
            if (pid === 0) {
                ns.print(`ERROR: couldn't spawn a job: ${job} on ${server}`)
                ns.exit()
            }
            pids.push(pid)
            totalRamCost -= actualThreads * ramCost
            if (totalRamCost == 0) break
        }
        if (totalRamCost == 0) break
        // if we reached this place, then we couldn't fit all things at once in RAM, so we must wait until they finish
        ns.print("INFO: waiting in scheduler for RAM to free up to schedule the rest of the job...")
        await waitTillPidsDie(ns, pids, 1000)
    }
    return pids
}

export async function waitTillPidsDie(ns: NS, pids: number[], millis: number): Promise<void> {
    while ((pids = pids.filter(p => !!ns.getRunningScript(p))).length != 0) await ns.sleep(millis)
}
