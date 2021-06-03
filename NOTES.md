### About relationships and joining tables

Relationships between tables and their records are not able to be automatically identified but [can be mapped after the initial connection is made](https://help.tableau.com/current/pro/desktop/en-us/relate_tables.htm)

### About field mapping

This WDC attempts to import Airtable fields as the best matching Tableau data type and column role and [can be modified after record data is imported](https://help.tableau.com/current/pro/desktop/en-us/datafields_typesandroles_datatypes.htm). The table below represents the current field mapping implemented.

| Airtable Field Type   	| Tableau Data Type 	| Tableau Column Role 	| Notes                                                                                                   	|
|-----------------------	|-------------------	|---------------------	|---------------------------------------------------------------------------------------------------------	|
| autoNumber            	| string            	| dimension           	|                                                                                                         	|
| barcode               	| string            	| dimension           	|                                                                                                         	|
| button                	| -                 	| -                   	| This field is intentionally excluded and will not be shown in Tableau                                   	|
| checkbox              	| bool              	| dimension           	|                                                                                                         	|
| count                 	| int               	| metric              	|                                                                                                         	|
| createdBy             	| string            	| dimension           	| User's email address (Airtable UI shows user name)                                                      	|
| createdTime           	| datetime          	| dimension           	| GMT                                                                                                     	|
| currency              	| float             	| metric              	| Will not contain currency symbol                                                                        	|
| date                  	| date              	| dimension           	|                                                                                                         	|
| dateTime              	| datetime          	| dimension           	| GMT                                                                                                     	|
| duration              	| int               	| metric              	| # of seconds                                                                                            	|
| email                 	| string            	| dimension           	|                                                                                                         	|
| externalSyncSource    	| string            	| dimension           	|                                                                                                         	|
| formula               	| string            	| dimension           	|                                                                                                         	|
| lastModifiedBy        	| string            	| dimension           	| User's email address (Airtable UI shows user name)                                                      	|
| lastModifiedTime      	| datetime          	| dimension           	| GMT                                                                                                     	|
| multilineText         	| string            	| dimension           	|                                                                                                         	|
| multipleAttachments   	| -                 	| -                   	| This field is intentionally excluded and will not be shown in Tableau                                   	|
| multipleCollaborators 	| string            	| dimension           	| Comma separated list of emails                                                                          	|
| multipleLookupValues  	| string            	| dimension           	| Comma separated list of lookup values                                                                   	|
| multipleRecordLinks   	| string            	| dimension           	| Comma separated list of Airtable record IDs (can be joined via linked table's _airtableRecordId column) 	|
| multipleSelects       	| string            	| dimension           	| Comma separated list of values                                                                          	|
| number                	| float             	| metric              	|                                                                                                         	|
| percent               	| float             	| metric              	| Percentage represented as a decimail (50% => 0.5, 100% => 1.0)                                          	|
| phoneNumber           	| string            	| dimension           	| String formatted as a phone number (with parentheses and hyphens), when possible                        	|
| rating                	| number            	| metric              	|                                                                                                         	|
| richText              	| string            	| dimension           	|                                                                                                         	|
| rollup                	| string            	| dimension           	|                                                                                                         	|
| singleCollaborator    	| string            	| dimension           	| User's email address (Airtable UI shows user name)                                                      	|
| singleLineText        	| string            	| dimension           	|                                                                                                         	|
| singleSelect          	| string            	| dimension           	|                                                                                                         	|
| url                   	| string            	| dimension           	|                                                                                                         	|

### External dependencies

The following external dependencies are loaded by HTML script tags in [`index.html`](index.html):
 - jQuery for DOM manipulation
 - ParlseyJS for form validation (depends on jQuery)
 - Tableau WDC (first party Tableau SDK)
 - Airtable.js (first party Airtable SDK)

Security conscious users may chose to download, review, and self-host these external dependencies.