import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const host = ns.args[0] as string;
  const minSLevel = ns.getServerMinSecurityLevel(host);
  const maxMoney = ns.getServerMaxMoney(host);
  while (true) {
    if (ns.getServerSecurityLevel(host) > minSLevel) await ns.weaken(host);
    const moneyRatio = ns.getServerMoneyAvailable(host) / maxMoney;
    if (moneyRatio < 0.25) await ns.grow(host);
    if (moneyRatio > 0.10) await ns.hack(host);
  }
}
