// ==UserScript==
// @name         Johannes Grasser
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A3873AEM8FO0VP",true);
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
         if(/query/.test(type) && parsed_context.url) {
                resolve(parsed_context.url);
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(/query/.test(type) && parsed_lgb.url) {
                    resolve(parsed_lgb.url);
                    return;
                }
            }
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
               b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/query/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls, 4, 2) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                 if(/zoominfo/.test(type)) {
                     console.log("MOO");
                     var temp_name=b_name.replace(/:.*$/,"").replace(/\s-.*$/,"").trim();
                     console.log(`Found zoominfo,temp_name=${temp_name}`);

                     if(MTP.matches_names(my_query.name, temp_name)) {
                         resolve({url:b_url, caption:p_caption});
                         return;
                     }
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
        if(/zoominfo/.test(type) && my_query.try_count.zoominfo===0) {
            my_query.try_count.zoominfo++;
            query_search(my_query.name+" site:zoominfo.com", resolve, reject, query_response,"zoominfo");
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
        my_query.fields.website=result.replace(/(https:\/\/(?:[^\/]*))\/.*$/,"$1");
        my_query.done.query=true;
        submit_if_done();
    }
    function zoominfo_promise_then(data) {
        let employee_re=/ and has ([\d\,]+) employee/;
        let employee_match=data.caption.match(employee_re);
        if(employee_match) {
            my_query.fields["employee count"]=employee_match[1].replace(/,/g,"");
            my_query.done.zoominfo=true;
            submit_if_done();
        }
        else {
            console.log("Failed match");
            var promise=MTP.create_promise(data.url,parse_zoominfo, parse_zoominfo_then, function() { GM_setValue("returnHit",true); });
//            GM_setValue("returnHit",true);
        }
    }

    function parse_zoominfo(doc,url,resolve,reject) {
        console.log("parse_zoominfo, url=",url);
        var item_div=doc.querySelectorAll("div.icon-text-wrapper");
        var x;
        for(x of item_div) {
            let p=x.querySelector("p");
              if(p && p.innerText.match(/Website/)) {
                var a=x.querySelector("a").href;
                if(!my_query.fields.website) my_query.fields.website=a;

               }
            if(p && p.innerText.match(/Employees/)) {
                var employee_div=x.querySelector("span").innerText.replace(/[^\d,]+/g,"");
                my_query.fields["employee count"]=employee_div;
                resolve("");
            }

        }
        reject("");

    }

    function parse_zoominfo_then() {
        my_query.done.zoominfo=true;
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
        var is_done=true,x,is_done_dones=true;;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;

        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var name=document.querySelector("crowd-form strong").innerText.trim();
        var state=name.match(/\(state: (.*)\)/,"$1");
        if(state) state=state[1];
        else state="";
        name=name.replace(/\(state: (.*)\)/,"");
        var p = document.querySelectorAll("crowd-form p")[2].innerText;
        var address=p.replace(/.* The companies address is:\s*/,"");
        my_query={name:name,address:address,fields:{"website":""},done:{"query":false,"zoominfo":true},
		  try_count:{"query":0,"zoominfo":0},
		  submitted:false};
        my_query.name=my_query.name.replace(/^.* DBA /,"");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });
/*        const zoominfoPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" +\" and has\" \"employees\" site:zoominfo.com", resolve, reject, query_response,"zoominfo");
        });
        zoominfoPromise.then(zoominfo_promise_then)
            .catch(function(val) {
            console.log("Failed at this zoominfoPromise " + val); my_query.done.zoominfo=true; submit_if_done(); }); */
    }

})();