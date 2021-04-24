// ==UserScript==
// @name         Kevin M Peters
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Guidestar
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
    var MTurk=new MTurkScript(60000,750+(Math.random()*1000),[],begin_script,"A1JZUKTBKTPDXJ",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption)
    {
        if(!/Alumni Association/i.test(my_query.name) && /Alumni Association/i.test(b_name)) return true;
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
            if(type==="query" && parsed_context.Title) { resolve({"name":parsed_context.Title});
            return;
                               }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<1; i++) {
                if(my_query.try_count[type]>0 && i>0) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="ein" && /\/profile\//.test(b_url) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) &&
                   (!MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)||p_caption.match(new RegExp(my_query.name,"i"))) &&
                   !is_bad_name(b_name,p_caption)
		   && (b1_success=true)) break;
                if(type==="query" && /facebook\.com/.test(b_url))
                {
                    resolve({name:b_name.replace(/\s-.*$/,"")});
                             return;
                }
                if(type==="query" && b_url.indexOf(my_query.domain)!==-1) {
                    resolve({name:b_name.replace(/\s-.*$/,"")});
                             return;
                }
                 //   break;
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
        if(type==="ein" && my_query.try_count[type]===0) {
            my_query.try_count[type]+=1;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(my_query.name+ " "+my_query.city+" "+my_query.state+" "+my_query.domain, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
            return;
        }
        if(type==="ein" && my_query.try_count[type]===1) {
            my_query.try_count[type]+=1;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(my_query.name+ " site:guidestar.org", resolve, reject, query_response,"ein");
            });
            queryPromise.then(ein_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
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
    function ein_promise_then(result) {
        console.log("ein_promise_then,result="+result);
        my_query.fields.ein=result.replace(/^.*\/([^\/]*)$/,"$1");
        my_query.done.query=my_query.done.ein=true;

        submit_if_done();
    }

    function query_promise_then(result) {
        console.log("query_promise_then,result="+JSON.stringify(result));
        my_query.name=MTP.shorten_company_name(result.name);
        my_query.done.query=true;
        var search_str=my_query.name+ " "+my_query.city+" "+my_query.state+" site:guidestar.org";
        const einPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"ein");
        });
        einPromise.then(ein_promise_then)
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
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,is_done_dones=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done_dones=is_done=false;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed");
            GM_setValue("returnHit",true);
        }
    }
    function parse_website(doc,url,resolve,reject) {
        console.log("parse_website,url="+url);
        var ein=/([\d]{2}-[\d]{7})/,match;
        var company=MTP.company_from_copyright(doc,url);
        console.log("company="+JSON.stringify(company));
        if(company&&company.length>0&&(!/[A-Z]|\s/.test(my_query.name)||
                                      (/[a-z][A-Z]/.test(my_query.name) && !/\s/.test(my_query.name))
                                      )) my_query.name=company[0].replace(/®/g,"");
        if((match=doc.body.innerText.match(ein))&&!/^00/.test(match[1])) {
            resolve({ein:match[1]});
            return;
        }
        resolve("");
    }

    function parse_website_then(result) {
        var search_str=my_query.name+ " "+my_query.city+" "+my_query.state+" site:guidestar.org";
        if(result&&result.ein) {
            my_query.fields.ein=result.ein;
            my_query.done.query=my_query.done.ein=true;
            submit_if_done();
            return;
        }
        const einPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"ein");
        });
        einPromise.then(ein_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }


    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText.trim(),name_list:[],
                  city:wT.rows[1].cells[1].innerText.trim(),state:wT.rows[2].cells[1].innerText.trim(),
                  domain:wT.rows[3].cells[1].innerText.trim(),fields:{"ein":""},
                  done:{"ein":false,"query":false},
		  try_count:{"ein":0,"query":0},
		  submitted:false};
                    my_query.url="http://www."+my_query.domain;

        if(my_query.state&&state_map[my_query.state]===undefined && reverse_state_map[my_query.state]===undefined) {
            console.log(my_query.city+", "+my_query.state+" outside US, returning");
            //my_query.fields.ein="Outside United States, no EIN";
            //submit_if_done();
            GM_setValue("returnHit",true);
            return;
        }

	console.log("my_query="+JSON.stringify(my_query));
        if(true||(my_query.domain&&!/[A-Z]|\s/.test(my_query.name))) {
            my_query.url="http://www."+my_query.domain;
            console.log("url="+my_query.url);
            var promise=MTP.create_promise(my_query.url,parse_website,parse_website_then,function() { console.log("Failed website"); parse_website_then(); });
        }
        else parse_website_then();


    }

})();