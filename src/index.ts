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

import process from 'process';

import * as core from '@actions/core';

import LRCClient from 'lrcrunner/lib/Client';
import lrcUtils from 'lrcrunner/lib/utils';
import { ActionInputFromGithub } from './ActionInputFromGithub';

const INITIATOR = 'gh-action';

async function parseInput(): Promise<ActionInputFromGithub> {
    const serverURLStr = core.getInput(
        ActionInputFromGithub.GITHUB_INPUT_NAME.SERVER_URL
    );
    const tenantId = core.getInput(
        ActionInputFromGithub.GITHUB_INPUT_NAME.TENANT
    );
    const projectIdStr = core.getInput(
        ActionInputFromGithub.GITHUB_INPUT_NAME.PROJECT
    );
    const testIdStr = core.getInput(
        ActionInputFromGithub.GITHUB_INPUT_NAME.TEST_ID
    );
    const configFile = core.getInput(
        ActionInputFromGithub.GITHUB_INPUT_NAME.CONFIG_FILE
    );
    const outputDir = core.getInput(
        ActionInputFromGithub.GITHUB_INPUT_NAME.OUTPUT_DIR
    );
    const reportTypesStr =
        core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.REPORT_TYPES) ||
        '';

    const result = await ActionInputFromGithub.readGithubInput(
        serverURLStr,
        tenantId,
        projectIdStr,
        testIdStr,
        outputDir,
        reportTypesStr,
        configFile
    );

    if (result.input === null || (result.errMsgs && result.errMsgs.length)) {
        core.error(result.errMsgs?.join('\n'));
        throw new Error('invalid input');
    }

    return result.input;
}

const logger = {
    info: console.log,
    warn: console.log,
    error: console.log,
    debug: console.log,
    fatal: console.log,
};

function getClient(config: ActionInputFromGithub): LRCClient {
    const client = new LRCClient(
        config.tenantId,
        config.serverUrl,
        process.env.http_proxy,
        logger
    );

    return client;
}

async function run() {
    const input = await parseInput();
    core.info(`started with parameters: ${JSON.stringify(input, null, 4)}`);
    const client = getClient(input);
    const client_id = process.env.LRC_CLIENT_ID;
    const client_secret = process.env.LRC_CLIENT_SECRET;

    await client.authClient({ client_id, client_secret });
    core.info(`test id: ${input.testId}`);
    const test = await client.getTest(input.projectId, input.testId);
    core.info(`running test: "${test.name}" ...`);

    // run test
    const currRun = await client.runTest(input.projectId, input.testId, INITIATOR);
    core.info(
        `run id: ${currRun.runId}, dashboard url: ${lrcUtils.getDashboardUrl(
            new URL(input.serverUrl),
            input.tenantId,
            input.projectId,
            currRun.runId,
            false
        )}`
    );
    core.setOutput('lrc_run_id', currRun.runId);

    // get run status and report
    await client.getRunStatusAndResultReport(
        currRun.runId,
        true,
        input.reportTypes,
        input.outputDir
    );

    const { detailedStatus } = await client.getTestRunStatus(currRun.runId);
    if (detailedStatus !== 'PASSED') {
        core.setFailed(`test run ended with ${detailedStatus} status.`);
    }

    return currRun;
}

run().catch((err) => {
    core.setFailed((err as Error).message);
});
