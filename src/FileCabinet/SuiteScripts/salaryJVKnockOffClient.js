/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
var LINES = [], SUBLISTNAME = "custpage_sublist";
define(['N/log', 'N/search', 'N/record', 'N/currentRecord', 'N/url', 'SuiteScripts/pts_helper', "N/https", "N/format", "SuiteScripts/moment"],
    function (log, search, record, currentRecord, url, util, https, format, moment) {
        var exports = {};

        function pageInit(context) {
            window.onbeforeunload = null;
        }

        function selectAllCheckboxes() {
            try {

                var rec = currentRecord.get();
                var lines = util.getLines(rec, SUBLISTNAME, ["custpage_checkbox"])

                for (var i = 0; i < lines.length; i++) {
                    var record = rec.selectLine({
                        sublistId: SUBLISTNAME,
                        line: i
                    });
                    rec.setCurrentSublistValue({
                        sublistId: SUBLISTNAME,
                        fieldId: "custpage_checkbox",
                        line: i,
                        value: true,
                    })
                    rec.commitLine({
                        sublistId: SUBLISTNAME
                    });
                }
            } catch (error) {
                log.error("error in selectAllCheckBoxes", error)
            }

        }

        function unselectAllCheckboxes() {
            try {

                var rec = currentRecord.get();
                var lines = util.getLines(rec, SUBLISTNAME, ["custpage_checkbox"])

                for (var i = 0; i < lines.length; i++) {
                    var record = rec.selectLine({
                        sublistId: SUBLISTNAME,
                        line: i
                    });
                    rec.setCurrentSublistValue({
                        sublistId: SUBLISTNAME,
                        fieldId: "custpage_checkbox",
                        line: i,
                        value: false,
                    })
                    rec.commitLine({
                        sublistId: SUBLISTNAME
                    });

                }
            } catch (error) {
                log.error("error in unselectAllCheckBoxes", error)
            }

        }

        function createJV() {
            try {
                var rec = currentRecord.get();
                var lines = util.getLines(rec, SUBLISTNAME, ["custpage_checkbox"]);
                var selectedLines = [];
                var hasInactive = false;

                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].custpage_checkbox === true) {
                        var status = rec.getSublistValue({
                            sublistId: SUBLISTNAME,
                            fieldId: 'custpage_employee_status', // Make sure this is the correct field ID
                            line: i
                        });

                        if (status && status.toUpperCase() === "INACTIVE") {
                            hasInactive = true;
                            break;
                        }

                        selectedLines.push({
                            salaryJvId: rec.getSublistValue({ sublistId: SUBLISTNAME, fieldId: 'custpage_salary_jv_no', line: i }),
                            name: rec.getSublistValue({ sublistId: SUBLISTNAME, fieldId: 'custpage_employee_name', line: i }),
                            department: rec.getSublistValue({ sublistId: SUBLISTNAME, fieldId: 'custpage_department', line: i }),
                            location: rec.getSublistValue({ sublistId: SUBLISTNAME, fieldId: 'custpage_location', line: i }),
                            costCenter: rec.getSublistValue({ sublistId: SUBLISTNAME, fieldId: 'custpage_cost_center', line: i }),
                            amount: parseFloat(rec.getSublistValue({ sublistId: SUBLISTNAME, fieldId: 'custpage_amount', line: i })) || 0,
                            memo: rec.getSublistValue({ sublistId: SUBLISTNAME, fieldId: 'custpage_memo', line: i })
                        });
                    }
                }

                if (hasInactive) {
                    alert("One or more selected employees are INACTIVE. Please deselect them before creating the Journal Entry.");
                    return;
                }

                if (!selectedLines.length) {
                    alert("Please select at least one line to create JV.");
                    return;
                }

                var account = rec.getValue({ fieldId: 'custpage_salary_jv_account' });
                var company = rec.getValue('custpage_salary_jv_company');

                var postingDate = nlapiGetFieldValue("custpage_salary_jv_posting_date")//rec.getValue('custpage_salary_jv_posting_date');

                console.log("postingDate", postingDate);

                if (!account) {
                    alert("Please select an Account.");
                    return;
                }

                var response = https.requestSuitelet({
                    scriptId: "customscript_sjv_sjv_upd_jv_creation",
                    deploymentId: "customdeploy_sjv_sjv_upd_jv_creation",
                    method: "POST",
                    body: JSON.stringify({ lines: selectedLines, account: account, company: company, postingDate: postingDate }),
                });

                var body = JSON.parse(response.body);



                if (body.success) {
                    alert("Journal Entry created successfully with ID: " + body.journalId +
                        "\nBill payments are being processed. Please wait...");


                    var urlLink = url.resolveScript({
                        scriptId: 'customscriptstatus_page_suitelet',
                        deploymentId: 'customdeploystatus_page_suitelet',
                        returnExternalUrl: false
                    });

                    window.open(urlLink, "_blank");


                    checkScheduledScriptCompletion(body.journalId);

                    return;

                } else {
                    alert("Failed to create Journal Entry. " + body.error);
                }

            } catch (error) {

                if (error.name === 'SSS_REQUEST_TIME_EXCEEDED') {

                    "customscriptstatus_page_suitelet", "customdeploy_status_page_suitelet"



                    var urlLinks = url.resolveScript({
                        scriptId: 'customscriptstatus_page_suitelet',
                        deploymentId: 'customdeploy_status_page_suitelet',
                        returnExternalUrl: false
                    });

                    window.open(urlLinks, "_blank");
                    return;

                }

                console.log("error", error);

                log.error("Error in createJV:", error);
                alert("An error occurred while creating the Journal Entry. Please try again.");
            }
        }

        // Optional: Add this function to check scheduled script completion
        function checkScheduledScriptCompletion(journalId) {
            setTimeout(function () {
                window.location.href = url.resolveScript({
                    scriptId: 'customscript_sal_jv_knock_off_validation',
                    deploymentId: 'customdeploy_sal_jv_knock_off_validation',
                    returnExternalUrl: false
                });
            }, 10000); // Wait for 10 seconds
        }

        function saveRecord(context) {

            return true;
        }

        function downloadExcel() {
            try {
                var rec = currentRecord.get();
                var lines = util.getLines(rec, SUBLISTNAME, [
                    "custpage_checkbox", "custpage_salary_jv_no", "custpage_frm_date_range",
                    "custpage_memo", "custpage_cur", "custpage_company",
                    "custpage_exchange_rate", "custpage_employee_name", "custpage_location",
                    "custpage_department", "custpage_cost_center", "custpage_profit_center_group",
                    "custpage_amount", "custpage_employee_status", "custpage_employee_bankname"
                ]);

                var selectedLines = lines.filter(function (line) {
                    return line.custpage_checkbox === true;
                });

                if (!selectedLines.length) {
                    selectedLines = lines;
                }

                // Build CSV content
                var headers = [
                    "Salary JV No", "Date", "Memo", "Currency", "Company",
                    "Exchange Rate", "Employee", "Location", "Department",
                    "Cost Center", "Profit Center Group", "Amount", "Employee Status", "Employee Bank Name"
                ];

                var csvContent = headers.join(",") + "\n";

                selectedLines.forEach(function (line) {
                    csvContent += [
                        line.custpage_salary_jv_no,
                        line.custpage_frm_date_range,
                        '"' + (line.custpage_memo || "") + '"',
                        line.custpage_cur,
                        line.custpage_company,
                        line.custpage_exchange_rate,
                        line.custpage_employee_name_txt,
                        line.custpage_location,
                        line.custpage_department,
                        line.custpage_cost_center,
                        line.custpage_profit_center_group,
                        line.custpage_amount,
                        line.custpage_employee_status,
                        line.custpage_employee_bankname
                    ].join(",") + "\n";
                });

                // Trigger download
                var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                var link = document.createElement("a");
                var urlObj = URL.createObjectURL(blob);
                link.setAttribute("href", urlObj);
                link.setAttribute("download", "SalaryJV_Export.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (e) {
                log.error("Error in downloadExcel", e);
                alert("Failed to download Excel. Check console logs.");
            }
        }


        function fieldChanged(context) {
            var fieldId = context.fieldId;
            var sublistId = context.sublistId;

            if (sublistId === SUBLISTNAME && fieldId === 'custpage_checkbox') {
                calculateTotalAmount();
            }
        }

        function calculateTotalAmount() {
            try {
                var rec = currentRecord.get();
                var lines = util.getLines(rec, SUBLISTNAME, ["custpage_checkbox", "custpage_amount"]);
                var total = 0;

                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].custpage_checkbox === true) {
                        var amount = parseFloat(lines[i].custpage_amount) || 0;
                        total += amount;
                    }
                }

                // Update the total amount field
                rec.setValue({
                    fieldId: 'custpage_total_selected_amount',
                    value: total.toFixed(2)
                });

                return total;
            } catch (error) {
                log.error("Error in calculateTotalAmount", error);
                return 0;
            }
        }

        function onCheckboxChange() {
            // This function will be called when checkboxes change
            calculateTotalAmount();
        }


        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            selectAllCheckboxes: selectAllCheckboxes,
            unselectAllCheckboxes: unselectAllCheckboxes,
            createJV: createJV,
            downloadExcel: downloadExcel,
            fieldChanged: fieldChanged,
            onCheckboxChange: onCheckboxChange
        };

    });