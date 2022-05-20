export declare class ActionInputFromGithub {
    serverUrl: string;
    tenantId: string;
    projectId: number;
    testId: number;
    configFile: string;
    outputDir: string;
    reportTypes: string[];
    private constructor();
    static readonly GITHUB_INPUT_NAME: {
        SERVER_URL: string;
        TENANT: string;
        PROJECT: string;
        TEST_ID: string;
        CONFIG_FILE: string;
        OUTPUT_DIR: string;
        REPORT_TYPES: string;
    };
    static readGithubInput(serverUrlStr: string, tenant: string, projectIdStr: string, testIdStr: string, outputDir: string, reportTypesStr: string, configFile: string): Promise<{
        input: ActionInputFromGithub | null;
        errMsgs: string[];
    }>;
}
