// ==UserScript==
// @name         JJNissen
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include file://*
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @connect google.com
// @connect crunchbase.com
// ==/UserScript==

(function() {
    'use strict';

    function domain_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var g1_success=false;
        var t_url="crunchbase.com", t_header_search="";
        i=0;
        while(t_url.indexOf("crunchbase.com") !== -1 || t_url.indexOf("linkedin.com") !== -1 ||
              t_url.indexOf("bloomberg.com") !== -1) {
            t_url=g_stuff[i].getElementsByTagName("cite")[0].innerText; // url of query
            i++;
        }
        var new_url=t_url.replace(/^https:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"");
        if(new_url!==null && new_url.length>0) {
            resolve(new_url);
        }
        else
        {
            reject("Failed with url");
        }
    }
    function domain_search(resolve, reject, google_search_str) {
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(google_search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    domain_URL,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             domain_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); }



            });
    }

    function google1_response(response,domainPromise) {
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
            var CEO_name="";
            var t_split = t_header_search.split(/( - )|(\|)|(,)/g);
            var fname="", lname="";
            if(t_split!== null && t_split.length>0) CEO_name=t_split[0].trim();
            document.getElementsByName("FounderName")[0].value=CEO_name;
            document.getElementsByName("LinkedInAddress")[0].value=t_url;
            var name_arr=CEO_name.split(" ");
            var lnamepos;
            if(name_arr!==null && name_arr.length >= 2)
            {
                fname=name_arr[0].toLowerCase();
                lnamepos=name_arr.length-1;
                if(name_arr[lnamepos].indexOf("Jr")!==-1 || name_arr[lnamepos].indexOf("III")!==-1) lnamepos-=1;
                lname=name_arr[lnamepos].toLowerCase();

            }
            var email_label=document.getElementById("email").previousElementSibling;
           // console.log("email_label tag = " + email_label.tagName);
           domainPromise.then(
            function(domain_name) {
                if(fname.length>=1 && lname.length>=1)
                {
                    var to_paste_str="";
                    to_paste_str=to_paste_str+"\"" + fname+"@"+domain_name+"\" OR \"" + fname.substr(0,1)+lname+"@"+domain_name+"\" OR \"";
                    to_paste_str=to_paste_str+fname+"."+lname+"@"+domain_name+"\" OR \"";
                    to_paste_str=to_paste_str+fname+"_"+lname+"@"+domain_name+"\"";
                    console.log("Success! Paste str="+to_paste_str);
                    email_label.innerHTML="Email address ("+domain_name+"):";
                    GM_setClipboard(to_paste_str);
                }

            }
            )
            .catch(function(val) {
                email_label.innerHTML="Email address "+val+"):";
                console.log("Failed crunch " + val); });
        }
    }

    function init_JJNissen()
    {
        var well0=document.getElementsByClassName("well")[0];
        var slashSplitArr=well0.innerText.split("/");
        if(slashSplitArr !== null && slashSplitArr.length>0) {
            var search_str=slashSplitArr[slashSplitArr.length-1].replace(/-/g," ");
            var google_search_str=search_str;
                        GM_setClipboard(google_search_str,"text");

            search_str=search_str+" CEO " + "Linkedin";// OR "+search_str+ " Founder Linkedin";
            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
            //console.log(search_URI);
            const domainPromise = new Promise((resolve, reject) => {
                console.log("Beginning domain search");
                domain_search(resolve, reject, google_search_str);
            });


            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {
                    console.log("MOO");

                    google1_response(response, domainPromise); }

            });
        }
    }

 
    var submitButton=document.getElementById("submitButton");
    if(!submitButton.disabled)
        init_JJNissen();



})();