// ==UserScript==
// @name         DaveL
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Facebook video views, never got working
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com*

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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk,MTP;
    if(!/facebook.com/.test(window.location.href)) {
        MTurk=new MTurkScript(20000,200,[],begin_script,"A14DGXG7UZ4E1C",true);
        MTP=MTurkScript.prototype;
    }
    else {
        begin_fb();
    }
   
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
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
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
    function parse_FB_video(doc,url,resolve,reject) {
        console.log("in parse_FB_video, url="+url);
        var potentialviews=doc.querySelectorAll("._3x-2 ._567_ ._2za- ._1vx9 span");
        var x;
        var view_re=/([\d,]+) Views/,match;
        for(x of potentialviews) {
            console.log("x.innerText="+x.innerText);
            if((match=x.innerText.match(view_re))) {
                my_query.fields.views=match[1];
                resolve();
                return;
            }

        }
        reject("");
    }
    function parse_FB_video_then() {
        submit_if_done();
    }

    /* begin parsing fb */
    function begin_fb() {
        //GM_setValue("fb_event_url","");
        GM_addValueChangeListener("fb_video_url",function() {
            my_query.fb_video_url=arguments[2];
            window.location.href=my_query.fb_video_url;
        });
        var re1=/https:\/\/www\.facebook\.com\/([\d]+)/,match;
        var url=GM_getValue("fb_video_url");
        if((match=url.match(re1))
        if(GM_getValue("fb_video_url","")===window.location.href && /\/events\//.test(window.location.href)) {
            my_query.count=0;
            begin_parse_FB_event();
        }
    }

    function init_Query()
    {

        //._3x-2 ._567_ ._2za- ._1vx9 span
        console.log("in init_query");
        var i;
    //    var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
      //  var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:document.querySelector("form a").href,fields:{views:""},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var promise=MTP.create_promise(my_query.url,parse_FB_video,parse_FB_video_then,function() {
            GM_setValue("returnHit"+MTurk.assignment_id,true); }
            );

        GM_setValue("fb_video_url","");
       /* var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
        GM_addValueChangeListener("fb_video_ret",parse_FB_video_ret);
        GM_setValue("fb_video_url",my_query.url);
    }

})();