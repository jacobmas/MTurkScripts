// ==UserScript==
// @name         KronoPin
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
// @include http://www.wipo.int/branddb/en/
// @grant  GM_getValue
// @grant GM_setValue
// @grant unsafeWindow
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["facebook.com","linkedin.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
	return true;
    }
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

    function is_bad_url2(b_url)
    {
        var b_split=b_url.split("/");
        var len=b_split.length;
        if(len>=5) return true;
        else if(len>=4) {
            var splitlast=b_split[3].split(/[\-\+]/);
            if(splitlast.length>=3) return true;
        }
        return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption, lgb_info;
        var b1_success=false, b_header_search, b_context, b_entityTitle;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                //GM_setValue("returnHit",true);
                //return;
            }
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("SHWOO");
            if(lgb_info!==null)
            {
                console.log("Found lgb_info");
                b_url=lgb_info.getElementsByTagName("a")[0].href;
                b_name=lgb_info.getElementsByTagName("a")[0].textContent;
                if(!is_bad_url(b_url, bad_urls) && !is_bad_url2(b_url))
                {
                    console.log("Found url in lgb_info");
                     resolve(b_url.replace(/(https?:\/\/[^\/]*)\/.*$/,"$1"));
                    return;
                }
            }

            if(b_context!==null)
            {
                b_url="";
                b_entityTitle=b_context.getElementsByClassName("b_entityTitle");
                if(b_entityTitle.length>0)
                {
                    console.log("b_entityTitle[0]="+b_entityTitle[0].innerText);
                    var cbtn=b_context.getElementsByTagName("a")
                    for(i=0; i < cbtn.length; i++) {
                        if(cbtn[i].innerText==="Website" || cbtn[i].innerText==="Official site")
                        {
                            console.log("Found button");
                            b_url=cbtn[i].href; break;
                        }
                    }
                    if(!is_bad_url(b_url, bad_urls) && !is_bad_url2(b_url) && b_url.length>0)
                    {
                        resolve(b_url.replace(/(https?:\/\/[^\/]*)\/.*$/,"$1"));
                        return;
                    }
                }
            }
           
            for(i=0; i < b_algo.length && i < 3; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("b_url="+b_url);



                if(!is_bad_url(b_url, bad_urls) && !is_bad_url2(b_url))
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
            resolve(b_url.replace(/(https?:\/\/[^\/]*)\/.*$/,"$1"));
		/* Do shit */
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
     GM_setValue("returnHit",true);
        return;

    }
    function trademarkia_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var brand_re=/^(.*) is a trademark and brand of ([^\.]*)\.\s*filed\s+/i;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search, inner_p;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
               // GM_setValue("returnHit",true);
                //return;
            }

            for(i=0; i < b_algo.length && i < 4; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption")[0];
                inner_p=b_caption.getElementsByTagName("p");

                if(inner_p.length===0) continue;
                else inner_p=inner_p[0].innerText;
                inner_p=inner_p.replace(/Co\./i,"Company").replace(/Inc\./i,"Incorporated").replace(/L\.L\.C\.\./i,"LLC.");
                inner_p=inner_p.replace(/\.\./,".");
                console.log("inner_p="+inner_p);
                if(brand_re.test(inner_p))
                {
                    //console.log("inner_p="+inner_p.replace(/Co\./,"Company").replace(/Inc\./,"Incorporated"));
                    var brand_match=inner_p.replace(/Co\./,"Company").replace(/Inc\./,"Incorporated").match(brand_re);
                    console.log("brand_match="+JSON.stringify(brand_match));
                    my_query.brand1=brand_match[1];
                    my_query.owner=brand_match[2];
                    resolve("Success");
                    return;
                }
                else if(b_url.indexOf("trademarkia.com/company-")!==-1)
                {
                    var owner_re=/Page [\d]+ of the latest trademarks from (.*) from Trademarkia/;
                    if(owner_re.test(inner_p))
                    {
                        var owner_match=inner_p.match(owner_re);
                        console.log("owner_match="+JSON.stringify(owner_match));
                        my_query.owner=owner_match[1];

                        my_query.brand1=my_query.name;
                        resolve("Success");

                        return;
                    }
                }



            }


        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.tradeCount===0)
        {
            my_query.tradeCount++;
            console.log("Try "+my_query.tradeCount+" failed, trying without category");
            	var search_str=my_query.name+" site:trademarkia.com";
            query_search(search_str, resolve, reject, trademarkia_response);
            return;
        }
        else
        {

            reject("Nothing found");
        }
//        GM_setValue("returnHit",true);
        return;

    }


    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        console.log("Success with url="+url);
        document.getElementById("web_url").value=url;
        check_and_submit(check_function,automate);

    }

    function trade_promise_then(result) {
         var search_str=shorten_company_name(my_query.owner);
         const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning brand owner url search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });


    }

    function simulateKeyEvent(character, element) {
        console.log("Simulating "+character+" on "+element);
        var options={key: character.charAt(0), keyCode: character.charCodeAt(0), which: character.charCodeAt(0), bubbles: true};
        var evt = new KeyboardEvent("keypress",options);

        document.dispatchEvent(evt);
    }

    function fireKey(el,key)
    {
        var eventObj;
        if(document.createEventObject)
        {
            eventObj = document.createEventObject();
            eventObj.keyCode = key;
            el.fireEvent("onkeydown", eventObj);
            eventObj.keyCode = key;
        }else if(document.createEvent)
        {
            eventObj = document.createEvent("Events");
            eventObj.initEvent("keydown", true, true);
            eventObj.which = key;
            eventObj.keyCode = key;
            el.dispatchEvent(eventObj);
        }
    }

   

    function do_wipo1(my_query)
    {
        console.log("Doing wipo1, try_count="+my_query.try_count);
       //         document.getElementById("BRAND_input").focus();

       
       
        var i;
        document.getElementById("BRAND_input").value=my_query.name;
        if(my_query.try_count===0)
        {
            //document.getElementById("GS_ALL_input").focus();
            document.getElementById("GS_ALL_input").value=my_query.subcategory;
            for(i=0; i < 1;i++)
            {
                // simulateKeyEvent(my_query.name.charAt(i),document.getElementById("GS_ALL_input"));
                //fireKey(document.getElementById("GS_ALL_input"),my_query.name.charCodeAt(i));
            }
            // document.getElementById("GS_ALL_input").focus();
        }
        else
        {
            console.log("second try");
            document.getElementById("GS_ALL_input").value="";
        }
        unsafeWindow.$("#country_search").solrSearch("activate");
        document.getElementById("OO_input").value="US";



           
          
        if(my_query.try_count===0)
        {
            //document.getElementById("GS_ALL_input").focus();
            document.getElementById("GS_ALL_input").value=my_query.subcategory;
            for(i=0; i < 1;i++)
            {
                // simulateKeyEvent(my_query.name.charAt(i),document.getElementById("GS_ALL_input"));
                //fireKey(document.getElementById("GS_ALL_input"),my_query.name.charCodeAt(i));
            }
            // document.getElementById("GS_ALL_input").focus();
        }
        else
        {
            console.log("second try");
            document.getElementById("GS_ALL_input").value="";
        }
        //document.getElementById("GS_ALL_input").focus();

        var searchButton=document.getElementsByClassName("searchButton")[0];
        document.getElementById("tabForcountry_search").focus();
        document.getElementById("tabForcountry_search").click();
        document.getElementById("tabForcountry_search").click();

        setTimeout(function() { searchButton.click();
                               setTimeout(function() { do_wipo2(my_query); }, 2000);
                              }, 500);
           

    }

    function do_wipo2(my_query)
    {
        var the_tab=document.getElementById("gridForsearch_pane");
         var searchTrash=document.getElementsByClassName("searchTrash");
       // console.log("the_tab.innerHTML="+the_tab.innerHTML);
        if(the_tab===null || the_tab.rows.length<2)
        {
            console.log("Failed, the_tab is null");

            if(searchTrash.length>0)
            {
                console.log("Emptying trash");
                searchTrash[0].click();
            }
            do_bad_wipo(my_query);


        }
        var i;
        for(i=1; i < the_tab.rows.length; i++)
        {

            var my_cell=the_tab.rows[i].cells[11].innerText;
            console.log("my_cell["+i+"]="+my_cell[i]);
            if(!/US TM/.test(the_tab.rows[i].cells[7].innerText))
            {
                console.log("i="+i+", no us match");
                continue;
            }
            console.log("my_cell="+my_cell+"\t"+the_tab.rows[i].cells[6].innerText);
            var tab_brand=removeDiacritics(the_tab.rows[i].cells[6].innerText).toLowerCase().replace(/[\']/g,"").replace(/[\-]/g," ");
            if(tab_brand.indexOf(my_query.name.toLowerCase())===-1
               || my_query.name.toLowerCase().indexOf(tab_brand)===-1
              )
            {
                console.log("Not found right name");
                if(searchTrash.length>0)
                {
                    console.log("Emptying trash");
                    searchTrash[0].click();
                }

                continue;
            }

            GM_setValue("owner",my_cell);

            if(searchTrash.length>0)
            {
                console.log("Emptying trash");
                searchTrash[0].click();
            }
            return;
        }
        console.log("All failed");
        if(searchTrash.length>0)
        {
            console.log("Emptying trash");
            searchTrash[0].click();
        }
        do_bad_wipo(my_query);
        return;
    }

    function do_bad_wipo(my_query)
    {
        console.log("Doing bad wipo, my_query.try_count="+my_query.try_count);
        if(my_query.try_count<0)
            {
                my_query.try_count++;
                setTimeout(function() { do_wipo1(my_query) }, 0);
                return;
            }
            GM_setValue("owner","");
            return;
    }

    function shorten_company_name(name)
    {
        name=name.replace(/L\.P\.$/i,"");
        name=name.replace(/LLC\.?$/i,"");
        name=name.replace(/Inc\.?$/i,"");
        name=name.replace(/Incorporated$/i,"");
        name=name.replace(/,\s*$/,"");
        return name;

    }

    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:wT.rows[0].cells[1].innerText, category:wT.rows[1].cells[1].innerText.split(" ")[0],
                  subcategory: wT.rows[2].cells[1].innerText.split(" ")[0], tradeCount: 0};
        GM_setValue("owner","*#@");

       GM_addValueChangeListener("owner", function() {
            console.log("arguments="+arguments);
           my_query.owner=shorten_company_name(GM_getValue("owner"));
            if(my_query.owner.length===0)
            {
                console.log("Nothing found for owners");
                //GM_setValue("returnHit",true);
                return;
            }
            console.log("my_query.owner="+my_query.owner);
            var search_str=my_query.owner;
         const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning brand owner url search");
            query_search(search_str, resolve, reject, query_response);
        })
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        });
        GM_setValue("my_query",my_query);
	var search_str="+\""+my_query.name+"\" "+my_query.category+" site:trademarkia.com";
       const tradePromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
           query_search(search_str, resolve, reject, trademarkia_response);
        });
        tradePromise.then(trade_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





    }

    function do_tests()
    {
        console.log("unsafeWindow.$('#brand_search')="+JSON.stringify(unsafeWindow.$("#brand_search")));
        unsafeWindow.$("#brand_search").solrSearch("setValue","fuck");
        unsafeWindow.$("#brand_search").solrSearch("initialize");
console.log("rawsearch="+unsafeWindow.$("#brand_search").solrSearch("getRawSearchInput"));
       //  unsafeWindow.$("#country_search").solrSearch("setValue","US");
        unsafeWindow.$("#country_search").solrSearch("activate")
        console.log("getSearch="+JSON.stringify(unsafeWindow.$("#brand_search").solrSearch("getFieldSettings")));
        var items=unsafeWindow.$(".fieldAutoComplete");
        console.log("items.length="+items.length);
        var i;
        for(i=0; i < items.length; i++)
        {
            console.log("items["+i+"]="+items[i]);
        }
        var ui=unsafeWindow.$.ui;
        for(x in ui) console.log("ui["+x+"]="+ui[x]);
    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("wipo.int")!==-1)
    {
        var x;
       unsafeWindow.$("#brand_search").solrSearch("setValue","");
        unsafeWindow.$("#brand_search").solrSearch("initialize");

       //  unsafeWindow.$("#country_search").solrSearch("setValue","US");
        unsafeWindow.$("#country_search").solrSearch("activate")
        unsafeWindow.$("#country_search").solrSearch("setValue","");
     //   document.getElementById("OO_input").value="US";
       
           
           
        




//            unsafeWindow.solrTerm(search_pane);
            // var brand_inp=document.getElementById("BRAND_input");
          
          //  for(x in brand_inp) { console.log("brand_inp["+x+"]="+brand_inp[x]); }

           
      
        //brand_inp.onkeypress=function(e) { };
        //brand_inp.removeEventListener("keypress");


        GM_setValue("my_query","");
        GM_addValueChangeListener("my_query",function()
                                  {
            var my_query=GM_getValue("my_query");
            my_query.try_count=0;
            console.log("New query found, clicking trash");
            var searchTrash=document.getElementById("searchTrash");

            if(searchTrash!==null) searchTrash.click();
            setTimeout(function() { do_wipo1(my_query); },2000);
        });
    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */

       
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();