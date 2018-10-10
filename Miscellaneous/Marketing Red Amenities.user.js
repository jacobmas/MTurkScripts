// ==UserScript==
// @name         Marketing Red Amenities
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.allstays.com/*
// @include https://allstays.com/*
// @include http://*.rvparkreviews.com/*
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
    var bad_urls=["rvparkreviews.com","allstays.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
        
        return true;
    }
    function check_and_submit(check_function, automate)
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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
        }
    }

    function is_bad_url2(url, bad_urls)
    {
        if(
          url.indexOf("/Campgrounds-details/")===-1) return true;
        return false;
    }
    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                query_search2(resolve, reject);

            }

            for(i=0; i < b_algo.length && i < 1; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                var test_re=/http:\/\/www\.rvparkreviews\.com\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+/;
                if(test_re.test(b_url) && b_name.toLowerCase().indexOf(my_query.first)!==-1)
                {
                    console.log("resolving on b_url="+b_url);
                    resolve(b_url);
                    return;

                }

            }
            
           /* if(!found_url)
            {
                document.getElementById("UrlBad").checked=true;
                check_and_submit();
                b1_success=true;
                return;
            }*/

          //GM_setValue("returnHit",true);
            //return;

        }
        catch(error)
        {
	    console.log("Error "+error);
	    GM_setValue("returnHit",true);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        console.log("None found on rv, trying allstays");
        query_search2(resolve, reject);
        return;

    }

     function query_response2(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response2\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }

            for(i=0; i < b_algo.length && i < 1; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
//                var test_re=/http:\/\/www\.rvparkreviews\.com\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+/;
                if(b_name.toLowerCase().indexOf(my_query.first)!==-1)
                {
                    console.log("resolving on b_url="+b_url);
                    resolve(b_url);
                    return;

                }

            }

           /* if(!found_url)
            {
                document.getElementById("UrlBad").checked=true;
                check_and_submit();
                b1_success=true;
                return;
            }*/

          //GM_setValue("returnHit",true);
            //return;

        }
        catch(error)
        {
	    console.log("Error "+error);
	    GM_setValue("returnHit",true);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        console.log("None found");
        GM_setValue("returnHit",true);
        return;

    }


    function query_search(resolve,reject) {
        var search_str=my_query.name+" "+my_query.state+" site:rvparkreviews.com";

        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             query_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    function query_search2(resolve,reject) {
        var search_str=my_query.name+" "+my_query.state+" site:allstays.com";

        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             query_response2(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {

        GM_setValue("result","");
        GM_addValueChangeListener("result",function() {
            var result=JSON.parse(GM_getValue("result"));
            console.log("result="+JSON.stringify(result));
            var i;
            if(result.url.length===0) { GM_setValue("returnHit",true); return; }
            document.getElementById("web_url").value=result.url;
            for(i=0; i < result.list.length; i++)
            {

                document.getElementsByName("Amenities"+result.list[i])[0].checked=true;
            }
            check_and_submit(check_function,automate);
        });
        console.log("url="+url);
        GM_setValue("url",url);




    }





    function init_Query()
    {

        document.getElementsByName("Amenities")[0].name="Amenities32";
       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        console.log("SHROO");
        var first=wT.rows[0].cells[1].innerText.split(" ")[0];
        my_query={name: wT.rows[0].cells[1].innerText, first: first.toLowerCase(), city: wT.rows[1].cells[1].innerText, state: wT.rows[3].cells[1].innerText};

 console.log("Started query");
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(resolve, reject);
        });

        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





    }

    function do_allstays()
    {
        console.log("Doing allstays");
        var result={list:[], url:""};
        var amp30_re=/30.*amp/;
        var amp50_re=/50.*amp/;

        var colmd5=document.getElementsByClassName("col-md-5");
        var the_span,i,curr_attr;
        if(colmd5.length==0)
        {
            console.log("Fail");


            return;
        }
        the_span=colmd5[0].getElementsByTagName("span");
        var the_a=colmd5[0].getElementsByTagName("a");
        var desc="";
        var j;
        for(i=0; i < the_a.length; i++)
        {
            curr_attr=the_a[i].getAttribute('itemprop');
            if(curr_attr==="url" && the_a[i].href.indexOf("allstays.com")===-1
              && the_a[i].href.length>0) result.url=the_a[i].href;
        }
        for(i=0; i < the_span.length; i++)
        {
            curr_attr=the_span[i].getAttribute('itemprop');
            if(curr_attr==="description")
            {
                desc=the_span[i].innerText;
                var desc_list=desc.split(",");
                for(j=0; j < desc_list.length; j++)
                {
                    if(desc_list[j].indexOf(" Tents")!==-1) result.list.push(14);
                    if(desc_list[j].indexOf(" electric")!==-1) result.list.push(6);
                    if(desc_list[j].indexOf("toilet")!==-1) result.list.push(5);
                    if(desc_list[j].indexOf("showers")!==-1) result.list.push(7);
                    if(desc_list[j].indexOf("dump")!==-1) result.list.push(11);
                    if(desc_list[j].indexOf("pull thru")!==-1) result.list.push(1);
                    if(desc_list[j].indexOf("fish")!==-1) result.list.push(13);
                    if(desc_list[j].indexOf("trail")!==-1) result.list.push(24);
                    if(desc_list[j].indexOf("hike")!==-1) result.list.push(24);
                    if(desc_list[j].indexOf("full hookup")!==-1) result.list.push(0);
                    if(desc_list[j].indexOf("firewood")!==-1) result.list.push(20);
                    if(desc_list[j].indexOf("propane")!==-1) result.list.push(21);
                    if(desc_list[j].indexOf("cabin")!==-1) result.list.push(22);
                    if(desc_list[j].indexOf("boat launch")!==-1) result.list.push(26);
                    if(desc_list[j].indexOf("pet friendly")!==-1) result.list.push(8);
                    if(desc_list[j].indexOf("horses")!==-1) result.list.push(32);
                    if(desc_list[j].indexOf(" elec-water")!==-1) {
                        result.list.push(6); result.list.push(4);
                    }
                    if(amp30_re.test(desc_list[j])) result.list.push(3);
                    if(amp50_re.test(desc_list[j])) result.list.push(2);

                }

            }
        }
        console.log("result.list="+JSON.stringify(result.list));
        GM_setValue("result",JSON.stringify(result));
    }

    function do_rvparkreviews()
    {
        console.log("Doing rvparkreviews");
        var rv_map={"cg_full_hookup": 0, "cg_pullthru": 1, "cg_50amp": 2, "cg_electric": 3, "cg_water": 4,
                    "cg_restrooms": 5, "cg_showers": 7, "cg_pets": 8, "cg_wifi": 9, "cg_laundry": 10,
                    "cg_dump_station": 11, "cg_pool": 12, "cg_fishing": 13, "cg_tents": 14, "cg_store": 15,
                    "cg_rec_room": 16, "cg_catv": 17, "cg_55_plus": 18, "cg_picnic_shelter": 19,
                   "cg_firewood": 20, "cg_propane": 21, "cg_cabins_cottages": 22, "cg_walking_trails": 24,
                   "cg_lake": 26, "cg_minigolf": 29, "cg_marina": 30, "cg_cafe_snackbar": 31, "cg_corral": 32};
        // 6 is either cg_50_amp or cg_electric

        var result={list: [], url:""};
        if(document.getElementsByClassName("btn-warning").length>0)
        {
            result.url=document.getElementsByClassName("btn-warning")[0].href.replace(/\?.*$/,"");
        }
        var x;
        for(x in rv_map)
        {
            console.log("x="+x);
            var temp_id=document.getElementById(x);
            if(temp_id!==null && temp_id!==undefined && temp_id.getElementsByClassName("badge-answer-yes").length>0)
            {
                console.log("\tFound it");
                result.list.push(rv_map[x]);
                if(x==="cg_electric" || x==="cg_50amp") result.list.push(6);
            }
            else console.log("\tDid not find it");
        }

        GM_setValue("result",JSON.stringify(result));



    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") != -1 || window.location.href.indexOf("amazonaws.com") != -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("rvparkreviews.com")!==-1)
    {
        GM_setValue("url","");
        GM_addValueChangeListener("url",function() {
            if(GM_getValue("url").indexOf("rvparkreviews.com")!==-1) {
                window.location.href=GM_getValue("url");
            }
        });
        setTimeout(do_rvparkreviews,200);
    }
    else if(window.location.href.indexOf("allstays.com")!==-1)
    {
        GM_setValue("url","");
        GM_addValueChangeListener("url",function() {
            if(GM_getValue("url").indexOf("allstays.com")!==-1) {
                window.location.href=GM_getValue("url");
            }
        });
        setTimeout(do_allstays,200);
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