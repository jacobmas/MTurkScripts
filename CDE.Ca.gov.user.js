// ==UserScript==
// @name         CDE.Ca.gov
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Tuition company
// @author       You
// @include        http://*.cde.ca.gov/*
// @include        https://*.cde.ca.gov/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';
    /* Load the script on pressing 'v', run by clicking in the Experience section */
    var clip_str="";
    var curr_table=document.getElementsByTagName("table")[1];
    var tr=curr_table.getElementsByTagName("tr")[12];
    var td=tr.getElementsByTagName("td")[0];
    var the_div=td.getElementsByTagName("div")[0];
    var div_str=the_div.innerHTML;
    var split_arr=div_str.split("\n");
    var i;
    var p_name="";
    var p_title="";
    var p_email="";
    var pos_br1,pos_br2;
    for(i=0; i < split_arr.length; i++)
    {
       // console.log(""+i+". " + split_arr[i]+"\n");
    }
    if(split_arr.length > 1) {
        pos_br1=split_arr[1].indexOf(" <br>");
        var pos_begin1;
        if(pos_br1 !== -1) {
            p_name=split_arr[1].substr(0,pos_br1);
            pos_begin1=p_name.match(/\. [A-Za-z0-9\.].*/);
            if(pos_begin1 !== null)
            {
                p_name=pos_begin1[0].substr(2);
            }
            else {
                pos_begin1=p_name.match(/[A-Za-z0-9\.].*/);
                p_name=pos_begin1[0].substr(0);
            }
          // console.log("\npos_begin1[0]="+pos_begin1[0]);
        }

    }
    if(split_arr.length > 2) {
        pos_br2=split_arr[2].indexOf("<br>");
        var pos_begin2;
        if(pos_br2 !== -1) {
            p_title=split_arr[2].substr(0,pos_br2);
            pos_begin2=p_title.match(/[A-Za-z0-9\.].*/);
            p_title=pos_begin2[0];
        }
    }
    if(split_arr.length > 3)
    {
        var my_re=/\".*\"/;
        var temparr1=split_arr[3].match(my_re);
        if(temparr1 !== null && temparr1.length>0)
        {
            p_email=temparr1[0].substr(8,temparr1[0].length-9);
        }
        else if(split_arr.length > 4)
        {
            var my_re3=/\".*\"/;
            var temparr13=split_arr[4].match(my_re3);
            if(temparr13 !== null && temparr13.length>0)
            {
                p_email=temparr13[0].substr(8,temparr13[0].length-9);
            }
            else {
                console.log("NO MATCH in"+split_arr[3]);
            }

        }
        else
        {
            console.log("NO EMAIL");
        }
    }
     clip_str=clip_str+p_name+"\n"+p_title+"\n"+p_email+"\n"+window.location.href+"\n";
    console.log(clip_str);
    GM_setClipboard(clip_str);
 //   console.log("the_div:"+the_div.innerHTML);
  /*  window.addEventListener("keydown",function(e) {
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

    });*/
})();