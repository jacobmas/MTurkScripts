// ==UserScript==
// @name         SD Science
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var my_query = {};

    var MTurk=new MTurkScript(20000,200,[],init_Query,"ACPU6PCQ18L4N");

    function check_function() { return true;  }
    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");
	if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }

    function is_bad_name(b_name)
    {
	return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");



            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		p_caption="";
		if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
		    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
		}
		console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);



                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }

            }
	    if(b1_success)
	    {
		/* Do shit */
		resolve(b_url);
		return;
	    }


        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {


    }



    function parse_webpage(doc,url,resolve,reject)
    {
        url=url.replace(/\/$/,"");
        var result={url:url};
     //  console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var regex_match=doc.body.innerText.match(my_query.title_regex);
        var product_name=doc.getElementById("productName");
        var page_type=document.getElementsByName("Page_Type");
        if(url!==my_query.url)
        {
            page_type[3].checked=true;
            console.log("url="+url+"\nmy_query.url="+my_query.url);
            resolve(result);
            return;
        }
        if(regex_match)
        {
            console.log("regex_match="+JSON.stringify(regex_match));
            document.getElementById("product_title").value=regex_match[0].trim();
        }
        if(product_name)
        {
            page_type[0].checked=true;
            document.getElementById("product_title").value=product_name.innerText;
        }
        resolve(result);
    }
    function parse_webpage_then(result)
    {
        document.getElementById("page_url").value=result.url;
        MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
          var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        console.log("wT.innerText="+wT.innerText);
        my_query={url:wT.rows[0].cells[1].innerText,title_str:"",title_regex:""};
        var url_split=my_query.url.split("/"), dash_split;
        my_query.url=my_query.url.replace(/\/$/,"");
        var page_type=document.getElementsByName("Page_Type");
        if(/captchahandler\.ashx/.test(my_query.url) ||
          /\/basic-html\//.test(my_query.url))
        {
            document.getElementsByName("Page_Type")[3].checked=true;
        }

        else if(url_split.length>=6 && !/html$/.test(my_query.url) && /\d{5,}$/.test(my_query.url))
        {
            console.log("Product Page");
            document.getElementsByName("Page_Type")[0].checked=true;
            my_query.title_str=my_query.url.match(/\/([^\/]+)$/)[1].replace(/\s*\d{5,}$/,"");
            my_query.title_str=my_query.title_str.replace(/-/g,"[^\\s]*\\s");
            my_query.title_regex=new RegExp(my_query.title_str,"i");
            console.log("my_query.title_regex="+my_query.title_regex);
        }

        else {
            console.log("Not product page");

        }
console.log("my_query="+JSON.stringify(my_query));
        my_query.promise=MTurkScript.prototype.create_promise(my_query.url,parse_webpage,parse_webpage_then);
/*	var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
*/




    }

})();