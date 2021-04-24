// ==UserScript==
// @name         Steve Tulk
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Financial Bio
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
    var bad_urls=[".usnews.com","linkedin.com"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1HA2495U54YKI",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type+", try_count="+my_query.try_count[type]);
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
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTP.is_bad_url(b_url,bad_urls,-1)
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
        if(my_query.try_count[type]===0 && my_query.name) {
            my_query.try_count.query+=1;
            query_search(my_query.name+" financial advisor", resolve, reject, query_response,"query");
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
        my_query.url=result;

        var promise=MTP.create_promise(my_query.url,parse_finance,parse_finance_then,parse_finance_reject


                                       );
    }

    function parse_finance_reject(result) {
        if(my_query.try_count.query===0) {
                        my_query.try_count.query+=1;

             const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" financial advisor", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
            return;
        }

            console.log("Fail "+result); GM_setValue("returnHit",true);
    }


    function parse_finance(doc,url,resolve,reject) {
        console.log("parse_url");


        var x;
        var agentbio1=doc.querySelector(".associatepage .agent_bio");
        var agentContent=doc.querySelector("section#agentContent");
        var fullwidth=doc.querySelector("#full_width_portfolio");
        var primary=doc.querySelector("#primary #main");
        var membersList=doc.querySelector("#members-list");
        var customContent=doc.querySelector("#CustomContent"),p,my_re;
        var agentListItem=doc.querySelectorAll(".agent_list_item");
        var advMod=doc.querySelector("#advisor-modules");
        if(advMod) {
            set_bio(advMod.innerText.trim(),url,resolve);
            return;
        }
        if(agentListItem&&agentListItem.length>0) {
            parse_agentListItem(doc,url,resolve,reject,agentListItem);
            return;
        }
        if(agentbio1) {
            var advData=doc.querySelectorAll(".associatepage .advisorData");
            my_query.fields.bio="";
            for(x of advData) {
                my_query.fields.bio=(my_query.fields.bio+" "+x.innerText.trim()).trim();
            }
            //agentbio1.innerText.trim();
            my_query.fields.biosource=url;
            resolve("");
            return;
        }
        if(agentContent) {
             my_query.fields.bio=agentContent.innerText.trim();
            my_query.fields.biosource=url;
            resolve("");
            return;
        }
        if(fullwidth) {
             my_query.fields.bio=fullwidth.innerText.trim();
            my_query.fields.biosource=url;
            resolve("");
            return;
        }
        if(primary) {
             my_query.fields.bio=primary.innerText.trim();
            my_query.fields.biosource=url;
            resolve("");
            return;
        }
        if(customContent&&my_query.name) {
            p=customContent.querySelectorAll("p");
            my_re=new RegExp(my_query.name,"i");
            for(x of p) {
                if(my_re.test(x.innerText.trim())) {
                    set_bio(x.innerText.trim(),url,resolve);
                    return;
                }
            }
        }
        if(membersList) {
            var item=membersList.querySelectorAll(".member-item"),h3;
            for(x of item) {
                h3=x.querySelector("h3");
                                console.log("x="+x+",h3="+h3.innerText);
                if(h3 && my_query.name && h3.innerText.trim().indexOf(my_query.name)!==-1) {
                     my_query.fields.bio=x.innerText.trim().replace(/Read Bio/,"").trim();
            my_query.fields.biosource=url;
            resolve("");
            return;
                }
            }
        }
        if(doc.querySelector(".associatepage")) {
            var menu=doc.querySelectorAll("a");
            console.log("menu.length="+menu.length);
            for(x of menu) {
                console.log("x.href="+x.href+", x.innerText="+x.innerText);
                if(/Team/i.test(x.innerText.trim())) {
                    let new_url=MTP.fix_remote_url(x.href,url);
                    console.log("new_url="+new_url);
                    var promise=MTP.create_promise(new_url,parse_associate,resolve,reject);
                    return;
                }
            }

        }
        if(/\/team$/.test(url.replace(/\/$/,""))) {
            parse_team(doc,url,resolve,reject);
            return;



        }
        reject("Failed to find good parser");


    }
    function set_bio(bio,biosource,resolve) {
        my_query.fields.bio=bio.trim();
        my_query.fields.biosource=biosource;
        resolve("");
                    return;
    }

    function parse_agentListItem(doc,url,resolve,reject,agentListItem) {
        var x,temp_name;
        for(x of agentListItem) {
            temp_name=x.querySelector("h2")?x.querySelector("h2").innerText.trim().replace(/,.*$/,"").trim():"";
            if(my_query.name && temp_name&&MTP.matches_names(temp_name,my_query.name)) {
                let my_url=url.replace(/(https?:\/\/[^\/]*).*$/,"")+'/'+x.dataset.agentUrl;
                var promise=MTP.create_promise(my_url,parse_finance,resolve,reject);
                return;
            }
        }
        reject("");
    }

    function parse_associate(doc,url,resolve,reject) {
        console.log("parse_associate,url="+url);
        reject("");
    }
    function parse_team(doc,url,resolve,reject) {
        console.log("parse_team,url="+url);
        reject("no team parser");
    }

    function parse_finance_then() {
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var a=document.querySelector("crowd-form a").href;
        var query=decodeURIComponent(a.replace("https://google.com/search?q=","")).replace(/\+/g," ");//regaladvisory.com+%27Mark+Hilgenberg%27+%27%27
        query=query.replace(/\"\s*$/,"");
        let short_query=query;
        var url_part=query.match(/^([^\s]*\.[^\s]*)/),name,company;
        if(url_part) short_query=query.replace(url_part[1],"").trim();
        name=short_query.match(/^\'[^\']*\'/);
        if(name) short_query=short_query.replace(name[0],"").trim();
        company=short_query.replace(/\'/g,"").trim();

        my_query={name:name?name[0].replace(/\'/g,""):"",query:query,short_query:short_query,url_part:url_part?url_part[1]:"",company:company,fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=query;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();