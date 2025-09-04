/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/redirect'],
    (ui, search, runtime, redirect) => {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                let form = ui.createForm({ title: 'Task Monitor' });

                // Add Refresh button
                form.addSubmitButton({ label: 'Refresh' });

                // ======================
                // Sublist 1: Active Tasks
                // ======================
                let sublist = form.addSublist({
                    id: 'custpage_task_list',
                    type: ui.SublistType.LIST,
                    label: 'Running/Scheduled Tasks'
                });

                sublist.addField({ id: 'custpage_taskid', type: ui.FieldType.TEXT, label: 'Task ID' });
                sublist.addField({ id: 'custpage_startdate', type: ui.FieldType.TEXT, label: 'Start Date' });
                sublist.addField({ id: 'custpage_status', type: ui.FieldType.TEXT, label: 'Status' });
                sublist.addField({ id: 'custpage_percentcomplete', type: ui.FieldType.TEXT, label: 'Percent Complete' });
                sublist.addField({ id: 'custpage_queue', type: ui.FieldType.TEXT, label: 'Queue' });
                sublist.addField({ id: 'custpage_processorpool', type: ui.FieldType.TEXT, label: 'Processor Pool' });

                let activeTaskSearch = search.create({
                    type: search.Type.SCHEDULED_SCRIPT_INSTANCE,
                    filters: [
                        ['status', 'anyof', ['PENDING', 'PROCESSING', 'QUEUED', 'RETRY', 'PAUSED']],
                        "AND",
                        [
                            ["script.scriptid", "is", "customscript_sjv_bp_rec"],
                            "OR",
                            ["script.scriptid", "is", "customscript_sjv_update_value"]
                        ]
                    ],
                    columns: [
                        'taskid', 'startdate', 'status', 'percentcomplete', 'queue', 'processorpool'
                    ]
                });

                let i = 0;
                activeTaskSearch.run().each(result => {
                    sublist.setSublistValue({ id: 'custpage_taskid', line: i, value: result.getValue('taskid') || '-' });
                    sublist.setSublistValue({ id: 'custpage_startdate', line: i, value: result.getValue('startdate') || '-' });
                    sublist.setSublistValue({ id: 'custpage_status', line: i, value: result.getText('status') || '-' });
                    sublist.setSublistValue({ id: 'custpage_percentcomplete', line: i, value: result.getValue('percentcomplete') ? result.getValue('percentcomplete') + '%' : '-' });
                    sublist.setSublistValue({ id: 'custpage_queue', line: i, value: result.getValue('queue') || '-' });
                    sublist.setSublistValue({ id: 'custpage_processorpool', line: i, value: result.getValue('processorpool') || '-' });
                    i++;
                    return true;
                });

                // ======================
                // Sublist 2: Error Logs (Server Logs)
                // ======================
                let errorSublist = form.addSublist({
                    id: 'custpage_error_list',
                    type: ui.SublistType.LIST,
                    label: 'Error Logs'
                });

              
                errorSublist.addField({ id: 'custpage_err_title', type: ui.FieldType.TEXT, label: 'Title' });
                errorSublist.addField({ id: 'custpage_err_type', type: ui.FieldType.TEXT, label: 'Type' });
                errorSublist.addField({ id: 'custpage_err_date', type: ui.FieldType.TEXT, label: 'Date' });
                errorSublist.addField({ id: 'custpage_err_time', type: ui.FieldType.TEXT, label: 'Time' });
                errorSublist.addField({ id: 'custpage_err_user', type: ui.FieldType.TEXT, label: 'User' });
                errorSublist.addField({ id: 'custpage_err_scripttype', type: ui.FieldType.TEXT, label: 'Script Type' });
                errorSublist.addField({ id: 'custpage_err_details', type: ui.FieldType.TEXT, label: 'Details' });

                let errorLogSearch = search.create({
                    type: "scriptexecutionlog",
                    filters: [
                        ['type', 'anyof', 'ERROR'],
                        "AND",
                        [
                            ["script.scriptid", "is", "customscript_sjv_bp_rec"],
                            "OR",
                            ["script.scriptid", "is", "customscript_sjv_update_value"]
                        ]
                    ],
                    columns: [
                       
                        search.createColumn({ name: "title", label: "Title" }),
                        search.createColumn({ name: "type", label: "Type" }),
                        search.createColumn({ name: "date", label: "Date", sort: search.Sort.DESC }),
                        search.createColumn({ name: "time", label: "Time" }),
                        search.createColumn({ name: "user", label: "User" }),
                        search.createColumn({ name: "scripttype", label: "Script Type" }),
                        search.createColumn({ name: "detail", label: "Details" })
                    ]
                });

                let j = 0;
                errorLogSearch.run().each(result => {
                    
                    if (result.getValue('title')) errorSublist.setSublistValue({ id: 'custpage_err_title', line: j, value: result.getValue('title') });
                    if (result.getText('type')) errorSublist.setSublistValue({ id: 'custpage_err_type', line: j, value: result.getText('type') });
                    if (result.getValue('date')) errorSublist.setSublistValue({ id: 'custpage_err_date', line: j, value: result.getValue('date') });
                    if (result.getValue('time')) errorSublist.setSublistValue({ id: 'custpage_err_time', line: j, value: result.getValue('time') });
                    if (result.getText('user')) errorSublist.setSublistValue({ id: 'custpage_err_user', line: j, value: result.getText('user') });
                    if (result.getText('scripttype')) errorSublist.setSublistValue({ id: 'custpage_err_scripttype', line: j, value: result.getText('scripttype') });
                    
                    // Fix: Truncate the detail text to 300 characters to avoid field length limit
                    if (result.getValue('detail')) {
                        let detailText = result.getValue('detail') || '';
                        // Truncate to 300 characters and add ellipsis if truncated
                        if (detailText.length > 300) {
                            detailText = detailText.substring(0, 297) + '...';
                        }
                        errorSublist.setSublistValue({ id: 'custpage_err_details', line: j, value: detailText });
                    }
                    j++;
                    return true;
                });

                context.response.writePage(form);

            } else {
                // Refresh = just reload Suitelet
                redirect.toSuitelet({
                    scriptId: runtime.getCurrentScript().id,
                    deploymentId: runtime.getCurrentScript().deploymentId
                });
            }
        }

        return { onRequest };
    });