/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["SuiteScripts/pts_helper", "N/search", "N/ui/serverWidget", "N/record"], function (util, search, serverWidget, record) {

    function onRequest(context) {

        try {

            if (context.request.method == 'GET') {

                var fromDate = context.request.parameters.custpage_salary_jv_from_date;
                var toDate = context.request.parameters.custpage_salary_jv_to_date;
                var company = context.request.parameters.custpage_salary_jv_company;
                var account = context.request.parameters.custpage_salary_jv_account;
                var bankName = context.request.parameters.custpage_salary_jv_bank_name;
                var postingDate = context.request.parameters.custpage_salary_jv_posting_date;

                var salaryJVKnockOfffFormObj = createSalaryJVKnockOffForm(fromDate, toDate, company, account, bankName, postingDate)

                context.response.writePage(salaryJVKnockOfffFormObj);

            } else if (context.request.method == 'POST') {

                var requestPo = context.request;
                var from_Date = context.request.parameters.custpage_salary_jv_from_date;
                var to_Date = context.request.parameters.custpage_salary_jv_to_date;
                var company_Name = context.request.parameters.custpage_salary_jv_company;
                var account_No = context.request.parameters.custpage_salary_jv_account;
                var bankName = context.request.parameters.custpage_salary_jv_bank_name;
                var posting_Date = context.request.parameters.custpage_salary_jv_posting_date;

                var salJVformObj = createSalJVKnockOffForm(from_Date, to_Date, company_Name, account_No, bankName, posting_Date);

                context.response.writePage(salJVformObj);

            }


        } catch (error) {
            log.error("Error in onRequest", error)
        }

    }

    return {
        onRequest: onRequest
    }

    function createSalaryJVKnockOffForm(fromDate, toDate, company_Name, account, bankName, postingDateVal) {

        var form = serverWidget.createForm({
            title: "Salary JV Payment"
        });

        var salaryJV_usergroup = form.addFieldGroup({
            id: 'salaryJV_usergroup',
            label: 'Primary Information'
        });
        salaryJV_usergroup.isSingleColumn = true;

        var From_Date1 = form.addField({
            id: 'custpage_salary_jv_from_date',
            type: serverWidget.FieldType.DATE,
            label: 'From Date',
            container: 'salaryJV_usergroup'
        });

        if (fromDate) {
            From_Date1.defaultValue = fromDate;
        }

        var To_Date1 = form.addField({
            id: 'custpage_salary_jv_to_date',
            type: serverWidget.FieldType.DATE,
            label: 'To Date',
            container: 'salaryJV_usergroup'
        });

        if (toDate) {
            To_Date1.defaultValue = toDate;
        }

        var postingDate12 = form.addField({
            id: 'custpage_salary_jv_posting_date',
            type: serverWidget.FieldType.DATE,
            label: 'Posting Date',
            container: 'salaryJV_usergroup'
        });

        if (postingDate12) {
            postingDate12.defaultValue = postingDateVal;
        }

        var subsidiary = form.addField({
            id: 'custpage_salary_jv_company',
            type: serverWidget.FieldType.SELECT,
            label: 'Company',
            source: 'subsidiary',
            container: 'salaryJV_usergroup'
        });

        if (company_Name) {
            subsidiary.defaultValue = company_Name;
        }

        var BankName = form.addField({
            id: 'custpage_salary_jv_bank_name',
            type: serverWidget.FieldType.SELECT,
            label: 'Employee Bank Name',
            source: 'customrecordpts_pan_bank_name',
            container: 'salaryJV_usergroup'
        });

        if (BankName) {
            BankName.defaultValue = bankName;
        }

        var salaryJVAccount = form.addField({
            id: 'custpage_salary_jv_account',
            type: serverWidget.FieldType.SELECT,
            label: 'Account',
            container: 'salaryJV_usergroup'
        });

        // Add default blank option
        salaryJVAccount.addSelectOption({ value: '', text: '' });

        if (company_Name) {
            // Load accounts for selected subsidiary using a search
            var accountSearch = search.create({
                type: 'account',
                filters: [['subsidiary', 'anyof', company_Name], 'AND', ['isinactive', 'is', 'F'],
                    "AND",
                ["type", "anyof", "Bank"]],
                columns: ['name']
            });

            accountSearch.run().each(function (result) {
                salaryJVAccount.addSelectOption({
                    value: result.id,
                    text: result.getValue('name')
                });
                return true;
            });
        }

        if (salaryJVAccount != '' && salaryJVAccount != null) {
            salaryJVAccount.defaultValue = account;
        }

        var totalAmountField = form.addField({
            id: 'custpage_total_selected_amount',
            type: serverWidget.FieldType.FLOAT,
            label: 'Total Selected Amount',
            container: 'salaryJV_usergroup'
        });
        totalAmountField.defaultValue = '0.00';
        totalAmountField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        form.clientScriptModulePath = 'SuiteScripts/salaryJVKnockOffClient';
        form.addButton({ id: 'custpage_create_jv', label: 'Create JV', functionName: "createJV()" });

        form.addSubmitButton({
            label: "Submit"
        });

        var sublist = salaryJVInfoSublist("custpage_sublist", form);

        sublist.style = serverWidget.ListStyle.NORMAL;
        sublist.addButton({
            id: 'selectAllCheckboxes_btn',
            label: 'Mark All',
            functionName: "selectAllCheckboxes()"
        });
        sublist.addButton({
            id: 'unselectAllCheckboxes_btn',
            label: 'UnMark All',
            functionName: "unselectAllCheckboxes()"
        });

        return form;
    }

    function createSalJVKnockOffForm(from_Date, to_Date, company_Name, account, bankName, posting_Date_val) {

        log.debug("company_Name", company_Name)

        var form = serverWidget.createForm({
            title: "Salary JV Payment"
        });

        var salaryJV_usergroup = form.addFieldGroup({
            id: 'salaryJV_usergroup',
            label: 'Primary Information'
        });
        salaryJV_usergroup.isSingleColumn = true;

        var From_Date1 = form.addField({
            id: 'custpage_salary_jv_from_date',
            type: serverWidget.FieldType.DATE,
            label: 'From Date',
            container: 'salaryJV_usergroup'
        });

        if (From_Date1 != '' && From_Date1 != null) {
            From_Date1.defaultValue = from_Date;
        }

        var To_Date1 = form.addField({
            id: 'custpage_salary_jv_to_date',
            type: serverWidget.FieldType.DATE,
            label: 'To Date',
            container: 'salaryJV_usergroup'
        });

        if (To_Date1 != '' && To_Date1 != null) {
            To_Date1.defaultValue = to_Date;
        }

        var postingDate = form.addField({
            id: 'custpage_salary_jv_posting_date',
            type: serverWidget.FieldType.DATE,
            label: 'Posting Date',
            container: 'salaryJV_usergroup'
        });

        if (postingDate) {
            postingDate.defaultValue = posting_Date_val;
        }

        var subsidiary = form.addField({
            id: 'custpage_salary_jv_company',
            type: serverWidget.FieldType.SELECT,
            label: 'Company',
            source: 'subsidiary',
            container: 'salaryJV_usergroup'
        });

        if (subsidiary != '' && subsidiary != null) {
            subsidiary.defaultValue = company_Name;
        }

        var BankName = form.addField({
            id: 'custpage_salary_jv_bank_name',
            type: serverWidget.FieldType.SELECT,
            label: 'Employee Bank Name',
            source: 'customrecordpts_pan_bank_name',
            container: 'salaryJV_usergroup'
        });

        if (BankName) {
            BankName.defaultValue = bankName;
        }

        var salaryJVAccount = form.addField({
            id: 'custpage_salary_jv_account',
            type: serverWidget.FieldType.SELECT,
            label: 'Account',
            container: 'salaryJV_usergroup'
        });

        // Add default blank option
        salaryJVAccount.addSelectOption({ value: '', text: '' });

        if (company_Name) {
            // Load accounts for selected subsidiary using a search
            var accountSearch = search.create({
                type: 'account',
                filters: [['subsidiary', 'anyof', company_Name], 'AND', ['isinactive', 'is', 'F'],
                    "AND",
                ["type", "anyof", "Bank"]],
                columns: ['name']
            });

            accountSearch.run().each(function (result) {
                salaryJVAccount.addSelectOption({
                    value: result.id,
                    text: result.getValue('name')
                });
                return true;
            });
        }

        if (salaryJVAccount != '' && salaryJVAccount != null) {
            salaryJVAccount.defaultValue = account;
        }

        var totalAmountField = form.addField({
            id: 'custpage_total_selected_amount',
            type: serverWidget.FieldType.FLOAT,
            label: 'Total Selected Amount',
            container: 'salaryJV_usergroup'
        });
        totalAmountField.defaultValue = '0.00';
        totalAmountField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        form.clientScriptModulePath = 'SuiteScripts/salaryJVKnockOffClient';
        form.addButton({ id: 'custpage_create_jv', label: 'Create JV', functionName: "createJV()" });
        form.addButton({
            id: 'custpage_download_excel',
            label: 'Download Excel',
            functionName: 'downloadExcel()'
        });

        log.debug("company_Name", company_Name)
        log.debug("subsidiary", subsidiary)

        var salaryJVSer = {
            type: "transaction",

            filters:
                [
                    ["type", "anyof", "Custom110"],
                    "AND",
                    ["trandate", "within", from_Date, to_Date],
                    "AND",
                    ["subsidiary", "anyof", company_Name],
                    "AND",
                    ["account", "anyof", "1117"],
                    "AND",
                    ["custbody_cust_pts_pbl_type_of_entry", "anyof", "1"],
                    "AND",
                    ["custbody_salary_jv_processed", "is", "F"],
                    "AND",
                    ["custbody_salary_jv_emp_name.custentity_pts_pbl_emp_bank_name", "anyof", bankName],
                    "AND",
                    ["amount", "greaterthan", "0.00"]
                ],
            columns:
                [
                    search.createColumn({
                        name: "transactionnumber",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "trandate",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "memo",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "currency",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "exchangerate",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "subsidiary",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "amount",
                        summary: "SUM"
                    }),
                    search.createColumn({
                        name: "entity",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "location",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "department",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "line.cseg_cost_centre",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "class",
                        summary: "GROUP"
                    }),

                    search.createColumn({
                        name: "custbody_salary_jv_emp_name",
                        summary: "GROUP"
                    }),

                    search.createColumn({

                        name: "isinactive",
                        join: "CUSTBODY_SALARY_JV_EMP_NAME",
                        summary: "GROUP"
                    }),

                    search.createColumn({
                        name: "custentity_pts_pbl_emp_bank_name",
                        join: "CUSTBODY_SALARY_JV_EMP_NAME",
                        summary: "GROUP"
                    })
                ]
        }

        var salJVSer = util.getSearch(salaryJVSer.type, salaryJVSer.filters, salaryJVSer.columns)

        form.addSubmitButton({
            label: "Submit"
        });
        var sublist = salaryJVInfoSublist("custpage_sublist", form);
        sublist.style = serverWidget.ListStyle.NORMAL;
        sublist.addButton({
            id: 'selectAllCheckboxes_btn',
            label: 'Mark All',
            functionName: "selectAllCheckboxes()"
        });
        sublist.addButton({
            id: 'unselectAllCheckboxes_btn',
            label: 'UnMark All',
            functionName: "unselectAllCheckboxes()"
        });

        salaryJVinfoData(sublist, salJVSer);
        return form;
    }

    function salaryJVInfoSublist(sublistname, form) {
        var sublist = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Salary JV Information",
        });
        sublist.addField({
            id: "custpage_checkbox",
            type: serverWidget.FieldType.CHECKBOX,
            label: "CHECK BOX"
        });

        sublist.addField({
            id: "custpage_salary_jv_no",
            type: serverWidget.FieldType.SELECT,
            label: "SALARY JV NO",
            source: 'transaction'
        });

        sublist.addField({
            id: "custpage_frm_date_range",
            type: serverWidget.FieldType.DATE,
            label: "DATE"
        });

        sublist.addField({
            id: "custpage_memo",
            type: serverWidget.FieldType.TEXT,
            label: "MEMO"
        });

        sublist.addField({
            id: "custpage_cur",
            type: serverWidget.FieldType.TEXT,
            label: "CURRENCY"
        });

        sublist.addField({
            id: "custpage_company",
            type: serverWidget.FieldType.TEXT,
            label: "COMPANY"
        });

        sublist.addField({
            id: "custpage_exchange_rate",
            type: serverWidget.FieldType.TEXT,
            label: "EXCHANGE RATE"
        });

        sublist.addField({
            id: "custpage_employee_name",
            type: serverWidget.FieldType.SELECT,
            label: "NAME",
            source: "employee"
        });

        sublist.addField({
            id: "custpage_location",
            type: serverWidget.FieldType.TEXT,
            label: "LOCATION"
        });

        sublist.addField({
            id: "custpage_department",
            type: serverWidget.FieldType.TEXT,
            label: "DEPARTMENT"
        });

        sublist.addField({
            id: "custpage_cost_center",
            type: serverWidget.FieldType.TEXT,
            label: "COST CENTER"
        });

        //custpage_profit_center_group

        sublist.addField({
            id: "custpage_profit_center_group",
            type: serverWidget.FieldType.TEXT,
            label: "PROFIT CENTER GROUP"
        });

        sublist.addField({
            id: "custpage_amount",
            type: serverWidget.FieldType.FLOAT,
            label: "AMOUNT"
        });

        sublist.addField({
            id: "custpage_employee_status",
            type: serverWidget.FieldType.TEXT,
            label: "EMPLOYEE STATUS"
        });

        sublist.addField({
            id: "custpage_employee_bankname",
            type: serverWidget.FieldType.TEXT,
            label: "EMPLOYEE BANK Name "
        });

        return sublist;

    }

    function salaryJVinfoData(sublist, data) {

        for (var i = 0; i < data.length; i++) {

            var row = data[i];

            var entity = getEmployeeName(row.entity_txt);

            sublist.setSublistValue({
                id: "custpage_salary_jv_no",
                line: i,
                value: row.internalid
            });

            sublist.setSublistValue({
                id: "custpage_frm_date_range",
                line: i,
                value: row.trandate
            });

            sublist.setSublistValue({
                id: "custpage_memo",
                line: i,
                value: row.memo
            });

            sublist.setSublistValue({
                id: "custpage_cur",
                line: i,
                value: row.currency_txt
            });

            sublist.setSublistValue({
                id: "custpage_company",
                line: i,
                value: row.subsidiary_txt
            });

            sublist.setSublistValue({
                id: "custpage_exchange_rate",
                line: i,
                value: row.exchangerate || "-"
            });

            sublist.setSublistValue({
                id: "custpage_employee_name",
                line: i,
                value: row.custbody_salary_jv_emp_name || "-"
            });


            sublist.setSublistValue({
                id: "custpage_location",
                line: i,
                value: row.location_txt || "-"
            });

            sublist.setSublistValue({
                id: "custpage_department",
                line: i,
                value: row.department_txt || "-"
            });

            sublist.setSublistValue({
                id: "custpage_cost_center",
                line: i,
                value: row["line.cseg_cost_centre_txt"] || "-"
            });


            sublist.setSublistValue({
                id: "custpage_profit_center_group",
                line: i,
                value: row.class_txt || "-"
            });

            sublist.setSublistValue({
                id: "custpage_amount",
                line: i,
                value: row.amount || 0
            });

            if (row.CUSTBODY_SALARY_JV_EMP_NAME_isinactive == true) {
                sublist.setSublistValue({
                    id: "custpage_employee_status",
                    line: i,
                    value: "INACTIVE"
                });
            } else {
                sublist.setSublistValue({
                    id: "custpage_employee_status",
                    line: i,
                    value: "ACTIVE"
                });

            }

            sublist.setSublistValue({
                id: "custpage_employee_bankname",
                line: i,
                value: row.CUSTBODY_SALARY_JV_EMP_NAME_custentity_pts_pbl_emp_bank_name_txt || 0
            });

        }
    }

    function getEmployeeName(entity) {
        var entitySer = {
            type: "employee",
            filters:
                [
                    ["entityid", "haskeywords", entity]
                ],
            columns:
                [
                    "internalid"
                ]
        }

        var res = util.getSearch(entitySer.type, entitySer.filters, entitySer.columns)

        if (res.length > 0) {
            return res[0].internalid
        }
    }
});
