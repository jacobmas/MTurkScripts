// ==UserScript==
// @name        Thomas Prommer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/b662eb00cdb05644da0079a871b628f5437cb3fa/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    console.log("window.location.href="+window.location.href);
    var my_query = {};
    var bad_urls=[];
    var MTurk;
    if(window.location.href.indexOf("worker.mturk.com")!==-1) MTurk=new MTurkScript(20000,200,[],begin_script,"A1S8X6KTQIKRXN",true);
    var  MTP=MTurkScript.prototype;
    function new_begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(document.querySelector("crowd-button")) {
            console.log("FLUNK");
            MTurk=new MTurkScript(20000,200,[],begin_script,"A1S8X6KTQIKRXN",true);
            MTP=MTurkScript.prototype;

            return;
    //var MTP;=MTurkScript.prototype;
          }
        else if(total_time<5000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { new_begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }
    if(/amazonaws|mturkcontent/.test(window.location.href)) {

        new_begin_script();
    }



    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function begin_script(timeout,total_time,callback) {
        console.log("MOOO");
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
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x,field;
        add_to_sheet();
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true))
        {
            MTurk.check_and_submit();
            if(GM_getValue("automate")) {
                document.querySelector("crowd-button").click(); }
        }
    }

    function scrape_site(doc,url,resolve,reject) {
        console.log("in scrape_site, url="+url);
        my_query.fields.brandName=doc.title;
        var links=doc.links,img,insta_url,promise,found_insta=false;
        for(i=0;i<links.length;i++) {
            console.log("links[i].href="+links[i].href);
            if(/instagram\.com/.test(links[i].href)&&!found_insta && (found_insta=true)) {
                my_query.fields.instagramHandle=links[i].href.replace(/^.*instagram\.com\//,"").replace(/\/.*$/,"");
                my_query.done["insta"]=false;
                promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then);
            }
        }
        var logo=doc.querySelector("[class*='logo']");
        if(logo && (img=logo.querySelector("img"))) { my_query.fields.logoURL=img.src; }
        add_to_sheet();
        submit_if_done();

    }
    function parse_insta_then(result) {
        console.log("result="+JSON.stringify(result));
        if(result.profile_pic_url) my_query.fields.logoURL=result.profile_pic_url;
        if(result.name) my_query.fields.brandName=result.name;
        my_query.done.insta=true;
        submit_if_done();

    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var a=document.querySelector("form a");
        my_query={url:a.href,fields:{brandName:"",instagramHandle:"",logoURL:""},done:{},submitted:false};
        var promise=MTP.create_promise(my_query.url,scrape_site,query_promise_then);
       
    }



})();