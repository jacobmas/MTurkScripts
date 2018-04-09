
// ==UserScript==
// @name         Alicia Weinstock
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up StriveScan
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function panel_fix(start_collapsed)
    {
        let panel_primary=document.getElementsByClassName("panel-primary")[0];
        var panel_heading=document.getElementsByClassName("panel-heading")[0];
        var panel_body=document.getElementsByClassName("panel-body")[0];

        var heading_text=panel_heading.firstChild.innerText;
        panel_heading.firstChild.innerText=panel_heading.firstChild.innerText+" (click to expand)";

        panel_heading.addEventListener("click", function() {
            if(panel_body.style.display!==undefined && panel_body.style.display==="none")
            {
                panel_body.style.display="";
                panel_heading.firstChild.innerText=panel_heading.firstChild.innerText.replace("click to expand","click to collapse");
            }
            else
            {
                panel_body.style.display="none";
                panel_heading.firstChild.innerText=panel_heading.firstChild.innerText.replace("click to expand","click to expand");
            }

        });
        if(start_collapsed) panel_heading.click();
    }
    panel_fix(true);
    let panel_primary=document.getElementsByClassName("panel-primary")[0];

    var button_div=document.createElement("div");
    button_div.style="margin: 5px 5px 5px 5px;";
    var fill_button=document.createElement("input");
    fill_button.type="button";
    fill_button.value="Fill";
    button_div.appendChild(fill_button);
    panel_primary.parentNode.insertBefore(button_div,panel_primary.nextSibling);
    fill_button.onclick=function() {
        var inps=document.getElementsByTagName("input");
        var rad_count=0;
        var i;
        for(i=0; i < inps.length; i++)
        {
            if(inps[i].type==="radio")
            {
                if(rad_count===1 || rad_count===3 || rad_count===7 || rad_count===9 || rad_count===12) inps[i].checked=true;
                rad_count++;
            }
        }
    };




})();