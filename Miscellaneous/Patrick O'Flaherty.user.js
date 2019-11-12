// ==UserScript==
// @name         Patrick O'Flaherty
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include http://www.similarweb.com/*
// @include https://www.similarweb.com/*
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[".urbandictionary.com"];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2SG0E4M5DAKPM",true);
    var MTP=MTurkScript.prototype;

    if(window.location.href.indexOf("similarweb.com")!==-1) {
        begin_similarweb();
    }

    function begin_similarweb() {
        if(/error/.test(window.location.href)) {
            GM_setValue("similar_result","N/A");
            return;
        }
        console.log("docCookies.keys()="+docCookies.keys());

        var x;
        init_cookiemonster();
        for(x in unsafeWindow) {
            if(typeof x==='object') console.log("x="+x); }
        console.log("unsafeWindow.localStorage=");
        console.log(unsafeWindow.localStorage);
        unsafeWindow.localStorage.clear();
        unsafeWindow.sessionStorage.clear();
        do_similarweb_iteration(0);
    }

    function init_cookiemonster() {
         console.log("monstering up some cookies");
        var x;
        var lst=docCookies.keys().concat(["D_HID","D_IID","D_SID","D_UID","D_ZID","D_ZUID"]);
        for(x of lst) {
            console.log("x="+x);
            docCookies.removeItem(x);
             GM.cookie.delete({name:x},function(error) {
                    console.log(error||'success'); });
        }
    }

    function do_similarweb_iteration(count) {
        console.log("similarweb_interaction,count="+count);
        if(/error/.test(window.location.href)) {
            GM_setValue("similar_result","N/A");
            return;
        }
        if(count>=15) {
            console.log("Failed");
            return;
        }
         var result=document.querySelector(".engagementInfo-valueNumber");
        var sorry=document.querySelector("h3.websitePage-smallSiteTitle");
        if(result) {
            GM_setValue("similar_result",result.innerText.trim());
            return;
        }
        else if(sorry && sorry.innerText.indexOf("We’re sorry but")!==-1) {
            console.log("Found sorry");
            GM_setValue("similar_result","N/A");
            return;
        }
        else {
            count++;
            setTimeout(do_similarweb_iteration,250,count);
        }
    }


    function is_bad_name(b_name)
    {
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+",type="+type);
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
            if(/^query$/.test(type) && parsed_context && parsed_context.url && (resolve(parsed_context.url)||true)) return;
        }
            console.log("BLUNK");
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<4; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/^query$/.test(type) &&

(                    !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2)
                   ||(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && /\/index\//.test(b_url)))

                   && !MTP.is_bad_name(my_query.name,b_name,p_caption,i) && (b1_success=true)) break;
                if(/^linkedin$/.test(type) && /linkedin\.com\/(in|company)/.test(b_url) &&
                                     (!is_bad_name(b_name,p_caption,i) || !MTP.is_bad_name(my_query.name,b_name,p_caption,i)) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.try_count[type]===0 && /^linkedin$/.test(type)) {
            my_query.try_count[type]++;
            query_search("\""+my_query.name+"\" site:linkedin.com", resolve, reject, query_response,"linkedin");
            return;
        }
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
        console.log("query_promise_then,result="+result);
        my_query.fields.companyWebsite=result;
        var search_str=my_query.name;
        const linkedinPromise = new Promise((resolve, reject) => {
            console.log("Beginning Linkedin search");
            query_search("\""+search_str+"\" site:linkedin.com/company", resolve, reject, query_response,"linkedin");
        });
        linkedinPromise.then(linkedin_promise_then)
            .catch(function(val) {
            console.log("Failed at this linkedinPromise " + val);
         //my_query.fields["LinkedIn Company Page"]="N/A";
           // my_query.done.linkedin=true;
            //submit_if_done();
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        });
        my_query.done.query=true;
        my_query.domain=MTP.get_domain_only(result,true);
        my_query.similar_url="https://www.similarweb.com/website/"+my_query.domain;
        GM_addValueChangeListener("similar_result",function() {
            do_similarstuff(similarTab,arguments[2]); });

        var similarTab=GM_openInTab(my_query.similar_url);
        submit_if_done();
        setTimeout(do_similar2,3500,similarTab);
    }
    function do_similar2(similarTab) {
        if(!similarTab.closed) {
            similarTab.close();
            var similarPromise=MTP.create_promise(my_query.similar_url,parse_similarweb,similar_promise_then,function(response) {
            console.log("Failed at this similarWebPromise " + response); GM_setValue("returnHit"+MTurk.assignment_id,true);
        });
        }
    }

    function do_similarstuff(similarTab,new_val) {
        console.log("Doing similar stuff,new_val="+new_val);
        similarTab.close();
        my_query.fields["SimilarWeb Monthly Visitors"]=new_val;
        my_query.done.similarweb=true;
        submit_if_done();
       /* var similarPromise=MTP.create_promise(my_query.similar_url,parse_similarweb,similar_promise_then,function(response) {
            console.log("Failed at this similarWebPromise " + response); GM_setValue("returnHit"+MTurk.assignment_id,true);
        });*/
    }

    function parse_similarweb(doc,url,resolve,reject) {
        console.log("in parse_similarweb,url="+url);
        if(/\/error\//.test(url)) {
            resolve("N/A");
            return;
        }
        var result=doc.querySelector(".engagementInfo-valueNumber");
        var sorry=doc.querySelector("h3.websitePage-smallSiteTitle");
        if(result) {
            resolve(result.innerText.trim());
            return;
        }
        else if(sorry && sorry.innerText.indexOf("We’re sorry but")!==-1) {
            resolve("N/A");
            return;
        }
        else if(sorry) {
            console.log("sorry.innerText="+sorry.innerText);
        }
        else {
            reject("no monthly number");
        }
    }
    function similar_promise_then(result) {
        console.log("Done similar_promise,result="+result);
        my_query.fields["SimilarWeb Monthly Visitors"]=result;
        my_query.done.similarweb=true;
        submit_if_done();

    }

    function linkedin_promise_then(result) {
        console.log("Done linkedin, result="+result);
        my_query.fields["LinkedIn Company Page"]=result;
        my_query.done.linkedin=true;
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

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=default_bad_urls.concat(bad_urls);
       
        my_query={name:document.querySelector("form a").innerText,
                  fields:{"companyWebsite":"","LinkedIn Company Page":"","SimilarWeb Monthly Visitors":""},
                  done:{query:false,similarweb:false,linkedin:false},
                  submitted:false,
                 try_count:{"linkedin":0}};
        my_query.name=my_query.name.replace(/\s[\|\-]\s.*$/,"");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str="\""+my_query.name+"\"";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();
