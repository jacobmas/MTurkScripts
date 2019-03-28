// ==UserScript==
// @name         Dan Van Meer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  owler
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*owler.com*
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
    var try_count_fails=GM_getValue("try_count_fails",0);
    var bad_urls=[];
    if(/owler/.test(window.location.href)) {
        var time=20000;
        GM_addValueChangeListener("try_count_fails",function() {
            try_count_fails=arguments[2];
            console.log("Need to reload owler ");
            window.location.reload(true); });


        console.log("Setting reload for "+time);
        //setTimeout(function() { window.location.reload(true) },time);
        return;
    }
    var MTurk=new MTurkScript(20000,1000,[],begin_script,"A1R1G5DDYV84PV",true);
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            /*if(parsed_context.Wikipedia && /wikipedia/.test(response.finalUrl)) {
                resolve(parsed_context.Wikipedia);
                return; }*/

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
                if(/\/company\//.test(b_url) && (b1_success=true)) break;
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
    function query_promise_then(url) {
        my_query.owler_url=url;
        my_query.fields.owlerURL=url;
        add_to_sheet();
        console.log("Found owler url="+my_query.owler_url);
        var promise=MTP.create_promise(my_query.owler_url,parse_owler,owler_promise_then);
    }

    function array_to_str(arr) {
        var ret="",i;
        for(i=0;i<arr.length;i++) ret+=(i>0?",":"")+arr[i];
        return ret;
    }

    function parse_owler_json(text) {
        var parsed,state,x,counter=1,i;
        try {
            parsed=JSON.parse(text);
            state=parsed.props.pageProps.initialState;
            console.log(JSON.stringify(state));
            my_query.fields.companyName=state.companyName||"N/A";
            my_query.fields.websiteURL=state.website||"N/A";
            my_query.fields.revenue=state.revenue||"N/A";
            my_query.fields.employees=state.employeeCount||"N/A";
            my_query.fields.sic=state.sicCode?(array_to_str(state.sicCode)||"N/A"):"N/A";
            if(state.sicCode) console.log("state.sicCode="+JSON.stringify(state.sicCode));
            for(x in state.competitorDetails) my_query.fields["competitor"+(counter++)]=state.competitorDetails[x].name;
            for(i=counter;i<=10;i++) my_query.fields["competitor"+i]="N/A";
            my_query.fields.street=state.street1Address||"N/A";
            my_query.fields.city=state.city||"N/A";
            my_query.fields.state=state.state||"N/A";
            my_query.fields.zip=state.zipcode||"N/A";
            my_query.fields.phone=state.phoneNumber||"N/A";
            return;

        }
        catch(error) { console.log("Error parsing json "+error); }
    }
    function parse_owler(doc,url,resolve,reject) {
        var found_script=false;
        var scripts=doc.scripts,regex=/__NEXT_DATA__ \=\s*([^\n]+)/,match,i;
        for(i=0;i<scripts.length;i++) {
            //console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
            if(match=scripts[i].innerHTML.match(regex)) {
                console.log("Matched regex at "+i);
                found_script=true;
                parse_owler_json(match[1]);
                break;
            }
        }
        
        resolve(found_script);

    }
    function owler_promise_then(result) {
        if(result) {
            console.log("Script found!");
            my_query.done.owler=true;
            submit_if_done();
            return;
        }
        else if(my_query.try_count<5) {
            console.log("Script not found, try_count="+my_query.try_count);

            if(my_query.try_count===0) {
                console.log("Incrementing try_count_fails");
                GM_setValue("try_count_fails",try_count_fails+1);
            }
            my_query.try_count++;
            setTimeout(function() {
                var promise=MTP.create_promise(my_query.owler_url,parse_owler,owler_promise_then);
            }, 2500);
            return;
        }
        else {
            console.log("Failed, script not found, try_count="+my_query.try_count);
            return;
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

    function init_Query() {
        console.log("in init_query");
        var i;
        var form=document.querySelector("form");
        var a=document.querySelectorAll("form a")
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var ticker_regex=/Company Ticker Symbol:\s*(.*)/,match,name_regex=/Company Name:\s*(.*)/;
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={url_name:a[1].innerText,
                  fields:{companyName:""},done:{owler:false},submitted:false,try_count:0};
        console.log("my_query="+JSON.stringify(my_query));
        
//
        var search_str=my_query.url_name+" site:owler.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"owler");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

    }

})();