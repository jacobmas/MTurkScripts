// ==UserScript==
// @name         Aaron ClausetDepts
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2I6BQ56VVYWSV",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,name,caption,i)
    {
                var dept_of_re=/(College|Department|School) ([oO])f( (([A-Z]([A-Za-z]+))|(and|&)))*/;
        if(/College/.test(my_query.university)) {
            dept_of_re=/(Department|School) ([oO])f( (([A-Z]([A-Za-z]+))|(and|&)))*/; }
        var x,match;
       var result={name:b_name,caption:caption};
         var split_re=/(\s*[-\|\/]+\s*)/;
        var name_split=result.name.split(split_re);
       for(x of name_split) {
            if(/Department|School of/.test(x) && !/\.\./.test(x)) {
                my_query.fields.DepartmentNameAnswered=x;
                return false;
            }
        }
        if(my_query.fields.DepartmentNameAnswered==="") {
            if((match=result.caption.match(dept_of_re))) {
                my_query.fields.DepartmentNameAnswered=match[0].replace(/\s(The|University).*$/,"");
                return false;
            }
        }
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.querySelectorAll("li.b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<1; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve({name:b_name,url:b_url,caption:p_caption})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.DepartmentURL=result.url;
        var split_re=/(\s*[-\|\/]+\s*)/;
        var name_split=result.name.split(split_re);
        var x;
        var dept_of_re=/Department ([oO])f( (([A-Z]([A-Za-z]+))|(and|&)))*/;
        var match;
        console.log("name_split="+JSON.stringify(name_split));
        for(x of name_split) {
            if(/Department|School of/.test(x) && !/\.\./.test(x)) {
                my_query.fields.DepartmentNameAnswered=x;
                break;
            }
        }
        if(my_query.fields.DepartmentNameAnswered==="") {
            if((match=result.caption.match(dept_of_re))) {
                my_query.fields.DepartmentNameAnswered=match[0].replace(/\s(The|University).*$/,"");
            }
        }
        if(my_query.fields.DepartmentNameAnswered!="") {
            submit_if_done();
        }
        else {
           GM_setValue("returnHit"+MTurk.assignment_id,true);
        }
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

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var p=document.querySelectorAll("crowd-form p");
        my_query={name:"",university:p[0].innerText.trim().replace(/^[^:]*:\s*/,""),dept_nick:p[1].innerText.trim().replace(/^[^:]*:\s*/,""),
                  fields:{"DepartmentNameAnswered":"","DepartmentURL":""},done:{},
		  try_count:{"query":0},
		  submitted:false};
        my_query.dept_nick=my_query.dept_nick.replace(/dept/i,"Department");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.university+" "+my_query.dept_nick;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();