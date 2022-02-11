// ==UserScript==
// @name         David Wu
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Classic Cars
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*500),[],begin_script,"AKYLXZLNR703R",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name, name, p_caption,i)
    {
         if(MTurkScript.prototype.is_bad_name(b_name,name,p_caption,i)) return true;
        if(b_name.indexOf(my_query.year)===-1 || b_name.indexOf(my_query.make)===-1) return true;

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
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/nadaguides/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) &&

                   !is_bad_name(b_name.replace(/Options and.*$|Standard Equi.*$/,""),my_query.name,p_caption,i) && /(Values|Specs|Special-Notes)/.test(b_url)
		   && (b1_success=true)) {
                    b_url=b_url.replace(/\/(Values|Specs|Special-Notes)/,"/Values");
                    break;
                }
                if(/classic/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) &&
!is_bad_name(b_name.replace(/\s-.*$/,""),my_query.name,p_caption,i)

		   && (b1_success=true)) break;
                 if(/hagerty/.test(type) && /hagerty.com\//.test(b_url) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) &&

                   !MTurkScript.prototype.is_bad_name(b_name.replace(/\s\|.*$/,""),my_query.name,p_caption,i)

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
    function nadaguides_promise_then(result) {
        my_query.nadaguides_url=result;
        console.log("query_promise_then,result=",result);
        var promise=MTP.create_promise(my_query.nadaguides_url,parse_nadaguides,submit_if_done,function() { my_query.done.nadaguides=true; submit_if_done(); });
    }

    function classic_promise_then(result) {
        my_query.classic_url=result;
        console.log("classic_promise_then,result=",result);
        var promise=MTP.create_promise(my_query.classic_url,parse_classic,submit_if_done,function() { my_query.done.classic=true; submit_if_done(); });
    }
      function hagerty_promise_then(result) {
        my_query.hagerty_url=result;
        console.log("hagerty_promise_then,result=",result);

        var promise=MTP.create_promise(my_query.hagerty_url,parse_hagerty,submit_if_done,function() { my_query.done.hagerty=true; submit_if_done(); });
    }

    function parse_hagerty(doc,url,resolve,reject) {
    }


    function parse_classic(doc,url,resolve,reject) {
        console.log("parse_classic,url=",url);
        var flexes=doc.querySelectorAll(".flex.py-2");
        var flex,label,price;
        for(flex of flexes) {
            label=flex.querySelector(".capitalize");
            price=flex.querySelector(".font-medium");
            if(label && price && !my_query.fields.us_market_value && /Avg/.test(label.innerText)) {
                my_query.fields.us_market_value=price.innerText.replace(/[^\d]/g,"").trim();
            my_query.fields.source_url=url;
                        my_query.done.classic=true;

                resolve("");
                return;
            }
        }
        var flexpt=doc.querySelectorAll(".flex-1.pt-8 a"),a;
        if(/\/veh\//.test(url)) {
            for(a of flexpt) {
                //console.log("a=",a);
                if(/year-/.test(a.href)) {
                    my_query.classic_url=a.href.replace(/mturkcontent.com/,"classic.com");//MTP.fix_remote_url(url,a.href);
                    console.log("tested positive,url=",my_query.classic_url);
                    var promise=MTP.create_promise(my_query.classic_url,parse_classic,submit_if_done,function() { my_query.done.classic=true; submit_if_done(); });
                    return;
                }
            }
        }
        my_query.done.classic=true;
        resolve("");
    }

    function parse_nadaguides(doc,url,resolve,reject) {
        var price=doc.querySelectorAll(".pricing-table__detail"),tbl;
        if(price.length>=3) {
            my_query.fields.us_market_value=price[2].innerText.replace(/[^\d]/g,"").trim();
            my_query.fields.source_url=url;
                    my_query.done.nadaguides=true;

            resolve("");
            return;
        }
        else if((tbl=doc.querySelector(".tbl-pricing"))) {
            let row,label,price;
            let base_price=false;
            for(row of tbl.rows) {
                label=row.querySelector(".price-label");
                price=row.querySelector(".price-text");
                if(price && label && /Base Price/.test(label.innerText)&&(price=row.querySelectorAll(".price-text")) && price.length>=3) {
                    my_query.fields.us_market_value=price[2].innerText.replace(/[^\d]/g,"").trim();
                    my_query.fields.source_url=url;
                            my_query.done.nadaguides=true;

                    resolve("");
                    return;
                }
                console.log("label=",label,", price=",price);
                if(label && price && /Good/i.test(label.innerText.trim())) {
                    my_query.fields.us_market_value=price.innerText.replace(/[^\d]/g,"").trim();
                    my_query.fields.source_url=url;
                            my_query.done.nadaguides=true;

                    resolve("");
                    return;
                }
            }
        }
                my_query.done.nadaguides=true;

        resolve("");
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
        else if(is_done_dones&&!my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        bad_urls=[];
        console.log("in init_query");
      var name=document.querySelector("crowd-form div p").innerText.trim().replace(/^[^:]*:\s*/,"");
        my_query={name:name.replace(/\/.*$/,""),fields:{us_market_value:"",source_url:""},done:{nadaguides:false},
		  try_count:{"query":0},
		  submitted:false};
        let split_name=my_query.name.split(/\s/);
        my_query.year=split_name[0];
        my_query.make=split_name[1];
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" site:nadaguides.com";
        if(/ Other(\s|$)/i.test(my_query.name)) {
            console.log("Non-specific, returning");
            setTimeout(function() { GM_setValue("returnHit",true); }, 1500);
            return;
        }
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"nadaguides");
        });
        queryPromise.then(nadaguides_promise_then)
            .catch(function(val) {
            my_query.done.nadaguides=true; submit_if_done(); });
/* const classicPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" site:classic.com", resolve, reject, query_response,"classic");
        });
        classicPromise.then(classic_promise_then)
            .catch(function(val) {
            my_query.done.classic=true; submit_if_done(); });
*/
       /*  const hagertyPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" hagerty.com", resolve, reject, query_response,"hagerty");
        });
        hagertyPromise.then(hagerty_promise_then)
            .catch(function(val) {
            my_query.done.hagerty=true; submit_if_done(); });*/
    }

})();