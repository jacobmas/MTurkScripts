// ==UserScript==
// @name         FindTwitter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Twitter Handle (Cody Taylor)
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
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,1500+(Math.random()*1000),[],begin_script,"ALE6GCPODNQP1",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption,i)
    {
        b_name=MTP.removeDiacritics(b_name.replace(/\s\|.*$/,"").replace(/\s\(.*$/,""));
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        var temp_query_name=MTP.shorten_company_name(my_query.name.replace("’","\'"));
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,temp_query_name)) {

             return false; }
        //if(i===0 && b_name.toLowerCase().indexOf(temp_query_name.split(" ")[0].toLowerCase())!==-1) return false;
        if(p_caption.indexOf(MTP.shorten_company_name(temp_query_name))!==-1) return false;
        return true;
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
            if(parsed_context.Twitter && !is_bad_name(parsed_context.Title,"",0)) {
                resolve(parsed_context.Twitter);
            }
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<4; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                b_factrow=b_algo[i].querySelector(".b_factrow");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name,p_caption,i) &&
                   /twitter\.com/.test(b_url) && is_verified_twitter(b_factrow,b_algo[i]) &&
                   !MTP.is_bad_twitter(b_url) &&
                   (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(do_next_query(type,resolve,reject)) return;
        reject("Nothing found");
        return;
    }

    function is_verified_twitter(b_factrow,b_algo) {
        var li=b_factrow.querySelectorAll("li");
        var x;
        for(x of li) {
            if(/Verified/.test(x.innerText)) return true;
        }
        var social=b_algo.querySelector(".social_ic");
        return social!==undefined;
//        return false;
    }

    function do_next_query(type,resolve,reject) {
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" site:twitter.com",resolve,reject,query_response,type);
            return true;
        }
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

        var the_name=result.replace(/https?:\/\/[^\/]*\//,"").replace(/\/$/,"");
        my_query.fields.TwitterHandle="@"+the_name;
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
        var strong=document.querySelectorAll("form strong");
        var div=strong[1].parentNode.parentNode.parentNode;
        console.log("div="+div+", "+div.innerText);
        var name=strong[1].innerText.trim().replace(/Brand name:\s*/,"");
        var parentcomp=div.querySelectorAll("p");
        var parent_name=parentcomp[1].innerText.replace(/^[^:]*:\s/,"");
        my_query={name:name,parentCompany:parent_name, fields:{TwitterHandle:""},done:{},submitted:false,
                 try_count:{"query":0}};
	console.log("my_query="+JSON.stringify(my_query));
        my_query.name;
        my_query.parentCompany=MTP.shorten_company_name(my_query.parentCompany);
        var search_str=my_query.name;
        if(parent_name.indexOf("N/A")===-1) search_str+=" "+my_query.parentCompany;
        search_str=search_str+" twitter";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.fields.TwitterHandle="none";
            submit_if_done();

            GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();
