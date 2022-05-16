// ==UserScript==
// @name         moodygiles
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js

// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=['tripadvisor.co.uk',];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A37PCKVETZVJ6W",true);
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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				
				if(parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name.replace(/Home -/,""),my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                else if(type==="ukcompany") {
                    let company_name=b_name.replace(/,.*$/,"");
                    my_query.fields.entityname=company_name;
                    resolve("");
                }
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
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name, resolve, reject, query_response,"query");
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
        my_query.fields.website=result;
        my_query.done.query=true;
        var promise=MTP.create_promise(result,Gov.init_Gov,parse_gov_then,function() { GM_setValue("returnHit",true); },
                                       {dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/]});
        var promise2=MTP.create_promise(result,parse_website,parse_website_then,function() { GM_setValue("returnHit",true); },
                                       {dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/]});
    }
    function parse_website(doc,url,resolve,reject) {
        var my_re=/Company (?:[A-Za-z\s]{0,25}|Number):[^]{0,5}(\d{8,10})/i;
        var match;
        if((match=doc.body.innerText.match(my_re))) {
            my_query.fields.entitynumber=match[1].trim();
            resolve("");
            return;

        }
        console.log("DID NOT FIND company number");
        reject("");
        //08574337
    }
    function parse_website_then(result) {
        my_query.done.website=true;
        submit_if_done();
         const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.fields.entitynumber+" site:cylex-uk.co.uk", resolve, reject, query_response,"ukcompany");
        });
        queryPromise.then(ukcompany_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

    function ukcompany_promise_then(result) {
        my_query.done.ukcompany=true;
        submit_if_done();
    }
    function parse_gov_then(result) {
        console.log("Gov.email_list=",Gov.email_list);
        if(Gov.email_list.length>0) my_query.fields.emailaddress=Gov.email_list[0].email;
        my_query.done.gov=true;
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
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var name=document.querySelector("crowd-form u strong");
        my_query={name:name.innerText.trim(),fields:{},done:{query:false,gov:false,ukcompany:false,website:false},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" united kingdom";
        if(/\.co\.uk/.test(my_query.name)) {
            query_promise_then("https://"+my_query.name);
            return;
        }
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();