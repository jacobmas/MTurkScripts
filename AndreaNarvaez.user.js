// ==UserScript==
// @name         AndreaNarvaez
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var inputs=document.getElementsByTagName("input");
    var i;
    for(i=0; i < inputs.length; i++)
    {
        if(inputs[i].type==='text' || inputs[i].type==='email')
        {
            inputs[i].value="";
        }
    }

    var tabl=document.getElementsByClassName("table")[0];
    var search_str=tabl.rows[2].cells[1].innerText+" "+tabl.rows[3].cells[1].innerText+" "+tabl.rows[0].cells[1].innerText+" email";

    GM_setClipboard(search_str);
})();