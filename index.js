// Define global variables to appease standardjs.com linter
/* global tableau, $, fetch, Option */

(function () {
  // Initialize dependencies
  const Airtable = require('airtable')
  const tableauConnector = tableau.makeConnector()

  // Define variables
  const airtableMetadataApiBaseUrl = 'https://api.airtable.com/v0/meta'
  const airtableFieldTypesToExclude = ['button', 'multipleAttachments']
  const dataTypesToConsiderMetric = [tableau.dataTypeEnum.int, tableau.dataTypeEnum.float]

  // Helper function to replace characters Tableau does not supprot in IDs (credit https://github.com/tagyoureit/InfluxDB_WDC/blob/gh-pages/InfluxDB_WDC.js#L28)
  function replaceSpecialCharsForTableauID (str) {
    const newStr = str.replace(/ /g, '_')
      .replace(/"/g, '_doublequote_')
      .replace(/,/g, '_comma_')
      .replace(/=/g, '_equal_')
      .replace(/\//g, '_fslash_')
      .replace(/-/g, '_dash_')
      .replace(/\./g, '_dot_')
      .replace(/[^A-Za-z0-9_]/g, '_')
    return newStr
  }

  // Helper function to take an airtable field type and return the apropriate Tableau data type
  function determineTableauColumnType (airtableFieldType) {
    // Tableau data types are listed at https://tableau.github.io/webdataconnector/docs/api_ref.html#webdataconnectorapi.datatypeenum
    // Airtable field types are listed at https://airtable.com/api/meta

    // Look at the Airtable field type and return the appropriate Tableau column type
    switch (airtableFieldType) {
      case 'checkbox':
        return tableau.dataTypeEnum.bool
      case 'createdTime':
        return tableau.dataTypeEnum.datetime
      case 'lastModifiedTime':
        return tableau.dataTypeEnum.datetime
      case 'date':
        return tableau.dataTypeEnum.date
      case 'dateTime':
        return tableau.dataTypeEnum.datetime
      case 'number':
        return tableau.dataTypeEnum.float
      case 'currency':
        return tableau.dataTypeEnum.float
      case 'percent':
        return tableau.dataTypeEnum.float
      case 'count':
        return tableau.dataTypeEnum.int
      case 'rating':
        return tableau.dataTypeEnum.int
      case 'duration':
        return tableau.dataTypeEnum.int
      default: // default to a string
        return tableau.dataTypeEnum.string
    }
  }

  // Helper function to determine what value to return for a given raw value and field metadata object combination
  function airtableFieldValueToTableauColumnValue (airtableRawValue, airtableFieldMeta) {
    if (airtableRawValue === undefined) return airtableRawValue

    switch (airtableFieldMeta.type) {
      case 'singleCollaborator':
        return airtableRawValue.email
      case 'multipleCollaborators':
        return airtableRawValue.map(e => e.email).join(',')
      case 'createdBy':
        return airtableRawValue.email
      case 'checkbox':
        return airtableRawValue === true
      case 'lastModifiedBy':
        return airtableRawValue.email
      default: // default stringifying value (Tableau seems to be OK with this for numeric fields)
        return airtableRawValue.toString()
    }
  }

  // Helper function to generate fetch request options for an Airtable Metadata API call
  function airtableMetadataApiRequestOptions (airtableApiToken) {
    return {
      method: 'GET',
      headers: { Authorization: `Bearer ${airtableApiToken}` }
    }
  }

  // Helper function to get a list of avaiable bases from the Airtable Metadata API
  //   KNOWN LIMITATION: Only the first 1,000 bases are returned; UI allows user to enter a base ID as a fallback
  async function airtableGetListOfBases (airtableApiToken) {
    const baseListRequest = await fetch(`${airtableMetadataApiBaseUrl}/bases`, airtableMetadataApiRequestOptions(airtableApiToken))
    const baseList = await baseListRequest.json()
    return baseList
  }

  // Helper function to get a base's metadata from the Airtable Metadata API
  async function airtableGetBaseMetadata (airtableApiToken, airtableBaseId) {
    const baseMetadataRequest = await fetch(`${airtableMetadataApiBaseUrl}/bases/${airtableBaseId}/tables`, airtableMetadataApiRequestOptions(tableau.password))
    const baseMetadata = await baseMetadataRequest.json()
    if (baseMetadata.error) throw new Error(`Status code ${baseMetadataRequest.status} received while calling Metadata API. Does your account have access to this base?\n\n${JSON.stringify(baseMetadata)}`)
    return baseMetadata
  }

  // Function called when Tableau is ready to pull the schema
  tableauConnector.getSchema = async function (schemaCallback) {
    try {
      // Load connection data from Tableau connector object built upon form submission
      const connectionData = JSON.parse(tableau.connectionData)
      const { BASE_ID, FIELD_NAME_FOR_AIRTABLE_RECORD_ID } = connectionData

      // Setup structure to store field metadata above and beyond what Tableau column schema allows
      const TABLE_FIELD_METADATA = {} // this will be saved back to connectionData at the end of getSchema and used by getData

      // Call Airtable Metadata API
      const baseMetadata = await airtableGetBaseMetadata(tableau.password, BASE_ID)

      // For each table, create a schema object
      const tableSchemas = baseMetadata.tables.map((tableMeta) => {
        TABLE_FIELD_METADATA[tableMeta.name] = {}

        // For each table field
        const fieldsForTableau = tableMeta.fields.map((fieldMeta) => {
          // Check to see if the field type is in our exclude list
          if (!airtableFieldTypesToExclude.includes(fieldMeta.type)) {
            // Store Airtable field metadata for use later in getData
            TABLE_FIELD_METADATA[tableMeta.name][fieldMeta.name] = fieldMeta
            const dataType = determineTableauColumnType(fieldMeta.type)
            return {
              id: replaceSpecialCharsForTableauID(fieldMeta.name),
              alias: fieldMeta.name,
              description: fieldMeta.name,
              // set Tableau column role based off of dataType
              columnRole: (dataTypesToConsiderMetric.includes(dataType) ? tableau.columnRoleEnum.measure : tableau.columnRoleEnum.dimension),
              dataType
            }
          } else { // We'll filter these out later
            return false
          }
        })

        // Add airtable record ID
        fieldsForTableau.push({
          id: replaceSpecialCharsForTableauID(FIELD_NAME_FOR_AIRTABLE_RECORD_ID),
          dataType: tableau.dataTypeEnum.string, // determineTableauColumnType(FIELD_NAME_FOR_AIRTABLE_RECORD_ID),
          description: `Airtable Record ID from table ${tableMeta.name}`
        })

        return {
          id: replaceSpecialCharsForTableauID(tableMeta.name),
          alias: tableMeta.name,
          description: `Airtable '${tableMeta.name}' (${tableMeta.id}) from base ${BASE_ID}.`,
          columns: fieldsForTableau.filter(Boolean)
        }
      })

      // Save updated connectionData - we need this to look up additional metadata
      connectionData.TABLE_FIELD_METADATA = TABLE_FIELD_METADATA
      tableau.connectionData = JSON.stringify(connectionData)

      // Tell Tableau we're done and provide the array of schemas
      schemaCallback(tableSchemas)
    } catch (err) {
      console.error(err)
      tableau.abortWithError(`Error during getSchema: ${err.message}`)
    }
  }

  // Function called when Tableau is ready to pull the data
  tableauConnector.getData = async function (table, doneCallback) {
    try {
      console.debug('Getting data for', { table })

      // Read configuration variables and initialize Airtable client
      const { BASE_ID, FIELD_NAME_FOR_AIRTABLE_RECORD_ID, TABLE_FIELD_METADATA } = JSON.parse(tableau.connectionData)
      const airtableFieldMetaForTable = TABLE_FIELD_METADATA[table.tableInfo.alias]
      const base = new Airtable({ apiKey: tableau.password }).base(BASE_ID)

      // Create an empty array of rows we will populate and eventually provide to Tableau
      const rows = []

      // Get all records from Airtable using the REST API
      const allRecords = await base(table.tableInfo.alias).select({}).all()
      // console.debug({ allRecords })

      // Loop through each record received and construct the key-value pair in an object
      for (const record of allRecords) {
        const rowForTableau = {}

        // Go through every column present in the Tableau schema and look up the value from Airtable based off of the Tableau column's "description" which is the Airtable field name
        for (const col of table.tableInfo.columns) {
          let value
          // Check the column ID and do something special for the Airtable Record ID column
          if (col.id === replaceSpecialCharsForTableauID(FIELD_NAME_FOR_AIRTABLE_RECORD_ID)) {
            value = record.getId()
          } else {
            // Otherwise, try to get the value as a string
            try {
              // using description though `alias` would be better but for some reason Tableau doesnt always return it to us (TODO)
              const airtableFieldMeta = airtableFieldMetaForTable[col.description]
              const airtableRawValue = record.get(col.description)
              value = airtableFieldValueToTableauColumnValue(airtableRawValue, airtableFieldMeta)
            } catch (e) {
              console.error(e)
            }
          }
          rowForTableau[col.id] = value
        }

        // Add this record (tableau row) to the array of rows
        rows.push(rowForTableau)
      }

      // Append all the rows to the Tableau table
      table.appendRows(rows)

      // For debugging purposes, log the table metadata and rows we just added to it
      console.debug('Finished getData for', { table, rows })

      // Let Tableau know we're done getting data for the table requested
      doneCallback()
    } catch (err) {
      console.error(err)
      tableau.abortWithError(`Error during getData: ${err.message}`)
    }
  }

  // Register the constructed connector (with its handlers) with Tableau
  tableau.registerConnector(tableauConnector)

  // Create event listeners for when the user submits the HTML form
  $(document).ready(function () {
    const airtableApiTokenField = $('#airtableApiToken')
    const airtableSwitchBaseInput = $('#airtableSwitchBaseInput')
    const airtableBaseIdFieldId = '#airtableBaseId'

    // After waiting half a second, attempt to parse the Tableau version to determine if the user is opening from within a supported version of Tableau
    // If not, display some instructions
    setTimeout(function () {
      try {
        const version = +tableau.platformVersion.split('.').slice(0, 2).join('.')
        if (version < 2019.4) throw new Error('Tableau version must be > 2019.4')
      } catch (err) {
        console.error(err)
        $('div.formFieldAndSubmitContainer').hide()
        $('.formHeader').append("<hr /><br /><p class='warning formDescription'>Use this Web Data Connector from Tableau version 2019.4 or higher. <a href='https://tableau.github.io/webdataconnector/docs/wdc_use_in_tableau.html'>More info.</a></p>")
      }
    }, 500)

    airtableSwitchBaseInput.on('click', function (e) {
      $('#airtableBaseIdContainer').html('<input type="text" pattern="app[A-Za-z0-9]{5,}" data-parsley-errors-container="#errorsFor_airtableBaseId" data-parsley-pattern-message="Your base ID should start with the letters \'app\'" class="col-12 line-height-4 rounded border-thick border-darken2 border-darken3-hover detailCursor-border-blue border-blue-focus detailCursor-stroked-blue-focus"  value="" id="airtableBaseId" required="" style="padding: 6px" />')
      airtableSwitchBaseInput.hide()
      $('#airtableBaseIdPointer').show()
    })

    // On API token validation...
    airtableApiTokenField.parsley().on('field:success', async function (e) {
      // Get a list of bases
      const airtableApiToken = e.value
      const baseList = await airtableGetListOfBases(airtableApiToken)
      const sortedBaseList = baseList.bases.sort((a, b) => (a.name > b.name) ? 1 : -1)

      // Add them to the existing <select> drop down
      for (const base of sortedBaseList) {
        const o = new Option(base.name, base.id)
        $(o).html(base.name)
        $(airtableBaseIdFieldId).append(o)
      }
    })

    // Form validation powered by parsleyjs.org
    $('#airtableWdcForm').parsley({
      errors: {
        container: function (elem) {
          return $(elem).parent().parent().parent()
        }
      }
    })
      .on('field:validated', function () {
        const ok = $('.parsley-error').length === 0
        $('.bs-callout-info').toggleClass('hidden', !ok)
        $('.bs-callout-warning').toggleClass('hidden', ok)
      })
      .on('form:submit', function () {
        // Store form values in Tableau connection data
        const connectionData = {
          BASE_ID: $(airtableBaseIdFieldId).val(),
          FIELD_NAME_FOR_AIRTABLE_RECORD_ID: '_airtableRecordId'
        }
        tableau.connectionData = JSON.stringify(connectionData)
        tableau.password = airtableApiTokenField.val().trim()
        tableau.connectionName = `Airtable Base ${connectionData.BASE_ID}`

        // Send the connector object to Tableau
        tableau.submit()
      })
  })
})()
