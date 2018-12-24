// ==UserScript==
// @name         AvCOATT
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.att.com*
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
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(120000,200,[],init_Query,"AH8CFT48C3HWL");
    function is_bad_name(b_name)
    {
        var lower_b=b_name.toLowerCase(),lower_my=my_query.name.toLowerCase();
        if(lower_b.indexOf(lower_my)!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
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
            reject(error);
            return;
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

    function begin_script(timeout,total_time,callback) {
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var split,match;
        my_query={full_address:wT.rows[1].cells[1].innerText,zip:wT.rows[2].cells[1].innerText,fields:{},done:{},submitted:false};
        split=my_query.full_address.split(", ");
        match=split[1].match(/^(.*)\s([A-Z]+)$/);
        my_query.street=split[0];
        if(match) {
            my_query.city=match[1];
            my_query.state=match[2];
        }
        console.log("my_query="+JSON.stringify(my_query));
        GM_setValue("result",{});
        GM_addValueChangeListener("result",function() {
            result=arguments[2];
            console.log("result="+JSON.stringify(result)); });
        setTimeout(function() {
        GM_setValue("my_query",my_query); }, 1000);
    }
    function init_att() {

        my_query=arguments[2];
        //document.cookie="";
        console.log("my_query="+JSON.stringify(my_query));
        var cta=document.getElementsByClassName("cta-wrapper"),inner_a;
        console.log("cta.length="+cta.length);
        if(cta.length>0) {
            console.log("cta[0].innerHTML="+cta[0].innerHTML);
            console.log("Clicking the button");
            inner_a=cta[0].getElementsByTagName("a");
            console.log("inner_a="+inner_a[0].href);
            setTimeout(function() { window.location.href=inner_a[0].href; }, 250);
        }
    }

       

    function do_att_internet() {
        GM_setValue("my_query","");
        document.cookie="";
        GM_addValueChangeListener("my_query",init_att);
    }

   
 


    function do_att_results() {
        var result=GM_getValue("result",{});

        var pB15=document.getElementsByClassName("pB15"), inner_a;
        if(result.done_availability) {
            console.log("## result.done_availability is true, stopping!"); }
        else if(pB15.length>0 && (inner_a=pB15[0].getElementsByTagName("a")).length>0) {
            setTimeout(function() { console.log("# clicking inner_a"); inner_a[0].click(); }, 500);
        }
         else if(my_query.temp_counter<80) {
            my_query.temp_counter++;
            setTimeout(do_att_results,250);
            return; }
        else {
            result.internet_offer="timeout error";
            GM_setValue("result",result);
            return; }
    }

    function do_att_availability() {
        var result=GM_getValue("result",{});
        my_query=GM_getValue("my_query");

        var zip=document.getElementById("zipcode"),street=document.getElementById("streetaddress");
        var btn=document.getElementsByClassName("ckavButton");
        setTimeout(function() {
            if(zip && street && btn.length>0) {
                console.log("#### Setting shit");

                zip.value=my_query.zip;
                street.value=my_query.street;
                console.log("zip.outerHTML="+zip.outerHTML);
                console.log("my_query.zip="+my_query.zip);
                result.done_availability=true;
                GM_setValue("result",result);
                //setTimeout(function() { console.log("# clicking ckavButton"); btn[0].click(); }, 1000);
            }
            else if(my_query.temp_counter<80) {
                my_query.temp_counter++;
                setTimeout(do_att_availability,250);
                return; }
            else {
                result.internet_offer="timeout error";
                GM_setValue("result",result);
                return; }
        },2500);

    }

    function do_att_begin() {
         my_query.temp_counter=0;

        console.log("# do_spectrum_begin "+window.location.href);
        if(window.location.href.indexOf("att.com/internet/internet-services.html")!==-1) do_att_internet();
        else if(window.location.href.indexOf("att.com/shop/unified/availability/results.html")!==-1) do_att_results();
        else if(/att\.com\/shop\/unified\/availability\.html$/.test(window.location.href)) do_att_availability();
        else if(window.location.href.indexOf("spectrum.com/buyflow/store-front")!==-1) {
            console.log("### trying store_front");
            try_store_front();

        }
        else if(window.location.href.indexOf("spectrum.com/buyflow/customize-your-order")!==-1) {
            console.log("try_customize");
            try_customize1();
        }
        else { console.log("in do_spectrum_begin, window.location.href="+window.location.href); }

    };

    if(window.location.href.indexOf("att.com")!==-1) {
        do_att_begin();

    }


})();