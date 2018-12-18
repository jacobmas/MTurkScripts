// ==UserScript==
// @name         garrettgrohman2
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A3HCLXMAAEOCYG");
    function is_bad_name(b_name,b_caption)
    {
        var lower_b=removeDiacritics(b_name).toLowerCase(),lower_my=my_query.name.toLowerCase();
        var caption=removeDiacritics(b_caption);
        var name_regex=new RegExp(my_query.name+"(\\s|,|\.)");
        if(lower_b.indexOf(lower_my)!==-1 || name_regex.test(caption)) return false;
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log(type+": in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log(type+":b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log(type+":("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!is_bad_name(b_name,p_caption))
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
        resolve("n/a");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function indiegogo_promise_then(result) {
        if(my_query.fields.Indiegogo===undefined || my_query.fields.Indiegogo.length===0) my_query.fields.Indiegogo=result;
        my_query.done.indiegogo=true;
        submit_if_done();
    }
    function indiegogoweb_then(result) {
        try
        {
            if(result.length>0) my_query.fields.Indiegogo=result;
            my_query.done.indiegogoweb=true;
        }
        catch(error) { console.log("error="+error); }
        submit_if_done();
    }

    function kickstarter_promise_then(result) {
        my_query.fields.Kickstarter=result;
        my_query.done.kickstarter=true;
        submit_if_done();
    }

    function parse_indiegogo(doc,url,resolve,reject) {
        resolve("");
    }

    function begin_script(timeout,total_time,callback) {
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
        for(x in my_query.fields) if((field=document.getElementsByName(x)).length>0) field[0].value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        console.log("my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:MTurkScript.prototype.shorten_company_name(wT.rows[0].cells[1].innerText),indiegogolink:wT.rows[4].cells[1].innerText,
                  fields:{},done:{indiegogo:false,kickstarter:false,indiegogoweb:false},submitted:false};

        var search_str=my_query.name;
        var promise=MTurkScript.prototype.create_promise(my_query.indiegogolink,parse_indiegogo,indiegogoweb_then);
        const indiegogoPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:indiegogo.com", resolve, reject, query_response,"indiegogo");
        });
        indiegogoPromise.then(indiegogo_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        const kickstarterPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:kickstarter.com", resolve, reject, query_response,"kickstarter");
        });
        kickstarterPromise.then(kickstarter_promise_then)
            .catch(function(val) {
            console.log("Failed at this kickstarterPromise " + val); GM_setValue("returnHit",true); });
    }

})();