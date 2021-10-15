// ==UserScript==
// @name         Vyrill.com
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get Vyrill youtube stuff
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A9QE0ZFVKY8ZY",false);
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
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
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


    /* parse_youtube_inner is a helper function for the parse_youtube function */
AggParser.parse_youtube_inner=function(text) {
    var parsed,ret={},runs,match,x,content,contents,i,tabs,label,links,url;
    var subscribers,match1,match2;
    try { parsed=JSON.parse(text); }
    catch(error) { console.log("error parsing="+error+", text="+text); return; }
    
    if(parsed.header.c4TabbedHeaderRenderer.subscriberCountText&&parsed.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText) {
        subscribers=parsed.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText.replace(/\s.*$/,"").trim().replace(/^[^\d]*/,"");
        //   console.log("subscribers=",subscribers);
        match1=subscribers.match(/([\d\.]+)([a-zA-Z]*)/);
        //  console.log(match1);
        if(match1) {
            let temp1=parseFloat(match1[1]);
            if(match1[2]==='K') temp1*=1000;
            if(match1[2]==='M') temp1*=1000000;
            ret.subscribers=temp1;
        }
    }
    else {
        console.warn("parsed.header.c4TabbedHeaderRenderer.subscriberCountText=",parsed.header.c4TabbedHeaderRenderer.subscriberCountText);
    }
    tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
    for(i=0; i < tabs.length; i++) if(tabs[i].tabRenderer && tabs[i].tabRenderer.title==="About" && (content=tabs[i].tabRenderer.content)) break;
    if(!content) return ret;
    contents=content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
    if((label=contents.businessEmailLabel)===undefined) {
        ret.email="";
        ret.hasEmail=false;
    }
    if(contents.subscriberCountText && (runs=contents.subscriberCountText.runs) && runs.length>0 &&
       runs[0].text) ret.total_subscribers=runs[0].text.replace(/,/g,"");
    if(contents.country && contents.country.simpleText) ret.location=contents.country.simpleText;
    if((links=contents.primaryLinks)===undefined) links=[];
    for(i=0; i < links.length; i++) {
        url=decodeURIComponent(links[i].navigationEndpoint.urlEndpoint.url.replace(/^.*(&|\?)q\=/,"")).replace(/(&|\?).*$/,"");
        console.log("url["+i+"]="+url);
        if(/instagram\.com/.test(url)) ret.insta=url;
        else if(/facebook\.com/.test(url)) ret.fb=url.replace(/\/$/,"").replace(/facebook\.com\//,"facebook.com/pg/")+"/about";
        else if(/twitter\.com/.test(url)) ret.twitter=url;
        else if(/plus\.google\.com/.test(url)) ret.googleplus=url;
        else if(!/plus\.google\.com|((youtube|gofundme|patreon)\.com)/.test(url) && i===0) ret.url=url;
    }
    if(contents.description && contents.description.simpleText && (ret.description=contents.description.simpleText.replace(/\\n/g,"\n"))) {
        if(match=ret.description.match(email_re)) ret.email=match[0];
        if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
        if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
    }
    return ret;
};
/* parse_youtube Parses the 'about' page of a youtube channel */
AggParser.parse_youtube=function(doc,url,resolve,reject) {
    var scripts=doc.scripts,i,script_regex_begin=/^\s*var ytInitialData \=\s*/,text;
    var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret={success:false},x,promise_list=[];
    var email_match,match;
    for(i=0; i < scripts.length; i++) {
        if(script_regex_begin.test(scripts[i].innerHTML)) {
            text=scripts[i].innerHTML.replace(script_regex_begin,"");

            if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
            console.log("text=",text);
            resolve(AggParser.parse_youtube_inner(text));
            return;
        }
    }
    resolve(ret);
};

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
               (!MTurk.is_crowd && (field=document.getElementsByName(x)[0]))) field.value=my_query.fields[x];
        }
        for(x in my_query.radios) {
            document.querySelector("[value='"+my_query.radios[x]+"']").checked=true;
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    /* Following the finding the district stuff */
    function parse_youtube_then(result) {
        console.log("result=",result);
        if(result.email) my_query.fields.email=result.email;
        if(result.location) my_query.fields.location=result.location;
        if(result.twitter) {
            my_query.fields.twitter_page="@"+result.twitter.replace(/^.*twitter\.com\//,"").replace(/\/.*$/,"");;
        }
        if(result.fb) my_query.fields.facebook_page=result.fb;
        if(result.insta) {
            my_query.fields.instagram_username=result.insta.replace(/^.*instagram\.com\//,"").replace(/\/.*$/,"");
            my_query.fields.instagram_page=result.insta;
        }
        if(result.subscribers) my_query.fields.total_subscribers=result.subscribers;
        if(result.googleplus) my_query.fields.google_plus_page=result.googleplus;
        submit_if_done();
    }



    function init_Query()
    {
        console.log("in init_query");
        var i;
        var a=document.querySelector("#workContent a");
        my_query={url:a.href,fields:{email:"None",twitter_page:"None",facebook_page:"None",instagram_username:"None",
                                    instagram_page:"None",google_plus_page:"None",location:"None",total_subscribers:0},
                  radios:{"influencer-type":"Individual"},
                  done:{},
		  try_count:{"query":0},
		  submitted:false};
        console.log("my_query="+my_query.url);
        var promise=MTP.create_promise(my_query.url,AggParser.parse_youtube,parse_youtube_then,function() {
            GM_setValue("returnHit",true); });
    }

})();