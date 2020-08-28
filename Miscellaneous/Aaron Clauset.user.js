// ==UserScript==
// @name         Aaron Clauset
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Pull biographies
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/4cf834f5b62dee1135dead2a6847ef1229faf844/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2I6BQ56VVYWSV",true);
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
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && /\.edu/.test(b_url) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                 if(type==='cv' && i<1 && /\.pdf($|[^A-Za-z])/i.test(b_url)) break; //&& /((^| )CV)|Vitae/i.test(b_name)) break;

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
        console.log("type="+type+",my_query.try_count[type]="+my_query.try_count[type]);
        if(type==='cv' && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.inst, resolve, reject, query_response,"cv");
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
        console.log("result="+result);
        var mt=new MailTester(my_query.parsed_name,result);
        my_query.mt=mt;
        var promise=MTP.create_promise(result,mt.contact_response,mt_then,function(response) { console.log("Failed "+response); },mt);
    }
    function mt_then(result) {
        console.log("mt_then");
         my_query.mt.email_list.sort(function(a,b) { return b.quality-a.quality; });
        console.log("my_query.mt.email_list="+JSON.stringify(my_query.mt.email_list));

        if(my_query.mt.email_list.length>0) {
            my_query.fields.email_address=my_query.mt.email_list[0].email;
            add_to_sheet();
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
    function parse_cv_page(doc,url,resolve,reject) {
        var links=doc.links;
        console.log("parse_cv_page,url="+url);
        var cv_re=/(Curriculum Vitae)|(Vitae)|((^|[^A-Za-z])CV($|[^A-Za-z]))/i;
        for(var x of links) {
            if(x.href ===undefined) continue;
            x.href=MTP.fix_remote_url(x.href,url);
            //console.log("x.innerText="+x.innerText+", x.href="+x.href);
            if(cv_re.test(x.innerText)) {
                my_query.fields.turked_cv_url=x.href;
                if(/\.pdf($|[^A-Za-z])/.test(x.href)) {
                    console.log("Found PDF");
                    document.querySelector("crowd-radio-button[name='cv_was_pdf']").click();
                }
                add_to_sheet();
                resolve("");
                return;
            }
        }
    }
    function parse_cv_then(result) {
    }

    function cv_promise_then(result) {
        console.log("cv_promise_then,result="+result);

                if(/\.pdf($|[^A-Za-z])/.test(result)) {
                     my_query.fields.turked_cv_url=result;
                    console.log("Found PDF");
                    document.querySelector("crowd-radio-button[name='cv_was_pdf']").click();
                    add_to_sheet();
                    return;
                }
        var promise=MTP.create_promise(result,parse_cv_page,parse_cv_then,function(response) { console.log("Failed parse_cv, response="+response); });
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
        var p=document.querySelectorAll("crowd-form div div p");
        var name,dept,inst;
        name=p[0].innerText.trim().replace(/^[^:]*:\s*/,"");
        dept=p[1].innerText.trim().replace(/^[^:]*:\s*/,"");
        inst=p[2].innerText.trim().replace(/^[^:]*:\s*/,"");
        console.log("name="+name);
        name=name.replace(/([^,]*)*,\s*(.*)$/,"$2 $1");
        var parsed_name=MTP.parse_name(name);
        my_query={full_name:name,parsed_name:parsed_name,name:parsed_name.fname+" "+parsed_name.lname,dept:dept,inst:inst,fields:{},done:{},
		  try_count:{"query":0,"cv":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.inst;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
        const cvPromise = new Promise((resolve, reject) => {
            console.log("Beginning cv search");
            query_search(search_str+" curriculum vitae", resolve, reject, query_response,"cv");
        });
        cvPromise.then(cv_promise_then)
            .catch(function(val) {
            console.log("Failed at this cvPromise " + val);
            //GM_setValue("returnHit"+MTurk.assignment_id,true);
        });
    }

})();