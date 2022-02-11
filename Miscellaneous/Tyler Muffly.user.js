// ==UserScript==
// @name        Tyler Muffly
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse CMS
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
    var MTurk=new MTurkScript(60000,750,[],begin_script,"ATIU3RWW92HRE",true);
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
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
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

    function parse_json(response) {
        console.log("response=",response);
        console.log(response.response.results);
        if(response.response.results.length>0) {
            let entity=response.response.results[0];
            console.log("entity=",entity);
            my_query.fields.physician_name=entity.entity_name.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
            my_query.fields.address=entity['entity_address_line_1']+" "+entity['entity_address_line_2']+", "+entity['entity_city']+", " +entity.entity_state+" "+entity.entity_zipcode;
            my_query.fields.physician_profile_id=entity.entity_id;
            submit_if_done();
        }
        else {
            my_query.fields.physician_name=my_query.fields.address=my_query.fields.physician_profile_id="NA";
                        submit_if_done();

        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
         var strong=document.querySelectorAll("crowd-form p > strong");
        my_query={first:strong[1].innerText.replace(/^[^:]*:\s*/,"").trim(),last:strong[2].innerText.replace(/^[^:]*:\s*/,"").trim(),
                  fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var url='https://openpaymentsdata.cms.gov/api/1/datastore/query/c218c372-76e4-5603-9981-67c324402722?keys=true&limit=10&offset=0&conditions%5B0%5D%5Bresource%5D=t&conditions%5B0%5D%5B'+
        'property%5D=entity_type&conditions%5B0%5D%5Bvalue%5D=p&conditions%5B0%5D%5Boperator%5D=%3D&conditions%5B1%5D%5BgroupOperator%5D=or&'+
            'conditions%5B1%5D%5Bconditions%5D%5B0%5D%5Bresource%5D=t&conditions%5B1%5D%5Bconditions%5D%5B0%5D%5Bproperty%5D=entity_name&'+
            `conditions%5B1%5D%5Bconditions%5D%5B0%5D%5Bvalue%5D=%25${my_query.first}%25&conditions%5B1%5D%5Bconditions%5D%5B0%5D%5Boperator%5D=like&conditions%5B2%5D%5B`+
            `groupOperator%5D=or&conditions%5B2%5D%5Bconditions%5D%5B0%5D%5Bresource%5D=t&conditions%5B2%5D%5Bconditions%5D%5B0%5D%5Bproperty%5D=entity_name&`+
            `conditions%5B2%5D%5Bconditions%5D%5B0%5D%5Bvalue%5D=%25${my_query.last}%25&conditions%5B2%5D%5Bconditions%5D%5B0%5D%5Boperator%5D=like&`+
            'conditions%5B3%5D%5Bresource%5D=t&conditions%5B3%5D%5Bproperty%5D=entity_specialty&conditions%5B3%5D%5Bvalue%5D=%25Allopathic%20%26%20Osteopathic%20Physicians%7CObstetrics%20%26%20Gynecology%25&conditions%5B3%5D%5Boperator%5D=like&conditions%5B4%5D%5Bresource%5D=t&conditions%5B4%5D%5Bproperty%5D=entity_country_name&conditions%5B4%5D%5Bvalue%5D=UNITED%20STATES&conditions%5B4%5D%5Boperator%5D=%3D&sorts%5B0%5D%5Bproperty%5D=entity_name&sorts%5B0%5D%5Border%5D=asc';
          GM_xmlhttpRequest({method: 'GET', url:url,responseType:'json',
                           onload: function(response) { parse_json(response); },
                           onerror: function(response) { GM_setValue("returnHit",true); },ontimeout: function(response) { GM_setValue("returnHit",true); }
                          });

    }
})();