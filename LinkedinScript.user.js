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
        var get_Exp = function(e) {
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

    });
})();