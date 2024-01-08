type NSArg = (string | number | boolean)

type HGWFunctionKey = 'hack' | 'grow' | 'weaken'

interface HGWArgs {
    fnKey: HGWFunctionKey,
    target: string,
    delay: number,
}
