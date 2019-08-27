// ==UserScript==
// @name         Will Kuffel
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
    var bad_urls=["crunchbase.com"];
    var MTurk=new MTurkScript(30000,750+(Math.random()*1000),[],begin_script,"A15JBGSG1KIZJH",false);
    var MTP=MTurkScript.prototype;

    var suffix_country_map={".jp":"Japan",".ch":"Switzerland",".de":"Germany",".nl":"Netherlands"};
    function is_bad_name(b_name,p_caption,i) {
        function is_bad_name_replacer(match,p1,p2,p3) {
            if(/Saint/i.test(p2)) return p1+"St"+p3;
            else return p1+"Mt"+p3;
        }


        var orig_b_name=b_name;
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                        is_bad_name_replacer);
        my_query.name=my_query.name.replace("’","\'").replace(/(^|[^A-Za-z0-9]+)(Saint|Mount)($|[^A-Za-z0-9]+)/i,
                                                              is_bad_name_replacer);
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
        var b_name2=orig_b_name.split(/\s+[\-\|–]{1}\s+/),j;
        console.log("b_name2="+JSON.stringify(b_name2));
        for(j=0;j<b_name2.length;j++) {
            my_query.name=my_query.name.replace("’","\'");
            console.log("b_name="+b_name2[j]+", my_query.name="+my_query.name);
            if(MTP.matches_names(b_name2[j],my_query.name)) return false;
            if(b_name2[j].toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        }

    if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
    return true;
};

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
            b_algo=search.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                let type_match;
                var type_match_map={"German":"Germany"};
                if(parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,5,2)) {
                    if(parsed_context.SubTitle&&(type_match=parsed_context.SubTitle.match(/^(.*)\sCompany$/))) {
                        console.log("type_match="+type_match);
                        if(type_match_map[type_match[1]]) {
                                          my_query.fields.country=type_match_map[type_match[1]]; }
                    }
                    resolve(parsed_context.url);
                    return;
                }


            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.website, resolve, reject, query_response,"query");
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
        var result_domain=MTP.get_domain_only(result.replace(/\/$/,""),true);
        var result_suffix=result_domain.match(/\.[^\.]*$/);
        var other_suffix=my_query.domain.match(/\.[^\.]*$/);
        console.log("my_query.domain="+my_query.domain+", result_domain="+result_domain);
        if(result_domain===my_query.domain) {
            my_query.checkboxes.website_matches=true;
        }
        else {
            my_query.fields.web_url=result;
        }
        if(!my_query.fields.country && suffix_country_map[result_suffix[0]]) {
            my_query.fields.country=suffix_country_map[result_suffix[0]];
        }
        else if(!my_query.fields.country && suffix_country_map[other_suffix[0]]) {
            my_query.fields.country=suffix_country_map[other_suffix[0]];
        }
        else if(!my_query.fields.country) {
            /* Either return or continue */
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
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
        for(x in my_query.checkboxes) {
            field=document.querySelector("#"+x);
            field.checked=my_query.checkboxes[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query() {
        bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText.trim(),website:wT.rows[1].cells[1].innerText.trim(),
                  fields:{web_url:"",country:""},checkboxes:{website_matches:false},
                  done:{},try_count:{"query":0},
                  submitted:false};
        if(!/^http/.test(my_query.website)) my_query.website="http://"+my_query.website;
        my_query.domain=MTP.get_domain_only(my_query.website.replace(/\/$/,""));
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();
