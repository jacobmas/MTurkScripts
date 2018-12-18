// ==UserScript==
// @name        EricGonzalez
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Do Careers
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;
    var career_regex=/((Career)|(Careers)|(Job)|(Employment)|(Join Our Team)|(Openings)|(^Recruitment)|(^Recrutement))/i;
    var pages=["/careers"];
    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var job_domains=["talentnest.com","paylocity.com","adp.com","myworkdayjobs.com","applicantpro.com","icims.com"];
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

    function check_if_bad(doc,response)
    {
        var h2=doc.getElementsByTagName("h2");
        var i;
        for(i=0; i < h2.length; i++) {
            if(/403 - Forbidden/.test(h2[i].innerText))
            {
                console.log("403 - Forbidden");
                return true;
            }
            else if(/Error 404/.test(h2[i].innerText)) { console.log("Error 404"); return true; }
        }


        if(response.finalUrl.indexOf("unavailable.html")!==-1)
        {
            console.log("unavailable.html");

            return true;
        }
        if(doc.body.innerHTML.length<25)
        {
            console.log("No real body");
            return true;
        }
        else
        {
            console.log("doc.body.innerHTML.length="+doc.body.innerHTML.length);
        }
        return false;
    }

    function find_career_page(response) {
        var i;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in find_career_page\n"+response.finalUrl);

        var begin_url=response.finalUrl.replace(/(https?:\/\/[^\/]+)\/?.*$/,"$1");
        var links=doc.links;
        my_query.career_url="";
        if(check_if_bad(doc, response))
        {
            setNoLoad();
            return;
        }
        try
        {
            for(i=0; i < links.length; i++)
            {
                if(links[i].href.indexOf("www.mturk.com")!==-1) continue;
                links[i].href=links[i].href.replace(/https:\/\/www\.mturkcontent\.com(\/dynamic)?/,begin_url);
                console.log("links["+i+"].href="+links[i].href+"\t.innerText="+links[i].innerText);

                if(career_regex.test(links[i].innerText.trim()))
                {
                    console.log("Career found at "+i+": '"+links[i].href+"'");
                    document.getElementById("CareerPageURL").value=links[i].href;
                    my_query.career_url=links[i].href;
                    break;

                }
            }
            if(my_query.career_url!=="")
            {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    my_query.career_url,

                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        parse_career_page(response);
                    },
                    onerror: function(response) { console.log("Fail"); },
                    ontimeout: function(response) { console.log("Fail"); }


                });
                return;
            }
        
        }
        catch(error)
        {
            console.log("Error "+error);
	   
            return;
        }
        console.log("No career page found");
        document.getElementsByName("Missing Webpages")[0].checked=true;
            //reject(JSON.stringify({error: true, errorText: error}));
      

    }

    function parse_career_page(response) {
        var i,j;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var iframes=doc.getElementsByTagName("iframe");
        console.log("in parse_career_page\n"+response.finalUrl);
        var src;
        var good_url="";

        var amount_vacancies=doc.getElementsByClassName("amount-of-vacancies");
        if(amount_vacancies.length>0) { document.getElementById("NumberofJobs").value=amount_vacancies[0].innerText; }
        for(i=0; i < iframes.length; i++) {
            src=iframes[i].getAttribute("src");
            console.log("src="+src);
            for(j=0; j < job_domains.length; j++)
            {
                if(src!==undefined && src.toLowerCase().indexOf(job_domains[j])!==-1)
                {
                    console.log("Found good src='"+src+"'");
                }
            }
        }
        var links=doc.links;
        var found_good=false;
        for(i=0; i < links.length; i++)
        {
           for(j=0; j < job_domains.length; j++)
            {
                if(links[i].href.indexOf(job_domains[j])!==-1)
                {
                    console.log("Found good href='"+links[i].href+"'");
                    good_url=links[i].href;
                    found_good=true;
                    break;
                }

            }
            if(found_good) break;
        }
        if(found_good)
        {
            if(/icims\.com/.test(good_url))
            {
                good_url=good_url.replace(/(https?:\/\/[^\/]+)\/?.*$/,"$1/jobs/search?ss=1");
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url:    good_url,

                onload: function(response) {
                    //   console.log("On load in crunch_response");
                    //    crunch_response(response, resolve, reject);
                    var final=response.finalUrl;
                    if(/icims\.com/.test(final))
                    {
                        parse_icims(response);
                    }
                    else
                    {
                        console.log("No parser written for "+response.finalUrl+" yet");
                    }
                },
                onerror: function(response) { console.log("Fail at "+good_url); },
                ontimeout: function(response) { console.log("Fail at "+good_url); }


            });
        }
       // console.log(doc.body.innerHTML);
    }

    function parse_icims(response)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_icims\n"+response.finalUrl);
        console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var paging=doc.getElementsByClassName("iCIMS_PagingBatch");
        if(paging.length>0)
        {
            console.log("paging[0]="+paging[0].innerHTML);
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

    /* Following the finding the district stuff */
    function query_promise_then(result) {


    }


    function setNoLoad()
    {
        document.getElementsByName("Missing Webpages")[1].checked=true;
    }


    function init_Query()
    {
        var dont_break=document.getElementsByClassName("dont-break-out");
       //var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={url:dont_break[0].href};

	var search_str;

        GM_xmlhttpRequest({
            method: 'GET',
            url:    my_query.url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             find_career_page(response);
            },
            onerror: function(response) { console.log("Fail"); setNoLoad(); },
            ontimeout: function(response) { console.log("Fail"); setNoLoad(); }


            });
        /*const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/





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