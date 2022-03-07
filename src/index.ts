import process from 'process';

import * as core from '@actions/core';

import LRCClient from 'lrcrunner/lib/Client';
import lrcUtils from 'lrcrunner/lib/utils';

const GITHUB_INPUT_NAME = {
    SERVER_URL: 'lrc_server',
    TENANT: 'lrc_tenant',
    PROJECT: 'lrc_project',
    TEST_ID: 'lrc_test_id',
    CONFIG_FILE: 'lrc_config_file',
    OUTPUT_DIR: 'lrc_output_dir'
};

interface InputFromGithub {
    url: string;
    tenantId: string;
    projectId: number;
    testId: number;
    configFile: string;
    outputDir: string;
}

// #TODO: add input validation
function parseInput(): InputFromGithub {
    const serverURLStr = core.getInput(GITHUB_INPUT_NAME.SERVER_URL);
    const tenantId = core.getInput(GITHUB_INPUT_NAME.TENANT);
    const projectIdStr = core.getInput(GITHUB_INPUT_NAME.PROJECT);
    const testIdStr = core.getInput(GITHUB_INPUT_NAME.TEST_ID);
    const configFile = core.getInput(GITHUB_INPUT_NAME.CONFIG_FILE);
    const outputDir = core.getInput(GITHUB_INPUT_NAME.OUTPUT_DIR);

    return {
        url: serverURLStr,
        tenantId,
        projectId: Number(projectIdStr),
        testId: Number(testIdStr),
        configFile,
        outputDir
    };
}

const logger = {
    info: console.log,
    warn: console.log,
    error: console.log,
    debug: console.log,
    fatal: console.log,
};

function getClient(config: InputFromGithub): LRCClient {
    const client = new LRCClient(config.tenantId, config.url, process.env.http_proxy, logger);

    return client;
}

async function run() {
    const input = parseInput();
    console.log(`got input from Github ${JSON.stringify(input, null, 4)}`);
    const client = getClient(input);
    const client_id = process.env.LRC_CLIENT_ID;
    const client_secret = process.env.LRC_CLIENT_SECRET;
    await client.authClient({ client_id, client_secret });
    logger.info(`test id: ${input.testId}`);
    const test = await client.getTest(input.projectId, input.testId);
    logger.info(`running test: "${test.name}" ...`);

    // run test
    const currRun = await client.runTest(input.projectId, input.testId);
    logger.info(
        `run id: ${currRun.runId}, url: ${lrcUtils.getDashboardUrl(
            new URL(input.url),
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
        ['csv', 'pdf'],
        input.outputDir
    );

    return currRun;
}

run()
    .then((lrcRun) => {
        console.log(`done, got run id: ${lrcRun.runId}`);
        core.setOutput('lrc_run_id', lrcRun.runId);
    })
    .catch((err) => {
        console.log(err);
        core.setFailed((err as Error).message);
    });
