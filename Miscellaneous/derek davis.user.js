// ==UserScript==
// @name         derek davis
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  medical manuals
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,1750+(Math.random()*1000),[],begin_script,"A2ZG363JUABIH1",true);
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
				
				
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
				
					
					}
            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="manualzz") {
                    if(/user-manual/.test(b_url) && MTP.matches_names(my_query.model,b_name) && (
                        b1_success=true)) break;
                }

                if(type==="query") {
                    if( ((/tripplite\.com/.test(b_url) && /owners-manual/.test(b_url))
                         || (/manualslib\.com\/manual/.test(b_url) && MTP.matches_names(my_query.model,b_name) && !/\/brand\//.test(b_url))
                        )   && (b1_success=true)) break;
                    if(i===0 && (/download\.aspx/.test(b_url) || /all\-guidesbox\.com/.test(b_url)) && (b1_success=true)) break;
                    if(i<2 && (/archive\.org/.test(b_url)||/\.pdf/.test(b_url) || (
                        /manualslib\.com\/manual/.test(b_url) && !/\/brand\//.test(b_url))
                               ||(/medwrench\.com\/documents\//.test(b_url)) || /scribd\.com/.test(b_url)
                               ||(/support\.hp\.com/.test(b_url) && MTP.matches_names(my_query.model,b_name) && /\/manuals/.test(b_url))

                              ) && (b1_success=true)) break;
                    if(i<2 && (/archive\.org/.test(b_url)||/\.pdf/.test(b_url) || (
                        /manualslib\.com\/manual/.test(b_url) && !/\/brand\//.test(b_url))
                               ||(/medwrench\.com\/documents\//.test(b_url)) || /scribd\.com/.test(b_url)
                               ||(/support\.hp\.com/.test(b_url) && MTP.matches_names(my_query.model,b_name) && /\/manuals/.test(b_url))

                              ) && (b1_success=true)) break;
                }
            }
            if(b1_success &&  (resolve(b_url)||true)) return;
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
        my_query.fields.DeviceModelURL=result;
        submit_if_done();
    }
    function manualzz_promise_then(result) {
        my_query.done.manualzz=true;
        if(!my_query.fields.DeviceModelURL) my_query.fields.DeviceModelURL=result;
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
        var strong=document.querySelectorAll("li strong");
        my_query={maker:MTP.shorten_company_name(strong[1].innerText.trim()),model:strong[2].innerText.trim(),
                  fields:{DeviceModelURL:""},
                  done:{query:false,manualzz:false},
		  try_count:{"query":0,"manualzz":0},
		  submitted:false};
          if(/Generic OEM/i.test(my_query.maker)) {
              GM_setValue("returnHit",true);
              return;
          }
        my_query.name=my_query.maker+" "+my_query.model;
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" +\"manual\"";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);  my_query.done.query=true;
        submit_if_done(); });
        const manualzzPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" site:manualzz.com", resolve, reject, query_response,"manualzz");
        });
        manualzzPromise.then(manualzz_promise_then)
            .catch(function(val) {
            console.log("Failed at this manualzzPromise " + val); my_query.done.manualzz=true;
        submit_if_done(); });
    }

})();