// ==UserScript==
// @name         Brent D Jackson
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  news for company sites
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/71469aaa0764ae4169b5c341865f9ac3a6501c9e/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(40000,200,[],begin_script,"ASLKA859SEWZ9",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function is_dead_site(doc,url) {
        console.log("doc.title=("+doc.title+"), MTP.get_domain_only(url)="+MTP.get_domain_only(url));
        if(/^(IIS7|404)/.test(doc.title.trim())) return true;
        else if(/hugedomains\.com|qfind\.net/.test(url)) return true;
        console.log("doc.body.innerHTML="+doc.body.innerHTML.length);
        if((doc.title===MTP.get_domain_only(url,true)&& doc.body.innerHTML.length<500)||
          (doc.head.innerHTML.length<50&&doc.body.innerHTML.length<500)) return true;
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

    function find_news_then(url) {
        document.getElementsByName("newswebsite")[0].value=url;
        MTurk.check_and_submit();
        return true;
    }

    function find_news(doc,url,resolve,reject) {
        console.log("find_news,url="+url);
        var links=doc.links,i;
        var link_list=[[],[],[],[]];
        if(is_dead_site(doc,url) && (resolve("No Site")||true)) return;
        //link_list[3].push(url);
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            console.log("("+i+"): "+links[i].innerText+", url="+links[i].href);
            if(/News/.test(links[i].innerText)) link_list[0].push(links[i].href);
            else if(/Announcements/i.test(links[i].innerText)) link_list[1].push(links[i].href);

            else if(/ASX/.test(links[i].innerText)) link_list[2].push(links[i].href);
            else if(/Investor Information/i.test(links[i].innerText)) link_list[3].push(links[i].href);
        }
        for(i=0;i<link_list.length;i++) {
            if(link_list[i].length>0 && (resolve(link_list[i][0])||true)) return;
        }
        GM_setValue("returnHit",true);
    }
    function find_news_catch(response) {
        console.log("response="+response);
        document.getElementsByName("newswebsite")[0].value="No Site";
        MTurk.check_and_submit();
    }


    function init_Query()
    {
        console.log("in init_query");
        var i;
//        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var a =document.querySelector("a");
        my_query={url:a.innerText,fields:{},done:{},submitted:false};
        my_query.url=my_query.url.replace(/^www/,"http://www");
        if(!/^http/.test(my_query.url)) my_query.url="http://"+my_query.url;
        var promise=MTP.create_promise(my_query.url,find_news,find_news_then,find_news_catch);
    }

})();