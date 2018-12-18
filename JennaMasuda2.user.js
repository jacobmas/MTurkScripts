// ==UserScript==
// @name         JennaMasuda2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  do Bloomberg stuff
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.bloomberg.com/*
// @include https://www.manta.com/*
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
// @resource shortcodes https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/short_codes.json
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var mantaID=-1;
    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;
    var naics_codes={};

    function check_function()
    {
        if(document.getElementsByName("Industry")[0].value==="N/A" ||
           document.getElementsByName("Sub-Industry")[0].value==="N/A" ||
          document.getElementsByName("Industry")[0].value==="United States" ||
          state_map[document.getElementsByName("Industry")[0].value]!==undefined ||
           document.getElementsByName("Industry")[0].value.length===0
          )
        {
            return false;
        }
        return true;
    }
    function check_and_submit(result)
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



 /*   function manta_response(response,resolve,reject) {
        var result;
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

            }

            for(i=0; i < b_algo.length; i++)
            {

                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		//b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;

                console.log("MOO");
                if(true)
                {
                     console.log("BLOO");
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                var the_split="";
                var my_crumb=b_algo[i].getElementsByClassName("sb_crmb");
                if(my_crumb.length>0)
                {
                    result={url: b_url, industry:"N/A", sub_industry:"N/A"};
                    the_split=my_crumb[0].innerText.split(" › ");
                    var len=the_split.length;
                    if(len>=1 && !/…|(www\.manta\.com)/.test(the_split[len-1]))
                    {
                        result.sub_industry=the_split[len-1].trim();
                        if(len>=2 && !/…|(www\.manta\.com)/.test(the_split[len-2]))
                        {
                            result.industry=the_split[len-2].trim();
                        }
                        else
                        {
                            result.industry=result.sub_industry;
                        }
                    }
                    add_to_sheet(result,"manta");
                    console.log("Done manta "+JSON.stringify(result)+"\t"+JSON.stringify(the_split));
                    my_query.doneManta=true;
                    if(my_query.doneBloomberg && my_query.doneManta && !my_query.submitted)
                    {
                        my_query.submitted=true;
                        check_and_submit(check_function,automate);
                    }
                    return;
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

        console.log("Nothing found");

        result={url: "http://www.na.com", industry:"N/A", sub_industry:"N/A"};
        add_to_sheet(result,"manta");
        my_query.doneManta=true;
        if(my_query.doneBloomberg && my_query.doneManta && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function,automate);
        }
        //        GM_setValue("returnHit",true);
        return;


    }
        */

     function manta_response(response,resolve,reject) {
        var result;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in manta_response\n"+response.finalUrl);
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

            }

            for(i=0; i < b_algo.length; i++)
            {

                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		//b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;
                console.log("b_name="+b_name);

                if(b_url.indexOf("manta.com/c/")!==-1 || b_url.indexOf("manta.com/ic/")!==-1 || b_url.indexOf("manta.com/mb")!==-1)
                {

                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
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

        console.log("Nothing found");
        result={url: "", industry:"",sub_industry:"", success:false,name:"",};
        add_to_sheet(result);
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(result);
        }
        return;


    }

     function manta_promise_then(url) {
        console.log("In manta_promise_then, url="+url);
        if(mantaID===-1)
        {
            GM_setValue("manta_result","");
            mantaID=GM_addValueChangeListener("manta_result",function() {

                var result=arguments[2];
                console.log("Setting sheet,");

                add_to_sheet(result);
                console.log("Done successful manta");
                my_query.doneManta=true;

                if(!my_query.submitted)
                {
                    my_query.submitted=true;
                    check_and_submit(result);
                }
            });
            console.log("\n**** mantaID="+mantaID+"  *****\n\n");

        }
        GM_setValue("manta_url",url);

        console.log("Url set");

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
               
            }
           
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		//b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;

                console.log("MOO");
                if(true)
                {
                     console.log("BLOO");
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

        console.log("Nothing found");
        if(my_query.queryCount===0 && my_query.domain.length>0)
        {
            my_query.queryCount++;
            var search_str=""+shorten_company_name(my_query.name)+" site:bloomberg.com/profiles/companies";
            query_search(search_str, resolve, reject, query_response);
            return;
        }

        else
        {

            var result={url: "http://www.na.com", industry:"N/A", sub_industry:"N/A"};
            add_to_sheet(result);
            my_query.doneBloomberg=true;
            if(my_query.doneBloomberg && my_query.doneManta && !my_query.submitted)
            {
                my_query.submitted=true;
                check_and_submit(result);
            }
            
            //        GM_setValue("returnHit",true);
            return;
        }

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

    function add_to_sheet(result,source)
    {
        if(((source!==undefined && source==="manta") || result.industry==="N/A") && document.getElementsByName("Industry")[0].value.length>0) return;
        else if(result.industry==="N/A")
        {
            console.log("industry is N/A, value="+document.getElementsByName("Industry")[0].value+", length="+document.getElementsByName("Industry")[0].value.length);
        }
        if(!my_query.doneGood)
        {
            document.getElementsByName("Industry")[0].value=result.industry;
            document.getElementsByName("Sub-Industry")[0].value=result.sub_industry;
            document.getElementsByName("Website Found in")[0].value=result.url;
        }
        if(result.good!==undefined && result.good)
        {
            my_query.doneGood=true;
        }
    }

    function do_mbmanta()
    {
        var result={name:"NOT FOUND", url: window.location.href, industry:"",sub_industry:"", success:false};
        console.log("Doing mbmanta");
        var i;
        var itempropnames=document.querySelectorAll('[itemprop="name"]');
        for(i=0; i < itempropnames.length; i++)
        {
            console.log("("+i+"), "+ itempropnames[i].innerText);
            if((itempropnames[i].innerText.toLowerCase().indexOf(shorten_company_name(my_query.name.replace(/\'/g,"")).toLowerCase())!==-1 ||
                shorten_company_name(my_query.name.replace(/\'/g,"")).toLowerCase().indexOf(itempropnames[i].innerText.toLowerCase())!==-1)
               && itempropnames[i].href!==undefined)
            {
                window.location.href=itempropnames[i].href.replace(/https?:\/\/[^\/]*\//,"https://www.manta.com/");
                return;
            }
        }
        GM_setValue("manta_result",result);
        return;

    }

    function do_manta()
    {
        console.log("Doing manta at "+window.location.href);
         var result={name:"NOT FOUND", url: window.location.href, industry:"",sub_industry:""};
       /* try
        {*/
        var name="NOT FOUND";
        var naics_val=document.querySelector('[itemprop="naics"]');
        var nameEl=document.querySelector('[itemprop="name"]');
        if(nameEl!==undefined && nameEl!==null) name=nameEl.innerText;
        var isic_val=document.querySelector('[itemprop="isicV4"]');


        if(naics_val!==null && naics_val!==undefined)
        {
            naics_val=naics_val.innerText;

            var industry_code=naics_val.substr(0,2);
            var subindustry_code=naics_val.substr(0,5);
            if(naics_codes[industry_code].part_of_range!==undefined)
            {
                industry_code=naics_codes[industry_code].part_of_range;
            }
            result.name=name;
            result.industry=naics_codes[industry_code].title;
            if(naics_codes[subindustry_code]===undefined)
            {
                subindustry_code=subindustry_code.substr(0,4);
            }
            result.sub_industry=naics_codes[subindustry_code].title;
            result.success=true;
        console.log("Setting value of manta_result");
            GM_setValue("manta_result",result);
            return;
        }
        else if(isic_val!==null && isic_val!==undefined)
        {
            result.name=name;
            var my_ind=isic_val.parentNode.innerText.replace(/^[\d]+,\s*/,"");
            result.industry=my_ind;
            result.sub_industry=my_ind;
            result.success=true;
            console.log("Setting value of manta_result");
            GM_setValue("manta_result",result);
            return;
        }
        else
        {
            result.url="";
            result.success=false;
            result.name=name;
            GM_setValue("manta_result",result);
            return;
        }


       // }
       // catch(error) { console.log("error="+JSON.stringify(error)); }
        //GM_setValue("manta_result",result);
    }


    function query_promise_then(url) {
        GM_setValue("bloom_result","");
        GM_addValueChangeListener("bloom_result",function() {
            console.log("arguments="+JSON.stringify(arguments));
            var result=GM_getValue("bloom_result");
            add_to_sheet(result,"bloomberg");

            console.log("Done successful query");
            my_query.doneBloomberg=true;
            if(my_query.doneBloomberg && my_query.doneManta && !my_query.submitted)
            {
                my_query.submitted=true;
                check_and_submit(result);
            }
        });
        GM_setValue("bloom_url",url);


    }



     function shorten_company_name(name)
    {
        name=name.replace(/L\.P\.$/i,"");
        name=name.replace(/LLC\.?$/i,"");
        name=name.replace(/Inc\.?$/i,"");
        name=name.replace(/Ltd\.?$/i,"");
        name=name.replace(/\s+\-\s+.*$/i,"");

        return name.replace(/,$/i,"");

    }


    function do_bloomberg()
    {
        var result={url: window.location.href, industry:"",sub_industry:""};
        console.log("Doing bloomberg");
        var good_name=false;
        var name;
        try
        {
           // name=document.getElementsByClassName("name")[0].innerText;

            result.industry=document.getElementsByClassName("industry")[0].innerText.replace(/^Industry:\s*/,"");
            result.sub_industry=document.getElementsByClassName("sub_industry")[0].innerText.replace(/^Sub\-Industry:\s*/,"");
            var website=document.getElementsByClassName("website");
            if(website.length===0 || my_query.domain.length===0 || my_query.domain==="0" || website[0].getElementsByTagName("a")[0].href.toLowerCase().indexOf(my_query.domain.toLowerCase())!==-1

              && result.industry!==undefined && result.industry!=="-")
            {
                console.log("Setting good bloom result");
                result.good=true;
                GM_setValue("bloom_result",result);
                return;
            }
            else
            {
                result={url:"http://www.na.com",industry:"N/A",sub_industry:"N/A"};
                GM_setValue("bloom_result",result);
                return;
            }
        }
        catch(error)
        {
            console.log("Bloomberg error "+error);
        }
        result={url:"http://www.na.com",industry:"N/A",sub_industry:"N/A"};
                GM_setValue("bloom_result",result);
                return;
    }



    function init_Query()
    {

        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name: wT.rows[1].cells[1].innerText, domain: get_domain_only(wT.rows[3].cells[1].innerText), queryCount:0, doneBloomberg: false,
                  doneManta: false, doneGood: false, submitted: false
                };
        if(my_query.domain===0) my_query.domain="";
        automate=GM_getValue("automate");
        GM_setValue("my_query",my_query);
        GM_setValue("TOSVFail","");
        GM_addValueChangeListener("TOSVFail",function() { alert("TOSV Fail for "+GM_getValue("TOSVFail")); });
        GM_addValueChangeListener("automate", function() { automate=GM_getValue("automate"); });
	var search_str;

        if(my_query.domain.length>0 && my_query.domain!=="0")
        {
            search_str="+\""+my_query.domain+"\" site:bloomberg.com/profiles/companies";
        }
        else
        {
            search_str=""+shorten_company_name(my_query.name)+" site:bloomberg.com/profiles/companies";
        }
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

        const mantaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" site:manta.com", resolve, reject, manta_response);
        });
        mantaPromise.then(manta_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this mantaPromise " + val); GM_setValue("returnHit",true); });





    }

    var bob=GM_getResourceText("shortcodes");
   // console.log("naics_codes="+bob);
    naics_codes=JSON.parse(bob);

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
    else if(window.location.href.indexOf("bloomberg.com")!==-1)
    {
        my_query=GM_getValue("my_query");
        if(window.location.href.indexOf("tosv.html")!==-1)
        {

            setTimeout(function() {
                GM_setValue("automate",false);
                 GM_setValue("TOSVFail","Bloomberg");
                alert("TOSV page");
            },5000);



        }
        GM_setValue("bloom_url","");
        GM_addValueChangeListener("bloom_url", function() { var url=GM_getValue("bloom_url"); window.location.href=url; });
        do_bloomberg();
    }
    else if(window.location.href.indexOf("www.manta.com")!==-1)
    {
        my_query=GM_getValue("my_query");
        GM_setValue("manta_url","");
        GM_addValueChangeListener("manta_url", function() { var url=arguments[2]; window.location.href=url; });
        if(window.location.href.indexOf("manta.com/c")!==-1 || window.location.href.indexOf("manta.com/ic")!==-1)
        {
            setTimeout(do_manta,1200);
        }
        else if(window.location.href.indexOf("manta.com/mb")!==-1)
        {
            setTimeout(do_mbmanta,1200);
        }
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
        try
        {
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
        }
        catch(error) { console.log("Error "+error); }
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