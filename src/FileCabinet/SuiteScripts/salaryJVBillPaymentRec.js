/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

const SALARYREIMBACCT = 1117;
const CHEQUE = 1;

define(['N/record', 'N/log', 'N/runtime', 'SuiteScripts/pts_helper'],
    function (record, log, runtime, util) {

        function getInputData() {
            const scriptObj = runtime.getCurrentScript();
            const jvId = scriptObj.getParameter({ name: 'custscript_jv_rec_id' });
            log.debug("jvId-15", jvId)

            if (!jvId) {
                log.error("Missing JV ID", "custscript_jv_rec_id not provided");
                return [];
            }

            return [jvId]; // pass JV id to map stage
        }

        function map(context) {
            try {
                const jvId = JSON.parse(context.value);
                log.debug("jvId-28", jvId)
                const jvRecord = record.load({ type: record.Type.JOURNAL_ENTRY, id: jvId });
                const company = jvRecord.getValue("subsidiary");

                const lineCount = jvRecord.getLineCount({ sublistId: 'line' });

                for (let i = 0; i < lineCount; i++) {
                    const account = jvRecord.getSublistValue({ sublistId: 'line', fieldId: 'account', line: i });
                    log.debug("account", account)

                    if (account == SALARYREIMBACCT) {
                        const amount = jvRecord.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: i });
                        log.debug("amount", amount)
                        const employee = jvRecord.getSublistValue({ sublistId: 'line', fieldId: 'entity', line: i });
                        log.debug("employee", employee)

                        const memo = jvRecord.getSublistValue({ sublistId: 'line', fieldId: 'memo', line: i });
                        log.debug("memo", memo)
                        if (!employee || !amount || !memo) continue;

                        const salaryJVs = getUnpaidSalaryJVs(employee, company, memo);
                        log.debug("salaryJVs", salaryJVs)
                        if (salaryJVs) {
                            context.write({
                                key: employee,
                                value: { jvId, employee, amount, salaryJVs }
                            });
                        }
                    }
                }
            } catch (e) {
                log.error("Error in map", e);
            }
        }

        function reduce(context) {
            try {
                const values = context.values.map(v => JSON.parse(v));
                values.forEach(v => {
                    const paymentId = createBillPayment(v.employee, SALARYREIMBACCT, CHEQUE, v.amount, v.salaryJVs, v.jvId);
                    log.debug("Bill Payment Created", `Employee: ${v.employee}, Payment ID: ${paymentId}`);
                });
            } catch (e) {
                log.error("Error in reduce", e);
            }
        }

        function getUnpaidSalaryJVs(employeeId, company, memo) {
            try {
                const salaryJVSer = {
                    type: "transaction",
                    filters: [
                        ["type", "anyof", "Custom110"], "AND",
                        ["custbody_salary_jv_emp_name", "anyof", employeeId], "AND",
                        ["subsidiary", "anyof", company], "AND",
                        ["custbody_db_integration_created", "is", "T"], "AND",
                       // ["trandate", "within", "thismonth"], "AND",
                        ["memo","is",memo]
                    ],
                    columns: ["internalid"]
                };

                log.debug("salaryJVSer", salaryJVSer)

                const res = util.getSearch(salaryJVSer.type, salaryJVSer.filters, salaryJVSer.columns);
                log.debug("res", res)
                return res.length > 0 ? res[0].internalid : null;
            } catch (error) {
                log.error("Error in getUnpaidSalaryJVs", error)
            }
        }

        function createBillPayment(employee, acct, method, amount, salaryJVs, jvId) {
            try {

                log.debug("createBillPayment", {
                    employee, acct, method, amount, salaryJVs, jvId
                })

                const billPayment = record.create({ type: record.Type.VENDOR_PAYMENT, isDynamic: true });
                billPayment.setValue({ fieldId: 'entity', value: employee });
                billPayment.setValue({ fieldId: 'apacct', value: acct });
                billPayment.setValue({ fieldId: 'custbody_payment_method', value: method });


                const newLines = util.getLines(billPayment, "apply", ["amount", "internalid"])
                log.debug("newLines", newLines)
                // Apply JV
                const lineNumber = billPayment.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'internalid', value: jvId });
                log.debug("lineNumber", lineNumber)

                if (lineNumber >= 0) {
                    billPayment.selectLine({ sublistId: 'apply', line: lineNumber });
                    billPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                    billPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount * -1 });
                    billPayment.commitLine({ sublistId: 'apply' });
                }

                // Apply Salary JV
                const sJVLineNumber = billPayment.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'internalid', value: parseInt(salaryJVs) });
                log.debug("sJVLineNumber", sJVLineNumber)

                if (sJVLineNumber >= 0) {
                    billPayment.selectLine({ sublistId: 'apply', line: sJVLineNumber });
                    billPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                    billPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount });
                    billPayment.commitLine({ sublistId: 'apply' });
                }

                var bPRec = billPayment.save();
                log.debug("bPRec", bPRec)
                return bPRec

            } catch (error) {
                log.error("Error in createBillPayment", error)
            }
        }

        return { getInputData, map, reduce };
    });
