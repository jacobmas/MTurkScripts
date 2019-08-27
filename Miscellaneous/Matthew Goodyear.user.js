// ==UserScript==
// @name         Matthew Goodyear
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1AXLPG3K4ODMC",false);
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
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function create_query(name,site) {
        var search_str=name+" site:"+site+".com";
        if(site==="angellist") search_str=name+" site:angel.co";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for "+search_str);
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(function(result) {
            my_query.done[site]=true;
            my_query.fields[site+"_url"]=result;
            submit_if_done();
        })
            .catch(function(val) {
            console.log("Failed at this queryPromise for "+site+"," + val); my_query.done[site]=true;
        submit_if_done(); });
        return queryPromise;
    }


    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var sites=["twitter","facebook","linkedin","instagram","angellist"];
        my_query={name:wT.rows[0].cells[1].innerText,url:wT.rows[1].cells[1].innerText,
                  fields:{},done:{},submitted:false};
        var x;
        my_query.name=MTP.shorten_company_name(my_query.name.replace(/^.* dba /,""));
        var promise_list=[];

        for(x of sites) {
            my_query.fields[x+"_url"]="";
            my_query.done[x]=false;
            promise_list.push(create_query(my_query.name,x));
        }
        var search_str=my_query.name;
        my_query.done.query=false;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for "+search_str);
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(function(result) {
            my_query.done.query=true;
            //my_query.fields[site+"_url"]=result;
            submit_if_done();
        })
            .catch(function(val) {
            console.log("Failed at this queryPromise for " + val); my_query.done.query=true;
        submit_if_done(); });
        promise_list.push(queryPromise);
        Promise.all(promise_list).then(function() { submit_if_done(); }).catch(submit_if_done);
    }

})();
