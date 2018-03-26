// ==UserScript==
// @name         SteffanoBenigni
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
            var xprime=x;
            if(x.indexOf("location")==0 && x.length>=10 &&

              (x.substr(8,2)==='02'||x.substr(8,2)==='03'||x.substr(8,2)==='04'||x.substr(8,2)==='07'))
            {
                xprime=x.substr(0,8)+x.substr(9,1);
            }
            console.log("x="+x);
            document.getElementById(xprime).value=profile_var[x];
        }


    }
    function get_Name() {
        var fullName=document.getElementsByClassName("pv-top-card-section__name");
        if(fullName!==null && fullName.length>0) profile_var.fullName=fullName[0].innerText;
        else profile_var.fullName="";
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
        var i_count=0;
        var i_str="";
        for(i=0; i < expProfiles.length; i++) {
            if(i_count<9) i_str="0"+(i_count+1).toString();
            else i_str=(i_count+1).toString();
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
            if(h3 !== null && h3.length>0)                 profile_var['role'+i_str]=h3[0].innerText;
            else profile_var['role'+i_str]="";
            if(secondary !== null && secondary.length>0) profile_var['compname'+i_str]=secondary[0].innerText;
            else profile_var['compname'+i_str]="";
            if(dateRange != null && dateRange.length>0) {
                dates=dateRange[0].innerText.match(/\d{4}/g);
                if(dates!==null && dates.length>0) startDate=dates[0];
                if(dates!=null && dates.length>1) endDate=dates[1];
            }
            profile_var['startYearE'+i_str]=startDate;
            profile_var['endYearE'+i_str]=endDate;
            if(locationStr !== null && locationStr.length>0) profile_var['location'+i_str]=locationStr[0].innerText.substr(8);
            else profile_var['location'+i_str]="";




        }

    }
    function findlastyear(to_find)
    {
        var my_re=/\d{4}/g;
        var the_matches=to_find.match(my_re);
        if(the_matches!==null) return (the_matches[the_matches.length-1]);
        return "";
    }
    function findfirstyear(to_find)
    {
        var my_re=/\d{4}/g;
        var the_matches=to_find.match(my_re);
        if(the_matches!==null && the_matches.length>1) return the_matches[0];
        return "";
    }
    function get_Ed() {

        var edMax=4;
        var edSec= document.getElementsByClassName("education-section");
        if(edSec === null || edSec.length<=0) return;
        edSec=edSec[0];
        var edProfiles=edSec.getElementsByTagName("li");//ClassName("pv-profile-section__card-item");
        var i,j,k,l;

        var i_count=0;
        var i_str="";
        console.log("edProfiles.length="+edProfiles.length);
        edMax=edProfiles.length>4 ? 4 : edProfiles.length;
        for(i=0; i < edMax; i++)  {
            if(i_count<9) i_str="0"+(i_count+1).toString();
            else i_str=(i_count+1).toString();
            /* universityXX, degreeXX, startYearUXX, endYearUXX */
            if(edProfiles[i].className.match("artdeco") !== null) continue;
            else i_count+=1;

            var school_name=edProfiles[i].getElementsByClassName("pv-entity__school-name")[0].innerText;
            profile_var['university'+i_str]=school_name;
            var sum_info=edProfiles[i].getElementsByClassName("pv-entity__summary-info")[0];
            var times,last_time;
            var start_year="", end_year="";
            console.log("sum_info="+sum_info.innerText);
            var degree_comma_item=sum_info.getElementsByClassName("pv-entity__degree-name");
            var degree_fos=sum_info.getElementsByClassName("pv-entity__fos");
            if(degree_comma_item !== null && degree_comma_item.length != null && degree_comma_item.length>0)
                degree_comma_item = degree_comma_item[0].innerText.substr(11);
            else
                degree_comma_item="";
            if(degree_fos !== null && degree_fos.length != null && degree_fos.length>0)
            {
                degree_fos=degree_fos[0].innerText.substr(14);
            }
            else
            {
                degree_fos="";
            }
            console.log("degree_comma_item="+degree_comma_item);
            profile_var['degree'+i_str]=degree_comma_item;
            if(degree_comma_item!=="" && degree_fos !== "") profile_var['degree'+i_str]=profile_var['degree'+i_str]+", ";
            profile_var['degree'+i_str]=profile_var['degree'+i_str]+degree_fos;
            var dates=sum_info.getElementsByClassName("pv-entity__dates");
            if(dates !== null && dates.length !== null && dates.length>0) {
                end_year=findlastyear(dates[0].innerText);
                start_year=findfirstyear(dates[0].innerText); }
            else
            {
                end_year="";
                start_year="";
            }
            profile_var['startYearU'+i_str]=start_year;
            profile_var['endYearU'+i_str]=end_year;

        }
    }
    if (window.location.href.indexOf("mturkcontent.com") != -1 || window.location.href.indexOf("amazonaws.com") != -1)
    {
        var i;
        var loc2,loc3,loc4,loc7;


        var url=document.getElementsByClassName("dont-break-out")[0].innerText;
        GM_setClipboard(url);
        GM_setValue("url",url);
        GM_addValueChangeListener("profile_var", function() {
            insertValues();
            document.getElementById("submitButton").click();


        });
        document.getElementById("fullName").addEventListener("click", function()
                                                             {
            insertValues();
           // document.getElementById("submitButton").click();
        });
    }
    else {
        GM_addValueChangeListener("url", function() {
            var new_url=GM_getValue("url");
            window.location.replace(new_url);
        });


        /* Load the script on pressing 'v', run by clicking in the Experience section */
        window.addEventListener("keydown",function(e) {
            if(e.key !== "v") {
                return;
            }
            console.log("LOADING\n");
            get_Name();
            get_Exp();
            get_Ed();

            console.log(JSON.stringify(profile_var));
            /* Set the profile var */
            GM_setValue("profile_var", JSON.stringify(profile_var));


        });
    }




})();