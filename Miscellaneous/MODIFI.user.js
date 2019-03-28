// ==UserScript==
// @name         MODIFI
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  scrape exhibitors
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
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
    var MTurk=new MTurkScript(20000,1000,[],begin_script,"A1MT0G0JFCSPG8",true);
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
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
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
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function parse_categories(cat,product_list) {
       var i,curr_name,subcat,j;

        try {
            curr_name=cat.name;
            subcat=cat.subCategories;
            if(!subcat || subcat.length===0) {
                product_list.push(curr_name);
                return;
            }
            else {
                for(i=0;i<subcat.length;i++) {
                    parse_categories(subcat[i],product_list); }
                return;
            }
        }
        catch(error) { }
        return;


    }
    function parse_result(doc,url,resolve,reject,response) {
        var text=response.responseText,parsed,result;
        var i,j,curr_name,subcat;
        var product_list=[];
        try {
            parsed=JSON.parse(text);
            result=parsed.result;
//            console.log("result="+JSON.stringify(result));
            console.log("result.address="+JSON.stringify(result.address));
            console.log("result.categories="+JSON.stringify(result.categories));
            my_query.fields.address1=result.address.street||"";
            my_query.fields.phone=result.address.tel;
            my_query.fields.zip=result.address.zip||"";
            my_query.fields.Fax=result.address.fax;
            my_query.fields.city=result.address.city||"";
            my_query.fields.state=result.address.country.label||"";
            my_query.fields.email=result.address.email||"";
            my_query.fields.companyName=result.name||"";
            try {
                my_query.fields["exhibitor location 1"]=result.exhibition.exhibitionHall[0].name||"";
            }
            catch(error) { }
            try {
                my_query.fields["exhibitor location 2"]=result.exhibition.exhibitionHall[0].stand[0].name||"";
            }
            catch(error) { }
            for(i=0;i<result.categories.length;i++) {
                parse_categories(result.categories[i],product_list);
            }
            for(j=0;j<product_list.length&&j<5;j++) {
                my_query.fields["product"+(j+1)]=product_list[j];
            }
            resolve("");
            return;
        }
        catch(error) { console.log("JSON parsing error "+error); }
        GM_setValue("returnHit",true);
        return;

    }
    function parse_result_then(result) {
        submit_if_done();
    }

    function init_Query()
    {
        console.log("in init_query");
        var good_url="https://exhibitorsearch.messefrankfurt.com/service/esb/1.0/exhibitor/profile/en/";
        var good_end="/AMBIENTE";
        var match;
        document.querySelectorAll("crowd-input").forEach(function(elem) { elem.required=false; });
        var init_url=document.querySelector("form a").href;
        match=init_url.match(/\/([^\.]+)\.html$/);
      //  var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
       // var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:good_url+match[1]+good_end,
                  fields:{"companyName":"","exhibitor location 1":"","exhibitor location 2":"","address1":"","address2":"",
                         "city":"","state":"","zip":"","tel":"","fax":"","email":"","product1":""},
                  done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
       var promise=MTP.create_promise(my_query.url,parse_result,parse_result_then);
    }

})();