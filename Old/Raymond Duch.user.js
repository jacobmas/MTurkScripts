// ==UserScript==
// @name         Raymond Duch
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Script for raymond Duch
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://mbasic.facebook.com/
// @include
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=false;
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
    var language_list=["English","Spanish","Chinese - Mandarin","Chinese - Cantonese","Chinese","TagalogFilipino","Vietnamese",
                       "Arabic","French","Korean","Russian","Haitian Creole","Hindi","Portugese","Italian","Polish","Urdu",
                       "Japanese","Persian - Farsi", "Persian - Dari", "Persian", "Gujarati", "Punjabi", "Tamil", "Armenian",
                       "Serbian", "Montenegrin","Croatian", "Bosnian", "Hebrew", "Yiddish", "Hmong", "Bantu", "Swahili", "Khmer",
                       "Navajo", "Sign Language"];

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


	if(automate)
	{
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
	}
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
                GM_setValue("returnHit",true);
                return;
            }
           
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;


                if(!is_bad_url(b_url, bad_urls))
                {
                    document.getElementById("webpage_url").value=b_url;
                    check_and_submit(check_function);
                    return;

                }
                
            }
            return;
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
        GM_setValue("returnHit",true);
        return;

    }

    function query_search(resolve,reject) {
        var search_str=my_query.name+" ";

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

    /* Following the finding the district stuff */
    function query_promise_then(to_parse) {

        var search_str, search_result=JSON.parse(to_parse);
        console.log("search_result="+to_parse);
       

    }



    // a and b are javascript Date objects
    function getAgeRange(birth_date) {
        var curr_date=new Date();
        var years=curr_date.getFullYear()-birth_date.getFullYear();
        if(birth_date.getMonth() > curr_date.getMonth() ||
           (birth_date.getMonth() === curr_date.getMonth() && birth_date.getDate()>curr_date.getDate()))
        {
            years=years-1;
        }
        if(years<18)
        {
            return "YoungerThan18";
        }
        else if(years <=24) return "18to24";
        else if(years <= 34) return "25to34";
        else if(years <= 44) return "35to44";
        else if(years <= 54) return "45 to 54";
        else if(years <= 64) return "55 to 64";
        else return "OlderThan64";
    }




    function do_fb_result()
    {
        console.log("Doing fb result");
        var result=JSON.parse(GM_getValue("FB_result"));
        var x;
        for(x in result)
        {
            if(x!=="Languages")
            {
                document.getElementsByName(x)[0].value=result[x];
            }
        }
    }
    function do_fb_result2(result)
    {
        console.log("Doing fb result, result="+JSON.stringify(result));

        var i,j,x;
        for(x in result)
        {
            console.log("x="+x);
            if(x!=="Languages")
            {
                console.log("Trying to do this");
                document.getElementsByName(x)[0].value=result[x];
                console.log("Success");
            }
            else
            {
                var langs=result[x], lang_checkbox;
                for(i=0; i < langs.length; i++)
                {
                    lang_checkbox=document.getElementsByName("Languages");
                    for(j=0; j < lang_checkbox.length; j++)
                    {
                        console.log("langs[i]="+langs[i]+"\tlang_checkbox["+j+"]="+lang_checkbox[j].value);
                        if(langs[i]===lang_checkbox[j].value) lang_checkbox[i].checked=true;
                    }
                }

            }
            if(x==="Gender" || x==="Race" || x==="Age" || x==="Relationship" || x==="Religion")
            {
                var els=document.getElementsByName(x);
                for(i=0; i < els.length; i++)
                {
                    if(els[i].value===result[x]) els[i].checked=true;
                    else
                    {
                        console.log("els[i].value="+els[i].value);
                    }
                }
            }
        }
    }

    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={fb_url: wT.rows[0].cells[1].innerText};
GM_setValue("fb_result","");
        GM_addValueChangeListener("fb_result", do_fb_result);
        GM_xmlhttpRequest({
            method: 'GET',
            url:    my_query.fb_url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             do_facebook2(response, do_fb_result2);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });

        
      //  GM_setValue("fb_url",my_query.fb_url);
    /*    const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(resolve, reject);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/





    }

    function do_facebook2(response, callback)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                console.log("Do facebook");
        var result={UserName:"",Gender:"DontKnow", Age:"DontKnow", CurrentLocation:"NA", HomeLocation:"NA",
                   Languages: ["DontKnow"], Relationship: "DontKnow", Religion: "DontKnow"};
        var basic_info=doc.getElementById("basic-info");
        var relationship=doc.getElementById("relationship");
        var living=doc.getElementById("living");
        var work=doc.getElementById("work");
        var br=doc.getElementsByClassName("br"); /* Name */
        var dn=doc.getElementsByClassName("dn");
        var di=doc.getElementsByClassName("di"); /* divs containing table stuff */
        var curr_tables;
        var i,j;
        var birth_date;
        if(br.length>0) result.UserName=br[0].innerText;
        if(work!==null && work!==undefined)
        {
            console.log("Fuck work isn't automatable");
            //result.returnHit=true;
            //GM_setValue("returnHit",true);
            //return;
        }
        if(basic_info!==null && basic_info!==undefined)
        {
            /* Grab the basic info */
            curr_tables=basic_info.getElementsByTagName("table");
            for(i=0; i < curr_tables.length; i++)
            {
                if(curr_tables[i].rows.length>0)
                {
                    if(curr_tables[i].rows[0].cells[0].innerText==="Gender" &&
                      (curr_tables[i].rows[0].cells[1].innerText==="Male" || curr_tables[i].rows[0].cells[1].innerText==="Female"))
                    {
                        result.Gender=curr_tables[i].rows[0].cells[1].innerText;
                    }
                    if(curr_tables[i].rows[0].cells[0].innerText==="Birthday")
                    {
                        birth_date=curr_tables[i].rows[0].cells[1].innerText;
                        result.Age=getAgeRange(new Date(birth_date));

                    }
                    if(curr_tables[i].rows[0].cells[0].innerText==="Languages")
                    {
                        result.Languages=[];
                        var the_langs=curr_tables[i].rows[0].cells[1].innerText.toLowerCase();
                        for(j=0; j < language_list.length; j++)
                        {
                            if(the_langs.indexOf(language_list[j].toLowerCase())!==-1)
                            {
                                result.Languages.push(language_list[j]);
                            }
                        }
                        if(result.Languages.length===0) result.Languages.push("DontKnow");

                    }

                }
            }

        }
        if(living!==null && living!==undefined)
        {
            /* Grab the basic info */
            curr_tables=living.getElementsByTagName("table");
            for(i=0; i < curr_tables.length; i++)
            {
                if(curr_tables[i].rows.length>0)
                {
                    if(curr_tables[i].rows[0].cells[0].innerText==="Current City")
                    {
                        result.CurrentLocation=curr_tables[i].rows[0].cells[1].innerText;
                    }
                    if(curr_tables[i].rows[0].cells[0].innerText==="Hometown")
                    {
                        result.HomeLocation=curr_tables[i].rows[0].cells[1].innerText;
                    }

                }
            }
        }
        if(relationship!==null && relationship!==undefined)
        {
            var status="DontKnow";
            try
            {
                status=relationship.firstChild.firstChild.nextElementSibling.innerText.toLowerCase();
                if(status.indexOf("single")!==-1) result.Relationship="Single";
                else if(status.indexOf("in a relationship")!==-1) result.Relationship="InaRelationship";
                else if(status.indexOf("engaged")!==-1) result.Relationship="Engaged";
                else if(status.indexOf("married")!==-1) result.Relationship="Married";
                 else if(status.indexOf("widowed")!==-1) result.Relationship="Widowed";
                else result.Relationship="Other";
            }
            catch(error) { console.log("Error parsing relationship"); }

        }
        callback(result);
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
    else if(window.location.href.indexOf("mbasic.facebook.com")!==-1)
    {
        GM_setValue("fb_url","");
        GM_addValueChangeListener("fb_url", function() {
            window.location.href=GM_getValue("fb_url");
        });
        console.log("HI here");
        setTimeout(do_facebook,2000);
    }
    else
    {
	/* Should be MTurk itself */
       
        if(automate)
        {
            setTimeout(function() { btns_secondary[0].click(); }, 20000); }
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    if(automate) {
                        setTimeout(function() { btns_secondary[0].click(); }, 0); }
                }
            });
         /* Regular window at mturk */
        var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
               btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(automate) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            console.log("MOO");
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();