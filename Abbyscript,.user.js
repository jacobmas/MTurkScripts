
// ==UserScript==
// @name         Abbyscript,
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Abby
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var name_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split(" ");
        var last_val=this.id.substr(this.id.length-1);
        document.getElementById("fname_"+last_val).value=split_str[0];
        document.getElementById("lname_"+last_val).value=split_str[1];

    };

    var i;
    for(i=1; i<=8; i++) {
  //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
        if(document.getElementById("fname_"+i) !== null)
        {
            document.getElementById("fname_"+i).addEventListener("paste",name_paste_func);
        }

    }


})();