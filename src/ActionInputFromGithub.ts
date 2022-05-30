/*
 * © Copyright 2022 Micro Focus or one of its affiliates.
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs-extra';

export class ActionInputFromGithub {
    serverUrl: string;

    tenantId: string;

    projectId: number;

    testId: number;

    configFile: string;

    outputDir: string;

    reportTypes: string[];

    private constructor(
        serverUrl: string,
        tenantId: string,
        projectId: number,
        testId: number,
        configFile: string,
        outputDir: string,
        reportTypes: string[]
    ) {
        this.serverUrl = serverUrl;
        this.tenantId = tenantId;
        this.projectId = projectId;
        this.testId = testId;
        this.configFile = configFile;
        this.outputDir = outputDir;
        this.reportTypes = reportTypes;
    }

    public static readonly GITHUB_INPUT_NAME = {
        SERVER_URL: 'lrc_server',
        TENANT: 'lrc_tenant',
        PROJECT: 'lrc_project',
        TEST_ID: 'lrc_test_id',
        CONFIG_FILE: 'lrc_config_file',
        OUTPUT_DIR: 'lrc_output_dir',
        REPORT_TYPES: 'lrc_report_types',
    };

    public static async readGithubInput(
        serverUrlStr: string,
        tenant: string,
        projectIdStr: string,
        testIdStr: string,
        outputDir: string,
        reportTypesStr: string,
        configFile: string
    ): Promise<{
        input: ActionInputFromGithub | null;
        errMsgs: string[];
    }> {
        const errMsgs: string[] = [];
        let serverUrl = '';
        try {
            const urlObj = new URL(serverUrlStr);
            serverUrl = urlObj.toString();
        } catch (err) {
            errMsgs.push('invalid server url');
        }

        const projectId = Number(projectIdStr);
        if (Number.isNaN(projectId) || projectId <= 0) {
            errMsgs.push('invalid project id');
        }

        const testId = Number(testIdStr);
        if (Number.isNaN(testId) || testId <= 0) {
            errMsgs.push('invalid test id');
        }

        try {
            const outputDirExists = await fs.pathExists(outputDir);
            if (!outputDirExists) {
                await fs.mkdirp(outputDir);
            }
        } catch (err) {
            errMsgs.push(
                `invalid output dir ${outputDir}, ${(err as Error).message}`
            );
        }

        let reportTypes: string[] = [];
        if (reportTypesStr && reportTypesStr.length) {
            reportTypes = reportTypesStr.split(',').map((x) => x.trim());
            let isValid = true;
            reportTypes.forEach((t) => {
                isValid = ['csv', 'pdf', 'docx'].includes(t) && isValid;
            });
            if (!isValid) {
                errMsgs.push(
                    'invalid report types, only "csv", "pdf" and "docx" are supported'
                );
            }
        }

        if (configFile && configFile.length) {
            const errMsg = 'invalid config file path';
            try {
                const configFileExists = await fs.pathExists(configFile);
                if (!configFileExists) {
                    errMsgs.push(errMsg);
                }
            } catch (err) {
                errMsgs.push(errMsg);
            }
        }

        if (errMsgs.length) {
            return {
                input: null,
                errMsgs,
            };
        }

        return {
            input: new ActionInputFromGithub(
                serverUrl,
                tenant,
                projectId,
                testId,
                configFile,
                outputDir,
                reportTypes
            ),
            errMsgs: [],
        };
    }
}
