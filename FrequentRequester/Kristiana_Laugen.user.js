// ==UserScript==
// @name         Kristiana_Laugen
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse wayfair
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.wayfair.com/*
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
    var MTurk,MTP;

    if(!/wayfair\.com/.test(window.location.href)) {
        MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A10MDSADCBLZWV",false);
        MTP=MTurkScript.prototype;
    }
    else {
        begin_wayfair();
    }
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
	       (!MTurk.is_crowd && (field=document.getElementsByName(x)[0]))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function parse_wayfair1(doc,url,resolve,reject) {
        console.log("parse_wayfair1, url="+url);
        var productcard=doc.querySelector(".ProductCard");
        if(productcard) {
            console.log("productcard="+JSON.stringify(productcard));
            my_query.product_url=productcard.href;

            var promise=MTP.create_promise(my_query.product_url,parse_wayfair2,resolve,reject);
            GM_addValueChangeListener("wayfair_response",function() {
                var ret=arguments[2];
                console.log("WOOWHOO ret="+JSON.stringify(ret));
                my_query.fields.item_price=ret.item_price;
                my_query.fields.Handy_price=ret.Handy_price;
                resolve("");
            });

            GM_setValue("wayfair_url",my_query.product_url);
        }
        else {
            console.log("no product found");
            reject("");
        }
    }
    function parse_wayfair2(doc,url,resolve,reject) {
        console.log("parse_wayfair2, url="+url);
        var location=doc.querySelector(".PostalCodeInputBlock-location-link");
        var price=doc.querySelector(".StandardPriceBlock .BasePriceBlock .notranslate");
        my_query.fields.item_price=price.innerText;
        if(location&&location.innerText.indexOf(my_query.zip)!==-1) {
            var handy=doc.querySelector("[data-codeception-id='addon-service-price']");
            if(handy) {
                my_query.fields.Handy_price=handy.innerText.replace(/^[^\-]*\s*-\s*/,"");
                resolve("");
                return;
            }
            else {
                console.log("location good no handy");
                return;
            }
        }
        console.log("location bad "+location.innerText);
        //reject("");


    }

    function try_wayfair(count) {
   //     console.log("parse_wayfair2, url="+url);
        var location=document.querySelector(".PostalCodeInputBlock-location-link");
        var price=document.querySelector(".StandardPriceBlock .BasePriceBlock .notranslate");
        if(price) {
            my_query.item_price=price.innerText;
        }

        if(location&&location.innerText.indexOf(my_query.zip)) {
            var handy=document.querySelector("[data-codeception-id='handy-add-service-text']");
            if(handy) {
                my_query.Handy_price=handy.innerText.replace(/^[^\-]*\s*-\s*/,"");
                console.log("We did it, woohoo, "+JSON.stringify({item_price:my_query.item_price,Handy_price:my_query.Handy_price}));
                GM_setValue("wayfair_response",{item_price:my_query.item_price,Handy_price:my_query.Handy_price});

                return;
            }
            else {
                console.log("location good no handy");
            }
        }
        console.log("location bad "+(location?location.innerText:""));
        if(count<10) {
            console.log("Failed count="+count);
            setTimeout(function() { try_wayfair(count+1) },500);
        }
        else {
            console.log("Fully failed");
        }
        //reject("");


    }

    function begin_wayfair() {
        try_wayfair(0);

        console.log("BUNKLe");
        GM_addValueChangeListener("wayfair_url",function() {
            if(/wayfair\.com/.test(arguments[2])) {
                window.location.href=arguments[2];
            }
                    });
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
                GM_setValue("wayfair_url","");
        GM_setValue("wayfair_response","");
        var zip=document.querySelector("#instructionBody").innerText.match(/Make your zip code ([\d]+)/)[1];
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
       // var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText.trim(),zip:zip,fields:{item_price:"",Handy_price:""},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
        var url_begin='https://www.wayfair.com/keyword.php?keyword='

        var url_end='&command=dosearch&new_keyword_search=true&class_id=';
        my_query.url=url_begin+my_query.name.replace(/\s/g,"+")+url_end
        var promise=MTP.create_promise(my_query.url,parse_wayfair1,query_promise_then);
    }

})();