// ==UserScript==
// @name         AvCO
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://buy.spectrum.com*
// @include https://www.spectrum.com*
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
        GM_setValue("result","");
        GM_addValueChangeListener("result",function() {
            result=arguments[2];
            console.log("result="+JSON.stringify(result)); });
        setTimeout(function() {
        GM_setValue("my_query",my_query); }, 1000);
    }
    function init_spectrum() {
        my_query=arguments[2];
        console.log("my_query="+JSON.stringify(my_query));
        var loc_input=document.getElementsByClassName("localization__input"),submit=document.querySelector(".localization__input-submit");
        loc_input[0].value=my_query.street;
        loc_input[2].value=my_query.zip;
        setTimeout(function() { submit.click() }, 250);
    }
    function do_spectrum_internet() {
        GM_setValue("my_query","");
       // document.cookie="";
//        document.cooki
//        var x;
  //      for(x in document) { console.log("x="+x); }
        GM_addValueChangeListener("my_query",init_spectrum);
    }

    function do_spectrum_multadds() {
        console.log("### In do_spectrum_multadds");
        var form=document.getElementsByName("multipleAddressesForm"),btn;
       // console.log("### form.length="+form.length);
        if(form.length===0) { console.log("*** ERROR form length=0 ***"); return; }
        btn=form[0].getElementsByClassName("btn-primary");
        if(btn.length===0) { console.log("*** ERROR button length=0 ***"); return; }
        setTimeout(function() { btn[0].click() }, 1500);
    }
    /* clarify address */
    function do_spectrum_add_clar() {
        var btn=document.getElementById("prospect_view_offers");
        setTimeout(function() { btn.click(); },2500);
    }

    function do_spectrum_store_front() {
        console.log("### in do_spectrum_store_front");
        var result=GM_getValue("result",{}),i,j;
        if(result.internet_offered===undefined) do_spectrum_store_front1();

    }

    function do_spectrum_store_front1() {
        console.log("### In do_spectrum_store_front1");
        var result={internet_offered:"service unavailable",tv_offered:"TV No"},i,j,offer_button=null;
        var n_offer=document.getElementsByClassName("name-offer");
        var tit_prim=document.querySelector(".title-primaryOut");
        console.log("### n_offer.length="+n_offer.length+", tit_prim="+(tit_prim ? tit_prim.innerText : "null/undefined"));
        if(tit_prim && /Triple Play/.test(tit_prim.innerText)) {
            result.internet_offered="yes";
            result.tv_offered="TV Yes"; }
        for(i=0;i<n_offer.length; i++) {
            console.log("### n_offer["+i+"].innerText="+n_offer[i].innerText);
            if(/^Internet$/.test(n_offer[i].innerText.trim())) {
                console.log("Found internet");
                result.internet_offered="yes";
                console.log("parentNode.parentNode.outerHTML="+n_offer[i].parentNode.parentNode.outerHTML);
                offer_button=n_offer[i].parentNode.parentNode.querySelector("button");
            }
            if(/TV/.test(n_offer[i].innerText.trim())) result.tv_offered=true;
        }
        GM_setValue("result",result);
        console.log("offer_button="+(offer_button?offer_button.outerHTML : "null/undefined"));
        if(offer_button) { setTimeout(function() { offer_button.click(); }, 500); }
        return true;
    }
    function do_spectrum_customize1() {
        var result=GM_getValue("result",{});
        console.log("result="+JSON.stringify(result));
        var price=document.getElementsByClassName("price-block"),l_general=document.getElementsByClassName("l_general")[0];
        var match,good_child=l_general.children[0];
        if(price.length>0) result.internet_price=price[0].innerText.replace(/\$/g,"");
        match=good_child.innerText.match(/([\d]+)\s*(.*)$/);
        console.log("match="+JSON.stringify(match));
        if(match)
        {
            result.internet_plan_speed=parseInt(match[1]);
            if(/Gbps/i.test(match[2])) result.internet_plan_speed*=1000;
        }
        GM_setValue("result",result);
        setTimeout(function() { window.history.go(-1)}, 500);


    }

    /* Attempt store_front see if it's loaded */
    function try_mult_adds() {
        var result=GM_getValue("result",{}),form;
        if((form=document.getElementsByName("multipleAddressesForm")).length>0 &&
           form[0].getElementsByClassName("btn-primary").length>0 && do_spectrum_multadds()) return true;
        else if(my_query.temp_counter++<80) {
            setTimeout(try_mult_adds,250);
            return; }
        else {
            result.internet_offer="timeout error";
            GM_setValue("result",result);
            return; }
    }
    function try_add_clar() {
        var result=GM_getValue("result",{}),form;
        if(document.getElementById("prospect_view_offers") && do_spectrum_add_clar()) return true;
        else if(my_query.temp_counter++<80) {
            setTimeout(try_add_clar,250);
            return; }
        else {
            result.internet_offer="timeout error";
            GM_setValue("result",result);
            return; }
    }

    function try_customize1()    {
        var result=GM_getValue("result",{}),form;
        if(document.getElementsByClassName("price-block").length>0 && document.getElementsByClassName("l_general").length>0
           && do_spectrum_customize1()) return true;
        else if(my_query.temp_counter++<80) {
            setTimeout(try_customize1,250);
            return; }
        else {
            result.internet_offer="timeout error";
            GM_setValue("result",result);
            return; }
    }


    /* Attempt store_front see if it's loaded */
    function try_store_front() {
        var result=GM_getValue("result",{});
        if(document.getElementsByClassName("name-offer").length>0 && do_spectrum_store_front1()) return true;
        else if(my_query.temp_counter<80) {
            my_query.temp_counter++;
            setTimeout(try_store_front,250);
            return; }
        else {
            result.internet_offer="timeout error";
            GM_setValue("result",result);
            return; }
    }

    function do_spectrum_begin() {
         my_query.temp_counter=0;
        console.log("# do_spectrum_begin "+window.location.href);
        if(window.location.href.indexOf("spectrum.com/internet.html")!==-1) do_spectrum_internet();
        else if(window.location.href.indexOf("spectrum.com/buyflow/multiple-addresses")!==-1) try_mult_adds();
        else if(window.location.href.indexOf("spectrum.com/buyflow/address-clarification")!==-1) try_add_clar();
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

    if(window.location.href.indexOf("spectrum.com")!==-1) {
        do_spectrum_begin();

    }

})();