// ==UserScript==
// @name         BroderickTurner
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  GoFundme
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect gofundme.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A20SDYU2V8OYYK");
    function is_bad_name(b_name)
    {
	return false;
    }

  
    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function parse_gofundme(doc,url,resolve,reject) {
        var goal=doc.getElementsByClassName("goal");
        var status=doc.getElementsByClassName("campaign-status");

        //console.log("doc.head.innerHTML="+doc.head.innerHTML);
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        my_query.fields[0]=doc.getElementsByClassName("campaign-title")[0].innerText.trim();
        my_query.fields[1]=doc.getElementsByClassName("roundedNum")[0].innerText.trim();
        if(doc.getElementsByClassName("js-share-count-text").length>0) {
            my_query.fields[2]=doc.getElementsByClassName("js-share-count-text")[0].innerText.trim(); }
        else my_query.fields[2]="0";
        my_query.fields[3]=doc.getElementsByClassName("co-story")[0].innerText.trim();
        try
        {
            my_query.fields[4]=goal[0].getElementsByTagName("strong")[0].innerText.trim();
            my_query.fields[5]=goal[0].getElementsByClassName("smaller")[0].innerText.trim().match(/\$[\d,]+/)[0];
        }
        catch(error) { console.log("error="+error+", goal[0].innerHTML="+goal[0].innerHTML); }
        my_query.fields[6]=status[0].getElementsByTagName("span")[0].innerText.trim();
        my_query.fields[7]=status[0].innerText.trim().match(/([\d]+) months/)[1];
        my_query.fields[8]=doc.getElementsByClassName("created-date")[0].innerText.trim().replace(/^Created\s*/,"");
        my_query.fields[9]=doc.getElementsByClassName("supporter-time")[0].innerText.trim().match(/^[\d]+/)[0];
        my_query.fields[10]=doc.getElementsByClassName("campaign-img")[0].src;
        submit_if_done();

    }

    function submit_if_done() {
        add_to_sheet();
        if(!my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function add_to_sheet()
    {
        var x,i;
        var ctrl=document.getElementsByClassName("form-control");

        //ctrl[3].type="textarea";
        ctrl[10].type="text";
        var textarea=document.createElement("textarea");
        textarea.id="STORY";
        textarea.name="STORY";
        textarea.className="form-control";
        textarea.placeholder="Copy and Paste the Story";
        textarea.style="width: 750px; height: 200px";
        ctrl[3].parentNode.replaceChild(textarea,ctrl[3]);
        ctrl=document.getElementsByClassName("form-control");
        for(i=0; i < ctrl.length; i++) {
            if(i!=3) ctrl[i].type="text";
            ctrl[i].value=my_query.fields[i];
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
    //    var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
	var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:dont[0].href,fields:{},submitted:false};

	var promise=MTurkScript.prototype.create_promise(my_query.url,parse_gofundme,query_promise_then);
    }

})();