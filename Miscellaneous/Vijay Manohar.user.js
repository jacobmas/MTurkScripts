// ==UserScript==
// @name         Vijay Manohar
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  wastewater
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
    var bad_urls=[".tripadvisor.com","/mapcarta.com",".mindat.org",".zillow.com"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"ADUPZX5SWYRNW",false);
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.thing && parsed_context.thing.type) {
                let thing_match=parsed_context.thing.type.match(new RegExp("(Borough|City|Town|Village) in "+my_query.state,"i"));
                if(thing_match) {
                    my_query.fields.organization_name=thing_match[1]+" of "+parsed_context.thing.name;
                    if(parsed_context.url&& !MTurkScript.prototype.is_bad_url(parsed_context.url, bad_urls,4,2)) {
                        my_query.fields.web_url=parsed_context.url;
                        submit_if_done();
                        return;
                    }
                    if(type==='confirm_query') {
                        resolve({name:my_query.fields.organization_name,url:my_query.fields.web_url});
                        return;
                    }
                }
                else if(!/Area/.test(parsed_context.thing.type)) {
                    my_query.fields.organization_name=parsed_context.thing.name;
                    if(parsed_context.url && !MTurkScript.prototype.is_bad_url(parsed_context.url, bad_urls,4,2)) {
                        my_query.fields.web_url=parsed_context.url;
                        submit_if_done();
                        return;
                    }
                    if(type==='confirm_query') {
                        resolve({name:my_query.fields.organization_name,url:my_query.fields.web_url});
                        return;
                    }
                }
            }
            else if(parsed_context.thing) {


            }

        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<1; i++) {
                if(my_query.try_count[type]===0) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(((!MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i))
                    || ((/\.gov/.test(b_url)||/ County|(City of)|(Town of)|(Borough of)/i.test(b_name)) && !MTurkScript.prototype.is_bad_name(b_name,my_query.short_facility,p_caption,i))
                   )
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve({name:b_name,url:b_url})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(type==='query' && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.short_facility+" "+my_query.state, resolve, reject, query_response,"query");
            return;
        }
        else if(type==='query' && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            query_search(my_query.facility.replace(/\s\-.*$/,"")+" "+my_query.state, resolve, reject, query_response,"query");
            return;
        }
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
        console.log("query_promise_then,result="+JSON.stringify(result));
        result.name=result.name.replace(/(Home|About|Welcome)[^\-\|]*\s+[\-\|]\s+/,"");
        let temp_url=result.url.match(/https?:\/\/[^\/]*/);
        my_query.fields.web_url=temp_url;
        if(!temp_url) {
            GM_setValue("returnHit",false);
            return; }
        const queryPromise2 = new Promise((resolve, reject) => {
            console.log("Beginning URL confirm search with "+temp_url[0]);
            query_search(temp_url[0], resolve, reject, query_response,"confirm_query");
        });
        queryPromise2.then(confirm_query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }
    function confirm_query_promise_then(result) {
                console.log("confirm_query_promise_then,result="+JSON.stringify(result));

        if(my_query.fields.organization_name==='')
        {
            my_query.fields.organization_name=result.name.replace(/\s+[\-\|]\s+.*$/,"");
        }

       // my_query.fields.web_url=result.url;


        add_to_sheet();
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
        var is_done=true,is_done_dones=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done_dones=false;
        is_done=is_done_dones;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;

        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        document.querySelector("#web_url").type="text";
       //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name,facility:wT.rows[0].cells[1].innerText.trim(),state:wT.rows[1].cells[1].innerText.trim(),
                  fields:{organization_name:'',web_url:''},done:{},
		  try_count:{"query":0,"confirm_query":0},
		  submitted:false};
        my_query.short_facility=my_query.facility.replace(/\s*wwtp/i,"").replace(/\s*wwtf/i,"").replace(/\s*Wastewater Treatment Plant/i,"").replace(/\s*Waste .*$/,"")
        .replace(/\s*Wastewater\s.*$/i,"").replace(/\s*Sewage Plant/i,"").replace(/\s+Water .*$/,"")
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.facility+" "+my_query.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();