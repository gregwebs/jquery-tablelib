/*
 * Copyright (c) 2008 Greg Weber greg at gregweber.info
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * jquery plugin for working with tables and table rows
 * create table objects and table row objects and use convenience methods
 * serialize objects to table rows and extract objects from table rows
 * support for saving object properties as row attributes
 * advanced querying of table rows
 *
 * documentation at http://gregweber.info/projects/tablelib
 *   also in the source
 *
 * plugin dependent on lib/iterator.js (included in tarball)
 */

// support both .table() interface and $.table(selector) interface
jQuery.fn.table = function(jq){
  if( this instanceof jQuery.fn.table ){
    this.$ = jq;
    return this;
  }
  return new jQuery.fn.table(this);
}
// $.table(selector) interface
jQuery.table = function(selector){
  return new jQuery.fn.table(jQuery(selector));
}

jQuery.fn.table.prototype = jQuery.fn.table.fn = {
  //$: null, // constructor fills this in!
  
  table: function(){return this},

  filter_query: function(obj, query ){
    for( var i in query ) {
      var qv = query[i], ov = obj[i];

      if(typeof(qv) == "function"){ if( isTrue(qv(ov)) ) return true }
      else if ( ov === qv ) return true;
    }
    return false;
  },

  // by default try to parse to a float
  // turn off by setting to false (or set your own parse function)
  parse: function(val){ var p = parseFloat(val); return isNaN(p) ? val :
    (p.toString() === val) // extra verification
      ? p : val },

  head_row: function(){
    return jQuery.headRow( this.$.find("thead > tr:last") );
  },

  titles: function(){ return jQuery.map( this.$.find("thead > tr:last > th"),
               function(th) { return jQuery(th).text() });
  },

  clear_rows: function(){ this.$.find("tbody").html( "" ); return this },

  column: function( columns, query ) {
    if( typeof(columns) == "string" ){
      var index = this.i(columns);
      return map( this.rows(query), function(row){
          return jQuery.row(row).at(index) });
    } else { //array
      var that = this;
      var indices = jQuery.map( columns, function(column) { return that.i(column) });
      return map( this.rows( query ), function(row) {
          return jQuery.row(row).at(indices) });
    }
  },

  // given a th name, return the index of the column
  i: function(text){
    var f = first( this.titles(), function(t,i){ if( t == text ) return i; } );
    if( isTrue(f) ) return f;
    throw("could not find column title: " + text );
  },

  // see objs documentation, but there is no fields parameter
  // returns jquery object of table body rows
  rows: function( query, attributes ){
    var that = this;
    if( !(query) || query === "all" ) {
      if( attributes ) {
        return this.$.find("tbody > tr").filter( function() {
          return that.filter_query( jQuery.row(this).attrs(), attributes );
        });
      }
      else return this.$.find("tbody > tr");
    }

    // convert each query field to a column index
    var titles = invert( this.titles() );
    query = rekey( query, function(val,key,i){ return titles[ key ]; });

    if( attributes ) {
      return this.$.find("tbody > tr").filter( function(){
        var row = $.row(this)
        if( that.filter_query( row.texts(), query ) ) return true;

        return that.filter_query( row.attrs(), attributes );
      });
    }

    return this.$.find("tbody > tr").filter( function(){
      return that.filter_query( jQuery.row(this).texts(), query )
    });
  },

  // two options passed as objects, 
  //   query for table data cells, query for row attributes
  // two minor options, both have two properties: query and fields
  // query is a filtering expression
  // fields is an array of keys that will be present in the returned objects
  // by default, no query is performed, all table data keys are present,
  //   and none of the row attributes are present
  // query can be abbreviated as q, fields as f
  // the fields value is an array
  // if no fields parameter is passed, there is no need to pass the query of fields keys
  // objs( {query : {k:v}, fields : [f]}, {query : {k:a}, fields : [a]}
  // objs( {q: {k:v}, f: [f]}, {q: {k:a}, f: [a]}
  // objs( {k:v}, {k:a} )
  // objs( "all", {k:a} )
  // if attributes are queried and there are no fields specified,
  //   by default all queried fields will become members of the object
  objs: function( query, attributes ){
    var parse_args = function( query ){
      var fields; var q;
      if( query && query != "all" ) {
        q = query.query || query.q
        fields = query.fields || query.f

        // not a query object, coincidental
        if( q && ( typeof(q) != "object" ) )
        { q = null }

        // not a field object, coincidental
        if( !(fields) || ( typeof(fields) != "object" ) )
        { fields = null }

        // did not decalre a query or fields parameter, default is a query
        if( !(fields) && !(q) )
        { q = query }
      }
      return { query : q, fields : fields }
    }
    var q_f = parse_args( query );
    var q = q_f.query;      var fields = q_f.fields;
    var a_f = parse_args( attributes )
    var aquery = a_f.query; var afields = a_f.fields;

    var ths_text = this.titles();
    if( fields ) {
      fields = map( fields, function( field ) {
        var i = jQuery.inArray( field, ths_text )
        return i === -1 ? null : { field : field, i : i }
      })
    } else {
      fields = map(ths_text, function(th,i){ return {field : th, i : i} })
    }

    var af;
    if( afields ) af = invert( afields, true );

    var that = this;
    return map( this.rows(q, aquery), function(row){ return jQuery.row( row )
        .to_object( { fields : fields, attributes : af, table : that } );
    })
  },

  object_to_html: function(obj, attribute_fields, titles){
    titles = titles || this.titles();
    var attrs = null;
    // turn array of fields into obj
    if( attribute_fields ) {
      attrs = {};
      jQuery.each( attribute_fields, function(i){
        attrs[ this ] = obj[ this ];
      });
    }

    return this.array_to_tr( jQuery.map( titles,
          function(text){ return obj[ text ] }), attrs )
  },

  // [""], {"":""} -> ""
  array_to_tr: function(arr, attributes){
    var tr = null;
    if( attributes ) {
      var at = [];
      for(key in attributes){ at.push(key + '="' + attributes[key]); }
      tr = '<tr ' + at.join('" ') + '">';
    }
    else { tr = "<tr>"; }

    if( arr.length === 0 ) return tr + "</tr>";
    return tr + "<td>" + arr.join("</td><td>") + "</td></tr>";
  },

  // objs : an array of objects
  // options.attributes : attributes to be saved, see save
  // options.clear : clear all existing rows before saving
  save: function( objects, options ) {
    var attributes, clear
    if( options ){
      attributes = options.attributes;
      if( typeof attributes == "string" ) attributes = [attributes]
      clear = options.clear;
    }
    if( objects.constructor != Array ) objects = [objects]
    var ths_text = this.titles();

    var that = this;
    if( clear ) this.clear_rows();
    this.$.find("tbody").append(
      jQuery.map( objects, function(obj){
        return that.object_to_html( obj, attributes, ths_text )
      }).join("")
    )
    return this;
  }
};

/* row() interface */
jQuery.fn.row = function(jq){
  if( this instanceof jQuery.fn.row ){
    this.$ = jq;
    return this;
  }
  return new jQuery.fn.row(this);
}
jQuery.fn.headRow = function(jq){
  if( this instanceof jQuery.fn.headRow ){
    this.$ = jq;
    return this;
  }
  return new jQuery.fn.headRow(this);
}

// type = td or th
// $ should be new jQuery object
jQuery.fn.row.genericRowProperties = function(type){
  this.row = function(){return this;}
  this.table = function(){return jQuery.table(this.$.parents('table:first').get(0))};

  this[type + "s"] = function(){
    var d = jQuery(this.$.children(type));
    d.row   = this;
    d.table = this.table;
    return d;
  }

  this.texts = function(){ return jQuery.map( this.$.children(type),
    function(td) { return jQuery(td).text() }) };

  // table is optional parameter to avoid Dom lookup of table
  this.td_helper = function(column, tds, table){
    switch( typeof(column) ) {
      case "string": return jQuery(tds[(table || this.table()).i(column)]);
      case "number": return jQuery(tds[column]);
      default      : throw( "invalid column type: " + typeof(column) );
    }
  }

  // table is optional parameter to avoid Dom lookup of table
  this[type] = function (columns, table) {
    var tds = this[ type + "s" ]();
    if( typeof(columns) != "object" ) return this.td_helper(columns, tds, table);

    var that = this;
    return jQuery.map( columns, function( column,i ) {
      return that.td_helper( column, tds, table ) });
  };

  // table is optional parameter to avoid Dom lookup of table
  this.at = function (column, table) {
    // one column
    if( typeof(column) != "object" ) return (this[type](column, table)).text();
    // multiple columns
    return map( this[type](column, table), function(td){ return td.text() });
  };

  // fields is an object with each attribute set to a true value
  this.attrs = function(fields, obj){
    var attrs = obj || {};
    var a_filter = function(i,attr){
      var v = attr.value;
      if( isTrue(v) ) { attrs[ attr.name ] = v; }
    }
    var a_filter_fields = function(i,attr){
      var v = attr.value;
      if( isTrue(v) ) {
        var n = attr.name;
        if( fields[n] ) { attrs[ n ] = v; }
      }
    }
    jQuery.each( this.$.get(0).attributes,
        ((fields && typeof(fields) === "object") ? a_filter_fields : a_filter));
    return attrs;
  }

  // options.parse = false  prevents trying to parse fields as floats
  // options.table is performance optimization if fields are not given
  // options.attributes - see row.attrs
  this.to_object = function( options ) { // fields, attributes, table, parse
    var obj = {}; // to be returned
    options = options || {};
    var table = options.table;
    var fields = options.fields || map( (table || this.table()).head_row().ths(),
        function(th,i){ return { field : jQuery(th).text(), i : i } } );
    var texts = this.texts();

    // convert the table text (probably to a number)
    var parse = options.parse || (table && table.parse);
    if( parse ){
      if( typeof( parse ) == "function" ) {
        jQuery.each( fields, function( i, fi ) {
          var field = fi.field;
          var text = texts[ fi.i ];
          obj[ field ] = parse(text);
        });
      }else{ //object
        jQuery.each( fields, function( i, fi ) {
          var field = fi.field;
          var transform = parse[ field ];
          var text = texts[ fi.i ];
          obj[ field ] = transform ? transform(text) : text;
        });
      }
    }else{
      jQuery.each( fields, function( i, fi ) {
        obj[ fi.field ] = texts[ fi.i ];
      });
    }

    if( options.attributes ) { this.attrs( options.attributes, obj ); }
    return obj;
  }

  // current_table optional performance enhancement
  this.transfer_to = function( table, current_table )
  {
    var obj = this.to_object( { table : current_table } );
    this.$.remove();
    table.save( obj );
    return table.$.find("tbody > tr:last");
  }
  return this;
};

jQuery.fn.row.prototype = jQuery.fn.row.fn =
  new jQuery.fn.row.genericRowProperties("td");
jQuery.fn.headRow.prototype = jQuery.fn.headRow.fn =
  new jQuery.fn.row.genericRowProperties("th");

jQuery.row = function(selector){
  return new jQuery.fn.row(jQuery(selector));
}
jQuery.headRow = function(selector){
  return new jQuery.fn.headRow(jQuery(selector));
}
