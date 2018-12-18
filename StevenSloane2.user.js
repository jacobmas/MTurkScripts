// ==UserScript==
// @name         StevenSloane2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Karen Veltri tasks by allowing efficient copy/paste from Linkedin with Linkedinscript
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include        http://*.linkedin.com/*
// @include        https://*.linkedin.com/*
// @grant        GM_setClipboard
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// ==/UserScript==

(function() {
    'use strict';
    var profile_var={};
    function insertValues()
    {
        var x;
        var profile_var=JSON.parse(GM_getValue("profile_var"));
        for(x in profile_var) {   
            document.getElementsByName(x)[0].value=profile_var[x];
        }


    }

    function get_Exp() {
        var expSec=document.getElementsByClassName("experience-section");
        if(expSec===null || expSec.length<=0 ) {
            return; }
        expSec=expSec[0];
        var loadButton=expSec.getElementsByClassName("pv-profile-section__see-more-inline");

        var expProfiles=expSec.getElementsByTagName("li");//ClassName("pv-profile-section__card-item");
        var i,l;

        var num_needed;
        var i_len;


        //compnameXX, roleXX, startYearEXX, endYearEXX, locationXX
        i_len = expProfiles.length > 4 ? 4 : expProfiles.length;

        var expMax = expProfiles.length > 10 ? 10 : expProfiles.length;
        var i_count=0;
        var i_str="";
        for(i=0; i < expMax; i++) {

            /*if(i_count<9) i_str="0"+(i_count+1).toString();
            else i_str=(i_count+1).toString();*/
            i_str=(i_count+1).toString();

            if(expProfiles[i].className.match("artdeco") !== null) {
                continue; }
            else {
                i_count+=1;
            }
            var sum_info=expProfiles[i].getElementsByClassName("pv-entity__summary-info")[0];
            var h3=sum_info.getElementsByTagName("h3");
            var secondary=sum_info.getElementsByClassName("pv-entity__secondary-title");
            var dateRange=sum_info.getElementsByClassName("pv-entity__date-range");
            var locationStr=sum_info.getElementsByClassName("pv-entity__location");
            var startDate="", endDate="";
            var dates;
            var date_sep=" – ";
            if(h3 !== null && h3.length>0)                 profile_var['p'+i_str]=h3[0].innerText;
            else profile_var['role'+i_str]="";
            if(secondary !== null && secondary.length>0) profile_var['c'+i_str]=secondary[0].innerText;
            else profile_var['compname'+i_str]="";
            if(dateRange != null && dateRange.length>0) {
                dates=dateRange[0].innerText.substr(14).split("–");
                console.log("dates="+dates);
               /* dates=dateRange[0].innerText.match(/\d{4}/g);*/
                if(dates!==null && dates.length>0) startDate=dates[0].trim();
                if(dates!=null && dates.length>1) endDate=dates[1].trim();
            }
            profile_var['s'+i_str]=startDate;
            profile_var['e'+i_str]=endDate;
            /*if(locationStr !== null && locationStr.length>0) profile_var['location'+i_str]=locationStr[0].innerText.substr(8);
            else profile_var['location'+i_str]="";*/




        }

    }


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var i;
        var loc2,loc3,loc4,loc7;
var panel_prim=document.getElementsByClassName("panel-primary")[0];
    panel_prim.parentNode.removeChild(panel_prim);

       var rows=document.getElementsByClassName("row");
        var wells=rows[1].getElementsByClassName("well");

        var the_str=wells[0].innerText.substr(6);
        GM_setClipboard(the_str);
        console.log(the_str);
        /*var url=document.getElementsByClassName("dont-break-out")[0].innerText;
        GM_setClipboard(url);
        GM_setValue("url",url);*/
        GM_addValueChangeListener("profile_var", function() {
            insertValues();
           document.getElementById("submitButton").click();


        });
        document.getElementsByName("p1")[0].addEventListener("click", function()
                                                             {
            insertValues();
           //document.getElementById("submitButton").click();
        });
    }
    else if(window.location.href.indexOf("linkedin.com") !== -1){
       /* GM_addValueChangeListener("url", function() {
            var new_url=GM_getValue("url");
            window.location.replace(new_url);
        });*/


        /* Load the script on pressing 'v', run by clicking in the Experience section */
        window.addEventListener("keydown",function(e) {
            if(e.key !== "c") {
                return;
            }
            console.log("LOADING, e.key="+e.key+"\n");
            get_Exp();

          //  console.log(JSON.stringify(profile_var));
            /* Set the profile var */
            GM_setValue("profile_var", JSON.stringify(profile_var));


        });
    }




})();