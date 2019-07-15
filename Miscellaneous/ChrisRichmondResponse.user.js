// ==UserScript==
// @name         ChrisRichmondResponse
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Trying Contact Forms for Chris Richmond
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css

// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["/app.lead411.com",".zoominfo.com",".privateschoolreview.com",".facebook.com",".niche.com","en.wikipedia.org",".yelp.com","hunter.io",
                 ".zoominfo.com","issuu.com","linkedin.com"];
    var MTurk=new MTurkScript(60000,500+Math.random()*250,[],begin_script,"AL5SB3TG7J1ZR",false);
    var MTP=MTurkScript.prototype;
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

    function query_promise_then(result) {
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

        function add_to_sheet() {
        var x,field;
	for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
	       (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function send_form(doc,url,resolve,reject) {
        var form=doc.querySelector("form.wpforms-form");
        if(!form && (doc.querySelectorAll("form").length===1)) form=doc.querySelector("form");
        console.log("form="+form);
        //form.submit();
    }

    function init_Query() {
        console.log("in init_query");
        var i,promise,st;
        bad_urls=bad_urls.concat(default_bad_urls);
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var p1=document.querySelectorAll("#instructionBody .p1");
        my_query={url:wT.rows[0].cells[1].innerText,
                                    fields:{email:"",first:" "},form_fields:{},done:{url:false,fb:false,gov:false},submitted:false,email_list:[]};
        p1.forEach(function(elem) {
            var re=/^([^:]*):\s*(.*)$/,match;
            if((match=elem.innerText.match(re))) {
                my_query.form_fields[match[1].replace(/\s.*$/,"").toLowerCase()]=match[2].trim();
            }
        });
        console.log("my_query="+JSON.stringify(my_query));

        promise=MTP.create_promise(my_query.url,send_form,query_promise_then);



    }

})();