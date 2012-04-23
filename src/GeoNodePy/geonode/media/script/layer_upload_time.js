Ext.onReady(function() {
    Ext.QuickTips.init(); 
    var precision = Ext.get('precision'), 
        format = Ext.get('format_input'),
        presentation = Ext.get('presentation');
    presentation.hide();
    precision.hide();
    if (format) format.hide();

    // time type selected - either by radio click or select
    function timeTypeSelected(select) {
        if (!Ext.get("notime").dom.checked) {
            if (! presentation.isVisible()) {
                presentation.fadeIn();
            }
        } else {
            presentation.hide();
        }
        Ext.select("#timeForm select").each(function(e,i) {
            if (e.dom != select) {
                e.dom.value = "";
            }
        });
        if (select && !select.value) {
            select.value = select.options[1].value;
        }
    }

    // show presentation section if needed and select first attribute
    Ext.get(Ext.query("input[name=timetype]")).on('click',function() {
        var select = Ext.fly(this).next('select');
        if (select) timeTypeSelected(select.dom);
    });

    // only show the precision section if needed
    Ext.get(Ext.query("input[name=presentation_strategy]")).on('click',function() {
        if (!Ext.query("input[value=LIST]")[0].checked) {
            if (!precision.isVisible()) {
                precision.fadeIn();
            }
        } else{
            precision.hide();
        }
    });

    // sync radio button selection with attribute selectors
    Ext.select("#id_text_attribute, #id_time_attribute, #id_year_attribute").on('change',function() {
        if (this.id == 'format_select') return;
        if (this.value != "") {
            Ext.get(this).parent(".formSection").first().dom.checked = true;
            timeTypeSelected(this);
        } else {
            Ext.get("notime").dom.click();
        }
    });

    // show custom format field if needed
    if (format) {
        Ext.get('format_select').on('change',function() {
            var input = Ext.get("id_text_attribute_format");
            if (this.getAttribute('value') == '0') {
                format.hide();
                input.dom.value = '';
            } else {
                format.fadeIn();
                input.focus();
            }
        });
    }
    
    function pollProgress(redirectTo) {
        var progress = Ext.MessageBox.progress("Please wait","Ingesting data");
        function poll() {
            Ext.Ajax.request({
                url : progressEndpoint,
                success: function(response) {
                    var state, msg;
                    response = Ext.decode(response.responseText);
                    // response will contain state, one of :
                    // PENDING, READY, RUNNING, NO_CRS, NO_BOUNDS, ERROR, COMPLETE
                    // though RUNNING, ERROR or COMPLETE are what we expect
                    // and possibly progress and total
                    if (response.state == 'COMPLETE') {
                        Ext.MessageBox.wait("Finishing Ingest...");
                        // don't just open a GET on the location, ensure a POST occurs
                        var form = Ext.get('timeForm').dom;
                        form.action = redirectTo;
                        form.submit();
                        return;
                    } else if ('progress' in response) {
                        msg = 'Ingested ' + response.progress + " of " + response.total;
                        progress.updateProgress( response.progress/response.total, msg );
                    } else {
                        switch (response.state) {
                            // give it a chance to start running or return complete
                            case 'PENDING': case 'RUNNING':
                                break;
                            case 'ERROR':
                                msg = 'message' in response ? response.message :
                                    "An unknown error occurred during the ingest."
                                Ext.MessageBox.show({
                                    icon : Ext.MessageBox.ERROR,
                                    msg : msg
                                });
                                return;
                            default:
                                Ext.MessageBox.show({
                                    icon : Ext.MessageBox.ERROR,
                                    msg : 'Expected a status other than ' + response.state
                                });
                                return;
                        }
                    }
                    setTimeout(poll,500);
                }
            });
        }
        poll();
    }
    
    if (progressEndpoint) {
        // AJAX submit form
        var form = Ext.get('timeForm'), extForm = new Ext.form.BasicForm(form);
        form.on('submit',function(ev) {
            ev.preventDefault();
            extForm.on('actioncomplete',function(form,xhrlike) {
                var resp = Ext.decode(xhrlike.response.responseText);
                pollProgress(resp.redirect_to);
            });
            extForm.on('actionfailed',function(form,xhrlike) {
                var msg = "result" in xhrlike ? 
                    xhrlike.result.errors.join("\n") : 
                    xhrlike.response.responseText;
                Ext.MessageBox.show({
                    icon : Ext.MessageBox.ERROR,
                    msg : msg
                });
            });
            extForm.submit();
        });
    }
});