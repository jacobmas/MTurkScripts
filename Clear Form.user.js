// ==UserScript==
// @name         Clear Form
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  clear form
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include https://*amazonaws.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var temp=document.getElementsByClassName("panel-primary")[0];
    temp.parentNode.removeChild(temp);
    //var feedback=document.getElementsByClassName("
    //document.getElementById("web_url").value="";
    var inps=document.getElementsByTagName("input");
    var i;
    for(i=0; i < inps.length; i++) {
        if(inps[i].type === "text" || inps[i].type==="url")
            inps[i].value="";
    }
})();
