import { NS } from "@ns";

function parseArgs(ns: NS, args: NSArg[]): HGWArgs {
  const fnKey = args[0] as string
  if (fnKey !== 'hack' && fnKey !== 'grow' && fnKey !== 'weaken') {
    ns.print("ERROR: first argument must be 'hack' or 'grow' or 'weaken'!")
    ns.exit()
  }
  const target = args[1] as string;
  const delay = args.at(2) as number || 0;
  return {fnKey, target, delay}
}

export async function main(ns: NS): Promise<void> {
  const {fnKey, target, delay} = parseArgs(ns, ns.args)
  const fn = ns[fnKey]
  await fn(target, {additionalMsec: delay})
}
