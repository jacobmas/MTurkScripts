// ==UserScript==
// @name         KirkDemingScript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Kirk Deming
// @author       You
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var webData = document.getElementById("WebsiteDataCollection");
    var rows = webData.getElementsByClassName("row");

    var row1= rows[1];
    var row2=rows[2];

    var well2=row2.getElementsByClassName("well");
    var url1=row1.getElementsByClassName("well")[0];
    console.log("url1"+url1);
    if(url1.children[0] !== null)
    {
        document.getElementsByName("website_url")[0].value=url1.children[0].innerHTML;
    }
    if(well2[0].children[0] !== null)
    {
        document.getElementsByName("website_url2")[0].value=well2[0].children[0].innerHTML;
    }
    if(well2[1].children[0] !== null)
    {
        document.getElementsByName("Name")[0].value=well2[1].children[0].innerHTML;
    }
    if(well2[2].children[0] !== null)
    {
        document.getElementsByName("Street")[0].value=well2[2].children[0].innerHTML;
    }
        if(well2[3].children[0] !== null)
    {
        document.getElementsByName("City")[0].value=well2[3].children[0].innerHTML;
    }
        if(well2[4].children[0] !== null)
    {
        document.getElementsByName("State")[0].value=well2[4].children[0].innerHTML;
    }
        if(well2[5].children[0] !== null)
    {
        document.getElementsByName("ZIP")[0].value=well2[5].children[0].innerHTML;
    }
    // Your code here...
    row1.parentNode.removeChild(row1);
    var i;
    var the_lab;
    var the_well;
    for(i=0; i < 6; i++)
    {
        the_lab=row2.getElementsByTagName("label")[0];
        the_well=row2.getElementsByClassName("well")[0];
        the_lab.parentNode.removeChild(the_lab);
        the_well.parentNode.removeChild(the_well);
    }
})();