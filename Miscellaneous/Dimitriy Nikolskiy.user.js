// ==UserScript==
// @name         Dimitriy Nikolskiy
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/401e712254c2877b9bce7343f6f0a4a65991d521/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/f57e3c5dfd145a821c161e0b434a498c2dbf1231/global/nicknames.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];

    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1JMGBQD6BBSJY",true);
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
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            var max_i=my_query.try_count[type]<2?2:1;
            for(i=0; i < b_algo.length&&i<max_i; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) &&

                   (!MTurkScript.prototype.is_bad_name(b_name,my_query.parsed_name.lname,p_caption,i) &&
                    !MTurkScript.prototype.is_bad_name(b_name,my_query.parsed_name.fname,p_caption,i))
		   && (b1_success=true)) {
                    if(/linkedin/.test(type) && !/\/in\//.test(b_url)) {
                        b1_success=false; continue;
                    }
                    break;
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
        var search_str;
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str=my_query.name+" "+my_query.state+" site:npiprofile.com";
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        else if(type==="query" && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            search_str=my_query.parsed_name.fname+" "+my_query.parsed_name.lname+ " site:npino.com";
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        else if(type==="query" && my_query.try_count[type]===2) {
            my_query.try_count[type]++;
            search_str=my_query.parsed_name.fname+" "+my_query.parsed_name.lname+ " site:npiprofile.com";
            query_search(search_str, resolve, reject, query_response,"query");

            return;
        }
        else if(type==="query" && my_query.try_count[type]===3) {
            my_query.try_count[type]++;
            search_str=my_query.parsed_name.fname+" "+my_query.parsed_name.lname+" " +my_query.city +" "+my_query.state+" site:linkedin.com";
            query_search(search_str, resolve, reject, query_response,"linkedin");
            return;
        }
        else if(type==="linkedin" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str=my_query.parsed_name.fname+" "+my_query.parsed_name.lname+" "+my_query.state+" site:linkedin.com";
            query_search(search_str, resolve, reject, query_response,"linkedin");
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

    function parse_npino(doc,url,resolve,reject) {
        if(doc.querySelector(".panel-heading")) {
            console.log("Success good npi page");
            my_query.fields["npino.com link"]=url;
            resolve();

        }
        else {
            reject();
        }
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        var match1;
        console.log("Success,result="+result);
        if(/npino\.com/.test(result)) {
            match1=result.match(/https:\/\/npino\.com\/[^\/]+\/([\d]+)/);
            if(match1) {
                my_query.fields.npi=match1[1];
                my_query.fields["npino.com link"]=result;
                submit_if_done();
                return;
            }
        }
        else if(/npiprofile\.com/.test(result)) {
            match1=result.match(/https:\/\/npiprofile\.com\/npi\/([\d]+)/);
            if(match1) {
                my_query.fields.npi=match1[1];
                my_query.fields["npino.com link"]=result;
                let promise=MTP.create_promise("https://npino.com/npi/"+match1[1],parse_npino,submit_if_done,function(response) {
                console.log("Failed, sticking with npiprofile link");
                    submit_if_done();
                });
                //"https://npino.com/npi/"+match1[1];
                return;
            }
        }
        else if(/linkedin\.com/.test(result)) {
            my_query.fields.other_link=result;
            document.querySelector("#checkboxes-1").click();
            submit_if_done();
            return;
        }
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
        var p=document.querySelectorAll("form p");
        var name=p[0].innerText.trim().replace(/^[^:]*:\s*/,"");
        var loc=p[1].innerText.trim().replace(/^[^:]*:\s*/,"").match(/([^,]*),\s*(.*)/);
        my_query={name:name,state:loc[1],city:loc[2], fields:{"npino.com link":"","npi":""},
                  done:{},
		  try_count:{"query":0,"linkedin":0},
		  submitted:false};
        my_query.state=reverse_state_map[my_query.state] !==undefined ? reverse_state_map[my_query.state] : my_query.state;
        my_query.name=my_query.name.replace(/([A-Za-z]+)\.([A-Za-z]+)/,"$1 $2").replace(/([A-Za-z]+\s.*)\-.*\s.*$/,"$1")
        .replace(/,?\s*m(\.)?\s*d(\.)?\s*$/i,"");
        my_query.name=MTP.removeDiacritics(my_query.name);
        my_query.parsed_name=MTP.parse_name(my_query.name);
        if(!/\s/.test(my_query.name)) {
            my_query.parsed_name.fname="";
            my_query.parsed_name.lname=my_query.name.slice(1)
        }
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.state+" site:npino.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();