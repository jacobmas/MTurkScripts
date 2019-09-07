// ==UserScript==
// @name         JadeSamadiMeatSuite
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
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["meatsuite.com"];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1DC6O482WHQMY",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
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
                            if(parsed_context.Phone) my_query.fields.phone=parsed_context.Phone;

                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                if(parsed_lgb.phone) my_query.fields.phone=parsed_lgb.phone;
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        resolve("http://NONE.com");
        reject("Nothing found");
        return;
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
        if(!my_query.fields["website address"]) my_query.fields["website address"]=result;
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

    function parse_meatsuite(doc,url,resolve,reject) {
        my_query.farm_name=doc.querySelector("h1#profile-heading").innerText.trim();
        var well=doc.querySelectorAll(".well");
        var x;
        for(x of well) {
            if(x.querySelector(".icon-map-marker")) {
                my_query.fields.address=parse_the_address(doc,url,x);
            }
            if(x.querySelector(".icon-envelope")) {
                parse_contacts(doc,url,x);
            }
        }
        resolve("");
    }
    function parse_contacts(doc,url,well) {
        var h4=well.querySelector("h4");
        well.removeChild(h4);
        var text="";
        var state=0;
        var x,y;
        for(x of well.childNodes) {
            console.log("state="+state+", x.nodeType="+x.nodeType+", x="+x);
            if(state===0 && x.nodeType===Node.TEXT_NODE && /[A-Z]/.test(x.textContent)) {
                my_query.fields.contactName=x.textContent.trim();
                state++;
            }
            else if(x.nodeType===Node.ELEMENT_NODE && x.tagName==="A") {
                if(/mailto/.test(x.href)) my_query.fields.email=x.href.replace(/^\s*mailto:\s*/,"");
                else my_query.fields["website address"]=x.href;
                state++;
            }
            else if(state>0 && x.nodeType===Node.TEXT_NODE && /[\d]/.test(x.textContent)) {
                my_query.fields.phone=x.textContent.trim();
            }

        }

    }
    function parse_the_address(doc,url,well) {
        var h4=well.querySelector("h4");
        well.removeChild(h4);
        var text="";
        var x,y;
        for(x of well.childNodes) {
            if(x.nodeType===Node.TEXT_NODE && /[\dA-Z\-]/.test(x.textContent)) {
                text=text+(text.length>0?",":"")+x.textContent;
                if(/,\s+[A-Z]{2}\s+([\d]{5,})/.test(x.textContent)) break;
            }
        }
        return text.trim();
    }
    function meatsuite_promise_then(result) {
        var add=new Address(my_query.fields.address||"");

        var search_str=my_query.farm_name;
        if(add && add.city && add.state) search_str=search_str+" "+add.city+" "+add.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        
        my_query={url:document.querySelector("form a").innerText.replace(/\s+.*$/,""),
                  fields:{},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var promise=MTP.create_promise(my_query.url,parse_meatsuite,meatsuite_promise_then);
    }

})();
