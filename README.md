# Github Action for LoadRunner Cloud

Use this action to [run a LoadRunner Cloud test](https://admhelp.microfocus.com/lrc/en/2022.03/Content/Storm/t_run_load_test.htm) and get related reports.

This action can be used on both [Github-hosted](https://docs.github.com/en/actions/using-github-hosted-runners) and [self hosted](https://docs.github.com/en/actions/hosting-your-own-runners) runners. We recommend using a self-hosted runner because a load test run could take long time to finish.

## Prerequisite

1. Get client id and secret key from [LoadRunner Cloud - API Access](https://admhelp.microfocus.com/lrc/en/2022.03/Content/Storm/Admin-APIAccess.htm)
2. Copy the client id and secret key to [Github Secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository), name them as `LRC_CLIENT_ID` and `LRC_CLIENT_SECRET`. Those two secret names will be used in the action.
3. Prepare a load test in LoadRunner Cloud.

## Usage Example

### Start a load test manually and upload report files as [Github Artifact](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)

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

## Action Input

#### lrc_server

The server url of LoadRunner Cloud, default is https://loadrunner-cloud.saas.microfocus.com


#### lrc_tenant

Tenant ID of LoadRunner Cloud

#### lrc_project

Project ID of LoadRunner Cloud

#### lrc_test_id

Test ID of LoadRunner Cloud

#### lrc_output_dir

Where you want to save the report files. This path can be used in following steps such as "Upload artifacts"

#### lrc_report_types

Tell this action which types of report should be downloaded. Use comma to split multiple types, for example: `pdf,docx,csv`

Currently we support these 3 types of report. Leave it blank if you don't need report downloading.

## Action Output

#### lrc_run_id

The ID of test run started by this action.