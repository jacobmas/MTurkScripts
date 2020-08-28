// ==UserScript==
// @name         FindCompanySocial
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find social media for companies, Sebastian Smiits
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2X6W72EMQ78WI",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
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
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
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
        console.log("query_promise_then,url="+result);
        my_query.done.query=true;
        my_query.url=result;
        if(/facebook\.com/.test(my_query.url)) {
             my_query.fields[my_query.fb]=my_query.url;
             my_query.fields[my_query.insta]="no link";
            submit_if_done();
            return;
        }
        var promise=MTP.create_promise(my_query.url,find_social,find_social_then,function(response) {
            console.log("Failed "+response);
            my_query.done.social=true;
            if(my_query.fields[my_query.fb]==="" && my_query.fields[my_query.insta]==="") {

                my_query.fields[my_query.fb]=my_query.fields[my_query.insta]="no link"; }
            submit_if_done();
        });
    }
    function find_social(doc,url,resolve,reject) {
        console.log("find_social,url="+url);
        var links=doc.querySelector("a");
        var x;
        for(x of doc.links) {
            console.log("x="+x.href+",text="+x.innerText);
            x.href=x.href.replace(/\/$/,"");
            if(/facebook\.com/.test(x.href) && !MTP.is_bad_fb(x.href)) {
                my_query.fields[my_query.fb]=x.href; }
            if(/instagram\.com/.test(x.href) && !MTP.is_bad_instagram(x.href)) {
                my_query.fields[my_query.insta]=x.href; }
        }
        resolve("");
    }

    function insta_promise_then(result) {
        console.log("Done insta, result="+result);
        my_query.done.insta=true;
        if(my_query.fields[my_query.insta]==="") {
            my_query.fields[my_query.insta]=result;
        }
        submit_if_done();
    }
    function fb_promise_then(result) {
        console.log("Done fb, result="+result);

        my_query.done.fb=true;
        if(my_query.fields[my_query.fb]==="") {

            my_query.fields[my_query.fb]=result;
        }
        submit_if_done();
    }

    function find_social_then(result) {
        my_query.done.social=true;
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
        var is_done=true,x,is_done_dones=true;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find fields");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var name="";
        try {
            var url=document.querySelector("a");
            if(url) {
                url=url.innerText;
                //if(/!^http/.test(url)) url="http://"+url;
            }
            console.log("url="+url);


        }
        catch(e) {
            console.log("could not find url "+e);
            if(!url) name=document.querySelector("crowd-form p").innerText.trim().replace(/^[^:]*:\s*/,"");
        }
        var search_str;
        my_query={name:MTP.shorten_company_name(name),"fb":"Facebook website","insta":"Instagram website",
                  fields:{"Facebook website":"","Instagram website":""},
                  done:{query:false,insta:false,fb:false,social:false},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        if(url) {
            my_query.original_url=url;
            my_query.fields={"facebookwebsite":"","instagramwebsite":""};
            my_query.fb="facebookwebsite";
            my_query.insta="instagramwebsite";
            console.log("url="+url);
            let good_url=url;
            if(!/^http/.test(good_url) && !/www\./.test(good_url)) good_url="http://www."+good_url;
            else if(!/^http/.test(good_url)) good_url="http://"+good_url;
             query_promise_then(good_url);
            my_query.name=MTP.get_domain_only(my_query.url);
            search_str=MTP.get_domain_only(my_query.url);
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            my_query.done.fb=true;
            console.log("Failed at this fbPromise " + val);
            submit_if_done();
        });

       const instaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:instagram.com", resolve, reject, query_response,"insta");
        });
        instaPromise.then(insta_promise_then)
            .catch(function(val) {
            my_query.done.insta=true;
            submit_if_done();
            console.log("Failed at this instaPromise " + val);  });
            return;
        }
        search_str=my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();