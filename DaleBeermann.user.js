// ==UserScript==
// @name         DaleBeermann
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @connect google.com
// @connect bing.com
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    /* Find the VP Student Affairs on Linkedin */
    function google1_response(response, my_query) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var g1_success=false;
        var t_url="", t_header_search="";
        for(i=0; i < g_stuff.length; i++)
        {
            t_url=g_stuff[i].getElementsByTagName("cite")[0].innerText; // url of query
            t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
            if(t_url.indexOf("https://www.linkedin.com/in/")===0)
            {
                g1_success=true;
                break;
            }
            //console.log(temp1);
        }
        if(g1_success)
        {
            /* Continue */
            var contact_name="";
            var t_split = t_header_search.split(/( - )|(\|)|(,)/g);
            var fname="", lname="";
            if(t_split!== null && t_split.length>0) contact_name=t_split[0].trim();
            document.getElementsByName("contact_name")[0].value=contact_name;


            var name_arr=contact_name.split(" ");
            var lnamepos;
            /*if(name_arr!==null && name_arr.length >= 2)
            {
                fname=name_arr[0].toLowerCase();
                lnamepos=name_arr.length-1;
                if(name_arr[lnamepos].indexOf("Jr")!==-1 || name_arr[lnamepos].indexOf("III")!==-1) lnamepos-=1;
                lname=name_arr[lnamepos].toLowerCase();

            }*/

            var next_search=contact_name+" vice president student affairs site:"+my_query.domain_name;
            GM_setClipboard(next_search);
            //var email_label=document.getElementById("email").previousElementSibling;
           // console.log("email_label tag = " + email_label.tagName);


            /*if(fname.length>=1 && lname.length>=1)
            {
                var to_paste_str="";
                to_paste_str=to_paste_str+"\"" + fname+"@"+domain_name+"\" OR \"" + fname.substr(0,1)+lname+"@"+domain_name+"\" OR \"";
                to_paste_str=to_paste_str+fname+"."+lname+"@"+domain_name+"\" OR \"";
                to_paste_str=to_paste_str+fname+"_"+lname+"@"+domain_name+"\"";
                console.log("Success! Paste str="+to_paste_str);
                email_label.innerHTML="Email address ("+domain_name+"):";
                GM_setClipboard(to_paste_str);
            }*/

        }
    }



    function init_DaleBeermann()
    {
        var tabl=document.getElementsByClassName("table")[0];
        var my_query={};
        my_query.schoolName=tabl.rows[0].cells[1].innerText;
        my_query.domain_name=tabl.rows[1].cells[1].innerText.replace(/https:\/\/www\./,"").replace(/^www\./,"").replace(/\/.*$/,"");
        var search_str="Vice President Student Affairs Linkedin "+my_query.schoolName;//site:"+my_query.domain_name;
        GM_setClipboard(search_str);
        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URI,

            onload: function(response) {
                console.log("MOO");

                google1_response(response, my_query); }

        });
    }
    if (window.location.href.indexOf("mturkcontent.com") != -1 || window.location.href.indexOf("amazonaws.com") != -1)
    {
        var panel_primary = document.getElementsByClassName("panel-primary")[0];
        panel_primary.parentNode.removeChild(panel_primary);
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {
            var inputs=document.getElementsByTagName("input");
            var i;
            for(i=0; i < inputs.length; i++)
            {
                if(inputs[i].type==='text' || inputs[i].type==='email' || inputs[i].type==='url')
                {
                    inputs[i].value="";
                }
            }
            init_DaleBeermann();
        }

    }
})();