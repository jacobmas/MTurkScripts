// ==UserScript==
// @name         LinkedinScript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Karen Veltri tasks by allowing efficient copy/paste from Linkedin
// @author       You
// @include        http://*.linkedin.com/*
// @include        https://*.linkedin.com/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';
    /* Load the script on pressing 'v', run by clicking in the Experience section */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "v") {
            return;
        }
        console.log("LOADING\n");
        var the_secs=document.getElementsByTagName("section");
        var j;
        /*for(j=0; j < the_secs.length; j++)
        {
            console.log("the_secs["+j+"].className="+the_secs[j].className);
        }*/
        var expSec=document.getElementsByClassName("experience-section")[0];
        function stripNonAlphaUpper(to_strip)
        {
            var my_re=/[^A-Za-z]/;
            return to_strip.replace(my_re,"").toUpperCase();
        }
        /* Strip stuff to find BA */
        function stripStuffUpper(to_strip)
        {
            var my_re=/[\(\)\.\"\s]/g;
            return to_strip.replace(my_re,"").toUpperCase();
        }
        function arrayMatchStrippedString(string, the_arr)
        {
            var i;
            var stripped=stripStuffUpper(string);
            var pos;
            console.log("stripped="+stripped);
            for(i=0; i < the_arr.length; i++)
            {
                pos=stripped.indexOf(the_arr[i]);
                if(pos !== -1)
                {
                    if(the_arr[i]!=='BA' || !((pos >= 1 && stripped.substr(pos-1,3) === 'MBA') ||  (
                    stripped.length >= pos+5 && stripped.substr(pos,5)==='BANKI' )))
                    {
                        console.log("Matched at "+i+", "+the_arr[i]);
                        return true;
                    }
                }
            }
            console.log("NO matches");
            return false;
        }
        function year_toString(year)
        {
            if(year>0)
                return year.toString();
            return "";
        }
        function findlastyear(to_find)
        {
            var my_re=/\d{4}/g;
            var the_matches=to_find.match(my_re);
            if(the_matches!==null) return parseInt(the_matches[the_matches.length-1]);
            return 0;
        }
        var get_Exp=function(e) {
            e.preventDefault();
            //var edSec=document.getElementsByClassName("education-section")[0];
            var expProfiles=expSec.getElementsByTagName("li");//ClassName("pv-profile-section__card-item");
            var i,l;
            var clip_str=window.location.href+"\n";
            var temp_str;
            var match_arr;
            var num_needed;
            var i_len;
            i_len = expProfiles.length > 4 ? 4 : expProfiles.length;
            var i_count=0;
            for(i=0; i < expProfiles.length; i++) {
                if(expProfiles[i].className.match("artdeco") !== null) {
                    continue; }
                else {
                    i_count+=1;
                    if(i_count>4) { break; }
                }
                var sum_info=expProfiles[i].getElementsByClassName("pv-entity__summary-info")[0];
                temp_str=sum_info.innerText;
                clip_str=clip_str+temp_str;//+"\n";
                match_arr=temp_str.match(/\n/g);
                if(match_arr === null)
                {
                    num_needed=4;
                }
                else if(match_arr.length>=4)
                {
                    num_needed=0;
                }
                else
                {
                    num_needed=4-match_arr.length;
                }
                for(j=0; j < num_needed; j++)
                    clip_str=clip_str+"\n";


            }
            console.log("clip_str="+clip_str);
            GM_setClipboard(clip_str);
        };

        if(expSec !== null) expSec.addEventListener("click", get_Exp);
        var edSec= document.getElementsByClassName("education-section")[0];
        var get_Ed = function(e) {
            e.preventDefault();
            var edProfiles=edSec.getElementsByTagName("li");//ClassName("pv-profile-section__card-item");
            var i,j,k,l;
            var clip_str="";
            var lawdegrees=["LLB","JD","JURIS"];
            var undergraddegrees=["BS","BA","BSM","BSN","BE","BCom","AB"];
            var temp_str;
            var match_arr;
            var num_needed;
            var i_len;
            var max_law_year=-1;
            var max_law_school="";
            var max_undergrad_year=-1;
            var max_undergrad_school="";
            var i_count=0;
            console.log("edProfiles.length="+edProfiles.length);
            for(i=0; i < edProfiles.length; i++) {
                if(edProfiles[i].className.match("artdeco") !== null) {
                    continue; }
                var school_name=edProfiles[i].getElementsByClassName("pv-entity__school-name")[0].innerText;
                var sum_info=edProfiles[i].getElementsByClassName("pv-entity__summary-info")[0];
                var times,last_time;

                console.log("sum_info="+sum_info.innerText);
                var degree_comma_item=sum_info.getElementsByClassName("pv-entity__degree-name");
                if(degree_comma_item !== null && degree_comma_item.length != null && degree_comma_item.length>0)
                    degree_comma_item = degree_comma_item[0].innerText.substr(11);
                else
                    degree_comma_item="";
                console.log("degree_comma_item="+degree_comma_item);
                var dates=sum_info.getElementsByClassName("pv-entity__dates");
                if(dates !== null && dates.length !== null && dates.length>0)
                    last_time=findlastyear(dates[0].innerText);
                else
                    last_time=0;
                console.log("last_time="+last_time);
                if(last_time > max_law_year &&
                   (arrayMatchStrippedString(degree_comma_item,lawdegrees) || school_name.indexOf("LAW SCHOOL")!==-1 ||
                   school_name.toUpperCase().indexOf("SCHOOL OF LAW") !== -1))
                {
                    max_law_year=last_time;
                    max_law_school=school_name;
                }
                else if(last_time > max_undergrad_year &&
                        arrayMatchStrippedString(degree_comma_item,undergraddegrees))
                {
                    max_undergrad_year=last_time;
                    max_undergrad_school=school_name;
                }
            }

            clip_str=max_law_school+"\n"+year_toString(max_law_year)+"\n"+max_undergrad_school+"\n";
            clip_str=clip_str+year_toString(max_undergrad_year);
            console.log("clip_str="+clip_str);
            GM_setClipboard(clip_str);
        };

        if(edSec !== null) edSec.addEventListener("click", get_Ed);

        //expSec.click();

    });
})();