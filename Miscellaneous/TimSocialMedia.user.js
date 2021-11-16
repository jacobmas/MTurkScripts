// ==UserScript==
// @name         TimSocialMedia
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A28CPV6RI33X80",true);
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
            b_algo=search.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(/query/.test(type) && parsed_context&& parsed_context.url && parsed_context.Facebook) my_query.fields.facebookPage=parsed_context.Facebook;
            if(type==="query" && parsed_context&&  parsed_context.Instagram) my_query.fields.instagramProfile=parsed_context.Instagram;
            if(type==="query" && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls)) {
                resolve(parsed_context.url);
                return;
            }

        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
               b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="insta") b_name=b_name.replace(/ is on Instagram.*$/,"");
                if((type!="query"|| !MTurkScript.prototype.is_bad_url(b_url, bad_urls)) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i) &&
                   !(type==="insta" && MTP.is_bad_instagram(b_url)) && !(type==="fb" && MTP.is_bad_fb(b_url))
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
        console.log("query_promise_then,result=",result);
        my_query.url=result;
        var promise=MTP.create_promise(result,parse_page,parse_page_then,function() { my_query.done.query=true; submit_if_done(); });
    }

    function parse_page(doc,url,resolve,reject) {
        var x;
        var found_fb=false,found_insta=false;
        console.log("parse_page,url=",url+", doc=",doc);
        for(x of doc.links) {
            if(/facebook\.com/.test(x.href) && !MTP.is_bad_fb(x.href)&&!found_fb) {
                console.log("Found fb=",x.href);
                my_query.fields.facebookPage=x.href;
                found_fb=true;
            }
            if(/instagram\.com/.test(x.href) && !MTP.is_bad_instagram(x.href)&&x.href.replace(/\/$/,"").split("/").length>3&&!found_insta) {
                                console.log("Found insta=",x.href);

                my_query.fields.instagramProfile=x.href;
                found_insta=true;
            }
        }
        resolve("");
        return;

    }
    function parse_page_then() {
        my_query.done.query=true;
        submit_if_done();
    }

    function fb_promise_then(result) {
        if(!my_query.fields.facebookPage)
        my_query.fields.facebookPage=result.replace(/^(https?:\/\/www\.facebook\.com\/[^\/]*)\/.*$/,"$1");
        my_query.done.fb=true;
        submit_if_done();
    }
       function insta_promise_then(result) {
               if(!my_query.fields.instagramProfile)
  my_query.fields.instagramProfile=result;
        my_query.done.insta=true;
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
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var name=document.querySelectorAll("crowd-form div div p")[1].innerText.trim()
        my_query={name:name,fields:{facebookPage:"",instagramProfile:""},done:{query:false,fb:false,insta:false},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;//+" company";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" company", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+ " site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.fb=true; submit_if_done(); });

        const instaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:instagram.com", resolve, reject, query_response,"insta");
        });
        instaPromise.then(insta_promise_then)
            .catch(function(val) {
            console.log("Failed at this instaPromise " + val); my_query.done.insta=true; submit_if_done(); });
    }

})();