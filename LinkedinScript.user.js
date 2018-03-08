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
        for(j=0; j < the_secs.length; j++)
        {
            console.log("the_secs["+j+"].className="+the_secs[j].className);
        }
        var expSec=document.getElementsByClassName("experience-section")[0];
        function stripNonAlphaUpper(to_strip)
        {
            var my_re=/[^A-Za-z]/;
            return to_strip.replace(my_re,"").toUpperCase();
        }
        function stripStuffUpper(to_strip)
        {
            var my_re=/[\(\)\.\"]/g;
            return to_strip.replace(my_re,"").toUpperCase();
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

        expSec.addEventListener("click", get_Exp);
        var edSec= document.getElementsByClassName("education-section")[0];
        var get_Ed = function(e) {
            e.preventDefault();
            var edProfiles=e.target.getElementsByTagName("li");//ClassName("pv-profile-section__card-item");
            var i,l;
            var clip_str="";
            var lawdegrees={"LLB":1,"JD":1};
            var bachelorsdegrees={"BS":1,"BA":1,"BSM":1,"BSN":1,"BE":1};
            var temp_str;
            var match_arr;
            var num_needed;
            var i_len;
            var max_law_year=0;
            var max_law_school="";
            var max_undergrad_year=0;
            var max_undergrad_school="";
            var i_count=0;
            for(i=0; i < edProfiles.length; i++) {
                if(edProfiles[i].className.match("artdeco") !== null) {
                    continue; }
                else {
                    i_count+=1;
                    if(i_count>4) { break; }
                }
                var school_name=edProfiles[i].getElementsByClassName("pv-entity__school-name")[0].innerText;
                var sum_info=expProfiles[i].getElementsByClassName("pv-entity__summary-info")[0];
                var degree_comma_item=sum_info.getElementsByClassName("pv-entity__comma_item")[0];
                var times=sum_info.getElementsByTagName("time");
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

        if(edSec !== null) edSec.addEventListener("click", get_Ed);

        //expSec.click();

    });
})();