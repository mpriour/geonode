/*global $:true  */
'use strict';

var log = console.log;

var STATUS = (function () {
    var initialize,
        app = $('#application'),
        UploadSession,
        format_session_tr,
        format_header,
        get_session,
        wrap_value,
        handle_edit,
        load_sessions;
    /**
     *
     */
    UploadSession = function (options) {
        this.name = options.name;
        this.state = options.state;
        this.url = options.url;
        this.date = options.date;
    };

    UploadSession.prototype.display = function () {
    };

    get_session = function (element) {
        var tr = $(element).parent().parent();
        return tr.data('session');
    };

    wrap_value = function (value) {
        var td = $('<td/>');

        if (typeof value === 'object') {
            value.appendTo(td);
        } else {
            $('<p/>', {text: value}).appendTo(td);
        }
        return td;
    };


    handle_edit = function (event) {
        var target = $(event.target),
            session = target.data('session');
        log(session);
    };

    format_session_tr = function (session) {
        var tr = $('<tr />'),
            input,
            name,
            div,
            a;
        tr.data('session', session);
        input = $('<input/>', {type: 'checkbox'});
        wrap_value(input).appendTo(tr);

        a = $('<a/>', {text: 'Edit'});
        a.on('click', handle_edit);
        if (session.url) {
            wrap_value($('<a/>', {text: session.layer_name, href: session.url}))
                .appendTo(tr);
        } else {
            wrap_value(session.layer_name).appendTo(tr);
        }
        wrap_value(a).appendTo(tr);
        wrap_value(session.date).appendTo(tr);
        wrap_value(session.state).appendTo(tr);
        return tr;
    };

    load_sessions = function (url) {
        var tbody = $('#session-table').find('tbody').first();
        tbody.empty();

        $.ajax({url: url}).done(function (sessions) {
            $.each(sessions, function (idx, s) {
                format_session_tr(s).appendTo(tbody);
            });
        });
    };


    initialize = function (options) {
        var delete_sessions,
            set_permissions;

        delete_sessions = function (event) {
            var table = $(options.table_selector),
                sessions,
                inputs = table.find('input:checkbox:checked');
            sessions = _.map(inputs, function(input) { return get_session(input)});
            log(sessions);
        };

        set_permissions = function (event) {
            log(event);
        };


        load_sessions(options.status_url);

        $(options.delete_selector).on('click', delete_sessions);
        $(options.permission_selector).on('click', set_permissions);
    };

    return {
        initialize: initialize
    };

}());