/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

const PANACEAJVFORM = 298;
const SALARYREIMBACCT = 1117;
const SJVTYPEOFENTRYPAYMENT = 2;
const SJVTYPEOFENTRYSALARY = 1;
const APPROVED = 2;
define(["N/record", "SuiteScripts/pts_helper", "N/task", "N/log", "N/format"], function (record, util, task, log, format) {

    function onRequest(context) {
        var journalId;

        try {
            if (context.request.method == 'POST') {

                context.response.setHeader({
                    name: "content-type",
                    value: "application/json"
                })

                var requestBody = JSON.parse(context.request.body);

                var lines = requestBody.lines || [];


                var creditAccount = requestBody.account;
                var company = requestBody.company
                var date = requestBody.postingDate
                log.debug("daTE", date)

                   var dateparts = date.split("/");
            


                var memo = lines[0].memo;
                var afterOf = memo.split("of ")[1];

                log.debug("afterOf", afterOf)


                var journalRec = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });

                journalRec.setValue({
                    fieldId: "customform",
                    value: PANACEAJVFORM
                })

                journalRec.setValue({
                    fieldId: "trandate",
                    value: new Date(dateparts[2],dateparts[1]-1,dateparts[0])
                })

                journalRec.setValue({
                    fieldId: "subsidiary",
                    value: company
                })

                journalRec.setValue({
                    fieldId: "custbody_cust_pts_pbl_type_of_entry",
                    value: SJVTYPEOFENTRYPAYMENT
                })

                journalRec.setValue({
                    fieldId: "memo",
                    value: "Salary for" + " " + afterOf + " " + "is paid & Knocked off"
                })

                journalRec.setValue({
                    fieldId: "approvalstatus",
                    value: APPROVED
                })

                journalRec.setValue({
                    fieldId: "custbody_processed_from_sala_jv",
                    value: true
                })


                var totalAmount = 0;

                var employeeIds = lines.map(function (line) { return line.name; });
                log.debug("employeeIds", employeeIds)
                var uniqueEmployeeIds = [...new Set(employeeIds)];
                log.debug("uniqueEmployeeIds", uniqueEmployeeIds)

                var employeeDetails = getEmployeeDetails(uniqueEmployeeIds);
                log.debug("employeeDetails", employeeDetails)

                var costCenterList = employeeDetails.map(function (emp) { return emp.cseg_cost_centre; });
                var uniqueCostCenterList = [...new Set(costCenterList)];
                log.debug("costCenterList", costCenterList)


                var profitCenterGroups = getProfitCenterGroup(uniqueCostCenterList);
                log.debug("profitCenterGroup", profitCenterGroups)


                var profitCentreList = profitCenterGroups.map(function (pc) { return pc.custrecord_profit_centre; });
                var uniqueProfitCentreList = [...new Set(profitCentreList)];
                log.debug("uniqueProfitCentreList", uniqueProfitCentreList);


                var businessSegments = getBusinessSegment(uniqueProfitCentreList)
                log.debug("businessSegment", businessSegments);


                // Add Debit Lines
                lines.forEach(function (line) {

                    var employeeDetail = employeeDetails.find(function (emp) { return emp.id == line.name; });

                    log.debug("employeeDetail", employeeDetail)

                    if (employeeDetail) {

                        // if (employeeDetail.InActive == true) {
                        //     log.debug("if inactive status triggered", "triggered") //employeestatus : 2

                        //     var activeEmployee = record.submitFields({
                        //         type: "employee",
                        //         id: employeeDetail.internalId,
                        //         values: {
                        //             "isinactive": false,
                        //             "employeestatus": 2,
                        //         },
                        //         options: {
                        //             enablesourcing: true,
                        //         }
                        //     })
                        //     log.debug("activeEmployee", activeEmployee)
                        // }


                        var profitCenterGroup = {};
                        if (!util.isNullorDefault(employeeDetail.cseg_cost_centre)) {
                            profitCenterGroup = profitCenterGroups.find(function (pc) { return pc.id == employeeDetail.cseg_cost_centre; }) || {};
                        }

                        log.debug("profitCenterGroup:" + employeeDetail.id, profitCenterGroup)

                        var businessSegment = {};
                        if (!util.isNullorDefault(profitCenterGroup.custrecord_profit_centre)) {
                            businessSegment = businessSegments.find(function (bs) { return bs.id == profitCenterGroup.custrecord_profit_centre; }) || {};

                        }
                        log.debug("businessSegment:" + employeeDetail.id, businessSegment)

                        var jvParams = {
                            profitCenterGroup: profitCenterGroup,
                            businessSegment: businessSegment.custrecord1954 || ''
                        }

                        journalRec.selectNewLine({ sublistId: 'line' });
                        journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: line.name });
                        journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: SALARYREIMBACCT });
                        journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: line.amount });
                        journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: employeeDetail.department });
                        journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: employeeDetail.location });
                        journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: line.memo });
                        journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_cost_centre', value: employeeDetail.cseg_cost_centre });
                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: jvParams.profitCenterGroup.custrecord_profit_centre || ''
                        })

                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg2',
                            value: jvParams.businessSegment || ''
                        })

                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_plant_hier',
                            value: jvParams.profitCenterGroup.custrecord_plant_hier_ || ''
                        })

                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_plant_hier_2_c',
                            value: jvParams.profitCenterGroup.custrecord_plant_hier_2_c || ''
                        })

                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_plant_heir_cod',
                            value: jvParams.profitCenterGroup.custrecord_plant_heir_3 || ''
                        })

                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_plant_hier_4',
                            value: jvParams.profitCenterGroup.custrecord_plant_hier_4 || ''
                        })
                        journalRec.commitLine({ sublistId: 'line' });

                        totalAmount += line.amount;
                        log.debug("totalAmount", totalAmount)

                        // if (employeeDetail.InActive == true) { //employeestatus : 2

                        //     var againInactiveEmployee = record.submitFields({
                        //         type: "employee",
                        //         id: employeeDetail.internalId,
                        //         values: {
                        //             "isinactive": true,
                        //             "employeestatus": 8,
                        //         },
                        //         options: {
                        //             enablesourcing: true,
                        //         }
                        //     })
                        //     log.debug("againInactiveEmployee", againInactiveEmployee)
                        // }

                    }

                });

                // Add Credit Line (Total)
                journalRec.selectNewLine({ sublistId: 'line' });
                journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: creditAccount });
                journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: totalAmount });
                journalRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memo });
                journalRec.commitLine({ sublistId: 'line' });

                journalId = journalRec.save();
                log.debug("journalId", journalId)



                // Create scheduled script task
                var mrScriptTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_sjv_bp_rec',
                    deploymentId: 'customdeploy_sjv_bp_rec',
                    params: {
                        'custscript_jv_rec_id': journalId
                    }
                });

                var mrScriptId = mrScriptTask.submit();
                log.debug("mrScriptId", mrScriptId);

                // Update Salary JV Records
                var mrScriptSJVUpdateTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_sjv_update_value',
                    deploymentId: 'customdeploy_sjv_update_value',
                    params: {
                        'custscript_sjv_lines_id': JSON.stringify(lines),
                        'custscript_journal_id_rec': journalId
                    }
                });


                var mrScriptUpdateSJVId = mrScriptSJVUpdateTask.submit();
                log.debug("mrScriptUpdateSJVId", mrScriptUpdateSJVId);

            }

            context.response.write(JSON.stringify({
                success: true,
                journalId: journalId,
                mrScriptId: mrScriptId,
                debug: {
                    mrScriptParams: {
                        'custscript_jv_rec_id': journalId
                    }
                }
            }));


        } catch (error) {
            log.error("Error in onRequest", error)

            context.response.write(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    function getEmployeeDetails(id) {

        try {

            var employeeSearchObj = {
                type: "employee",
                filters:
                    [
                        ["internalid", "anyof", id],
                    ],
                columns:
                    [
                        "internalid",
                        "isinactive",
                        "location",
                        "department",
                        "cseg_cost_centre"
                    ]
            };

            return util.getSearch(employeeSearchObj.type, employeeSearchObj.filters, employeeSearchObj.columns);



        } catch (error) {
            log.error("Error in getEmployeeStatus", error)
            throw error
        }

    }



    function getProfitCenterGroup(costcenterId) {
        try {

            var costCenterSearObj = {
                type: "customrecord_cseg_cost_centre",
                filters:
                    [
                        ["internalid", "anyof", costcenterId]
                    ],
                columns:
                    [
                        "name",
                        "custrecord_profit_centre",
                        "custrecord_plant_hier_",
                        "custrecord_plant_hier_2_c",
                        "custrecord_plant_heir_3",
                        "custrecord_plant_hier_4"
                    ]
            }
            return util.getSearch(costCenterSearObj.type, costCenterSearObj.filters, costCenterSearObj.columns);

        } catch (error) {
            log.error("Error in getProfitCenterGroup", error)
            throw error
        }
    }
    //id,undefined - extremely - always does one thing
    function getBusinessSegment(profitCenterid) {
        try {
            if (profitCenterid) {
                var profitCentSerObj = {
                    type: "classification",
                    filters:
                        [
                            ["internalid", "anyof", profitCenterid]
                        ],
                    columns:
                        [
                            "custrecord1954"
                        ]
                }

                return util.getSearch(profitCentSerObj.type, profitCentSerObj.filters, profitCentSerObj.columns);

            }
        } catch (error) {
            log.error("Error in getBusinessSegment", error)
            throw error
        }
    }

    return {
        onRequest: onRequest
    }
});