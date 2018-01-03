// ==UserScript==
// @name         Bobscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds N/A to all form elements in the iframe on MTurk
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var the_inputs=document.getElementsByClassName('form-control');
    for(var i=0; i < the_inputs.length; i++)
    {
//        console.log("the_inputs[\""+curr_var+"\"]="+the_inputs[curr_var]);
        the_inputs[i].value="N/A";
    }
       // console.log(document.readyState);

//    document.onreadystatechange=function() {
  //      function iframeRef( frameRef ) {
    //        return frameRef.contentWindow  ? frameRef.contentWindow.document : frameRef.contentDocument;
 //       }

        //var inside = iframeRef( document.getElementsByClassName('embed-responsive-item')[0] );
    // Your code here...

       // var inside = document.getElementById('mturk_form');
      //  var the_inputs=inside.getElementsByClassName('form-control');
    //var the_inputs=the_form.getElementsByTagName('input');

//    console.log("docs="+JSON.stringify(docs));
    //    for(var curr_var in the_inputs)
     //   {
         //   console.log("the_inputs[\""+curr_var+"\"]="+the_inputs[curr_var]);
      //  }
//    console.log("\ndocs[\"parentNode\"]="+docs.parentNode.id);

//    };
})();