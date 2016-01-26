/*global define, numeral*/
define(['jquery',
        'loglevel',
        'handlebars',
        'text!faostat_ui_table/html/templates.hbs',
        'underscore',
        'bootstrap',
        'amplify',
        'numeral'], function ($, log, Handlebars, templates, _) {

    'use strict';

    function TABLE() {

        this.CONFIG = {

            placeholder_id: 'faostat_ui_table',
            data: null,
            metadata: null,
            show_codes: true,
            show_units: true,
            show_flags: true,
            decimal_places: 2,
            decimal_separator: '.',
            thousand_separator: ',',
            page_size: 25,
            current_page: 1,
            onPageClick: function () {
                /* Restore the "config" argument of the function. */
            }

        };

    }

    TABLE.prototype.init = function (config) {

        //log.info("TABLE.init; config", config)

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Sort metadata. */
        this.CONFIG.metadata.dsd = _.sortBy(this.CONFIG.metadata.dsd, function (o) {
            return parseInt(o.index, 10);
        });

        /* Render. */
        this.render();

    };

    TABLE.prototype.render = function () {

        /* Variables. */
        var source,
            template,
            dynamic_data,
            html,
            rows = [],
            headers = [],
            row,
            i,
            j,
            formatter = '',
            pages_number,
            that = this;

        /* Prepare the value formatter. */
        numeral.language('faostat', {
            delimiters: {
                thousands: this.CONFIG.thousand_separator,
                decimal: this.CONFIG.decimal_separator
            }
        });
        numeral.language('faostat');
        formatter = '0' + this.CONFIG.thousand_separator + '0' + this.CONFIG.decimal_separator;
        for (i = 0; i < this.CONFIG.decimal_places; i += 1) {
            formatter += '0';
        }

        /* Process headers. */
        for (j = 0; j < this.CONFIG.metadata.dsd.length; j += 1) {
            if (this.CONFIG.metadata.dsd[j].type === 'code') {
                headers.push({
                    label: this.CONFIG.metadata.dsd[j].label,
                    type: this.CONFIG.metadata.dsd[j].type,
                    show: this.CONFIG.show_codes
                });
            } else if (this.CONFIG.metadata.dsd[j].type === 'flag') {
                headers.push({
                    label: this.CONFIG.metadata.dsd[j].label,
                    type: this.CONFIG.metadata.dsd[j].type,
                    show: this.CONFIG.show_flags
                });
            } else if (this.CONFIG.metadata.dsd[j].type === 'flag_label') {
                headers.push({
                    label: this.CONFIG.metadata.dsd[j].label,
                    type: this.CONFIG.metadata.dsd[j].type,
                    show: this.CONFIG.show_flags
                });

            } else if (this.CONFIG.metadata.dsd[j].type === 'unit') {
                headers.push({
                    label: this.CONFIG.metadata.dsd[j].label,
                    type: this.CONFIG.metadata.dsd[j].type,
                    show: this.CONFIG.show_units
                });
            } else {
                headers.push({
                    label: this.CONFIG.metadata.dsd[j].label,
                    type: this.CONFIG.metadata.dsd[j].type,
                    show: true
                });
            }
        }

        /* Process data. */
        for (i = 0; i < this.CONFIG.data.length; i += 1) {
            row = {};
            row.cells = [];
            for (j = 0; j < this.CONFIG.metadata.dsd.length; j += 1) {
                if (this.CONFIG.metadata.dsd[j].type === 'value') {
                    if (this.CONFIG.data[i][this.CONFIG.metadata.dsd[j].key] === undefined) {
                        row.cells.push({
                            label: undefined,
                            type: this.CONFIG.metadata.dsd[j].type,
                            show: true
                        });
                    } else {
                        row.cells.push({
                            label: numeral(this.CONFIG.data[i][this.CONFIG.metadata.dsd[j].key]).format(formatter),
                            type: this.CONFIG.metadata.dsd[j].type,
                            show: true
                        });
                    }
                } else if (this.CONFIG.metadata.dsd[j].type === 'code') {
                    row.cells.push({
                        label: this.CONFIG.data[i][this.CONFIG.metadata.dsd[j].key],
                        type: this.CONFIG.metadata.dsd[j].type,
                        show: this.CONFIG.show_codes
                    });

                } else if (this.CONFIG.metadata.dsd[j].type === 'unit') {
                    row.cells.push({
                        label: this.CONFIG.data[i][this.CONFIG.metadata.dsd[j].key],
                        type: this.CONFIG.metadata.dsd[j].type,
                        show: this.CONFIG.show_units
                    });

                } else if (this.CONFIG.metadata.dsd[j].type === 'flag') {
                    row.cells.push({
                        label: this.CONFIG.data[i][this.CONFIG.metadata.dsd[j].key],
                        type: this.CONFIG.metadata.dsd[j].type,
                        show: this.CONFIG.show_flags
                    });

                } else if (this.CONFIG.metadata.dsd[j].type === 'flag_label') {
                    row.cells.push({
                        label: this.CONFIG.data[i][this.CONFIG.metadata.dsd[j].key],
                        type: this.CONFIG.metadata.dsd[j].type,
                        show: this.CONFIG.show_flags
                    });

                } else {
                    row.cells.push({
                        label: this.CONFIG.data[i][this.CONFIG.metadata.dsd[j].key],
                        type: this.CONFIG.metadata.dsd[j].type,
                        show: true
                    });
                }
            }
            rows.push(row);
        }

        //log.info('TABLE.render; rows', rows)

        /* Create pager. */
        this.CONFIG.total_pages = parseInt(this.CONFIG.data[0].NoRecords / this.CONFIG.page_size, 10);
        if (this.CONFIG.data[0].NoRecords % this.CONFIG.page_size !== 0) {
            this.CONFIG.total_pages += 1;
        }

        /* Load main structure. */
        source = $(templates).filter('#faostat_ui_table_structure').html();
        template = Handlebars.compile(source);
        dynamic_data = {
            headers: headers,
            rows: rows,
            current_page: this.CONFIG.current_page,
            total_pages: this.CONFIG.total_pages
        };
        html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Add click listener. */
        $('.next_page_button').off().click(function () {
            that.CONFIG.current_page += 1;
            if (that.CONFIG.current_page > that.CONFIG.total_pages) {
                that.CONFIG.current_page = that.CONFIG.total_pages;
            }
            that.onPageClick();
        });
        $('.previous_page_button').off().click(function () {
            that.CONFIG.current_page -= 1;
            if (that.CONFIG.current_page < 1) {
                that.CONFIG.current_page = 1;
            }
            that.onPageClick();
        });
        $('.first_page_button').off().click(function () {
            that.CONFIG.current_page = 1;
            that.onPageClick();
        });
        $('.last_page_button').off().click(function () {
            that.CONFIG.current_page = that.CONFIG.total_pages;
            that.onPageClick();
        });

    };

    TABLE.prototype.onPageClick = function () {
        var that = this;
        $('#current_page').html(that.CONFIG.current_page);
        this.CONFIG.onPageClick({
            page_number: that.CONFIG.current_page
        });
    };

    TABLE.prototype.dispose = function () {
        $('.next_page_button').off();
        $('.last_page_button').off();
        $('.first_page_button').off();
        $('.previous_page_button').off();
    };

    return TABLE;

});