[![CodeQL](https://github.com/MicroFocus/lrc-gh-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/MicroFocus/lrc-gh-action/actions/workflows/codeql-analysis.yml)
[![Release](https://github.com/MicroFocus/lrc-gh-action/actions/workflows/release.yml/badge.svg)](https://github.com/MicroFocus/lrc-gh-action/actions/workflows/release.yml)

# GitHub Action for LoadRunner Cloud

Use this action to run a load test in [LoadRunner Cloud](https://admhelp.microfocus.com/lrc/en/Latest/Content/Storm/c_Getting_started.htm) and collect reports.  
The action can be used on both [self-hosted](https://docs.github.com/en/actions/hosting-your-own-runners) and [GitHub-hosted](https://docs.github.com/en/actions/using-github-hosted-runners) runners.

For security practices about using GitHub Actions, refer to GitHub's [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions).  
If you use self-hosted runners, refer to the [Hardening for self-hosted runners](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#hardening-for-self-hosted-runners).

## Prerequisites

1. Get your client id and secret key in LoadRunner Cloud. Refer to [API access keys](https://admhelp.microfocus.com/lrc/en/Latest/Content/Storm/Admin-APIAccess.htm)
2. Store the client id and secret key in GitHub [Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).   
   For example: `LRC_CLIENT_ID` and `LRC_CLIENT_SECRET`. These two secret names are used in below examples.
3. Prepare a load test in LoadRunner Cloud.

## Action Inputs

| Input                | Description                                                                                                                                             |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| **lrc_server**       | LRC URL, default: https://loadrunner-cloud.saas.microfocus.com                                                                                          |
| **lrc_tenant**       | Tenant ID, for example: 652261341                                                                                                                       |
| **lrc_project**      | Project ID, default: 1                                                                                                                                  |
| **lrc_test_id**      | Test ID                                                                                                                                                 |
| **lrc_output_dir**   | The directory to save results. <br/>The path can be used in "Upload artifacts" step.                                                                    |
| **lrc_report_types** | Target report types. For example: `pdf, docx, csv`.  <br/>There are 3 supported report types: pdf, docx, csv. Leave it empty if you don't need reports. |

## Action Outputs

| Output                                                                | Description                                |
|-----------------------------------------------------------------------|--------------------------------------------|
| **lrc_run_id** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | The ID of test run started by this action. |

## Examples

### Trigger a load test at a scheduled time via GitHub [schedule events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

```yml
on:
  schedule:
    # run at 05:00 on every Friday
    - cron: '0 5 * * 5'
jobs:
  load_test:
    runs-on: self-hosted
    name: Start a load test
    steps:
      - name: Run test in LoadRunner Cloud
        uses: MicroFocus/lrc-gh-action@v1
        id: lrc_run_test
        env:
          LRC_CLIENT_ID: ${{secrets.LRC_CLIENT_ID}}
          LRC_CLIENT_SECRET: ${{secrets.LRC_CLIENT_SECRET}}
        with:
          lrc_server: 'https://loadrunner-cloud.saas.microfocus.com'
          lrc_tenant: '123456789'
          lrc_project: '1'
          lrc_test_id: '123'
```

### Start a load test via manually triggered workflow and upload results to GitHub [Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)

```yml
on: 
  workflow_dispatch:
    inputs:
      lrc_server:
        description: 'LRC URL'
        required: true
        default: 'https://loadrunner-cloud.saas.microfocus.com'
      lrc_tenant:
        description: 'Tenant ID'
        required: true
      lrc_project:
        description: 'Project ID'
        required: true
        default: '1'
      lrc_test_id:
        description: 'Test ID'
        required: true
      lrc_output_dir:
        description: 'The directory to save results'
        required: false
        default: './lrc_report'
      lrc_report_types:
        description: 'Target report types. For example: pdf, docx, csv'
        required: false
        default: ''
jobs:
  start_load_test:
    runs-on: self-hosted
    name: Start a load test
    steps:
      - name: Run test in LoadRunner Cloud
        uses: MicroFocus/lrc-gh-action@v1
        id: lrc_run_test
        env:
          LRC_CLIENT_ID: ${{secrets.LRC_CLIENT_ID}}
          LRC_CLIENT_SECRET: ${{secrets.LRC_CLIENT_SECRET}}
        with:
          lrc_server: ${{ github.event.inputs.lrc_server }}
          lrc_tenant: ${{ github.event.inputs.lrc_tenant }}
          lrc_project: ${{ github.event.inputs.lrc_project }}
          lrc_test_id: ${{ github.event.inputs.lrc_test_id }}
          lrc_output_dir: ${{ github.event.inputs.lrc_output_dir }}
          lrc_report_types: ${{ github.event.inputs.lrc_report_types }}
      - name: Print test run ID
        run: echo "LRC Run ID is ${{ steps.lrc_run_test.outputs.lrc_run_id }}"
      - name: Upload LRC results
        uses: actions/upload-artifact@v3
        with:
          name: lrc-report-${{ steps.lrc_run_test.outputs.lrc_run_id }}
          path: ${{ github.event.inputs.lrc_output_dir }}
```

### Build, deploy and start a load test once a new release is published

```yml
on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.event.release.tag_name }}
      - uses: actions/setup-node@v3.2.0
        with:
          node-version: '16.x'
      - name: npm build
        run: npm install && npm run build
      # omit azure login, docker build process ...
      - uses: 'azure/aci-deploy@v1'
        with:
          image: 'sampleapp:${{ github.event.release.tag_name }}'
      # ...
  load_test:
    needs: build
    runs-on: self-hosted
    name: Start a load test
    steps:
      - name: Run test in LoadRunner Cloud
        uses: MicroFocus/lrc-gh-action@v1
        id: lrc_run_test
        env:
          LRC_CLIENT_ID: ${{secrets.LRC_CLIENT_ID}}
          LRC_CLIENT_SECRET: ${{secrets.LRC_CLIENT_SECRET}}
        with:
          lrc_server: 'https://loadrunner-cloud.saas.microfocus.com'
          lrc_tenant: '123456789'
          lrc_project: '1'
          lrc_test_id: '123'
```

### Use [reusable workflow](https://docs.github.com/en/actions/using-workflows/reusing-workflows) provided in `.github/workflows/lrc.yml`

```yml
on:
  workflow_dispatch:

jobs:
  run_test:
    # replace the commit hash with latest
    uses: MicroFocus/lrc-gh-action/.github/workflows/lrc.yml@4733debb55362aa3d57115e566503481ddcf9a03
    with:
      lrc_server: 'https://loadrunner-cloud.saas.microfocus.com'
      lrc_tenant: '123456789'
      lrc_project: '1'
      lrc_test_id: '123'
    secrets:
      LRC_CLIENT_ID: ${{ secrets.LRC_CLIENT_ID }}
      LRC_CLIENT_SECRET: ${{ secrets.LRC_CLIENT_SECRET }}
  print_run_id:
    if: ${{ always() }}
    runs-on: ubuntu-latest
    needs: run_test
    steps:
      - run: echo "LRC Run ID is ${{ needs.run_test.outputs.lrc_run_id }}"
```
