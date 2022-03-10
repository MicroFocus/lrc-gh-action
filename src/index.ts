import process from 'process';

import * as core from '@actions/core';

import LRCClient from 'lrcrunner/lib/Client';
import lrcUtils from 'lrcrunner/lib/utils';
import { ActionInputFromGithub } from './ActionInputFromGithub';

async function parseInput(): Promise<ActionInputFromGithub> {
    const serverURLStr = core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.SERVER_URL);
    const tenantId = core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.TENANT);
    const projectIdStr = core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.PROJECT);
    const testIdStr = core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.TEST_ID);
    const configFile = core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.CONFIG_FILE);
    const outputDir = core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.OUTPUT_DIR);
    const reportTypesStr = core.getInput(ActionInputFromGithub.GITHUB_INPUT_NAME.REPORT_TYPES) || '';

    const result = await ActionInputFromGithub.readGithubInput(
        serverURLStr,
        tenantId,
        projectIdStr,
        testIdStr,
        outputDir,
        reportTypesStr,
        configFile,
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
    core.info(`got input from Github ${JSON.stringify(input, null, 4)}`);
    const client = getClient(input);
    const client_id = process.env.LRC_CLIENT_ID;
    const client_secret = process.env.LRC_CLIENT_SECRET;

    await client.authClient({ client_id, client_secret });
    core.info(`test id: ${input.testId}`);
    const test = await client.getTest(input.projectId, input.testId);
    core.info(`running test: "${test.name}" ...`);

    // run test
    const currRun = await client.runTest(input.projectId, input.testId);
    core.info(
        `run id: ${currRun.runId}, url: ${lrcUtils.getDashboardUrl(
            new URL(input.serverUrl),
            input.tenantId,
            input.projectId,
            currRun.runId,
            false
        )}`
    );

    // run status and report
    await client.getRunStatusAndResultReport(
        currRun.runId,
        true,
        input.reportTypes,
        input.outputDir
    );

    return currRun;
}

run()
    .then((lrcRun) => {
        core.info(`done, got run id: ${lrcRun.runId}`);
        core.setOutput('lrc_run_id', lrcRun.runId);
    })
    .catch((err) => {
        core.error(err);
        core.setFailed((err as Error).message);
    });
