import { NS } from "@ns";
import { isServerPrepared, serverList } from "lib/servers";
import { calcMaxThreads, Job, schedule, waitTillPidsDie } from "lib/scheduler";
import { buildLogFn, log, LogLevel } from "lib/logging";
import { round } from "lib/math";

const logPrefix = "[batcher]";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.write(buildLogFn(ns.getScriptName()), "");
  let host = ns.args.at(0);
  for (;;) {
    // if host not provided, select a best one
    if (!host) {
      const hackingThreshold = Math.max(1, ns.getHackingLevel() / 2);
      const candidateServers = serverList(ns)
        .filter((s) => s.root)
        .filter((s) => s.requiredLevel <= hackingThreshold);
      // sort in the descending order, so the best candidate is first in the list
      if (candidateServers.length == 0) {
        log(
          ns,
          LogLevel.Error,
          logPrefix,
          "no possible server to hack exiting...",
        );
        ns.exit();
      } // nothing to hack, return early
      candidateServers.sort((a, b) => b.score - a.score);
      host = candidateServers[0].name;
    }
    ns.print(`INFO: selected ${host} as the target`);
    ns.print("INFO: preparing server...");
    await prepareServer(ns, host as string);
    ns.print("INFO: server is prepared, proceeding to hack!");
    await hack(ns, host as string, 0.01);
  }
}

async function prepareServer(ns: NS, host: string): Promise<void> {
  while (!isServerPrepared(ns, host)) {
    await minimizeSecurity(ns, host);
    await maximizeMoney(ns, host);
  }
}

async function hack(ns: NS, host: string, percentage: number): Promise<void> {
  ns.print(`INFO: hacking ${host} for ${percentage * 100}%...`);
  const percPerThread = ns.hackAnalyze(host);
  ns.print(`INFO: will steal ${percPerThread * 100}% per hack thread`);
  const threadsNeeded = Math.max(1, Math.floor(percentage / percPerThread));
  ns.print(
    `INFO: threads needed to hack ${host} for ${
      percentage * 100
    }%: ${threadsNeeded}`,
  );
  const job: Job = {
    fn: "hgw.js",
    threads: threadsNeeded,
    args: ["hack", host],
    ramOverride: round(ns.getFunctionRamCost("hack") + 1.6, 2),
    splittable: true,
  };
  const fittableThreads = calcMaxThreads(ns, job);
  if (fittableThreads < job.threads)
    ns.print(
      `INFO: cannot fit all threads at once in memory, will schedule lower amount: ${fittableThreads}`,
    );
  job.threads = Math.min(job.threads, fittableThreads);
  let pids = await schedule(ns, job);
  ns.print(
    `INFO: all required threads scheduled, waiting for hack jobs to finish...`,
  );
  await waitTillPidsDie(ns, pids, 1000); // TODO: naive delay, can be improved with scripts writing back info
}

async function minimizeSecurity(ns: NS, host: string): Promise<void> {
  const securityOverMin =
    ns.getServerSecurityLevel(host) - ns.getServerMinSecurityLevel(host);
  if (securityOverMin != 0) {
    ns.print(`INFO: security over min: ${securityOverMin}`);
    // const securityDecreasePerThread = ns.weakenAnalyze(1)
    const securityDecreasePerThread = 0.05; // HACK: to optimize the RAM usage
    const threadsNeeded = Math.ceil(
      securityOverMin / securityDecreasePerThread,
    );
    ns.print(`INFO: threads needed to minimize security: ${threadsNeeded}`);
    const job: Job = {
      fn: "hgw.js",
      threads: threadsNeeded,
      args: ["weaken", host],
      ramOverride: ns.getFunctionRamCost("weaken") + 1.6,
      splittable: true,
    };
    const fittableThreads = calcMaxThreads(ns, job);
    if (fittableThreads < job.threads)
      ns.print(
        `INFO: cannot fit all threads at once in memory, will schedule lower amount: ${fittableThreads}`,
      );
    job.threads = Math.min(job.threads, fittableThreads);
    let pids = await schedule(ns, job);
    ns.print(
      `INFO: all required threads scheduled, waiting for weaken jobs to finish...`,
    );
    await waitTillPidsDie(ns, pids, 1000); // TODO: naive delay, can be improved with scripts writing back info
  }
}

async function maximizeMoney(ns: NS, host: string): Promise<void> {
  const ratioToMax =
    ns.getServerMoneyAvailable(host) / ns.getServerMaxMoney(host);
  if (ratioToMax < 1) {
    const rateToMultiplyToMax = 1 / ratioToMax;
    ns.print(`INFO: ratio to max: ${ratioToMax}`);
    const threadsNeeded = Math.ceil(
      ns.growthAnalyze(host, rateToMultiplyToMax),
    );
    ns.print(`INFO: threads needed to maximize money: ${threadsNeeded}`);
    const job: Job = {
      fn: "hgw.js",
      threads: threadsNeeded,
      args: ["grow", host],
      ramOverride: ns.getFunctionRamCost("grow") + 1.6,
      splittable: true,
    };
    const fittableThreads = calcMaxThreads(ns, job);
    if (fittableThreads < job.threads)
      ns.print(
        `INFO: cannot fit all threads at once in memory, will schedule lower amount: ${fittableThreads}`,
      );
    job.threads = Math.min(job.threads, fittableThreads);
    let pids = await schedule(ns, job);
    ns.print(
      `INFO: all required threads scheduled, waiting for grow jobs to finish...`,
    );
    await waitTillPidsDie(ns, pids, 1000); // TODO: naive delay, can be improved with scripts writing back info
  }
}
