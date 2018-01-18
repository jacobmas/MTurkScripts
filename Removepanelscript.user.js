// ==UserScript==
// @name         Removepanelscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Kirk Deming
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        https://*s3.amazonaws.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var websiteData=document.getElementById("WebsiteDataCollection");
    var rows = websiteData.getElementsByClassName("row");
   rows[3].parentNode.removeChild(rows[3]);
   var toRemove = document.getElementsByClassName("panel-primary")[0];
    toRemove.parentNode.removeChild(toRemove);
    document.getElementById("helpful1").checked=true;
})();