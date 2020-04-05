
export class SdmxConfig {
    public static SANITISE_NAMES: boolean = false;
    
    public static TRUNCATE_NAMES: number = 100;
    
    public static isSanitiseNames(): boolean {
        return SdmxConfig.SANITISE_NAMES;

    }
    
    
    public static setTruncateNames(n: number) {
        SdmxConfig.TRUNCATE_NAMES = n;
    }
    public static truncateName(s: string) {
        if (SdmxConfig.TRUNCATE_NAMES) {
            return s.substring(0, SdmxConfig.TRUNCATE_NAMES);
        }
        return s;
    }
}

export default { SdmxConfig:SdmxConfig} 