// ==UserScript==
// @name         Connor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*owler.com*
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
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    if(/owler/.test(window.location.href)) {
        setTimeout(function() { window.location.reload(true) },30000);
        return;
    }
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A2N3R6Q3PS4PUS",true);
    var MTP=MTurkScript.prototype;
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            /*if(parsed_context.Wikipedia && /wikipedia/.test(response.finalUrl)) {
                resolve(parsed_context.Wikipedia);
                return; }*/

        }
        if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!is_bad_name(b_name) && !/\/(File|Talk):/.test(b_url) && !/\/reports\//.test(b_url) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        var wikiPromise=MTP.create_promise(url,parse_wiki,parse_wiki_then,function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.web=true; submit_if_done(); });
    }

    function parse_wiki(doc,url,resolve,reject) {
        var vcard=doc.querySelector(".vcard"),row,i,label,value,j,prod_table;
        var prod_list="";
        var list_len=0,inner_li;
        var split_re=/\n|\t|,|;/,split_text;
        if(!vcard || vcard.tagName!=="TABLE") { resolve("");
                                               return; }
        for(i=0;i<vcard.rows.length; i++) {
            row=vcard.rows[i];
            if(row.cells.length<2) continue;
            label=row.cells[0];
            value=row.cells[1];
            if(/Products/.test(label.innerText)) {
                if((inner_li=value.querySelectorAll("li")).length>0) {
                    for(j=0;j<inner_li.length&&j<6;j++) prod_list+=(prod_list.length>0?",":"")+inner_li[j].innerText.toLowerCase().trim();
                }
                else {
                    split_text=value.innerText.split(split_re);
                    for(j=0;j<split_text.length&&j<6;j++) prod_list+=(prod_list.length>0?",":"")+split_text[j].toLowerCase().trim();
                }
                my_query.fields.products=prod_list;
            }
            if(/Website/.test(label.innerText)) {
                my_query.fields.domain=MTP.get_domain_only(value.innerText,true); }
        }
        resolve("");

    }

    function parse_wiki_then(result) {
        my_query.done.web=true;
        submit_if_done();
    }

    function parse_nasdaq(doc,url,resolve,reject) {
        var comps=doc.querySelectorAll(".genTable .TalignL"),i;
        var comp_list="",temp_str;
        for(i=0;i<comps.length;i++) {
            temp_str=MTP.shorten_company_name(comps[i].innerText.replace(/\n[^]*$/,""));
            if(!MTP.matches_names(temp_str,my_query.short_name)) comp_list+=(comp_list.length>0 ? ",":"")+temp_str;
        }
        my_query.fields.competitors=comp_list;
        resolve("");

    }
    function nasdaq_promise_then(result) {
        my_query.done.nasdaq=true;
        submit_if_done();
    }

    function owlerquery_promise_then(result) {
         var owlerurl=result+"#competitors";
        var owlerPromise=MTP.create_promise(owlerurl,parse_owler,owler_promise_then,function(val) {
            console.log("Failed at this owlerPromise " + val);
            my_query.done.owler=true;
            submit_if_done();
        });
    }


    function parse_owler(doc,url,resolve,reject) {
        var comps=doc.querySelector(".competitive-analysis .footer-text"),i;
        var comp_list="",temp_str;
        var regex1=/competitive set are (.*)\. Together/,match;
        match=comps.innerText.match(regex1);
        var text=match[1].replace(/, /g,",").replace(/ and ([^,]*)$/,",$1").toLowerCase();
        my_query.fields.competitors=text;
        resolve("");

    }
    function owler_promise_then(result) {
        my_query.done.owler=true;
        submit_if_done();
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
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var form=document.querySelector("form");
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var ticker_regex=/Company Ticker Symbol:\s*(.*)/,match,name_regex=/Company Name:\s*(.*)/;
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={symbol:form.innerText.match(ticker_regex)[1],name:form.innerText.match(name_regex)[1],
                  fields:{domain:"",products:"",competitors:""},done:{web:false,nasdaq:true,owler:false},submitted:false};
        console.log("my_query="+JSON.stringify(my_query));
        my_query.short_name=MTP.shorten_company_name(my_query.name);
        var search_str=my_query.symbol+" \""+my_query.name+"\" site:en.wikipedia.org";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.web=true; submit_if_done(); });
       /* var nasdaqurl="https://www.nasdaq.com/symbol/"+my_query.symbol.toLowerCase()+"/competitors?sortname=marketcapitalizationinmillions&sorttype=1";
        var nasdaqPromise=MTP.create_promise(nasdaqurl,parse_nasdaq,nasdaq_promise_then,function(val) {
            console.log("Failed at this nasdaqPromise " + val);
            my_query.done.nasdaq=true;
            submit_if_done();


        });*/
        const owlerPromise = new Promise((resolve, reject) => {
            search_str=my_query.name+" site:owler.com";
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        owlerPromise.then(owlerquery_promise_then)
            .catch(function(val) {
            console.log("Failed at this owlerqueryPromise " + val); my_query.done.owler=true; submit_if_done(); });

    }

})();