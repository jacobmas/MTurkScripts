// ==UserScript==
// @name         Daniel Smith
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.google.com/*
// @include file://*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/0bbdac05a8d93846db414d477ffd997b7534bbb6/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"AR0KNJ6PEUOEB",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function is_bad_img_url(the_url) {
        return the_url.indexOf(".png")===-1 && the_url.indexOf(".jpg")===-1;
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
                if(type=="facebook" && !is_bad_name(b_name) && !MTP.is_bad_fb(b_url) && (b1_success=true)) break;
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve({url:b_url,type:type})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type=="facebook" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             query_search(""+my_query.name+" band site:facebook.com",resolve, reject,query_response,"facebook");
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
        var parsed_url=result.type!=="img_url"?result.url.replace(/^https?:\/\/[^\/]*\//,"").replace(/\/.*$/,""):result.url;
        my_query.fields[result.type]=parsed_url;
        if(result.type==="facebook") {
            var promise=MTP.create_promise(result.url,MTP.parse_FB_home,parse_FB_then); }
        my_query.done[result.type]=true;
        submit_if_done();
//        if(result.type==="facebook") {

    }
    function parse_FB_then(result) {
        console.log("FB result="+JSON.stringify(result)); }
   
    function add_to_sheet()
    {
        console.log("add_to_sheet, my_query="+JSON.stringify(my_query));
        var trans=document.getElementById("TranscriptionTexts");
        trans.value=""+my_query.fields.facebook+"\n"+my_query.fields.soundcloud+"\n"+my_query.fields.img_url;
    }
    function do_google() {
        console.log("Doing google");
        var rg_l=document.getElementsByClassName("rg_l");
        if(rg_l!==null && rg_l!==undefined && rg_l.length>0) {
            var i,href_re=/imgurl=(h[^&]*)&/,href_match,curr_href;
            for(i=0; i < rg_l.length; i++) {
                console.log("curr_a.href="+curr_href);
                if((href_match=rg_l[i].href.match(href_re))) {
                    console.log("href_match[1]="+href_match[1]);
                    console.log("decode="+decodeURIComponent(href_match[1]));
                    if(!is_bad_img_url(decodeURIComponent(href_match[1])))
                    {
                        GM_setValue("href",decodeURIComponent(href_match[1]));
                        console.log("Found good, breaking");
                        return;
                    }
                }
            }
            console.log("Found no goods");

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
    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query() {

        console.log("in init_Query,url="+window.location.href);
       //var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var i,curr_sib,collapse_trigger=document.getElementById("collapseTrigger").innerText;
        var match_collapse=/^(.*) Information Instructions/;
        var my_match=collapse_trigger.match(match_collapse),wC=document.querySelector("#workContent");
        document.querySelector("#TranscriptionTexts").rows=5;
        var img_div=document.createElement("div");
        img_div.style={};
        Object.assign(img_div,{id:"img_div",class:"row"});
        Object.assign(img_div.style,{height:"320px"});
        wC.parentNode.insertBefore(img_div,wC);
        var name=my_match[1];

        my_query={name: name,fields:{"facebook":"NONE","soundcloud":"NONE","img_url":""},done:{"facebook":false,"soundcloud":false,"img_url":false},
                  doneFB: false, doneSoundCloud: false, FB: "NONE", soundCloud: "NONE", doneImg: false, img_url:"",
                 try_count:{"facebook":0,"soundcloud":0}};
        var search_str, search_URI, search_URIBing;

        const FBPromise = new Promise((resolve, reject) => {
            console.log("Beginning Facebook search");
            query_search("+\""+my_query.name+"\" band site:facebook.com",resolve, reject,query_response,"facebook");
        });
        FBPromise.then(query_promise_then).catch(function(val) {
           console.log("Failed at this Facebook " + val); my_query.doneFB=true; });

        const soundCloudPromise = new Promise((resolve, reject) => {
            console.log("Beginning SoundCloud search");
             query_search(my_query.name+" site:soundcloud.com",resolve, reject,query_response,"soundcloud");
        });
        soundCloudPromise.then(query_promise_then).catch(function(val) {
           console.log("Failed at this soundcloud " + val); my_query.doneSoundCloud=true; });
        GM_setValue("href","");
        GM_addValueChangeListener("href", function() {
            query_promise_then({url:arguments[2],type:"img_url"});
            var new_img=document.createElement("img");
            Object.assign(new_img,{width:400,height:300,src:arguments[2]});
            document.querySelector("#img_div").appendChild(new_img);

        });
        GM_setValue("name",name);
    }



    if(window.location.href.indexOf("google.com")!==-1)
    {
        GM_setValue("name","");
        GM_addValueChangeListener("name", function() {
            var new_url="https://www.google.com/search?tbm=isch&q="+encodeURIComponent(GM_getValue("name")+" band");
            window.location.href=new_url;
        });
        setTimeout(do_google, 2000);

    }



})();
