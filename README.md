# GitHub Action for LoadRunner Cloud

Use this action to run a [LoadRunner Cloud test](https://admhelp.microfocus.com/lrc/en/Latest/Content/Storm/t_run_load_test.htm) and generate artifacts.

This action can be used on both [self-hosted](https://docs.github.com/en/actions/hosting-your-own-runners) and [GitHub-hosted](https://docs.github.com/en/actions/using-github-hosted-runners) runners.

## Prerequisites

1. Get your client id and secret key. Refer to [LoadRunner Cloud - API access keys](https://admhelp.microfocus.com/lrc/en/Latest/Content/Storm/Admin-APIAccess.htm)
2. Configure the client id and secret key in [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).   
   For example: `LRC_CLIENT_ID` and `LRC_CLIENT_SECRET`. Those two secret names are used in below examples.
3. Prepare a load test in LoadRunner Cloud.

## Action Inputs

| Input            | Description                                                                                                                                           |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| lrc_server       | The server URL of LoadRunner Cloud, default: https://loadrunner-cloud.saas.microfocus.com                                                             |
| lrc_tenant       | Tenant ID of LoadRunner Cloud                                                                                                                         |
| lrc_project      | Project ID of LoadRunner Cloud, default: 1                                                                                                            |
| lrc_test_id      | Test ID of LoadRunner Cloud                                                                                                                           |
| lrc_output_dir   | Where to save the report files. <br/>This path can be used in following steps such as "Upload artifacts"                                               |
| lrc_report_types | Specify target report types. For example: `pdf, docx, csv`.  <br/>There are 3 supported report types: pdf, docx, csv. Leave it blank if you don't need reports. |

## Action Outputs

| Output     | Description                                |
|------------|--------------------------------------------|
| lrc_run_id | The ID of test run started by this action. |

## Examples

### Start a load test by manually triggered workflows and upload artifacts as [GitHub Artifact](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)

```yml
on: 
  workflow_dispatch:
    inputs:
      lrc_server:
        description: 'Server URL of LoadRunner Cloud'
        required: true
        default: 'https://loadrunner-cloud.saas.microfocus.com'
      lrc_tenant:
        description: 'Tenant ID of LoadRunner Cloud'
        required: true
      lrc_project:
        description: 'Project ID of LoadRunner Cloud'
        required: true
        default: '1'
      lrc_test_id:
        description: 'Test ID of LoadRunner Cloud'
        required: true
      lrc_output_dir:
        description: 'Path where you want to store the output files, like csv/pdf reports and so on.'
        required: false
        default: './lrc_report'
      lrc_report_types:
        description: 'LoadRunner Cloud report file types to download'
        required: false
        default: 'pdf,docx,csv'
jobs:
  start_load_test:
    runs-on: self-hosted
    name: Start a load test
    steps:
      - name: Run LoadRunner test
        uses: MicroFocus/lrc-gh-action@v1
        id: lrc_run_test
        env:
          # These are the two secrets we added above in prerequisite
          LRC_CLIENT_ID: ${{secrets.LRC_CLIENT_ID}}
          LRC_CLIENT_SECRET: ${{secrets.LRC_CLIENT_SECRET}}
        with:
          lrc_server: ${{ github.event.inputs.lrc_server }}
          lrc_tenant: ${{ github.event.inputs.lrc_tenant }}
          lrc_project: ${{ github.event.inputs.lrc_project }}
          lrc_test_id: ${{ github.event.inputs.lrc_test_id }}
          lrc_output_dir: ${{ github.event.inputs.lrc_output_dir }}
          lrc_report_types: ${{ github.event.inputs.lrc_report_types }}
      - name: Get the output runId
        run: echo "LRC Run ID is ${{ steps.lrc_run_test.outputs.lrc_run_id }}"
      - name: Upload lrc report
        uses: actions/upload-artifact@v3
        with:
          name: lrc-report-${{ steps.lrc_run_test.outputs.lrc_run_id }}
          path: ${{ github.event.inputs.lrc_output_dir }}
```

### Build, deploy and start test after a new release is published or edited

```yml
on:
  release:
    types: [published, edited]

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
      - name: Run LoadRunner test
        uses: MicroFocus/lrc-gh-action@v1
        id: lrc_run_test
        env:
          LRC_CLIENT_ID: ${{secrets.LRC_CLIENT_ID}}
          LRC_CLIENT_SECRET: ${{secrets.LRC_CLIENT_SECRET}}
        with:
          lrc_server: 'https://loadrunner-cloud.saas.microfocus.com'
          lrc_tenant: 'TENANTID'
          lrc_project: '1'
          lrc_test_id: '1'
```

### Trigger a load test at a scheduled time by [GitHub schedule events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

```yml
on:
  schedule:
    # run at 05:00 on every Friday
    cron: '0 5 * * 5'
jobs:
  load_test:
    runs-on: self-hosted
    name: Start a load test
    steps:
      - name: Run LoadRunner test
        uses: MicroFocus/lrc-gh-action@v1
        id: lrc_run_test
        env:
          LRC_CLIENT_ID: ${{secrets.LRC_CLIENT_ID}}
          LRC_CLIENT_SECRET: ${{secrets.LRC_CLIENT_SECRET}}
        with:
          lrc_server: 'https://loadrunner-cloud.saas.microfocus.com'
          lrc_tenant: 'TENANTID'
          lrc_project: '1'
          lrc_test_id: '1'
```
