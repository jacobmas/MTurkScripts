// ==UserScript==
// @name         LinkedInStaff
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get Company Staff From LinkedIn (Dan Van Meer)
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
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A1R1G5DDYV84PV",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function parse_linkedin(b_name,b_url,p_caption) {
        var ret={};
        var split_regex=/\s[\-–]{1}\s/,split_str;
        split_str=b_name.split(split_regex);
        console.log("split_str="+JSON.stringify(split_str));
        if(split_str.length>2) {
            ret.name=split_str[0].trim();
            let fullname=MTP.parse_name(ret.name);
            my_query.fields.firstName=fullname.fname;
            my_query.fields.lastName=fullname.lname;
            my_query.fields.title=split_str[1].trim();
            my_query.fields.liURL=b_url;
            return true;
        }
        return false;

    }

    function query_response(response,resolve,reject,type) {
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
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                let parsed_name=parse_linkedin(b_name,b_url,p_caption);
                console.log("parsed_name="+parsed_name);
                if(parsed_name && (resolve("")||true)) return;
            }
            //if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
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
    function parse_linkedin_search(url) {
        var ret="";
        var component=decodeURIComponent(url.match(/\?keywords\=(.*)$/)[1]).replace(/\*/g," ");
        console.log("component="+component);
        var title_match=component.match(/title:\(“([^\”]*)”(?: OR “([^\”]*)”)?\)/);
        var company_match=component.match(/company:\"([^\"]*)\"/);
          console.log("title_match="+JSON.stringify(title_match)+", company_match="+JSON.stringify(company_match));
        var title_str="(" + title_match[1]+(title_match.length>2&&title_match[2]?" OR "+title_match[2]:"")+")";
        ret={title_match:title_match,title_str:title_str,company:company_match[1].trim()};
        console.log("title_match="+JSON.stringify(title_match)+", company_match="+JSON.stringify(company_match));
        return ret;
    }
    function init_Query()
    {
        console.log("in init_query");
        var i;
        var a =document.querySelector("form a");
        var str=document.querySelector("form div div").querySelectorAll("p")[1].innerText;
        var ret;
        try {
            ret= parse_linkedin_search(a.href);
        }
        catch(error) {
            console.log("ERror is "+error);
            var regex=/The target title we are looking for is ([^,]*), at ([^\.]*)/,match;
            match=str.match(regex);
            ret={title_match:[],title_str:match[1],company:match[2].trim()};
        }
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={title_match:ret.title_match,title_str:ret.title_str,company:ret.company,fields:{},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.company+" "+my_query.title_str+" site:linkedin.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for "+search_str);
            query_search(search_str, resolve, reject, query_response,"linkedin");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();