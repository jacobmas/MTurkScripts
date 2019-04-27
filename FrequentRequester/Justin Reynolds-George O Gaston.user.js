// ==UserScript==
// @name         Justin Reynolds/George O Gaston
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  One off part scrape
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant GM_deleteValue
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
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,1500+(1000*Math.random()),[],begin_script,"A1H05C43UTJXWC",false);
    var MTP=MTurkScript.prototype;

    /* Following the finding the district stuff */
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }
    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function parse_result(doc,url,resolve,reject,response) {
        var parsed=JSON.parse(response.responseText),text="",i;
        console.log(response.responseText);
        var new_url="https://ecatalog.smpcorp.com/bwd/api/product/partsearch?filter="+my_query.part;
        new_url=new_url+"&filterType=s&searchType=x&imageSize=80&start=0&limit=25&sort=1&catFilter=-All-&yearFilter=-All-&makeFilter=-All-&modelFilter=-All-&attrCodeFilter=-All-&attrValueFilter=-All-";
        console.log("new_url="+new_url);
        var promise=MTP.create_promise(new_url,parse_result2,resolve,reject);
    }
    function parse_result2(doc,url,resolve,reject,response) {
        var parsed=JSON.parse(response.responseText),text="",i;
        console.log("parse_result2, "+response.responseText);
        var field=document.getElementsByName("Part Number")[0];
        var part_list=[];
        for(i=0;i<parsed.length;i++) {
            console.log("parsed["+i+"].mfG_part="+parsed[i].mfG_Part+", base_part="+parsed[i].basePart+", mfg="+parsed[i].mfg);
            if(parsed[i].mfG_Part.replace(/-/g,"")===my_query.part.replace(/\s*-.*$/g,"") && !part_list.includes(parsed[i].basePart)) part_list.push(parsed[i].basePart);
        }
        for(i=0;i<part_list.length;i++) text=text+(text.length>0?",":"")+part_list[i];
        if(part_list.length===0) text="0";
        field.value=text;
        MTurk.check_and_submit();

    }
    function parse_result_then() { }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.querySelector("#mturk_form table");

        my_query={part:wT.rows[0].cells[1].innerText,fields:{},done:{},submitted:false};
        var url="https://ecatalog.smpcorp.com/bwd/api/vehicle/autosearch?func=PART&filter="+my_query.part+"&count=50&searchType=X";
//        var url_end="&filterType=s&searchType=x&imageSize=70&start=0&limit=25&sort=1&catFilter=-All-&yearFilter=-All-&makeFilter=-All-&modelFilter=-All-&attrCodeFilter=-All-&attrValueFilter=-All-";
        my_query.url=url;//+url_end;
        console.log("my_query="+JSON.stringify(my_query));

        var promise=MTP.create_promise(my_query.url,parse_result,parse_result_then);

        var search_str;

    }

})();