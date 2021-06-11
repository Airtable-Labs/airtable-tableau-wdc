# Airtable -> Tableau Web Data Connector

This [Tableau Web Data Connector](https://tableau.github.io/webdataconnector/) (WDC) uses the Airtable Metadata* and Base APIs to fetch a base's list of tables and fields (schema) as well as all records and make them available to Tableau for visualization.

Learn about how to use a WDC with Tableau Desktop [here](https://tableau.github.io/webdataconnector/docs/wdc_use_in_tableau.html). The URL for this WDC, hosted on Github Pages, is:
```
https://airtable-labs.github.io/airtable-tableau-wdc
``` 

For additional information and notes, including a mapping of Airtable field types to Tableau column data types and roles you can expect to experience, visit the [NOTES.md](NOTES.md file in this repo)
* Note that the Metadata API is currently available to Airtable Enterprise customers. Customers on other plans can request Metadata API access [here](https://airtable.com/shrWl6yu8cI8C5Dh3).

---- 

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service.  It is made available on an "as is" basis and provided without express or implied warranties of any kind.

----

### For local development and testing:
1. Clone this repository
2. Install _Node_ dependencies (different from the external libraries loaded from `index.html`) by running `npm install`
3. Start a local HTTP server by running `npm start` 
    - Using the URL provided in the output, [use the URL in your Tableau client](https://tableau.github.io/webdataconnector/docs/wdc_use_in_tableau.html)
4. (Optional) After making changes to `index.js`, run `npm run lint:fix` to run the [standardjs](https://standardjs.com) code linter in "fix" mode to attempt to reformat and conform your changes to the standard rules.

### Hosting this WDC
Github Pages is currently used to host this web data connector at the URL above. If you'd like to host this WDC yourself, [Tableau has some recommendations here](https://tableau.github.io/webdataconnector/docs/wdc_hosting_and_submissions).