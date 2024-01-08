import { NS } from "@ns";
import { serverList } from "lib/servers";

interface Job {
    fn: string,
    args: NSArg[]
    ramOverride?: number
    splittable?: boolean
}

export function schedule(ns: NS, job: Job): void {
    // figure out the real RAM cost - if there's an override, use that
    const ramCost = job.ramOverride ? job.ramOverride : ns.getScriptRam(job.fn)
    let servers = serverList(ns).filter(server => server.root)
    // if the job is not splittable, use only those servers that have enough free RAM
    if (!job.splittable) servers = servers.filter(server => server.freeRAM >= ramCost)
    servers.sort((a, b) => a.freeRAM - b.freeRAM) // TODO: check if order is correct
}
