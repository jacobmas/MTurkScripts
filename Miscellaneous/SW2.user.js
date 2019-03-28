// ==UserScript==
// @name         BankSearch_SW
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Bank search
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
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
    var bad_urls=[".branchspot.com",".creditunionsonline.com","creditunionaccess.com",".bank-map.com",".facebook.com","twitter.com",".youtube.com"];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"AM36LIU60S59C",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption)
    {
        console.log("In is_bad_name, b_name="+b_name+", p_caption="+p_caption);
        b_name=b_name.replace("Federal Credit Union","FCU");
        if(p_caption.indexOf(my_query.name)!==-1||b_name.indexOf(my_query.name)!==-1) return false;
        if(!MTP.matches_names(b_name,my_query.name)) return true;
        if(!/Bank/i.test(b_name) && /Bank/i.test(my_query.name)) return true;
        if(!/Credit Union/i.test(b_name) && /Credit Union/i.test(my_query.name)) return true;

        return false;
    }

    function set_closed(b_url,word) {
        if(word===undefined) word="Closed";
        document.getElementById("checkboxes-4").checked=true;
        document.getElementById("other").value=word+", see "+b_url; }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,result;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))&&parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls) && parsed_context.Title &&
           !is_bad_name(parsed_context.Title,"") &&
           (resolve(parsed_context.url)||true)) {
            console.log("parsed_context="+JSON.stringify(parsed_context));
            return;
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<6; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if((result=is_closed(b_name,b_url,p_caption)))
                 {
                    set_closed(b_url,result);
                    submit_if_done();
                    return;
                }


                if(!MTP.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name,p_caption) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.try_count===0)
        {
            my_query.try_count++;
            let new_site=/Credit|FCU/.test(my_query.name)?"creditunionsonline.com":"usbanklocations.com";
            query_search(my_query.name+ " site:"+new_site,resolve,reject,query_response);
        }
        else reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function is_closed(b_name,b_url,p_caption) {
        if( MTP.get_domain_only(b_url,true)==="usbanklocations.com") {
            if((p_caption.indexOf("is not active anymore")!==-1)) return "Closed";
            if((p_caption.indexOf("Merged into")!==-1)) return "Merged";
        }
        if((MTP.matches_names(my_query.name,b_name.replace(/\s*\(.*$/,""))||my_query.try_count===0)&&b_name.indexOf("(Closed)")!==-1) return "Closed";
        if(MTP.get_domain_only(b_url,true)==="bloomberg.com" && /was acquired by/.test(p_caption)) return "Acquired";
        if(MTP.get_domain_only(b_url,true)==="fdic.gov" && /Failed Bank/.test(b_name)) return "Failed";
        return null;
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.web_url=result;
        submit_if_done();
        //MTurk.check_and_submit();
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var ctrl=document.getElementsByClassName("form-control");
        for(i=0;i<ctrl.length;i++) ctrl[i].required=false;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:MTP.shorten_company_name(wT.rows[0].cells[1].innerText).replace(/\s+Group$/i,""),fields:{web_url:""},done:{},submitted:false,try_count:0};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;
        my_query.name=my_query.name.replace("Federal Credit Union","FCU");
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
        GM_setValue("returnHit",true);

        });
    }

})();