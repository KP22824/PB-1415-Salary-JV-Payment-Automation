/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function(serverWidget) {
    function beforeLoad(context) {
        // Only execute for forms (not for views or other contexts)
        if (context.type == context.UserEventType.EDIT && context.type == context.UserEventType.CREATE) {
            return;
        }

        var form = context.form;
        var record = context.newRecord;
        
        // Get the checkbox field value
        var showField = record.getValue({
            fieldId: 'custbody_salary_jv_processed' // Replace with your checkbox field ID
        });

      log.debug("showField", showField)
        
        // If checkbox is unchecked (false), hide the list field
        if (!showField) {
            var listField = form.getField({
                id: 'custbody_processed_jv' // Replace with your list field ID
            });

          log.debug("listfield", listField)
            
            if (listField) {
                listField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});