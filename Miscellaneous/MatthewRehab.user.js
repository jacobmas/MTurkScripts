// ==UserScript==
// @name         MatthewRehab
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
// @connect rehabreviews.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1SZSA5SMV94V2",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
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
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
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
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {

            MTurk.check_and_submit();
        }
    }
    function parse_rehab(doc,url,resolve,reject) {
        var name=doc.querySelector("h1.post-title");
        my_query.fields.facilityName=name.innerText.trim();
        var h2s=doc.querySelectorAll("h2");
        var x;
        var summary;
        for(x of h2s) {
            if(/In Summary/i.test(x.innerText)) {
                summary=x.nextElementSibling;
                my_query.fields.summaryText=x.nextElementSibling.innerText;
                break;
            }
        }

        var add=summary.nextElementSibling;
        while(add.tagName!=="P") add=add.nextElementSibling;
        console.log("add="+add.innerText);
        var y,text="";
        var cld=add.childNodes;
        var found_br=false;
        for(y of cld) {
            if(found_br) { text=text+y.textContent.replace(/,\s*$/,"")+(y.textContent.trim().length>0?",":""); }
            if(y.nodeType===Node.ELEMENT_NODE && y.tagName==="BR") found_br=true;
        }
        console.log("text="+text);
        var parsed_add=new Address(text,0,"");
        var reach=add.nextElementSibling;
        while(reach.nextElementSibling && !/Cost:/.test(reach.innerText)) reach=reach.nextElementSibling;
        var match,reach_re=/Cost:(.*)?\.\s*Reach/;
        if(parsed_add) {
            Object.assign(my_query.fields,{"address1":parsed_add.address1||"","address2":parsed_add.address2||"",
                                           "city":parsed_add.city||"","state":parsed_add.state||"","Zip":parsed_add.postcode||""});

        }
        else {
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
        if((match=reach.innerText.match(reach_re))) {
            my_query.fields.facilityCost=match[1].trim();
        }
        resolve("");
    }

    function init_Query()
    {
        console.log("in init_query");
       
       // var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:document.querySelector("form a").href,fields:{},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
       var promise=MTP.create_promise(my_query.url,parse_rehab,query_promise_then);
    }

})();
