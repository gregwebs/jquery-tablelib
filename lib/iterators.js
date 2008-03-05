// 0 and empty strings are false in javascript - correct this
function isNil(val){ val === null || val === undefined }
function notNil(val){ return val !== null && val !== undefined }
function isFalse(val){ val === false || val === null || val === undefined }
function isTrue(val){ return val === true || val !== false && val !== null && val !== undefined }

// [a] (a,a,i,i+1 ->) -> [a]
// [a] (a,a,i,i+1 ->) (a,i ->) -> [a]
var each_two = function( arr, fn, leftover_fn ){
  var last_i = arr.length - 1;

  for(i=0; i < last_i; i+=2)
  { fn(arr[i], arr[i+1], i, i+1); }

  if( i === last_i )
  { if( leftover_fn === undefined ) fn(arr[i]); else leftover_fn(arr[i],i); }
  return arr;
}

// [a] a (a -> a) -> a
function foldl( arr, acc, folder_fn ){
  for(var i=0; i < arr.length; i++){
    acc = folder_fn( acc, arr[i] );
  }
  return acc;
}

// [number] -> number
function sum( arr ) { return foldl( arr, 0, function(acc,x){ return acc + x } ) }

// map with null values filtered out, throws on undefined
// [a] (a,i -> b) -> [b]
function map( arr, fn ){
  var result = [];
  for(var i=0; i < arr.length; i++) {
    var maybe = fn(arr[i], i);
    if( maybe === undefined ) throw("map callback returned undefined");
    if( maybe !== null ) result.push( maybe );
  }
  return result;
}

// [a] (a,i ->) -> [a]
function each( arr, fn ){
  for(var i=0,len=arr.length; i < len; i++) { fn(arr[i], i); }
  return arr;
}

// filter throws on undefined or null
// [a] (a,i -> false||not false) -> [a]
function filter( arr, fn ){
  var result = [];
  for(var i=0; i < arr.length; i++) {
    var maybe = fn(arr[i], i);
    if( maybe === undefined || maybe === null)
      throw("map callback returned undefined");
    if( maybe !== false )
      result.push( maybe );
  }
  return result;
}

// one_based useful for avoiding zero since it evaluates to false
// [val] -> {val : index}
// [val] Boolean -> {val : index + 1}
function invert( arr, one_based ){
  var i=0, len = arr.length, obj = {};
  if( one_based ) for(; i < len; i++){ obj[ arr[i] ] = (i+1); }
  else            for(; i < len; i++){ obj[ arr[i] ] = i; }
  return obj;
}

// O(n)
function obj_length( obj ){
  var i = 0;
  for(var k in obj) i++
  return i;
}

// creates new object
// {k:v} [k] -> {k:v}
function reorder( obj, keys ){
  var o = {};
  each( keys, function(key,i){
    var val = obj[key];
    if( isNil(val) ) throw("could not find value for given key: " + key);
    o[key] = val;
  });
  return o;
}

// {k:v} (k,v,i -> a) -> {k:a||v}
function revalue( obj, fn ){
  obj_each( obj, function(value,key,i){
    var maybe = fn( value, key, i );
    if( notNil( maybe ) ) obj[key] = maybe;
  });
  return obj;
}

// {k:v} (k,v,i -> a) -> {a||k:v}
function rekey( old_obj, fn ){
  new_obj = {}
  var i=0;
  for(key in old_obj) {
    var value = old_obj[key]
    var maybe = fn( value, key, i );
    if( notNil( maybe ) ){
      new_obj[maybe] = value;
    }
    i++;
  };
  return new_obj;
}

// a callback return of false breaks the iteration
// {k:v} (v,k,i) -> {k:v}
function obj_each( obj, fn ){
  var i = 0;
  for(key in obj) {
    if( false === fn( obj[key], key, i ) ) return obj;
    i++;
  }
  return obj
}

// [a] (a,i -> b) -> b || false
var first = function(arr, fn){
  for(var i=0, len=arr.length; i < len; i++){
    var res = fn(arr[i], i);
    if( res === true || res !== false && res !== null && res !== undefined )
      return res;
  }
  return false;
}

// arr must have odd num of elements
// move towards bottom half first
// [1,2,3] -> 2,3,1
// [1,2,3,4] -> 3,2,4,1
function each_from_middle( arr, fn ){
  var len = arr.length;
  if( len === 0 ) return arr;
  var increment = 0, i = 0;

  function move(){
    if( fn(arr[i],i) === false ) return false;
    increment++;
    return true;
  }
  function move_up(){
    if( i < 0 || !move() ) return true;
    i += increment;
  }
  function move_down(){
    if( i >= len || !move() ) return true;
    i -= increment;
  }
  if( len % 2 === 0 ) {
    i = (len / 2);
    while(true) { if( move_down() || move_up() ) break; }
  }
  else {
    i = (len / 2 - 0.5);
    while(true) { if( move_up() || move_down() ) break; }
  }
  return arr;
}
