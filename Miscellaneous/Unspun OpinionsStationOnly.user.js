// ==UserScript==
// @name         Unspun OpinionsStationOnly
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Radio station information
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://tunein.com/*
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
// @grant window.focus
// @grant window.close
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
    var bad_urls=["tunein.com"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(75000,750+(Math.random()*1000),[],begin_script,"A1N9E8602PJQIV",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    if(/tunein\.com/.test(window.location.href)) {
        setTimeout(function() { window.close(); },55000);
        console.log("in run_tunein");
        window.focus();
        setTimeout(run_tunein,2000,0);
    }

    function run_tunein(count) {
        window.focus();

        var audio_link=document.querySelectorAll("audio");
        var x;
        var good="";
        for(x of audio_link) {
            if(!/tunein-com\.s3/.test(x.src) && x.src.length>0) {
                good=x.src;
                break;
            }
        }
        console.log("audio_link.src="+good);
        if(good.length>0) {
            GM_setValue("streamDomain",good);
            return;
        }
        else if(count<=500) {
            count+=1;
            setTimeout(run_tunein,500,count);
        }


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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(type==='query' && parsed_context.url) {
                resolve(parsed_context.url);
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if((type!='query' || !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2)) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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
        my_query.done.query=true;
        my_query.fields.stationWebsite=result
        console.log("Found result="+result);
        add_to_sheet();
      

    }

  

   function tunein_promise_then(result) {
        my_query.tunein_url=result;
        GM_setValue("streamDomain","");
        var the_tab=GM_openInTab(my_query.tunein_url,"active");
        GM_addValueChangeListener("streamDomain",function() {
            window.focus();
            my_query.fields.streamDomain=arguments[2];
            console.log("arguments="+JSON.stringify(arguments));
            the_tab.close();
            my_query.done.tuneintab=true;
            submit_if_done();
        });

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
        var x,field,y;
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
        
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=true;
        add_to_sheet();
        console.log("submit_if_done,my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done_dones=false;
        is_done=is_done_dones;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
       

        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed at fields"); GM_setValue("returnHit"+MTurk.assignment_id,true);
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var data_re=/Station Name: (.*) Call Sign: (.*) Frequency: (.*)$/,match;
        var data=document.querySelector("crowd-form div div span");
        match=data.innerText.trim().match(data_re);
        my_query={name:match[1],frequency:match[3],genres:[],
                  fields:{streamDomain:''},
                  done:{"tuneintab":false},
		  try_count:{"query":0},
		  submitted:false};
       
        var field,y;
        

        console.log("my_query="+JSON.stringify(my_query));
        var search_str;
       
        const tuneinPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" site:tunein.com", resolve, reject, query_response,"tunein");
        });
        tuneinPromise.then(tunein_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();