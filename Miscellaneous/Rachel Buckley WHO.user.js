// ==UserScript==
// @name         Rachel Buckley WHO
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find medicine info
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"APRUEYHWHISRP",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function get_generic_name(b_url,b_name,p_caption,i) {
        var match,ret;
        if(/\.myvmc\.com/.test(b_url)) {
            match=b_name.match(/^([^\(]*)\s*\(([^\)]*)\)/);
            if(match) {
                my_query.fields.spelling=match[1];
                my_query.fields.genericname1=match[2];
                return match[2];
            }
        }
        if(/news-medical\.net\/drugs/.test(b_url)) {
            match=b_name.match(/\([^\)]*\)/);
            if(match) return match[1];
        }
        if(/www\.drugs\.com/.test(b_url)&&!/\/availability\//.test(b_url)) {
            ret=b_name.replace(/\s-.*$/,"").trim();
            return ret;
        }
        return null;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,result;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.SubTitle && /^Generic drug/i.test(parsed_context.SubTitle)) {
                    my_query.fields.spelling=parsed_context.Title;
                    my_query.fields.genericname1=parsed_context.SubTitle.replace(/ And .*$/,"").replace(/^Generic drug name:\s*/,"");
                    resolve({url:"",result:my_query.fields.genericname1});
                    return;
                }
                if(parsed_context["Brand names"]!==undefined||(parsed_context.SubTitle && /^Common brand name/.test(parsed_context.SubTitle))||parsed_context.thing) {
                    my_query.fields.spelling=my_query.fields.genericname1=parsed_context.Title.replace(/\s*\(.*$/,"");
                    resolve({url:"",result:my_query.fields.genericname1});
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

                if((result=get_generic_name(b_url,b_name,p_caption,i)) && (b1_success=true)) break;
            }
            if(b1_success && (resolve({url:b_url,result:result})||true)) return;
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
    function query_promise_then(response) {
        console.log("generic="+response.result);
        my_query.fields.genericname1=response.result;
        add_to_sheet();
        var promise=new Promise((resolve,reject)=>{
            do_generic_query(resolve,reject);
        });
        promise.then(submit_if_done).catch(function(val) { console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });

    }
    function do_generic_query(resolve,reject) {
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"www.whocc.no",
                     "origin":"https://www.whocc.no","referer":"https://www.whocc.no/atc_ddd_index/",
                    "Upgrade-Insecure-Requests": "1"};
        var data={code:"ATC code",
"name": my_query.fields.genericname1,
"namesearchtype": "containing"};
        var data_str=MTP.json_to_post(data).replace(/%20/g,"+");
        console.log("data_str="+data_str);
        var query_url="https://www.whocc.no/atc_ddd_index/";
        GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               parse_whopage_1(doc,query_url,resolve,reject); },
                           onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { console.log("Fail"); }
                          });
    }
    function parse_whopage_1(doc,url,resolve,reject) {
        console.log("parse_whopage_1,url="+url);
        //console.log(doc.body.innerHTML);
        var table=doc.querySelector("#content table");
        var row,i,next_url;
        var promise_list=[];
        for(i=0;i<table.rows.length;i++) {
            row=table.rows[i];
            console.log("full row="+row.innerText);
            console.log("row="+row.cells[1].innerText.trim().toLowerCase()+", my_query.fields.genericname1.toLowerCase()="+my_query.fields.genericname1.toLowerCase());
            if(my_query.fields.genericname1.trim().toLowerCase()===row.cells[1].innerText.trim().toLowerCase()) {
                next_url="https://www.whocc.no/atc_ddd_index/"+row.cells[1].querySelector("a").href.replace(/^[^\?]*/,"");
                console.log("next_url="+next_url);
                my_query.fields.ATCcode1=my_query.fields.ATCcode1+(my_query.fields.ATCcode1.length>0?",":"")+row.cells[0].innerText.trim();
                promise_list.push(MTP.create_promise(next_url,parse_atcpage,MTP.my_then_func,MTP.my_catch_func));
            }
        }
        Promise.all(promise_list).then(function(response) {
            console.log("Done all promises!");
            resolve("");
        }).catch(function() { reject(""); });
    }
    function parse_atcpage(doc,url,resolve,reject) {
        console.log("parse_atcpage,url="+url);
        console.log(doc.querySelector("#content").innerText);
        var codes=doc.querySelectorAll("#content b a");
        var i;
        for(i=0;i<codes.length;i++) {
            console.log("codes["+i+"].innerText="+codes[i].innerText); }
        if(codes.length>=4) {

            my_query.fields.generalclass=my_query.fields.generalclass+(my_query.fields.generalclass.length>0?",":"")+codes[0].innerText.trim();
            my_query.fields.subclass1=my_query.fields.subclass1+(my_query.fields.subclass1.length>0?",":"")+codes[1].innerText.trim();
            my_query.fields.subclass2=my_query.fields.subclass2+(my_query.fields.subclass2.length>0?",":"")+codes[2].innerText.trim();
            my_query.fields.textinput=my_query.fields.textinput+(my_query.fields.textinput.length>0?",":"")+codes[3].innerText.trim();
        }
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.querySelectorAll(".dont-break-out");
        my_query={name:dont[0].innerText,fields:{ATCcode1:"",generalclass:"",subclass1:"",subclass2:"",textinput:""},
                  done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" generic";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();
