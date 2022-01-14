// ==UserScript==
// @name         The Dyrt
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A12KMLZQXLQNA7",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    if(/thedyrt-mechanical-turk/.test(window.location.href)) {
        console.log("Found the dyrt");
        init_Query();
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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(type==="latlon") {
                var mt=doc.querySelector("#mt_tleWrp a");
                resolve(mt.innerText.trim().replace(/,\s*US$/,""));
                return;
            }

	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
        if(parsed_context.Phone) { my_query.fields.phone=parsed_context.Phone; add_to_sheet(); }
                if(type==="query" && parsed_context.url) { resolve(parsed_context.url); return; }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.phone) { my_query.fields.phone=parsed_lgb.phone; add_to_sheet(); }
                if(type==="query" && parsed_lgb.url) { resolve(parsed_lgb.url); return; }
            }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="hipcamp" && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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
    function hipcamp_promise_then(result) {
        my_query.hipcamp_url=result;
        var promise=MTP.create_promise(result,parse_hipcamp,parse_hipcamp_then,function() { GM_setValue("returnHit",true); });
    }

    function query_promise_then(result) {
        console.log("query_promise_then,result=",result);
        let url=result;
         var query={dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/,/Director/]};
        var promise=MTP.create_promise(url,Gov.init_Gov,gov_promise_then,function() { },query);
    }

    function gov_promise_then() {
        if(Gov.email_list.length>0) {
            my_query.fields.email=Gov.email_list[0].email;
            add_to_sheet();
        }
    }



    function parse_hipcamp(doc,url,resolve,reject) {
        var script=doc.querySelector("body script");
        var re=/\'Product Viewed\',[^\{]*(\{.*\}),[^g]*getTrac/,match;
        console.log(script);
        match=script.innerHTML.match(re);
        console.log("match=",match);
        var parsed=JSON.parse(match[1]);
        console.log("parsed=",parsed);
        my_query.parsed_hipcamp=parsed;
        resolve("");

    }

    function parse_hipcamp_then() {
         var search_str=my_query.parsed_hipcamp.lat+","+my_query.parsed_hipcamp.lng;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"latlon");
        });
        queryPromise.then(latlon_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }
    function latlon_promise_then(result) {
        my_query.address=new Address(result);
        console.log("my_query.address=",my_query.address);
        my_query.fields.streetAddress=my_query.address.address1;
        my_query.fields.city=my_query.address.city;
        my_query.fields.state=my_query.address.state;
        my_query.fields.zip=my_query.address.postcode;

        add_to_sheet();
        var search_str=result;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"address");
        });
        queryPromise.then(latlon_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
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
            console.log("x=",x);
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

        var script;
        document.querySelector("#noEmailCheck").addEventListener("click",function() {
            document.querySelector("#submitButton").disabled=false;
        });
            document.querySelector("#noPhoneCheck").addEventListener("click",function() {
            document.querySelector("#submitButton").disabled=false;
        });
        for(script of document.scripts) {
            if(/launchSearch/.test(script.innerHTML)) {
             //  console.log(script.innerHTML);
                script.innerHTML=script.innerHTML.replace("window.open(query, '_blank');","");
            }

        }
        //document.querySelector(".btn-primary.custom-button").click();
        var submit=document.querySelector("#submitButton");
        unsafeWindow.searchLaunched=true;
        submit.disabled=false;
        console.log("in init_query");
        var i;
        var h5=document.querySelector("h5");
        console.log("h5=",h5);

//        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
  //      var dont=document.getElementsByClassName("dont-break-out");
        my_query={name,fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
        my_query.name=h5.innerText.replace(/[^:]*:\s*/,"").trim();
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" site:hipcamp.com";
        const hipcampPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"hipcamp");
        });
        hipcampPromise.then(hipcamp_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();