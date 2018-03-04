# MMM-GCP

MagicMirror MichMich module to display GCP (Google Cloud Platform) billing over the last few days.

# Presentation
This module help you track expense on a GCP project over the last few days. In particular:
* spent increasing is shown in blue
* spent decreasing is shown in green
* spent over your set limit is shown in red (optional)
* amount is shown for everyday below the column bar

# Screenshot
![screenshot](https://github.com/da4throux/MMM-GCP/blob/master/MMM-GCPscreenshot0.1.png)

# GCP side setup

0. if you do not have a GCP account set one up :D
1. ![set up billing export](https://cloud.google.com/billing/docs/how-to/export-data-bigquery) to BigQuery on the GCP project -> please take note of the table name for later
2. Create a service account with BigQuery User Role (do queries), and Viewer Role (access the table). ![More details on BigQuery Access Control](https://cloud.google.com/bigquery/docs/access-control)
3. Download the service account as JSON. More information on ![Service Accounts keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
4. Copy this key to a location reachable by the module - path to the file will be set in the module configuration (`lines.serviceAccountKey`).

# Install

1. Clone repository into `../modules/` inside your MagicMirror folder.
2. Run `npm install` inside `../modules/MMM-GCP/` folder
3. Add the module to the MagicMirror config
```
		{
	        module: 'MMM-GCP',
	        position: 'bottom_right',
	        header: 'GCP billing daily trend',
	        config: {
	        }
    	},
```

# Configure
The `lines` array contains information on the project to monitor (it will give possibility to monitor several projects).
## lines array
* `type`: mandatory: only one possible value for the time being: `billing`
* `projectId`: mandatory: GCP project Id
* `table`: mandatory: name of the table as dataset.table, ex: `project_billing.gcp_billing_export_v1_12321B_2343_234FD`
* `serviceAccountKey`: mandatory: path to the Service Account Json private key, ex: `/home/pi/MagicMirror/modules/MMM-GCP/SA.json`
* `label`: optional: usual name to be displayed
* `costLimit`: optional: integer: cost above which the daily spent is displayed in red, ex: 700, default: none
* `dayTrendLength`: optional: integer: number of days to display, default: 10
* `updateInterval`: optional: integer: number of ms to wait between two information request, default: `1 * 60 * 1000 * 60 * 6` 6 hours

## config example
```
{
  lines: [
    {
      type: 'billing',
      label: 'da4throux GCP',
      projectId: 'gcp_project_id',
      table: 'project_billing.gcp_billing_export_v1_12321B_2343_234FD',
      serviceAccountKey: '/home/pi/MagicMirror/modules/MMM-GCP/SA.json',
      costLimit: 700,
      dayTrendLength: 12,
    },
  ],
}
```

#0.1
