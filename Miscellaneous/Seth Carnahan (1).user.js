// ==UserScript==
// @name         Seth Carnahan
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  SEC Signatures
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"AKF30SW8LE0CH",true);
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
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
               b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function parse_SEC_init(doc,url, resolve, reject) {
        var a;
        var promise;
        var links=doc.querySelectorAll(".tableFile a");
        var rows = doc.querySelectorAll(".tableFile tr");
        var row;
        console.log("in parse_SEC_init, url="+url);
        for(row of rows) {
            a=row.querySelector("a");
            if(!a) continue;
            a.href=MTP.fix_remote_url(a.href, url);
            let desc=row.querySelectorAll("td")[1].innerText.trim();
            let row_type=row.querySelectorAll("td")[3].innerText.trim();
            console.log("a="+a.href);
            if(/\.htm$/.test(a.href)&&/^10/.test(row_type)) {
                my_query.url_10k=a.href;
                promise=MTP.create_promise(my_query.url_10k,parse_10k, resolve,reject);
                return;
            }
            else if(/\.txt$/.test(a.href)&& /Complete submission/i.test(desc)) {
                my_query.url_10k_txt=a.href;
                promise=MTP.create_promise(my_query.url_10k_txt,parse_10k_txt, resolve,reject);
                return;
            }
        }
        reject("failed to find link");

    }

    function parse_10k(doc,url,resolve,reject) {
        console.log("In parse_10k, url=",url);
     /*   var font=doc.querySelectorAll("font,td");
        var f;
        for(f of font) {
            let parsed=Gov.parse_data_func(f.innerText);
            //console.log("parsed=",parsed);
            if(parsed.name&&parsed.title&&Gov.is_good_person(parsed)) {
                console.log("parsed=",parsed);
                my_query.exec_list.push(parsed);
            }
        }
        resolve("");*/

         var sig=doc.body.innerText.match(/SIGNATURES[^]*/);

        console.log(sig);
        var split_sig=sig[0].split(/\n/);
        var x;
        for(x of split_sig) console.log(x);
    }

    function parse_10k_txt(doc,url,resolve,reject) {
                console.log("In parse_10k_txt, url=",url);
        var sig=doc.body.innerText.match(/SIGNATURES[^]*/);

        console.log(sig);
        var split_sig=sig[0].split(/\n/);
        var x;
        for(x of split_sig) console.log(x);
    }



    function parse_SEC_then(result) {
        var i;
        for(i=0;i<my_query.exec_list.length&&i<25;i++) {
            my_query.fields["name"+(i+1)]=my_query.exec_list[i].name;
            my_query.fields["title"+(i+1)]=my_query.exec_list[i].title;
        }

        submit_if_done();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var url=document.querySelector("crowd-form a").href;
        Gov.query={title_regex_lst:['Controller','Director',/President/,/Officer/,/Chief/]};
        my_query={url:url,fields:{},done:{},exec_list:[],
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        //console.log(MTP.create_promise);
        var promise=MTP.create_promise(my_query.url, parse_SEC_init, parse_SEC_then, function(message) {
            console.log(message);
            GM_setValue("returnHit",true); }
            );
        /*var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
    }

})();