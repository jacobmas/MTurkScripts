// ==UserScript==
// @name         MonicaDorsey
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*facebook.com/*
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
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
	return true;
    }

    function is_bad_email(email)
    {
        if(email.indexOf("@example.com")!==-1 || email.indexOf("@email.com")!==-1 || email.indexOf("@domain.com")!==-1) return true;
        return false;
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
        if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase().split(" ")[0])===-1) return true;
	return false;
    }

    function query_response(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in email_response");
        var email_match=doc.body.innerText.match(email_re);
        if(email_match!==null )
        {

             if(!is_bad_email(email_match[0]) && !my_query.submitted)
             {
                 my_query.submitted=true;
                document.getElementById("email").value=email_match[0];

                check_and_submit(check_function,automate);
                return;
             }
        }
//        GM_setValue("returnHit",true);
        return;

    }

    function fb_response(response,resolve,reject) {
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
                GM_setValue("returnHit",true);
                return;
            }

            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                if(b_algo[i].getElementsByClassName("b_caption")[0]!==undefined)
                    b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;



                if( !is_bad_name(b_name) && b_url.indexOf("/public/")===-1)
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
    function fb_promise_then(url) {
        my_query.fb_url=url;
        my_query.fb_url=my_query.fb_url.replace(/(https?:\/\/[^\/]*\/[^\/]*).*$/,"$1/about/?ref=page_internal")
        console.log("my_query.fb_url="+my_query.fb_url);
        GM_setValue("fb_url",my_query.fb_url);
    }



    function do_FB()
    {
        var i;
        var result={};
        
        console.log("Doing facebook");
        var wrappers=document.getElementsByClassName("_50f4");
        for(i=0; i < wrappers.length; i++)
        {
            console.log("wrappers["+i+"].innerText="+wrappers[i].innerText);
            if(email_re.test(wrappers[i].innerText))
            {
                console.log("found email in "+wrappers[i].innerText);
                var email_match=wrappers[i].innerText.match(email_re);
                result.email=email_match[0];
                GM_setValue("result",result);
                return;
            }
        }

        console.log("NO email found");

        GM_setValue("result",result);




    }

    function init_Query()
    {

        var i;
       var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        my_query={name: wT.rows[0].cells[1].innerText, url: wT.rows[1].cells[1].innerText,
                  fb_url: wT.rows[2].cells[1].innerText, submitted: false};



        GM_xmlhttpRequest({
            method: 'GET',
            url:    "http://"+my_query.url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             query_response(response);
            },
            onerror: function(response) { console.log("error: response="+JSON.stringify(response)); },
            ontimeout: function(response) {  }


            });
        GM_setValue("result","");
        GM_addValueChangeListener("result",function() {
            var result=GM_getValue("result");
            console.log("result="+JSON.stringify(result));
            console.log("my_query.submitted="+my_query.submitted);
            if(result.email!==undefined && !my_query.submitted)
            {

                my_query.submitted=true;
                document.getElementById("email").value=result.email;
                check_and_submit(check_function,automate);
                return;
            }
            else if(!my_query.submitted)
            {
                console.log("No email found");
               
            }
        });
        if(my_query.fb_url.length>0)
        {
            console.log("my_query.fb_url=("+my_query.fb_url+")");
            GM_setValue("fb_url",my_query.fb_url+"/about/?ref=page_internal");
        }
        else
        {

            console.log("NO fb url");
            var search_str=my_query.name+" site:facebook.com";
            const fbPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, fb_response);
            });
            fbPromise.then(fb_promise_then
                             )
                .catch(function(val) {
                console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });
        }






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
    else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        GM_setValue("fb_url","");
        GM_addValueChangeListener("fb_url",function() {
            var url=GM_getValue("fb_url");
            window.location.href=url;
        });
        setTimeout(do_FB, 1500);
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
                }, 15000);
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