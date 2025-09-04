/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

const SJVTYPEOFENTRYSALARY = 1;

define(["N/record", "N/runtime"], function (record, runtime) {

    function getInputData() {
        const currentScript = runtime.getCurrentScript();
        const lines = JSON.parse(currentScript.getParameter('custscript_sjv_lines_id') || "[]");
        log.debug("lines", lines);
        const journalId = currentScript.getParameter('custscript_journal_id_rec');
        log.debug("journalId", journalId); 
        return lines.map(line => ({
            salaryJvId: line.salaryJvId,
            journalId: journalId
        }));
    }

    function map(context) {
        const value = JSON.parse(context.value);
        context.write({
            key: value.salaryJvId,
            value: value
        });
    }

    function reduce(context) {
        context.values.forEach(val => {
            const data = JSON.parse(val);
            log.debug("Salary JV id", `ID: ${data.salaryJvId}`);
            record.submitFields({
                type: 'customtransactionpb_pts_salary_jv',
                id: data.salaryJvId,
                values: {
                    custbody_salary_jv_processed: true,
                    custbody_sal_jv_processed: true,
                    custbody_cust_pts_pbl_type_of_entry: SJVTYPEOFENTRYSALARY,
                    custbody_processed_jv: data.journalId
                },
                options: {
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                }
            });

            log.debug("Updated Salary JV", `ID: ${data.salaryJvId}, Linked JV: ${data.journalId}`);
        });
    }

    return { getInputData, map, reduce };
});
