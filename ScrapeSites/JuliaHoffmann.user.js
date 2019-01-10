// ==UserScript==
// @name         JuliaHoffmann
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape loc.gov
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
// @connect loc.gov
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
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A1I5FTMQYXYJ2H");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        var lower_b=b_name.toLowerCase(),lower_my=my_query.name.toLowerCase();
        if(lower_b.indexOf(lower_my)!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        if(doc.getElementsByClassName("items-wrapper").length>0)
        {
            var promise=new Promise((resolve,reject) => {
                parse_page(doc,response.finalUrl,resolve,reject);
            }).then(query_promise_then);
            return;
        }
        var list=doc.getElementsByClassName("search-results-list-description"),i;
        try
        {
            
            for(i=0; i < list.length; i++)
            {
                var new_url=MTP.fix_remote_url(list[i].getElementsByTagName("a")[0].href,response.finalUrl).replace(/\.gov\//,".gov/vwebv/");
                var promise2=MTP.create_promise(new_url,parse_page,query_promise_then);
                console.log("new_url="+new_url);
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

    function parse_page(doc,url,resolve,reject) {
        console.log("in parse_page, url="+url);
        var wrapper=doc.getElementsByClassName("items-wrapper");
        var title,desc,i;
        for(i=0;i<wrapper.length;i++) {
            title=wrapper[i].getElementsByClassName("item-title")[0];
            desc=wrapper[i].getElementsByClassName("item-description")[0];
            console.log("desc="+desc);
            if(/LCCN$/.test(title.innerText)) resolve(desc.innerText);
        }
    };

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching for "+search_str);
        var search_URI='https://catalog.loc.gov/vwebv/search?'+
            search_str;
        GM_xmlhttpRequest({method: 'GET', url: search_URI,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("result="+result);
        document.getElementsByName("Q5FreeTextInput")[0].value=result.trim();
        MTurk.check_and_submit();
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;if(total_time===undefined) total_time=0;if(callback===undefined) callback=init_Query;
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

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var datafield=document.querySelector("#Other fieldset"),data_split,line_split,semi_split;
//        var dont=document.getElementsByClassName("dont-break-out");
      console.log("datafield.innerText="+datafield.innerText);
        data_split=datafield.innerText.split("\n");
        line_split=data_split[1].split(/\s*\|\s*/);
        semi_split=line_split[1].split("; ");
        my_query={last:semi_split[0].replace(/^[^:]*:\s*/,""),

                  title:semi_split[1].match(/[\d]{4}\)?.\s*(.*)$/)[1].replace(/\..*$/,""),
                  first_init:semi_split[1].match(/^\s*([A-Z]+)/)[1],
                  fields:{},done:{},submitted:false};

        var data={"searchArg1": my_query.last,"argType1": "all","searchCode1": "KNAM","searchType": "2",
                  "combine2":"and","searchArg2":my_query.title.replace(/\sand\s/g," \'and\' "),"argType2":"all","searchCode2":"KTIL",
"yearOption":"defined","year":"1518-2018","fromYear":"","toYear":"","location":"all","place":"all",
"type":"all","language":"all","recCount":"25"};
        console.log("data="+JSON.stringify(data));
        var data_str=MTurkScript.prototype.json_to_post(data).replace(/%20/g,"+");

        console.log("my_query="+JSON.stringify(my_query));
        var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(data_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();